document.addEventListener("DOMContentLoaded", function(){
    var lat,lon,alt,vit;
    navigator.geolocation.getCurrentPosition(function(pos){
        var coords = pos.coords;
        lat = coords.latitude;
        lon = coords.longitude;
        alt = coords.altitude;
        vit = coords.speed;
    });
    document.getElementById("lat").innerText = lat;
    document.getElementById("lon").innerText = lon;
    document.getElementById("alt").innerText = alt;
    document.getElementById("vit").innerText = vit;
})