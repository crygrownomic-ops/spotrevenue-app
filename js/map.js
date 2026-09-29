/* ==============================================================================
   SpotRevenue Map Engine v4.8 (Free OpenStreetMap & Position Persistence)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

let map = null;
let tileLayer = null;
let markerLayerGroup = null;
let heatmapLayerGroup = null;
let bufferLayerGroup = null;
let cannibalizationLayerGroup = null;
let anomalyLayerGroup = null;
let routeLayerGroup = null;
let selectedMarker = null;

const outletMarkersMap = new Map();
window.outletMarkersMap = outletMarkersMap;

const DEFAULT_MAP_CENTER = [-0.0408, 109.3456]; // Kalimantan Barat
const DEFAULT_MAP_ZOOM = 9;

const KODYA_MAP_FULL = {
  'PTK': 'KOTA PONTIANAK', 'SKW': 'KOTA SINGKAWANG', 'KRY': 'KABUPATEN KUBU RAYA',
  'PNK': 'KABUPATEN MEMPAWAH', 'SBS': 'KABUPATEN SAMBAS', 'BKY': 'KABUPATEN BENGKAYANG',
  'LDK': 'KABUPATEN LANDAK', 'SGU': 'KABUPATEN SANGGAU', 'STG': 'KABUPATEN SINTANG',
  'MLW': 'KABUPATEN MELAWI', 'KTP': 'KABUPATEN KETAPANG', 'KPH': 'KABUPATEN KAPUAS HULU'
};

/* PALET WARNA KONTRAS KECAMATAN */
const KECAMATAN_COLOR_PALETTE = [
  '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#84cc16',
  '#e11d48', '#0284c7', '#d97706', '#059669', '#7c3aed',
  '#c026d3', '#0d9488', '#ea580c', '#4f46e5', '#65a30d'
];

function extractKecamatanName(item) {
  if (!item) return 'LAINNYA';
  let raw = item.kecamatan || item.Kecamatan || item.kec || item.subdistrict;
  if (Array.isArray(raw)) raw = raw[0];
  if (!raw || typeof raw !== 'string' || raw.trim() === '' || raw.trim() === '-') {
    return 'LAINNYA';
  }
  return raw.trim().toUpperCase();
}
window.extractKecamatanName = extractKecamatanName;

function getKecamatanColor(kecName) {
  const nameStr = (kecName || 'LAINNYA').toUpperCase();
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % KECAMATAN_COLOR_PALETTE.length;
  return KECAMATAN_COLOR_PALETTE[index];
}
window.getKecamatanColor = getKecamatanColor;

function initMap() {
  if (map) return map;

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return null;

  // BACA KOORDINAT PETA TERAKHIR DARI MEMORI BROWSER AGAR TIDAK RESET KE PETA DUNIA
  const savedLat = localStorage.getItem('spotrev_map_lat');
  const savedLng = localStorage.getItem('spotrev_map_lng');
  const savedZoom = localStorage.getItem('spotrev_map_zoom');

  const initialCenter = (savedLat && savedLng) 
    ? [parseFloat(savedLat), parseFloat(savedLng)] 
    : DEFAULT_MAP_CENTER;
  const initialZoom = savedZoom ? parseInt(savedZoom, 10) : DEFAULT_MAP_ZOOM;

  map = L.map('map', {
    center: initialCenter,
    zoom: initialZoom,
    zoomControl: false
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  // MENGGUNAKAN TILE LAYER OPENSTREETMAP 100% GRATIS TANPA WATERMARK / API KEY
  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | SpotRevenue Engine'
  }).addTo(map);

  // SIMPAN OTOMATIS KOORDINAT DAN ZOOM LEVEL KETIKA USER MENGGESER PETA
  map.on('moveend zoomend', () => {
    const center = map.getCenter();
    localStorage.setItem('spotrev_map_lat', center.lat);
    localStorage.setItem('spotrev_map_lng', center.lng);
    localStorage.setItem('spotrev_map_zoom', map.getZoom());
  });

  map.createPane('bufferPane');
  map.getPane('bufferPane').style.zIndex = 350;
  map.getPane('bufferPane').style.pointerEvents = 'none';

  map.createPane('markerPane');
  map.getPane('markerPane').style.zIndex = 500;

  bufferLayerGroup = L.layerGroup().addTo(map);
  cannibalizationLayerGroup = L.layerGroup().addTo(map);
  heatmapLayerGroup = L.layerGroup().addTo(map);
  markerLayerGroup = L.layerGroup().addTo(map);
  anomalyLayerGroup = L.layerGroup().addTo(map);
  routeLayerGroup = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (typeof updateCoordDisplay === 'function') {
      updateCoordDisplay(lat, lng);
    }
  });

  window.map = map;
  return map;
}

function resetMapView() {
  if (!map) return;
  const dataset = window.lastFilteredOutlets || [];
  const coords = dataset
    .map(o => [parseFloat(o.lat ?? o.latitude), parseFloat(o.lng ?? o.longitude)])
    .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0);

  if (coords.length > 0) {
    map.fitBounds(coords, { padding: [40, 40], maxZoom: 14 });
  } else {
    map.flyTo(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { animate: true, duration: 1.0 });
  }
}
window.resetMapView = resetMapView;

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
      
      const custCode = String(item.customer_number || item.id || '-');
      const kecName = extractKecamatanName(item);
      
      const isSystemAnomaly = window.lastAnomalySet && window.lastAnomalySet.has(custCode);
      const isManualAnomaly = window.manualAnomalySet && window.manualAnomalySet.has(custCode);
      const isAnomaly = isSystemAnomaly || isManualAnomaly;

      const territoryColor = isAnomaly ? '#000000' : getKecamatanColor(kecName);
      const strokeColor = isAnomaly ? '#ef4444' : '#ffffff';

      const circle = L.circleMarker([lat, lng], {
        pane: 'markerPane',
        radius: isAnomaly ? 8 : 6,
        color: strokeColor,
        fillColor: territoryColor,
        fillOpacity: 0.88,
        weight: isAnomaly ? 2.5 : 1.2,
        interactive: true
      });

      let omsetFormatted = '';
      const totalVal = item.current_total != null ? item.current_total : (item.total_sales || 0);

      if (currentMetric === 'val') {
        omsetFormatted = `Rp ${Math.round(totalVal).toLocaleString('id-ID')}`;
      } else if (currentMetric === 'box') {
        omsetFormatted = `${Math.round(totalVal).toLocaleString('id-ID')} Karton Box`;
      } else {
        omsetFormatted = `${Math.round(totalVal).toLocaleString('id-ID')} Unit UOM`;
      }

      const kodyaName = KODYA_MAP_FULL[item.kodya] || item.kodya || '-';
      const addressName = item.address || 'Alamat tidak tersedia';
      
      let salesmanVal = '-';
      if (Array.isArray(item.salespersons) && item.salespersons.length > 0) {
        salesmanVal = [...new Set(item.salespersons.filter(Boolean))].join(', ');
      } else if (typeof item.salespersons === 'string' && item.salespersons.trim() !== '') {
        salesmanVal = item.salespersons;
      }

      const anomalyBtnLabel = isManualAnomaly ? 'Batal Anomali' : 'Tandai Anomali Manual';
      const anomalyBtnBg = isManualAnomaly ? '#262626' : '#dc2626';

      const infoHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #ffffff; width: auto; min-width: 200px; max-width: 280px; padding: 2px;">
          <div style="font-weight: 700; color: #ef4444; font-size: 13px; border-bottom: 2px solid ${territoryColor === '#000000' ? '#ef4444' : territoryColor}; padding-bottom: 4px; margin-bottom: 6px; word-break: break-word;">
            ${isAnomaly ? '[ANOMALI] ' : ''}${item.name || 'Tanpa Nama'}
          </div>
          <div style="margin-bottom: 4px; color: #a3a3a3;">
            Kode Customer: <strong style="color: #ffffff; font-family: monospace;">${custCode}</strong>
          </div>
          <div style="margin-bottom: 4px; color: #a3a3a3;">
            Kode Salesman: <strong style="color: #ef4444; font-family: monospace;">${salesmanVal}</strong>
          </div>
          <div style="padding: 6px; background: #121212; border: 1px solid #333333; border-radius: 4px; margin-bottom: 6px; line-height: 1.45;">
            <div><span style="color: #a3a3a3;">Kab/Kota:</span> <b>${kodyaName}</b></div>
            <div><span style="color: #a3a3a3;">Kecamatan:</span> <b>${kecName}</b></div>
            <div style="margin-top: 2px; color: #a3a3a3;"><span style="color: #a3a3a3;">Alamat:</span> ${addressName}</div>
          </div>
          <div style="background: #121212; border: 1px solid #dc2626; color: white; padding: 6px; border-radius: 4px; text-align: center; margin-bottom: 6px;">
            <span style="font-size: 9px; color: #a3a3a3; display: block; font-weight: 600;">PERFORMANCE (${currentMetric.toUpperCase()})</span>
            <strong style="font-size: 12px; color: #ef4444;">${omsetFormatted}</strong>
          </div>
          <button onclick="window.toggleManualAnomaly('${custCode}')" style="width: 100%; background: ${anomalyBtnBg}; color: white; border: 1px solid #404040; padding: 6px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 600; cursor: pointer;">
            ${anomalyBtnLabel}
          </button>
        </div>
      `;

      circle.bindPopup(infoHtml, { autoPan: false, closeOnClick: true });

      circle.on('click', () => {
        if (selectedMarker && selectedMarker !== circle) {
          const prevItem = selectedMarker.options.outletRef;
          if (prevItem) {
            const prevCode = String(prevItem.customer_number || prevItem.id);
            const isPrevAnomaly = (window.lastAnomalySet && window.lastAnomalySet.has(prevCode)) || (window.manualAnomalySet && window.manualAnomalySet.has(prevCode));
            const prevKec = extractKecamatanName(prevItem);

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
          fillColor: '#ffffff',
          radius: 9,
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

  if (bounds.length > 0 && !window.hasInitialFit && !localStorage.getItem('spotrev_map_lat')) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    window.hasInitialFit = true;
  }

  map.invalidateSize();
}

function drawBufferCircle(latlng, radiusMeters) {
  if (!map) initMap();
  if (!map || !bufferLayerGroup) return;

  bufferLayerGroup.clearLayers();

  if (!latlng || isNaN(latlng[0]) || isNaN(latlng[1]) || radiusMeters <= 0) return;

  const circle = L.circle(latlng, {
    pane: 'bufferPane',
    radius: radiusMeters,
    color: '#ef4444',
    fillColor: '#dc2626',
    fillOpacity: 0.15,
    weight: 2,
    dashArray: '5, 5',
    interactive: false
  });

  bufferLayerGroup.addLayer(circle);
  map.flyTo(latlng, map.getZoom() < 14 ? 14 : map.getZoom(), { animate: true });
}

function clearBufferCircle() {
  if (bufferLayerGroup) {
    bufferLayerGroup.clearLayers();
  }
}

function drawSalesRoute(coords) {
  if (!map) initMap();
  if (!map || !routeLayerGroup) return;

  routeLayerGroup.clearLayers();

  if (!coords || coords.length < 2) return;

  const polyline = L.polyline(coords, {
    color: '#ef4444',
    weight: 3.5,
    opacity: 0.9,
    dashArray: '6, 6'
  });

  routeLayerGroup.addLayer(polyline);
  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}

function clearSalesRoute() {
  if (routeLayerGroup) {
    routeLayerGroup.clearLayers();
  }
}

function updateSingleMarkerAnomalyState(custCode, isManual) {
  if (!outletMarkersMap) return;
  const marker = outletMarkersMap.get(String(custCode));
  if (!marker) return;

  const item = marker.options.outletRef;
  const kecName = extractKecamatanName(item);

  if (isManual) {
    marker.setStyle({
      color: '#ef4444',
      fillColor: '#000000',
      radius: 8,
      weight: 2.5,
      fillOpacity: 1.0
    });
  } else {
    const isSystem = window.lastAnomalySet && window.lastAnomalySet.has(String(custCode));
    if (isSystem) {
      marker.setStyle({
        color: '#ef4444',
        fillColor: '#000000',
        radius: 8,
        weight: 2.5,
        fillOpacity: 1.0
      });
    } else {
      marker.setStyle({
        color: '#ffffff',
        fillColor: getKecamatanColor(kecName),
        radius: 6,
        weight: 1.2,
        fillOpacity: 0.88
      });
    }
  }

  if (marker.isPopupOpen && marker.isPopupOpen()) {
    marker.closePopup();
    setTimeout(() => marker.openPopup(), 50);
  }
}

function applyAnomalyStylesToMarkers(anomalySet) {
  if (!outletMarkersMap) return;

  outletMarkersMap.forEach((marker, code) => {
    const item = marker.options.outletRef;
    const isSystem = anomalySet.has(code);
    const isManual = window.manualAnomalySet && window.manualAnomalySet.has(code);
    const isAnomaly = isSystem || isManual;
    const kecName = extractKecamatanName(item);

    if (isAnomaly) {
      marker.setStyle({
        color: '#ef4444',
        fillColor: '#000000',
        radius: 8,
        weight: 2.5,
        fillOpacity: 1.0
      });
    } else {
      marker.setStyle({
        color: '#ffffff',
        fillColor: getKecamatanColor(kecName),
        radius: 6,
        weight: 1.2,
        fillOpacity: 0.88
      });
    }
  });
}

function clearAnomalyAudit() {
  if (anomalyLayerGroup) {
    anomalyLayerGroup.clearLayers();
  }

  if (window.lastAnomalySet) {
    window.lastAnomalySet.clear();
  }

  if (outletMarkersMap) {
    outletMarkersMap.forEach((marker, code) => {
      const item = marker.options.outletRef;
      const isManual = window.manualAnomalySet && window.manualAnomalySet.has(code);
      const kecName = extractKecamatanName(item);

      if (isManual) {
        marker.setStyle({
          color: '#ef4444',
          fillColor: '#000000',
          radius: 8,
          weight: 2.5,
          fillOpacity: 1.0
        });
      } else {
        marker.setStyle({
          color: '#ffffff',
          fillColor: getKecamatanColor(kecName),
          radius: 6,
          weight: 1.2,
          fillOpacity: 0.88
        });
      }
    });
  }
}

function highlightAnomalyMarkers(anomalyList) {
  if (!map) initMap();
  if (!map || !anomalyLayerGroup) return;

  anomalyLayerGroup.clearLayers();

  if (!anomalyList || anomalyList.length === 0) return;

  anomalyList.forEach(item => {
    const o = item.outlet;
    const lat = parseFloat(o.lat ?? o.latitude);
    const lng = parseFloat(o.lng ?? o.longitude);
    const custCode = String(o.customer_number || o.id || '-');

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const circle = L.circleMarker([lat, lng], {
      pane: 'markerPane',
      radius: 9,
      color: '#ef4444',
      fillColor: '#000000',
      fillOpacity: 1.0,
      weight: 3
    });

    circle.bindPopup(`
      <div style="font-family: 'Segoe UI', sans-serif; padding: 2px; width: auto; min-width: 200px; max-width: 280px; color: #ffffff;">
        <h4 style="margin:0 0 4px 0; color:#ef4444; font-size:12px; font-weight:700;">ANOMALI TERDETEKSI</h4>
        <div style="font-weight:700; font-size:11px; color:#ffffff;">${o.name || 'Tanpa Nama'} (${custCode})</div>
        <div style="font-size:10px; color:#ef4444; font-weight:700; margin-top:2px;">${item.reason}</div>
        <div style="font-size:10px; color:#a3a3a3; margin-top:2px;">Kec: ${o.kecamatan || '-'} | Kab: ${KODYA_MAP_FULL[o.kodya] || o.kodya || '-'}</div>
        <button onclick="window.toggleManualAnomaly('${custCode}')" style="width: 100%; margin-top: 6px; background: #dc2626; color: white; border: none; padding: 5px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer;">
          Batal Anomali
        </button>
      </div>
    `, { autoPan: false });

    circle.on('click', () => {
      if (typeof showOutletDetail === 'function') {
        showOutletDetail(o, false);
      }
    });

    anomalyLayerGroup.addLayer(circle);
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
      gradient: { 0.2: '#262626', 0.6: '#dc2626', 1.0: '#ffffff' }
    });
    heatmapLayerGroup.addLayer(heatLayer);
  }
}

function loadProvinceBoundary(provCode) {
  if (!map) initMap();
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});

window.initMap = initMap;
window.renderOutletMarkers = renderOutletMarkers;
window.drawBufferCircle = drawBufferCircle;
window.clearBufferCircle = clearBufferCircle;
window.drawSalesRoute = drawSalesRoute;
window.clearSalesRoute = clearSalesRoute;
window.updateSingleMarkerAnomalyState = updateSingleMarkerAnomalyState;
window.applyAnomalyStylesToMarkers = applyAnomalyStylesToMarkers;
window.clearAnomalyAudit = clearAnomalyAudit;
window.highlightAnomalyMarkers = highlightAnomalyMarkers;
window.renderHeatmapLayer = renderHeatmapLayer;
window.loadProvinceBoundary = loadProvinceBoundary;