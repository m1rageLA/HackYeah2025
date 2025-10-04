import { useMemo, useState } from 'react'
import MapView from './MapView.jsx'
import './App.css'

function App() {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState(null)

  const formattedDistance = useMemo(() => {
    if (!measurement || measurement.distance == null) {
      return null
    }

    const { distance } = measurement
    if (distance >= 1000) {
      const km = distance / 1000
      return `${km.toFixed(km >= 100 ? 0 : 2)} km`
    }

    return `${Math.round(distance)} m`
  }, [measurement])

  const pointsCaptured = measurement?.points?.length ?? 0

  const handleToggleMeasure = () => {
    setIsMeasuring((prev) => {
      const next = !prev
      if (!next) {
        setMeasurement(null)
      }
      return next
    })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="sidebar-kicker">Rapid Response Console</p>
          <h1 className="sidebar-title">Incident Desk</h1>
          <p className="sidebar-subtitle">Live intelligence feed · Poland</p>
        </div>

        <div className="sidebar-section">
          <span className="section-label">Language</span>
          <button className="ghost-button" type="button" disabled>
            EN · placeholder
          </button>
        </div>

        <div className="sidebar-section">
          <span className="section-label">Controls</span>
          <div className="sidebar-actions">
            <button className="primary-button" type="button" onClick={() => setIsInfoOpen(true)}>
              Info
            </button>
            <button
              className={`toggle-button${isMeasuring ? ' active' : ''}`}
              type="button"
              onClick={handleToggleMeasure}
            >
              {isMeasuring ? 'Finish measuring' : 'Ruler: measure distance'}
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="section-label">Measurement</span>
          <div className="measurement-readout">
            {isMeasuring ? (
              pointsCaptured === 0 ? (
                <p>Click the starting point on the map.</p>
              ) : pointsCaptured === 1 ? (
                <p>Select the destination point to get the distance.</p>
              ) : (
                <p>
                  Distance: <strong>{formattedDistance}</strong>
                </p>
              )
            ) : formattedDistance ? (
              <p>
                Last distance: <strong>{formattedDistance}</strong>
              </p>
            ) : (
              <p>Enable the ruler to plan quick responder routes.</p>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <p>
            Review alerts, confirm ground truth with field teams, and task the appropriate emergency
            services from a single view.
          </p>
        </div>
      </aside>

      <main className="map-area">
        <MapView isMeasuring={isMeasuring} onMeasurementChange={setMeasurement} />
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
    </div>
  )
}

export default App
