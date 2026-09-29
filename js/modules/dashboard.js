/* ==============================================================================
   SpotRevenue Executive Intelligence Dashboard & BCG Matrix Analytics Engine
   Lead Developer: Urai Ikhsan Fadhilah
   ============================================================================== */

let dashBrandChart = null;

function getOutletQuadrant(item, avgSalesThreshold, totalSelectedMonthsCount) {
  const sales = item.current_total || 0;
  const selectedMonths = window.selectedMonths || [];
  const consistencyThreshold = Math.max(1, Math.ceil(totalSelectedMonthsCount * 0.5));

  let activeMonths = 0;
  if (item.monthly_sales) {
    selectedMonths.forEach(m => {
      if ((item.monthly_sales[m] || 0) > 0) activeMonths++;
    });
  } else {
    activeMonths = sales > 0 ? totalSelectedMonthsCount : 0;
  }

  const isHighSales = sales >= avgSalesThreshold;
  const isHighConsistency = activeMonths >= consistencyThreshold;

  if (isHighSales && isHighConsistency) return 'star';
  if (isHighSales && !isHighConsistency) return 'cow';
  if (!isHighSales && isHighConsistency) return 'question';
  return 'risk';
}

function calculateBCGMatrix(data) {
  if (!data || data.length === 0) {
    ['quad-star-count', 'quad-cow-count', 'quad-question-count', 'quad-risk-count'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '0 Toko';
    });
    window.quadrantStats = { stars: 0, cows: 0, questions: 0, risks: 0 };
    return;
  }

  let totalSales = 0;
  data.forEach(item => {
    totalSales += item.current_total || 0;
  });

  const avgSalesThreshold = totalSales / data.length;
  const selectedMonths = window.selectedMonths || [];
  const totalSelectedMonthsCount = selectedMonths.length || 1;

  let stars = 0, cows = 0, questions = 0, risks = 0;

  data.forEach(item => {
    const q = getOutletQuadrant(item, avgSalesThreshold, totalSelectedMonthsCount);
    if (q === 'star') stars++;
    else if (q === 'cow') cows++;
    else if (q === 'question') questions++;
    else if (q === 'risk') risks++;
  });

  const elStar = document.getElementById('quad-star-count');
  const elCow = document.getElementById('quad-cow-count');
  const elQuestion = document.getElementById('quad-question-count');
  const elRisk = document.getElementById('quad-risk-count');

  if (elStar) elStar.innerText = `${stars.toLocaleString('id-ID')} Toko`;
  if (elCow) elCow.innerText = `${cows.toLocaleString('id-ID')} Toko`;
  if (elQuestion) elQuestion.innerText = `${questions.toLocaleString('id-ID')} Toko`;
  if (elRisk) elRisk.innerText = `${risks.toLocaleString('id-ID')} Toko`;

  window.quadrantStats = { stars, cows, questions, risks, avgSalesThreshold };
}

function generateExecutiveSummary() {
  const dataset = window.lastFilteredOutlets || window.activeOutletData || [];
  const container = document.getElementById('ai-summary-output');
  if (!container) return;

  if (!dataset || dataset.length === 0) {
    container.innerHTML = `<span class="placeholder-text">Tidak ada data terfilter untuk dianalisis. Silakan impor dataset terlebih dahulu.</span>`;
    return;
  }

  let totalOmset = 0;
  const kecMap = {};
  dataset.forEach(o => {
    const v = o.current_total || 0;
    totalOmset += v;
    const k = Array.isArray(o.kecamatan) ? o.kecamatan[0] : (o.kecamatan || 'Lainnya');
    kecMap[k] = (kecMap[k] || 0) + v;
  });

  let topKec = '-';
  let maxVal = 0;
  Object.keys(kecMap).forEach(k => {
    if (kecMap[k] > maxVal) {
      maxVal = kecMap[k];
      topKec = k;
    }
  });

  const activeMetric = window.activeMetric || 'val';
  const topKecContribPct = totalOmset > 0 ? ((maxVal / totalOmset) * 100).toFixed(1) : '0';
  const totalAnomalies = window.lastAnomalySet ? window.lastAnomalySet.size : 0;
  const metricName = activeMetric.toUpperCase();
  const formattedTotal = activeMetric === 'val' ? `Rp ${Math.round(totalOmset).toLocaleString('id-ID')}` : `${Math.round(totalOmset).toLocaleString('id-ID')} ${metricName}`;

  const stats = window.quadrantStats || { stars: 0, cows: 0, questions: 0, risks: 0 };
  const starPct = dataset.length > 0 ? ((stats.stars / dataset.length) * 100).toFixed(1) : '0';
  const questionPct = dataset.length > 0 ? ((stats.questions / dataset.length) * 100).toFixed(1) : '0';
  const riskPct = dataset.length > 0 ? ((stats.risks / dataset.length) * 100).toFixed(1) : '0';

  const html = `
    <div style="font-weight: 800; color: #34d399; margin-bottom: 6px; font-size: 12px;">📊 Analisis Eksekutif Real-Time (Metrik: ${metricName}):</div>
    <div style="color: #ffffff; margin-bottom: 4px;">Total akumulasi penjualan: <b style="color: #ffffff;">${formattedTotal}</b> dari <b style="color: #ffffff;">${dataset.length.toLocaleString('id-ID')} outlet</b> terfilter.</div>
    <div style="margin-top: 5px; color: #f8fafc;">• Wilayah Kontributor Utama: <b style="color: #fbbf24;">Kec. ${topKec}</b> (${topKecContribPct}% dari total omset).</div>
    <div style="margin-top: 5px; color: #f8fafc;">• Sebaran Performa: <b style="color: #fbbf24;">${stats.stars.toLocaleString('id-ID')} Star (${starPct}%)</b>, <b style="color: #60a5fa;">${stats.questions.toLocaleString('id-ID')} Potensial (${questionPct}%)</b>, dan <b style="color: #f87171;">${stats.risks.toLocaleString('id-ID')} Underperform (${riskPct}%)</b>.</div>
    <div style="margin-top: 5px; color: ${totalAnomalies > 0 ? '#f87171' : '#a7f3d0'}; font-weight: 600;">• Audit Spasial: Terdeteksi <b style="color: #ffffff;">${totalAnomalies} outlet anomali koordinat</b>.</div>
    <div style="margin-top: 8px; font-style: italic; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.25); padding-top: 6px;">
      <b style="color: #38bdf8; font-style: normal;">💡 Rekomendasi Operasional System:</b><br>
      1. Dorong ketersediaan varian produk pada <b style="color: #60a5fa; font-style: normal;">${stats.questions} Toko Potensial</b> yang rajin transaksi agar omsetnya meningkat.<br>
      2. Tinjau rute kunjungan salesman di Kec. ${topKec} dan evaluasi <b style="color: #f87171; font-style: normal;">${stats.risks} toko Underperform</b>.
    </div>
  `;

  container.innerHTML = html;
}

function updateDashboardAnalytics() {
  const dataset = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0) 
                  ? window.lastFilteredOutlets 
                  : (window.activeOutletData || []);

  const currentMetric = window.activeMetric || 'val';
  const metricUpper = currentMetric.toUpperCase();
  const selectedMonths = window.selectedMonths || [];
  const numMonths = selectedMonths.length || 1;
  const dashCalcMode = window.dashCalcMode || 'total';

  let totalOmset = 0;
  const kecMap = {};
  const brandMap = {};
  const salesMap = {};

  dataset.forEach(item => {
    const itemVal = item.current_total || item.total_sales || 0;
    totalOmset += itemVal;

    const kec = Array.isArray(item.kecamatan) ? item.kecamatan[0] : (item.kecamatan || 'Lainnya');
    if (kec) kecMap[kec] = (kecMap[kec] || 0) + itemVal;

    if (item.top_brands && Array.isArray(item.top_brands)) {
      item.top_brands.forEach(tb => {
        if (tb.brand) brandMap[tb.brand] = (brandMap[tb.brand] || 0) + (tb.sales || 0);
      });
    }

    const salesArr = Array.isArray(item.salespersons) ? item.salespersons : (item.salespersons ? [item.salespersons] : []);
    salesArr.forEach(sp => {
      if (sp) salesMap[sp] = (salesMap[sp] || 0) + itemVal;
    });
  });

  if (dashCalcMode === 'avg') {
    totalOmset = totalOmset / numMonths;

    Object.keys(kecMap).forEach(k => kecMap[k] = kecMap[k] / numMonths);
    Object.keys(brandMap).forEach(b => brandMap[b] = brandMap[b] / numMonths);
    Object.keys(salesMap).forEach(s => salesMap[s] = salesMap[s] / numMonths);
  }

  const totalOutlet = dataset.length;
  const avgPerOutlet = totalOutlet > 0 ? (totalOmset / totalOutlet) : 0;

  const formatVal = (num) => {
    const formatted = Math.round(num).toLocaleString('id-ID');
    if (currentMetric === 'val') {
      return `Rp ${formatted}`;
    } else if (currentMetric === 'box') {
      return `${formatted} BOX`;
    } else {
      return `${formatted} UOM`;
    }
  };

  let topKec = '-';
  let maxKecVal = -1;
  Object.keys(kecMap).forEach(k => {
    if (kecMap[k] > maxKecVal) {
      maxKecVal = kecMap[k];
      topKec = k;
    }
  });

  const elOutlet = document.getElementById('full-kpi-outlet');
  const elOmset = document.getElementById('full-kpi-omset');
  const elSubOmset = document.getElementById('sub-full-kpi-omset');
  const elAvg = document.getElementById('full-kpi-avg');
  const elTopKec = document.getElementById('full-kpi-top-kec');
  const elLabelOmset = document.getElementById('label-full-kpi-omset');
  const elChartBadge = document.getElementById('chart-metric-badge');

  if (elOutlet) elOutlet.innerText = `${totalOutlet.toLocaleString('id-ID')} Toko`;
  if (elOmset) elOmset.innerText = formatVal(totalOmset);
  if (elAvg) elAvg.innerText = formatVal(avgPerOutlet);
  if (elTopKec) elTopKec.innerText = topKec;

  if (elLabelOmset) {
    elLabelOmset.innerText = dashCalcMode === 'avg' ? `Akumulasi AVERAGE (${metricUpper})` : `Akumulasi TOTAL (${metricUpper})`;
  }
  if (elSubOmset) {
    elSubOmset.innerText = dashCalcMode === 'avg' ? `Rata-rata dihitung dari ${numMonths} bulan terpilih` : `Total akumulasi ${numMonths} bulan terpilih`;
  }
  if (elChartBadge) {
    elChartBadge.innerText = `Metrik: ${metricUpper} | Mode: ${dashCalcMode === 'avg' ? 'AVERAGE' : 'TOTAL'}`;
  }

  renderRankList('full-rank-brands', brandMap, formatVal);
  renderRankList('full-rank-kecamatan', kecMap, formatVal);
  renderRankList('full-rank-sales', salesMap, formatVal);

  renderBrandChart(brandMap, metricUpper);
}

function renderRankList(containerId, dataMap, formatFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sortedKeys = Object.keys(dataMap).sort((a, b) => dataMap[b] - dataMap[a]).slice(0, 5);

  if (sortedKeys.length === 0) {
    container.innerHTML = `<div style="color: #cbd5e1; font-size: 12px; padding: 10px 0;">Belum ada data transaksi</div>`;
    return;
  }

  let html = '';
  sortedKeys.forEach((key, idx) => {
    const valStr = formatFn(dataMap[key]);
    html += `
      <div class="rank-list-item">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(16,185,129,0.2); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #a7f3d0;">${idx + 1}</span>
          <span style="font-weight: 600; color: #f8fafc;">${key}</span>
        </div>
        <strong style="color: #34d399; font-size: 12px;">${valStr}</strong>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderBrandChart(brandMap, metricLabel) {
  const ctx = document.getElementById('chart-top-brands');
  if (!ctx || typeof Chart === 'undefined') return;

  const sortedBrands = Object.keys(brandMap).sort((a, b) => brandMap[b] - brandMap[a]).slice(0, 7);
  const labels = sortedBrands;
  const values = sortedBrands.map(b => brandMap[b]);

  if (dashBrandChart) {
    dashBrandChart.destroy();
  }

  dashBrandChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Belum Ada Data'],
      datasets: [{
        label: `Penjualan (${metricLabel})`,
        data: values.length > 0 ? values : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } },
        y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.08)' } }
      }
    }
  });
}

window.getOutletQuadrant = getOutletQuadrant;
window.calculateBCGMatrix = calculateBCGMatrix;
window.generateExecutiveSummary = generateExecutiveSummary;
window.updateDashboardAnalytics = updateDashboardAnalytics;