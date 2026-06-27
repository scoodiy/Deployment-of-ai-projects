import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StockList from './pages/StockList'
import StockDetail from './pages/StockDetail'
import Screening from './pages/Screening'
import Strategies from './pages/Strategies'
import Backtest from './pages/Backtest'
import Watchlist from './pages/Watchlist'
import Chat from './pages/Chat'
import SystemStatus from './pages/SystemStatus'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stocks" element={<StockList />} />
        <Route path="/stocks/:code" element={<StockDetail />} />
        <Route path="/screening" element={<Screening />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/backtest" element={<Backtest />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/system" element={<SystemStatus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
