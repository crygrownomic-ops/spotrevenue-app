/**
 * SpotRevenue - Dashboard Analytics & Ranking Engine
 */

window.brandChartInstance = null;

function updateDashboardAnalytics(outlets, totalOmset) {
  const metricKey = window.currentMetric || 'val';
  const totalOutletsCount = outlets ? outlets.length : 0;

  // Update KPI Outlet
  const kpiOutletEl = document.getElementById('full-kpi-outlet');
  if (kpiOutletEl) kpiOutletEl.innerText = `${totalOutletsCount.toLocaleString('id-ID')} Toko`;

  // Update KPI Omset
  const kpiOmsetEl = document.getElementById('full-kpi-omset');
  const labelOmsetEl = document.getElementById('kpi-label-omset');
  if (kpiOmsetEl) kpiOmsetEl.innerText = window.formatMetricValue(totalOmset, metricKey);
  if (labelOmsetEl) {
    const isAvg = window.currentCalcMode === 'avg';
    labelOmsetEl.innerText = isAvg ? `Rata-Rata ${metricKey.toUpperCase()} / Bln` : `Akumulasi Total ${metricKey.toUpperCase()}`;
  }

  // Update KPI Rata-rata per Toko
  const kpiAvgEl = document.getElementById('full-kpi-avg');
  if (kpiAvgEl) {
    const avgPerStore = totalOutletsCount > 0 ? (totalOmset / totalOutletsCount) : 0;
    kpiAvgEl.innerText = window.formatMetricValue(avgPerStore, metricKey);
  }

  // Akumulasi Brand, Kecamatan & Salesperson
  const brandMap = new Map();
  const kecMap = new Map();
  const salesMap = new Map();

  if (outlets && outlets.length > 0) {
    outlets.forEach(ot => {
      const val = ot.calculated_sales || 0;

      // Brand Top
      if (Array.isArray(ot.top_brands)) {
        ot.top_brands.forEach(b => {
          const bName = b.brand || 'Lainnya';
          brandMap.set(bName, (brandMap.get(bName) || 0) + (b.sales || 0));
        });
      }

      // Kecamatan
      let kec = 'Lainnya';
      if (Array.isArray(ot.kecamatan) && ot.kecamatan.length > 0) kec = ot.kecamatan[0];
      else if (ot.kecamatan || ot.kec) kec = String(ot.kecamatan || ot.kec);
      kecMap.set(kec, (kecMap.get(kec) || 0) + val);

      // Salesperson
      if (Array.isArray(ot.salespersons)) {
        ot.salespersons.forEach(sp => salesMap.set(sp, (salesMap.get(sp) || 0) + val));
      } else if (ot.salesperson || ot.salesman) {
        const sp = String(ot.salesperson || ot.salesman);
        salesMap.set(sp, (salesMap.get(sp) || 0) + val);
      }
    });
  }

  // Top Kecamatan KPI
  const sortedKec = Array.from(kecMap.entries()).sort((a, b) => b[1] - a[1]);
  const topKecEl = document.getElementById('full-kpi-top-kec');
  if (topKecEl) topKecEl.innerText = sortedKec.length > 0 ? sortedKec[0][0] : '-';

  // Render Ranking List HTML
  renderRankList('full-rank-brands', Array.from(brandMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5), metricKey);
  renderRankList('full-rank-kecamatan', sortedKec.slice(0, 5), metricKey);
  renderRankList('full-rank-sales', Array.from(salesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5), metricKey);

  // Render Chart.js
  renderBrandChart(Array.from(brandMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8), metricKey);
}

function renderRankList(containerId, dataArray, metricKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (dataArray.length === 0) {
    container.innerHTML = '<div style="color: #94a3b8; font-style: italic;">Data tidak tersedia.</div>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
  dataArray.forEach(([name, val], idx) => {
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 6px 10px; border-radius: 6px;">
        <span><b style="color:#f59e0b;">#${idx + 1}</b> ${name}</span>
        <span style="font-weight: 700; color: #ffffff;">${window.formatMetricValue(val, metricKey)}</span>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderBrandChart(topBrandData, metricKey) {
  const canvas = document.getElementById('chart-top-brands');
  if (!canvas) return;

  const labels = topBrandData.map(item => item[0]);
  const values = topBrandData.map(item => item[1]);

  if (window.brandChartInstance) {
    window.brandChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  window.brandChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Belum Ada Data'],
      datasets: [{
        label: `Penjualan ${metricKey.toUpperCase()}`,
        data: values.length > 0 ? values : [0],
        backgroundColor: '#dc2626',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#cbd5e1', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#cbd5e1', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.1)' } }
      }
    }
  });
}

window.updateDashboardAnalytics = updateDashboardAnalytics;