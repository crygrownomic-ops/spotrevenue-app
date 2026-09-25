// Inisialisasi Database Dexie.js (IndexedDB)
const db = new Dexie("PetaLokalkuFullDB");

db.version(1).stores({
  provinsi: 'code, name',
  kabupaten: 'code, province_code, name',
  kecamatan: 'code, regency_code, name',
  kelurahan: 'code, district_code, name'
});

const API_BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";