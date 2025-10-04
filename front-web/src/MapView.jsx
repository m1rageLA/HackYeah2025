import { useCallback, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const reports = [
  {
    id: 1,
    lat: 52.2297,
    lng: 21.0145,
    title: 'Warsaw Logistics Hub',
    city: 'Warszawa',
    incident: 'Ludzie z bronią',
    weaponType: 'Ciężki sprzęt',
    lastSeen: '30 minut temu',
    note: 'Konwój ustawiony w pobliżu wschodniej drogi serwisowej. Jednostki lokalne zgłaszają ciężki sprzęt i uzbrojony personel.',
    services: ['Policja', 'Straż Pożarna'],
  },
  {
    id: 2,
    lat: 51.0647,
    lng: 19.945,
    title: 'Old Town Transit Depot',
    city: 'Kraków',
    incident: 'Ludzie z bronią',
    weaponType: 'Ciężki sprzęt',
    lastSeen: '30 minut temu',
    note: 'Cywile zgłaszają kolumnę opancerzoną przemieszczającą się w pobliżu infrastruktury tramwajowej. Tłumy pozostają w schronieniu.',
    services: ['Policja', 'Straż Pożarna'],
  },
  {
    id: 3,
    lat: 51.1079,
    lng: 17.0385,
    title: 'Industrial Perimeter Gate',
    city: 'Wrocław',
    incident: 'Ludzie z bronią',
    weaponType: 'Ciężki sprzęt',
    lastSeen: '30 minut temu',
    note: 'Dron zwiadowczy potwierdził obecność opancerzonych pojazdów utrzymujących pozycję przy zachodniej bramie załadunkowej.',
    services: ['Policja', 'Straż Pożarna'],
  },
]

const mapCenter = [52.069167, 19.480556]
const mapZoom = 7

function MeasureController({ isMeasuring, onUpdatePoints }) {
  const map = useMapEvents({
    click(event) {
      if (!isMeasuring) {
        return
      }

      const sourceClassName = event.propagatedFrom?.options?.className
      if (typeof sourceClassName === 'string' && sourceClassName.includes('incident-marker')) {
        return
      }

      const originalTarget = event.originalEvent?.target
      if (originalTarget && originalTarget.closest('.incident-marker')) {
        return
      }

      onUpdatePoints((prev) => {
        if (prev.length === 0) {
          return [event.latlng]
        }
        if (prev.length === 1) {
          return [prev[0], event.latlng]
        }
        return [event.latlng]
      })
    },
  })

  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = isMeasuring ? 'crosshair' : ''

    return () => {
      container.style.cursor = ''
    }
  }, [map, isMeasuring])

  useEffect(() => {
    if (!isMeasuring) {
      onUpdatePoints([])
    }
  }, [isMeasuring, onUpdatePoints])

  return null
}

function MapView({ isMeasuring, onMeasurementChange, onDispatchRequest }) {
  const [measurePoints, setMeasurePoints] = useState([])

  useEffect(() => {
    if (!isMeasuring) {
      setMeasurePoints([])
    }
  }, [isMeasuring])

  const measurement = useMemo(() => {
    if (measurePoints.length === 0) {
      return null
    }

    if (measurePoints.length === 1) {
      return {
        distance: null,
        points: measurePoints.map((point) => ({ lat: point.lat, lng: point.lng })),
      }
    }

    const [start, end] = measurePoints
    const startLatLng = L.latLng(start.lat, start.lng)
    const endLatLng = L.latLng(end.lat, end.lng)

    return {
      distance: startLatLng.distanceTo(endLatLng),
      points: measurePoints.map((point) => ({ lat: point.lat, lng: point.lng })),
    }
  }, [measurePoints])

  useEffect(() => {
    onMeasurementChange(measurement)
  }, [measurement, onMeasurementChange])

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

  const midpoint = useMemo(() => {
    if (measurePoints.length === 2) {
      return L.latLngBounds(measurePoints[0], measurePoints[1]).getCenter()
    }

    return null
  }, [measurePoints])

  const measurementStatus = useMemo(() => {
    if (isMeasuring) {
      if (!measurement) {
        return 'Укажите начальную точку на карте, чтобы начать замер.'
      }

      if (measurement.distance == null) {
        return 'Выберите точку назначения, чтобы завершить замер.'
      }

      return `Дистанция: ${formattedDistance}`
    }

    if (measurement && measurement.distance != null) {
      return `Последний замер: ${formattedDistance}`
    }

    return 'Откройте точку, чтобы увидеть сводку, или включите линейку для планирования маршрута.'
  }, [formattedDistance, isMeasuring, measurement])

  const distanceIcon = useMemo(() => {
    if (!midpoint || !formattedDistance) {
      return null
    }

    return L.divIcon({
      className: 'distance-label',
      html: `<span>${formattedDistance}</span>`,
      iconSize: [0, 0],
    })
  }, [formattedDistance, midpoint])

  const handleDispatch = useCallback(
    (report, service) => {
      onDispatchRequest?.(report, service)
    },
    [onDispatchRequest],
  )

  return (
    <div className="map-wrapper">
      <MapContainer center={mapCenter} zoom={mapZoom} className="map-container" zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        <ZoomControl position="topright" />

        <MeasureController isMeasuring={isMeasuring} onUpdatePoints={setMeasurePoints} />

        {measurePoints.length > 0 && (
          <CircleMarker
            center={measurePoints[0]}
            radius={6}
            pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 1 }}
          />
        )}

        {measurePoints.length === 2 && (
          <>
            <CircleMarker
              center={measurePoints[1]}
              radius={6}
              pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 1 }}
            />
            <Polyline
              positions={measurePoints}
              pathOptions={{ color: '#22d3ee', weight: 3, dashArray: '8 6', opacity: 0.85 }}
            />
          </>
        )}

        {midpoint && distanceIcon && (
          <Marker position={midpoint} icon={distanceIcon} interactive={false} />
        )}

        {reports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.lat, report.lng]}
            radius={12}
            className="incident-marker"
            pathOptions={{ color: '#f87171', fillColor: '#f87171', fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="popup-card">
                <p className="popup-meta">{report.city}</p>
                <h3>{report.title}</h3>
                <div className="popup-details">
                  <div className="popup-detail">
                    <span>Какой инцидент</span>
                    <p>{report.incident}</p>
                  </div>
                  <div className="popup-detail">
                    <span>Тип оружия</span>
                    <p>{report.weaponType}</p>
                  </div>
                  <div className="popup-detail">
                    <span>Когда видели последний раз</span>
                    <p>{report.lastSeen}</p>
                  </div>
                </div>
                <p className="popup-note">{report.note}</p>
                <div className="popup-actions">
                  <span>Направить в</span>
                  <div className="popup-action-buttons">
                    {report.services.map((service) => (
                      <button
                        key={service}
                        className="popup-action-button"
                        type="button"
                        onClick={() => handleDispatch(report, service)}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="map-tint" aria-hidden="true" />
      <div className="map-status">{measurementStatus}</div>
    </div>
  )
}

export default MapView
