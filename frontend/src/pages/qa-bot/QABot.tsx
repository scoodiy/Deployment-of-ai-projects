import { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Send, Bot, User, BookOpen, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: number;
  timestamp: Date;
}

const quickQuestions = [
  '什么是网格交易策略？',
  '如何控制交易风险？',
  'K线图怎么看？',
  '马丁格尔策略的优缺点？',
];

const mockResponses: Record<string, { answer: string; sources: string[]; confidence: number }> = {
  '什么是网格交易策略？': {
    answer: '网格交易策略是一种在设定的价格区间内，按固定间隔设置买入和卖出订单的量化策略。\n\n核心原理：\n1. 设定价格上下限（如 BTC $60,000-$70,000）\n2. 将区间分为若干网格（如10个）\n3. 价格每触及一个网格线，自动执行买入或卖出\n4. 适合震荡市场，通过频繁的小额交易获利\n\n优点：自动化程度高，适合震荡行情\n缺点：趋势行情中可能造成较大亏损',
    sources: ['strategy_guide.md', 'grid_trading.pdf'],
    confidence: 0.92,
  },
  '如何控制交易风险？': {
    answer: '风险管理是量化交易的核心，主要包括以下几点：\n\n1. 仓位管理：单笔交易风险不超过总资金的2%\n2. 止损设置：每笔交易设置止损点位\n3. 最大回撤控制：监控并限制最大回撤不超过20%\n4. 连续亏损保护：连续亏损超过5次自动暂停交易\n5. 分散投资：不要把所有资金放在一个策略或品种上',
    sources: ['risk_management.md'],
    confidence: 0.88,
  },
};

export function QABot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const question = text || input;
    if (!question.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = mockResponses[question] || {
        answer: `关于「${question}」：这是一个很好的问题。建议您查看我们的知识库获取详细信息，或使用更具体的关键词进行提问。`,
        sources: ['faq.md'],
        confidence: 0.65,
      };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-4">智能问答</h1>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-16 w-16 text-primary-500 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">量化交易智能助手</h3>
              <p className="text-sm text-gray-500 mb-6">我可以回答关于交易策略、风险管理和市场分析的问题</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left p-3 rounded-lg bg-dark-surface border border-dark-border hover:border-primary-500/50 text-sm text-gray-300 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={clsx(
                'max-w-[70%] rounded-2xl px-4 py-3',
                msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-dark-surface text-gray-200'
              )}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dark-border flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{msg.sources.join(', ')}</span>
                    {msg.confidence && (
                      <span className="text-xs text-gray-600 ml-auto">置信度: {(msg.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-dark-surface flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-dark-surface rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-400">思考中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-border">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的问题..."
              className="flex-1 bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
