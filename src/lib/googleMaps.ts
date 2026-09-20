// Lazily loads the Google Maps JS API (core + places + marker + geocoding libraries) exactly
// once, however many components on the page need it (the Branches page's location picker today;
// any future "shop location" surface can reuse this same loader). Returns null immediately,
// without touching the DOM, when no key is configured — every caller must treat that as "map
// picker unavailable, fall back to manual entry" rather than erroring.
let loaderPromise: Promise<typeof google | null> | null = null;

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
}

// The libraries LocationPickerMap.tsx actually touches (google.maps.Map/Marker/Geocoder live in
// "maps"; AdvancedMarkerElement lives in "marker"; Autocomplete lives in "places"; Geocoder's
// request/response types plus the class itself are documented under "geocoding" too — importing
// it explicitly costs nothing and avoids relying on "maps" happening to re-export it).
const REQUIRED_LIBRARIES = ["maps", "marker", "places", "geocoding"] as const;

function isFullyLoaded(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.google?.maps?.importLibrary === "function" &&
    typeof window.google.maps.Map === "function"
  );
}

export function loadGoogleMaps(): Promise<typeof google | null> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return Promise.resolve(null);
  }

  if (isFullyLoaded()) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = (async () => {
    // Google's official dynamic-library-import bootstrap loader (verbatim, see
    // https://developers.google.com/maps/documentation/javascript/load-maps-js-api) — this is
    // what defines `google.maps.importLibrary`, the only reliable signal that a given library's
    // classes are actually ready to construct.
    //
    // ROOT CAUSE (found + fixed 2026-08-20, live-reproduced against the real API key): this file
    // used to append a plain `<script src="...&loading=async">` tag and resolve the very instant
    // that tag's own `load` event fired. With `loading=async`, that event fires once the small
    // bootstrap file has downloaded — NOT once the requested libraries (maps/places/marker) have
    // finished their own follow-up chunk loads. `loading=async` is only meant to be paired with
    // this inline loader + explicit `importLibrary()` calls; a bare `<script src>` tag violates
    // that contract. The result was a genuine race: `new google.maps.Map(...)` (called
    // synchronously the instant the promise resolved) threw `TypeError: ... Map is not a
    // constructor` almost every time in dev (React StrictMode's double-effect-invoke made the
    // timing worse, but this reproduced even outside StrictMode with the right network timing) —
    // surfacing to shop owners as "Couldn't load the map. You can still enter the address and
    // coordinates manually below." on the branch-location picker, indistinguishable from a real
    // key/billing failure. Explicitly awaiting `importLibrary` for every library this codebase
    // touches guarantees `google.maps.Map`/`google.maps.places.Autocomplete`/
    // `google.maps.marker.AdvancedMarkerElement`/`google.maps.Geocoder` are all real constructors
    // before this promise ever resolves.
    /* eslint-disable */
    (g => {
      var h: any, a: any, k: string, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b: any = window;
      b = b[c] || (b[c] = {});
      const d = b.maps || (b.maps = {});
      const r = new Set<string>();
      const e = new URLSearchParams();
      const u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          a = m.createElement("script");
          e.set("libraries", [...r] + "");
          for (k in g) e.set(k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()), (g as any)[k]);
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => (h = n(Error(p + " could not load.")));
          // Bug fix: `querySelector` with an attribute-selector string types its result as the
          // generic `Element`, which has no `.nonce` — that property only exists on
          // `HTMLScriptElement`. This was a real `tsc -b` failure (not just a lint nit), just not
          // one anyone had run against this file — cast to the actual runtime type (any element
          // this selector can match is a `<script>` tag).
          a.nonce = (m.querySelector("script[nonce]") as HTMLScriptElement | null)?.nonce || "";
          m.head.append(a);
        }));
      d[l] ? console.warn(p + " only loads once. Ignoring:", g) : (d[l] = (f: string, ...n: unknown[]) => r.add(f) && u().then(() => d[l](f, ...n)));
    })({ key: apiKey, v: "weekly" });
    /* eslint-enable */

    await Promise.all(REQUIRED_LIBRARIES.map((lib) => window.google.maps.importLibrary(lib)));

    return window.google ?? null;
  })();

  // A rejected promise cached in `loaderPromise` would be handed to every future caller for the
  // lifetime of the page, so one transient failure (offline for a moment, a blocked request, a
  // slow chunk) would permanently disable the map picker until a full reload — the user would
  // keep seeing "Couldn't load the map" with no way to retry short of refreshing. Clearing the
  // cached promise on failure lets the next mount genuinely try again, while a success stays
  // cached exactly as before. The rejection is still propagated to the caller that triggered it.
  loaderPromise = loaderPromise.catch((error: unknown) => {
    loaderPromise = null;
    throw error;
  });

  return loaderPromise;
}
