document.addEventListener("DOMContentLoaded", function(){
    navigator.geolocation.getCurrentPosition(function(pos){
        var coords = pos.coords;

        coords.latitude = null ? document.getElementById("lat").innerText = "null" : document.getElementById("lat").innerText = coords.latitude;
        coords.longitude = null ? document.getElementById("lon").innerText = "null" : document.getElementById("lon").innerText = coords.longitude;
        coords.altitude = null ? document.getElementById("alt").innerText = "null" : document.getElementById("alt").innerText = coords.altitude;
        coords.speed = null ? document.getElementById("vit").innerText = "null" : document.getElementById("vit").innerText = coords.speed;
        console.log(coords);
    });
})