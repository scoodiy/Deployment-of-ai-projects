import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/user';
import { checkRateLimit, getClientIp, trackFailure, resetFailures, getFailureBlockedUntil } from '@/lib/rate-limit';
import { getDb } from '@/lib/db';
import { getSiteConfig } from '@/lib/site-config';

type OpenAIChatResponse = {
  choices?: Array<{
    message?: { content?: string };
    text?: string;
  }>;
  error?: { message?: string } | string;
};

function resolveChatEndpoint(apiUrl: string) {
  const clean = apiUrl.trim().replace(/\/+$/, '');
  if (!clean) return 'https://text.pollinations.ai/openai';
  if (clean.endsWith('/openai') || clean.endsWith('/chat/completions')) return clean;
  return `${clean}/chat/completions`;
}

function toNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'development') {
    console.log("🚀 [1/5] 路由进入：开始对接 AI 猫猫助理");
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

    const config = getSiteConfig();
    const apiKey = (config.ai_api_key || process.env.OPENAI_API_KEY || '').trim();
    const modelId = (config.ai_model_id || 'openai').trim();
    const url = resolveChatEndpoint(config.ai_api_url);
    const maxTokens = toNumber(config.ai_max_output_tokens, 150, 16, 1000);
    const temperature = toNumber(config.ai_temperature, 0.85, 0, 2);
    const systemPrompt = (config.ai_system_prompt || '').trim();

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [2/5] 正在呼叫模型: ${modelId}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: message },
        ],
        max_tokens: maxTokens,
        temperature,
      })
    });

    const data = await response.json() as OpenAIChatResponse;

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error("🚨 AI 服务拒绝了请求:", JSON.stringify(data));
      }
      const isBlocked = trackFailure(`aiFail:${ip}`, 5 * 60 * 1000, 3);
      return new Response(JSON.stringify({
        error: isBlocked ? `连续失败次数过多，请5分钟后再试` : `模型拒绝访问: ${response.status}`,
        details: typeof data.error === 'string' ? data.error : data.error?.message || "未知错误"
      }), { status: response.status });
    }

    resetFailures(`aiFail:${ip}`);

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ [3/5] AI 服务成功响应");
    }
    const reply = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "本喵现在不想理你喵...";

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
    } catch (e) {
      console.error('AI usage log insert error:', e);
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
  const config = getSiteConfig();
  return new Response(JSON.stringify({
    status: "Ready",
    model: config.ai_model_id || "openai",
    endpoint: resolveChatEndpoint(config.ai_api_url),
  }), { status: 200 });
}
