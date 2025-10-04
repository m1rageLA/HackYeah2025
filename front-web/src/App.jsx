import { useState } from 'react'
import MapView, { reports } from './MapView.jsx'
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
    window.alert('Zgłoszenie przekazane do służb')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="icon-button"
          type="button"
          disabled
          aria-label="Wybór języka (w przygotowaniu)"
          title="Wybór języka (w przygotowaniu)"
        >
          <IconGlobe />
        </button>

        <button
          className="icon-button"
          type="button"
          onClick={() => setIsInfoOpen(true)}
          aria-label="Informacje"
          title="Informacje"
        >
          <IconInfo />
        </button>

        <button
          className={`icon-button${!isMeasuring ? ' active' : ''}`}
          type="button"
          onClick={handleDisableMeasure}
          aria-label="Tryb nawigacji"
          aria-pressed={!isMeasuring}
          title="Tryb podstawowy"
        >
          <IconHand />
        </button>

        <button
          className={`icon-button${isMeasuring ? ' active' : ''}`}
          type="button"
          onClick={handleToggleMeasure}
          aria-label={isMeasuring ? 'Zakończ pomiar' : 'Rozpocznij pomiar'}
          aria-pressed={isMeasuring}
          title={isMeasuring ? 'Zakończ pomiar' : 'Rozpocznij pomiar'}
        >
          <IconRuler />
        </button>
      </aside>

      <main className="map-area">
        <div className="brand-badge">
          <p className="brand-kicker">Szybka reakcja</p>
          <h1 className="brand-title">Centrum incydentów</h1>
          <div className={`mode-status${isMeasuring ? ' measuring' : ''}`} role="status" aria-live="polite">
            <span className="mode-status-label">Tryb</span>
            <span className="mode-status-value">
              {isMeasuring ? 'Pomiar odległości' : 'Nawigacja ręczna'}
            </span>
          </div>
        </div>
        <MapView
          isMeasuring={isMeasuring}
          onMeasurementChange={setMeasurement}
          onDispatchRequest={handleDispatchRequest}
        />
      </main>

      <aside className="reports-panel">
        <div className="reports-header">
          <h2>Raporty terenowe</h2>
          <p>Aktualne zgłoszenia według priorytetu</p>
        </div>
        <ul className="reports-list">
          {reports.map((report) => (
            <li key={report.id} className="reports-list-item" style={{ '--priority-color': report.priorityColor }}>
              <span className="reports-priority-indicator" aria-hidden="true" />
              <div className="reports-item-content">
                <h3>{report.title}</h3>
                <p className="reports-item-meta">
                  <span className="reports-item-priority">{report.priority}</span>
                  <span>{report.city}</span>
                </p>
              </div>
              <span className="reports-item-time">{report.lastSeen}</span>
            </li>
          ))}
        </ul>
      </aside>

      {isInfoOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setIsInfoOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Jak korzystać z mapy</h2>
            <ul className="modal-list">
              <li>Przeglądaj pinezki incydentów, aby zrozumieć zgłoszenia zespołów terenowych.</li>
              <li>Otwórz pinezkę, by zobaczyć podsumowanie zagrożenia oraz sugerowane służby.</li>
              <li>
                Użyj linijki, aby zmierzyć dystans między punktami — to pomaga ocenić trasy podejścia lub
                najbliższe jednostki.
              </li>
              <li>Przyciski kierowania to na razie makiety przed integracją z systemami policji i straży.</li>
              <li>Przełączanie języka jest w planach; obecnie widok operacyjny dostępny jest po polsku.</li>
            </ul>
            <button className="ghost-button" type="button" onClick={() => setIsInfoOpen(false)}>
              Zamknij
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
            <h2>Potwierdzenie wysłania</h2>
            <div className="dispatch-summary">
              <h3>{dispatchContext.report.title}</h3>
              <p>
                Lokalizacja: <strong>{dispatchContext.report.city}</strong>
              </p>
              <p>
                Incydent: <strong>{dispatchContext.report.incident}</strong>
              </p>
              <p>
                Typ uzbrojenia: <strong>{dispatchContext.report.weaponType}</strong>
              </p>
              <p>
                Ostatnia obserwacja: <strong>{dispatchContext.report.lastSeen}</strong>
              </p>
              <p>Służba: {dispatchContext.service}</p>
              <p>Notatka: {dispatchContext.report.note}</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={handleCloseDispatch}>
                Anuluj
              </button>
              <button className="modal-primary-button" type="button" onClick={handleConfirmDispatch}>
                Potwierdź
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
