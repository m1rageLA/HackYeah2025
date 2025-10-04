import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const reports = [
  { id: 1, lat: 52.2297, lng: 21.0122, title: 'Warsaw' },
  { id: 2, lat: 50.0647, lng: 19.945, title: 'Krakow' },
  { id: 3, lat: 51.1079, lng: 17.0385, title: 'Wroclaw' },
]

const mapCenter = [52.069167, 19.480556]
const mapZoom = 6

function MapView() {
  return (
    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.lat, report.lng]}
          radius={10}
          pathOptions={{ color: '#d0021b', fillColor: '#d0021b', fillOpacity: 0.85 }}
        >
          <Popup>{report.title}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

export default MapView
