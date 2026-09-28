/**
 * SpotRevenue - Main Application Entry Point & Data Pipeline (FIXED)
 */

window.masterData = { val: [], box: [], uom: [] };
window.currentMetric = 'val';
window.currentCalcMode = 'total';
window.currentMonthRange = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
window.lastFilteredOutlets = [];
window.selectedOutlet = null;

const ALL_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// 1. DEDUPLIKASI SINGLE COUNTING
function aggregateOutletsSingleCounting(rawArray) {
  if (!Array.isArray(rawArray)) return [];
  const map = new Map();

  rawArray.forEach((item, idx) => {
    const rawCustNo = String(item.customer_number || item.cust_no || item.id || `${item.name || item.nama || ''}_${item.address || item.alamat || ''}`).trim();
    const key = rawCustNo.toUpperCase();

    let itemSalesmen = [];
    if (Array.isArray(item.salespersons)) {
      itemSalesmen = item.salespersons.map(s => String(s).trim()).filter(Boolean);
    } else if (Array.isArray(item.salesperson)) {
      itemSalesmen = item.salesperson.map(s => String(s).trim()).filter(Boolean);
    } else if (item.salesperson || item.salesman || item.sales) {
      itemSalesmen = [String(item.salesperson || item.salesman || item.sales).trim()];
    }

    const itemMonthly = {};
    ALL_MONTHS.forEach(m => {
      const val = item.monthly_sales?.[m] ?? item[m] ?? 0;
      itemMonthly[m] = typeof val === 'number' ? (isNaN(val) ? 0 : val) : (parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0);
    });

    const itemTotalSales = item.total_sales ?? item.total_value ?? item.omset ?? item.omzet ?? item.total ?? item.amount ?? 0;
    const cleanTotalSales = typeof itemTotalSales === 'number' ? (isNaN(itemTotalSales) ? 0 : itemTotalSales) : (parseFloat(String(itemTotalSales).replace(/[^0-9.-]/g, '')) || 0);

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        id: item.id ? String(item.id) : String(idx + 1),
        customer_number: item.customer_number || item.cust_no || item.id || '-',
        name: item.name || item.nama || 'Tanpa Nama',
        salespersons: [...new Set(itemSalesmen)],
        monthly_sales: { ...itemMonthly },
        total_sales: cleanTotalSales > 0 ? cleanTotalSales : Object.values(itemMonthly).reduce((a, b) => a + b, 0),
        top_brands: Array.isArray(item.top_brands) ? JSON.parse(JSON.stringify(item.top_brands)) : []
      });
    } else {
      const existing = map.get(key);

      itemSalesmen.forEach(s => {
        if (!existing.salespersons.includes(s)) existing.salespersons.push(s);
      });

      ALL_MONTHS.forEach(m => {
        existing.monthly_sales[m] = (existing.monthly_sales[m] || 0) + (itemMonthly[m] || 0);
      });

      existing.total_sales += (cleanTotalSales > 0 ? cleanTotalSales : Object.values(itemMonthly).reduce((a, b) => a + b, 0));

      if (Array.isArray(item.top_brands)) {
        item.top_brands.forEach(tb => {
          const exTb = existing.top_brands.find(b => b.brand === tb.brand);
          if (exTb) {
            exTb.sales = (exTb.sales || 0) + (tb.sales || 0);
          } else {
            existing.top_brands.push({ ...tb });
          }
        });
      }
    }
  });

  return Array.from(map.values());
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.setupAuthSystem === 'function') window.setupAuthSystem();
  if (typeof window.setupSidebarPin === 'function') window.setupSidebarPin();
  if (typeof window.setupModuleNavigation === 'function') window.setupModuleNavigation();
  setupFloatingWidgets();
  setupGlobalSearchEngine();
  setupCatchmentRadiusListener();

  if (typeof window.initMap === 'function') window.initMap();

  await loadDataFromIndexedDB();

  setupFileUploadListener('input-val', 'outlets_val', 'status-val', 'label-val');
  setupFileUploadListener('input-box', 'outlets_box', 'status-box', 'label-box');
  setupFileUploadListener('input-uom', 'outlets_uom', 'status-uom', 'label-uom');

  populateMonthDropdowns();
  setupDashboardFilterSync();

  // Bind listener dropdown filter (KECUALI catchment radius)
  const allSelects = document.querySelectorAll('select:not(#select-buffer-radius)');
  allSelects.forEach(sel => {
    sel.addEventListener('change', () => triggerGlobalFilterPipeline());
  });
});

function populateMonthDropdowns() {
  const monthSelects = ['float-select-bulan-awal', 'float-select-bulan-akhir', 'dash-select-bulan-awal', 'dash-select-bulan-akhir'];
  monthSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isEnd = id.includes('akhir');
    const defaultVal = isEnd ? 'DEC' : 'JAN';
    
    el.innerHTML = '';
    ALL_MONTHS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === defaultVal) opt.selected = true;
      el.appendChild(opt);
    });
  });
}

function setupDashboardFilterSync() {
  const dashMode = document.getElementById('dash-select-calc-mode');
  const floatMode = document.getElementById('float-select-calc-mode');
  const dashAwal = document.getElementById('dash-select-bulan-awal');
  const floatAwal = document.getElementById('float-select-bulan-awal');
  const dashAkhir = document.getElementById('dash-select-bulan-akhir');
  const floatAkhir = document.getElementById('float-select-bulan-akhir');
  const dashTahun = document.getElementById('dash-select-tahun');
  const selectTahun = document.getElementById('select-tahun');

  if (dashMode && floatMode) {
    dashMode.addEventListener('change', () => { floatMode.value = dashMode.value; triggerGlobalFilterPipeline(); });
    floatMode.addEventListener('change', () => { dashMode.value = floatMode.value; triggerGlobalFilterPipeline(); });
  }

  if (dashAwal && floatAwal) {
    dashAwal.addEventListener('change', () => { floatAwal.value = dashAwal.value; triggerGlobalFilterPipeline(); });
    floatAwal.addEventListener('change', () => { dashAwal.value = floatAwal.value; triggerGlobalFilterPipeline(); });
  }

  if (dashAkhir && floatAkhir) {
    dashAkhir.addEventListener('change', () => { floatAkhir.value = dashAkhir.value; triggerGlobalFilterPipeline(); });
    floatAkhir.addEventListener('change', () => { dashAkhir.value = floatAkhir.value; triggerGlobalFilterPipeline(); });
  }

  if (dashTahun && selectTahun) {
    dashTahun.addEventListener('change', () => { selectTahun.value = dashTahun.value; triggerGlobalFilterPipeline(); });
    selectTahun.addEventListener('change', () => { dashTahun.value = selectTahun.value; triggerGlobalFilterPipeline(); });
  }
}

async function loadDataFromIndexedDB() {
  if (!window.db) return;
  try {
    const rawVal = await window.db.outlets_val.toArray();
    const rawBox = await window.db.outlets_box.toArray();
    const rawUom = await window.db.outlets_uom.toArray();

    window.masterData.val = aggregateOutletsSingleCounting(rawVal);
    window.masterData.box = aggregateOutletsSingleCounting(rawBox);
    window.masterData.uom = aggregateOutletsSingleCounting(rawUom);

    if (window.masterData.val.length > 0) window.currentMetric = 'val';
    else if (window.masterData.box.length > 0) window.currentMetric = 'box';
    else if (window.masterData.uom.length > 0) window.currentMetric = 'uom';

    updateUploadButtonStatus();
    populateDropdownFilters();
    triggerGlobalFilterPipeline();
  } catch (err) {
    console.warn("Gagal membaca memori IndexedDB:", err);
  }
}

function setupFileUploadListener(inputId, tableName, statusId, labelId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;

  inputEl.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let rawContent = event.target.result;
      if (rawContent.charCodeAt(0) === 0xFEFF) rawContent = rawContent.slice(1);
      rawContent = rawContent.replace(/:\s*NaN\b/g, ': 0').replace(/:\s*undefined\b/g, ': null');

      let jsonData;
      try { jsonData = JSON.parse(rawContent); } catch (pErr) { alert(`Format JSON ${file.name} tidak valid.`); return; }

      let dataArray = Array.isArray(jsonData) ? jsonData : Object.values(jsonData)[0];
      if (!Array.isArray(dataArray)) return;

      const cleanAggregatedData = aggregateOutletsSingleCounting(dataArray);

      if (window.db && window.db[tableName]) {
        await window.db[tableName].clear();
        await window.db[tableName].bulkAdd(cleanAggregatedData);
      }

      const metricKey = tableName.replace('outlets_', '');
      window.masterData[metricKey] = cleanAggregatedData;
      window.currentMetric = metricKey;

      updateUploadButtonStatus();
      populateDropdownFilters();
      triggerGlobalFilterPipeline();

      alert(`Berhasil! Data ${metricKey.toUpperCase()} tersimpan (${cleanAggregatedData.length.toLocaleString('id-ID')} toko).`);
    };
    reader.readAsText(file, 'UTF-8');
  });
}

function updateUploadButtonStatus() {
  ['val', 'box', 'uom'].forEach(key => {
    const statusEl = document.getElementById(`status-${key}`);
    const labelEl = document.getElementById(`label-${key}`);
    if (statusEl && labelEl) {
      const count = window.masterData[key].length;
      statusEl.innerText = count > 0 ? `${count} Data` : 'Belum Ada';
      if (labelEl) labelEl.classList.toggle('loaded', count > 0);
    }
  });
}

function populateDropdownFilters() {
  const dataset = window.masterData[window.currentMetric] || [];
  if (dataset.length === 0) return;

  const getUniqueNormalized = (key) => {
    const set = new Set();
    dataset.forEach(item => {
      const val = item[key];
      if (Array.isArray(val)) {
        val.forEach(v => { if (v) set.add(String(v).trim().toUpperCase()); });
      } else if (val) {
        set.add(String(val).trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  };

  fillDropdownOptions('select-provinsi', getUniqueNormalized('provinsi'));
  fillDropdownOptions('select-kabupaten', getUniqueNormalized('kabupaten'));
  fillDropdownOptions('select-kecamatan', getUniqueNormalized('kecamatan'));
  fillDropdownOptions('select-rayon', getUniqueNormalized('rayon'));
  fillDropdownOptions('select-class', getUniqueNormalized('class'));
  fillDropdownOptions('select-tipe', getUniqueNormalized('tipe'));
  fillDropdownOptions('select-jenis', getUniqueNormalized('jenis'));
  fillDropdownOptions('select-divisi-sales', getUniqueNormalized('divisi_sales'));
  fillDropdownOptions('select-category-sales', getUniqueNormalized('category_sales'));
  fillDropdownOptions('select-salesperson', getUniqueNormalized('salesperson'));
  
  const yearList = getUniqueNormalized('tahun');
  fillDropdownOptions('select-tahun', yearList);
  fillDropdownOptions('dash-select-tahun', yearList);

  fillDropdownOptions('select-grup', getUniqueNormalized('grup'));
  fillDropdownOptions('select-brand', getUniqueNormalized('brand'));
  fillDropdownOptions('select-subbrand', getUniqueNormalized('subbrand'));
}

function fillDropdownOptions(selectId, optionsList) {
  const selectEl = document.getElementById(selectId);
  if (!selectEl) return;
  const currentVal = selectEl.value;
  selectEl.innerHTML = `<option value="">-- Semua ${selectId.replace('select-', '').replace('dash-', '').toUpperCase()} --</option>`;
  optionsList.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    selectEl.appendChild(option);
  });
  selectEl.disabled = false;
  selectEl.value = currentVal;
}

function getActiveMonthRange() {
  const startEl = document.getElementById('dash-select-bulan-awal')?.value || document.getElementById('float-select-bulan-awal')?.value || 'JAN';
  const endEl = document.getElementById('dash-select-bulan-akhir')?.value || document.getElementById('float-select-bulan-akhir')?.value || 'DEC';

  const s = ALL_MONTHS.indexOf(startEl.toUpperCase());
  const e = ALL_MONTHS.indexOf(endEl.toUpperCase());

  const start = s !== -1 ? s : 0;
  const end = e !== -1 ? e : 11;

  return start <= end ? ALL_MONTHS.slice(start, end + 1) : ALL_MONTHS.slice(end, start + 1);
}

// 2. PIPELINE FILTER & SYNC DASHBOARD
function triggerGlobalFilterPipeline() {
  let dataset = [...(window.masterData[window.currentMetric] || [])];

  const getVal = (id) => (document.getElementById(id)?.value || '').toUpperCase().trim();

  const matchesFilter = (itemVal, targetVal) => {
    if (!targetVal) return true;
    if (Array.isArray(itemVal)) return itemVal.some(v => String(v || '').toUpperCase().trim() === targetVal);
    return String(itemVal || '').toUpperCase().trim() === targetVal;
  };

  const activeMonths = getActiveMonthRange();
  window.currentMonthRange = activeMonths;

  const modeEl = getVal('dash-select-calc-mode') || getVal('float-select-calc-mode') || 'TOTAL';
  window.currentCalcMode = modeEl.toLowerCase();

  const prov = getVal('select-provinsi');
  const kab = getVal('select-kabupaten');
  const kec = getVal('select-kecamatan');
  const rayon = getVal('select-rayon');
  const cls = getVal('select-class');
  const tipe = getVal('select-tipe');
  const jenis = getVal('select-jenis');
  const sales = getVal('select-salesperson');
  const brand = getVal('select-brand');
  const thn = getVal('dash-select-tahun') || getVal('select-tahun');

  if (prov) dataset = dataset.filter(i => matchesFilter(i.provinsi, prov));
  if (kab) dataset = dataset.filter(i => matchesFilter(i.kabupaten || i.kodya, kab));
  if (kec) dataset = dataset.filter(i => matchesFilter(i.kecamatan, kec));
  if (rayon) dataset = dataset.filter(i => matchesFilter(i.rayon, rayon));
  if (cls) dataset = dataset.filter(i => matchesFilter(i.class, cls));
  if (tipe) dataset = dataset.filter(i => matchesFilter(i.tipe, tipe));
  if (jenis) dataset = dataset.filter(i => matchesFilter(i.jenis, jenis));
  if (sales) dataset = dataset.filter(i => matchesFilter(i.salespersons || i.salesperson, sales));
  if (brand) dataset = dataset.filter(i => matchesFilter(i.brands || i.brand, brand));
  if (thn) dataset = dataset.filter(i => matchesFilter(i.tahun, thn));

  const processedOutlets = dataset.map(item => {
    let rangeSum = 0;
    if (item.monthly_sales && typeof item.monthly_sales === 'object') {
      activeMonths.forEach(m => rangeSum += (item.monthly_sales[m] || 0));
    } else {
      rangeSum = item.total_sales || 0;
    }

    const calculatedValue = window.currentCalcMode === 'avg' 
      ? (activeMonths.length > 0 ? (rangeSum / activeMonths.length) : 0)
      : rangeSum;

    return {
      ...item,
      calculated_sales: calculatedValue,
      range_total_sales: rangeSum
    };
  });

  window.lastFilteredOutlets = processedOutlets;
  const totalOmset = processedOutlets.reduce((sum, item) => sum + (item.calculated_sales || 0), 0);
  window.currentTotalOmset = totalOmset;

  // Render ulang marker peta & dashboard
  if (typeof window.renderMapMarkers === 'function') window.renderMapMarkers(processedOutlets);
  if (typeof window.updateDashboardAnalytics === 'function') window.updateDashboardAnalytics(processedOutlets, totalOmset);
}

// 3. FIX SEARCH ENGINE (TIDAK MENGHILANGKAN TOKO LAIN)
function setupGlobalSearchEngine() {
  const searchInput = document.getElementById('global-search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  if (!searchInput || !suggestionsBox) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toUpperCase();
    if (query.length < 1) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const currentDataset = window.lastFilteredOutlets || window.masterData[window.currentMetric] || [];
    const matches = currentDataset.filter(i => {
      const name = String(i.name || i.nama || '').toUpperCase();
      const code = String(i.customer_number || i.cust_no || i.id || '').toUpperCase();
      return name.includes(query) || code.includes(query);
    });

    if (matches.length === 0) {
      suggestionsBox.innerHTML = '<div style="padding:10px 14px; color:#cbd5e1; font-size:11px;">Toko tidak ditemukan...</div>';
      suggestionsBox.style.display = 'block';
      return;
    }

    let html = '';
    matches.slice(0, 15).forEach(ot => {
      const code = ot.customer_number || ot.cust_no || ot.id || '-';
      const name = ot.name || ot.nama || 'Tanpa Nama';
      html += `<div class="suggestion-item" data-code="${code}"><b style="color:#f59e0b;">${name}</b> (${code})</div>`;
    });

    suggestionsBox.innerHTML = html;
    suggestionsBox.style.display = 'block';

    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const itemCode = item.getAttribute('data-code');
        const selectedOt = matches.find(m => String(m.customer_number || m.cust_no || m.id) === itemCode);

        if (selectedOt) {
          searchInput.value = selectedOt.name || itemCode;
          suggestionsBox.style.display = 'none';

          // Fokus Peta ke Toko Terpilih tanpa Menghilangkan Toko Lain
          window.selectedOutlet = selectedOt;
          const lat = parseFloat(selectedOt.lat || selectedOt.latitude);
          const lng = parseFloat(selectedOt.lng || selectedOt.longitude);

          if (window.map && !isNaN(lat) && !isNaN(lng)) {
            window.map.flyTo([lat, lng], 16, { duration: 1.2 });
          }

          if (typeof window.drawBufferRadius === 'function') {
            const radiusInput = document.getElementById('select-buffer-radius')?.value || 1000;
            if (parseFloat(radiusInput) > 0) {
              window.drawBufferRadius(selectedOt, parseFloat(radiusInput) / 1000);
            }
          }
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

// 4. FIX CATCHMENT RADIUS (TIDAK MERESET HALAMAN PETA)
function setupCatchmentRadiusListener() {
  const radiusSelect = document.getElementById('select-buffer-radius');
  if (!radiusSelect) return;

  radiusSelect.addEventListener('change', (e) => {
    const radiusMeters = parseFloat(e.target.value) || 0;
    
    if (!window.selectedOutlet) {
      const infoEl = document.getElementById('buffer-analysis-result');
      if (infoEl) infoEl.innerHTML = '<span style="color:#f59e0b;">Pilih/klik salah satu toko pada peta terlebih dahulu!</span>';
      return;
    }

    if (radiusMeters <= 0) {
      if (window.bufferGroup) window.bufferGroup.clearLayers();
      const infoEl = document.getElementById('buffer-analysis-result');
      if (infoEl) infoEl.innerText = 'Radius dinonaktifkan.';
    } else {
      if (typeof window.drawBufferRadius === 'function') {
        window.drawBufferRadius(window.selectedOutlet, radiusMeters / 1000);
      }
    }
  });
}

function setupFloatingWidgets() {
  const btnMonth = document.getElementById('btn-toggle-float-month');
  const cardMonth = document.getElementById('floating-month-card');
  const btnLegend = document.getElementById('btn-toggle-float-legend');
  const cardLegend = document.getElementById('floating-legend-card');

  if (btnMonth && cardMonth) {
    btnMonth.addEventListener('click', () => {
      cardMonth.style.display = cardMonth.style.display === 'block' ? 'none' : 'block';
      if (cardLegend) cardLegend.style.display = 'none';
    });
  }

  if (btnLegend && cardLegend) {
    btnLegend.addEventListener('click', () => {
      cardLegend.style.display = cardLegend.style.display === 'block' ? 'none' : 'block';
      if (cardMonth) cardMonth.style.display = 'none';
    });
  }
}

function formatMetricValue(value, metricKey = window.currentMetric) {
  const val = value || 0;
  const isAvg = window.currentCalcMode === 'avg';
  const prefix = isAvg ? 'AVG ' : '';

  if (metricKey === 'val') return `${prefix}Rp ${Math.round(val).toLocaleString('id-ID')}`;
  if (metricKey === 'box') return `${prefix}${Math.round(val).toLocaleString('id-ID')} Box`;
  if (metricKey === 'uom') return `${prefix}${Math.round(val).toLocaleString('id-ID')} UOM`;
  return `${prefix}${Math.round(val).toLocaleString('id-ID')}`;
}

window.triggerGlobalFilterPipeline = triggerGlobalFilterPipeline;
window.formatMetricValue = formatMetricValue;