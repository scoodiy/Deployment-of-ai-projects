import axios from 'axios'

// 根据环境自动切换 API 地址
const getBaseURL = () => {
  // 本地开发环境使用 Vite 代理
  if (import.meta.env.DEV) {
    return ''
  }
  // 生产环境使用环境变量或默认后端地址
  return import.meta.env.VITE_API_BASE_URL || ''
}

const client = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  (res) => {
    // 检查响应是否是 JSON（防止 SPA 路由返回 HTML 被当作 API 数据）
    const contentType = res.headers['content-type'] || ''
    if (typeof res.data === 'string' && res.data.trimStart().startsWith('<')) {
      return Promise.reject(new Error('后端服务未连接，请稍后再试'))
    }
    return res.data
  },
  (err) => {
    const msg = err.response?.data?.detail || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  },
)

export default client
