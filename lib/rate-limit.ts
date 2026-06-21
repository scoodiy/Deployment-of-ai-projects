/**
 * API 限流中间件
 * 基于内存的滑动窗口限流（可扩展为Redis）
 * 
 * 规则：
 * - 登录接口：同IP每分钟最多5次
 * - 注册接口：同IP每小时最多5次
 * - 评论接口：同用户每分钟最多3次
 * - AI调用接口：同用户每日限制+每分钟限制
 * - 上传接口：同用户每天最多10次
 * - 游戏分数：同用户每分钟最多10次
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储（生产环境可替换为Redis）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
  errorMessage: string;
}

export const RATE_LIMITS = {
  login: {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: 'rl:login',
    errorMessage: '登录尝试过多，请1分钟后再试',
  },
  register: {
    maxRequests: 5,
    windowSeconds: 3600,
    keyPrefix: 'rl:reg',
    errorMessage: '注册操作过于频繁，请1小时后再试',
  },
  sendCode: {
    maxRequests: 3,
    windowSeconds: 60,
    keyPrefix: 'rl:code',
    errorMessage: '验证码发送过于频繁，请稍后再试',
  },
  reset_password: {
    maxRequests: 5,
    windowSeconds: 300,
    keyPrefix: 'rl:reset',
    errorMessage: '密码重置请求过于频繁，请5分钟后再试',
  },
  comment: {
    maxRequests: 3,
    windowSeconds: 60,
    keyPrefix: 'rl:comment',
    errorMessage: '评论过于频繁，请稍后再试',
  },
  aiCall: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'rl:ai:minute',
    errorMessage: 'AI调用过于频繁，请稍后再试',
  },
  aiDaily: {
    maxRequests: 50,
    windowSeconds: 86400,
    keyPrefix: 'rl:ai:daily',
    errorMessage: '今日AI调用次数已用完',
  },
  upload: {
    maxRequests: 10,
    windowSeconds: 86400,
    keyPrefix: 'rl:upload',
    errorMessage: '今日上传次数已达上限',
  },
  gameScore: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'rl:game',
    errorMessage: '提交过于频繁，请稍后再试',
  },
  global: {
    maxRequests: 120,
    windowSeconds: 60,
    keyPrefix: 'rl:global',
    errorMessage: '请求过于频繁，请稍后再试',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * 检查限流
 * @returns { limited: boolean, retryAfter?: number, message?: string }
 */
export function checkRateLimit(
  type: RateLimitType,
  identifier: string,
  customLimit?: Partial<RateLimitConfig>
): { limited: boolean; retryAfter?: number; message?: string } {
  const config = { ...RATE_LIMITS[type], ...customLimit };
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime <= now) {
    // 新窗口
    entry = {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    };
    rateLimitStore.set(key, entry);
    return { limited: false };
  }
  
  entry.count++;
  
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      limited: true,
      retryAfter,
      message: `${config.errorMessage}（${retryAfter}秒后重试）`,
    };
  }
  
  return { limited: false };
}

/**
 * 获取客户端IP
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Express/Next.js 中间件式限流检查
 * 在API路由开头调用
 */
export function rateLimitMiddleware(
  type: RateLimitType,
  request: Request,
  userIdentifier?: string
): { blocked: boolean; response?: Response } {
  const ip = getClientIp(request);
  const identifier = userIdentifier || ip;
  
  // 全局IP限流
  const globalCheck = checkRateLimit('global', ip);
  if (globalCheck.limited) {
    return {
      blocked: true,
      response: new Response(
        JSON.stringify({ error: globalCheck.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(globalCheck.retryAfter),
          },
        }
      ),
    };
  }
  
  // 特定接口限流
  const check = checkRateLimit(type, identifier);
  if (check.limited) {
    return {
      blocked: true,
      response: new Response(
        JSON.stringify({ error: check.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(check.retryAfter),
          },
        }
      ),
    };
  }
  
  return { blocked: false };
}
