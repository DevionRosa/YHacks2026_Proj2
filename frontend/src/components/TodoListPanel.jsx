import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export default function TodoListPanel({ todoState }) {
  const { todos, add, toggle, remove } = todoState
  const [draft, setDraft] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    add(draft)
    setDraft('')
  }

  return (
    <div className="todo-container-pro">
      {/* 1. Sleek Input Group at the Top */}
      <form className="todo-input-group" onSubmit={submit}>
        <input
          className="todo-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a new task..."
          autoComplete="off"
        />
        <button type="submit" className="btn-add-task">
          <Plus size={20} />
        </button>
      </form>

      {/* 2. The Task List */}
      <ul className="todo-list">
        {todos.map((t) => (
          <li key={t.id} className="todo-item">
            {/* Un-nesting the input and span allows the CSS 'gap' to work */}
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              className="todo-check-pro"
            />

            <span className={`todo-text ${t.done ? 'todo-text-done' : ''}`}>
              {t.text}
            </span>

            <button
              type="button"
              className="btn-delete"
              onClick={() => remove(t.id)}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}