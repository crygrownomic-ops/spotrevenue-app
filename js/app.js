/* ==============================================================================
   SpotRevenue Application Controller v3.7 (Unfreeze Guarantee & Spatial Grid Optimization)
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
let dashCalcMode = 'total';
let lastAnomalyList = [];

const manualAnomalySet = new Set();
window.manualAnomalySet = manualAnomalySet;

const lastAnomalySet = new Set();
window.lastAnomalySet = lastAnomalySet;

window.quadrantStats = { stars: 0, cows: 0, questions: 0, risks: 0 };

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
      if (typeof window.openFullDashboard === 'function') {
        window.openFullDashboard();
      }
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

  const sidebar = document.getElementById('sidebar');
  const triggerZone = document.getElementById('sidebar-trigger-zone');
  const btnPin = document.getElementById('btn-pin-sidebar');
  const btnReset = document.getElementById('btn-reset-db');

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

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm("Bersihkan seluruh memori peta tersimpan dan muat ulang?")) {
        if (window.db) {
          await window.db.delete();
        }
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

/* PENGHUBUNG KONTROL EVENT MODUL SPASIAL */
function setupSpatialModuleListeners() {
  const radiusSelect = document.getElementById('select-buffer-radius');
  if (radiusSelect) {
    radiusSelect.addEventListener('change', updateBufferZoneAnalysis);
  }

  const btnCannibal = document.getElementById('btn-check-cannibalization');
  if (btnCannibal) {
    btnCannibal.addEventListener('click', checkCannibalization);
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

/* KALKULASI & RENDER VISUAL CATCHMENT RADIUS MODUL SPASIAL */
function updateBufferZoneAnalysis() {
  const radiusSelect = document.getElementById('select-buffer-radius');
  const resultBox = document.getElementById('buffer-analysis-result');
  const nameBox = document.getElementById('spasial-selected-outlet-name');

  if (!selectedOutlet) {
    if (nameBox) nameBox.innerText = "Belum ada toko terpilih. Klik salah satu titik toko pada peta!";
    if (resultBox) resultBox.innerHTML = `<span style="color: #cbd5e1;">Petunjuk: Klik salah satu toko pada peta, lalu tentukan radius untuk menampilkan area jangkauan pada peta secara visual.</span>`;
    if (typeof window.clearBufferCircle === 'function') window.clearBufferCircle();
    return;
  }

  const radiusMeters = parseInt(radiusSelect ? radiusSelect.value : '500');
  const lat = parseFloat(selectedOutlet.lat ?? selectedOutlet.latitude);
  const lng = parseFloat(selectedOutlet.lng ?? selectedOutlet.longitude);

  if (nameBox) {
    nameBox.innerHTML = `<b style="color: #34d399;">${selectedOutlet.name}</b> <span style="color: #38bdf8; font-size: 11px;">(${selectedOutlet.customer_number || selectedOutlet.id})</span>`;
  }

  if (radiusMeters <= 0) {
    if (resultBox) resultBox.innerHTML = `<span style="color: #cbd5e1;">Lingkaran radius dinonaktifkan.</span>`;
    if (typeof window.clearBufferCircle === 'function') window.clearBufferCircle();
    return;
  }

  if (isNaN(lat) || isNaN(lng)) {
    if (resultBox) resultBox.innerHTML = `<span style="color: #f87171;">Koordinat toko tidak valid.</span>`;
    return;
  }

  const dataset = window.lastFilteredOutlets || activeOutletData;
  let nearbyCount = 0;
  let nearbySales = 0;

  dataset.forEach(o => {
    const oLat = parseFloat(o.lat ?? o.latitude);
    const oLng = parseFloat(o.lng ?? o.longitude);
    if (!isNaN(oLat) && !isNaN(oLng)) {
      const dist = getDistanceInMeters(lat, lng, oLat, oLng);
      if (dist <= radiusMeters) {
        nearbyCount++;
        nearbySales += (o.current_total || 0);
      }
    }
  });

  const metricUpper = activeMetric.toUpperCase();
  const formattedSales = activeMetric === 'val'
    ? `Rp ${Math.round(nearbySales).toLocaleString('id-ID')}`
    : `${Math.round(nearbySales).toLocaleString('id-ID')} ${metricUpper}`;

  if (resultBox) {
    resultBox.innerHTML = `
      <div style="font-weight: 700; color: #34d399; margin-bottom: 4px;">📍 Hasil Analisis Catchment Radius (${radiusMeters >= 1000 ? (radiusMeters/1000) + ' km' : radiusMeters + ' m'}):</div>
      <div>• Jumlah toko dalam radius: <b style="color: #ffffff;">${nearbyCount.toLocaleString('id-ID')} Toko</b></div>
      <div>• Akumulasi Omset Radius: <b style="color: #38bdf8;">${formattedSales}</b></div>
    `;
  }

  if (typeof window.drawBufferCircle === 'function') {
    window.drawBufferCircle([lat, lng], radiusMeters);
  }
}

/* EVALUASI TUMPANG TINDIH WILAYAH / KANIBALISASI (<500M) - HIGH PERFORMANCE & UNFREEZE GUARANTEED */
async function checkCannibalization() {
  const dataset = window.lastFilteredOutlets || activeOutletData;
  if (!dataset || dataset.length === 0) {
    showToast("Tidak ada toko untuk dievaluasi.");
    return;
  }

  showLoading("Mengevaluasi tumpang tindih lokasi...");

  // Jeda 50ms agar UI browser sempat merender modal loading
  await new Promise(resolve => setTimeout(resolve, 50));

  const startTime = performance.now();
  const overlappingPairs = [];

  try {
    const thresholdMeters = 500;
    const cellSize = 0.0045; // Sel grid ~500m
    const grid = new Map();

    // 1. Plotting toko ke Spatial Grid
    for (let i = 0; i < dataset.length; i++) {
      const o = dataset[i];
      const lat = parseFloat(o.lat ?? o.latitude);
      const lng = parseFloat(o.lng ?? o.longitude);

      if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
        const gx = Math.floor(lat / cellSize);
        const gy = Math.floor(lng / cellSize);
        const cellKey = `${gx}_${gy}`;

        if (!grid.has(cellKey)) {
          grid.set(cellKey, []);
        }
        grid.get(cellKey).push({ outlet: o, lat, lng, index: i });
      }
    }

    const evaluatedPairs = new Set();

    // 2. Evaluasi Efisien Tetangga Sel Grid
    grid.forEach((cellOutlets, cellKey) => {
      const [gx, gy] = cellKey.split('_').map(Number);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborKey = `${gx + dx}_${gy + dy}`;
          const neighborOutlets = grid.get(neighborKey);

          if (!neighborOutlets) continue;

          for (let aIdx = 0; aIdx < cellOutlets.length; aIdx++) {
            const a = cellOutlets[aIdx];
            for (let bIdx = 0; bIdx < neighborOutlets.length; bIdx++) {
              const b = neighborOutlets[bIdx];

              if (a.index >= b.index) continue;

              const pairId = `${a.index}_${b.index}`;
              if (evaluatedPairs.has(pairId)) continue;
              evaluatedPairs.add(pairId);

              const dist = getDistanceInMeters(a.lat, a.lng, b.lat, b.lng);
              if (dist < thresholdMeters) {
                overlappingPairs.push({ a: a.outlet, b: b.outlet, dist: Math.round(dist) });
              }
            }
          }
        }
      }
    });

    const endTime = performance.now();
    const durationMs = (endTime - startTime).toFixed(1);

    // 3. Highlight Garis Peta (Maksimal 150 Garis Pertama untuk Mencegah Map Lag)
    if (typeof window.highlightCannibalizationPairs === 'function') {
      window.highlightCannibalizationPairs(overlappingPairs.slice(0, 150));
    }

    // 4. Render Hasil Rincian ke Sidebar
    renderCannibalizationResultsUI(overlappingPairs, durationMs);

    showToast(`Evaluasi Selesai (${durationMs} ms): Ditemukan ${overlappingPairs.length} pasangan toko berdekatan.`);

  } catch (err) {
    console.error("Gagal melakukan evaluasi tumpang tindih:", err);
    showToast("Terjadi kesalahan saat mengevaluasi tumpang tindih.");
  } finally {
    // PASTI DIPANGGIL: Menjamin loading overlay tertutup dalam kondisi apa pun
    hideLoading();
  }
}

/* HELPER RENDER HASIL SIDEBAR SPASIAL */
function renderCannibalizationResultsUI(overlappingPairs, durationMs) {
  let resultContainer = document.getElementById('cannibalization-results-container');
  const parentBtn = document.getElementById('btn-check-cannibalization');
  const parentCard = parentBtn ? parentBtn.closest('.section-card') : null;

  if (!resultContainer && parentCard) {
    resultContainer = document.createElement('div');
    resultContainer.id = 'cannibalization-results-container';
    resultContainer.style.cssText = 'margin-top: 10px; max-height: 220px; overflow-y: auto; background: rgba(0,0,0,0.5); border: 1px solid rgba(249, 115, 22, 0.4); border-radius: 8px; padding: 8px;';
    parentCard.appendChild(resultContainer);
  }

  if (!resultContainer) return;

  if (overlappingPairs.length === 0) {
    resultContainer.innerHTML = `
      <div style="color: #a7f3d0; font-size: 11px; text-align: center; padding: 8px;">
        ✅ Tidak ada outlet yang saling berdekatan (&lt; 500m). Teritori optimal! (${durationMs} ms)
      </div>
    `;
  } else {
    let html = `
      <div style="font-weight: 700; color: #f97316; font-size: 11.5px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span>⚠️ Ditemukan ${overlappingPairs.length} Pasangan Toko (&lt;500m):</span>
        <span style="color: #cbd5e1; font-weight: 400; font-size: 10px;">⏱️ ${durationMs} ms</span>
      </div>
    `;

    overlappingPairs.forEach((pair, idx) => {
      html += `
        <div class="cannibal-pair-item" data-idx="${idx}" style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; border-radius: 4px; transition: background 0.2s;">
          <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${pair.a.name} <span style="color: #f97316;">↔</span> ${pair.b.name}</div>
          <div style="font-size: 10px; color: #cbd5e1; display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Kec: ${pair.a.kecamatan || '-'}</span>
            <b style="color: #f97316;">Jarak: ${pair.dist}m</b>
          </div>
        </div>
      `;
    });

    resultContainer.innerHTML = html;

    const pairItems = resultContainer.querySelectorAll('.cannibal-pair-item');
    pairItems.forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'));
        const pair = overlappingPairs[idx];
        if (pair && window.map) {
          const aLat = parseFloat(pair.a.lat ?? pair.a.latitude);
          const aLng = parseFloat(pair.a.lng ?? pair.a.longitude);
          const bLat = parseFloat(pair.b.lat ?? pair.b.latitude);
          const bLng = parseFloat(pair.b.lng ?? pair.b.longitude);

          window.map.fitBounds([[aLat, aLng], [bLat, bLng]], { padding: [80, 80], maxZoom: 17 });
          showToast(`Fokus ke lokasi: ${pair.a.name} & ${pair.b.name}`);
        }
      });
    });
  }
}

function setupMetricSwitchListeners() {
  const metricBtns = document.querySelectorAll('.btn-metric');
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
        showToast("Filter Kuadran Dinonaktifkan (Menampilkan Semua Toko)");
      } else {
        activeQuadrantFilter = qType;
        quadCards.forEach(c => c.classList.remove('active-filter'));
        card.classList.add('active-filter');

        const names = { star: 'Star Outlets', cow: 'Cash Cows', question: 'Toko Potensial', risk: 'Underperform' };
        showToast(`Filter Peta: Menyoroti ${names[qType]}`);
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
    container.innerHTML = `<span class="placeholder-text">Tidak ada data terfilter untuk dianalisis. Silakan impor dataset terlebih dahulu.</span>`;
    return;
  }

  let totalOmset = 0;
  const kecMap = {};
  dataset.forEach(o => {
    const v = o.current_total || 0;
    totalOmset += v;
    const k = Array.isArray(o.kecamatan) ? o.kecamatan[0] : (o.kecamatan || 'Lainnya');
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
  const formattedTotal = activeMetric === 'val' ? `Rp ${Math.round(totalOmset).toLocaleString('id-ID')}` : `${Math.round(totalOmset).toLocaleString('id-ID')} ${metricName}`;

  const stats = window.quadrantStats || { stars: 0, cows: 0, questions: 0, risks: 0 };
  const starPct = dataset.length > 0 ? ((stats.stars / dataset.length) * 100).toFixed(1) : '0';
  const questionPct = dataset.length > 0 ? ((stats.questions / dataset.length) * 100).toFixed(1) : '0';
  const riskPct = dataset.length > 0 ? ((stats.risks / dataset.length) * 100).toFixed(1) : '0';

  const html = `
    <div style="font-weight: 800; color: #34d399; margin-bottom: 6px; font-size: 12px;">📊 Analisis Eksekutif Real-Time (Metrik: ${metricName}):</div>
    <div style="color: #ffffff; margin-bottom: 4px;">Total akumulasi penjualan: <b style="color: #ffffff;">${formattedTotal}</b> dari <b style="color: #ffffff;">${dataset.length.toLocaleString('id-ID')} outlet</b> terfilter.</div>
    <div style="margin-top: 5px; color: #f8fafc;">• Wilayah Kontributor Utama: <b style="color: #fbbf24;">Kec. ${topKec}</b> (${topKecContribPct}% dari total omset).</div>
    <div style="margin-top: 5px; color: #f8fafc;">• Sebaran Performa: <b style="color: #fbbf24;">${stats.stars.toLocaleString('id-ID')} Star (${starPct}%)</b>, <b style="color: #60a5fa;">${stats.questions.toLocaleString('id-ID')} Potensial (${questionPct}%)</b>, dan <b style="color: #f87171;">${stats.risks.toLocaleString('id-ID')} Underperform (${riskPct}%)</b>.</div>
    <div style="margin-top: 5px; color: ${totalAnomalies > 0 ? '#f87171' : '#a7f3d0'}; font-weight: 600;">• Audit Spasial: Terdeteksi <b style="color: #ffffff;">${totalAnomalies} outlet anomali koordinat</b>.</div>
    <div style="margin-top: 8px; font-style: italic; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.25); padding-top: 6px;">
      <b style="color: #38bdf8; font-style: normal;">💡 Rekomendasi Operasional System:</b><br>
      1. Dorong ketersediaan varian produk pada <b style="color: #60a5fa; font-style: normal;">${stats.questions} Toko Potensial</b> yang rajin transaksi agar omsetnya meningkat.<br>
      2. Tinjau rute kunjungan salesman di Kec. ${topKec} dan evaluasi <b style="color: #f87171; font-style: normal;">${stats.risks} toko Underperform</b>.
    </div>
  `;

  container.innerHTML = html;
}

function calculateOptimizedRoute() {
  if (!selectedOutlet) {
    showToast("Silakan klik salah satu outlet utama di peta sebagai titik awal rute!");
    return;
  }

  const limitEl = document.getElementById('select-route-limit');
  const limit = parseInt(limitEl ? limitEl.value : '10');
  const dataset = window.lastFilteredOutlets || activeOutletData;

  const startLat = parseFloat(selectedOutlet.lat ?? selectedOutlet.latitude);
  const startLng = parseFloat(selectedOutlet.lng ?? selectedOutlet.longitude);

  if (isNaN(startLat) || isNaN(startLng)) {
    showToast("Koordinat outlet utama tidak valid.");
    return;
  }

  const unvisited = dataset.filter(o => {
    const lat = parseFloat(o.lat ?? o.latitude);
    const lng = parseFloat(o.lng ?? o.longitude);
    return (o.id !== selectedOutlet.id && o.customer_number !== selectedOutlet.customer_number) && !isNaN(lat) && !isNaN(lng);
  });

  const route = [selectedOutlet];
  let currentLat = startLat;
  let currentLng = startLng;

  while (route.length < limit && unvisited.length > 0) {
    let nearestIdx = -1;
    let minDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const o = unvisited[i];
      const dist = getDistanceInMeters(currentLat, currentLng, parseFloat(o.lat ?? o.latitude), parseFloat(o.lng ?? o.longitude));
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    if (nearestIdx !== -1) {
      const nextOutlet = unvisited.splice(nearestIdx, 1)[0];
      route.push(nextOutlet);
      currentLat = parseFloat(nextOutlet.lat ?? nextOutlet.latitude);
      currentLng = parseFloat(nextOutlet.lng ?? nextOutlet.longitude);
    } else {
      break;
    }
  }

  const container = document.getElementById('route-steps-container');
  if (container) {
    let html = '';
    const routeCoords = [];

    route.forEach((item, idx) => {
      const lat = parseFloat(item.lat ?? item.latitude);
      const lng = parseFloat(item.lng ?? item.longitude);
      routeCoords.push([lat, lng]);

      html += `
        <div class="route-step-item">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="step-num">${idx + 1}</span>
            <div>
              <div style="font-weight: 700; color: #ffffff; font-size: 11px;">${item.name}</div>
              <div style="font-size: 9.5px; color: #a7f3d0;">${item.customer_number || item.id}</div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    if (typeof window.drawSalesRoute === 'function') {
      window.drawSalesRoute(routeCoords);
    }
  }

  showToast(`Rute Kunjungan Berhasil Dihitung (${route.length} Titik)`);
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
      suggestionsBox.innerHTML = `<div class="suggestion-item" style="color: #cbd5e1; cursor: default; padding: 8px;">Toko tidak ditemukan</div>`;
      suggestionsBox.style.display = 'block';
      return;
    }

    let html = '';
    matches.forEach(o => {
      const code = o.customer_number || o.id || '';
      const kec = Array.isArray(o.kecamatan) ? o.kecamatan.join(', ') : (o.kecamatan || '-');
      html += `
        <div class="suggestion-item" data-id="${o.id || o.customer_number}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <div style="font-weight: 700; color: #a7f3d0; font-size: 13px;">${o.name}</div>
          <div style="font-size: 11px; color: #cbd5e1;">Kode: ${code} | Kec: ${kec}</div>
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
  const monthPills = document.querySelectorAll('.btn-month-pill');
  const presetBtns = document.querySelectorAll('.btn-preset');

  monthPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const m = pill.getAttribute('data-month');
      toggleDashboardMonth(m);
    });
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      presetBtns.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      if (preset === 'all') selectedMonths = [...ALL_MONTHS];
      else if (preset === 'q1') selectedMonths = ['JAN', 'FEB', 'MAR'];
      else if (preset === 'q2') selectedMonths = ['APR', 'MAY', 'JUN'];
      else if (preset === 'q3') selectedMonths = ['JUL', 'AUG', 'SEP'];
      else if (preset === 'q4') selectedMonths = ['OCT', 'NOV', 'DEC'];

      syncMonthPillUI();
      applyFilters();
    });
  });
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

  syncMonthPillUI();
  applyFilters();
}

function syncMonthPillUI() {
  const monthPills = document.querySelectorAll('.btn-month-pill');
  monthPills.forEach(pill => {
    const m = pill.getAttribute('data-month');
    pill.classList.toggle('active', selectedMonths.includes(m));
  });

  const dashMonthPills = document.querySelectorAll('.dash-month-pill');
  dashMonthPills.forEach(pill => {
    const m = pill.getAttribute('data-dash-month');
    pill.classList.toggle('active', selectedMonths.includes(m));
  });
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
  showToast(`Mode Hitung: ${mode === 'total' ? 'TOTAL' : 'AVERAGE / BULAN'}`);
}

window.toggleDashboardMonth = toggleDashboardMonth;
window.setDashboardCalcMode = setDashboardCalcMode;

async function switchActiveMetric(metric) {
  activeMetric = metric;
  window.activeMetric = metric;

  const metricButtons = document.querySelectorAll('.btn-metric');
  metricButtons.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-metric') === metric);
  });

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
        const outlets = JSON.parse(evt.target.result);
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
    const thresholdIndex = Math.ceil(sortedCopy.length * 0.25);

    if (activePerfFilter === 'top') {
      const topIds = new Set(sortedCopy.slice(0, thresholdIndex).map(o => o.customer_number || o.id));
      filtered = filtered.filter(o => topIds.has(o.customer_number || o.id));
    } else if (activePerfFilter === 'low') {
      const lowIds = new Set(sortedCopy.slice(sortedCopy.length - thresholdIndex).map(o => o.customer_number || o.id));
      filtered = filtered.filter(o => lowIds.has(o.customer_number || o.id));
    }
  }

  window.lastFilteredOutlets = filtered;

  let totalOmsetAll = 0;
  const kecMapCount = {};

  filtered.forEach(item => {
    totalOmsetAll += item.current_total;
    const kec = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || 'Lainnya');
    kecMapCount[kec] = (kecMapCount[kec] || 0) + item.current_total;
  });

  let topKecName = '-';
  let maxKecVal = -1;
  Object.keys(kecMapCount).forEach(k => {
    if (kecMapCount[k] > maxKecVal) {
      maxKecVal = kecMapCount[k];
      topKecName = k;
    }
  });

  const avgPerOutlet = filtered.length > 0 ? (totalOmsetAll / filtered.length) : 0;
  const metricLabel = activeMetric.toUpperCase();

  const elKpiOutlet = document.getElementById('kpi-total-outlet');
  const elKpiOmset = document.getElementById('kpi-total-omset');
  const elKpiAvg = document.getElementById('kpi-avg-outlet');
  const elKpiKec = document.getElementById('kpi-top-kec');

  if (elKpiOutlet) elKpiOutlet.innerText = `${filtered.length.toLocaleString('id-ID')} Toko`;
  if (elKpiOmset) elKpiOmset.innerText = activeMetric === 'val' ? `Rp ${totalOmsetAll.toLocaleString('id-ID')}` : `${totalOmsetAll.toLocaleString('id-ID')} ${metricLabel}`;
  if (elKpiAvg) elKpiAvg.innerText = activeMetric === 'val' ? `Rp ${Math.round(avgPerOutlet).toLocaleString('id-ID')}` : `${Math.round(avgPerOutlet).toLocaleString('id-ID')} ${metricLabel}`;
  if (elKpiKec) elKpiKec.innerText = topKecName;

  if (isHeatmapActive && typeof renderHeatmapLayer === 'function') {
    renderHeatmapLayer(filtered);
  } else if (typeof renderOutletMarkers === 'function') {
    renderOutletMarkers(filtered);
  }

  if (selectedOutlet) {
    const updatedOutlet = filtered.find(o => (o.id === selectedOutlet.id || o.customer_number === selectedOutlet.customer_number));
    if (updatedOutlet) {
      showOutletDetail(updatedOutlet, false);
    }
  }

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
  const kecMap = {};
  const brandMap = {};
  const salesMap = {};

  dataset.forEach(item => {
    const itemVal = item.current_total || item.total_sales || 0;
    totalOmset += itemVal;

    const kec = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || 'Lainnya');
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
  });

  if (dashCalcMode === 'avg') {
    totalOmset = totalOmset / numMonths;

    Object.keys(kecMap).forEach(k => kecMap[k] = kecMap[k] / numMonths);
    Object.keys(brandMap).forEach(b => brandMap[b] = brandMap[b] / numMonths);
    Object.keys(salesMap).forEach(s => salesMap[s] = salesMap[s] / numMonths);
  }

  const totalOutlet = dataset.length;
  const avgPerOutlet = totalOutlet > 0 ? (totalOmset / totalOutlet) : 0;

  const formatVal = (num) => {
    const formatted = Math.round(num).toLocaleString('id-ID');
    if (currentMetric === 'val') {
      return `Rp ${formatted}`;
    } else if (currentMetric === 'box') {
      return `${formatted} BOX`;
    } else {
      return `${formatted} UOM`;
    }
  };

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
  const elSubOmset = document.getElementById('sub-full-kpi-omset');
  const elAvg = document.getElementById('full-kpi-avg');
  const elTopKec = document.getElementById('full-kpi-top-kec');
  const elLabelOmset = document.getElementById('label-full-kpi-omset');
  const elChartBadge = document.getElementById('chart-metric-badge');

  if (elOutlet) elOutlet.innerText = `${totalOutlet.toLocaleString('id-ID')} Toko`;
  if (elOmset) elOmset.innerText = formatVal(totalOmset);
  if (elAvg) elAvg.innerText = formatVal(avgPerOutlet);
  if (elTopKec) elTopKec.innerText = topKec;

  if (elLabelOmset) {
    elLabelOmset.innerText = dashCalcMode === 'avg' ? `Akumulasi AVERAGE (${metricUpper})` : `Akumulasi TOTAL (${metricUpper})`;
  }
  if (elSubOmset) {
    elSubOmset.innerText = dashCalcMode === 'avg' ? `Rata-rata dihitung dari ${numMonths} bulan terpilih` : `Total akumulasi ${numMonths} bulan terpilih`;
  }
  if (elChartBadge) {
    elChartBadge.innerText = `Metrik: ${metricUpper} | Mode: ${dashCalcMode === 'avg' ? 'AVERAGE' : 'TOTAL'}`;
  }

  renderRankList('full-rank-brands', brandMap, formatVal);
  renderRankList('full-rank-kecamatan', kecMap, formatVal);
  renderRankList('full-rank-sales', salesMap, formatVal);

  renderBrandChart(brandMap, metricUpper);
}

function renderRankList(containerId, dataMap, formatFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sortedKeys = Object.keys(dataMap).sort((a, b) => dataMap[b] - dataMap[a]).slice(0, 5);

  if (sortedKeys.length === 0) {
    container.innerHTML = `<div style="color: #cbd5e1; font-size: 12px; padding: 10px 0;">Belum ada data transaksi</div>`;
    return;
  }

  let html = '';
  sortedKeys.forEach((key, idx) => {
    const valStr = formatFn(dataMap[key]);
    html += `
      <div class="rank-list-item">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(16,185,129,0.2); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #a7f3d0;">${idx + 1}</span>
          <span style="font-weight: 600; color: #f8fafc;">${key}</span>
        </div>
        <strong style="color: #34d399; font-size: 12px;">${valStr}</strong>
      </div>
    `;
  });

  container.innerHTML = html;
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
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } },
        y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.08)' } }
      }
    }
  });
}

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
    resultContainer.innerHTML = `<div style="color: #cbd5e1; font-size: 12px; padding: 10px;">Belum ada data toko terimpor atau terfilter.</div>`;
    if (btnExport) btnExport.style.display = 'none';
    if (btnStop) btnStop.style.display = 'none';
    return;
  }

  if (btnAudit) {
    btnAudit.disabled = true;
    btnAudit.innerHTML = `Memproses Audit (0%)...`;
  }

  resultContainer.innerHTML = `
    <div style="padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; font-size: 12px; color: #ffffff;">
      Menjalankan Audit Asinkron...
      <div style="width: 100%; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-top: 8px; overflow: hidden;">
        <div id="audit-progress-bar" style="width: 0%; height: 100%; background: #10b981; transition: width 0.1s;"></div>
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
    if (btnAudit) btnAudit.innerHTML = `Memproses Audit (${pct}%)...`;

    if (index < total) {
      setTimeout(processBatch, 0);
    } else {
      finishAudit();
    }
  }

  function finishAudit() {
    if (btnAudit) {
      btnAudit.disabled = false;
      btnAudit.style.background = '#059669';
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
      <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #a7f3d0; padding: 12px; border-radius: 8px; font-size: 12px;">
        <b>Audit Selesai:</b> Tidak ada anomali terdeteksi!
      </div>
    `;
    if (btnExport) btnExport.style.display = 'none';
    return;
  }

  if (btnExport) btnExport.style.display = 'inline-flex';
  if (btnStop) btnStop.style.display = 'inline-flex';

  let html = `
    <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #f87171; color: #fca5a5; padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 700; margin-bottom: 10px;">
      Terdeteksi ${lastAnomalyList.length} Toko Anomali
    </div>
  `;

  lastAnomalyList.forEach(item => {
    const o = item.outlet;
    const code = o.customer_number || o.id || '-';
    const isManual = manualAnomalySet.has(String(code));

    html += `
      <div class="anomaly-item" data-id="${o.id || o.customer_number}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 6px;">
        <div>
          <div style="font-weight: 700; color: #ffffff; font-size: 12px;">${o.name} (${code})</div>
          <div style="font-size: 11px; color: ${isManual ? '#34d399' : '#f87171'}; font-weight: 700; margin-top: 2px;">${item.reason}</div>
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">Kec: ${o.kecamatan || '-'} | Kab: ${KODYA_MAP[o.kodya] || o.kodya || '-'}</div>
        </div>
        <button onclick="event.stopPropagation(); window.toggleManualAnomaly('${code}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight:600; cursor: pointer;">
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
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 10px; border-radius: 8px; font-size: 11px; text-align: center;">
        Mode Audit Anomali Dinonaktifkan. Peta kembali berjalan normal.
      </div>
    `;
  }

  if (btnExport) btnExport.style.display = 'none';
  if (btnStop) btnStop.style.display = 'none';
  if (btnRun) {
    btnRun.disabled = false;
    btnRun.style.background = '#000000';
    btnRun.innerHTML = `Jalankan Audit Anomali`;
  }

  showToast("Audit Anomali Dimatikan. Performa kembali optimal!");
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
    const kec = `"${(Array.isArray(o.kecamatan) ? o.kecamatan.join(';') : (o.kecamatan || '')).toString().replace(/"/g, '""')}"`;
    const alamat = `"${(o.address || '').toString().replace(/"/g, '""')}"`;
    const lat = o.lat ?? o.latitude ?? '-';
    const lng = o.lng ?? o.longitude ?? '-';
    const reason = `"${(item.reason || '').toString().replace(/"/g, '""')}"`;

    csvContent += `${custCode},${name},${kodya},${kec},${alamat},${lat},${lng},${reason}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SpotRevenue_Audit_Anomali_Koordinat_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

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
  document.getElementById('outlet-id').innerText = `Kode Customer: ${custCode} (Site ID: ${outlet.id})`;
  document.getElementById('outlet-alamat').innerText = outlet.address || 'Alamat tidak tersedia';
  document.getElementById('outlet-kodya').innerText = KODYA_MAP[outlet.kodya] || outlet.kodya || '-';
  document.getElementById('outlet-kecamatan').innerText = Array.isArray(outlet.kecamatan) ? outlet.kecamatan.join(', ') : (outlet.kecamatan || '-');
  document.getElementById('outlet-kelas').innerText = Array.isArray(outlet.class) ? outlet.class.join(', ') : (outlet.class || '-');
  document.getElementById('outlet-tipe').innerText = Array.isArray(outlet.tipe) ? outlet.tipe.join(', ') : (outlet.tipe || '-');

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

  badgeEl.innerText = `${selectedMonths.length} Bulan Aktif (${selectedMonths.join(', ')})`;

  if (activeMetric === 'val') {
    labelEl.innerText = 'Total Omset (Bulan Terpilih):';
    valEl.innerText = `Rp ${metrics.total.toLocaleString('id-ID')}`;
    avgValEl.innerText = `Rp ${metrics.avg.toLocaleString('id-ID')} / Bln`;
  } else if (activeMetric === 'box') {
    labelEl.innerText = 'Total Volume (Bulan Terpilih):';
    valEl.innerText = `${metrics.total.toLocaleString('id-ID')} Karton`;
    avgValEl.innerText = `${metrics.avg.toLocaleString('id-ID')} Karton / Bln`;
  } else {
    labelEl.innerText = 'Total Kuantitas (Bulan Terpilih):';
    valEl.innerText = `${metrics.total.toLocaleString('id-ID')} Unit`;
    avgValEl.innerText = `${metrics.avg.toLocaleString('id-ID')} Unit / Bln`;
  }

  const brandListEl = document.getElementById('outlet-top-brands');
  if (outlet.top_brands && outlet.top_brands.length > 0) {
    let brandHtml = '';
    outlet.top_brands.forEach(b => {
      const valTxt = activeMetric === 'val' ? `Rp ${b.sales.toLocaleString('id-ID')}` : `${b.sales.toLocaleString('id-ID')}`;
      brandHtml += `<li><b>${b.brand}</b>: ${valTxt}</li>`;
    });
    brandListEl.innerHTML = brandHtml;
  } else {
    brandListEl.innerHTML = '<li>Tidak ada data brand.</li>';
  }

  const lat = outlet.lat ?? outlet.latitude ?? (outlet.location ? outlet.location.lat : null);
  const lng = outlet.lng ?? outlet.longitude ?? (outlet.location ? outlet.location.lng : null);

  if (lat != null && lng != null) {
    updateCoordDisplay(lat, lng);
  } else {
    document.getElementById('val-lat').innerText = '-';
    document.getElementById('val-lng').innerText = '-';
  }

  const isManual = manualAnomalySet.has(String(custCode));
  let manualBtnEl = document.getElementById('btn-manual-anomaly-sidebar');
  if (!manualBtnEl) {
    manualBtnEl = document.createElement('button');
    manualBtnEl.id = 'btn-manual-anomaly-sidebar';
    manualBtnEl.style.cssText = 'width: 100%; margin-top: 10px; padding: 8px; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; transition: 0.2s;';
    card.appendChild(manualBtnEl);
  }

  manualBtnEl.style.background = isManual ? '#059669' : '#000000';
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