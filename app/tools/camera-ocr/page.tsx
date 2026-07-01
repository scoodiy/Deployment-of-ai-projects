import { Metadata } from 'next';
import CameraOcrPageClient from './CameraOcrPageClient';

export const metadata: Metadata = {
  title: '拍照识图翻译 | y悠悠',
  description: '使用摄像头拍照，AI 自动识别图中文字并翻译',
};

export default function CameraOcrPage() {
  return <CameraOcrPageClient />;
}
