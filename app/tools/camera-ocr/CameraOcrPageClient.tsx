"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type State = 'idle' | 'camera' | 'photo' | 'recognizing' | 'done' | 'error';

interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface OcrResult {
  text: string;
  translation: string;
}

const SOURCE_LANGS = [
  { value: 'auto', label: '自动检测' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
];

const TARGET_LANGS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
];

function compressImage(dataUrl: string, maxDim = 2048, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (Math.max(width, height) > maxDim) {
        const ratio = maxDim / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

function cropImage(
  dataUrl: string,
  selection: Selection,
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  displayWidth: number,
  displayHeight: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scaleX = imgNaturalWidth / displayWidth;
      const scaleY = imgNaturalHeight / displayHeight;
      const sx = Math.round(selection.x * scaleX);
      const sy = Math.round(selection.y * scaleY);
      const sw = Math.round(selection.w * scaleX);
      const sh = Math.round(selection.h * scaleY);

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = dataUrl;
  });
}

function inferImageMime(file: File): string {
  const explicitType = file.type.toLowerCase();
  if (explicitType.startsWith('image/')) return explicitType;

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'bmp') return 'image/bmp';
  if (extension === 'heic') return 'image/heic';
  if (extension === 'heif') return 'image/heif';
  return 'image/jpeg';
}

function isSupportedImageFile(file: File): boolean {
  if (file.type === '') return true;
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

function normalizeImageDataUrl(dataUrl: string, fallbackMime: string): string {
  if (dataUrl.startsWith('data:;base64,')) {
    return dataUrl.replace('data:;base64,', `data:${fallbackMime};base64,`);
  }
  if (dataUrl.startsWith('data:application/octet-stream;base64,')) {
    return dataUrl.replace('data:application/octet-stream;base64,', `data:${fallbackMime};base64,`);
  }
  return dataUrl;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(normalizeImageDataUrl(String(reader.result), inferImageMime(file)));
    reader.onerror = () => reject(new Error('读取图片失败，请重新选择'));
    reader.readAsDataURL(file);
  });
}

function getImageNaturalSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('图片预览失败，请换一张 JPG、PNG 或 WebP 图片'));
    img.src = dataUrl;
  });
}

function stopStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export default function CameraOcrPageClient() {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoNaturalSize, setPhotoNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [copied, setCopied] = useState<'text' | 'translation' | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoNeedsTap, setVideoNeedsTap] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add('camera-ocr-low-power');
    return () => {
      document.body.classList.remove('camera-ocr-low-power');
    };
  }, []);

  const reset = useCallback(() => {
    stopStream(stream);
    setStream(null);
    setPhotoDataUrl(null);
    setPhotoNaturalSize(null);
    setSelection(null);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setResult(null);
    setError(null);
    setCopied(null);
    setIsVideoReady(false);
    setVideoNeedsTap(false);
  }, [stream]);

  const openCamera = useCallback(async () => {
    setError(null);
    setIsVideoReady(false);
    setVideoNeedsTap(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前浏览器不支持摄像头调用');
      }

      let ms: MediaStream;
      try {
        ms = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch (primaryError) {
        console.warn('Rear camera constraints failed, falling back to default camera', primaryError);
        ms = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setStream(ms);
      setState('camera');
    } catch (cameraError) {
      console.error('Camera access failed', cameraError);
      setError('无法打开摄像头，请检查浏览器权限设置，或换用系统浏览器通过 HTTPS 访问');
      setState('error');
    }
  }, []);

  const startVideoPreview = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    try {
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      await video.play();
      setIsVideoReady(true);
      setVideoNeedsTap(false);
    } catch (previewError) {
      console.warn('Camera preview play failed', previewError);
      setIsVideoReady(false);
      setVideoNeedsTap(true);
    }
  }, [stream]);

  // 将 MediaStream 绑定到 video 元素，并在移动端浏览器阻止自动播放时给出可点击兜底。
  useEffect(() => {
    if (!videoRef.current || !stream) return;

    videoRef.current.srcObject = stream;
    const timer = window.setTimeout(() => {
      void startVideoPreview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [stream, startVideoPreview]);

  const closeCamera = useCallback(() => {
    stopStream(stream);
    setStream(null);
    setIsVideoReady(false);
    setVideoNeedsTap(false);
    setState('idle');
  }, [stream]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.videoWidth || !video.videoHeight) {
      setVideoNeedsTap(true);
      setError('摄像头画面还没有准备好，请稍等或点击激活预览后再拍照');
      void startVideoPreview();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopStream(stream);
    setStream(null);
    setPhotoDataUrl(dataUrl);
    setPhotoNaturalSize({ w: video.videoWidth, h: video.videoHeight });
    setSelection(null);
    setState('photo');
  }, [stream, startVideoPreview]);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!isSupportedImageFile(file)) {
        setError('请选择图片文件');
        setState('error');
        return;
      }

      try {
        setError(null);
        stopStream(stream);
        setStream(null);
        setIsVideoReady(false);
        setVideoNeedsTap(false);
        const dataUrl = await readImageFile(file);
        const size = await getImageNaturalSize(dataUrl);
        setPhotoDataUrl(dataUrl);
        setPhotoNaturalSize(size);
        setSelection(null);
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
        setResult(null);
        setCopied(null);
        setState('photo');
      } catch (fileError) {
        const message = fileError instanceof Error ? fileError.message : '图片读取失败，请重新选择';
        setError(message);
        setState('error');
      }
    },
    [stream]
  );

  const handleImageFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = '';
      if (file) {
        void handleImageFile(file);
      }
    },
    [handleImageFile]
  );

  const openNativeImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const retryNativePicker = useCallback(() => {
    setError(null);
    setState('idle');
    openNativeImagePicker();
  }, [openNativeImagePicker]);

  const handlePhotoPreviewError = useCallback(() => {
    stopStream(stream);
    setStream(null);
    setPhotoDataUrl(null);
    setPhotoNaturalSize(null);
    setSelection(null);
    setError('图片预览失败，请换一张 JPG、PNG 或 WebP 图片');
    setState('error');
  }, [stream]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const img = photoRef.current?.querySelector('img');
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setDrawStart(pos);
      setDrawCurrent(pos);
      setIsDrawing(true);
      setSelection(null);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || !drawStart) return;
      e.preventDefault();
      const img = photoRef.current?.querySelector('img');
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setDrawCurrent(pos);
    },
    [isDrawing, drawStart]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || !drawStart) return;
      e.preventDefault();
      const img = photoRef.current?.querySelector('img');
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const endPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      const x = Math.min(drawStart.x, endPos.x);
      const y = Math.min(drawStart.y, endPos.y);
      const w = Math.abs(endPos.x - drawStart.x);
      const h = Math.abs(endPos.y - drawStart.y);

      if (w > 15 && h > 15) {
        setSelection({ x, y, w, h });
      }
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
    },
    [isDrawing, drawStart]
  );

  const handleRecognize = useCallback(async () => {
    if (isRecognizing) return;
    if (!photoDataUrl) return;
    setIsRecognizing(true);
    setState('recognizing');
    setError(null);

    try {
      let finalDataUrl: string;
      const imgEl = photoRef.current?.querySelector('img');
      if (selection && photoNaturalSize && imgEl) {
        const rect = imgEl.getBoundingClientRect();
        finalDataUrl = await compressImage(
          await cropImage(photoDataUrl, selection, photoNaturalSize.w, photoNaturalSize.h, rect.width, rect.height),
          2048,
          0.8
        );
      } else {
        finalDataUrl = await compressImage(photoDataUrl, 2048, 0.8);
      }

      const base64 = finalDataUrl.replace(/^data:image\/\w+;base64,/, '');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);

      const res = await fetch('/api/camera-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, sourceLang, targetLang }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '识别失败');
      }

      setResult({ text: data.text || '', translation: data.translation || '' });
      setState('done');
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === 'AbortError'
          ? '请求超时，请重试'
          : err instanceof Error
          ? err.message
          : '识别失败，请重试';
      setError(msg);
      setState('error');
    } finally {
      setIsRecognizing(false);
    }
  }, [photoDataUrl, selection, photoNaturalSize, sourceLang, targetLang, isRecognizing]);

  const copyText = useCallback(async (text: string, kind: 'text' | 'translation') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const selectBg = (active: boolean) =>
    active
      ? 'bg-indigo-500 text-white shadow-md'
      : 'bg-white/50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600';

  return (
    <div className="min-h-[100svh] overflow-y-auto bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold">返回工具箱</span>
          </button>
          <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            📸 拍照识图
          </h1>
          <div className="w-20" /> {/* 占位保持居中 */}
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />

        {/* 语言选择 */}
        <div className="mb-4">
          <div className="flex gap-2 items-center">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
              源语言
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className={`text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${selectBg(sourceLang !== 'auto')}`}
            >
              {SOURCE_LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="text-slate-400 text-xs">→</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg bg-white/50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            >
              {TARGET_LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* 状态: idle */}
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-6 py-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl">
                📸
              </div>
              <div className="text-center">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">拍照识图翻译</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  拍摄图片中的文字，AI 自动识别并翻译成目标语言。
                  <br />支持手动框选区域精准识别。
                </p>
              </div>
              <button
                onClick={openNativeImagePicker}
                className="md:hidden w-full max-w-sm py-4 bg-indigo-500 text-white text-base font-bold rounded-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25"
              >
                使用系统相机/相册
              </button>
              <button
                onClick={openCamera}
                className="hidden md:flex w-full max-w-sm py-4 bg-indigo-500 text-white text-base font-bold rounded-2xl hover:bg-indigo-600 active:scale-95 transition-all items-center justify-center gap-3 shadow-lg shadow-indigo-500/25"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                打开摄像头
              </button>
              <button
                onClick={openNativeImagePicker}
                className="hidden md:block w-full max-w-sm py-3.5 rounded-2xl border border-slate-200 bg-white/70 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
              >
                使用系统相机/相册
              </button>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-xs">
                将在全屏模式下使用后置摄像头。
                <br />请允许浏览器摄像头权限。
              </p>
            </motion.div>
          )}

          {/* 状态: camera */}
          {state === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => void startVideoPreview()}
                  onCanPlay={() => setIsVideoReady(true)}
                  onPlaying={() => setIsVideoReady(true)}
                  className="w-full h-full object-cover"
                />
                {/* 拍摄指引线 */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[80%] h-[70%] border-2 border-white/30 rounded-lg border-dashed" />
                </div>
                {!isVideoReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 px-6 text-center">
                    <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <p className="text-xs text-white/80">
                      {videoNeedsTap ? '浏览器需要手动激活摄像头预览' : '正在启动摄像头预览...'}
                    </p>
                    <button
                      type="button"
                      onClick={openNativeImagePicker}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur active:scale-95 transition-transform"
                    >
                      使用系统相机/相册
                    </button>
                    {videoNeedsTap && (
                      <button
                        type="button"
                        onClick={() => void startVideoPreview()}
                        className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-lg active:scale-95 transition-transform"
                      >
                        点击激活预览
                      </button>
                    )}
                  </div>
                )}
              </div>
              {error && (videoNeedsTap || !isVideoReady) && (
                <p className="rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                  {error}。请先等预览画面出现，再点击拍照。
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={takePhoto}
                  disabled={!isVideoReady}
                  className="flex-1 py-3.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                  </svg>
                  {isVideoReady ? '拍照' : '请先等预览画面出现'}
                </button>
                <button
                  onClick={closeCamera}
                  className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          )}

          {/* 状态: photo */}
          {state === 'photo' && photoDataUrl && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3"
            >
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                拖拽框选要识别的区域（可选），不选则识别整张图片
              </p>
              <div ref={photoRef} className="relative max-h-[52svh] overflow-y-auto select-none touch-none rounded-2xl">
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="relative rounded-2xl overflow-hidden cursor-crosshair bg-slate-200 dark:bg-slate-700 shadow-xl"
                  style={{ touchAction: 'none' }}
                >
                  <img
                    src={photoDataUrl}
                    alt="拍照结果"
                    className="w-full block"
                    draggable={false}
                    onError={handlePhotoPreviewError}
                  />
                  {/* 绘制中遮罩 */}
                  {isDrawing && drawStart && drawCurrent && (
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <mask id="selection-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            <rect
                              x={Math.min(drawStart.x, drawCurrent.x)}
                              y={Math.min(drawStart.y, drawCurrent.y)}
                              width={Math.abs(drawCurrent.x - drawStart.x)}
                              height={Math.abs(drawCurrent.y - drawStart.y)}
                              fill="black"
                            />
                          </mask>
                        </defs>
                        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#selection-mask)" />
                        <rect
                          x={Math.min(drawStart.x, drawCurrent.x)}
                          y={Math.min(drawStart.y, drawCurrent.y)}
                          width={Math.abs(drawCurrent.x - drawStart.x)}
                          height={Math.abs(drawCurrent.y - drawStart.y)}
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeDasharray="6 3"
                        />
                      </svg>
                    </div>
                  )}
                  {/* 已确认选区 */}
                  {!isDrawing && selection && (
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <mask id="confirmed-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            <rect x={selection.x} y={selection.y} width={selection.w} height={selection.h} fill="black" />
                          </mask>
                        </defs>
                        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#confirmed-mask)" />
                        <rect
                          x={selection.x}
                          y={selection.y}
                          width={selection.w}
                          height={selection.h}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2"
                        />
                      </svg>
                      <div
                        className="absolute bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          left: selection.x + selection.w + 4,
                          top: Math.max(0, selection.y - 2),
                        }}
                      >
                        {selection.w}×{selection.h}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="sticky bottom-0 z-40 -mx-4 flex gap-2 border-t border-slate-200/60 bg-slate-50/95 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-950/95">
                <button
                  onClick={handleRecognize}
                  disabled={isRecognizing}
                  className="flex-1 py-3.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-40 shadow-md"
                >
                  {isRecognizing ? '识别中...' : selection ? '识别选中区域' : '识别整张图片'}
                </button>
                <button
                  onClick={() => {
                    setSelection(null);
                    setIsDrawing(false);
                    setDrawStart(null);
                    setDrawCurrent(null);
                  }}
                  className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
                >
                  重选
                </button>
                <button
                  onClick={() => {
                    setState('idle');
                    setPhotoDataUrl(null);
                    setPhotoNaturalSize(null);
                    setSelection(null);
                  }}
                  className="px-4 py-3.5 text-xs text-red-500 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                >
                  重拍
                </button>
              </div>
            </motion.div>
          )}

          {/* 状态: recognizing */}
          {state === 'recognizing' && (
            <motion.div
              key="recognizing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-200 dark:border-indigo-800" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-700 dark:text-slate-200">识别中...</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">正在调用 AI 识别文字并翻译</p>
              </div>
            </motion.div>
          )}

          {/* 状态: done */}
          {state === 'done' && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {/* 原文 */}
              {result.text ? (
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      原文
                    </span>
                    <button
                      onClick={() => copyText(result.text, 'text')}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'text' ? '已复制 ✓' : '复制'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {result.text}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 text-center">
                  <p className="text-xs text-amber-600 dark:text-amber-400">图片中未识别到文字</p>
                </div>
              )}

              {/* 翻译 */}
              {result.translation && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-700/30 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      翻译
                    </span>
                    <button
                      onClick={() => copyText(result.translation, 'translation')}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'translation' ? '已复制 ✓' : '复制'}
                    </button>
                  </div>
                  <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
                    {result.translation}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setState('idle');
                  setPhotoDataUrl(null);
                  setPhotoNaturalSize(null);
                  setSelection(null);
                }}
                className="w-full py-3.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                📸 识别新图片
              </button>
            </motion.div>
          )}

          {/* 状态: error */}
          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="p-5 rounded-2xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 w-full text-center">
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={retryNativePicker}
                    className="px-6 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 active:scale-95 transition-all"
                  >
                    重新选择
                  </button>
                  <button
                    onClick={() => {
                      reset();
                      setState('idle');
                    }}
                    className="px-6 py-2.5 text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
