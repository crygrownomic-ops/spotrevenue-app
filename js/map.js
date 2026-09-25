/* ==============================================================================
   SpotRevenue Map Engine (Rich Territory Hierarchy & CUSTOMER_NUMBER Tooltip)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

let map = null;
let markerLayerGroup = null;
let selectedMarker = null;

const canvasRenderer = L.canvas({ padding: 0.5 });

const KODYA_MAP_FULL = {
  'PTK': 'KOTA PONTIANAK',
  'SKW': 'KOTA SINGKAWANG',
  'KRY': 'KABUPATEN KUBU RAYA',
  'PNK': 'KABUPATEN MEMPAWAH',
  'SBS': 'KABUPATEN SAMBAS',
  'BKY': 'KABUPATEN BENGKAYANG',
  'LDK': 'KABUPATEN LANDAK',
  'SGU': 'KABUPATEN SANGGAU',
  'STG': 'KABUPATEN SINTANG',
  'MLW': 'KABUPATEN MELAWI',
  'KTP': 'KABUPATEN KETAPANG',
  'KPH': 'KABUPATEN KAPUAS HULU'
};

function initMap() {
  if (map) return map;

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return null;

  map = L.map('map', {
    center: [-0.0408, 109.3456],
    zoom: 8,
    zoomControl: false,
    preferCanvas: true
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | SpotRevenue Engine'
  }).addTo(map);

  markerLayerGroup = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (typeof updateCoordDisplay === 'function') {
      updateCoordDisplay(lat, lng);
    }
  });

  return map;
}

function renderOutletMarkers(outlets) {
  if (!map) initMap();
  if (!map || !markerLayerGroup) return;

  markerLayerGroup.clearLayers();
  selectedMarker = null;

  if (!outlets || outlets.length === 0) {
    return;
  }

  const bounds = [];
  const markers = [];
  const currentMetric = window.activeMetric || 'val';

  for (let i = 0; i < outlets.length; i++) {
    const item = outlets[i];
    const lat = item.lat != null ? parseFloat(item.lat) : null;
    const lng = item.lng != null ? parseFloat(item.lng) : null;

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const circle = L.circleMarker([lat, lng], {
        renderer: canvasRenderer,
        radius: 4.5,
        color: '#10b981',
        fillColor: '#1b4332',
        fillOpacity: 0.85,
        weight: 1
      });

      // Format Omset Keseluruhan
      let omsetFormatted = '';
      const totalVal = item.total_sales || 0;

      if (currentMetric === 'val') {
        omsetFormatted = `Rp ${totalVal.toLocaleString('id-ID')}`;
      } else if (currentMetric === 'box') {
        omsetFormatted = `${totalVal.toLocaleString('id-ID')} Karton Box`;
      } else {
        omsetFormatted = `${totalVal.toLocaleString('id-ID')} Unit UOM`;
      }

      // Kode Customer (CUSTOMER_NUMBER)
      const custCode = item.customer_number || item.id || '-';
      const kodyaName = KODYA_MAP_FULL[item.kodya] || item.kodya || '-';
      const kecName = item.kecamatan || '-';
      const addressName = item.address || 'Alamat tidak tersedia';

      // TEMPLATE TOOLTIP PREVIEW LENGKAP
      const tooltipHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #1e293b; min-width: 220px; max-width: 280px; padding: 3px;">
          <div style="font-weight: 700; color: #1b4332; font-size: 13px; border-bottom: 2px solid #10b981; padding-bottom: 4px; margin-bottom: 6px; word-break: break-word;">
            🏢 ${item.name || 'Tanpa Nama'}
          </div>
          
          <div style="margin-bottom: 6px;">
            <span style="color: #64748b; font-weight: 600;">Kode Customer:</span> 
            <strong style="color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${custCode}</strong>
          </div>

          <div style="padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; margin-bottom: 6px; line-height: 1.45;">
            <div style="font-weight: 700; color: #334155; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              📍 Susunan Wilayah Administratif
            </div>
            <div><span style="color: #64748b;">Provinsi:</span> <b>KALIMANTAN BARAT</b></div>
            <div><span style="color: #64748b;">Kab/Kota:</span> <b>${kodyaName}</b></div>
            <div><span style="color: #64748b;">Kecamatan:</span> <b>${kecName}</b></div>
            <div style="margin-top: 3px; color: #475569;"><span style="color: #64748b;">Alamat:</span> ${addressName}</div>
            <div style="color: #059669; font-family: monospace; font-size: 10px; margin-top: 3px;"><b>Koordinat:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
          </div>

          <div style="background: #1b4332; color: white; padding: 6px; border-radius: 5px; text-align: center;">
            <span style="font-size: 9.5px; color: #a7f3d0; display: block; font-weight: 600; text-transform: uppercase;">Total Performance (${currentMetric.toUpperCase()})</span>
            <strong style="font-size: 13px; color: #ffffff;">${omsetFormatted}</strong>
          </div>
        </div>
      `;

      circle.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -6],
        opacity: 0.98,
        className: 'custom-leaflet-tooltip'
      });

      circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e);

        if (selectedMarker) {
          selectedMarker.setStyle({
            color: '#10b981',
            fillColor: '#1b4332',
            radius: 4.5
          });
        }

        circle.setStyle({
          color: '#ffffff',
          fillColor: '#f59e0b',
          radius: 8
        });
        selectedMarker = circle;

        if (typeof showOutletDetail === 'function') {
          showOutletDetail(item);
        }

        if (typeof updateCoordDisplay === 'function') {
          updateCoordDisplay(lat, lng);
        }
      });

      markers.push(circle);
      bounds.push([lat, lng]);
    }
  }

  const batchGroup = L.layerGroup(markers);
  markerLayerGroup.addLayer(batchGroup);

  if (bounds.length > 0) {
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14
    });
  }

  map.invalidateSize();
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});

window.initMap = initMap;
window.renderOutletMarkers = renderOutletMarkers;