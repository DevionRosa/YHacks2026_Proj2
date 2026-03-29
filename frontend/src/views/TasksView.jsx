import TodoListPanel from '../components/TodoListPanel'

export default function TasksView({ todoState }) {
  const open = todoState.todos.filter((t) => !t.done).length
  const done = todoState.todos.length - open

  return (
    <div className="tasks-view">
      <section className="panel tasks-panel">
        <div className="tasks-panel-head">
          <div>
            <h2 className="section-title tasks-page-title">To-do list</h2>
            <p className="muted tasks-page-sub">
              {open} open · {done} completed · saved on this device
            </p>
          </div>
        </div>
        <div className="tasks-panel-body">
          <TodoListPanel todoState={todoState} variant="full" />
        </div>
      </section>
    </div>
  )
}
