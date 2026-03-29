import { useState, useEffect } from 'react'

const STORAGE_KEY = 'momma-todos'

function defaultTodos() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* fall through */
  }
  return [
    { id: '1', text: 'Review Q2 planning notes', done: false },
    { id: '2', text: 'Reply to calendar invites', done: false },
    { id: '3', text: 'Pack for client trip', done: false },
  ]
}

export function useTodos() {
  const [todos, setTodos] = useState(() => defaultTodos())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch {
      /* ignore */
    }
  }, [todos])

  const add = (text) => {
    const t = text.trim()
    if (!t) return
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: t, done: false }])
  }

  const toggle = (id) => {
    setTodos((prev) =>
      prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x))
    )
  }

  const remove = (id) => {
    setTodos((prev) => prev.filter((x) => x.id !== id))
  }

  return { todos, add, toggle, remove }
}
