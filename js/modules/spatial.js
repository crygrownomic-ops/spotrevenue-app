/**
 * SpotRevenue - Spatial Buffer & Catchment Radius Engine
 * Lead Developer: Urai Ikhsan Fadhilah
 */

function drawBufferRadius(ot, radiusInKm = 1) {
  if (!window.map || !ot) return;
  
  window.selectedOutlet = ot;

  if (!window.bufferGroup) {
    window.bufferGroup = L.featureGroup().addTo(window.map);
  }
  window.bufferGroup.clearLayers();

  const lat = parseFloat(ot.lat || ot.latitude);
  const lng = parseFloat(ot.lng || ot.longitude);

  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    const bufferInfoEl = document.getElementById('buffer-analysis-result');
    if (bufferInfoEl) {
      bufferInfoEl.innerHTML = '<div style="color:#ef4444; font-size:11px; padding:8px;">❌ Koordinat toko tidak valid.</div>';
    }
    return;
  }

  let effectiveRadiusKm = parseFloat(radiusInKm);
  if (isNaN(effectiveRadiusKm) || effectiveRadiusKm <= 0) {
    effectiveRadiusKm = 1;
  }

  const radiusInMeters = effectiveRadiusKm * 1000;
  
  // Gambar lingkaran merah transparan (interactive: false agar klik mouse menembus ke marker toko)
  const bufferCircle = L.circle([lat, lng], {
    radius: radiusInMeters,
    color: '#dc2626',
    fillColor: '#dc2626',
    fillOpacity: 0.18,
    weight: 2,
    dashArray: '6, 6',
    interactive: false 
  });

  window.bufferGroup.addLayer(bufferCircle);

  let nearbyCount = 0;
  let sumVal = 0;
  let sumBox = 0;
  let sumUom = 0;

  const activeMonths = window.currentMonthRange || ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthCount = activeMonths.length > 0 ? activeMonths.length : 1;

  const baseList = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
    ? window.lastFilteredOutlets 
    : (typeof window.getActiveDataset === 'function' ? window.getActiveDataset() : (window.masterData?.val || window.masterData?.box || []));

  // Hash Map O(1) Kilat
  const boxMap = new Map();
  (window.masterData?.box || []).forEach(b => {
    const c = String(b.customer_number || b.cust_no || b.id || '').trim().toUpperCase();
    if (c && c !== '-') boxMap.set(c, b);
  });

  const valMap = new Map();
  (window.masterData?.val || []).forEach(v => {
    const c = String(v.customer_number || v.cust_no || v.id || '').trim().toUpperCase();
    if (c && c !== '-') valMap.set(c, v);
  });

  const uomMap = new Map();
  (window.masterData?.uom || []).forEach(u => {
    const c = String(u.customer_number || u.cust_no || u.id || '').trim().toUpperCase();
    if (c && c !== '-') uomMap.set(c, u);
  });

  const getSalesVal = (item) => {
    if (!item) return 0;
    if (item.monthly_sales && typeof item.monthly_sales === 'object') {
      let total = 0;
      activeMonths.forEach(m => {
        const v = item.monthly_sales[m];
        total += typeof v === 'number' ? (isNaN(v) ? 0 : v) : (parseFloat(v) || 0);
      });
      return total;
    }
    return parseFloat(item.calculated_sales || item.total_sales || item.omset || 0) || 0;
  };

  const centerLatLng = L.latLng(lat, lng);

  baseList.forEach(other => {
    const oLat = parseFloat(other.lat || other.latitude);
    const oLng = parseFloat(other.lng || other.longitude);
    
    // Validasi Koordinat Toko Lain
    if (isNaN(oLat) || isNaN(oLng) || (oLat === 0 && oLng === 0)) return;

    const distMeters = centerLatLng.distanceTo(L.latLng(oLat, oLng));
    if (distMeters <= radiusInMeters) {
      nearbyCount++;

      const otherCode = String(other.customer_number || other.cust_no || other.id || '').trim().toUpperCase();

      const vMatch = valMap.get(otherCode);
      sumVal += vMatch ? getSalesVal(vMatch) : getSalesVal(other);

      const bMatch = boxMap.get(otherCode);
      sumBox += bMatch ? getSalesVal(bMatch) : (window.currentMetric === 'box' ? getSalesVal(other) : 0);

      const uMatch = uomMap.get(otherCode);
      sumUom += uMatch ? getSalesVal(uMatch) : (window.currentMetric === 'uom' ? getSalesVal(other) : 0);
    }
  });

  const avgValPerOutlet = nearbyCount > 0 ? (sumVal / nearbyCount) : 0;
  const avgBoxPerOutlet = nearbyCount > 0 ? (sumBox / nearbyCount) : 0;
  const avgUomPerOutlet = nearbyCount > 0 ? (sumUom / nearbyCount) : 0;

  const avgValPerMonth = sumVal / monthCount;
  const avgBoxPerMonth = sumBox / monthCount;
  const avgUomPerMonth = sumUom / monthCount;

  const fmt = (num) => Math.round(num || 0).toLocaleString('id-ID');

  // Menulis Hasil Analisis Langsung Ke Layar
  const bufferInfoEl = document.getElementById('buffer-analysis-result');
  if (bufferInfoEl) {
    bufferInfoEl.innerHTML = `
      <div style="background: #121212; padding: 14px; border-radius: 12px; border: 1px solid rgba(220,38,38,0.5); margin-top: 10px; font-size: 11.5px; color:#ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
        
        <div style="font-weight: 700; font-size: 12.5px; color: #f59e0b; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            <span>Analisis Catchment ${effectiveRadiusKm} KM</span>
          </div>
          <span style="background:rgba(220,38,38,0.25); color:#fca5a5; padding:2px 8px; border-radius:12px; font-size:10.5px; font-weight:bold;">${nearbyCount} Outlet</span>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-size:10px; color:#f59e0b; font-weight:700; text-transform:uppercase; margin-bottom:4px;">TOTAL PENJUALAN RADIUS AREA:</div>
          <div style="display:flex; flex-direction:column; gap:4px; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#cbd5e1;">💵 Value (VAL):</span>
              <b style="color:#ef4444; font-size:12px;">Rp ${fmt(sumVal)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#cbd5e1;">📦 Volume (BOX):</span>
              <b style="color:#f59e0b; font-size:12px;">${fmt(sumBox)} Karton</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#cbd5e1;">🏷️ Unit (UOM):</span>
              <b style="color:#38bdf8; font-size:12px;">${fmt(sumUom)} Pcs</b>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-size:10px; color:#38bdf8; font-weight:700; text-transform:uppercase; margin-bottom:4px;">RATA-RATA PER OUTLET IN-RADIUS:</div>
          <div style="display:flex; flex-direction:column; gap:4px; background:rgba(0,0,0,0.3); padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#94a3b8;">AVG Value / Outlet:</span>
              <b style="color:#ffffff;">Rp ${fmt(avgValPerOutlet)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#94a3b8;">AVG Box / Outlet:</span>
              <b style="color:#ffffff;">${fmt(avgBoxPerOutlet)} Ktn</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#94a3b8;">AVG Uom / Outlet:</span>
              <b style="color:#ffffff;">${fmt(avgUomPerOutlet)} Pcs</b>
            </div>
          </div>
        </div>

        <div>
          <div style="font-size:10px; color:#a855f7; font-weight:700; text-transform:uppercase; margin-bottom:4px;">RATA-RATA PER BULAN (${monthCount} Bln):</div>
          <div style="display:flex; flex-direction:column; gap:4px; background:rgba(0,0,0,0.3); padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#94a3b8;">AVG Value / Bln:</span>
              <b style="color:#ffffff;">Rp ${fmt(avgValPerMonth)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#94a3b8;">AVG Box / Bln:</span>
              <b style="color:#ffffff;">${fmt(avgBoxPerMonth)} Ktn</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#94a3b8;">AVG Uom / Bln:</span>
              <b style="color:#ffffff;">${fmt(avgUomPerMonth)} Pcs</b>
            </div>
          </div>
        </div>

      </div>
    `;
  }
}

window.drawBufferRadius = drawBufferRadius;