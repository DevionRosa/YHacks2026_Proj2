import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import { useMommaData } from './hooks/useMommaData'
import { useTodos } from './hooks/useTodos'
import HomeView from './views/HomeView'
import CalendarView from './views/CalendarView'
import SpendingView from './views/SpendingView'
import CarbonView from './views/CarbonView'
import './index.css'

export default function App() {
  const [tab, setTab] = useState('home')
  const { data, loading, error, runPipeline } = useMommaData()
  const todoState = useTodos()

  // Sync Backend Tasks to the Todo Hook when data loads
  useEffect(() => {
    if (data?.tasks) {
      // Clear local default todos and load backend tasks
      todoState.set(data.tasks);
    }
  }, [data]);

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {error && <div className="banner-error">{error}</div>}

      <div className="view-wrapper">
        {loading ? (
          <div className="empty-state-centered">
            <div className="spinning" style={{ border: '2px solid #ff69b4', borderRadius: '50%', width: '40px', height: '40px', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            {tab === 'home' && (
              <HomeView
                briefing={data?.briefing}
                totalKg={data?.total_kg}
                todoState={todoState}
                onSync={runPipeline}
              />
            )}

            {tab === 'calendar' && (
              <CalendarView todoState={todoState} />
            )}

            {tab === 'spending' && (
              <SpendingView />
            )}

            {tab === 'carbon' && (
              <CarbonView />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}