import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { KlineData } from '../types'

interface Props {
  data: KlineData[]
  height?: number
}

export default function KlineChart({ data, height = 500 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)

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
    const chart = instanceRef.current
    if (!chart || !data.length) return

    const dates = data.map((d) => d.trade_date)
    const ohlc = data.map((d) => [d.open, d.close, d.low, d.high])
    const volumes = data.map((d) => d.volume)
    const colors = data.map((d) => (d.close >= d.open ? '#ef4444' : '#22c55e'))

    chart.setOption(
      {
        animation: false,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e5e7eb',
          textStyle: { color: '#374151', fontSize: 12 },
          formatter: (params: any) => {
            const d = params[0]
            if (!d) return ''
            const idx = d.dataIndex
            const item = data[idx]
            const pct = item.pct_change != null ? `${item.pct_change > 0 ? '+' : ''}${item.pct_change.toFixed(2)}%` : '-'
            return `<div style="font-size:12px">
              <div style="font-weight:600;margin-bottom:4px">${item.trade_date}</div>
              <div>开盘: ${item.open.toFixed(2)}</div>
              <div>收盘: <span style="color:${item.close >= item.open ? '#ef4444' : '#22c55e'}">${item.close.toFixed(2)}</span></div>
              <div>最高: ${item.high.toFixed(2)}</div>
              <div>最低: ${item.low.toFixed(2)}</div>
              <div>涨跌: <span style="color:${(item.pct_change ?? 0) >= 0 ? '#ef4444' : '#22c55e'}">${pct}</span></div>
              <div>成交量: ${(item.volume / 10000).toFixed(0)}万手</div>
            </div>`
          },
        },
        axisPointer: {
          link: [{ xAxisIndex: 'all' }],
        },
        grid: [
          { left: '8%', right: '3%', top: 60, height: '55%' },
          { left: '8%', right: '3%', top: '78%', height: '16%' },
        ],
        xAxis: [
          {
            type: 'category',
            data: dates,
            gridIndex: 0,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#9ca3af', fontSize: 11 },
            splitLine: { show: false },
            min: 'dataMin',
            max: 'dataMax',
          },
          {
            type: 'category',
            data: dates,
            gridIndex: 1,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { show: false },
            splitLine: { show: false },
            min: 'dataMin',
            max: 'dataMax',
          },
        ],
        yAxis: [
          {
            type: 'value',
            gridIndex: 0,
            scale: true,
            splitLine: { lineStyle: { color: '#f3f4f6' } },
            axisLine: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 11 },
          },
          {
            type: 'value',
            gridIndex: 1,
            scale: true,
            splitNumber: 2,
            splitLine: { lineStyle: { color: '#f3f4f6' } },
            axisLine: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v: number) => (v / 10000).toFixed(0) + '万' },
          },
        ],
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0, 1],
            start: Math.max(0, 100 - (120 / dates.length) * 100),
            end: 100,
          },
          {
            type: 'slider',
            xAxisIndex: [0, 1],
            bottom: 10,
            height: 20,
            borderColor: '#e5e7eb',
            fillerColor: 'rgba(59,130,246,0.1)',
            handleStyle: { color: '#3b82f6' },
          },
        ],
        series: [
          {
            name: 'K线',
            type: 'candlestick',
            data: ohlc,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: {
              color: '#ef4444',
              color0: '#22c55e',
              borderColor: '#ef4444',
              borderColor0: '#22c55e',
            },
          },
          {
            name: '成交量',
            type: 'bar',
            data: volumes.map((v, i) => ({
              value: v,
              itemStyle: { color: colors[i] + '80' },
            })),
            xAxisIndex: 1,
            yAxisIndex: 1,
          },
        ],
      },
      true,
    )
  }, [data])

  if (!data.length) {
    return (
      <div className="card flex items-center justify-center" style={{ height }}>
        <span className="text-gray-400">暂无K线数据</span>
      </div>
    )
  }

  return <div ref={chartRef} style={{ width: '100%', height }} />
}
