import { useState } from 'react'
import Layout from './components/Layout'
import { useMommaData } from './hooks/useMommaData'
import { useTodos } from './hooks/useTodos'
import HomeView from './views/HomeView'
import CalendarView from './views/CalendarView'
import SpendingView from './views/SpendingView'
import CarbonView from './views/CarbonView'
import TasksView from './views/TasksView'
import './index.css'

export default function App() {
  const [tab, setTab] = useState('home')
  const todoState = useTodos()
  const {
    data,
    loading,
    running,
    logs,
    wsConnected,
    error,
    fetchDashboard,
    runPipeline,
    sendChat,
    chatSending,
  } = useMommaData()

  return (
    <Layout
      activeTab={tab}
      onTabChange={setTab}
      onRunPipeline={runPipeline}
      onRefresh={fetchDashboard}
      running={running}
      wsConnected={wsConnected}
    >
      {error && (
        <div className="banner-error" role="alert">
          {error}
        </div>
      )}

      {loading && tab !== 'tasks' ? (
        <div className="panel panel-center load-panel">
          <div className="spinner" />
          <p className="muted">Loading your data…</p>
        </div>
      ) : (
        <>
          {tab === 'home' && (
            <HomeView
              data={data}
              logs={logs}
              running={running}
              onRunPipeline={runPipeline}
              todoState={todoState}
              sendChat={sendChat}
              chatSending={chatSending}
            />
          )}
          {tab === 'tasks' && <TasksView todoState={todoState} />}
          {tab === 'calendar' && <CalendarView events={data?.events ?? []} />}
          {tab === 'spending' && <SpendingView spending={data?.spending} />}
          {tab === 'carbon' && (
            <CarbonView carbon={data?.carbon} stats={data?.stats} />
          )}
        </>
      )}
    </Layout>
  )
}
