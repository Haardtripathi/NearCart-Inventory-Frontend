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

// Reverse-geocoding a pin drop still goes through the classic (non-deprecated) Geocoder class —
// only the *search-to-jump* box below was on the deprecated Autocomplete widget.
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

// Same shape as parseAddressComponents above, but for the New Places API's AddressComponent
// (longText/types instead of GeocoderAddressComponent's long_name/types) — returned by
// Place.fetchFields() when a search suggestion is selected below.
function parseNewAddressComponents(components: google.maps.places.AddressComponent[]): ResolvedAddress {
  const find = (type: string) => components.find((component) => component.types.includes(type))?.longText ?? undefined

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
 *
 * MIGRATED 2026-08-20 off the deprecated `google.maps.places.Autocomplete` widget onto the New
 * Places API's `AutocompleteSuggestion.fetchAutocompleteSuggestions()` + a small hand-rolled
 * dropdown. Root-cause note: live-testing against the real `VITE_GOOGLE_MAPS_API_KEY` found the
 * classic widget's underlying `AutocompletionService.GetPredictions` REST call blocked outright
 * (`ApiTargetBlockedMapError`) — and critically, the classic `Autocomplete` widget has no error
 * hook, so a blocked/failed request left the search box looking "hung": the user types, nothing
 * ever happens, no dropdown, no error, indistinguishable from the app being stuck. The New API's
 * `AutocompleteSuggestion` call is a plain awaitable promise, so a failure can (and now does)
 * surface as a real inline message instead of silent nothing. NOTE: as of this fix, the New
 * Places API's programmatic `AutocompletePlaces` RPC is *also* returning 403 "Requests to this
 * API ... are blocked" for this specific key — confirmed live, not fixable from this codebase.
 * That means the search box will keep showing the new "Location search is unavailable" message
 * until whoever owns the Google Cloud Console project enables **Places API (New)** for
 * `VITE_GOOGLE_MAPS_API_KEY` (the same key `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in mobile's `.env`
 * reuses) — currently only the Maps JavaScript API looks enabled for it. The map itself, click-
 * to-place, and drag-the-pin all work today regardless (those only need the Maps JavaScript API
 * + Geocoding API, both already enabled) — this migration's value is real even before that
 * Console change lands, because it turns a silent hang into a clear, actionable message.
 */
export function LocationPickerMap({ latitude, longitude, onLocationChange, label }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const onLocationChangeRef = useRef(onLocationChange)
  onLocationChangeRef.current = onLocationChange

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectSuggestionRef = useRef<((prediction: google.maps.places.PlacePrediction) => void) | null>(null)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'error'>('idle')
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

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

        const selectSuggestion = (prediction: google.maps.places.PlacePrediction) => {
          if (cancelled) return
          setSuggestions([])
          if (searchInputRef.current) searchInputRef.current.value = prediction.text.text
          // A session concludes once fetchFields is called — drop the token so the next search
          // starts a fresh (correctly billed) session rather than reusing a spent one.
          sessionTokenRef.current = null

          const place = prediction.toPlace()
          place
            .fetchFields({ fields: ['location', 'addressComponents', 'displayName'] })
            .then(({ place: fullPlace }) => {
              if (cancelled || !fullPlace.location) return
              // Bug fix: google.maps.LatLng's `lat`/`lng` are METHODS, not plain number
              // properties — this was assigning the function references themselves into
              // `position.lat`/`position.lng` instead of calling them, so `map.panTo()` and the
              // onLocationChange callback below received functions where a number was expected
              // (caught by `tsc -b`, which was not being run in CI/dev for this project until
              // this sweep). Concretely: search-and-select in the location picker would silently
              // fail to pan the map and would hand the parent form a non-numeric
              // latitude/longitude, which — for the branch location picker this component backs —
              // could persist garbage coordinates for a branch.
              const position = { lat: fullPlace.location.lat(), lng: fullPlace.location.lng() }
              map.panTo(position)
              map.setZoom(17)
              placeMarker(position)
              const address = fullPlace.addressComponents ? parseNewAddressComponents(fullPlace.addressComponents) : null
              onLocationChangeRef.current({ latitude: position.lat, longitude: position.lng }, address)
            })
            .catch(() => {
              if (!cancelled) setSearchError("Couldn't load that location. Click the map or drag the pin instead.")
            })
        }
        selectSuggestionRef.current = selectSuggestion

        if (searchInputRef.current && maps.maps.places?.AutocompleteSuggestion) {
          const handleInput = () => {
            const query = searchInputRef.current?.value.trim() ?? ''
            if (debounceRef.current) clearTimeout(debounceRef.current)

            if (!query) {
              setSuggestions([])
              setSearchError(null)
              return
            }

            debounceRef.current = setTimeout(() => {
              if (!sessionTokenRef.current) {
                sessionTokenRef.current = new maps.maps.places.AutocompleteSessionToken()
              }
              const mapCenter = map.getCenter()

              maps.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: query,
                sessionToken: sessionTokenRef.current,
                locationBias: mapCenter ? { radius: 50_000, center: mapCenter } : undefined,
              })
                .then(({ suggestions: results }) => {
                  if (cancelled) return
                  setSearchError(null)
                  setSuggestions(
                    results
                      .map((result) => result.placePrediction)
                      .filter((prediction): prediction is google.maps.places.PlacePrediction => Boolean(prediction)),
                  )
                })
                .catch(() => {
                  if (cancelled) return
                  setSuggestions([])
                  setSearchError('Location search is unavailable right now. Click the map or drag the pin instead.')
                })
            }, 300)
          }

          searchInputRef.current.addEventListener('input', handleInput)
        }

        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
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
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for the shop's location…"
              aria-label={label ?? 'Search for a location'}
              disabled={status !== 'ready'}
              autoComplete="off"
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm outline-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 disabled:opacity-60"
            />
            {suggestions.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-md">
                {suggestions.map((prediction) => (
                  <li key={prediction.placeId}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => selectSuggestionRef.current?.(prediction)}
                    >
                      {prediction.text.text}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            ref={mapContainerRef}
            className="h-64 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"
            role="application"
            aria-label={label ?? 'Location picker map'}
          />
          {searchError ? (
            <p className="text-xs text-amber-600">{searchError}</p>
          ) : (
            <p className="text-xs text-slate-500">
              {status === 'loading' ? 'Loading map…' : 'Search above, click the map, or drag the pin to set the exact location. Address fields below fill in automatically — you can still edit them by hand.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
