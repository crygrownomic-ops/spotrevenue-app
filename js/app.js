/* ==============================================================================
   SpotRevenue Application Controller v1.6 (Month Filter, Average & Salesman Code)
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

// FUNGSI KALKULASI REKALKULASI OMSET TERPILIH & AVERAGE
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

async function loadMetricDataToMap(metric) {
  const storeName = `outlets_${metric}`;
  if (window.db && window.db[storeName]) {
    const count = await window.db[storeName].count();
    if (count > 0) {
      activeOutletData = await window.db[storeName].toArray();
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
    'select-kabupaten', 'select-kecamatan', 'select-rayon', 'select-class', 'select-tipe', 'select-jenis',
    'select-divisi-sales', 'select-category-sales', 'select-salesperson', 'select-tahun',
    'select-grup', 'select-brand', 'select-subbrand', 'select-subbrand-list'
  ];

  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => applyFilters());
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

  if (typeof renderOutletMarkers === 'function') {
    renderOutletMarkers(filtered);
  }

  if (selectedOutlet) {
    showOutletDetail(selectedOutlet);
  }
}

function showOutletDetail(outlet) {
  selectedOutlet = outlet;
  const btnDetail = document.querySelector('.btn-module-nav[data-modul="modul-detail"]');
  if (btnDetail) btnDetail.click();

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

  // RENDERING KODE SALESMAN
  const salesmanVal = Array.isArray(outlet.salespersons) && outlet.salespersons.length > 0 
    ? outlet.salespersons.join(', ') 
    : (outlet.salespersons || '-');
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