// Data 38 Provinsi Indonesia (Langsung siap pakai di memori lokal)
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

// Helper Loading & Toast
function showLoading(text) {
  document.getElementById('loading-msg').innerText = text;
  document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// DOM Elements
const elProv = document.getElementById('select-provinsi');
const elKab = document.getElementById('select-kabupaten');
const elKec = document.getElementById('select-kecamatan');
const elKel = document.getElementById('select-kelurahan');

// 1. Render Langsung Opsi Provinsi Ke Dropdown
function loadProvinsi() {
  elProv.innerHTML = '<option value="">-- Pilih Provinsi --</option>';
  DEFAULT_PROVINSI.forEach(p => {
    elProv.innerHTML += `<option value="${p.code}">${p.name}</option>`;
  });

  // Simpan ke IndexedDB di background agar terhubung dengan sistem lokal
  db.provinsi.bulkPut(DEFAULT_PROVINSI).catch(err => console.log("Init DB:", err));
}

// 2. Event Handlers Cascading Dropdown (Kabupaten)
elProv.addEventListener('change', async () => {
  const provCode = elProv.value;
  elKab.innerHTML = '<option value="">-- Pilih Kabupaten/Kota --</option>';
  elKec.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  elKel.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  elKab.disabled = !provCode;
  elKec.disabled = true;
  elKel.disabled = true;

  if (!provCode) return;

  let list = await db.kabupaten.where('province_code').equals(provCode).toArray();
  if (list.length === 0) {
    const provObj = DEFAULT_PROVINSI.find(p => p.code === provCode);
    showLoading(`Mengunduh Kabupaten/Kota untuk ${provObj ? provObj.name : 'Provinsi'}...`);
    try {
      const res = await fetch(`${API_BASE}/regencies/${provCode}.json`);
      const data = await res.json();
      const formatted = data.map(item => ({ code: item.id, province_code: item.province_id, name: item.name }));
      await db.kabupaten.bulkAdd(formatted);
      list = formatted;
      showToast(`Data Kabupaten/Kota disalin ke lokal!`);
    } catch (err) {
      alert("Gagal mengunduh data kabupaten. Periksa koneksi internet.");
    } finally {
      hideLoading();
    }
  }

  list.sort((a,b) => a.name.localeCompare(b.name)).forEach(k => {
    elKab.innerHTML += `<option value="${k.code}">${k.name}</option>`;
  });
});

// 3. Event Handlers Cascading Dropdown (Kecamatan)
elKab.addEventListener('change', async () => {
  const kabCode = elKab.value;
  elKec.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  elKel.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  elKec.disabled = !kabCode;
  elKel.disabled = true;

  if (!kabCode) return;

  let list = await db.kecamatan.where('regency_code').equals(kabCode).toArray();
  if (list.length === 0) {
    const kabObj = await db.kabupaten.get(kabCode);
    showLoading(`Mengunduh Kecamatan untuk ${kabObj ? kabObj.name : 'Kabupaten'}...`);
    try {
      const res = await fetch(`${API_BASE}/districts/${kabCode}.json`);
      const data = await res.json();
      const formatted = data.map(item => ({ code: item.id, regency_code: item.regency_id, name: item.name }));
      await db.kecamatan.bulkAdd(formatted);
      list = formatted;
      showToast(`Data Kecamatan disalin ke lokal!`);
    } catch (err) {
      alert("Gagal mengunduh data kecamatan.");
    } finally {
      hideLoading();
    }
  }

  list.sort((a,b) => a.name.localeCompare(b.name)).forEach(k => {
    elKec.innerHTML += `<option value="${k.code}">${k.name}</option>`;
  });
});

// 4. Event Handlers Cascading Dropdown (Kelurahan)
elKec.addEventListener('change', async () => {
  const kecCode = elKec.value;
  elKel.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  elKel.disabled = !kecCode;

  if (!kecCode) return;

  let list = await db.kelurahan.where('district_code').equals(kecCode).toArray();
  if (list.length === 0) {
    const kecObj = await db.kecamatan.get(kecCode);
    showLoading(`Mengunduh Kelurahan untuk ${kecObj ? kecObj.name : 'Kecamatan'}...`);
    try {
      const res = await fetch(`${API_BASE}/villages/${kecCode}.json`);
      const data = await res.json();
      const formatted = data.map(item => ({ code: item.id, district_code: item.district_id, name: item.name }));
      await db.kelurahan.bulkAdd(formatted);
      list = formatted;
      showToast(`Data Kelurahan disalin ke lokal!`);
    } catch (err) {
      alert("Gagal mengunduh data kelurahan.");
    } finally {
      hideLoading();
    }
  }

  list.sort((a,b) => a.name.localeCompare(b.name)).forEach(k => {
    elKel.innerHTML += `<option value="${k.code}">${k.name}</option>`;
  });
});

// 5. Pilih Kelurahan -> Gerakkan Peta ke Lokasi
elKel.addEventListener('change', async () => {
  const kelCode = elKel.value;
  if (!kelCode) return;

  const kelData = await db.kelurahan.get(kelCode);
  const kecData = await db.kecamatan.get(elKec.value);
  const kabData = await db.kabupaten.get(elKab.value);
  const provObj = DEFAULT_PROVINSI.find(p => p.code === elProv.value);

  if (kelData) {
    document.getElementById('info-panel').style.display = 'block';
    document.getElementById('info-nama').innerText = `${kelData.name}`;
    document.getElementById('info-kode').innerHTML = `
      <b>Kode Wilayah:</b> ${kelData.code}<br>
      <b>Kecamatan:</b> ${kecData ? kecData.name : '-'}<br>
      <b>Kab/Kota:</b> ${kabData ? kabData.name : '-'}<br>
      <b>Provinsi:</b> ${provObj ? provObj.name : '-'}
    `;

    // Cari koordinat lokasi via OpenStreetMap Nominatim API
    const searchQuery = `${kelData.name}, ${kecData ? kecData.name : ''}, ${kabData ? kabData.name : ''}, Indonesia`;
    showLoading(`Mencari titik lokasi ${kelData.name}...`);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const results = await res.json();

      if (results && results.length > 0) {
        const top = results[0];
        moveMapTo(top.lat, top.lon, 14, kelData.name, `${kecData ? kecData.name : ''}, ${kabData ? kabData.name : ''}`);
        showToast(`Peta meluncur ke ${kelData.name}!`);
      } else if (kecData) {
        const fallbackQuery = `${kecData.name}, ${kabData ? kabData.name : ''}, Indonesia`;
        const resFb = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}`);
        const resultsFb = await resFb.json();
        if (resultsFb && resultsFb.length > 0) {
          moveMapTo(resultsFb[0].lat, resultsFb[0].lon, 12, kecData.name, kabData ? kabData.name : '');
          showToast(`Mengarahkan ke area ${kecData.name}`);
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      hideLoading();
    }
  }
});

// Jalankan langsung saat script dibaca
loadProvinsi();