import { useState } from 'react'
import MapView from './MapView.jsx'
import './App.css'

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M12 21c4.97 0 9-3.91 9-9s-4.03-9-9-9-9 3.91-9 9 4.03 9 9 9Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M3.6 9h16.8M3.6 15h16.8M12 3c2.4 3 3.6 6 3.6 9s-1.2 6-3.6 9c-2.4-3-3.6-6-3.6-9S9.6 6 12 3Z"
      />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M12 16v-5M12 8.8h.01"
      />
    </svg>
  )
}

function IconRuler() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect
        x="3"
        y="7"
        width="18"
        height="10"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M7 9h.01M10 12h.01M13 9h.01M16 12h.01M19 9h.01"
      />
    </svg>
  )
}

function IconHand() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M8.5 11.5V6.6c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V11m0-3.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v3.8m0-1.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v4.5c0 2.7-1 4.4-2.6 5.6l-2.2 1.6c-.7.5-1.7.3-2.1-.4l-.7-1.1c-.3-.4-.8-.7-1.4-.7H9.4c-.6 0-1.1-.3-1.4-.8l-2.5-4.2c-.6-1-.2-2.3.9-2.8.9-.4 1.9.1 2.2 1l.6 1.6"
      />
    </svg>
  )
}

function App() {
  const [, setMeasurement] = useState(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [dispatchContext, setDispatchContext] = useState(null)

  const handleToggleMeasure = () => {
    setIsMeasuring((prev) => {
      const next = !prev
      if (!next) {
        setMeasurement(null)
      }
      return next
    })
  }

  const handleDisableMeasure = () => {
    setIsMeasuring(false)
    setMeasurement(null)
  }

  const handleDispatchRequest = (report, service) => {
    setDispatchContext({ report, service })
  }

  const handleCloseDispatch = () => {
    setDispatchContext(null)
  }

  const handleConfirmDispatch = () => {
    setDispatchContext(null)
    window.alert('Службам передана информация')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="icon-button"
          type="button"
          disabled
          aria-label="Language placeholder"
          title="Language placeholder"
        >
          <IconGlobe />
        </button>

        <button
          className="icon-button"
          type="button"
          onClick={() => setIsInfoOpen(true)}
          aria-label="Information"
          title="Information"
        >
          <IconInfo />
        </button>

        <button
          className={`icon-button${!isMeasuring ? ' active' : ''}`}
          type="button"
          onClick={handleDisableMeasure}
          aria-label="Панорамирование"
          aria-pressed={!isMeasuring}
          title="Стандартный режим"
        >
          <IconHand />
        </button>

        <button
          className={`icon-button${isMeasuring ? ' active' : ''}`}
          type="button"
          onClick={handleToggleMeasure}
          aria-label={isMeasuring ? 'Завершить замер' : 'Начать замер'}
          aria-pressed={isMeasuring}
          title={isMeasuring ? 'Завершить замер' : 'Начать замер'}
        >
          <IconRuler />
        </button>
      </aside>

      <main className="map-area">
        <div className="brand-badge">
          <p className="brand-kicker">Rapid Response</p>
          <h1 className="brand-title">Incident Desk</h1>
        </div>
        <MapView
          isMeasuring={isMeasuring}
          onMeasurementChange={setMeasurement}
          onDispatchRequest={handleDispatchRequest}
        />
      </main>

      {isInfoOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setIsInfoOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>How to use this map</h2>
            <ul className="modal-list">
              <li>Review the incident pins to understand what the field teams are reporting.</li>
              <li>Open a pin to view the incident summary, threat type, and recommended services.</li>
              <li>
                Use the ruler to measure distance between two points — ideal for checking approach routes or
                nearest units.
              </li>
              <li>Dispatch actions are placeholders for future integrations with police and fire systems.</li>
              <li>Language switching is planned; English is used for the shared operating picture for now.</li>
            </ul>
            <button className="ghost-button" type="button" onClick={() => setIsInfoOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {dispatchContext && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseDispatch}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Подтверждение направления</h2>
            <div className="dispatch-summary">
              <h3>{dispatchContext.report.title}</h3>
              <p>
                Локация: <strong>{dispatchContext.report.city}</strong>
              </p>
              <p>
                Инцидент: <strong>{dispatchContext.report.incident}</strong>
              </p>
              <p>
                Тип вооружения: <strong>{dispatchContext.report.weaponType}</strong>
              </p>
              <p>
                Последнее наблюдение: <strong>{dispatchContext.report.lastSeen}</strong>
              </p>
              <p>Служба: {dispatchContext.service}</p>
              <p>Комментарий: {dispatchContext.report.note}</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={handleCloseDispatch}>
                Отмена
              </button>
              <button className="modal-primary-button" type="button" onClick={handleConfirmDispatch}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
