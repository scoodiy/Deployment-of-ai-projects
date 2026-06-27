"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

const EXAMPLE_QUESTIONS = [
  "给我讲个冷笑话",
  "推荐一首好听的歌",
  "今天适合做什么？",
  "聊聊分子动力学模拟",
];

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || '请求失败');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || '抱歉，我没有理解你的意思。',
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-3xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 relative z-10 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

          {/* 标题 */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-3">
              <Sparkles className="text-indigo-500" size={32} />
              AI 助手
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">智能对话，随时为你解答</p>
          </div>

          {/* 对话区域 */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                  <Bot size={40} className="text-white" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-center font-medium">
                  你好！我是煤球，一只傲娇的暹罗猫 🐱<br />
                  有什么想聊的尽管问我吧~
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => sendMessage(q)}
                      className="text-left text-sm px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-tr-md'
                      : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-md'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10">
                  <Loader2 size={18} className="animate-spin text-indigo-500" />
                </div>
              </motion.div>
            )}

            {error && (
              <div className="text-center text-sm text-red-500 bg-red-500/10 rounded-2xl py-3 px-4">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题..."
              disabled={isLoading}
              className="flex-1 px-5 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </PageTransition>
    </div>
  );
}
