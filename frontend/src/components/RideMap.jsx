import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getRoute, calculateFare } from '../utils/getRoute'

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
  }, [bounds, map])
  return null
}

const greenDot = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#1D9E75;border:2.5px solid #fff;box-shadow:0 0 0 4px rgba(29,158,117,0.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

const redPin = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#E24B4A;border:2.5px solid #fff;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '© OpenStreetMap © CARTO'

export default function RideMap({ origin, destination, passengerCount = 1, onRouteLoaded }) {
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!origin || !destination) return

    setLoading(true)
    getRoute(origin, destination)
      .then(data => {
        setRouteData(data)
        setLoading(false)
        if (onRouteLoaded) {
          const { perPerson } = calculateFare(data.distanceKm, passengerCount)
          onRouteLoaded({
            distanceKm: data.distanceKm,
            durationMin: data.durationMin,
            polyline: data.polyline,
            perPerson
          })
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [origin, destination, passengerCount])

  const bounds = routeData ? L.latLngBounds(routeData.polyline) : null

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#1a2035', borderRadius: '12px', overflow: 'hidden' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(26, 32, 53, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, color: '#4FC3F7' }}>
          Calculating routes...
        </div>
      )}

      <MapContainer
        center={[23.25, 77.41]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#1a2035' }}
      >
        <TileLayer url={DARK_TILES} attribution={TILE_ATTRIBUTION} />

        {routeData && (
          <>
            <FitBounds bounds={bounds} />
            <Polyline positions={routeData.polyline} pathOptions={{ color: '#4FC3F7', weight: 4, opacity: 1 }} />
            <Marker position={[routeData.origin.lat, routeData.origin.lng]} icon={greenDot} />
            <Marker position={[routeData.destination.lat, routeData.destination.lng]} icon={redPin} />
          </>
        )}
      </MapContainer>

      {routeData && (
        <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: '#1565C0', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, zIndex: 1000 }}>
          {routeData.distanceKm} km · {routeData.durationMin} min
        </div>
      )}
    </div>
  )
}
