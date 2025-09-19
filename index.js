const lon = document.getElementById("lon");
const lat = document.getElementById("lat");
const alt = document.getElementById("alt");
const acc = document.getElementById("acc");
const speed = document.getElementById("speed");
const time = document.getElementById("time");
const logEl = document.getElementById("log");

function renderPosition(position){
    const c = position.coords;
    lon.textContent = (c.longitude ?? '-');
    lat.textContent = (c.latitude ?? '-');
    alt.textContent = (c.altitude == null ? '-' : c.altitude);
    acc.textContent = (c.accuracy ?? '-');
    if (c.speed == null || !Number.isFinite(c.speed)) {
    speed.textContent = '-';
    } else {
    const kmh = c.speed * 3.6;
    speed.textContent = c.speed.toFixed(2) + ' m/s (' + kmh.toFixed(1) + ' km/h)';
    }
    time.textContent = new Date(position.timestamp).toLocaleString();
}

function onError(err){
    const map = {1:'Permission refusée',2:'Position indisponible',3:'Délai dépassé'};
    logEl.textContent += "\n" + (map[err.code] || 'Erreur') + ' : ' + (err.message || '');
}

// Démarre automatiquement le suivi au chargement
(function startAutoWatch(){
    if (!navigator.geolocation){
    logEl.textContent += "\nGeolocation non supportée";
    return;
    }
    navigator.geolocation.watchPosition(function(pos){
    renderPosition(pos);
    }, function(err){
    onError(err);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    logEl.textContent += "\nwatchPosition: démarré automatiquement";
})();