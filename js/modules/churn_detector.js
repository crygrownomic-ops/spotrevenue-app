/* ==============================================================================
   SpotRevenue Module: Churn Detector (Early Warning Toko Drop & Performa Anjlok)
   Fitur 4: Deteksi Otomatis Toko Bermasalah / Anjlok >40%
   ============================================================================== */

window.SpotChurnDetector = {

  // FITUR 4: Deteksi Toko yang Omsetnya Anjlok dibanding Rata-rata / Bulan Lalu
  detectRiskOfChurnOutlets: function(outlets, dropThresholdPct = 40) {
    if (!outlets || outlets.length === 0) return [];

    const churnOutlets = [];

    outlets.forEach(item => {
      if (!item.monthly_sales) return;

      const months = Object.keys(item.monthly_sales);
      if (months.length < 2) return;

      // Ambil bulan terakhir & rata-rata bulan sebelumnya
      const lastMonth = months[months.length - 1];
      const prevMonths = months.slice(0, months.length - 1);

      const lastSales = item.monthly_sales[lastMonth] || 0;
      const prevAvgSales = prevMonths.reduce((sum, m) => sum + (item.monthly_sales[m] || 0), 0) / prevMonths.length;

      if (prevAvgSales > 0) {
        const dropPct = ((prevAvgSales - lastSales) / prevAvgSales) * 100;

        if (dropPct >= dropThresholdPct) {
          churnOutlets.push({
            outlet: item,
            dropPct: Math.round(dropPct),
            lastSales: lastSales,
            prevAvgSales: Math.round(prevAvgSales)
          });
        }
      }
    });

    churnOutlets.sort((a, b) => b.dropPct - a.dropPct);
    return churnOutlets;
  },

  // Highlight Marker Toko Churn di Peta Leaflet
  highlightChurnMarkersOnMap: function(churnList) {
    if (!window.outletMarkersMap || !churnList) return;

    churnList.forEach(c => {
      const key = String(c.outlet.customer_number || c.outlet.id);
      const marker = window.outletMarkersMap.get(key);

      if (marker && typeof marker.getElement === 'function') {
        const el = marker.getElement();
        if (el) {
          el.style.filter = "drop-shadow(0 0 10px #ef4444)";
          el.title = `⚠️ PERINGATAN: Omset Anjlok ${c.dropPct}%!`;
        }
      }
    });
  }
};