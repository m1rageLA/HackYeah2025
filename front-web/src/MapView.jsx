import { Fragment, useMemo, useRef } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Pane,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const mapCenter = [52.1, 23.4]
const mapZoom = 6.6

const TANK_SVG = `
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="5" y="22" width="38" height="12" rx="5" ry="5" fill="currentColor" />
    <rect x="14" y="15" width="18" height="9" rx="4" ry="4" fill="currentColor" />
    <rect x="31" y="20" width="12" height="4" rx="2" ry="2" fill="currentColor" />
    <circle cx="14" cy="35" r="5" fill="#0f172a" />
    <circle cx="34" cy="35" r="5" fill="#0f172a" />
  </svg>
`

const INFANTRY_SVG = `
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="14" r="6" fill="currentColor" />
    <path d="M16 44l8-14 8 14M24 20v10" stroke="#0f172a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 28l12-6 12 6" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`

const statusLabel = {
  frontline: 'Линия',
  attacking: 'Атака',
  reorganizing: 'Резерв',
  exhausted: 'Измотаны',
  entrenched: 'Укреплены',
  probing: 'Разведка',
  reserve: 'Резерв',
  resupplying: 'Подвоз',
}

const sanitize = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const getDivisionIconMarkup = (division, isSelected) => {
  const svg = division.type === 'armor' ? TANK_SVG : INFANTRY_SVG
  const factionClass = division.faction === 'enemy' ? 'division-icon--enemy' : 'division-icon--friendly'
  const selectedClass = isSelected ? ' division-icon--selected' : ''
  const statusClass = division.status ? ` division-icon--status-${division.status}` : ''
  const strength = sanitize(Math.round(division.strength))
  const org = sanitize(Math.round(division.organization))

  return `
    <div class="division-icon ${factionClass}${selectedClass}${statusClass}">
      <div class="division-icon__glow"></div>
      <div class="division-icon__glyph">${svg}</div>
      <div class="division-icon__labels">
        <span class="division-icon__strength">${strength}%</span>
        <span class="division-icon__org">ORG ${org}</span>
      </div>
    </div>
  `
}

const getFrontBadgeMarkup = (front, isSelected) => {
  const progress = Math.round(front.progress * 100)
  const readiness = Math.round(front.readiness)
  const supply = Math.round(front.supply)
  const stateLabel = {
    idle: 'Оборона',
    preparing: 'Подготовка',
    advancing: 'Наступление',
    stalled: 'Застой',
    secured: 'Закрепились',
    regrouping: 'Перегруппировка',
  }[front.state] ?? 'Оборона'

  const modifierClass = isSelected ? ' front-badge--selected' : ''
  const stateClass = ` front-badge--state-${front.state}`

  return `
    <div class="front-badge${modifierClass}${stateClass}">
      <div class="front-badge__title">${front.name}</div>
      <div class="front-badge__meta">
        <span>Цель: ${front.objective}</span>
        <span>Состояние: ${stateLabel}</span>
      </div>
      <div class="front-badge__meters">
        <span>Прогресс ${progress}%</span>
        <span>Готовн. ${readiness}</span>
        <span>Снабж. ${supply}</span>
      </div>
    </div>
  `
}

function MapView({
  fronts,
  divisions,
  selectedFrontId,
  onSelectFront,
  onToggleFrontState,
  selectedDivisionId,
  onSelectDivision,
}) {
  const divisionIconCache = useRef(new Map())
  const frontBadgeCache = useRef(new Map())

  const getDivisionIcon = (division, isSelected) => {
    const key = `${division.id}-${division.faction}-${division.type}-${division.status}-${isSelected ? 'selected' : 'idle'}`
    if (!divisionIconCache.current.has(key)) {
      divisionIconCache.current.set(
        key,
        L.divIcon({
          className: 'division-icon-wrapper',
          html: getDivisionIconMarkup(division, isSelected),
          iconSize: [54, 54],
          iconAnchor: [27, 27],
          popupAnchor: [0, -20],
        }),
      )
    }
    return divisionIconCache.current.get(key)
  }

  const getFrontBadgeIcon = (front, isSelected) => {
    const key = `${front.id}-${front.state}-${Math.round(front.progress * 100)}-${Math.round(front.readiness)}-${Math.round(front.supply)}-${isSelected}`
    if (!frontBadgeCache.current.has(key)) {
      frontBadgeCache.current.set(
        key,
        L.divIcon({
          className: 'front-badge-wrapper',
          html: getFrontBadgeMarkup(front, isSelected),
          iconSize: [180, 86],
          iconAnchor: [90, 54],
          popupAnchor: [0, -32],
        }),
      )
    }
    return frontBadgeCache.current.get(key)
  }

  const preparedFronts = useMemo(
    () =>
      fronts.map((front) => ({
        ...front,
        paddedPath: front?.path?.map((point) => [point.lat, point.lng]) ?? [],
        paddedAdvancePath: front?.advancePath?.map((point) => [point.lat, point.lng]) ?? [],
      })),
    [fronts],
  )

  const handleFrontClick = (frontId) => {
    onSelectFront?.(frontId)
  }

  const handleFrontDoubleClick = (frontId) => {
    onToggleFrontState?.(frontId)
  }

  return (
    <div className="map-wrapper">
      <MapContainer center={mapCenter} zoom={mapZoom} className="map-container" zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        <ZoomControl position="topright" />

        <Pane name="front-band" style={{ zIndex: 340 }} />
        <Pane name="front-line" style={{ zIndex: 350 }} />
        <Pane name="front-label" style={{ zIndex: 360 }} />
        <Pane name="division-marker" style={{ zIndex: 380 }} />

        {preparedFronts.map((front) => (
          <Fragment key={front.id}>
            {front.band && (
              <Polygon
                pane="front-band"
                positions={front.band}
                pathOptions={{
                  color: front.color,
                  weight: 0,
                  fillColor: front.color,
                  fillOpacity: selectedFrontId === front.id ? 0.28 : 0.18,
                  interactive: true,
                  className: 'front-band-shape',
                }}
                eventHandlers={{
                  click: () => handleFrontClick(front.id),
                  dblclick: () => handleFrontDoubleClick(front.id),
                }}
              />
            )}

            {front.paddedAdvancePath.length === front.paddedPath.length &&
              front.paddedPath.map((point, index) => {
                const target = front.paddedAdvancePath[index]
                if (!target) {
                  return null
                }
                const positions = [point, target]
                return (
                  <Polyline
                    key={`${front.id}-advance-${index}`}
                    pane="front-line"
                    positions={positions}
                    pathOptions={{
                      color: '#facc15',
                      weight: 2,
                      opacity: 0.85,
                      dashArray: '6 8',
                      interactive: true,
                    }}
                    eventHandlers={{
                      click: () => handleFrontClick(front.id),
                    }}
                  />
                )
              })}

            <Polyline
              pane="front-line"
              positions={front.paddedPath}
              pathOptions={{
                color: front.color,
                weight: selectedFrontId === front.id ? 8 : 6,
                opacity: 0.95,
                dashArray:
                  front.state === 'advancing'
                    ? '0'
                    : front.state === 'stalled' || front.state === 'regrouping'
                      ? '4 8'
                      : '1 12',
                lineJoin: 'round',
                lineCap: 'round',
                interactive: true,
              }}
              eventHandlers={{
                click: () => handleFrontClick(front.id),
                dblclick: () => handleFrontDoubleClick(front.id),
              }}
            />

            {front.labelPosition && (
              <Marker
                pane="front-label"
                position={[front.labelPosition.lat, front.labelPosition.lng]}
                icon={getFrontBadgeIcon(front, selectedFrontId === front.id)}
                eventHandlers={{
                  click: () => handleFrontClick(front.id),
                  dblclick: () => handleFrontDoubleClick(front.id),
                }}
              >
                <Popup>
                  <div className="front-popup">
                    <h3>{front.name}</h3>
                    <p>Цель: {front.objective}</p>
                    <p>Прогресс: {Math.round(front.progress * 100)}%</p>
                    <p>Готовность: {Math.round(front.readiness)}%</p>
                    <p>Снабжение: {Math.round(front.supply)}%</p>
                    <p>Потери: {Math.round(front.reportedLosses)} чел.</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </Fragment>
        ))}

        {divisions.map((division) => {
          if (!division.displayPosition) {
            return null
          }

          const position = [division.displayPosition.lat, division.displayPosition.lng]
          const icon = getDivisionIcon(division, selectedDivisionId === division.id)

          return (
            <Marker
              key={division.id}
              pane="division-marker"
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => onSelectDivision?.(division.id),
              }}
            >
              <Popup>
                <div className="division-popup">
                  <h3>{division.name}</h3>
                  <p>
                    <strong>{division.faction === 'enemy' ? 'Противник' : 'Наши войска'}</strong>
                  </p>
                  <p>Тип: {division.type === 'armor' ? 'Танковая' : 'Пехотная'}</p>
                  <p>Боеспособность: {Math.round(division.strength)}%</p>
                  <p>Организация: {Math.round(division.organization)}</p>
                  {division.assignment && <p>Фронт: {division.assignment.frontId.toUpperCase()}</p>}
                  {division.status && <p>Статус: {statusLabel[division.status] ?? division.status}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      <div className="map-overlay-gradient" aria-hidden="true" />
      <div className="map-strips" aria-hidden="true" />
    </div>
  )
}

export default MapView
