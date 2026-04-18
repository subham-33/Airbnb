mapboxgl.accessToken = mapToken;

// Default center — India (adjust to your preference)
const defaultCoords = [78.9629, 20.5937];

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: defaultCoords,
  zoom: 4,
});

const marker = new mapboxgl.Marker({ color: "red", draggable: true })
  .setLngLat(defaultCoords)
  .addTo(map);

// Update hidden inputs on drag
marker.on("dragend", () => {
  const { lng, lat } = marker.getLngLat();
  document.getElementById("lng").value = lng;
  document.getElementById("lat").value = lat;
});

// ─── Auto-jump on location input ─────────────────────────────────────────────
let debounceTimer;

document.getElementById("location").addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  if (!query) return;

  debounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=1&types=country,region,district,place,locality,neighborhood,address`
      );

      const data = await res.json();
      if (!data.features.length) return;

      const [lng, lat] = data.features[0].center;
      const bbox = data.features[0].bbox;

      marker.setLngLat([lng, lat]);

      // ✅ Auto-jump also updates hidden inputs — treated same as drag
      document.getElementById("lng").value = lng;
      document.getElementById("lat").value = lat;

      if (bbox) {
        map.fitBounds(bbox, { padding: 60, maxZoom: 15 });
      } else {
        map.flyTo({ center: [lng, lat], zoom: 14 });
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
  }, 600);
});