import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/AppBar.jsx'
import { startSession } from '../lib/api.js'
import { STORES, getStoreById } from '../lib/stores.js'

// ─── Utility Functions ─────────────────────────────────────────────────────────

/** Haversine formula — returns distance in km */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Ray-casting point-in-polygon — polygon is array of {lat, lng} */
function isPointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat,
      yi = polygon[i].lng
    const xj = polygon[j].lat,
      yj = polygon[j].lng
    const intersect =
      yi > point.lng !== yj > point.lng &&
      point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Format km distance to human-readable string */
function formatDistance(km) {
  if (km === null || km === undefined) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/** Check if user can start session at a store (geofencing) */
function canStartSession(store, userLocation) {
  if (!store.boundary) return true           // no boundary defined → always allowed
  if (!userLocation) return true             // no GPS → allow (graceful fallback)
  return isPointInPolygon(userLocation, store.boundary)
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ConfirmStore() {
  const navigate = useNavigate()
  const [location, setLocation] = useState(null)
  const [locStatus, setLocStatus] = useState('loading') // 'loading' | 'granted' | 'denied'
  const [selectedStore, setSelectedStore] = useState(null)
  const [starting, setStarting] = useState(false)

  // Get user GPS location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('granted')
      },
      (_err) => {
        console.log('Location denied or unavailable')
        setLocStatus('denied')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    const savedStoreId = localStorage.getItem('selectedStoreId')
    if (!savedStoreId) return
    const savedStore = getStoreById(savedStoreId)
    if (savedStore) setSelectedStore(savedStore)
  }, [])

  // Sort stores by distance (nearest first)
  const sortedStores = STORES.map((store) => {
    const dist = location
      ? calculateDistance(location.lat, location.lng, store.coordinates.lat, store.coordinates.lng)
      : null
    return { ...store, distance: dist }
  }).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))

  function handleSelectStore(store) {
    setSelectedStore(store)
    localStorage.setItem('selectedStoreId', store.id)
  }

  async function handleStartSession() {
    if (!selectedStore) return

    // Geofence check
    if (!canStartSession(selectedStore, location)) {
      alert(
        `You must be inside ${selectedStore.name} to start a session.\n\nPlease enter the store and try again.`
      )
      return
    }

    setStarting(true)
    try {
      await startSession({ storeId: selectedStore.id })
    } catch {
      // Backend may not be running locally — proceed anyway
    }
    localStorage.setItem('selectedStoreId', selectedStore.id)
    navigate('/scan')
  }

  const TimerIcon = (
    <button
      aria-label="Session timer"
      className="text-primary hover:opacity-75 transition-opacity p-1"
    >
      <span className="material-symbols-outlined">timer</span>
    </button>
  )

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <AppBar rightSlot={TimerIcon} />

      <main className="flex-grow flex flex-col max-w-md mx-auto w-full px-5 pt-8 pb-32">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-black text-3xl tracking-tighter text-on-surface mb-1">
            Select Your Store
          </h1>
          <p className="text-on-surface-variant text-sm">
            {locStatus === 'loading' && 'Detecting your location…'}
            {locStatus === 'granted' && 'Sorted by distance from you'}
            {locStatus === 'denied' && 'GPS unavailable — select manually'}
          </p>
        </div>

        {/* GPS status pill */}
        <div className="flex justify-center mb-6">
          {locStatus === 'loading' && (
            <div className="flex items-center gap-2 py-2 px-4 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Detecting location…
            </div>
          )}
          {locStatus === 'granted' && (
            <div className="flex items-center gap-2 py-2 px-4 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                my_location
              </span>
              GPS active — nearest store first
            </div>
          )}
          {locStatus === 'denied' && (
            <div className="flex items-center gap-2 py-2 px-4 bg-surface-container-low border border-outline-variant rounded-full text-on-surface-variant text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">location_off</span>
              Manual selection mode
            </div>
          )}
        </div>

        {/* Store cards */}
        <div className="space-y-4 mb-6">
          {sortedStores.map((store, idx) => {
            const isSelected = selectedStore?.id === store.id
            const distLabel = formatDistance(store.distance)
            const insideStore =
              location && store.boundary
                ? isPointInPolygon(location, store.boundary)
                : false

            return (
              <div
                key={store.id}
                id={`store-card-${store.id}`}
                onClick={() => handleSelectStore(store)}
                className={`
                  relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-outline-variant bg-surface-container-low hover:border-primary/40 hover:shadow-md'
                  }
                `}
              >
                {/* Top row: nearest badge + distance + inside-store badge */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    {idx === 0 && locStatus === 'granted' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-on-primary px-2 py-0.5 rounded-full">
                        Nearest
                      </span>
                    )}
                    {distLabel && (
                      <span className="flex items-center gap-1 text-on-surface-variant text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          location_on
                        </span>
                        {distLabel} away
                      </span>
                    )}
                  </div>
                  {insideStore && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Inside Store
                    </span>
                  )}
                </div>

                {/* Store info */}
                <div className="px-5 pb-2">
                  <h2 className="font-bold text-base text-on-surface leading-tight">{store.name}</h2>
                  <p className="text-on-surface-variant text-xs mt-0.5">{store.address}</p>
                </div>

                {/* Hours & phone */}
                <div className="px-5 pb-3 flex items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {store.hours}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">call</span>
                    {store.phone}
                  </span>
                </div>

                {/* Feature pills */}
                <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                  {store.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-medium bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant border border-outline-variant"
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>

                {/* Select button */}
                <div className="px-5 pb-4">
                  <button
                    id={`select-store-btn-${store.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectStore(store)
                    }}
                    className={`
                      w-full h-10 rounded-xl text-sm font-bold transition-all
                      ${isSelected
                        ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                        : 'bg-surface-container border border-outline-variant text-on-surface hover:border-primary/60'
                      }
                    `}
                  >
                    {isSelected ? '✓ Selected' : 'Select Store'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Start Session CTA */}
        {selectedStore && (
          <div className="space-y-2 animate-fade-in">
            <button
              id="start-shopping-btn"
              onClick={handleStartSession}
              disabled={starting}
              className="w-full h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-extrabold text-lg rounded-xl shadow-lg shadow-primary/20 active:scale-[0.96] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {starting ? (
                <>
                  <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  Start Shopping at {selectedStore.name.split(' ').slice(0, 2).join(' ')}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>

            {/* Geofence warning for stores with boundary */}
            {selectedStore.boundary && !isPointInPolygon(location || { lat: 0, lng: 0 }, selectedStore.boundary) && location && (
              <p className="text-center text-xs text-amber-600 font-medium">
                ⚠ You appear to be outside this store's boundary.
                You must enter the store premises to start shopping.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
