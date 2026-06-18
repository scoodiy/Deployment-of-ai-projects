"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function QrCodeTool() {
  const [text, setText] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const generate = () => {
    if (!text.trim()) return;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="输入文本或链接..." className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400" />
        <button onClick={generate} disabled={!text.trim()}
          className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-40 transition-all active:scale-95">生成</button>
      </div>
      {qrUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/60 dark:bg-slate-700/60">
          <img src={qrUrl} alt="QR Code" className="rounded-lg shadow-lg" width={200} height={200} />
          <a href={qrUrl} download="qrcode.png" target="_blank"
            className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold">下载二维码</a>
        </motion.div>
      )}
    </motion.div>
  );
}
