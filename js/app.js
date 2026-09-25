/* ==============================================================================
   SpotRevenue Application Controller (Multi-Metric Switcher & Hover Handling)
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

const API_BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api';

const DEFAULT_PROVINSI = [
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
  { code: "61", name: "KALIMANTAN BARAT" },
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

let activeMetric = 'val'; // Default 'val', 'box', atau 'uom'
let activeOutletData = [];

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
  
  // 1. AUTO-HOVER SLIDE IN / OUT SIDEBAR LOGIC
  if (triggerZone) {
    triggerZone.addEventListener('mouseenter', () => {
      sidebar.classList.add('sidebar-expanded');
    });
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

  // 2. SWITCHER METRIK AKTIF (VAL, BOX, UOM)
  const metricButtons = document.querySelectorAll('.btn-metric');
  metricButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const metric = btn.getAttribute('data-metric');
      if (metric === activeMetric) return;

      metricButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMetric = metric;

      await loadMetricDataToMap(activeMetric);
    });
  });

  // 3. SETUP LISTENER UPLOAD METRIK DATASET
  setupUploadListener('input-val', 'outlets_val', 'status-val', 'label-val', 'val');
  setupUploadListener('input-box', 'outlets_box', 'status-box', 'label-box', 'box');
  setupUploadListener('input-uom', 'outlets_uom', 'status-uom', 'label-uom', 'uom');

  // 4. INISIALISASI
  initProvinsiDropdown();
  await updateAllMetricStatuses();
  await loadMetricDataToMap(activeMetric);
});

// MEMUAT METRIK TERPILIH KE PETA
async function loadMetricDataToMap(metric) {
  const storeName = `outlets_${metric}`;
  if (window.db && window.db[storeName]) {
    const count = await window.db[storeName].count();
    if (count > 0) {
      activeOutletData = await window.db[storeName].toArray();
      renderOutletMarkers(activeOutletData);
      
      const unitLabel = metric === 'val' ? 'Rp Value' : (metric === 'box' ? 'Karton Box' : 'Unit UOM');
      showToast(`Menampilkan ${count.toLocaleString('id-ID')} outlet [${unitLabel}]`);
    } else {
      renderOutletMarkers([]);
      showToast(`Belum ada data terimpor untuk metrik ${metric.toUpperCase()}`);
    }
  }
}

// HANDLER PROSES IMPOR DATASET JSON
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

        if (activeMetric === metricKey) {
          await loadMetricDataToMap(metricKey);
        }

        hideLoading();
        showToast(`✅ Berhasil memuat ${outlets.length.toLocaleString('id-ID')} outlet ${metricKey.toUpperCase()}!`);

      } catch (err) {
        alert("Gagal membaca file JSON: " + err.message);
        hideLoading();
      }
    };

    reader.readAsText(file);
  });
}

// UPDATE STATUS JUMLAH OUTLET TERSEDIA DI BUTTON SWITCHER
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

// INIT DROPDOWN PROVINSI
function initProvinsiDropdown() {
  const elProv = document.getElementById('select-provinsi');
  if (!elProv) return;

  let html = '<option value="">-- Pilih Provinsi --</option>';
  DEFAULT_PROVINSI.forEach(p => {
    html += `<option value="${p.code}">${p.name}</option>`;
  });
  elProv.innerHTML = html;
}

// PANEL DETAIL OUTLET TERPILIH
function showOutletDetail(outlet) {
  const card = document.getElementById('outlet-detail-card');
  if (!card) return;

  card.style.display = 'block';
  document.getElementById('outlet-nama').innerHTML = `
    <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M10 12h4"/></svg>
    ${outlet.name}
  `;
  document.getElementById('outlet-id').innerText = `ID: ${outlet.id}`;
  document.getElementById('outlet-alamat').innerText = outlet.address || 'Alamat tidak tersedia';
  document.getElementById('outlet-kodya').innerText = outlet.kodya || '-';
  document.getElementById('outlet-kecamatan').innerText = outlet.kecamatan || '-';
  document.getElementById('outlet-kelas').innerText = outlet.class || '-';
  document.getElementById('outlet-tipe').innerText = outlet.tipe || '-';

  const labelEl = document.getElementById('active-metric-label');
  const valEl = document.getElementById('outlet-omset');

  if (activeMetric === 'val') {
    labelEl.innerText = 'Total Value Penjualan:';
    valEl.innerText = `Rp ${outlet.total_sales.toLocaleString('id-ID')}`;
  } else if (activeMetric === 'box') {
    labelEl.innerText = 'Total Volume (BOX):';
    valEl.innerText = `${outlet.total_sales.toLocaleString('id-ID')} Karton`;
  } else {
    labelEl.innerText = 'Total Kuantitas (UOM):';
    valEl.innerText = `${outlet.total_sales.toLocaleString('id-ID')} Unit`;
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

// UPDATE KOORDINAT DI PANEL
function updateCoordDisplay(lat, lng) {
  document.getElementById('val-lat').innerText = parseFloat(lat).toFixed(6);
  document.getElementById('val-lng').innerText = parseFloat(lng).toFixed(6);
}