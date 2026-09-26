/* ==============================================================================
   SpotRevenue Map Engine v2.1 (Geospatial Intelligence, Heatmap, Buffer & Anomaly Beacon)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

let map = null;
let markerLayerGroup = null;
let heatmapLayerGroup = null;
let bufferLayerGroup = null;
let cannibalizationLayerGroup = null;
let anomalyLayerGroup = null;
let provinceBoundaryLayer = null;
let selectedMarker = null;

// Map Indexing untuk pencarian cepat dari Search Bar
const outletMarkersMap = new Map();
window.outletMarkersMap = outletMarkersMap;

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

// Hash dinamis untuk menghasilkan warna unik yang konsisten per kecamatan
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

  // Inisialisasi Layer Group Utama
  markerLayerGroup = L.layerGroup().addTo(map);
  heatmapLayerGroup = L.layerGroup().addTo(map);
  bufferLayerGroup = L.layerGroup().addTo(map);
  cannibalizationLayerGroup = L.layerGroup().addTo(map);
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

/* ==============================================================================
   1. RENDER MARKER TITIK TOKO (MARKER MODE)
   ============================================================================== */
function renderOutletMarkers(outlets) {
  if (!map) initMap();
  if (!map || !markerLayerGroup) return;

  // Bersihkan layer & map index sebelumnya
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
      
      const kecName = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || '-');
      const territoryColor = getKecamatanColor(kecName);

      const circle = L.circleMarker([lat, lng], {
        renderer: canvasRenderer,
        radius: 5.5,
        color: '#ffffff',
        fillColor: territoryColor,
        fillOpacity: 0.9,
        weight: 1.2
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

      const custCode = item.customer_number || item.id || '-';
      const kodyaName = KODYA_MAP_FULL[item.kodya] || item.kodya || '-';
      const addressName = item.address || 'Alamat tidak tersedia';
      
      const salesmanList = Array.isArray(item.salespersons) 
        ? [...new Set(item.salespersons.filter(Boolean))].join(', ') 
        : (item.salespersons || '-');

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
            radius: 5.5
          });
        }

        circle.setStyle({
          color: '#ffffff',
          fillColor: '#f59e0b',
          radius: 9.5
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

      // REGISTRASI KE MAP INDEX DUA KUNCI UNTUK PENCARIAN PRESISI
      if (item.id) outletMarkersMap.set(String(item.id), circle);
      if (item.customer_number) outletMarkersMap.set(String(item.customer_number), circle);
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

/* ==============================================================================
   2. RENDER HEATMAP LAYER (MODE PETA PANAS)
   ============================================================================== */
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

/* ==============================================================================
   3. GEOSPATIAL INTELLIGENCE: CATCHMENT AREA (BUFFER RADIUS CIRCLE)
   ============================================================================== */
function drawBufferZone(lat, lng, radiusInMeters) {
  if (!map) initMap();
  if (!map || !bufferLayerGroup) return;

  bufferLayerGroup.clearLayers();

  if (!lat || !lng || radiusInMeters <= 0) return;

  const circle = L.circle([lat, lng], {
    radius: radiusInMeters,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.15,
    weight: 2,
    dashArray: '5, 5'
  });

  bufferLayerGroup.addLayer(circle);
  map.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
}

/* ==============================================================================
   4. KANIBALISASI WILAYAH: HIGHLIGHT CLUSTERS
   ============================================================================== */
function highlightCannibalizationClusters(clusters) {
  if (!map) initMap();
  if (!map || !cannibalizationLayerGroup) return;

  cannibalizationLayerGroup.clearLayers();

  clusters.forEach(pair => {
    const c1 = L.circleMarker([pair.o1.lat, pair.o1.lng], {
      radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2
    });
    const c2 = L.circleMarker([pair.o2.lat, pair.o2.lng], {
      radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2
    });
    const line = L.polyline([[pair.o1.lat, pair.o1.lng], [pair.o2.lat, pair.o2.lng]], {
      color: '#ef4444', weight: 2, dashArray: '4, 4'
    });

    cannibalizationLayerGroup.addLayer(c1);
    cannibalizationLayerGroup.addLayer(c2);
    cannibalizationLayerGroup.addLayer(line);
  });
}

/* ==============================================================================
   5. AUDIT GEOSPATIAL: SINAR MERAH MENYALA (PULSING RED BEACON)
   ============================================================================== */
function highlightAnomalyMarkers(anomalyList) {
  if (!map) initMap();
  if (!map || !anomalyLayerGroup) return;

  anomalyLayerGroup.clearLayers();

  if (!anomalyList || anomalyList.length === 0) return;

  const beaconIcon = L.divIcon({
    className: 'pulsing-red-beacon-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  anomalyList.forEach(item => {
    const o = item.outlet;
    const lat = parseFloat(o.lat ?? o.latitude);
    const lng = parseFloat(o.lng ?? o.longitude);

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const marker = L.marker([lat, lng], { icon: beaconIcon });
    
    marker.bindPopup(`
      <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; min-width: 200px;">
        <h4 style="margin:0 0 4px 0; color:#dc2626; font-size:13px; font-weight:700;">🚨 ANOMALI: ${o.name || 'Tanpa Nama'}</h4>
        <div style="font-size:11px; color:#991b1b; font-weight:700; margin-bottom:4px;">${item.reason}</div>
        <div style="font-size:11px; color:#475569;">Kec: ${o.kecamatan || '-'} | Kab: ${KODYA_MAP_FULL[o.kodya] || o.kodya || '-'}</div>
      </div>
    `);

    marker.on('click', () => {
      if (typeof showOutletDetail === 'function') {
        showOutletDetail(o, true);
      }
    });

    anomalyLayerGroup.addLayer(marker);
  });
}

/* ==============================================================================
   6. BORDER PROVINSI LOADER
   ============================================================================== */
function loadProvinceBoundary(provCode) {
  if (!map) initMap();
  // Fokus koordinat default Kalimantan Barat (Kode '61')
  if (provCode === '61' || !provCode) {
    map.flyTo([-0.0408, 109.3456], 8, { animate: true, duration: 1.2 });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});

// Expose fungsi ke Window Global
window.initMap = initMap;
window.renderOutletMarkers = renderOutletMarkers;
window.renderHeatmapLayer = renderHeatmapLayer;
window.drawBufferZone = drawBufferZone;
window.highlightCannibalizationClusters = highlightCannibalizationClusters;
window.highlightAnomalyMarkers = highlightAnomalyMarkers;
window.loadProvinceBoundary = loadProvinceBoundary;