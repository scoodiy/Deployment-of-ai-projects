"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

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

function stopStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export default function CameraOcrTool() {
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

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
  }, [stream]);

  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(ms);
      setState('camera');
    } catch {
      setError('无法打开摄像头，请检查浏览器权限设置');
      setState('error');
    }
  }, []);

  // 将 MediaStream 绑定到 video 元素
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {
        // autoplay 被浏览器阻止，用户需要交互后才能播放
      });
    }
  }, [stream]);

  const closeCamera = useCallback(() => {
    stopStream(stream);
    setStream(null);
    setState('idle');
  }, [stream]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
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
    if (!photoDataUrl) return;
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
    }
  }, [photoDataUrl, selection, photoNaturalSize, sourceLang, targetLang]);

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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* 语言选择 - 始终可见 */}
      {state !== 'camera' && (
        <div className="flex gap-2 items-center">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            源语言
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className={`text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 transition-all ${selectBg(sourceLang !== 'auto')}`}
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
            className="text-xs px-2 py-1.5 rounded-lg bg-white/50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-400 transition-all"
          >
            {TARGET_LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 状态: idle */}
      {state === 'idle' && (
        <button
          onClick={openCamera}
          className="w-full py-3 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          打开摄像头
        </button>
      )}

      {/* 状态: camera */}
      {state === 'camera' && (
        <div className="flex flex-col gap-2">
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={takePhoto}
              className="flex-1 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all"
            >
              拍照
            </button>
            <button
              onClick={closeCamera}
              className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 状态: photo - 选区 */}
      {state === 'photo' && photoDataUrl && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            拖拽框选要识别的区域（可选），不选则识别整张图片
          </p>
          <div ref={photoRef} className="relative select-none touch-none">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative rounded-xl overflow-hidden cursor-crosshair bg-slate-200 dark:bg-slate-700 shadow-md"
              style={{ touchAction: 'none' }}
            >
              <img
                src={photoDataUrl}
                alt="拍照结果"
                className="w-full block"
                draggable={false}
              />
              {/* 半透明遮罩 */}
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
              {/* 已确认的选区 */}
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
          <div className="flex gap-2">
            <button
              onClick={handleRecognize}
              className="flex-1 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-40"
            >
              {selection ? '识别选中区域' : '识别整张图片'}
            </button>
            <button
              onClick={() => {
                setSelection(null);
                setIsDrawing(false);
                setDrawStart(null);
                setDrawCurrent(null);
              }}
              className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
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
              className="px-3 py-2.5 text-xs text-red-500 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
            >
              重拍
            </button>
          </div>
        </div>
      )}

      {/* 状态: recognizing */}
      {state === 'recognizing' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-200 dark:border-indigo-800" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">识别中...</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">正在调用 AI 识别文字并翻译</p>
        </div>
      )}

      {/* 状态: done */}
      {state === 'done' && result && (
        <div className="flex flex-col gap-3">
          {/* 原文 */}
          {result.text ? (
            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200/50 dark:border-slate-600/50">
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
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 text-center">
              <p className="text-xs text-amber-600 dark:text-amber-400">图片中未识别到文字</p>
            </div>
          )}

          {/* 翻译 */}
          {result.translation && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-400 uppercase tracking-wider">
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                setResult(null);
                setError(null);
                setState('idle');
                setPhotoDataUrl(null);
                setPhotoNaturalSize(null);
                setSelection(null);
              }}
              className="flex-1 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all"
            >
              识别新图片
            </button>
          </div>
        </div>
      )}

      {/* 状态: error */}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="p-4 rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/30 w-full text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  if (photoDataUrl) {
                    setState('photo');
                  } else {
                    setState('idle');
                    openCamera();
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 active:scale-95 transition-all"
              >
                重试
              </button>
              <button
                onClick={() => {
                  reset();
                  setState('idle');
                }}
                className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提示 */}
      {state === 'idle' && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          使用后置摄像头拍照，AI 将识别图中的文字并翻译为目标语言。
          <br />
          支持手动框选区域进行精准识别。
        </p>
      )}
    </motion.div>
  );
}
