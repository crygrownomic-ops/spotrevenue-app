/* ==============================================================================
   SpotRevenue Map Engine (Clean Geo-Coloring by Kecamatan & Rich Tooltip)
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

// Palet warna terdistribusi elegan untuk pembedaan wilayah kecamatan
const KECAMATAN_COLOR_PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#d946ef', '#0284c7', '#e11d48', '#059669', '#d97706',
  '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#db2777'
];

// Fungsi hash dinamis untuk menghasilkan warna unik yang konsisten per kecamatan
function getKecamatanColor(kecName) {
  if (!kecName || kecName === '-') return '#1b4332';
  const nameStr = String(kecName).trim().toUpperCase();
  
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % KECAMATAN_COLOR_PALETTE.length;
  return KECAMATAN_COLOR_PALETTE[index];
}

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
      
      // Ambil nama kecamatan dan tentukan warna unik wilayahnya
      const kecName = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || '-');
      const territoryColor = getKecamatanColor(kecName);

      const circle = L.circleMarker([lat, lng], {
        renderer: canvasRenderer,
        radius: 5,
        color: '#ffffff',
        fillColor: territoryColor,
        fillOpacity: 0.9,
        weight: 1.2
      });

      // Format Omset Keseluruhan
      let omsetFormatted = '';
      const totalVal = item.current_total != null ? item.current_total : (item.total_sales || 0);

      if (currentMetric === 'val') {
        omsetFormatted = `Rp ${totalVal.toLocaleString('id-ID')}`;
      } else if (currentMetric === 'box') {
        omsetFormatted = `${totalVal.toLocaleString('id-ID')} Karton Box`;
      } else {
        omsetFormatted = `${totalVal.toLocaleString('id-ID')} Unit UOM`;
      }

      // Kode Customer (CUSTOMER_NUMBER) & Salespersons
      const custCode = item.customer_number || item.id || '-';
      const kodyaName = KODYA_MAP_FULL[item.kodya] || item.kodya || '-';
      const addressName = item.address || 'Alamat tidak tersedia';
      
      const salesmanList = Array.isArray(item.salespersons) 
        ? [...new Set(item.salespersons.filter(Boolean))].join(', ') 
        : (item.salespersons || '-');

      // TEMPLATE TOOLTIP PREVIEW LENGKAP
      const tooltipHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #1e293b; min-width: 230px; max-width: 280px; padding: 3px;">
          <div style="font-weight: 700; color: #1b4332; font-size: 13px; border-bottom: 2px solid ${territoryColor}; padding-bottom: 4px; margin-bottom: 6px; word-break: break-word;">
            🏢 ${item.name || 'Tanpa Nama'}
          </div>
          
          <div style="margin-bottom: 5px;">
            <span style="color: #64748b; font-weight: 600;">Kode Customer:</span> 
            <strong style="color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${custCode}</strong>
          </div>

          <div style="margin-bottom: 5px;">
            <span style="color: #64748b; font-weight: 600;">Salesman:</span> 
            <span style="color: #047857; font-weight: bold;">${salesmanList}</span>
          </div>

          <div style="padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; margin-bottom: 6px; line-height: 1.45;">
            <div style="font-weight: 700; color: #334155; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              📍 Susunan Wilayah Administratif
            </div>
            <div><span style="color: #64748b;">Provinsi:</span> <b>KALIMANTAN BARAT</b></div>
            <div><span style="color: #64748b;">Kab/Kota:</span> <b>${kodyaName}</b></div>
            <div><span style="color: #64748b;">Kecamatan:</span> <b style="color: ${territoryColor};">${kecName}</b></div>
            <div style="margin-top: 3px; color: #475569;"><span style="color: #64748b;">Alamat:</span> ${addressName}</div>
            <div style="color: #059669; font-family: monospace; font-size: 10px; margin-top: 3px;"><b>Koordinat:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
          </div>

          <div style="background: linear-gradient(135deg, #0f291e 0%, #1b4332 100%); color: white; padding: 6px; border-radius: 5px; text-align: center;">
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
          const prevItem = selectedMarker.options.outletRef;
          const prevKec = Array.isArray(prevItem.kecamatan) ? prevItem.kecamatan[0] : (prevItem.kecamatan || '-');
          selectedMarker.setStyle({
            color: '#ffffff',
            fillColor: getKecamatanColor(prevKec),
            radius: 5
          });
        }

        circle.setStyle({
          color: '#ffffff',
          fillColor: '#f59e0b',
          radius: 9
        });
        
        circle.options.outletRef = item;
        selectedMarker = circle;

        if (typeof showOutletDetail === 'function') {
          showOutletDetail(item, true);
        }

        if (typeof updateCoordDisplay === 'function') {
          updateCoordDisplay(lat, lng);
        }
      });

      circle.options.outletRef = item;
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