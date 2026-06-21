import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendVerificationEmail(to: string, code: string, type: 'register' | 'reset_password'): Promise<boolean> {
  try {
    const subject = type === 'register' ? '【y悠悠】注册验证码' : '【y悠悠】密码重置验证码';
    const action = type === 'register' ? '注册账号' : '重置密码';

    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
        <h2 style="color: #6366f1;">y悠悠の宝藏之地</h2>
        <p>您正在进行${action}操作，验证码为：</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">验证码 10 分钟内有效，请勿泄露给他人。</p>
        <p style="color: #9ca3af; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"y悠悠" <${process.env.SMTP_USER || ''}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
