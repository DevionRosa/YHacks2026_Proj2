import { useState, useId } from 'react'
import { Plus } from 'lucide-react'

export default function TodoListPanel({ todoState, variant = 'default' }) {
  const { todos, add, toggle, remove } = todoState
  const [draft, setDraft] = useState('')
  const formId = useId()

  const submit = (e) => {
    e.preventDefault()
    add(draft)
    setDraft('')
  }

  const listClass = variant === 'full' ? 'todo-list todo-list-full' : 'todo-list'

  return (
    <div className={`todo-panel ${variant === 'full' ? 'todo-panel-full' : ''}`}>
      <ul className={listClass}>
        {todos.map((t) => (
          <li key={t.id} className={`todo-item ${t.done ? 'todo-done' : ''}`}>
            <label className="todo-label">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="todo-check"
              />
              <span className="todo-text">{t.text}</span>
            </label>
            <button
              type="button"
              className="todo-remove"
              onClick={() => remove(t.id)}
              aria-label={`Remove: ${t.text}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="todo-form" onSubmit={submit}>
        <input
          id={formId}
          className="todo-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-small btn-primary todo-add" aria-label="Add task">
          <Plus size={18} aria-hidden />
        </button>
      </form>
    </div>
  )
}
