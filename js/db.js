// Inisialisasi Database Dexie untuk PetaLokalku
const db = new Dexie('PetaLokalkuDB');

db.version(1).stores({
  provinsi: 'code, name',
  kabupaten: 'code, province_code, name',
  kecamatan: 'code, regency_code, name',
  outlets: 'id, name, kodya, kecamatan, class, total_sales, lat, lng'
});

window.db = db;