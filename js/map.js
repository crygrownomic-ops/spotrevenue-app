/**
 * SpotRevenue - Map Engine & Spatial Buffer Handler
 * Lead Developer: Urai Ikhsan Fadhilah
 */

window.map = null;
window.markerGroup = null;
window.bufferGroup = null;
window.selectedOutlet = null;
window.activeOutletData = [];
window.lastFilteredOutlets = [];

const KECAMATAN_PALETTE = [
  '#dc2626', '#f59e0b', '#0284c7', '#9333ea', 
  '#16a34a', '#db2777', '#ea580c', '#65a30d', 
  '#0891b2', '#4f46e5', '#e11d48', '#d97706'
];

function initMap() {
  if (window.map) return;

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  try {
    window.map = L.map('map', {
      center: [0.9071, 108.9845],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(window.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SpotRevenue',
      maxZoom: 19
    }).addTo(window.map);

    window.markerGroup = L.featureGroup().addTo(window.map);
    window.bufferGroup = L.featureGroup().addTo(window.map);
  } catch (err) {
    console.error("Gagal menginisialisasi Leaflet map:", err);
  }
}

function getKecamatanColor(name) {
  if (!name) return '#dc2626';
  let hash = 0;
  const str = String(name).toUpperCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return KECAMATAN_PALETTE[Math.abs(hash) % KECAMATAN_PALETTE.length];
}

function getOutletDisplaySales(ot) {
  if (typeof ot.calculated_sales === 'number') {
    return ot.calculated_sales;
  }
  return ot.total_sales || 0;
}

function renderMapMarkers(outlets) {
  if (!window.map) initMap();
  if (!window.map) return;
  
  window.activeOutletData = outlets || [];
  window.lastFilteredOutlets = outlets || [];

  if (window.markerGroup) window.markerGroup.clearLayers();
  if (window.bufferGroup) window.bufferGroup.clearLayers();

  if (!outlets || outlets.length === 0) {
    updateKecamatanLegend([]);
    return;
  }

  const bounds = [];

  outlets.forEach(ot => {
    const lat = parseFloat(ot.lat || ot.latitude);
    const lng = parseFloat(ot.lng || ot.longitude);

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    bounds.push([lat, lng]);

    let kecName = 'Lainnya';
    if (Array.isArray(ot.kecamatan) && ot.kecamatan.length > 0) {
      kecName = ot.kecamatan.join(', ');
    } else if (ot.kecamatan || ot.kec) {
      kecName = String(ot.kecamatan || ot.kec);
    }

    const kabName = ot.kodya || ot.kabupaten || ot.kab || '-';

    let salesman = '-';
    if (Array.isArray(ot.salespersons) && ot.salespersons.length > 0) {
      salesman = ot.salespersons.join(', ');
    } else if (ot.salesperson || ot.salesman || ot.sales) {
      salesman = String(ot.salesperson || ot.salesman || ot.sales);
    }

    const displayVal = getOutletDisplaySales(ot);
    const primaryKec = Array.isArray(ot.kecamatan) ? (ot.kecamatan[0] || 'Lainnya') : kecName;

    const circle = L.circleMarker([lat, lng], {
      radius: 7,
      fillColor: getKecamatanColor(primaryKec),
      color: '#ffffff',
      weight: 1.8,
      opacity: 1,
      fillOpacity: 0.95
    });

    const modeLabel = window.currentCalcMode === 'avg' ? 'Rata-Rata Penjualan' : 'Total Penjualan';

    const popupContent = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; color: #1e293b; min-width: 220px;">
        <div style="font-weight: 700; font-size: 13px; color: #dc2626; margin-bottom: 2px;">
          ${ot.name || ot.nama || 'Tanpa Nama'}
        </div>
        <div style="font-size: 10.5px; color: #d97706; font-weight: 700; margin-bottom: 6px;">
          Kode Customer: ${ot.customer_number || ot.cust_no || ot.id || '-'}
        </div>
        <div style="font-size: 11px; color: #334155; line-height: 1.4; margin-bottom: 8px;">
          <b>Salesman:</b> ${salesman}<br>
          <b>Kabupaten:</b> ${kabName}<br>
          <b>Kecamatan:</b> ${kecName}<br>
          <b>Alamat:</b> ${ot.address || ot.alamat || '-'}
        </div>
        <div style="font-size: 11.5px; color: #ef4444; border-top: 1px dashed #cbd5e1; padding-top: 6px; font-weight: 800;">
          ${modeLabel}: ${window.formatMetricValue ? window.formatMetricValue(displayVal, window.currentMetric) : displayVal}
        </div>
      </div>
    `;

    circle.bindPopup(popupContent);
    circle.on('click', () => selectOutlet(ot));
    window.markerGroup.addLayer(circle);
  });

  if (bounds.length > 0) {
    window.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  updateKecamatanLegend(outlets);
}

// FIX UTAMA: Pemasangan window.selectedOutlet dan pemicu radius otomatis saat toko diklik
function selectOutlet(ot) {
  if (!ot) return;

  // 1. Simpan toko terpilih ke global variable
  window.selectedOutlet = ot;

  // 2. Update teks toko terpilih di modul Spasial
  const targetLabel = document.getElementById('spasial-selected-outlet-name');
  if (targetLabel) {
    targetLabel.innerHTML = `<b style="color:#f59e0b;">${ot.name || ot.nama || 'Tanpa Nama'}</b><br><small style="color:#cbd5e1;">Kode: ${ot.customer_number || ot.cust_no || ot.id || '-'}</small>`;
  }

  // 3. Update Profil Toko
  updateOutletProfileCard(ot);
  
  // 4. Buka Popup Marker di Peta
  if (window.markerGroup) {
    window.markerGroup.eachLayer(layer => {
      if (layer.getLatLng) {
        const p = layer.getLatLng();
        const oLat = parseFloat(ot.lat || ot.latitude);
        const oLng = parseFloat(ot.lng || ot.longitude);
        if (Math.abs(p.lat - oLat) < 0.0001 && Math.abs(p.lng - oLng) < 0.0001) {
          layer.openPopup();
        }
      }
    });
  }

  // 5. GAMBAR KEMBALI CATCHMENT RADIUS
  const radiusSelect = document.getElementById('select-buffer-radius');
  let radiusVal = parseFloat(radiusSelect?.value);
  if (isNaN(radiusVal) || radiusVal <= 0) {
    radiusVal = 1000; // Default 1 KM jika select belum terpilih
    if (radiusSelect) radiusSelect.value = "1000";
  }

  if (typeof window.drawBufferRadius === 'function') {
    window.drawBufferRadius(ot, radiusVal / 1000);
  }
}

function updateOutletProfileCard(ot) {
  if (!ot) return;

  const metricKey = window.currentMetric || 'val';
  const displayVal = getOutletDisplaySales(ot);

  const nameEl = document.getElementById('profil-outlet-nama');
  if (nameEl) nameEl.innerText = ot.name || ot.nama || 'TANPA NAMA';

  const custEl = document.getElementById('profil-outlet-kode');
  if (custEl) custEl.innerText = `Kode Customer: ${ot.customer_number || ot.cust_no || ot.id || '-'}`;

  let salesman = '-';
  if (Array.isArray(ot.salespersons) && ot.salespersons.length > 0) {
    salesman = ot.salespersons.join(', ');
  } else if (ot.salesperson || ot.salesman || ot.sales) {
    salesman = String(ot.salesperson || ot.salesman || ot.sales);
  }
  const salesEl = document.getElementById('profil-outlet-salesman');
  if (salesEl) salesEl.innerText = salesman;

  const kabEl = document.getElementById('profil-outlet-kabupaten');
  if (kabEl) kabEl.innerText = ot.kodya || ot.kabupaten || ot.kab || '-';

  let kecName = '-';
  if (Array.isArray(ot.kecamatan) && ot.kecamatan.length > 0) {
    kecName = ot.kecamatan.join(', ');
  } else if (ot.kecamatan || ot.kec) {
    kecName = String(ot.kecamatan || ot.kec);
  }
  const kecEl = document.getElementById('profil-outlet-kecamatan');
  if (kecEl) kecEl.innerText = kecName;

  const addrEl = document.getElementById('profil-outlet-alamat');
  if (addrEl) addrEl.innerText = ot.address || ot.alamat || '-';

  const rangeMonths = window.currentMonthRange || [];
  const monthCount = rangeMonths.length > 0 ? rangeMonths.length : 1;
  const rangeTotal = ot.range_total_sales ?? displayVal;
  const avgMonthly = rangeTotal / monthCount;

  const lblTotalEl = document.getElementById('label-profil-total');
  if (lblTotalEl) {
    const rangeText = rangeMonths.length > 0 ? ` (${rangeMonths[0]}-${rangeMonths[rangeMonths.length - 1]})` : '';
    lblTotalEl.innerText = `TOTAL ${metricKey.toUpperCase()}${rangeText}`;
  }

  const valTotalEl = document.getElementById('profil-outlet-total-omset');
  if (valTotalEl && typeof window.formatMetricValue === 'function') {
    valTotalEl.innerText = window.formatMetricValue(rangeTotal, metricKey);
  }

  const valAvgEl = document.getElementById('profil-outlet-avg-omset');
  if (valAvgEl && typeof window.formatMetricValue === 'function') {
    valAvgEl.innerText = `${window.formatMetricValue(avgMonthly, metricKey)} / bln`;
  }

  const brandContainer = document.getElementById('profil-outlet-brand-list');
  if (brandContainer) {
    const brands = ot.top_brands || [];
    if (Array.isArray(brands) && brands.length > 0) {
      let html = '<div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">';
      brands.forEach(b => {
        const bSalesFormatted = typeof window.formatMetricValue === 'function' ? window.formatMetricValue(b.sales || 0, metricKey) : (b.sales || 0);
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #262626; padding: 6px 10px; border-radius: 4px; font-size: 11px;">
            <span style="color: #f59e0b; font-weight: bold;">${b.brand || 'Lainnya'}</span>
            <span style="color: #ffffff;">${bSalesFormatted}</span>
          </div>
        `;
      });
      html += '</div>';
      brandContainer.innerHTML = html;
    } else {
      brandContainer.innerHTML = '<p style="color: #9ca3af; font-size: 11px; font-style: italic; margin-top: 8px;">Data breakdown per brand tidak tersedia.</p>';
    }
  }
}

function updateKecamatanLegend(outletsData) {
  const floatLegendList = document.getElementById('float-legend-list');
  if (!floatLegendList) return;

  if (!outletsData || outletsData.length === 0) {
    floatLegendList.innerHTML = '<div style="color:#94a3b8; font-style:italic;">Data kecamatan belum tersedia.</div>';
    return;
  }

  const kecamatanMap = new Map();
  outletsData.forEach(ot => {
    let rawKec = 'Lainnya';
    if (Array.isArray(ot.kecamatan) && ot.kecamatan.length > 0) {
      rawKec = ot.kecamatan[0];
    } else if (ot.kecamatan || ot.kec) {
      rawKec = String(ot.kecamatan || ot.kec);
    }
    const kecName = rawKec.toUpperCase().trim();
    if (!kecamatanMap.has(kecName)) {
      kecamatanMap.set(kecName, getKecamatanColor(kecName));
    }
  });

  let html = '';
  kecamatanMap.forEach((color, kecName) => {
    html += `
      <div style="display:flex; align-items:center; gap:8px; padding:3px 0;">
        <span style="width:10px; height:10px; border-radius:50%; background-color: ${color}; display:inline-block;"></span>
        <span style="color:#ffffff;">${kecName}</span>
      </div>
    `;
  });

  floatLegendList.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initMap);

window.initMap = initMap;
window.renderMapMarkers = renderMapMarkers;
window.selectOutlet = selectOutlet;
window.updateOutletProfileCard = updateOutletProfileCard;