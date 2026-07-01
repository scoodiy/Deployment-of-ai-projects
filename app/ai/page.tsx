import { siteConfig } from '../../siteConfig';
import AiClient from './AiClient';

export const metadata = {
  title: "AI助手 | " + siteConfig.title,
  description: "智能AI对话助手，陪你聊天解惑",
};

export default async function AiPage() {
  return <AiClient />;
}
