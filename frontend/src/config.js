const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const API_BASE = raw.replace(/\/$/, '')

export function getLogsWebSocketUrl() {
  try {
    const u = new URL(API_BASE)
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
    u.pathname = '/ws/logs'
    u.search = ''
    u.hash = ''
    return u.toString()
  } catch {
    return 'ws://localhost:8000/ws/logs'
  }
}
