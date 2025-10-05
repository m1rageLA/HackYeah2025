import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

function MapView({
  reports = [],
  isMeasuring,
  onMeasurementChange,
  onDispatchRequest,
  selectedReportId = null,
  onSelectReport,
}) {
  const [measurePoints, setMeasurePoints] = useState([])
  const mapRef = useRef(null)
  const markerRefs = useRef(new Map())

  useEffect(() => {
    if (!isMeasuring) {
      setMeasurePoints([])
    }
  }, [isMeasuring])

  const mapReports = useMemo(() => {
    if (!Array.isArray(reports)) {
      return []
    }

    return reports.filter((report) => Number.isFinite(report.lat) && Number.isFinite(report.lng))
  }, [reports])

  const selectedReport = useMemo(() => {
    if (!selectedReportId) {
      return null
    }

    return mapReports.find((report) => report.id === selectedReportId) ?? null
  }, [mapReports, selectedReportId])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    if (!selectedReport) {
      mapRef.current.closePopup()
      return
    }

    const focusMarker = (marker) => {
      const targetLatLng = marker.getLatLng()
      const currentZoom = mapRef.current?.getZoom() ?? mapZoom
      const targetZoom = Math.max(currentZoom, 11)

      mapRef.current?.flyTo(targetLatLng, targetZoom, { duration: 0.6 })
      marker.openPopup()
    }

    const marker = markerRefs.current.get(selectedReport.id)
    if (marker) {
      focusMarker(marker)
      return
    }

    mapRef.current.closePopup()
    const animationId = requestAnimationFrame(() => {
      if (!mapRef.current || !selectedReport) {
        return
      }

      const nextMarker = markerRefs.current.get(selectedReport.id)
      if (nextMarker) {
        focusMarker(nextMarker)
      }
    })

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [selectedReport])

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

  const handleMapCreated = useCallback((mapInstance) => {
    mapRef.current = mapInstance
  }, [])

  const measurementStatus = useMemo(() => {
    if (isMeasuring) {
      if (!measurement) {
        return 'Wskaż punkt początkowy na mapie, aby rozpocząć pomiar.'
      }

      if (measurement.distance == null) {
        return 'Wybierz punkt docelowy, aby zakończyć pomiar.'
      }

      return `Dystans: ${formattedDistance}`
    }

    if (measurement && measurement.distance != null) {
      return `Ostatni pomiar: ${formattedDistance}`
    }

    return 'Otwórz zgłoszenie, aby zobaczyć szczegóły, albo włącz linijkę, by zaplanować trasę.'
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
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="map-container"
        zoomControl={false}
        whenCreated={handleMapCreated}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap współtwórcy &copy; CARTO"
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

        {mapReports.map((report) => {
          const priorityColor = report.priorityColor ?? '#f87171'
          const isSelected = selectedReport?.id === report.id

          return (
            <CircleMarker
              key={report.id}
              center={[report.lat, report.lng]}
              radius={isSelected ? 14 : 12}
              className={`incident-marker${isSelected ? ' incident-marker-selected' : ''}`}
              pathOptions={{
                color: priorityColor,
                fillColor: priorityColor,
                fillOpacity: isSelected ? 1 : 0.9,
                opacity: isSelected ? 1 : 0.95,
                weight: isSelected ? 3 : 2,
              }}
              ref={(layer) => {
                if (!layer) {
                  markerRefs.current.delete(report.id)
                } else {
                  markerRefs.current.set(report.id, layer)
                }
              }}
              eventHandlers={{
                click: () => onSelectReport?.(report.id),
              }}
            >
              <Popup>
                <div className="popup-card">
                  <p className="popup-meta">{report.city}</p>
                  <h3>{report.title}</h3>
                  <div className="popup-details">
                    <div className="popup-detail">
                      <span>Rodzaj incydentu</span>
                      <p>{report.incident}</p>
                    </div>
                    <div className="popup-detail">
                      <span>Ostatnia obserwacja</span>
                      <p>{report.lastSeen}</p>
                    </div>
                  </div>
                  <p className="popup-note">{report.note}</p>
                  <div className="popup-actions">
                    <span>Skieruj do</span>
                    <div className="popup-action-buttons">
                      {report.services.length > 0 ? (
                        report.services.map((service) => (
                          <button
                            key={service}
                            className="popup-action-button"
                            type="button"
                            onClick={() => handleDispatch(report, service)}
                          >
                            {service}
                          </button>
                        ))
                      ) : (
                        <span className="popup-action-placeholder">Brak sugerowanych służb</span>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="map-tint" aria-hidden="true" />
      <div className="map-status">{measurementStatus}</div>
    </div>
  )
}

export default MapView
