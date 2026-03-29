import { useState } from 'react'
import Layout from './components/Layout'
import { useMommaData } from './hooks/useMommaData'
import HomeView from './views/HomeView'
import CalendarView from './views/CalendarView'
import SpendingView from './views/SpendingView'
import CarbonView from './views/CarbonView'
import './index.css'

export default function App() {
  const [tab, setTab] = useState('home')
  const {
    data,
    loading,
    running,
    logs,
    wsConnected,
    error,
    fetchDashboard,
    runPipeline,
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

      {loading ? (
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
            />
          )}
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
