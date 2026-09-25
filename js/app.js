/* ==============================================================================
   SpotRevenue Application Controller v1.7 (KPI Analytics, Heatmap & Performance Filter)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

const DEFAULT_PROVINSI = [
  { code: "61", name: "KALIMANTAN BARAT" },
  { code: "11", name: "ACEH" },
  { code: "12", name: "SUMATERA UTARA" },
  { code: "13", name: "SUMATERA BARAT" },
  { code: "14", name: "RIAU" },
  { code: "15", name: "JAMBI" },
  { code: "16", name: "SUMATERA SELATAN" },
  { code: "17", name: "BENGKULU" },
  { code: "18", name: "LAMPUNG" },
  { code: "19", name: "KEPULAUAN BANGKA BELITUNG" },
  { code: "21", name: "KEPULAUAN RIAU" },
  { code: "31", name: "DKI JAKARTA" },
  { code: "32", name: "JAWA BARAT" },
  { code: "33", name: "JAWA TENGAH" },
  { code: "34", name: "DI YOGYAKARTA" },
  { code: "35", name: "JAWA TIMUR" },
  { code: "36", name: "BANTEN" },
  { code: "51", name: "BALI" },
  { code: "52", name: "NUSA TENGGARA BARAT" },
  { code: "53", name: "NUSA TENGGARA TIMUR" },
  { code: "62", name: "KALIMANTAN TENGAH" },
  { code: "63", name: "KALIMANTAN SELATAN" },
  { code: "64", name: "KALIMANTAN TIMUR" },
  { code: "65", name: "KALIMANTAN UTARA" },
  { code: "71", name: "SULAWESI UTARA" },
  { code: "72", name: "SULAWESI TENGAH" },
  { code: "73", name: "SULAWESI SELATAN" },
  { code: "74", name: "SULAWESI TENGGARA" },
  { code: "75", name: "GORONTALO" },
  { code: "76", name: "SULAWESI BARAT" },
  { code: "81", name: "MALUKU" },
  { code: "82", name: "MALUKU UTARA" },
  { code: "91", name: "PAPUA BARAT" },
  { code: "92", name: "PAPUA" },
  { code: "93", name: "PAPUA SELATAN" },
  { code: "94", name: "PAPUA TENGAH" },
  { code: "95", name: "PAPUA PEGUNUNGAN" },
  { code: "96", name: "PAPUA BARAT DAYA" }
];

const KODYA_MAP = {
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

const ALL_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
let selectedMonths = [...ALL_MONTHS];

let activeMetric = 'val';
window.activeMetric = activeMetric;
let activeOutletData = [];
let selectedOutlet = null;
let activePerfFilter = null; // 'top', 'low', atau null
let isHeatmapActive = false; // Status mode heatmap

// --- SISTEM KEAMANAN & AKSES PIN GATE ---
const CORRECT_PIN = "2026";

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
  const inputPin = document.getElementById('auth-pin-input');
  const errorMsg = document.getElementById('auth-error-msg');
  const authModal = document.getElementById('auth-modal');

  const handleLogin = () => {
    if (inputPin && inputPin.value === CORRECT_PIN) {
      sessionStorage.setItem('spotrevenue_auth', 'true');
      if (authModal) authModal.style.display = 'none';
      showToast('🔓 Akses Diberikan, Selamat Bekerja!');
    } else {
      if (errorMsg) errorMsg.style.display = 'block';
      if (inputPin) {
        inputPin.value = '';
        inputPin.focus();
      }
    }
  };

  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleLogin);
  }

  if (inputPin) {
    inputPin.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    setTimeout(() => inputPin.focus(), 100);
  }
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
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
  checkAppAuthentication();

  const sidebar = document.getElementById('sidebar');
  const triggerZone = document.getElementById('sidebar-trigger-zone');
  const btnPin = document.getElementById('btn-pin-sidebar');
  const btnReset = document.getElementById('btn-reset-db');

  // SWAP MODUL NAVIGATION
  const moduleBtns = document.querySelectorAll('.btn-module-nav');
  const modulePanes = document.querySelectorAll('.module-content-pane');

  moduleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetModulId = btn.getAttribute('data-modul');

      moduleBtns.forEach(b => b.classList.remove('active'));
      modulePanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetModulId);
      if (targetPane) targetPane.classList.add('active');
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
      showToast(sidebar.classList.contains('pinned') ? '📌 Sidebar Dikunci' : '🔓 Sidebar Auto-Collapse');
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

  // Tombol Toggle Heatmap
  const btnToggleHeat = document.getElementById('btn-toggle-heatmap');
  if (btnToggleHeat) {
    btnToggleHeat.addEventListener('click', () => {
      isHeatmapActive = !isHeatmapActive;
      btnToggleHeat.innerText = isHeatmapActive ? '📍 Matikan Heatmap (Kembali ke Marker)' : '🔥 Aktifkan Mode Heatmap Peta';
      btnToggleHeat.style.background = isHeatmapActive ? '#dc2626' : '#059669';
      
      applyFilters();
      showToast(isHeatmapActive ? '🔥 Mode Heatmap Peta Aktif' : '📍 Mode Marker Toko Aktif');
    });
  }

  // Tombol Quick Performance Filter (Top Tier vs Low Performer)
  const perfFilterBtns = document.querySelectorAll('.btn-perf-filter');
  perfFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const perfType = btn.getAttribute('data-perf');
      if (activePerfFilter === perfType) {
        activePerfFilter = null;
        btn.style.outline = 'none';
      } else {
        perfFilterBtns.forEach(b => b.style.outline = 'none');
        activePerfFilter = perfType;
        btn.style.outline = '2px solid #ffffff';
      }
      applyFilters();
    });
  });

  const metricButtons = document.querySelectorAll('.btn-metric');
  metricButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const metric = btn.getAttribute('data-metric');
      await switchActiveMetric(metric);
    });
  });

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

// LOGIKA PILIHAN BULAN & PRESETS TRIWULAN
function setupMonthFilterListeners() {
  const monthPills = document.querySelectorAll('.btn-month-pill');
  const presetBtns = document.querySelectorAll('.btn-preset');

  monthPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const m = pill.getAttribute('data-month');
      if (selectedMonths.includes(m)) {
        if (selectedMonths.length === 1) {
          showToast('⚠️ Minimal harus ada 1 bulan terpilih!');
          return;
        }
        selectedMonths = selectedMonths.filter(x => x !== m);
        pill.classList.remove('active');
      } else {
        selectedMonths.push(m);
        pill.classList.add('active');
      }
      
      presetBtns.forEach(p => p.classList.remove('active'));
      applyFilters();
    });
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      presetBtns.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      if (preset === 'all') {
        selectedMonths = [...ALL_MONTHS];
      } else if (preset === 'q1') {
        selectedMonths = ['JAN', 'FEB', 'MAR'];
      } else if (preset === 'q2') {
        selectedMonths = ['APR', 'MAY', 'JUN'];
      } else if (preset === 'q3') {
        selectedMonths = ['JUL', 'AUG', 'SEP'];
      } else if (preset === 'q4') {
        selectedMonths = ['OCT', 'NOV', 'DEC'];
      }

      monthPills.forEach(pill => {
        const m = pill.getAttribute('data-month');
        if (selectedMonths.includes(m)) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });

      applyFilters();
    });
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

async function switchActiveMetric(metric) {
  activeMetric = metric;
  window.activeMetric = metric;

  const metricButtons = document.querySelectorAll('.btn-metric');
  metricButtons.forEach(b => {
    if (b.getAttribute('data-metric') === metric) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
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
      resetFilterDropdowns();
      if (typeof renderOutletMarkers === 'function') {
        renderOutletMarkers([]);
      }
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

        showLoading(`Menyimpan ${outlets.length.toLocaleString('id-ID')} outlet ke IndexedDB...`);

        if (window.db && window.db[storeName]) {
          await window.db[storeName].clear();
          await window.db[storeName].bulkPut(outlets);
        }

        document.getElementById(statusId).innerText = `${outlets.length.toLocaleString('id-ID')} Outlet`;
        document.getElementById(labelId).classList.add('loaded');
        document.getElementById(labelId).innerText = '✅ Siap';

        hideLoading();
        showToast(`✅ Berhasil memuat ${outlets.length.toLocaleString('id-ID')} outlet ${metricKey.toUpperCase()}!`);

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
        statusEl.innerText = `${count.toLocaleString('id-ID')} Outlet`;
        if (labelEl) {
          labelEl.classList.add('loaded');
          labelEl.innerText = '✅ Siap';
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
  populateGenericSelect('select-tahun', 'tahun');

  populateGenericSelect('select-grup', 'groups');
  populateGenericSelect('select-brand', 'brands');
  populateGenericSelect('select-subbrand', 'subbrands');
  populateGenericSelect('select-subbrand-list', 'subbrand_lists');
}

function populateGenericSelect(elementId, fieldKey, formatterFn) {
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

  // Hitung ulang omset berdasarkan bulan terpilih
  filtered.forEach(item => {
    const metrics = getOutletMetrics(item);
    item.current_total = metrics.total;
    item.current_avg = metrics.avg;
  });

  // Terapkan Quick Performance Filter (Top Tier vs Low Performer) jika aktif
  if (activePerfFilter && filtered.length > 0) {
    // Urutkan berdasarkan total tertinggi ke terendah
    const sortedCopy = [...filtered].sort((a, b) => b.current_total - a.current_total);
    const thresholdIndex = Math.ceil(sortedCopy.length * 0.25); // Ambil kuartil atas (Top 25%)

    if (activePerfFilter === 'top') {
      const topIds = new Set(sortedCopy.slice(0, thresholdIndex).map(o => o.customer_number || o.id));
      filtered = filtered.filter(o => topIds.has(o.customer_number || o.id));
    } else if (activePerfFilter === 'low') {
      const lowIds = new Set(sortedCopy.slice(sortedCopy.length - thresholdIndex).map(o => o.customer_number || o.id));
      filtered = filtered.filter(o => lowIds.has(o.customer_number || o.id));
    }
  }

  // --- KALKULASI EXECUTIVE SUMMARY KPI ---
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

  // Update DOM KPI Bar
  const elKpiOutlet = document.getElementById('kpi-total-outlet');
  const elKpiOmset = document.getElementById('kpi-total-omset');
  const elKpiAvg = document.getElementById('kpi-avg-outlet');
  const elKpiKec = document.getElementById('kpi-top-kec');

  if (elKpiOutlet) elKpiOutlet.innerText = `${filtered.length.toLocaleString('id-ID')} Toko`;
  if (elKpiOmset) elKpiOmset.innerText = activeMetric === 'val' ? `Rp ${totalOmsetAll.toLocaleString('id-ID')}` : `${totalOmsetAll.toLocaleString('id-ID')} ${metricLabel}`;
  if (elKpiAvg) elKpiAvg.innerText = activeMetric === 'val' ? `Rp ${Math.round(avgPerOutlet).toLocaleString('id-ID')}` : `${Math.round(avgPerOutlet).toLocaleString('id-ID')} ${metricLabel}`;
  if (elKpiKec) elKpiKec.innerText = topKecName;

  // Render Peta (Marker atau Heatmap)
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
}

function showOutletDetail(outlet, autoSwitchTab = true) {
  selectedOutlet = outlet;

  if (autoSwitchTab) {
    const btnDetail = document.querySelector('.btn-module-nav[data-modul="modul-detail"]');
    if (btnDetail) btnDetail.click();
  }

  const card = document.getElementById('outlet-detail-card');
  if (!card) return;

  const custCode = outlet.customer_number || outlet.id || '-';
  const metrics = getOutletMetrics(outlet);

  card.style.display = 'block';
  document.getElementById('outlet-nama').innerHTML = `
    <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M10 12h4"/></svg>
    ${outlet.name}
  `;
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
}

function updateCoordDisplay(lat, lng) {
  document.getElementById('val-lat').innerText = parseFloat(lat).toFixed(6);
  document.getElementById('val-lng').innerText = parseFloat(lng).toFixed(6);
}