// Lazily loads the Google Maps JS API (core + places + marker libraries) exactly once, however
// many components on the page need it (the Branches page's location picker today; any future
// "shop location" surface can reuse this same loader). Returns null immediately, without touching
// the DOM, when no key is configured — every caller must treat that as "map picker unavailable,
// fall back to manual entry" rather than erroring.
let loaderPromise: Promise<typeof google | null> | null = null;

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
}

export function loadGoogleMaps(): Promise<typeof google | null> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return Promise.resolve(null);
  }

  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-js-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google ?? null));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps SDK")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google ?? null);
    script.onerror = () => reject(new Error("Failed to load Google Maps SDK"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
