import { useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './MapView.jsx'
import './App.css'

const PRIORITY_META = {
  red: {
    order: 0,
    filterLabel: 'Krytyczne zgłoszenia',
    itemLabel: 'Krytyczny',
    color: '#f87171',
  },
  orange: {
    order: 1,
    filterLabel: 'Wysokie zgłoszenia',
    itemLabel: 'Wysoki',
    color: '#fb923c',
  },
  yellow: {
    order: 2,
    filterLabel: 'Średnie zgłoszenia',
    itemLabel: 'Średni',
    color: '#facc15',
  },
  gray: {
    order: 3,
    filterLabel: 'Niskie zgłoszenia',
    itemLabel: 'Niski',
    color: '#94a3b8',
  },
}

const PRIORITY_ORDER = Object.fromEntries(
  Object.entries(PRIORITY_META).map(([key, value]) => [key, value.order]),
)

const PRIORITY_LABELS = Object.fromEntries(
  Object.entries(PRIORITY_META).map(([key, value]) => [key, value.filterLabel]),
)

const DEFAULT_PRIORITY_KEY = 'gray'

const SERVER_PRIORITY_MAP = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'gray',
}

const REPORTS_API_URL = import.meta.env.VITE_REPORTS_API_URL ?? '/reports'
const REPORTS_API_TOKEN = import.meta.env.VITE_REPORTS_API_TOKEN ?? ''

const INCIDENT_TYPE_MAP = {
  armed: { key: 'armed', label: 'Armed people' },
  'armed-people': { key: 'armed', label: 'Armed people' },
  'armed_people': { key: 'armed', label: 'Armed people' },
  'armed people': { key: 'armed', label: 'Armed people' },
  'вооруженные люди': { key: 'armed', label: 'Armed people' },
  drones: { key: 'drones', label: 'Drones' },
  drone: { key: 'drones', label: 'Drones' },
  'дрон': { key: 'drones', label: 'Drones' },
  'бпла': { key: 'drones', label: 'Drones' },
  explosion: { key: 'explosion', label: 'Explosion' },
  blast: { key: 'explosion', label: 'Explosion' },
  'взрыв': { key: 'explosion', label: 'Explosion' },
  other: { key: 'other', label: 'Other' },
  misc: { key: 'other', label: 'Other' },
  'другое': { key: 'other', label: 'Other' },
  red: { key: 'priority-critical', label: 'Critical incident' },
  orange: { key: 'priority-high', label: 'High priority incident' },
  yellow: { key: 'priority-medium', label: 'Medium priority incident' },
  gray: { key: 'priority-low', label: 'Low priority incident' },
}

const FALLBACK_INCIDENT_TYPE = { key: 'other', label: 'Other' }

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function resolvePriorityKey(priorityValue) {
  if (!priorityValue) {
    return DEFAULT_PRIORITY_KEY
  }

  const normalized = String(priorityValue).trim().toLowerCase()

  if (normalized in PRIORITY_META) {
    return normalized
  }

  if (normalized in SERVER_PRIORITY_MAP) {
    return SERVER_PRIORITY_MAP[normalized]
  }

  if (normalized.includes('kryt')) {
    return 'red'
  }
  if (normalized.includes('wys')) {
    return 'orange'
  }
  if (normalized.includes('sr') || normalized.includes('śred') || normalized.includes('sred')) {
    return 'yellow'
  }
  if (normalized.includes('nis')) {
    return 'gray'
  }

  return DEFAULT_PRIORITY_KEY
}

function normalizeServices(rawServices) {
  if (!rawServices) {
    return []
  }

  if (Array.isArray(rawServices)) {
    return rawServices
      .map((service) => {
        if (typeof service === 'string') {
          return service.trim()
        }
        if (service && typeof service.name === 'string') {
          return service.name.trim()
        }
        return null
      })
      .filter((service) => Boolean(service))
  }

  if (typeof rawServices === 'string') {
    return rawServices
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return []
}

function resolveIncidentType(typeValue) {
  if (!typeValue) {
    return FALLBACK_INCIDENT_TYPE
  }

  const normalized = String(typeValue).trim().toLowerCase()
  return INCIDENT_TYPE_MAP[normalized] ?? FALLBACK_INCIDENT_TYPE
}

function formatRelativeMinutes(minutes) {
  if (!Number.isFinite(minutes)) {
    return 'Brak danych'
  }

  if (minutes <= 1) {
    return 'Przed chwilą'
  }

  if (minutes < 60) {
    return `${minutes} minut temu`
  }

  const hours = Math.round(minutes / 60)
  if (hours === 1) {
    return '1 godzina temu'
  }
  if (hours < 24) {
    return `${hours} godzin temu`
  }

  const days = Math.round(hours / 24)
  if (days === 1) {
    return '1 dzień temu'
  }

  return `${days} dni temu`
}

function computeLastSeenMeta({ lastSeenAt, updatedAt, createdAt }) {
  const candidate = lastSeenAt ?? updatedAt ?? createdAt
  if (!candidate) {
    return { label: 'Brak danych', minutes: Number.POSITIVE_INFINITY }
  }

  const timestamp = new Date(candidate)
  if (Number.isNaN(timestamp.getTime())) {
    return { label: 'Brak danych', minutes: Number.POSITIVE_INFINITY }
  }

  const diff = Math.max(0, Date.now() - timestamp.getTime())
  const minutes = Math.round(diff / 60000)

  return {
    label: formatRelativeMinutes(minutes),
    minutes,
  }
}

function normalizeReport(apiReport) {
  if (!apiReport || typeof apiReport !== 'object') {
    return null
  }

  const data = apiReport.data && typeof apiReport.data === 'object' ? apiReport.data : {}
  const geoPoint = apiReport.geo_point && typeof apiReport.geo_point === 'object' ? apiReport.geo_point : {}

  const priorityKey = resolvePriorityKey(
    data.priorityKey ??
      data.priority_key ??
      data.priority ??
      apiReport.priority ??
      apiReport.type,
  )
  const priorityMeta = PRIORITY_META[priorityKey] ?? PRIORITY_META[DEFAULT_PRIORITY_KEY]

  const lat =
    toNumber(data.lat ?? data.latitude ?? geoPoint.lat ?? geoPoint.latitude) ?? null
  const lng =
    toNumber(data.lng ?? data.longitude ?? geoPoint.lng ?? geoPoint.longitude) ?? null

  const incidentTypeSource =
    data.type ?? data.incidentType ?? data.incident_type ?? apiReport.type ?? data.category
  const incidentType = resolveIncidentType(incidentTypeSource)
  const rawIncident = data.incident ?? data.category ?? incidentTypeSource ?? ''

  const { label: lastSeen, minutes: lastSeenMinutes } = computeLastSeenMeta({
    lastSeenAt: data.lastSeenAt ?? data.last_seen_at,
    updatedAt: apiReport.updated_at,
    createdAt: apiReport.created_at,
  })

  const reputationRaw = toNumber(data.reputation ?? data.rating ?? 0)
  const reputation = Number.isFinite(reputationRaw)
    ? Math.min(Math.max(reputationRaw, 0), 5)
    : 0

  const note = data.note ?? data.description ?? ''

  return {
    id: apiReport.id ?? data.id ?? Math.random().toString(36).slice(2),
    lat,
    lng,
    title: data.title ?? data.name ?? incidentType.label,
    city: data.city ?? data.location ?? 'Nieznana lokalizacja',
    incident: incidentType.label,
    incidentRaw: rawIncident,
    incidentKey: incidentType.key,
    weaponType: data.weaponType ?? data.weapon_type ?? data.weapon ?? 'Brak danych',
    lastSeen,
    note: note.length > 0 ? note : 'Brak dodatkowych informacji',
    services: normalizeServices(data.services),
    priority: data.priorityLabel ?? data.priority_label ?? priorityMeta.itemLabel,
    priorityColor: data.priorityColor ?? data.priority_color ?? priorityMeta.color,
    priorityKey,
    reputation,
    lastSeenMinutes,
  }
}

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
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [, setMeasurement] = useState(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [dispatchContext, setDispatchContext] = useState(null)
  const [sortMode, setSortMode] = useState('priority')
  const [activeFilters, setActiveFilters] = useState(() => Object.keys(PRIORITY_ORDER))
  const [selectedReportId, setSelectedReportId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadReports() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const headers = {
          Accept: 'application/json',
        }

        if (REPORTS_API_TOKEN) {
          headers.authorization = REPORTS_API_TOKEN
        }

        const response = await fetch(REPORTS_API_URL, {
          headers,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Serwer zwrócił status ${response.status}`)
        }

        const payload = await response.json()
        const normalized = Array.isArray(payload)
          ? payload.map((item) => normalizeReport(item)).filter(Boolean)
          : []

        setReports(normalized)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Nie udało się pobrać raportów', error)
        setLoadError(error)
        setReports([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      controller.abort()
    }
  }, [])

  const priorityStyles = useMemo(() => {
    return Object.keys(PRIORITY_META).reduce((acc, key) => {
      const match = reports.find((report) => report.priorityKey === key)
      acc[key] = match?.priorityColor ?? PRIORITY_META[key].color
      return acc
    }, {})
  }, [reports])

  const toggleFilter = (priorityKey) => {
    setActiveFilters((prev) => {
      if (prev.includes(priorityKey)) {
        return prev.filter((item) => item !== priorityKey)
      }
      return [...prev, priorityKey]
    })
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => activeFilters.includes(report.priorityKey))
  }, [activeFilters, reports])

  useEffect(() => {
    if (!selectedReportId) {
      return
    }

    const stillVisible = filteredReports.some((report) => report.id === selectedReportId)
    if (!stillVisible) {
      setSelectedReportId(null)
    }
  }, [filteredReports, selectedReportId])

  const sortedReports = useMemo(() => {
    const items = [...filteredReports]

    const getMinutes = (value) => (Number.isFinite(value) ? value : Number.POSITIVE_INFINITY)
    const getReputation = (value) => (Number.isFinite(value) ? value : 0)
    const getPriorityOrder = (report) =>
      PRIORITY_ORDER[report.priorityKey] ?? Number.MAX_SAFE_INTEGER

    if (sortMode === 'reputation') {
      items.sort((a, b) => getReputation(b.reputation) - getReputation(a.reputation))
    } else if (sortMode === 'time') {
      items.sort((a, b) => getMinutes(a.lastSeenMinutes) - getMinutes(b.lastSeenMinutes))
    } else {
      items.sort((a, b) => {
        const orderDiff = getPriorityOrder(a) - getPriorityOrder(b)
        if (orderDiff !== 0) {
          return orderDiff
        }
        return getMinutes(a.lastSeenMinutes) - getMinutes(b.lastSeenMinutes)
      })
    }

    return items
  }, [filteredReports, sortMode])

  const sortDescription =
    sortMode === 'reputation'
      ? 'Posortowane według reputacji służb'
      : sortMode === 'time'
        ? 'Posortowane według czasu ostatniego zgłoszenia'
        : 'Aktualne zgłoszenia według priorytetu'

  const handleSelectReport = useCallback((reportId) => {
    setSelectedReportId(reportId)
  }, [])

  const handleReportKeyDown = useCallback(
    (event, reportId) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleSelectReport(reportId)
      }
    },
    [handleSelectReport],
  )

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
          reports={filteredReports}
          isMeasuring={isMeasuring}
          onMeasurementChange={setMeasurement}
          onDispatchRequest={handleDispatchRequest}
          selectedReportId={selectedReportId}
          onSelectReport={handleSelectReport}
        />
      </main>

      <aside className="reports-panel">
        <div className="reports-header">
          <h2>Raporty terenowe</h2>
          <p>{sortDescription}</p>
          <div className="reports-controls">
            <div className="reports-control-group" role="group" aria-label="Sortowanie zgłoszeń">
              <button
                type="button"
                className={`reports-sort-chip${sortMode === 'priority' ? ' active' : ''}`}
                onClick={() => setSortMode('priority')}
                aria-pressed={sortMode === 'priority'}
              >
                Priorytet
              </button>
              <button
                type="button"
                className={`reports-sort-chip${sortMode === 'time' ? ' active' : ''}`}
                onClick={() => setSortMode('time')}
                aria-pressed={sortMode === 'time'}
              >
                Czas
              </button>
              <button
                type="button"
                className={`reports-sort-chip${sortMode === 'reputation' ? ' active' : ''}`}
                onClick={() => setSortMode('reputation')}
                aria-pressed={sortMode === 'reputation'}
              >
                Reputacja
              </button>
            </div>
            <div className="reports-filter-row">
              <div className="reports-filter-group" role="group" aria-label="Filtr priorytetów">
                {Object.keys(PRIORITY_ORDER).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`reports-filter-dot${activeFilters.includes(key) ? ' active' : ''}`}
                    onClick={() => toggleFilter(key)}
                    aria-pressed={activeFilters.includes(key)}
                    aria-label={PRIORITY_LABELS[key]}
                    title={PRIORITY_LABELS[key]}
                    style={{ '--priority-color': priorityStyles[key] ?? PRIORITY_META[key].color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <ul className="reports-list">
          {isLoading && (
            <li className="reports-list-empty" role="status">Ładowanie raportów…</li>
          )}
          {!isLoading && loadError && (
            <li className="reports-list-empty" role="alert">
              Nie udało się pobrać raportów. Spróbuj ponownie później.
            </li>
          )}
          {!isLoading && !loadError && sortedReports.length === 0 && (
            <li className="reports-list-empty">Brak zgłoszeń do wyświetlenia.</li>
          )}
          {!isLoading && !loadError &&
            sortedReports.map((report) => (
              <li
                key={report.id}
                className={`reports-list-item${report.id === selectedReportId ? ' selected' : ''}`}
                style={{ '--priority-color': report.priorityColor }}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectReport(report.id)}
                onKeyDown={(event) => handleReportKeyDown(event, report.id)}
                aria-pressed={report.id === selectedReportId}
              >
                <span className="reports-priority-indicator" aria-hidden="true" />
                <div className="reports-item-content">
                  <h3>{report.title}</h3>
                  <p className="reports-item-meta">
                    <span className="reports-item-priority">{report.priority}</span>
                    <span>{report.city}</span>
                  </p>
                  <p className="reports-item-rating">Reputacja: {report.reputation.toFixed(1)} / 5</p>
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
