export default function Disclaimer() {
  return (
    <footer className="mt-8 py-4 border-t border-gray-200 text-center text-xs md:text-sm text-gray-400">
      <p>本网站仅用于股票数据分析、策略研究和回测展示，不构成任何投资建议，不提供自动交易或委托下单服务。</p>
      <p className="mt-1">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          鄂ICP备2026025861号
        </a>
      </p>
    </footer>
  )
}
