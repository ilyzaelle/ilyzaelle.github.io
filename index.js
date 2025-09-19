const lon = document.getElementById("lon");
const lat = document.getElementById("lat");
const alt = document.getElementById("alt");
const acc = document.getElementById("acc");
const speed = document.getElementById("speed");
const time = document.getElementById("time");
const logEl = document.getElementById("log");

if (!navigator.geolocation){
    logEl.textContent += "\nGeolocation non supportée";
    return;
}else{
    navigator.geolocation.watchPosition(function(pos){
    const c = position.coords;
    lon.textContent = (c.longitude ?? '-');
    lat.textContent = (c.latitude ?? '-');
    alt.textContent = (c.altitude == null ? '-' : c.altitude);
    acc.textContent = (c.accuracy ?? '-');
    if (c.speed == null) {
        speed.textContent = '-';
    }
    time.textContent = new Date(position.timestamp).toLocaleString();
    }, function(err){}, 
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}