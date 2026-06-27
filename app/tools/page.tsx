import { siteConfig } from '../../siteConfig';
import ToolsClient from './ToolsClient';

export const metadata = {
  title: "工具箱 | " + siteConfig.title,
  description: "实用工具、效率提升、小游戏合集",
};

export default function ToolsPage() {
  return <ToolsClient />;
}
