let map = null;
let markersGroup = null;
let clickMarker = null;

// Inisialisasi Peta Leaflet
function initMap() {
  // Center ke Indonesia secara umum
  map = L.map('map').setView([-2.548926, 118.014863], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap | PetaLokalku'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);

  // Event Klik di Peta untuk Rekam Koordinat
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    
    if (clickMarker) {
      clickMarker.setLatLng(e.latlng);
    } else {
      clickMarker = L.marker(e.latlng).addTo(map);
    }

    if (typeof updateCoordDisplay === 'function') {
      updateCoordDisplay(lat, lng);
    }
  });
}

// Render Marker Outlet ke Peta
function renderOutletMarkers(outletList) {
  if (!markersGroup) return;
  markersGroup.clearLayers();

  outletList.forEach(item => {
    if (item.lat && item.lng) {
      const marker = L.marker([item.lat, item.lng]);
      
      const popupContent = `
        <div style="font-size: 0.8rem;">
          <strong style="color: #1b4332;">${item.name}</strong><br>
          <span style="color: #666;">${item.address}</span><br>
          <span style="color: #2d6a4f; font-weight: bold;">Omset: Rp ${item.total_sales.toLocaleString('id-ID')}</span>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (typeof showOutletDetail === 'function') {
          showOutletDetail(item);
        }
      });

      markersGroup.addLayer(marker);
    }
  });
}

// Pindahkan Fokus Peta
function moveMapTo(lat, lng, zoom = 14) {
  if (map) {
    map.setView([lat, lng], zoom);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});