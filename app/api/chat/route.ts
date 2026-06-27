import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/user';
import { checkRateLimit, getClientIp, trackFailure, resetFailures, getFailureBlockedUntil } from '@/lib/rate-limit';
import { getDb } from '@/lib/db';
import { siteConfig } from '../../../siteConfig';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'development') {
    console.log("🚀 [1/5] 路由进入：开始对接 Gemini 3 脑回路");
  }

  try {
    const ip = getClientIp(req);

    const blockedUntil = getFailureBlockedUntil(`aiFail:${ip}`);
    if (blockedUntil) {
      const retryAfter = Math.ceil((blockedUntil - Date.now()) / 1000);
      return new Response(JSON.stringify({ error: `连续失败次数过多，请${retryAfter}秒后再试` }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
      });
    }

    const ipRateCheck = checkRateLimit('aiIpPerMinute', ip);
    if (ipRateCheck.limited) {
      return new Response(JSON.stringify({ error: ipRateCheck.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(ipRateCheck.retryAfter) },
      });
    }

    const userPayload = await getUserFromRequest(req);
    if (!userPayload) {
      return new Response(JSON.stringify({ error: "请先登录" }), { status: 401 });
    }
    const userId = Number(userPayload.userId);

    const dailyCheck = checkRateLimit('aiDaily', String(userId));
    if (dailyCheck.limited) {
      return new Response(JSON.stringify({ error: dailyCheck.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(dailyCheck.retryAfter) },
      });
    }

    const minuteCheck = checkRateLimit('aiCall', String(userId));
    if (minuteCheck.limited) {
      return new Response(JSON.stringify({ error: minuteCheck.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(minuteCheck.retryAfter) },
      });
    }

    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: "消息不能为空" }), { status: 400 });
    }
    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: "消息长度不能超过 2000 字符" }), { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '').trim();

    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ 找不到 API Key");
      }
      return new Response(JSON.stringify({ error: "Key missing" }), { status: 500 });
    }

    const modelId = siteConfig.geminiConfig.modelId;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [2/5] 正在呼叫模型: ${modelId}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: siteConfig.geminiConfig.systemPrompt
          }]
        },
        contents: [{
          parts: [{ text: message }]
        }],
        generationConfig: {
          maxOutputTokens: siteConfig.geminiConfig.maxOutputTokens,
          temperature: siteConfig.geminiConfig.temperature,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error("🚨 Gemini 3 拒绝了请求:", JSON.stringify(data));
      }
      const isBlocked = trackFailure(`aiFail:${ip}`, 5 * 60 * 1000, 3);
      return new Response(JSON.stringify({
        error: isBlocked ? `连续失败次数过多，请5分钟后再试` : `模型拒绝访问: ${response.status}`,
        details: data.error?.message || "未知错误"
      }), { status: response.status });
    }

    resetFailures(`aiFail:${ip}`);

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ [3/5] Google 成功响应");
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "本喵现在不想理你喵...";

    if (process.env.NODE_ENV === 'development') {
      console.log("🎉 [4/5] 回复已生成，准备传回前端");
    }

    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO ai_usage_logs (user_id, model, prompt, response_preview, tokens_used)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        modelId,
        message.length > 500 ? message.slice(0, 500) : message,
        reply.length > 500 ? reply.slice(0, 500) : reply,
        message.length + reply.length
      );
    } catch {
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error("🔥 [5/5] 运行时崩溃:", error instanceof Error ? error.message : error);
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? '服务器内部错误，请稍后重试' : (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Ready", model: "Gemini 3 Flash Preview" }), { status: 200 });
}
