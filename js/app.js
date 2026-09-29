/* ==============================================================================
   SpotRevenue Application Controller v5.0 (Enterprise Dashboard Edition)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

const DEFAULT_PROVINSI = [
  { code: "61", name: "KALIMANTAN BARAT" }, { code: "11", name: "ACEH" },
  { code: "12", name: "SUMATERA UTARA" }, { code: "13", name: "SUMATERA BARAT" },
  { code: "14", name: "RIAU" }, { code: "15", name: "JAMBI" },
  { code: "16", name: "SUMATERA SELATAN" }, { code: "17", name: "BENGKULU" },
  { code: "18", name: "LAMPUNG" }, { code: "19", name: "KEPULAUAN BANGKA BELITUNG" },
  { code: "21", name: "KEPULAUAN RIAU" }, { code: "31", name: "DKI JAKARTA" },
  { code: "32", name: "JAWA BARAT" }, { code: "33", name: "JAWA TENGAH" },
  { code: "34", name: "DI YOGYAKARTA" }, { code: "35", name: "JAWA TIMUR" },
  { code: "36", name: "BANTEN" }, { code: "51", name: "BALI" },
  { code: "52", name: "NUSA TENGGARA BARAT" }, { code: "53", name: "NUSA TENGGARA TIMUR" },
  { code: "62", name: "KALIMANTAN TENGAH" }, { code: "63", name: "KALIMANTAN SELATAN" },
  { code: "64", name: "KALIMANTAN TIMUR" }, { code: "65", name: "KALIMANTAN UTARA" },
  { code: "71", name: "SULAWESI UTARA" }, { code: "72", name: "SULAWESI TENGAH" },
  { code: "73", name: "SULAWESI SELATAN" }, { code: "74", name: "SULAWESI TENGGARA" },
  { code: "75", name: "GORONTALO" }, { code: "76", name: "SULAWESI BARAT" },
  { code: "81", name: "MALUKU" }, { code: "82", name: "MALUKU UTARA" },
  { code: "91", name: "PAPUA BARAT" }, { code: "92", name: "PAPUA" },
  { code: "93", name: "PAPUA SELATAN" }, { code: "94", name: "PAPUA TENGAH" },
  { code: "95", name: "PAPUA PEGUNUNGAN" }, { code: "96", name: "PAPUA BARAT DAYA" }
];

const KODYA_MAP = {
  'PTK': 'KOTA PONTIANAK', 'SKW': 'KOTA SINGKAWANG', 'KRY': 'KABUPATEN KUBU RAYA',
  'PNK': 'KABUPATEN MEMPAWAH', 'SBS': 'KABUPATEN SAMBAS', 'BKY': 'KABUPATEN BENGKAYANG',
  'LDK': 'KABUPATEN LANDAK', 'SGU': 'KABUPATEN SANGGAU', 'STG': 'KABUPATEN SINTANG',
  'MLW': 'KABUPATEN MELAWI', 'KTP': 'KABUPATEN KETAPANG', 'KPH': 'KABUPATEN KAPUAS HULU'
};

const KODYA_CENTERS = {
  'PTK': [-0.0263, 109.3425], 'SKW': [0.8917, 108.9858], 'KRY': [-0.1333, 109.3500],
  'PNK': [0.3667, 108.9667], 'SBS': [1.3500, 109.3000], 'BKY': [0.8167, 108.9500],
  'LDK': [0.4167, 109.9500], 'SGU': [0.1167, 110.5833], 'STG': [0.0667, 111.4833],
  'MLW': [-0.3333, 111.7000], 'KTP': [-1.8333, 109.9667], 'KPH': [0.8833, 112.9333]
};

const KODYA_MAX_DIST_KM = {
  'PTK': 18, 'SKW': 18, 'PNK': 35, 'KRY': 45, 'BKY': 40, 'LDK': 45,
  'SBS': 50, 'SGU': 60, 'STG': 65, 'MLW': 65, 'KTP': 70, 'KPH': 70
};

const ALL_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
let selectedMonths = [...ALL_MONTHS];

let activeMetric = 'val';
window.activeMetric = activeMetric;
let activeOutletData = [];
let selectedOutlet = null;
window.selectedOutlet = null;

let activePerfFilter = null;
let activeQuadrantFilter = null;
let isHeatmapActive = false;
let dashBrandChart = null;
let dashTrendChart = null;
let dashCalcMode = 'total';
let lastAnomalyList = [];

const manualAnomalySet = new Set();
window.manualAnomalySet = manualAnomalySet;

const lastAnomalySet = new Set();
window.lastAnomalySet = lastAnomalySet;

window.quadrantStats = { stars: 0, cows: 0, questions: 0, risks: 0 };

/* HELPER DENGAN FORMATTING METRIK SESUAI SPESIFIKASI ABAH */
function formatMetricValue(val, metric = activeMetric) {
  const formatted = Math.round(val || 0).toLocaleString('id-ID');
  if (metric === 'val') return `Rp ${formatted}`;
  if (metric === 'box') return `${formatted} BOX`;
  return `${formatted} Unit`;
}

/* SISTEM DUAL TEMA TAMPILAN APLIKASI (SIDEBAR & DASHBOARD UI) */
function initThemeEngine() {
  const savedTheme = localStorage.getItem('spotrev_app_theme') || 'dark';
  applyAppTheme(savedTheme);

  const btnTheme = document.getElementById('btn-toggle-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyAppTheme(nextTheme);
      showToast(`Tema UI Aplikasi Diubah Ke: ${nextTheme === 'light' ? 'TERANG (LIGHT)' : 'GELAP (DARK)'}`);
    });
  }
}

function applyAppTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
  } else {
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
  }
  localStorage.setItem('spotrev_app_theme', theme);
  injectThemeStyles();
}

function injectThemeStyles() {
  let styleEl = document.getElementById('app-theme-dynamic-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'app-theme-dynamic-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    /* TEMA TERANG UNTUK SIDEBAR, PANEL, MODAL, DAN HASIL ANALISIS APLIKASI */
    body.theme-light #sidebar,
    body.theme-light .sidebar-container,
    body.theme-light .module-content-pane,
    body.theme-light .section-card,
    body.theme-light .floating-widget,
    body.theme-light #global-search-container input {
      background-color: #ffffff !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
    }

    body.theme-light #sidebar *,
    body.theme-light .section-card *,
    body.theme-light .module-content-pane * {
      color: #0f172a !important;
    }

    body.theme-light .text-sub,
    body.theme-light .sidebar-footer,
    body.theme-light small {
      color: #475569 !important;
    }

    body.theme-light #ai-summary-output,
    body.theme-light #anomaly-audit-results,
    body.theme-light #cannibalization-results-container,
    body.theme-light #buffer-analysis-result,
    body.theme-light #route-steps-container {
      background: #f8fafc !important;
      border-color: #cbd5e1 !important;
      color: #0f172a !important;
    }

    body.theme-light #ai-summary-output *,
    body.theme-light #anomaly-audit-results *,
    body.theme-light #cannibalization-results-container *,
    body.theme-light #buffer-analysis-result *,
    body.theme-light #route-steps-container * {
      color: #0f172a !important;
    }

    body.theme-light .btn-module-nav {
      background: #e2e8f0 !important;
      color: #334155 !important;
    }

    body.theme-light .btn-module-nav.active {
      background: #dc2626 !important;
      color: #ffffff !important;
    }

    body.theme-light select,
    body.theme-light input[type="text"],
    body.theme-light input[type="number"],
    body.theme-light input[type="password"] {
      background-color: #ffffff !important;
      color: #0f172a !important;
      border: 1px solid #cbd5e1 !important;
    }

    body.theme-light .btn-month-pill {
      background: #e2e8f0 !important;
      color: #334155 !important;
      border: 1px solid #cbd5e1 !important;
    }

    body.theme-light .btn-month-pill.active {
      background: #dc2626 !important;
      color: #ffffff !important;
    }

    body.theme-light .bcg-quad {
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
    }
    body.theme-light .bcg-quad * {
      color: #0f172a !important;
    }
  `;
}

function resetBCGFilter() {
  activeQuadrantFilter = null;
  const quadCards = document.querySelectorAll('.bcg-quad');
  quadCards.forEach(c => c.classList.remove('active-filter'));
  applyFilters();
  showToast("Filter Kuadran BCG Direset: Menampilkan Seluruh Toko Awal.");
}
window.resetBCGFilter = resetBCGFilter;

function toggleManualAnomaly(custCode) {
  if (!custCode) return;
  const key = String(custCode);

  let targetOutlet = null;
  for (const o of activeOutletData) {
    if (String(o.customer_number || o.id) === key) {
      targetOutlet = o;
      break;
    }
  }

  if (manualAnomalySet.has(key)) {
    manualAnomalySet.delete(key);
    lastAnomalySet.delete(key);
    showToast(`Status Anomali Dilepaskan: Outlet ${key}`);
  } else {
    manualAnomalySet.add(key);
    lastAnomalySet.add(key);
    showToast(`Outlet [${key}] Ditandai Anomali Manual`);

    if (targetOutlet) {
      const existsInList = lastAnomalyList.some(item => String(item.outlet.customer_number || item.outlet.id) === key);
      if (!existsInList) {
        lastAnomalyList.push({ outlet: targetOutlet, reason: "Ditandai Manual oleh User" });
      }
    }
  }

  if (typeof window.updateSingleMarkerAnomalyState === 'function') {
    window.updateSingleMarkerAnomalyState(key, manualAnomalySet.has(key));
  }

  if (selectedOutlet && String(selectedOutlet.customer_number || selectedOutlet.id) === key) {
    showOutletDetail(selectedOutlet, false);
  }

  updateAnomalyResultUI();
}
window.toggleManualAnomaly = toggleManualAnomaly;

const VALID_USERS = ['admin', 'user', 'spotrevenue'];
const VALID_PASSWORDS = ['spotrev2026', '2026'];

function checkAppAuthentication() {
  const authModal = document.getElementById('auth-modal');
  const isAuth = sessionStorage.getItem('spotrevenue_auth');

  if (isAuth === 'true') {
    if (authModal) authModal.style.display = 'none';
  } else {
    if (authModal) authModal.style.display = 'flex';
    setupAuthListeners();
  }
}

function setupAuthListeners() {
  const btnSubmit = document.getElementById('btn-submit-auth');
  const inputUser = document.getElementById('auth-user-input');
  const inputPin = document.getElementById('auth-pin-input');
  const errorMsg = document.getElementById('auth-error-msg');
  const authModal = document.getElementById('auth-modal');

  const handleLogin = () => {
    const userVal = inputUser ? inputUser.value.trim().toLowerCase() : '';
    const passVal = inputPin ? inputPin.value.trim() : '';

    const isUserValid = VALID_USERS.includes(userVal) || userVal === '';
    const isPassValid = VALID_PASSWORDS.includes(passVal);

    if ((isUserValid && isPassValid) || passVal === '2026' || passVal === 'spotrev2026') {
      sessionStorage.setItem('spotrevenue_auth', 'true');
      if (authModal) authModal.style.display = 'none';
      showToast('Akses Diberikan. Selamat Datang!');
    } else {
      if (errorMsg) errorMsg.style.display = 'block';
      if (inputPin) {
        inputPin.value = '';
        inputPin.focus();
      }
    }
  };

  if (btnSubmit) btnSubmit.addEventListener('click', handleLogin);
  [inputUser, inputPin].forEach(input => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
      });
    }
  });

  if (inputUser) setTimeout(() => inputUser.focus(), 100);
}

function showLoading(text) {
  const overlay = document.getElementById('loading-overlay');
  const msg = document.getElementById('loading-msg');
  if (msg) msg.innerText = text;
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3200);
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

document.addEventListener('DOMContentLoaded', async () => {
  checkAppAuthentication();
  initThemeEngine();

  const sidebar = document.getElementById('sidebar');
  const triggerZone = document.getElementById('sidebar-trigger-zone');
  const btnPin = document.getElementById('btn-pin-sidebar');
  const btnReset = document.getElementById('btn-reset-db');
  const btnResetMap = document.getElementById('btn-reset-map-view');
  const btnExportFiltered = document.getElementById('btn-export-filtered-excel');

  const moduleBtns = document.querySelectorAll('.btn-module-nav');
  const modulePanes = document.querySelectorAll('.module-content-pane');

  moduleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetModulId = btn.getAttribute('data-modul');
      if (!targetModulId) return;

      moduleBtns.forEach(b => b.classList.remove('active'));
      modulePanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetModulId);
      if (targetPane) targetPane.classList.add('active');

      if (targetModulId === 'modul-intelijen') {
        generateExecutiveSummary();
      } else if (targetModulId === 'modul-spasial') {
        updateBufferZoneAnalysis();
      }
    });
  });

  if (triggerZone) {
    triggerZone.addEventListener('mouseenter', () => sidebar.classList.add('sidebar-expanded'));
  }

  if (sidebar) {
    sidebar.addEventListener('mouseleave', () => {
      if (!sidebar.classList.contains('pinned')) {
        sidebar.classList.remove('sidebar-expanded');
      }
    });
  }

  if (btnPin) {
    btnPin.addEventListener('click', () => {
      sidebar.classList.toggle('pinned');
      btnPin.classList.toggle('active');
      showToast(sidebar.classList.contains('pinned') ? 'Sidebar Dikunci' : 'Sidebar Auto-Collapse');
    });
  }

  if (btnResetMap) {
    btnResetMap.addEventListener('click', () => {
      if (typeof window.resetMapView === 'function') {
        window.resetMapView();
        showToast("Tampilan Peta Direset ke Posisi Terbaik");
      }
    });
  }

  if (btnExportFiltered) {
    btnExportFiltered.addEventListener('click', exportFilteredDataToCSV);
  }

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm("Bersihkan seluruh memori peta tersimpan dan muat ulang?")) {
        if (window.db) {
          await window.db.delete();
        }
        localStorage.clear();
        location.reload();
      }
    });
  }

  setupMetricSwitchListeners();
  setupIdeaLabFeatures();
  setupSpatialModuleListeners();
  setupGlobalSearchListeners();
  setupUploadListener('input-val', 'outlets_val', 'status-val', 'label-val', 'val');
  setupUploadListener('input-box', 'outlets_box', 'status-box', 'label-box', 'box');
  setupUploadListener('input-uom', 'outlets_uom', 'status-uom', 'label-uom', 'uom');

  setupMonthFilterListeners();
  setupFilterListeners();
  initProvinsiDropdown();
  await updateAllMetricStatuses();

  const elProv = document.getElementById('select-provinsi');
  if (elProv && typeof loadProvinceBoundary === 'function') {
    loadProvinceBoundary(elProv.value || '61');
  }

  await autoDetectAndLoadMetric();
});

function exportFilteredDataToCSV() {
  const dataset = window.lastFilteredOutlets || activeOutletData;
  if (!dataset || dataset.length === 0) {
    showToast("Tidak ada data toko terfilter untuk di-export!");
    return;
  }

  let csvContent = "\uFEFFKode Customer,Nama Toko,Kabupaten/Kodya,Kecamatan,Alamat,Salesperson,Omset Akumulasi,Status Toko\n";

  dataset.forEach(o => {
    const custCode = `"${(o.customer_number || o.id || '').toString().replace(/"/g, '""')}"`;
    const name = `"${(o.name || '').toString().replace(/"/g, '""')}"`;
    const kodya = `"${(KODYA_MAP[o.kodya] || o.kodya || '').toString().replace(/"/g, '""')}"`;
    const kecName = typeof extractKecamatanName === 'function' ? extractKecamatanName(o) : '';
    const kec = `"${kecName.replace(/"/g, '""')}"`;
    const alamat = `"${(o.address || '').toString().replace(/"/g, '""')}"`;
    const salespersons = `"${(Array.isArray(o.salespersons) ? o.salespersons.join(', ') : (o.salespersons || '')).replace(/"/g, '""')}"`;
    const sales = o.current_total || 0;
    
    const isManual = window.manualAnomalySet.has(String(o.customer_number || o.id));
    const isSystem = window.lastAnomalySet.has(String(o.customer_number || o.id));
    const status = isManual || isSystem ? "Anomali Koordinat" : "Normal";

    csvContent += `${custCode},${name},${kodya},${kec},${alamat},${salespersons},${sales},${status}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const aLink = document.createElement('a');
  aLink.setAttribute('href', url);
  aLink.setAttribute('download', `SpotRevenue_Filtered_Outlets_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);

  showToast(`Berhasil Mengunduh Data ${dataset.length} Toko!`);
}

function setupSpatialModuleListeners() {
  const radiusSelect = document.getElementById('select-buffer-radius');
  if (radiusSelect) {
    radiusSelect.addEventListener('change', updateBufferZoneAnalysis);
  }

  const btnCoverage = document.getElementById('btn-check-cannibalization');
  if (btnCoverage) {
    btnCoverage.addEventListener('click', checkCoverageGapAnalysis);
  }

  const btnAudit = document.getElementById('btn-run-anomaly-audit');
  if (btnAudit) {
    btnAudit.addEventListener('click', runCoordinateAnomalyAudit);
  }

  const btnStopAudit = document.getElementById('btn-stop-anomaly-audit');
  if (btnStopAudit) {
    btnStopAudit.addEventListener('click', stopCoordinateAnomalyAudit);
  }

  const btnExportAudit = document.getElementById('btn-export-anomaly-excel');
  if (btnExportAudit) {
    btnExportAudit.addEventListener('click', exportAnomalyToExcel);
  }
}

/* CATCHMENT RADIUS MULTI-METRIK (VALUE, BOX, UOM) + RERATA BULAN */
async function updateBufferZoneAnalysis() {
  const radiusSelect = document.getElementById('select-buffer-radius');
  const resultBox = document.getElementById('buffer-analysis-result');
  const nameBox = document.getElementById('spasial-selected-outlet-name');

  if (!selectedOutlet) {
    if (nameBox) nameBox.innerText = "Belum ada toko terpilih. Klik salah satu titik toko pada peta!";
    if (resultBox) resultBox.innerHTML = `<span>Petunjuk: Klik salah satu toko pada peta, lalu tentukan radius untuk menampilkan area jangkauan pada peta secara visual.</span>`;
    if (typeof window.clearBufferCircle === 'function') window.clearBufferCircle();
    return;
  }

  const radiusMeters = parseInt(radiusSelect ? radiusSelect.value : '1000');
  const lat = parseFloat(selectedOutlet.lat ?? selectedOutlet.latitude);
  const lng = parseFloat(selectedOutlet.lng ?? selectedOutlet.longitude);

  if (nameBox) {
    nameBox.innerHTML = `<b>${selectedOutlet.name}</b> <span style="color: #ef4444; font-size: 11px;">(${selectedOutlet.customer_number || selectedOutlet.id})</span>`;
  }

  if (radiusMeters <= 0) {
    if (resultBox) resultBox.innerHTML = `<span>Lingkaran radius dinonaktifkan.</span>`;
    if (typeof window.clearBufferCircle === 'function') window.clearBufferCircle();
    return;
  }

  if (isNaN(lat) || isNaN(lng)) {
    if (resultBox) resultBox.innerHTML = `<span style="color: #ef4444;">Koordinat toko tidak valid.</span>`;
    return;
  }

  const dataset = window.lastFilteredOutlets || activeOutletData;
  const nearbyOutlets = [];

  dataset.forEach(o => {
    const oLat = parseFloat(o.lat ?? o.latitude);
    const oLng = parseFloat(o.lng ?? o.longitude);
    if (!isNaN(oLat) && !isNaN(oLng)) {
      const dist = getDistanceInMeters(lat, lng, oLat, oLng);
      if (dist <= radiusMeters) {
        nearbyOutlets.push(o);
      }
    }
  });

  const numMonths = Math.max(1, selectedMonths.length);
  const nearbyKeys = new Set(nearbyOutlets.map(o => String(o.customer_number || o.id)));

  let totalVal = 0, totalBox = 0, totalUom = 0;

  try {
    if (window.db) {
      const [valData, boxData, uomData] = await Promise.all([
        window.db.outlets_val ? window.db.outlets_val.toArray() : [],
        window.db.outlets_box ? window.db.outlets_box.toArray() : [],
        window.db.outlets_uom ? window.db.outlets_uom.toArray() : []
      ]);

      const sumMetric = (dataArray) => {
        let sum = 0;
        dataArray.forEach(item => {
          const key = String(item.customer_number || item.id);
          if (nearbyKeys.has(key)) {
            if (item.monthly_sales && selectedMonths.length > 0) {
              selectedMonths.forEach(m => { sum += (item.monthly_sales[m] || 0); });
            } else {
              sum += (item.total_sales || 0);
            }
          }
        });
        return sum;
      };

      totalVal = valData.length > 0 ? sumMetric(valData) : (activeMetric === 'val' ? nearbyOutlets.reduce((s, x) => s + (x.current_total || 0), 0) : 0);
      totalBox = boxData.length > 0 ? sumMetric(boxData) : (activeMetric === 'box' ? nearbyOutlets.reduce((s, x) => s + (x.current_total || 0), 0) : 0);
      totalUom = uomData.length > 0 ? sumMetric(uomData) : (activeMetric === 'uom' ? nearbyOutlets.reduce((s, x) => s + (x.current_total || 0), 0) : 0);
    } else {
      const sumActive = nearbyOutlets.reduce((s, x) => s + (x.current_total || 0), 0);
      if (activeMetric === 'val') totalVal = sumActive;
      else if (activeMetric === 'box') totalBox = sumActive;
      else if (activeMetric === 'uom') totalUom = sumActive;
    }
  } catch (err) {
    console.warn("Gagal membaca multi-metrik catchment radius:", err);
  }

  const avgVal = totalVal / numMonths;
  const avgBox = totalBox / numMonths;
  const avgUom = totalUom / numMonths;

  if (resultBox) {
    resultBox.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px; font-size: 11px;">Hasil Analysis Catchment Radius (${radiusMeters >= 1000 ? (radiusMeters/1000) + ' km' : radiusMeters + ' m'}):</div>
      <div style="margin-bottom: 6px; font-size: 10.5px;">• Jumlah Toko Dalam Radius: <b>${nearbyOutlets.length.toLocaleString('id-ID')} Toko</b> (${numMonths} Bulan Terpilih)</div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 10.5px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
        <div><b>1. VALUE (Rupiah):</b></div>
        <div style="padding-left: 10px;">- Total: <b style="color: #ef4444;">${formatMetricValue(totalVal, 'val')}</b> | Rerata: <b>${formatMetricValue(avgVal, 'val')}/bln</b></div>

        <div style="margin-top: 3px;"><b>2. BOX (Karton):</b></div>
        <div style="padding-left: 10px;">- Total: <b style="color: #ef4444;">${formatMetricValue(totalBox, 'box')}</b> | Rerata: <b>${formatMetricValue(avgBox, 'box')}/bln</b></div>

        <div style="margin-top: 3px;"><b>3. UOM (Satuan Terkecil):</b></div>
        <div style="padding-left: 10px;">- Total: <b style="color: #ef4444;">${formatMetricValue(totalUom, 'uom')}</b> | Rerata: <b>${formatMetricValue(avgUom, 'uom')}/bln</b></div>
      </div>
    `;
  }

  if (typeof window.drawBufferCircle === 'function') {
    window.drawBufferCircle([lat, lng], radiusMeters);
  }
}

function renderKecamatanLegendWidget() {
  const container = document.getElementById('widget-legend-list');
  if (!container) return;

  const dataset = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
                  ? window.lastFilteredOutlets
                  : activeOutletData;

  if (!dataset || dataset.length === 0) {
    container.innerHTML = `<div style="font-size:10.5px;">Tidak ada data toko terfilter.</div>`;
    return;
  }

  const kecMap = {};
  dataset.forEach(item => {
    const kec = typeof extractKecamatanName === 'function' ? extractKecamatanName(item) : 'LAINNYA';
    kecMap[kec] = (kecMap[kec] || 0) + 1;
  });

  const sortedKec = Object.keys(kecMap).sort((a,b) => kecMap[b] - kecMap[a]);

  let html = '';
  sortedKec.forEach(kec => {
    const color = typeof getKecamatanColor === 'function' ? getKecamatanColor(kec) : '#dc2626';
    const count = kecMap[kec];
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px; background: rgba(255,255,255,0.03); border-radius: 4px; border-left: 4px solid ${color};">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
          <span style="font-weight: 600; font-size: 11px;">${kec}</span>
        </div>
        <span style="font-size: 10px;">${count} Toko</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function normalizeFieldArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(v => String(v).trim()).filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

function getOutletKey(outlet) {
  return String(outlet?.customer_number || outlet?.id || outlet?.name || '');
}

function getOutletSales(outlet) {
  const value = Number(outlet?.current_total ?? outlet?.total_sales ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkCoverageGapAnalysis() {
  const dataset = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
    ? window.lastFilteredOutlets
    : activeOutletData;

  if (!Array.isArray(dataset) || dataset.length === 0) {
    showToast("Belum ada data toko terimpor atau terfilter untuk dianalisis.");
    return;
  }

  showLoading("Menganalisis Coverage Gap & Potensi Wilayah...");

  setTimeout(() => {
    try {
      const kecMap = {};
      let grandTotalSales = 0;

      dataset.forEach(item => {
        const kec = typeof extractKecamatanName === 'function' ? extractKecamatanName(item) : 'LAINNYA';
        const sales = getOutletSales(item);
        grandTotalSales += sales;

        if (!kecMap[kec]) {
          kecMap[kec] = { count: 0, sales: 0, outlets: [] };
        }
        kecMap[kec].count++;
        kecMap[kec].sales += sales;
        kecMap[kec].outlets.push(item);
      });

      const kecList = Object.keys(kecMap).map(k => {
        const avg = kecMap[k].sales / kecMap[k].count;
        return {
          kecamatan: k,
          count: kecMap[k].count,
          sales: kecMap[k].sales,
          avgSales: avg,
          outlets: kecMap[k].outlets
        };
      });

      kecList.sort((a, b) => b.sales - a.sales);

      renderCoverageGapResultsUI(kecList, grandTotalSales, dataset.length);
      showToast(`Analisis Selesai: ${kecList.length} Kecamatan Terpetakan.`);

    } catch (err) {
      console.error("Gagal menganalisis coverage gap:", err);
      showToast("Terjadi kesalahan saat menganalisis coverage gap.");
    } finally {
      hideLoading();
    }
  }, 100);
}

function renderCoverageGapResultsUI(kecList, grandTotalSales, totalOutletCount) {
  const parentBtn = document.getElementById('btn-check-cannibalization');
  if (!parentBtn) return;

  const parentCard = parentBtn.closest('.section-card');
  if (!parentCard) return;

  let resultContainer = document.getElementById('cannibalization-results-container');
  if (!resultContainer) {
    resultContainer = document.createElement('div');
    resultContainer.id = 'cannibalization-results-container';
    parentCard.appendChild(resultContainer);
  }

  resultContainer.style.cssText =
    'margin-top: 12px; max-height: 360px; overflow-y: auto;' +
    'border: 1px solid #dc2626; border-radius: 6px; padding: 10px; display: block !important;';

  let html = `
    <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
      <span>Profil Coverage Wilayah</span>
      <span style="font-weight: 400; font-size: 10px;">${kecList.length} Kecamatan</span>
    </div>

    <button id="btn-reset-coverage-filter"
      style="width: 100%; margin-bottom: 8px; background: #262626; border: 1px solid #404040;
      color: #ffffff; padding: 6px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer; transition: 0.2s;">
      Tampilkan Semua Outlet (Reset Filter)
    </button>

    <div style="font-size: 10px; margin-bottom: 8px; border-bottom: 1px solid #333333; padding-bottom: 6px;">
      Total Akumulasi: <b style="color: #ef4444;">${formatMetricValue(grandTotalSales)}</b> dari <b>${totalOutletCount} Toko</b>.
    </div>

    <div class="coverage-list-wrapper">
  `;

  kecList.forEach((item, idx) => {
    const contribPct = grandTotalSales > 0 ? ((item.sales / grandTotalSales) * 100).toFixed(1) : '0';
    const isHotspot = idx < Math.max(1, Math.ceil(kecList.length * 0.2));
    const tagBg = isHotspot ? 'background: #dc2626; color: #ffffff;' : 'background: #262626; border: 1px solid #404040;';
    const tagText = isHotspot ? 'HOTSPOT' : 'REGULAR';

    html += `
      <div class="coverage-kec-item" data-kec="${escapeHtml(item.kecamatan)}" data-idx="${idx}"
        style="padding: 8px; border-bottom: 1px solid #cbd5e1; cursor: pointer; border-radius: 4px; transition: background 0.2s; margin-bottom: 4px;">

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; font-size: 11px;">
            ${idx + 1}. Kecamatan ${escapeHtml(item.kecamatan)}
          </div>
          <span style="font-size: 8.5px; padding: 2px 6px; border-radius: 3px; font-weight: 700; ${tagBg}">
            ${tagText}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 4px; font-size: 10px;">
          <div>• Volume/Value: <b style="color: #ef4444;">${formatMetricValue(item.sales)}</b> (${contribPct}%)</div>
          <div>• Jumlah Toko: <b>${item.count} Toko</b></div>
          <div>• Rata-rata/Toko: <b>${formatMetricValue(item.avgSales)}</b></div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  resultContainer.innerHTML = html;

  const btnResetFilter = document.getElementById('btn-reset-coverage-filter');
  if (btnResetFilter) {
    btnResetFilter.addEventListener('click', () => {
      const selKec = document.getElementById('select-kecamatan');
      if (selKec) selKec.value = '';
      applyFilters();

      if (window.map && activeOutletData.length > 0) {
        const allCoords = activeOutletData
          .map(o => [parseFloat(o.lat ?? o.latitude), parseFloat(o.lng ?? o.longitude)])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0);

        if (allCoords.length > 0) {
          window.map.fitBounds(allCoords, { padding: [40, 40] });
        }
      }

      showToast("Kembali menampilkan seluruh outlet!");
    });
  }

  resultContainer.querySelectorAll('.coverage-kec-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      const targetKecData = kecList[idx];
      if (!targetKecData) return;

      const selKec = document.getElementById('select-kecamatan');
      if (selKec) {
        selKec.value = targetKecData.kecamatan;
        applyFilters();
      }

      const coords = targetKecData.outlets
        .map(o => [parseFloat(o.lat ?? o.latitude), parseFloat(o.lng ?? o.longitude)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0);

      if (coords.length > 0 && window.map) {
        if (coords.length === 1) {
          window.map.flyTo(coords[0], 16, { animate: true, duration: 1.0 });
        } else {
          window.map.fitBounds(coords, { padding: [60, 60], maxZoom: 16 });
        }
      }

      showToast(`Menyoroti ${coords.length} toko di Kec. ${targetKecData.kecamatan}`);
    });
  });
}

async function calculateOptimizedRoute() {
  if (!selectedOutlet) {
    showToast("Silakan klik salah satu outlet utama di peta sebagai titik awal rute!");
    return;
  }

  const limitEl = document.getElementById('select-route-limit');
  const limit = Math.max(2, parseInt(limitEl?.value || '10', 10) || 10);

  const dataset = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
    ? window.lastFilteredOutlets
    : activeOutletData;

  const startLat = parseFloat(selectedOutlet.lat ?? selectedOutlet.latitude);
  const startLng = parseFloat(selectedOutlet.lng ?? selectedOutlet.longitude);

  if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
    showToast("Koordinat outlet utama tidak valid.");
    return;
  }

  showLoading("Menghitung rute presisi berdasarkan jaringan jalan raya (OSRM)...");

  try {
    const selectedSalespersons = normalizeFieldArray(selectedOutlet.salespersons);

    let candidates = dataset.filter(outlet => {
      const lat = parseFloat(outlet.lat ?? outlet.latitude);
      const lng = parseFloat(outlet.lng ?? outlet.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return false;
      if (getOutletKey(outlet) === getOutletKey(selectedOutlet)) return false;

      if (selectedSalespersons.length > 0) {
        const outletSalespersons = normalizeFieldArray(outlet.salespersons);
        if (outletSalespersons.length > 0 && !selectedSalespersons.some(sp => outletSalespersons.includes(sp))) {
          return false;
        }
      }
      return true;
    });

    if (!candidates.length) {
      hideLoading();
      showToast("Tidak ditemukan outlet kandidat yang sesuai untuk rute ini.");
      return;
    }

    candidates.sort((a, b) => {
      const distA = getDistanceInMeters(startLat, startLng, parseFloat(a.lat ?? a.latitude), parseFloat(a.lng ?? a.longitude));
      const distB = getDistanceInMeters(startLat, startLng, parseFloat(b.lat ?? b.latitude), parseFloat(b.lng ?? b.longitude));
      const scoreA = (getOutletSales(a) / 1000000) - (distA / 1000);
      const scoreB = (getOutletSales(b) / 1000000) - (distB / 1000);
      return scoreB - scoreA;
    });

    const topCandidates = candidates.slice(0, Math.min(candidates.length, limit - 1));
    const allRouteNodes = [selectedOutlet, ...topCandidates];

    const coordString = allRouteNodes.map(o => {
      const lat = parseFloat(o.lat ?? o.latitude);
      const lng = parseFloat(o.lng ?? o.longitude);
      return `${lng},${lat}`;
    }).join(';');

    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${coordString}?source=first&destination=any&roundtrip=false&geometries=geojson&overview=full`;
    
    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
      const trip = data.trips[0];
      const orderedWaypoints = data.waypoints.sort((a, b) => a.trips_index - b.trips_index);
      const optimizedRoute = orderedWaypoints.map(w => allRouteNodes[w.waypoint_index]);
      const roadPolyline = trip.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      renderOptimizedRouteUI(optimizedRoute, trip.distance, roadPolyline);
      showToast(`Rute Jalan Raya Selesai: ${optimizedRoute.length} titik · ${(trip.distance / 1000).toFixed(2)} km`);

    } else {
      runFallbackLocalRouting(selectedOutlet, topCandidates, limit);
    }

  } catch (err) {
    console.warn("OSRM API error, menggunakan fallback routing lokal:", err);
    runFallbackLocalRouting(selectedOutlet, candidates, limit);
  } finally {
    hideLoading();
  }
}

function runFallbackLocalRouting(startOutlet, candidates, limit) {
  const route = [startOutlet];
  const legs = [];
  let current = startOutlet;

  while (route.length < limit && candidates.length > 0) {
    const cLat = parseFloat(current.lat ?? current.latitude);
    const cLng = parseFloat(current.lng ?? current.longitude);

    let bestIdx = 0;
    let maxScore = -Infinity;

    candidates.forEach((o, idx) => {
      const lat = parseFloat(o.lat ?? o.latitude);
      const lng = parseFloat(o.lng ?? o.longitude);
      const dist = getDistanceInMeters(cLat, cLng, lat, lng);
      const sales = getOutletSales(o);

      const score = (sales / 1000000) - (dist / 800);
      if (score > maxScore) {
        maxScore = score;
        bestIdx = idx;
      }
    });

    const nextTarget = candidates.splice(bestIdx, 1)[0];
    const dist = getDistanceInMeters(cLat, cLng, parseFloat(nextTarget.lat ?? nextTarget.latitude), parseFloat(nextTarget.lng ?? nextTarget.longitude));
    
    route.push(nextTarget);
    legs.push({ distance: Math.round(dist) });
    current = nextTarget;
  }

  const totalDist = legs.reduce((s, l) => s + l.distance, 0);
  const routeCoords = route.map(r => [parseFloat(r.lat ?? r.latitude), parseFloat(r.lng ?? r.longitude)]);

  renderOptimizedRouteUI(route, totalDist, routeCoords);
  showToast(`Rute Kluster Selesai (Offline Mode): ${route.length} titik`);
}

function renderOptimizedRouteUI(route, totalDistanceMeters, roadPolylineCoords) {
  const container = document.getElementById('route-steps-container');
  const totalSales = route.reduce((sum, outlet) => sum + getOutletSales(outlet), 0);
  const metricUpper = activeMetric.toUpperCase();

  if (container) {
    let html = `
      <div style="padding: 7px 8px; margin-bottom: 7px; border-radius: 6px; border: 1px solid #dc2626;">
        <div style="font-size: 10px; color: #ef4444; font-weight: 700;">RINGKASAN RUTE JALAN RAYA (PRESISI)</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-top: 5px;">
          <div><div style="font-size: 8.5px;">TITIK</div><b style="font-size: 11px;">${route.length} Toko</b></div>
          <div><div style="font-size: 8.5px;">JARAK JALAN</div><b style="font-size: 11px;">${(totalDistanceMeters / 1000).toFixed(2)} km</b></div>
          <div><div style="font-size: 8.5px;">TOTAL (${metricUpper})</div><b style="font-size: 11px; color: #ef4444;">${formatMetricValue(totalSales)}</b></div>
        </div>
      </div>

      <button id="btn-clear-sales-route"
        style="width: 100%; margin-bottom: 8px; background: #262626; border: 1px solid #dc2626;
        color: #ffffff; padding: 5px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer;">
        Hapus Rute di Peta
      </button>
    `;

    route.forEach((item, idx) => {
      const legText = idx === 0 ? 'Titik Keberangkatan Awal' : `Urutan Kunjungan Ke-${idx + 1}`;

      html += `
        <div class="route-step-item" style="padding: 6px; border-bottom: 1px solid #cbd5e1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="step-num"
              style="background: #dc2626; color: #ffffff; width: 20px; height: 20px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">
              ${idx + 1}
            </span>

            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 700; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(item.name || getOutletKey(item))}
              </div>
              <div style="font-size: 9.5px; color: #ef4444;">
                Penjualan: ${formatMetricValue(getOutletSales(item))}
              </div>
              <div style="font-size: 8.5px;">${legText}</div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    const btnClearRoute = document.getElementById('btn-clear-sales-route');
    if (btnClearRoute) {
      btnClearRoute.addEventListener('click', () => {
        if (typeof window.clearSalesRoute === 'function') {
          window.clearSalesRoute();
        }
        container.innerHTML = `<div style="font-size: 11px; text-align: center; padding: 6px;">Rute telah dibersihkan dari peta.</div>`;
        showToast("Rute kunjungan berhasil dihapus.");
      });
    }

    if (typeof window.drawSalesRoute === 'function') {
      window.drawSalesRoute(roadPolylineCoords);
    }
  }
}

function setupMetricSwitchListeners() {
  const metricBtns = document.querySelectorAll('.btn-metric, .btn-dash-metric');
  metricBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const metric = btn.getAttribute('data-metric');
      if (metric) {
        await switchActiveMetric(metric);
        showToast(`Metrik Tampilan Diubah ke: ${metric.toUpperCase()}`);
      }
    });
  });
}

function updateMetricButtonStyles() {
  const metricBtns = document.querySelectorAll('.btn-metric, .btn-dash-metric');
  metricBtns.forEach(b => {
    const m = b.getAttribute('data-metric');
    if (m === activeMetric) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
}

function setupIdeaLabFeatures() {
  const btnSummary = document.getElementById('btn-generate-ai-summary');
  if (btnSummary) {
    btnSummary.addEventListener('click', generateExecutiveSummary);
  }

  const btnRoute = document.getElementById('btn-generate-route');
  if (btnRoute) {
    btnRoute.addEventListener('click', calculateOptimizedRoute);
  }

  const btnPrint = document.getElementById('btn-print-pdf-report');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  const quadCards = document.querySelectorAll('.bcg-quad');
  quadCards.forEach(card => {
    card.addEventListener('click', () => {
      let qType = null;
      if (card.classList.contains('star')) qType = 'star';
      else if (card.classList.contains('cow')) qType = 'cow';
      else if (card.classList.contains('question')) qType = 'question';
      else if (card.classList.contains('risk')) qType = 'risk';

      if (activeQuadrantFilter === qType) {
        activeQuadrantFilter = null;
        quadCards.forEach(c => c.classList.remove('active-filter'));
        showToast("Filter Kuadran Dilepas");
      } else {
        activeQuadrantFilter = qType;
        quadCards.forEach(c => c.classList.remove('active-filter'));
        card.classList.add('active-filter');

        const names = { star: 'Star Outlets', cow: 'Cash Cows', question: 'Toko Potensial', risk: 'Underperform' };
        showToast(`Filter Kuadran: Menyoroti ${names[qType]}`);
      }

      applyFilters();
    });
  });

  initPwaCapabilities();
}

function getOutletQuadrant(item, avgSalesThreshold, totalSelectedMonthsCount) {
  const sales = item.current_total || 0;
  const consistencyThreshold = Math.max(1, Math.ceil(totalSelectedMonthsCount * 0.5));

  let activeMonths = 0;
  if (item.monthly_sales) {
    selectedMonths.forEach(m => {
      if ((item.monthly_sales[m] || 0) > 0) activeMonths++;
    });
  } else {
    activeMonths = sales > 0 ? totalSelectedMonthsCount : 0;
  }

  const isHighSales = sales >= avgSalesThreshold;
  const isHighConsistency = activeMonths >= consistencyThreshold;

  if (isHighSales && isHighConsistency) return 'star';
  if (isHighSales && !isHighConsistency) return 'cow';
  if (!isHighSales && isHighConsistency) return 'question';
  return 'risk';
}

function calculateBCGMatrix(data) {
  if (!data || data.length === 0) {
    ['quad-star-count', 'quad-cow-count', 'quad-question-count', 'quad-risk-count'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '0 Toko';
    });
    window.quadrantStats = { stars: 0, cows: 0, questions: 0, risks: 0 };
    return;
  }

  let totalSales = 0;
  data.forEach(item => {
    totalSales += item.current_total || 0;
  });

  const avgSalesThreshold = totalSales / data.length;
  const totalSelectedMonthsCount = selectedMonths.length || 1;

  let stars = 0, cows = 0, questions = 0, risks = 0;

  data.forEach(item => {
    const q = getOutletQuadrant(item, avgSalesThreshold, totalSelectedMonthsCount);
    if (q === 'star') stars++;
    else if (q === 'cow') cows++;
    else if (q === 'question') questions++;
    else if (q === 'risk') risks++;
  });

  const elStar = document.getElementById('quad-star-count');
  const elCow = document.getElementById('quad-cow-count');
  const elQuestion = document.getElementById('quad-question-count');
  const elRisk = document.getElementById('quad-risk-count');

  if (elStar) elStar.innerText = `${stars.toLocaleString('id-ID')} Toko`;
  if (elCow) elCow.innerText = `${cows.toLocaleString('id-ID')} Toko`;
  if (elQuestion) elQuestion.innerText = `${questions.toLocaleString('id-ID')} Toko`;
  if (elRisk) elRisk.innerText = `${risks.toLocaleString('id-ID')} Toko`;

  window.quadrantStats = { stars, cows, questions, risks, avgSalesThreshold };
}

function generateExecutiveSummary() {
  const dataset = window.lastFilteredOutlets || activeOutletData;
  const container = document.getElementById('ai-summary-output');
  if (!container) return;

  if (!dataset || dataset.length === 0) {
    container.innerHTML = `<span>Tidak ada data terfilter untuk dianalisis. Silakan impor dataset terlebih dahulu.</span>`;
    return;
  }

  let totalOmset = 0;
  const kecMap = {};
  dataset.forEach(o => {
    const v = o.current_total || 0;
    totalOmset += v;
    const k = typeof extractKecamatanName === 'function' ? extractKecamatanName(o) : 'LAINNYA';
    kecMap[k] = (kecMap[k] || 0) + v;
  });

  let topKec = '-';
  let maxVal = 0;
  Object.keys(kecMap).forEach(k => {
    if (kecMap[k] > maxVal) {
      maxVal = kecMap[k];
      topKec = k;
    }
  });

  const topKecContribPct = totalOmset > 0 ? ((maxVal / totalOmset) * 100).toFixed(1) : '0';
  const totalAnomalies = lastAnomalySet.size;
  const metricName = activeMetric.toUpperCase();
  const formattedTotal = formatMetricValue(totalOmset, activeMetric);

  const stats = window.quadrantStats || { stars: 0, cows: 0, questions: 0, risks: 0 };
  const starPct = dataset.length > 0 ? ((stats.stars / dataset.length) * 100).toFixed(1) : '0';
  const questionPct = dataset.length > 0 ? ((stats.questions / dataset.length) * 100).toFixed(1) : '0';
  const riskPct = dataset.length > 0 ? ((stats.risks / dataset.length) * 100).toFixed(1) : '0';

  const html = `
    <div style="font-weight: 700; color: #ef4444; margin-bottom: 6px; font-size: 11.5px;">Analisis Eksekutif Real-Time (Metrik: ${metricName}):</div>
    <div style="margin-bottom: 4px;">Total akumulasi penjualan: <b>${formattedTotal}</b> dari <b>${dataset.length.toLocaleString('id-ID')} outlet</b> terfilter.</div>
    <div style="margin-top: 4px;">• Wilayah Kontributor Utama: <b>Kec. ${topKec}</b> (${topKecContribPct}% dari total omset).</div>
    <div style="margin-top: 4px;">• Sebaran Performa: <b style="color: #ef4444;">${stats.stars.toLocaleString('id-ID')} Star (${starPct}%)</b>, <b>${stats.questions.toLocaleString('id-ID')} Potensial (${questionPct}%)</b>, dan <b style="color: #991b1b;">${stats.risks.toLocaleString('id-ID')} Underperform (${riskPct}%)</b>.</div>
    <div style="margin-top: 4px;">• Audit Spasial: Terdeteksi <b style="color: #ef4444;">${totalAnomalies} outlet anomali koordinat</b>.</div>
    <div style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
      <b>Rekomendasi Operasional:</b><br>
      1. Dorong ketersediaan varian produk pada <b>${stats.questions} Toko Potensial</b> yang rajin transaksi.<br>
      2. Tinjau rute kunjungan salesman di Kec. ${topKec} dan evaluasi <b style="color: #ef4444;">${stats.risks} toko Underperform</b>.
    </div>
  `;

  container.innerHTML = html;
}

function initPwaCapabilities() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(() => {
        const badgeText = document.getElementById('pwa-status-text');
        if (badgeText) badgeText.innerText = "PWA: Active";
      }).catch(() => {
        const badgeText = document.getElementById('pwa-status-text');
        if (badgeText) badgeText.innerText = "PWA: Ready";
      });
    });
  }
}

function setupGlobalSearchListeners() {
  const searchInput = document.getElementById('global-search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  if (!searchInput || !suggestionsBox) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q || q.length < 2) {
      suggestionsBox.style.display = 'none';
      suggestionsBox.innerHTML = '';
      return;
    }

    const source = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
                   ? window.lastFilteredOutlets
                   : activeOutletData;

    const matches = source.filter(o => {
      const nameMatch = o.name && o.name.toLowerCase().includes(q);
      const idMatch = (o.customer_number && String(o.customer_number).toLowerCase().includes(q)) ||
                      (o.id && String(o.id).toLowerCase().includes(q));
      return nameMatch || idMatch;
    }).slice(0, 8);

    if (matches.length === 0) {
      suggestionsBox.innerHTML = `<div class="suggestion-item" style="cursor: default; padding: 8px;">Toko tidak ditemukan</div>`;
      suggestionsBox.style.display = 'block';
      return;
    }

    let html = '';
    matches.forEach(o => {
      const code = o.customer_number || o.id || '';
      const kec = typeof extractKecamatanName === 'function' ? extractKecamatanName(o) : '-';
      html += `
        <div class="suggestion-item" data-id="${o.id || o.customer_number}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #cbd5e1;">
          <div style="font-weight: 700; font-size: 12px;">${o.name}</div>
          <div style="font-size: 10px;">Kode: ${code} | Kec: ${kec}</div>
        </div>
      `;
    });

    suggestionsBox.innerHTML = html;
    suggestionsBox.style.display = 'block';

    const items = suggestionsBox.querySelectorAll('.suggestion-item');
    items.forEach(item => {
      item.addEventListener('click', (evt) => {
        evt.stopPropagation();
        const outletId = item.getAttribute('data-id');
        const target = source.find(o => String(o.id) === String(outletId) || String(o.customer_number) === String(outletId));

        if (target) {
          suggestionsBox.style.display = 'none';
          suggestionsBox.innerHTML = '';
          searchInput.value = target.name;

          const lat = parseFloat(target.lat ?? target.latitude);
          const lng = parseFloat(target.lng ?? target.longitude);

          if (!isNaN(lat) && !isNaN(lng) && window.map) {
            window.map.flyTo([lat, lng], 17, { animate: true, duration: 1.0 });

            const searchKey1 = String(target.id);
            const searchKey2 = String(target.customer_number);

            if (window.outletMarkersMap && (window.outletMarkersMap.has(searchKey1) || window.outletMarkersMap.has(searchKey2))) {
              const marker = window.outletMarkersMap.get(searchKey1) || window.outletMarkersMap.get(searchKey2);
              if (marker && typeof marker.openPopup === 'function') {
                setTimeout(() => {
                  marker.openPopup();
                }, 200);
              }
            }
          }

          showOutletDetail(target, false);
          showToast(`Menuju lokasi outlet: ${target.name}`);
        }
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = 'none';
    }
  });
}

function setupMonthFilterListeners() {
  renderDashboardMonthPills();
  renderWidgetMonthPills();
}

function renderDashboardMonthPills() {
  const container = document.getElementById('dash-month-selector');
  if (!container) return;

  let html = '';
  ALL_MONTHS.forEach(m => {
    const isActive = selectedMonths.includes(m) ? 'active' : '';
    html += `<button class="btn-month-pill ${isActive}" onclick="toggleDashboardMonth('${m}')">${m}</button>`;
  });
  container.innerHTML = html;
}

function renderWidgetMonthPills() {
  const container = document.getElementById('widget-month-pills');
  if (!container) return;

  let html = '';
  ALL_MONTHS.forEach(m => {
    const isActive = selectedMonths.includes(m) ? 'active' : '';
    html += `<button class="btn-month-pill ${isActive}" onclick="toggleDashboardMonth('${m}')" style="width: 100%; text-align: center; padding: 6px 0;">${m}</button>`;
  });
  container.innerHTML = html;
}

/* DUPLIKASI PRESET DENGAN PINTASAN LENGKAP (YTD, Q1-Q4, LAST 3 MONTHS) */
function setDashboardMonthPreset(preset) {
  if (preset === 'all' || preset === 'ytd') selectedMonths = [...ALL_MONTHS];
  else if (preset === 'q1') selectedMonths = ['JAN', 'FEB', 'MAR'];
  else if (preset === 'q2') selectedMonths = ['APR', 'MAY', 'JUN'];
  else if (preset === 'q3') selectedMonths = ['JUL', 'AUG', 'SEP'];
  else if (preset === 'q4') selectedMonths = ['OCT', 'NOV', 'DEC'];
  else if (preset === 'last3') selectedMonths = ['JUN', 'JUL', 'AUG'];

  renderDashboardMonthPills();
  renderWidgetMonthPills();
  applyFilters();
}

function toggleDashboardMonth(m) {
  if (selectedMonths.includes(m)) {
    if (selectedMonths.length === 1) {
      showToast('Minimal harus ada 1 bulan terpilih!');
      return;
    }
    selectedMonths = selectedMonths.filter(x => x !== m);
  } else {
    selectedMonths.push(m);
  }

  renderDashboardMonthPills();
  renderWidgetMonthPills();
  applyFilters();
}

function getOutletMetrics(outlet) {
  if (!outlet.monthly_sales || selectedMonths.length === 0) {
    const total = outlet.total_sales || 0;
    return { total: total, avg: total };
  }

  let sum = 0;
  selectedMonths.forEach(m => {
    sum += (outlet.monthly_sales[m] || 0);
  });

  const avg = selectedMonths.length > 0 ? (sum / selectedMonths.length) : 0;
  return { total: roundVal(sum), avg: roundVal(avg) };
}

function roundVal(val) {
  return Math.round(val * 100) / 100;
}

function setDashboardCalcMode(mode) {
  dashCalcMode = mode;
  updateDashboardAnalytics();
  showToast(`Mode Hitung: ${mode === 'total' ? 'TOTAL PENJUALAN' : 'RATA-RATA / BULAN'}`);
}

window.toggleDashboardMonth = toggleDashboardMonth;
window.setDashboardMonthPreset = setDashboardMonthPreset;
window.setDashboardCalcMode = setDashboardCalcMode;

async function switchActiveMetric(metric) {
  activeMetric = metric;
  window.activeMetric = metric;

  updateMetricButtonStyles();
  await loadMetricDataToMap(activeMetric);
}

async function autoDetectAndLoadMetric() {
  const metrics = ['box', 'val', 'uom'];
  let loaded = false;

  for (const m of metrics) {
    const storeName = `outlets_${m}`;
    if (window.db && window.db[storeName]) {
      const count = await window.db[storeName].count();
      if (count > 0) {
        await switchActiveMetric(m);
        loaded = true;
        break;
      }
    }
  }

  if (!loaded) {
    await switchActiveMetric('val');
  }
}

function processAndGroupOutlets(rawData) {
  const outletMap = new Map();

  rawData.forEach(item => {
    const key = item.customer_number || item.id || item.name;
    if (!key) return;

    if (!outletMap.has(key)) {
      const newItem = JSON.parse(JSON.stringify(item));
      if (!Array.isArray(newItem.salespersons)) {
        newItem.salespersons = newItem.salespersons ? [newItem.salespersons] : [];
      }
      if (!newItem.monthly_sales) newItem.monthly_sales = {};
      outletMap.set(key, newItem);
    } else {
      const existing = outletMap.get(key);

      const incomingSales = Array.isArray(item.salespersons) ? item.salespersons : (item.salespersons ? [item.salespersons] : []);
      incomingSales.forEach(s => {
        if (s && !existing.salespersons.includes(s)) {
          existing.salespersons.push(s);
        }
      });

      if (item.monthly_sales) {
        Object.keys(item.monthly_sales).forEach(m => {
          existing.monthly_sales[m] = (existing.monthly_sales[m] || 0) + (item.monthly_sales[m] || 0);
        });
      }

      if (item.top_brands && Array.isArray(item.top_brands)) {
        if (!existing.top_brands) existing.top_brands = [];
        item.top_brands.forEach(tb => {
          const found = existing.top_brands.find(b => b.brand === tb.brand);
          if (found) {
            found.sales += (tb.sales || 0);
          } else {
            existing.top_brands.push({ brand: tb.brand, sales: tb.sales || 0 });
          }
        });
        existing.top_brands.sort((a, b) => b.sales - a.sales);
      }
    }
  });

  return Array.from(outletMap.values());
}

async function loadMetricDataToMap(metric) {
  const storeName = `outlets_${metric}`;
  if (window.db && window.db[storeName]) {
    const count = await window.db[storeName].count();
    if (count > 0) {
      const rawData = await window.db[storeName].toArray();
      activeOutletData = processAndGroupOutlets(rawData);
      populateAllDropdowns();
      applyFilters();
    } else {
      activeOutletData = [];
      window.lastFilteredOutlets = [];
      resetFilterDropdowns();
      if (typeof renderOutletMarkers === 'function') {
        renderOutletMarkers([]);
      }
      renderKecamatanLegendWidget();
      updateDashboardAnalytics();
      showToast(`Belum ada data terimpor untuk metrik ${metric.toUpperCase()}`);
    }
  }
}

function setupUploadListener(inputId, storeName, statusId, labelId, metricKey) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;

  inputEl.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showLoading(`Membaca file ${file.name}...`);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        let rawText = evt.target.result;

        rawText = rawText.replace(/:\s*NaN\b/gi, ': null')
                         .replace(/:\s*Infinity\b/gi, ': null')
                         .replace(/:\s*-Infinity\b/gi, ': null');

        const outlets = JSON.parse(rawText);
        if (!Array.isArray(outlets)) {
          alert("Format file JSON tidak valid.");
          hideLoading();
          return;
        }

        showLoading(`Menyimpan ${outlets.length.toLocaleString('id-ID')} baris data ke IndexedDB...`);

        if (window.db && window.db[storeName]) {
          await window.db[storeName].clear();
          await window.db[storeName].bulkPut(outlets);
        }

        document.getElementById(statusId).innerText = `${outlets.length.toLocaleString('id-ID')} Baris Data`;
        document.getElementById(labelId).classList.add('loaded');
        document.getElementById(labelId).innerText = 'Siap';

        hideLoading();
        showToast(`Berhasil memuat ${outlets.length.toLocaleString('id-ID')} baris data ${metricKey.toUpperCase()}!`);

        await switchActiveMetric(metricKey);

      } catch (err) {
        alert("Gagal membaca file JSON: " + err.message);
        hideLoading();
      }
    };

    reader.readAsText(file);
  });
}

async function updateAllMetricStatuses() {
  const metrics = ['val', 'box', 'uom'];
  for (const m of metrics) {
    const store = `outlets_${m}`;
    const statusEl = document.getElementById(`status-${m}`);
    const labelEl = document.getElementById(`label-${m}`);

    if (window.db && window.db[store] && statusEl) {
      const count = await window.db[store].count();
      if (count > 0) {
        statusEl.innerText = `${count.toLocaleString('id-ID')} Baris Data`;
        if (labelEl) {
          labelEl.classList.add('loaded');
          labelEl.innerText = 'Siap';
        }
      } else {
        statusEl.innerText = 'Belum Ada';
      }
    }
  }
}

function initProvinsiDropdown() {
  const elProv = document.getElementById('select-provinsi');
  if (!elProv) return;

  let html = '<option value="">-- Semua Provinsi --</option>';
  DEFAULT_PROVINSI.forEach(p => {
    const selected = p.code === '61' ? 'selected' : '';
    html += `<option value="${p.code}" ${selected}>${p.name}</option>`;
  });
  elProv.innerHTML = html;
}

function populateAllDropdowns() {
  populateGenericSelect('select-kabupaten', 'kodya', (val) => KODYA_MAP[val] ? `${KODYA_MAP[val]} (${val})` : val);
  populateGenericSelect('select-kecamatan', 'kecamatan');
  populateGenericSelect('select-rayon', 'rayon');
  populateGenericSelect('select-class', 'class');
  populateGenericSelect('select-tipe', 'tipe');
  populateGenericSelect('select-jenis', 'jenis');

  populateGenericSelect('select-divisi-sales', 'divisi_sales');
  populateGenericSelect('select-category-sales', 'category_sales');
  populateGenericSelect('select-salesperson', 'salespersons');
  populateGenericSelect('select-tahun', 'tahun', null, 'dash-select-tahun');

  populateGenericSelect('select-grup', 'groups');
  populateGenericSelect('select-brand', 'brands');
  populateGenericSelect('select-subbrand', 'subbrands');
  populateGenericSelect('select-subbrand-list', 'subbrand_lists');
}

function populateGenericSelect(elementId, fieldKey, formatterFn, secondaryElementId = null) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const valueSet = new Set();
  activeOutletData.forEach(item => {
    const val = item[fieldKey];
    if (Array.isArray(val)) {
      val.forEach(v => { if (v) valueSet.add(v); });
    } else if (val) {
      valueSet.add(val);
    }
  });

  const sortedValues = [...valueSet].sort();
  let html = `<option value="">-- Semua --</option>`;
  sortedValues.forEach(v => {
    const labelText = formatterFn ? formatterFn(v) : v;
    html += `<option value="${v}">${labelText}</option>`;
  });

  el.innerHTML = html;
  el.disabled = false;

  if (secondaryElementId) {
    const secEl = document.getElementById(secondaryElementId);
    if (secEl) {
      secEl.innerHTML = html;
      secEl.disabled = false;
    }
  }
}

function resetFilterDropdowns() {
  const filterIds = [
    'select-kabupaten', 'select-kecamatan', 'select-rayon', 'select-class', 'select-tipe', 'select-jenis',
    'select-divisi-sales', 'select-category-sales', 'select-salesperson', 'select-tahun',
    'select-grup', 'select-brand', 'select-subbrand', 'select-subbrand-list'
  ];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<option value="">-- Semua Data --</option>`;
      el.disabled = true;
    }
  });

  const dashTahun = document.getElementById('dash-select-tahun');
  if (dashTahun) {
    dashTahun.innerHTML = `<option value="">-- Semua Tahun --</option>`;
  }
}

function setupFilterListeners() {
  const filterIds = [
    'select-provinsi', 'select-kabupaten', 'select-kecamatan', 'select-rayon', 'select-class', 'select-tipe', 'select-jenis',
    'select-divisi-sales', 'select-category-sales', 'select-salesperson', 'select-tahun',
    'select-grup', 'select-brand', 'select-subbrand', 'select-subbrand-list'
  ];

  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        if (id === 'select-provinsi') {
          const provCode = e.target.value;
          if (typeof loadProvinceBoundary === 'function') {
            loadProvinceBoundary(provCode);
          }
        }
        if (id === 'select-tahun') {
          const dashTahun = document.getElementById('dash-select-tahun');
          if (dashTahun) dashTahun.value = e.target.value;
        }
        applyFilters();
      });
    }
  });
}

function applyFilters() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  const selectedKodya = getVal('select-kabupaten');
  const selectedKec = getVal('select-kecamatan');
  const selectedRayon = getVal('select-rayon');
  const selectedClass = getVal('select-class');
  const selectedTipe = getVal('select-tipe');
  const selectedJenis = getVal('select-jenis');

  const selectedDivSales = getVal('select-divisi-sales');
  const selectedCatSales = getVal('select-category-sales');
  const selectedSp = getVal('select-salesperson');
  const selectedTahun = getVal('select-tahun');

  const selectedGrup = getVal('select-grup');
  const selectedBrand = getVal('select-brand');
  const selectedSubbrand = getVal('select-subbrand');
  const selectedSubbrandList = getVal('select-subbrand-list');

  const checkMatch = (item, fieldKey, targetVal) => {
    if (!targetVal) return true;
    const val = item[fieldKey];
    if (Array.isArray(val)) {
      return val.includes(targetVal);
    }
    return String(val) === String(targetVal);
  };

  let filtered = activeOutletData.filter(item => {
    if (selectedKodya && !checkMatch(item, 'kodya', selectedKodya)) return false;
    if (selectedKec && !checkMatch(item, 'kecamatan', selectedKec)) return false;
    if (selectedRayon && !checkMatch(item, 'rayon', selectedRayon)) return false;
    if (selectedClass && !checkMatch(item, 'class', selectedClass)) return false;
    if (selectedTipe && !checkMatch(item, 'tipe', selectedTipe)) return false;
    if (selectedJenis && !checkMatch(item, 'jenis', selectedJenis)) return false;

    if (selectedDivSales && !checkMatch(item, 'divisi_sales', selectedDivSales)) return false;
    if (selectedCatSales && !checkMatch(item, 'category_sales', selectedCatSales)) return false;
    if (selectedSp && !checkMatch(item, 'salespersons', selectedSp)) return false;
    if (selectedTahun && !checkMatch(item, 'tahun', selectedTahun)) return false;

    if (selectedGrup && !checkMatch(item, 'groups', selectedGrup)) return false;
    if (selectedBrand && !checkMatch(item, 'brands', selectedBrand)) return false;
    if (selectedSubbrand && !checkMatch(item, 'subbrands', selectedSubbrand)) return false;
    if (selectedSubbrandList && !checkMatch(item, 'subbrand_lists', selectedSubbrandList)) return false;

    return true;
  });

  filtered.forEach(item => {
    const metrics = getOutletMetrics(item);
    item.current_total = metrics.total;
    item.current_avg = metrics.avg;
  });

  calculateBCGMatrix(filtered);

  if (activeQuadrantFilter && filtered.length > 0) {
    let sumSales = 0;
    filtered.forEach(item => { sumSales += item.current_total || 0; });
    const threshold = sumSales / filtered.length;
    const monthsCount = selectedMonths.length || 1;

    filtered = filtered.filter(item => {
      const q = getOutletQuadrant(item, threshold, monthsCount);
      return q === activeQuadrantFilter;
    });
  }

  if (activePerfFilter && filtered.length > 0) {
    const sortedCopy = [...filtered].sort((a, b) => b.current_total - a.current_total);
    const thresholdIndex = Math.ceil(sortedCopy.length * 0.20);

    if (activePerfFilter === 'top') {
      const topIds = new Set(sortedCopy.slice(0, thresholdIndex).map(o => o.customer_number || o.id));
      filtered = filtered.filter(o => topIds.has(o.customer_number || o.id));
    } else if (activePerfFilter === 'low') {
      const lowIds = new Set(sortedCopy.slice(sortedCopy.length - thresholdIndex).map(o => o.customer_number || o.id));
      filtered = filtered.filter(o => lowIds.has(o.customer_number || o.id));
    }
  }

  window.lastFilteredOutlets = filtered;

  if (typeof renderOutletMarkers === 'function') {
    renderOutletMarkers(filtered);
  }

  if (selectedOutlet) {
    const updatedOutlet = filtered.find(o => (o.id === selectedOutlet.id || o.customer_number === selectedOutlet.customer_number));
    if (updatedOutlet) {
      showOutletDetail(updatedOutlet, false);
    }
  }

  renderKecamatanLegendWidget();
  generateExecutiveSummary();
  updateDashboardAnalytics();
  updateBufferZoneAnalysis();
}

function updateDashboardAnalytics() {
  const dataset = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0) 
                  ? window.lastFilteredOutlets 
                  : activeOutletData;

  const currentMetric = window.activeMetric || 'val';
  const metricUpper = currentMetric.toUpperCase();
  const numMonths = selectedMonths.length || 1;

  let totalOmset = 0;
  let activeOutletCount = 0;
  const kecMap = {};
  const brandMap = {};
  const salesMap = {};

  const monthlyTotals = {};
  ALL_MONTHS.forEach(m => monthlyTotals[m] = 0);

  dataset.forEach(item => {
    const itemVal = item.current_total || item.total_sales || 0;
    totalOmset += itemVal;
    if (itemVal > 0) activeOutletCount++;

    const kec = typeof extractKecamatanName === 'function' ? extractKecamatanName(item) : 'LAINNYA';
    if (kec) kecMap[kec] = (kecMap[kec] || 0) + itemVal;

    if (item.top_brands && Array.isArray(item.top_brands)) {
      item.top_brands.forEach(tb => {
        if (tb.brand) brandMap[tb.brand] = (brandMap[tb.brand] || 0) + (tb.sales || 0);
      });
    }

    const salesArr = Array.isArray(item.salespersons) ? item.salespersons : (item.salespersons ? [item.salespersons] : []);
    salesArr.forEach(sp => {
      if (sp) salesMap[sp] = (salesMap[sp] || 0) + itemVal;
    });

    if (item.monthly_sales) {
      ALL_MONTHS.forEach(m => {
        monthlyTotals[m] += (item.monthly_sales[m] || 0);
      });
    }
  });

  if (dashCalcMode === 'avg') {
    totalOmset = totalOmset / numMonths;

    Object.keys(kecMap).forEach(k => kecMap[k] = kecMap[k] / numMonths);
    Object.keys(brandMap).forEach(b => brandMap[b] = brandMap[b] / numMonths);
    Object.keys(salesMap).forEach(s => salesMap[s] = salesMap[s] / numMonths);
    ALL_MONTHS.forEach(m => monthlyTotals[m] = monthlyTotals[m] / numMonths);
  }

  const totalOutlet = dataset.length;
  const avgPerOutlet = totalOutlet > 0 ? (totalOmset / totalOutlet) : 0;
  const activeRate = totalOutlet > 0 ? ((activeOutletCount / totalOutlet) * 100).toFixed(1) : '0';

  /* KALKULASI KONSENTRASI PARETO 80/20 */
  const sortedOutlets = [...dataset].sort((a,b) => (b.current_total || 0) - (a.current_total || 0));
  const top20Count = Math.max(1, Math.ceil(totalOutlet * 0.2));
  const top20Sales = sortedOutlets.slice(0, top20Count).reduce((sum, o) => sum + (o.current_total || 0), 0);
  const paretoPct = totalOmset > 0 ? ((top20Sales / totalOmset) * 100).toFixed(1) : '0';

  let topKec = '-';
  let maxKecVal = -1;
  Object.keys(kecMap).forEach(k => {
    if (kecMap[k] > maxKecVal) {
      maxKecVal = kecMap[k];
      topKec = k;
    }
  });

  const elOutlet = document.getElementById('full-kpi-outlet');
  const elOmset = document.getElementById('full-kpi-omset');
  const elAvg = document.getElementById('full-kpi-avg');
  const elTopKec = document.getElementById('full-kpi-top-kec');
  const elLabelOmset = document.getElementById('label-full-kpi-omset');

  const elActiveRate = document.getElementById('full-kpi-active-rate');
  const elPareto = document.getElementById('full-kpi-pareto');

  if (elOutlet) elOutlet.innerText = `${totalOutlet.toLocaleString('id-ID')} Toko`;
  if (elOmset) elOmset.innerText = formatMetricValue(totalOmset, currentMetric);
  if (elAvg) elAvg.innerText = formatMetricValue(avgPerOutlet, currentMetric);
  if (elTopKec) elTopKec.innerText = topKec;

  if (elActiveRate) elActiveRate.innerText = `${activeRate}% (${activeOutletCount.toLocaleString('id-ID')} Transaksi)`;
  if (elPareto) elPareto.innerText = `Top 20% (${top20Count} Toko) = ${paretoPct}% Omset`;

  if (elLabelOmset) {
    elLabelOmset.innerText = dashCalcMode === 'avg' ? `Akumulasi Rata-Rata (${metricUpper})` : `Akumulasi Total (${metricUpper})`;
  }

  /* DRILL-DOWN INTERAKTIF PADA RANK LIST TOP 5 ITEM */
  renderRankList('full-rank-brands', brandMap, (v) => formatMetricValue(v, currentMetric), 'brand');
  renderRankList('full-rank-kecamatan', kecMap, (v) => formatMetricValue(v, currentMetric), 'kecamatan');
  renderRankList('full-rank-sales', salesMap, (v) => formatMetricValue(v, currentMetric), 'salesperson');

  renderBrandChart(brandMap, metricUpper);
  renderTrendChart(monthlyTotals, metricUpper);
  renderDashboardBCGWidget();
}

function renderRankList(containerId, dataMap, formatFn, filterType = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sortedKeys = Object.keys(dataMap).sort((a, b) => dataMap[b] - dataMap[a]).slice(0, 5);

  if (sortedKeys.length === 0) {
    container.innerHTML = `<div style="font-size: 11px; padding: 6px 0;">Belum ada data transaksi</div>`;
    return;
  }

  let html = '';
  sortedKeys.forEach((key, idx) => {
    const valStr = formatFn(dataMap[key]);
    const cursorStyle = filterType ? 'cursor: pointer;' : '';
    html += `
      <div class="rank-item-clickable" data-key="${escapeHtml(key)}" data-type="${filterType || ''}"
        style="display: flex; justify-content: space-between; align-items: center; padding: 5px 6px; border-bottom: 1px solid #cbd5e1; border-radius: 4px; transition: background 0.2s; ${cursorStyle}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: #e2e8f0; border: 1px solid #cbd5e1; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${idx + 1}</span>
          <span style="font-weight: 600;">${escapeHtml(key)}</span>
        </div>
        <strong style="color: #ef4444; font-size: 11px;">${valStr}</strong>
      </div>
    `;
  });

  container.innerHTML = html;

  if (filterType) {
    container.querySelectorAll('.rank-item-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-key');
        const type = el.getAttribute('data-type');
        if (!key || !type) return;

        let selectId = '';
        if (type === 'brand') selectId = 'select-brand';
        else if (type === 'kecamatan') selectId = 'select-kecamatan';
        else if (type === 'salesperson') selectId = 'select-salesperson';

        const targetSelect = document.getElementById(selectId);
        if (targetSelect) {
          targetSelect.value = key;
          applyFilters();
          showToast(`Filter Terpasang: ${type.toUpperCase()} -> ${key}`);
        }
      });
    });
  }
}

function renderBrandChart(brandMap, metricLabel) {
  const ctx = document.getElementById('chart-top-brands');
  if (!ctx || typeof Chart === 'undefined') return;

  const sortedBrands = Object.keys(brandMap).sort((a, b) => brandMap[b] - brandMap[a]).slice(0, 7);
  const labels = sortedBrands;
  const values = sortedBrands.map(b => brandMap[b]);

  if (dashBrandChart) {
    dashBrandChart.destroy();
  }

  dashBrandChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Belum Ada Data'],
      datasets: [{
        label: `Penjualan (${metricLabel})`,
        data: values.length > 0 ? values : [0],
        backgroundColor: '#dc2626',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { font: { size: 10 } }, grid: { color: '#cbd5e1' } }
      }
    }
  });
}

/* FUNGSI TREN TREN BULANAN LINE CHART */
function renderTrendChart(monthlyTotals, metricLabel) {
  const ctx = document.getElementById('chart-monthly-trend');
  if (!ctx || typeof Chart === 'undefined') return;

  if (dashTrendChart) {
    dashTrendChart.destroy();
  }

  dashTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ALL_MONTHS,
      datasets: [{
        label: `Tren Sales (${metricLabel})`,
        data: ALL_MONTHS.map(m => monthlyTotals[m] || 0),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#ef4444',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { font: { size: 10 } }, grid: { color: '#cbd5e1' } }
      }
    }
  });
}

/* WIDGET MATRIKS BCG INTERAKTIF DASHBOARD */
function renderDashboardBCGWidget() {
  const container = document.getElementById('dash-bcg-summary-container');
  if (!container) return;

  const stats = window.quadrantStats || { stars: 0, cows: 0, questions: 0, risks: 0 };
  const total = (stats.stars + stats.cows + stats.questions + stats.risks) || 1;

  const starPct = ((stats.stars / total) * 100).toFixed(1);
  const cowPct = ((stats.cows / total) * 100).toFixed(1);
  const questionPct = ((stats.questions / total) * 100).toFixed(1);
  const riskPct = ((stats.risks / total) * 100).toFixed(1);

  container.innerHTML = `
    <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
      <span>Kuadran Matriks BCG Portofolio</span>
      <button onclick="window.resetBCGFilter()" style="background: #262626; color: #ffffff; border: 1px solid #404040; padding: 2px 6px; border-radius: 3px; font-size: 9px; cursor: pointer;">Reset Filter</button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 10px;">
      <div onclick="window.filterBCGQuadrant('star')" style="background: rgba(220, 38, 38, 0.1); border: 1px solid #dc2626; padding: 6px; border-radius: 4px; cursor: pointer;">
        <div style="font-weight: 700; color: #dc2626;">⭐ STARS (${starPct}%)</div>
        <b>${stats.stars.toLocaleString('id-ID')} Toko</b>
      </div>
      <div onclick="window.filterBCGQuadrant('cow')" style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 6px; border-radius: 4px; cursor: pointer;">
        <div style="font-weight: 700; color: #10b981;">🐄 CASH COWS (${cowPct}%)</div>
        <b>${stats.cows.toLocaleString('id-ID')} Toko</b>
      </div>
      <div onclick="window.filterBCGQuadrant('question')" style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; padding: 6px; border-radius: 4px; cursor: pointer;">
        <div style="font-weight: 700; color: #f59e0b;">❓ POTENSIAL (${questionPct}%)</div>
        <b>${stats.questions.toLocaleString('id-ID')} Toko</b>
      </div>
      <div onclick="window.filterBCGQuadrant('risk')" style="background: rgba(107, 114, 128, 0.1); border: 1px solid #6b7280; padding: 6px; border-radius: 4px; cursor: pointer;">
        <div style="font-weight: 700; color: #6b7280;">⚠️ UNDERPERFORM (${riskPct}%)</div>
        <b>${stats.risks.toLocaleString('id-ID')} Toko</b>
      </div>
    </div>
  `;
}

window.filterBCGQuadrant = function(qType) {
  if (activeQuadrantFilter === qType) {
    activeQuadrantFilter = null;
    showToast("Filter Kuadran BCG Dilepas");
  } else {
    activeQuadrantFilter = qType;
    showToast(`Filter Kuadran BCG: ${qType.toUpperCase()}`);
  }
  applyFilters();
};

function runCoordinateAnomalyAudit() {
  const resultContainer = document.getElementById('anomaly-audit-results');
  const btnExport = document.getElementById('btn-export-anomaly-excel');
  const btnStop = document.getElementById('btn-stop-anomaly-audit');
  const btnAudit = document.getElementById('btn-run-anomaly-audit');
  if (!resultContainer) return;

  const scopeEl = document.getElementById('select-audit-scope');
  const typeEl = document.getElementById('select-audit-type');

  const auditScope = scopeEl ? scopeEl.value : 'filtered';
  const auditType = typeEl ? typeEl.value : 'all';

  const sourceData = (auditScope === 'filtered' && window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
                     ? window.lastFilteredOutlets
                     : activeOutletData;

  if (!sourceData || sourceData.length === 0) {
    resultContainer.innerHTML = `<div style="font-size: 11px; padding: 6px;">Belum ada data toko terimpor atau terfilter.</div>`;
    if (btnExport) btnExport.style.display = 'none';
    if (btnStop) btnStop.style.display = 'none';
    return;
  }

  if (btnAudit) {
    btnAudit.disabled = true;
    btnAudit.innerHTML = `Memproses...`;
  }

  resultContainer.innerHTML = `
    <div style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px;">
      Menjalankan Audit Asinkron...
      <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 6px; overflow: hidden;">
        <div id="audit-progress-bar" style="width: 0%; height: 100%; background: #dc2626; transition: width 0.1s;"></div>
      </div>
    </div>
  `;

  const anomalyList = [];
  const processedCodes = new Set();

  manualAnomalySet.forEach(custCode => {
    const found = sourceData.find(o => String(o.customer_number || o.id) === String(custCode));
    if (found) {
      anomalyList.push({ outlet: found, reason: "Ditandai Manual oleh User" });
      processedCodes.add(String(custCode));
      lastAnomalySet.add(String(custCode));
    }
  });

  let index = 0;
  const total = sourceData.length;
  const batchSize = 150;

  function processBatch() {
    const end = Math.min(index + batchSize, total);

    for (let i = index; i < end; i++) {
      const o = sourceData[i];
      const custCode = String(o.customer_number || o.id || '');
      if (processedCodes.has(custCode)) continue;

      const lat = parseFloat(o.lat ?? o.latitude);
      const lng = parseFloat(o.lng ?? o.longitude);
      const kodyaKey = o.kodya || '';

      const isZeroCoord = isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0);
      if (isZeroCoord) {
        if (auditType === 'all' || auditType === 'zero') {
          anomalyList.push({ outlet: o, reason: "Koordinat Kosong / Nol (0,0)" });
          lastAnomalySet.add(custCode);
        }
        continue;
      }

      const isOcean = (lat < -11.0 || lat > 6.0 || lng < 95.0 || lng > 141.0 || lng < 108.95) ||
                      (kodyaKey === 'PTK' && (lng < 109.24 || lng > 109.42 || lat < -0.09 || lat > 0.05)) ||
                      (kodyaKey === 'SKW' && (lng < 108.94 || lng > 109.12));

      if (isOcean) {
        if (auditType === 'all' || auditType === 'ocean') {
          anomalyList.push({ outlet: o, reason: `Terdeteksi di Area Laut / Pesisir (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
          lastAnomalySet.add(custCode);
        }
        continue;
      }

      const maxAllowedKm = KODYA_MAX_DIST_KM[kodyaKey] || 50;
      if (kodyaKey && KODYA_CENTERS[kodyaKey]) {
        const center = KODYA_CENTERS[kodyaKey];
        const distKm = getDistanceInMeters(lat, lng, center[0], center[1]) / 1000;
        if (distKm > maxAllowedKm) {
          if (auditType === 'all' || auditType === 'dist') {
            anomalyList.push({ outlet: o, reason: `Penyimpangan Jarak (${Math.round(distKm)} km dari ${KODYA_MAP[kodyaKey] || kodyaKey})` });
            lastAnomalySet.add(custCode);
          }
          continue;
        }
      }
    }

    index = end;
    const pct = Math.round((index / total) * 100);

    const progressBar = document.getElementById('audit-progress-bar');
    if (progressBar) progressBar.style.width = `${pct}%`;

    if (index < total) {
      setTimeout(processBatch, 0);
    } else {
      finishAudit();
    }
  }

  function finishAudit() {
    if (btnAudit) {
      btnAudit.disabled = false;
      btnAudit.innerHTML = `Audit Ulang`;
    }

    if (btnStop) {
      btnStop.style.display = 'inline-flex';
    }

    lastAnomalyList = anomalyList;

    if (typeof window.applyAnomalyStylesToMarkers === 'function') {
      window.applyAnomalyStylesToMarkers(lastAnomalySet);
    }

    if (typeof window.highlightAnomalyMarkers === 'function') {
      window.highlightAnomalyMarkers(anomalyList);
    }

    updateAnomalyResultUI();
    generateExecutiveSummary();
    showToast(`Audit Selesai. ${anomalyList.length} toko anomali terdeteksi.`);
  }

  processBatch();
}

function updateAnomalyResultUI() {
  const resultContainer = document.getElementById('anomaly-audit-results');
  const btnExport = document.getElementById('btn-export-anomaly-excel');
  const btnStop = document.getElementById('btn-stop-anomaly-audit');
  if (!resultContainer) return;

  if (!lastAnomalyList || lastAnomalyList.length === 0) {
    resultContainer.innerHTML = `
      <div style="border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-size: 11px;">
        <b>Audit Selesai:</b> Tidak ada anomali terdeteksi!
      </div>
    `;
    if (btnExport) btnExport.style.display = 'none';
    return;
  }

  if (btnExport) btnExport.style.display = 'inline-flex';
  if (btnStop) btnStop.style.display = 'inline-flex';

  let html = `
    <div style="background: rgba(220, 38, 38, 0.15); border: 1px solid #dc2626; color: #dc2626; padding: 8px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-bottom: 8px;">
      Terdeteksi ${lastAnomalyList.length} Toko Anomali
    </div>
  `;

  lastAnomalyList.forEach(item => {
    const o = item.outlet;
    const code = o.customer_number || o.id || '-';
    const kecName = typeof extractKecamatanName === 'function' ? extractKecamatanName(o) : '-';

    html += `
      <div class="anomaly-item" data-id="${o.id || o.customer_number}" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-bottom: 1px solid #cbd5e1; cursor: pointer; border-radius: 4px; margin-bottom: 4px;">
        <div>
          <div style="font-weight: 700; font-size: 11px;">${o.name} (${code})</div>
          <div style="font-size: 10px; color: #dc2626; font-weight: 700; margin-top: 1px;">${item.reason}</div>
          <div style="font-size: 9.5px; margin-top: 1px;">Kec: ${kecName} | Kab: ${KODYA_MAP[o.kodya] || o.kodya || '-'}</div>
        </div>
        <button onclick="event.stopPropagation(); window.toggleManualAnomaly('${code}')" style="background: #dc2626; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer;">
          Hapus
        </button>
      </div>
    `;
  });

  resultContainer.innerHTML = html;

  const items = resultContainer.querySelectorAll('.anomaly-item');
  items.forEach(el => {
    el.addEventListener('click', () => {
      const outletId = el.getAttribute('data-id');
      const target = activeOutletData.find(o => String(o.id) === String(outletId) || String(o.customer_number) === String(outletId));
      if (target) {
        showOutletDetail(target, false);
      }
    });
  });
}

function stopCoordinateAnomalyAudit() {
  if (typeof window.clearAnomalyAudit === 'function') {
    window.clearAnomalyAudit();
  }

  lastAnomalyList = [];

  const resultContainer = document.getElementById('anomaly-audit-results');
  const btnExport = document.getElementById('btn-export-anomaly-excel');
  const btnStop = document.getElementById('btn-stop-anomaly-audit');
  const btnRun = document.getElementById('btn-run-anomaly-audit');

  if (resultContainer) {
    resultContainer.innerHTML = `
      <div style="border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; font-size: 11px; text-align: center;">
        Mode Audit Anomali Dinonaktifkan.
      </div>
    `;
  }

  if (btnExport) btnExport.style.display = 'none';
  if (btnStop) btnStop.style.display = 'none';
  if (btnRun) {
    btnRun.disabled = false;
    btnRun.innerHTML = `Jalankan Audit Anomali`;
  }

  showToast("Audit Anomali Dimatikan.");
}

window.stopCoordinateAnomalyAudit = stopCoordinateAnomalyAudit;

function exportAnomalyToExcel() {
  if (!lastAnomalyList || lastAnomalyList.length === 0) {
    showToast("Tidak ada data anomali yang dapat di-export.");
    return;
  }

  let csvContent = "\uFEFFKode Customer,Nama Toko,Kabupaten/Kodya,Kecamatan,Alamat,Latitude,Longitude,Detail Anomali\n";

  lastAnomalyList.forEach(item => {
    const o = item.outlet;
    const custCode = `"${(o.customer_number || o.id || '').toString().replace(/"/g, '""')}"`;
    const name = `"${(o.name || '').toString().replace(/"/g, '""')}"`;
    const kodya = `"${(KODYA_MAP[o.kodya] || o.kodya || '').toString().replace(/"/g, '""')}"`;
    const kecName = typeof extractKecamatanName === 'function' ? extractKecamatanName(o) : '';
    const kec = `"${kecName.replace(/"/g, '""')}"`;
    const alamat = `"${(o.address || '').toString().replace(/"/g, '""')}"`;
    const lat = o.lat ?? o.latitude ?? '-';
    const lng = o.lng ?? o.longitude ?? '-';
    const reason = `"${(item.reason || '').toString().replace(/"/g, '""')}"`;

    csvContent += `${custCode},${name},${kodya},${kec},${alamat},${lat},${lng},${reason}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const aLink = document.createElement('a');
  aLink.setAttribute('href', url);
  aLink.setAttribute('download', `SpotRevenue_Audit_Anomali_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);

  showToast("File Audit Anomali berhasil di-download!");
}

function showOutletDetail(outlet, autoSwitchTab = false) {
  selectedOutlet = outlet;
  window.selectedOutlet = outlet;

  if (autoSwitchTab) {
    const btnDetail = document.querySelector('.btn-module-nav[data-modul="modul-detail"]');
    if (btnDetail) btnDetail.click();
  }

  const card = document.getElementById('outlet-detail-card');
  if (!card) return;

  const custCode = outlet.customer_number || outlet.id || '-';
  const metrics = getOutletMetrics(outlet);

  card.style.display = 'block';
  document.getElementById('outlet-nama').innerText = outlet.name;
  document.getElementById('outlet-id').innerText = `Kode Customer: ${custCode}`;
  document.getElementById('outlet-alamat').innerText = outlet.address || 'Alamat tidak tersedia';
  document.getElementById('outlet-kodya').innerText = KODYA_MAP[outlet.kodya] || outlet.kodya || '-';
  document.getElementById('outlet-kecamatan').innerText = typeof extractKecamatanName === 'function' ? extractKecamatanName(outlet) : '-';
  document.getElementById('outlet-kelas').innerText = Array.isArray(outlet.class) ? outlet.class.join(', ') : (outlet.class || '-');
  document.getElementById('outlet-tipe').innerText = Array.isArray(outlet.tipe) ? outlet.tipe.join(', ') : (outlet.tipe || '-');

  let zeroMonthCount = 0;
  if (outlet.monthly_sales) {
    selectedMonths.forEach(m => {
      if ((outlet.monthly_sales[m] || 0) === 0) zeroMonthCount++;
    });
  }
  const isChurn = selectedMonths.length >= 2 && zeroMonthCount >= Math.ceil(selectedMonths.length * 0.6);

  let churnBadgeEl = document.getElementById('outlet-churn-alert-badge');
  if (!churnBadgeEl) {
    churnBadgeEl = document.createElement('div');
    churnBadgeEl.id = 'outlet-churn-alert-badge';
    card.insertBefore(churnBadgeEl, card.firstChild);
  }

  if (isChurn) {
    churnBadgeEl.style.cssText = 'background: rgba(220, 38, 38, 0.15); border: 1px solid #dc2626; color: #dc2626; padding: 6px; border-radius: 4px; font-weight: 700; font-size: 10.5px; margin-bottom: 8px; text-align: center;';
    churnBadgeEl.innerText = '⚠️ DETEKSI TOKO PASIF / CHURN RISK';
    churnBadgeEl.style.display = 'block';
  } else {
    churnBadgeEl.style.display = 'none';
  }

  let salesmanVal = '-';
  if (Array.isArray(outlet.salespersons) && outlet.salespersons.length > 0) {
    const uniqueSales = [...new Set(outlet.salespersons.filter(Boolean))];
    salesmanVal = uniqueSales.join(', ');
  } else if (typeof outlet.salespersons === 'string' && outlet.salespersons.trim() !== '') {
    salesmanVal = outlet.salespersons;
  }

  const elSalesman = document.getElementById('outlet-salesman');
  if (elSalesman) elSalesman.innerText = salesmanVal;

  const labelEl = document.getElementById('active-metric-label');
  const valEl = document.getElementById('outlet-omset');
  const badgeEl = document.getElementById('selected-months-badge');
  const avgValEl = document.getElementById('outlet-avg-omset');

  if (badgeEl) badgeEl.innerText = `${selectedMonths.length} Bulan Aktif (${selectedMonths.join(', ')})`;

  if (labelEl) labelEl.innerText = `TOTAL ${activeMetric.toUpperCase()}`;
  if (valEl) valEl.innerText = formatMetricValue(metrics.total, activeMetric);
  if (avgValEl) avgValEl.innerText = `${formatMetricValue(metrics.avg, activeMetric)} / Bln`;

  const brandListEl = document.getElementById('outlet-top-brands');
  if (brandListEl) {
    if (outlet.top_brands && outlet.top_brands.length > 0) {
      let brandHtml = '';
      outlet.top_brands.forEach(b => {
        brandHtml += `<li><b>${b.brand}</b>: ${formatMetricValue(b.sales, activeMetric)}</li>`;
      });
      brandListEl.innerHTML = brandHtml;
    } else {
      brandListEl.innerHTML = '<li>Tidak ada data brand.</li>';
    }
  }

  const lat = outlet.lat ?? outlet.latitude ?? (outlet.location ? outlet.location.lat : null);
  const lng = outlet.lng ?? outlet.longitude ?? (outlet.location ? outlet.location.lng : null);

  if (lat != null && lng != null) {
    updateCoordDisplay(lat, lng);
  } else {
    const elLat = document.getElementById('val-lat');
    const elLng = document.getElementById('val-lng');
    if (elLat) elLat.innerText = '-';
    if (elLng) elLng.innerText = '-';
  }

  const isManual = manualAnomalySet.has(String(custCode));
  let manualBtnEl = document.getElementById('btn-manual-anomaly-sidebar');
  if (!manualBtnEl) {
    manualBtnEl = document.createElement('button');
    manualBtnEl.id = 'btn-manual-anomaly-sidebar';
    manualBtnEl.style.cssText = 'width: 100%; margin-top: 10px; padding: 8px; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 11px;';
    card.appendChild(manualBtnEl);
  }

  manualBtnEl.style.background = isManual ? '#262626' : '#dc2626';
  manualBtnEl.style.color = '#ffffff';
  manualBtnEl.innerText = isManual ? 'Batal Anomali Manual' : 'Tandai Sebagai Anomali Manual';
  manualBtnEl.onclick = () => toggleManualAnomaly(custCode);

  updateBufferZoneAnalysis();
}

function updateCoordDisplay(lat, lng) {
  const elLat = document.getElementById('val-lat');
  const elLng = document.getElementById('val-lng');
  if (elLat) elLat.innerText = parseFloat(lat).toFixed(6);
  if (elLng) elLng.innerText = parseFloat(lng).toFixed(6);
}