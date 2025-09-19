document.addEventListener("DOMContentLoaded", function(){
    navigator.geolocation.getCurrentPosition(function(pos){
        var coords = pos.coords;

        coords.latitude = null ? document.getElementById("lat").innerText = "N/A" : document.getElementById("lat").innerText = coords.latitude;
        coords.longitude = null ? document.getElementById("lon").innerText = "N/A" : document.getElementById("lon").innerText = coords.longitude;
        coords.altitude = null ? document.getElementById("alt").innerText = "N/A" : document.getElementById("alt").innerText = coords.altitude;
        coords.speed = null ? document.getElementById("vit").innerText = "N/A" : document.getElementById("vit").innerText = coords.speed;
        console.log(coords);
    });
})