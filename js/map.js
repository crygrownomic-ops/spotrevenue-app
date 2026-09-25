// Inisialisasi Peta Leaflet
const map = L.map('map').setView([-2.5489, 118.0149], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap | <b>PetaLokalku</b>'
}).addTo(map);

let clickedMarker = null;

// Event Klik Peta untuk Pemantau Koordinat Lat/Lng
map.on('click', function(e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  document.getElementById('val-lat').innerText = lat;
  document.getElementById('val-lng').innerText = lng;

  if (clickedMarker) {
    clickedMarker.setLatLng(e.latlng);
  } else {
    clickedMarker = L.marker(e.latlng).addTo(map);
  }

  clickedMarker.bindPopup(`<b>Titik Terpilih</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
});