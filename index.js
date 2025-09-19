const NICE = [43.7009, 7.2683];
const MARSEILLE = [43.2965, 5.3698];

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
});

const stamenToner = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com/">Stamen</a>, &copy; OpenStreetMap'
});

const stamenTerrain = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com/">Stamen</a>, &copy; OpenStreetMap'
});

const map = L.map('map', { center: NICE, zoom: 12, layers: [osm] });

L.control.layers(
  { "OpenStreetMap": osm, "Stamen Toner": stamenToner, "Stamen Terrain": stamenTerrain }
).addTo(map);

L.marker(NICE).addTo(map).bindPopup('Nice – centre-ville');
const lineMN = L.polyline([MARSEILLE, NICE], { color: 'blue' }).addTo(map).bindPopup('Segment Marseille ↔ Nice');
L.marker(MARSEILLE).addTo(map).bindPopup('Marseille – centre-ville');

const distCtrl = L.control({ position: 'topright' });
distCtrl.onAdd = function() {
  this._div = L.DomUtil.create('div', 'leaflet-bar');
  this._div.style.padding = '6px 8px';
  this._div.style.background = 'white';
  this._div.style.font = '14px/1.2 system-ui, sans-serif';
  this.update(null);
  return this._div;
};
distCtrl.update = function(km){
  this._div.innerHTML = km==null
    ? 'Distance Marseille → Vous: —'
    : 'Distance Marseille → Vous: <b>' + km.toFixed(1) + ' km</b>';
};
distCtrl.addTo(map);

function haversineKm(a, b) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const [lat1, lon1] = a, [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat/2), s2 = Math.sin(dLon/2);
  const h = s1*s1 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

let youMarker = null;
let youCircle = null;

function updateYou(pos){
  const { latitude, longitude, accuracy } = pos.coords;
  const p = [latitude, longitude];
  if (!youMarker) {
    youMarker = L.marker(p).addTo(map).bindPopup('Vous êtes ici');
    youCircle = L.circle(p, { radius: accuracy, color: 'orange', fillOpacity: 0.1 }).addTo(map);
    map.setView(p, 15);
  } else {
    youMarker.setLatLng(p);
    youCircle.setLatLng(p).setRadius(accuracy);
  }
  const dKm = haversineKm([latitude, longitude], MARSEILLE);
  distCtrl.update(dKm);
  youMarker.bindPopup('Vous êtes ici<br>Précision ≈ ' + Math.round(accuracy) + ' m<br>Marseille → Vous : ' + dKm.toFixed(1) + ' km');
}

if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(updateYou, err => console.warn('Geolocation error:', err), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

const sampleGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "name": "Promenade des Anglais" }, "geometry": { "type": "LineString", "coordinates": [[7.2207, 43.6952],[7.2564, 43.6949],[7.2691, 43.6959]] }},
    { "type": "Feature", "properties": { "name": "Port de Nice" }, "geometry": { "type": "Point", "coordinates": [7.289, 43.695] }}
  ]
};

L.geoJSON(sampleGeoJSON, {
  onEachFeature: (f, layer) => layer.bindPopup(f.properties?.name || f.geometry.type),
  style: { color: 'purple' }
}).addTo(map);
