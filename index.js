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