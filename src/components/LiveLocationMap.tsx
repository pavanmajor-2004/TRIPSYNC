import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { TripLocation } from '../types/location'

// Leaflet's default marker icon paths break under bundlers like Vite;
// point them at the icon assets bundled from the installed package.
// @ts-expect-error - _getIconUrl exists at runtime but isn't in Leaflet's types
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const STALE_THRESHOLD_MS = 5 * 60 * 1000

interface LiveLocationMapProps {
  locations: TripLocation[]
}

function isFresh(location: TripLocation): boolean {
  return Date.now() - location.updatedAt.toMillis() <= STALE_THRESHOLD_MS
}

function LiveLocationMap({ locations }: LiveLocationMapProps) {
  // Only members who are currently sharing are ever shown on the map —
  // a location document with isSharing: false must never be rendered here.
  const sharingLocations = locations.filter((location) => location.isSharing)

  if (sharingLocations.length === 0) {
    return <p>No members are currently sharing their location.</p>
  }

  const center: [number, number] = [
    sharingLocations.reduce((sum, location) => sum + location.latitude, 0) /
      sharingLocations.length,
    sharingLocations.reduce((sum, location) => sum + location.longitude, 0) /
      sharingLocations.length,
  ]

  return (
    <div className="live-location-map">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sharingLocations.map((location) => (
          <Marker
            key={location.userId}
            position={[location.latitude, location.longitude]}
          >
            <Popup>
              <strong>{location.userId}</strong>
              <br />
              {isFresh(location) ? 'Live' : 'Stale (last known location)'}
              <br />
              Last updated: {location.updatedAt.toDate().toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default LiveLocationMap
