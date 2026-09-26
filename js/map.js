/* ==============================================================================
   SpotRevenue Map Engine v2.7 (Zero-Lock Map Panes & Pure SVG Direct Clicks)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

let map = null;
let markerLayerGroup = null;
let heatmapLayerGroup = null;
let bufferLayerGroup = null;
let cannibalizationLayerGroup = null;
let anomalyLayerGroup = null;
let selectedMarker = null;

const outletMarkersMap = new Map();
window.outletMarkersMap = outletMarkersMap;

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

const KECAMATAN_COLOR_PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#d946ef', '#0284c7', '#e11d48', '#059669', '#d97706',
  '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#db2777'
];

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
    zoom: 9,
    zoomControl: false
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | SpotRevenue Engine'
  }).addTo(map);

  // --- MEMBENTUK LAYER PANES TERPISAH SUPAYA TIDAK SALING MENGUNCI ---
  map.createPane('bufferPane');
  map.getPane('bufferPane').style.zIndex = 350;
  map.getPane('bufferPane').style.pointerEvents = 'none'; // SANGAT PENTING: TEMBUS KLIK 100%

  map.createPane('markerPane');
  map.getPane('markerPane').style.zIndex = 500;

  bufferLayerGroup = L.layerGroup().addTo(map);
  cannibalizationLayerGroup = L.layerGroup().addTo(map);
  heatmapLayerGroup = L.layerGroup().addTo(map);
  markerLayerGroup = L.layerGroup().addTo(map);
  anomalyLayerGroup = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (typeof updateCoordDisplay === 'function') {
      updateCoordDisplay(lat, lng);
    }
  });

  window.map = map;
  return map;
}

function renderOutletMarkers(outlets) {
  if (!map) initMap();
  if (!map || !markerLayerGroup) return;

  markerLayerGroup.clearLayers();
  heatmapLayerGroup.clearLayers();
  cannibalizationLayerGroup.clearLayers();
  outletMarkersMap.clear();
  selectedMarker = null;

  if (!outlets || outlets.length === 0) return;

  const bounds = [];
  const markers = [];
  const currentMetric = window.activeMetric || 'val';

  for (let i = 0; i < outlets.length; i++) {
    const item = outlets[i];
    const lat = item.lat != null ? parseFloat(item.lat) : (item.latitude != null ? parseFloat(item.latitude) : null);
    const lng = item.lng != null ? parseFloat(item.lng) : (item.longitude != null ? parseFloat(item.longitude) : null);

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
      
      const custCode = item.customer_number || item.id || '-';
      const kecName = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || '-');
      
      const isAnomaly = window.lastAnomalySet && window.lastAnomalySet.has(String(custCode));
      const territoryColor = isAnomaly ? '#000000' : getKecamatanColor(kecName);
      const strokeColor = isAnomaly ? '#ef4444' : '#ffffff';

      const circle = L.circleMarker([lat, lng], {
        pane: 'markerPane', // PASTI BERADA DI PANE MARKER ATAS
        radius: isAnomaly ? 8 : 6,
        color: strokeColor,
        fillColor: territoryColor,
        fillOpacity: 0.95,
        weight: isAnomaly ? 2.5 : 1.2,
        interactive: true
      });

      let omsetFormatted = '';
      const totalVal = item.current_total != null ? item.current_total : (item.total_sales || 0);

      if (currentMetric === 'val') {
        omsetFormatted = `Rp ${totalVal.toLocaleString('id-ID')}`;
      } else if (currentMetric === 'box') {
        omsetFormatted = `${totalVal.toLocaleString('id-ID')} Karton Box`;
      } else {
        omsetFormatted = `${totalVal.toLocaleString('id-ID')} Unit UOM`;
      }

      const kodyaName = KODYA_MAP_FULL[item.kodya] || item.kodya || '-';
      const addressName = item.address || 'Alamat tidak tersedia';
      
      const isManualAnomaly = window.manualAnomalySet && window.manualAnomalySet.has(String(custCode));
      const anomalyBtnLabel = isManualAnomaly ? '🟢 Batal Anomali' : '⚫ Tandai Anomali Manual';
      const anomalyBtnBg = isManualAnomaly ? '#059669' : '#000000';

      const infoHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #1e293b; min-width: 220px; max-width: 270px; padding: 2px;">
          <div style="font-weight: 700; color: #1b4332; font-size: 13px; border-bottom: 2px solid ${territoryColor === '#000000' ? '#ef4444' : territoryColor}; padding-bottom: 4px; margin-bottom: 6px; word-break: break-word;">
            ${isAnomaly ? '⚫ [ANOMALI] ' : '🏢 '} ${item.name || 'Tanpa Nama'}
          </div>
          <div style="margin-bottom: 5px;">
            <span style="color: #64748b; font-weight: 600;">Kode Customer:</span> 
            <strong style="color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${custCode}</strong>
          </div>
          <div style="padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; margin-bottom: 6px; line-height: 1.45;">
            <div><span style="color: #64748b;">Kab/Kota:</span> <b>${kodyaName}</b></div>
            <div><span style="color: #64748b;">Kecamatan:</span> <b>${kecName}</b></div>
            <div style="margin-top: 3px; color: #475569;"><span style="color: #64748b;">Alamat:</span> ${addressName}</div>
          </div>
          <div style="background: #0f291e; color: white; padding: 6px; border-radius: 5px; text-align: center; margin-bottom: 6px;">
            <span style="font-size: 9.5px; color: #a7f3d0; display: block; font-weight: 600;">PERFORMANCE (${currentMetric.toUpperCase()})</span>
            <strong style="font-size: 13px; color: #ffffff;">${omsetFormatted}</strong>
          </div>
          <button onclick="window.toggleManualAnomaly('${custCode}')" style="width: 100%; background: ${anomalyBtnBg}; color: white; border: none; padding: 6px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s;">
            ${anomalyBtnLabel}
          </button>
        </div>
      `;

      circle.bindPopup(infoHtml, { autoPan: false, closeOnClick: true });
      circle.bindTooltip(`<b>${item.name}</b> (${custCode})`, { direction: 'top', offset: [0, -6] });

      circle.on('click', () => {
        if (selectedMarker && selectedMarker !== circle) {
          const prevItem = selectedMarker.options.outletRef;
          if (prevItem) {
            const prevCode = prevItem.customer_number || prevItem.id;
            const isPrevAnomaly = window.lastAnomalySet && window.lastAnomalySet.has(String(prevCode));
            const prevKec = Array.isArray(prevItem.kecamatan) ? prevItem.kecamatan[0] : (prevItem.kecamatan || '-');

            selectedMarker.setStyle({
              color: isPrevAnomaly ? '#ef4444' : '#ffffff',
              fillColor: isPrevAnomaly ? '#000000' : getKecamatanColor(prevKec),
              radius: isPrevAnomaly ? 8 : 6,
              weight: isPrevAnomaly ? 2.5 : 1.2
            });
          }
        }

        circle.setStyle({
          color: '#ffffff',
          fillColor: '#f59e0b',
          radius: 10,
          weight: 3
        });
        
        selectedMarker = circle;
        circle.openPopup();

        if (typeof showOutletDetail === 'function') {
          showOutletDetail(item, false);
        }

        if (typeof updateCoordDisplay === 'function') {
          updateCoordDisplay(lat, lng);
        }
      });

      circle.options.outletRef = item;
      markers.push(circle);
      bounds.push([lat, lng]);

      if (item.id) outletMarkersMap.set(String(item.id), circle);
      if (item.customer_number) outletMarkersMap.set(String(item.customer_number), circle);
    }
  }

  const batchGroup = L.layerGroup(markers);
  markerLayerGroup.addLayer(batchGroup);

  if (bounds.length > 0 && !window.hasInitialFit) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    window.hasInitialFit = true;
  }

  map.invalidateSize();
}

function applyAnomalyStylesToMarkers(anomalySet) {
  if (!outletMarkersMap) return;

  outletMarkersMap.forEach((marker) => {
    const item = marker.options.outletRef;
    if (!item) return;

    const code = String(item.customer_number || item.id || '');
    const isAnomaly = anomalySet.has(code);
    const kecName = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || '-');

    if (isAnomaly) {
      marker.setStyle({
        color: '#ef4444',
        fillColor: '#000000',
        radius: 9,
        weight: 3.0,
        fillOpacity: 1.0
      });
    } else {
      marker.setStyle({
        color: '#ffffff',
        fillColor: getKecamatanColor(kecName),
        radius: 6,
        weight: 1.2,
        fillOpacity: 0.95
      });
    }
  });
}

function highlightAnomalyMarkers(anomalyList) {
  if (!map) initMap();
  if (!map || !anomalyLayerGroup) return;

  anomalyLayerGroup.clearLayers();

  if (!anomalyList || anomalyList.length === 0) return;

  const blackBeaconIcon = L.divIcon({
    className: 'pulsing-black-beacon-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  anomalyList.forEach(item => {
    const o = item.outlet;
    const lat = parseFloat(o.lat ?? o.latitude);
    const lng = parseFloat(o.lng ?? o.longitude);
    const custCode = o.customer_number || o.id || '-';

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const marker = L.marker([lat, lng], { icon: blackBeaconIcon, pane: 'markerPane' });
    
    marker.bindPopup(`
      <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; min-width: 200px;">
        <h4 style="margin:0 0 4px 0; color:#dc2626; font-size:13px; font-weight:700;">⚫ ANOMALI TERDETEKSI</h4>
        <div style="font-weight:700; font-size:12px; color:#1e293b;">${o.name || 'Tanpa Nama'} (${custCode})</div>
        <div style="font-size:11px; color:#dc2626; font-weight:700; margin-top:3px;">⚠️ ${item.reason}</div>
        <div style="font-size:11px; color:#475569; margin-top:3px;">Kec: ${o.kecamatan || '-'} | Kab: ${KODYA_MAP_FULL[o.kodya] || o.kodya || '-'}</div>
        <button onclick="window.toggleManualAnomaly('${custCode}')" style="width: 100%; margin-top: 6px; background: #059669; color: white; border: none; padding: 5px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer;">
          🟢 Batal Anomali
        </button>
      </div>
    `, { autoPan: false });

    marker.on('click', () => {
      if (typeof showOutletDetail === 'function') {
        showOutletDetail(o, false);
      }
    });

    anomalyLayerGroup.addLayer(marker);
  });
}

function renderHeatmapLayer(outlets) {
  if (!map) initMap();
  if (!map || !heatmapLayerGroup) return;

  markerLayerGroup.clearLayers();
  heatmapLayerGroup.clearLayers();

  if (!outlets || outlets.length === 0) return;

  const heatData = [];
  let maxOmset = 1;

  outlets.forEach(o => {
    const val = o.current_total || o.total_sales || 0;
    if (val > maxOmset) maxOmset = val;
  });

  outlets.forEach(o => {
    const lat = o.lat != null ? parseFloat(o.lat) : (o.latitude != null ? parseFloat(o.latitude) : null);
    const lng = o.lng != null ? parseFloat(o.lng) : (o.longitude != null ? parseFloat(o.longitude) : null);
    const val = o.current_total || o.total_sales || 0;

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const intensity = Math.min(1.0, Math.max(0.2, val / maxOmset));
      heatData.push([lat, lng, intensity]);
    }
  });

  if (heatData.length > 0 && typeof L.heatLayer === 'function') {
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 18,
      maxZoom: 13,
      gradient: { 0.2: '#0284c7', 0.4: '#10b981', 0.7: '#f59e0b', 1.0: '#ef4444' }
    });
    heatmapLayerGroup.addLayer(heatLayer);
  }
}

function drawBufferZone(lat, lng, radiusInMeters) {
  if (!map) initMap();
  if (!map || !bufferLayerGroup) return;

  bufferLayerGroup.clearLayers();
  if (!lat || !lng || radiusInMeters <= 0) return;

  const circle = L.circle([lat, lng], {
    pane: 'bufferPane', // DILETAKKAN DI BUFFER PANE DI BAWAH MARKER
    radius: radiusInMeters,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.15,
    weight: 2,
    dashArray: '5, 5',
    interactive: false // MEMATIKAN INTERAKSI DARI BUFFER
  });

  bufferLayerGroup.addLayer(circle);
}

function loadProvinceBoundary(provCode) {
  if (!map) initMap();
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});

window.initMap = initMap;
window.renderOutletMarkers = renderOutletMarkers;
window.applyAnomalyStylesToMarkers = applyAnomalyStylesToMarkers;
window.renderHeatmapLayer = renderHeatmapLayer;
window.drawBufferZone = drawBufferZone;
window.highlightAnomalyMarkers = highlightAnomalyMarkers;
window.loadProvinceBoundary = loadProvinceBoundary;