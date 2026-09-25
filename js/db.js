/* ==============================================================================
   SpotRevenue Dexie.js Database Engine (v3 Robust Scheme)
   Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

const db = new Dexie('SpotRevenueDB');

db.version(3).stores({
  outlets_val: 'id, name, kodya, kecamatan, class, total_sales, lat, lng',
  outlets_box: 'id, name, kodya, kecamatan, class, total_sales, lat, lng',
  outlets_uom: 'id, name, kodya, kecamatan, class, total_sales, lat, lng'
});

window.db = db;