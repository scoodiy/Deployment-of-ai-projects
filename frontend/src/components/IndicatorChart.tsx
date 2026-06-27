import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { IndicatorData, KlineData } from '../types'
import { useWindowSize } from '../hooks/useWindowSize'

interface Props {
  kline: KlineData[]
  indicators: IndicatorData[]
  height?: number
}

type TabKey = 'ma' | 'macd' | 'kdj' | 'rsi' | 'boll'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ma', label: '均线' },
  { key: 'macd', label: 'MACD' },
  { key: 'kdj', label: 'KDJ' },
  { key: 'rsi', label: 'RSI' },
  { key: 'boll', label: 'BOLL' },
]

export default function IndicatorChart({ kline, indicators, height }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)
  const tabRef = useRef<TabKey>('ma')
  const { width } = useWindowSize()

  const resolvedHeight = height ?? (width < 640 ? 280 : 400)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current)
    instanceRef.current = chart

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    renderChart()
  }, [kline, indicators])

  function renderChart() {
    const chart = instanceRef.current
    if (!chart || !kline.length || !indicators.length) return

    const dates = indicators.map((d) => d.trade_date)
    const tab = tabRef.current
    const isMobile = width < 640

    const baseOption: echarts.EChartsOption = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151', fontSize: 12 },
      },
      legend: {
        top: 5,
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      grid: { left: '8%', right: '3%', top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLine: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
      },
      dataZoom: [
        { type: 'inside', start: Math.max(0, 100 - (120 / dates.length) * 100), end: 100 },
        {
          type: 'slider', bottom: 5, height: isMobile ? 30 : 20,
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(59,130,246,0.1)',
          handleStyle: { color: '#3b82f6' },
        },
      ],
    }

    let series: any[] = []

    if (tab === 'ma') {
      const closePrices = kline.map((d) => d.close)
      series = [
        { name: '收盘价', type: 'line', data: closePrices, symbol: 'none', lineStyle: { width: 1, color: '#374151' } },
        { name: 'MA5', type: 'line', data: indicators.map((d) => d.ma5), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'MA10', type: 'line', data: indicators.map((d) => d.ma10), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'MA20', type: 'line', data: indicators.map((d) => d.ma20), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'MA60', type: 'line', data: indicators.map((d) => d.ma60), symbol: 'none', lineStyle: { width: 1 } },
      ]
    } else if (tab === 'macd') {
      series = [
        { name: 'DIF', type: 'line', data: indicators.map((d) => d.macd_dif), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'DEA', type: 'line', data: indicators.map((d) => d.macd_dea), symbol: 'none', lineStyle: { width: 1 } },
        {
          name: 'MACD', type: 'bar',
          data: indicators.map((d) => ({
            value: d.macd_hist,
            itemStyle: { color: (d.macd_hist ?? 0) >= 0 ? '#ef4444' : '#22c55e' },
          })),
        },
      ]
    } else if (tab === 'kdj') {
      series = [
        { name: 'K', type: 'line', data: indicators.map((d) => d.kdj_k), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'D', type: 'line', data: indicators.map((d) => d.kdj_d), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'J', type: 'line', data: indicators.map((d) => d.kdj_j), symbol: 'none', lineStyle: { width: 1 } },
      ]
    } else if (tab === 'rsi') {
      series = [
        { name: 'RSI6', type: 'line', data: indicators.map((d) => d.rsi6), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'RSI12', type: 'line', data: indicators.map((d) => d.rsi12), symbol: 'none', lineStyle: { width: 1 } },
        { name: 'RSI24', type: 'line', data: indicators.map((d) => d.rsi24), symbol: 'none', lineStyle: { width: 1 } },
      ]
      baseOption.yAxis = {
        ...baseOption.yAxis as any,
        min: 0,
        max: 100,
      }
    } else if (tab === 'boll') {
      const closePrices = kline.map((d) => d.close)
      series = [
        { name: '收盘价', type: 'line', data: closePrices, symbol: 'none', lineStyle: { width: 1, color: '#374151' } },
        { name: '上轨', type: 'line', data: indicators.map((d) => d.boll_upper), symbol: 'none', lineStyle: { width: 1, type: 'dashed' } },
        { name: '中轨', type: 'line', data: indicators.map((d) => d.boll_mid), symbol: 'none', lineStyle: { width: 1 } },
        { name: '下轨', type: 'line', data: indicators.map((d) => d.boll_lower), symbol: 'none', lineStyle: { width: 1, type: 'dashed' } },
      ]
    }

    chart.setOption({ ...baseOption, series }, true)
  }

  function switchTab(key: TabKey) {
    tabRef.current = key
    renderChart()
  }

  if (!kline.length || !indicators.length) {
    return (
      <div className="card flex items-center justify-center" style={{ height: resolvedHeight }}>
        <span className="text-gray-400">暂无指标数据</span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[40px] ${
              tabRef.current === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div ref={chartRef} style={{ width: '100%', height: resolvedHeight }} />
    </div>
  )
}
