// Inisialisasi Peta Leaflet
const map = L.map('map').setView([-2.5489, 118.0149], 5);

// Basemap OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap | <b>PetaLokalku</b>'
}).addTo(map);

let clickedMarker = null;

// FUNGSI UTAMA: Menggerakkan peta ke koordinat lat & lng tertentu
function moveMapTo(lat, lng, zoomLevel = 14, title = '', subtitle = '') {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Efek animasi terbang ke lokasi
  map.flyTo([latitude, longitude], zoomLevel);

  // Buat atau pindahkan Marker
  if (clickedMarker) {
    clickedMarker.setLatLng([latitude, longitude]);
  } else {
    clickedMarker = L.marker([latitude, longitude]).addTo(map);
  }

  // Tampilkan Pop-up
  if (title) {
    clickedMarker.bindPopup(`<b>${title}</b><br>${subtitle}`).openPopup();
  }

  // Perbarui Panel Pemantau Koordinat di Sidebar
  document.getElementById('val-lat').innerText = latitude.toFixed(6);
  document.getElementById('val-lng').innerText = longitude.toFixed(6);
}

// Event Klik Peta Manual
map.on('click', function(e) {
  moveMapTo(
    e.latlng.lat, 
    e.latlng.lng, 
    map.getZoom(), 
    'Titik Pilihan Manual', 
    `Lat: ${e.latlng.lat.toFixed(6)} | Lng: ${e.latlng.lng.toFixed(6)}`
  );
});