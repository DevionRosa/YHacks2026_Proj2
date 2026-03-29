import { useState, useEffect, useCallback } from 'react'
import { API_BASE, getLogsWebSocketUrl } from '../config'

export function useMommaData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/api/dashboard`)
      if (!res.ok) throw new Error('Could not load data from the server.')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
      setError(e.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    let ws
    const url = getLogsWebSocketUrl()
    const connect = () => {
      ws = new WebSocket(url)
      ws.onopen = () => setWsConnected(true)
      ws.onclose = () => {
        setWsConnected(false)
        setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (e) => {
        try {
          const log = JSON.parse(e.data)
          setLogs((prev) => [...prev.slice(-199), log])
        } catch {
          /* ignore */
        }
      }
    }
    connect()
    return () => ws?.close()
  }, [])

  const runPipeline = async () => {
    setRunning(true)
    setLogs([])
    try {
      setError(null)
      await fetch(`${API_BASE}/api/run-pipeline?email_source=mock`, { method: 'POST' })
      await fetchDashboard()
    } catch (e) {
      console.error(e)
      setError(e.message ?? 'Pipeline failed.')
    } finally {
      setRunning(false)
    }
  }

  return {
    data,
    loading,
    running,
    logs,
    wsConnected,
    error,
    fetchDashboard,
    runPipeline,
  }
}
