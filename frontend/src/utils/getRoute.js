// utils/getRoute.js

// Nominatim Geocoding (Free OSM Geocoder)
export async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  if (data.length === 0) throw new Error(`Could not find location: ${query}`)
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name
  }
}

export async function getRoute(origin, destination) {
  if (!origin || !destination) throw new Error('Origin and destination are required')

  const url = `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson&steps=false`

  const res = await fetch(url)
  if (!res.ok) throw new Error('OSRM request failed')

  const data = await res.json()
  const route = data.routes[0]

  // GeoJSON coords are [lng, lat] — Leaflet needs [lat, lng]
  const polyline = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  
  // Ensure the line starts and ends exactly at the markers
  if (polyline.length > 0) {
    polyline.unshift([origin.lat, origin.lng])
    polyline.push([destination.lat, destination.lng])
  }

  const distanceKm = Math.round(route.distance / 1000)
  const durationMin = Math.round(route.duration / 60)

  return { polyline, distanceKm, durationMin, origin, destination }
}

export function calculateFare(distanceKm, passengerCount) {
  const BASE_PRICE = 100
  const PER_KM_RATE = 20
  const total = BASE_PRICE + Math.round(distanceKm * PER_KM_RATE)
  const perPerson = Math.round(total / (passengerCount || 1))
  return { total, perPerson, base: BASE_PRICE, kmRate: PER_KM_RATE }
}
