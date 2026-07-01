import { NextResponse } from 'next/server';

// ========== 阿里云 OCR ==========
const ALIYUN_OCR_URL = 'https://gjbsb.market.alicloudapi.com/ocrservice/advanced';
const ALIYUN_OCR_APPCODE = process.env.ALIYUN_OCR_APPCODE || '';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB base64 → ~3.75MB binary

// ========== DeepSeek 翻译 ==========
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

const LANG_NAMES: Record<string, string> = {
  zh: '简体中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  ru: 'Русский',
};

async function callAliyunOCR(image: string): Promise<string> {
  const response = await fetch(ALIYUN_OCR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `APPCODE ${ALIYUN_OCR_APPCODE}`,
    },
    body: JSON.stringify({ img: image }),
  });

  if (!response.ok) {
    throw new Error(`OCR 失败 (${response.status})`);
  }

  const data = await response.json();
  if (data.error_code) {
    throw new Error(`OCR 错误: ${data.error_msg || data.error_code}`);
  }

  // 返回识别出的文字内容
  return data.content || '';
}

async function callDeepSeekTranslate(
  text: string,
  targetLang: string
): Promise<string> {
  const langName = LANG_NAMES[targetLang] || targetLang;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `你是一个翻译专家。请将用户提供的文字翻译成${langName}。要求：翻译要准确、自然、流畅，保持原文的段落和换行结构。请直接返回翻译结果，不要解释。`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`翻译失败 (${response.status})`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, targetLang } = body;

    // 校验图片
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 });
    }

    if (!targetLang || typeof targetLang !== 'string') {
      return NextResponse.json({ error: '缺少目标语言' }, { status: 400 });
    }

    // 校验 base64 大小
    const estimatedBytes = Math.ceil(image.length * 0.75);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: '图片过大，请压缩后重试（最大 5MB）' }, { status: 400 });
    }

    // Step 1: 阿里云 OCR 识别
    let ocrText = '';
    try {
      ocrText = await callAliyunOCR(image);
      if (!ocrText.trim()) {
        return NextResponse.json({ error: '未能识别到图片中的文字' }, { status: 400 });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OCR 识别失败';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Step 2: DeepSeek 翻译整理
    let translation = '';
    try {
      translation = await callDeepSeekTranslate(ocrText, targetLang);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '翻译失败';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      text: ocrText,
      translation,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 504 });
    }

    const message = error instanceof Error ? error.message : '服务器内部错误';
    console.error('Camera OCR error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? '服务器内部错误，请稍后重试' : message },
      { status: 500 }
    );
  }
}
