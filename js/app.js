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

// 1. Load Semua Provinsi
async function loadProvinsi() {
  let list = await db.provinsi.toArray();
  if (list.length === 0) {
    showLoading("Mengunduh daftar 38 Provinsi Indonesia...");
    try {
      const res = await fetch(`${API_BASE}/provinces.json`);
      const data = await res.json();
      const formatted = data.map(item => ({ code: item.id, name: item.name }));
      await db.provinsi.bulkAdd(formatted);
      list = formatted;
      showToast("Daftar Provinsi disimpan ke database lokal!");
    } catch (err) {
      alert("Gagal mengunduh data provinsi.");
    } finally {
      hideLoading();
    }
  }

  elProv.innerHTML = '<option value="">-- Pilih Provinsi --</option>';
  list.sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
    elProv.innerHTML += `<option value="${p.code}">${p.name}</option>`;
  });
}

// 2. Event Handlers Cascading Dropdown
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
    const provObj = await db.provinsi.get(provCode);
    showLoading(`Mengunduh Kabupaten/Kota untuk ${provObj.name}...`);
    try {
      const res = await fetch(`${API_BASE}/regencies/${provCode}.json`);
      const data = await res.json();
      const formatted = data.map(item => ({ code: item.id, province_code: item.province_id, name: item.name }));
      await db.kabupaten.bulkAdd(formatted);
      list = formatted;
      showToast(`Data Kabupaten/Kota disalin ke lokal!`);
    } catch (err) {
      alert("Gagal mengunduh data kabupaten.");
    } finally {
      hideLoading();
    }
  }

  list.sort((a,b) => a.name.localeCompare(b.name)).forEach(k => {
    elKab.innerHTML += `<option value="${k.code}">${k.name}</option>`;
  });
});

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
    showLoading(`Mengunduh Kecamatan untuk ${kabObj.name}...`);
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

elKec.addEventListener('change', async () => {
  const kecCode = elKec.value;
  elKel.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  elKel.disabled = !kecCode;

  if (!kecCode) return;

  let list = await db.kelurahan.where('district_code').equals(kecCode).toArray();
  if (list.length === 0) {
    const kecObj = await db.kecamatan.get(kecCode);
    showLoading(`Mengunduh Kelurahan untuk ${kecObj.name}...`);
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

elKel.addEventListener('change', async () => {
  const kelCode = elKel.value;
  if (!kelCode) return;

  const kelData = await db.kelurahan.get(kelCode);
  const kecData = await db.kecamatan.get(elKec.value);
  const kabData = await db.kabupaten.get(elKab.value);
  const provData = await db.provinsi.get(elProv.value);

  if (kelData) {
    document.getElementById('info-panel').style.display = 'block';
    document.getElementById('info-nama').innerText = `${kelData.name}`;
    document.getElementById('info-kode').innerHTML = `
      <b>Kode Wilayah:</b> ${kelData.code}<br>
      <b>Kecamatan:</b> ${kecData ? kecData.name : '-'}<br>
      <b>Kab/Kota:</b> ${kabData ? kabData.name : '-'}<br>
      <b>Provinsi:</b> ${provData ? provData.name : '-'}
    `;
  }
});

// Jalankan saat pertama dibuka
loadProvinsi();