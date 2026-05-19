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
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  },
)

export default client
