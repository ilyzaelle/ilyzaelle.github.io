const lon = document.getElementById("lon");
const lat = document.getElementById("lat");
const alt = document.getElementById("alt");
const speed = document.getElementById("speed");

if (navigator.geolocation){
    navigator.geolocation.watchPosition(function(pos){
        const c = pos.coords;
        lon.textContent = (c.longitude ?? '-');
        lat.textContent = (c.latitude ?? '-');
        alt.textContent = (c.altitude ?? '-');
        speed.textContent = (c.speed ?? '-');
    }, function(err){}, { timeout: 10000, maximumAge: 0 });
}

const NICE = [43.7009, 7.2683];

const BERMUDA_TRIANGLE = [
  [32.3078, -64.7505],
  [25.7617, -80.1918],
  [18.4655, -66.1057],
];

const map = L.map('map').setView(NICE, 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

L.marker(NICE).addTo(map).bindPopup('Nice – centre-ville');

L.polygon(BERMUDA_TRIANGLE, { color: 'red', weight: 2 }).addTo(map)
 .bindPopup('Triangle des Bermudes');

let youMarker = null;

if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(
    function (pos) {
      const { latitude, longitude } = pos.coords;
      const p = [latitude, longitude];

      if (!youMarker) {
        youMarker = L.marker(p).addTo(map).bindPopup('Vous êtes ici');
        map.setView(p, 16);
      } else {
        youMarker.setLatLng(p);
      }
    },
    function (err) {
      console.warn('Geolocation error:', err);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
} else {
  console.warn('Geolocation non supportée');
}
