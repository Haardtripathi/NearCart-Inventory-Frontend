import { useEffect, useRef, useState } from 'react'

import { getGoogleMapsApiKey, loadGoogleMaps } from '@/lib/googleMaps'

export interface ResolvedAddress {
  addressLine1?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

interface LocationPickerMapProps {
  latitude?: number | null
  longitude?: number | null
  onLocationChange: (coords: { latitude: number; longitude: number }, address: ResolvedAddress | null) => void
  /** Shown while the SDK loads and as an a11y label; keep short. */
  label?: string
}

// Roughly the centroid of India — just a sane default viewport before a shop owner has picked (or
// typed) any location; never persisted anywhere on its own.
const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 }

function parseAddressComponents(components: google.maps.GeocoderAddressComponent[]): ResolvedAddress {
  const find = (type: string) => components.find((component) => component.types.includes(type))?.long_name

  const streetNumber = find('street_number')
  const route = find('route')
  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || undefined

  return {
    addressLine1,
    city: find('locality') ?? find('postal_town') ?? find('sublocality_level_1'),
    state: find('administrative_area_level_1'),
    country: find('country'),
    postalCode: find('postal_code'),
  }
}

/**
 * Draggable-pin map + search-to-jump (Places Autocomplete), always paired with manual address
 * fields elsewhere on the form (see BranchesPage.tsx) — this component only ever *offers* to fill
 * those fields via reverse-geocoding a pin drop, it never replaces them. Renders nothing (not even
 * an error state) when VITE_GOOGLE_MAPS_API_KEY is unset, so the surrounding form's manual fields
 * are the only path in that case.
 */
export function LocationPickerMap({ latitude, longitude, onLocationChange, label }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const onLocationChangeRef = useRef(onLocationChange)
  onLocationChangeRef.current = onLocationChange

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'error'>('idle')

  useEffect(() => {
    if (!getGoogleMapsApiKey()) {
      setStatus('unavailable')
      return
    }

    let cancelled = false
    setStatus('loading')

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !maps || !mapContainerRef.current) {
          if (!maps) setStatus('unavailable')
          return
        }

        const center =
          typeof latitude === 'number' && typeof longitude === 'number' ? { lat: latitude, lng: longitude } : DEFAULT_CENTER

        const map = new maps.maps.Map(mapContainerRef.current, {
          center,
          zoom: typeof latitude === 'number' ? 16 : 5,
          mapId: 'NEARCART_INVENTORY_LOCATION_PICKER',
          streetViewControl: false,
          fullscreenControl: false,
        })
        mapRef.current = map
        geocoderRef.current = new maps.maps.Geocoder()

        const placeMarker = (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
          if (markerRef.current) {
            if ('position' in markerRef.current) {
              markerRef.current.position = position
            } else {
              ;(markerRef.current as google.maps.Marker).setPosition(position)
            }
            return
          }

          if (maps.maps.marker?.AdvancedMarkerElement) {
            const marker = new maps.maps.marker.AdvancedMarkerElement({
              map,
              position,
              gmpDraggable: true,
            })
            marker.addListener('dragend', () => {
              const pos = marker.position as google.maps.LatLng | null
              if (pos) reverseGeocodeAndEmit(pos)
            })
            markerRef.current = marker
          } else {
            const marker = new maps.maps.Marker({ map, position, draggable: true })
            marker.addListener('dragend', () => {
              const pos = marker.getPosition()
              if (pos) reverseGeocodeAndEmit(pos)
            })
            markerRef.current = marker
          }
        }

        const reverseGeocodeAndEmit = (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
          const lat = typeof (position as google.maps.LatLng).lat === 'function' ? (position as google.maps.LatLng).lat() : (position as google.maps.LatLngLiteral).lat
          const lng = typeof (position as google.maps.LatLng).lng === 'function' ? (position as google.maps.LatLng).lng() : (position as google.maps.LatLngLiteral).lng

          geocoderRef.current?.geocode({ location: { lat, lng } }, (results, geocodeStatus) => {
            const address =
              geocodeStatus === 'OK' && results && results[0] ? parseAddressComponents(results[0].address_components) : null
            onLocationChangeRef.current({ latitude: lat, longitude: lng }, address)
          })
        }

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return
          placeMarker(event.latLng)
          map.panTo(event.latLng)
          reverseGeocodeAndEmit(event.latLng)
        })

        if (typeof latitude === 'number' && typeof longitude === 'number') {
          placeMarker({ lat: latitude, lng: longitude })
        }

        if (searchInputRef.current && maps.maps.places) {
          const autocomplete = new maps.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'address_components', 'name'],
          })
          autocomplete.bindTo('bounds', map)
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place.geometry?.location) return

            map.panTo(place.geometry.location)
            map.setZoom(17)
            placeMarker(place.geometry.location)

            const address = place.address_components ? parseAddressComponents(place.address_components) : null
            onLocationChangeRef.current(
              { latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng() },
              address,
            )
          })
        }

        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // Intentionally only re-running the SDK/map bootstrap once on mount — lat/lng updates from
    // parent re-renders (e.g. after reverse-geocode fills the form) shouldn't tear the map down
    // and recreate it, they're already reflected by the marker placement calls above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'unavailable') {
    return null
  }

  return (
    <div className="space-y-2">
      {status === 'error' ? (
        <p className="text-sm text-red-600">Couldn't load the map. You can still enter the address and coordinates manually below.</p>
      ) : (
        <>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for the shop's location…"
            aria-label={label ?? 'Search for a location'}
            disabled={status !== 'ready'}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm outline-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 disabled:opacity-60"
          />
          <div
            ref={mapContainerRef}
            className="h-64 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"
            role="application"
            aria-label={label ?? 'Location picker map'}
          />
          <p className="text-xs text-slate-500">
            {status === 'loading' ? 'Loading map…' : 'Search above, click the map, or drag the pin to set the exact location. Address fields below fill in automatically — you can still edit them by hand.'}
          </p>
        </>
      )}
    </div>
  )
}
