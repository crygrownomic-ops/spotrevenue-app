/**
 * SpotRevenue - Spatial Buffer & Radius Engine
 * Lead Developer: Urai Ikhsan Fadhilah
 */

function drawBufferRadius(ot, radiusInKm = 1) {
  if (!window.map || !ot) return;
  
  window.selectedOutlet = ot;

  if (window.bufferGroup) window.bufferGroup.clearLayers();

  const lat = parseFloat(ot.lat || ot.latitude);
  const lng = parseFloat(ot.lng || ot.longitude);

  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

  const radiusInMeters = radiusInKm * 1000;
  
  // FIX: interactive: false agar klik mouse tembus ke toko di bawah lingkaran radius
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

  // Menggunakan dataset aktif hasil filter jika tersedia
  const baseList = (window.lastFilteredOutlets && window.lastFilteredOutlets.length > 0)
    ? window.lastFilteredOutlets 
    : (window.masterData?.val || []);

  const boxList = window.masterData?.box || [];
  const uomList = window.masterData?.uom || [];

  baseList.forEach(other => {
    const oLat = parseFloat(other.lat || other.latitude);
    const oLng = parseFloat(other.lng || other.longitude);
    if (isNaN(oLat) || isNaN(oLng) || (oLat === 0 && oLng === 0)) return;

    const distMeters = window.map.distance([lat, lng], [oLat, oLng]);
    if (distMeters <= radiusInMeters) {
      nearbyCount++;

      let oVal = 0;
      if (other.monthly_sales && typeof other.monthly_sales === 'object') {
        activeMonths.forEach(m => oVal += (other.monthly_sales[m] || 0));
      } else {
        oVal = other.total_sales || other.calculated_sales || 0;
      }
      sumVal += oVal;

      const otherCode = String(other.customer_number || other.cust_no || other.id);

      const bMatch = boxList.find(b => String(b.customer_number || b.cust_no || b.id) === otherCode);
      if (bMatch) {
        let oBox = 0;
        if (bMatch.monthly_sales && typeof bMatch.monthly_sales === 'object') {
          activeMonths.forEach(m => oBox += (bMatch.monthly_sales[m] || 0));
        } else {
          oBox = bMatch.total_sales || 0;
        }
        sumBox += oBox;
      }

      const uMatch = uomList.find(u => String(u.customer_number || u.cust_no || u.id) === otherCode);
      if (uMatch) {
        let oUom = 0;
        if (uMatch.monthly_sales && typeof uMatch.monthly_sales === 'object') {
          activeMonths.forEach(m => oUom += (uMatch.monthly_sales[m] || 0));
        } else {
          oUom = uMatch.total_sales || 0;
        }
        sumUom += oUom;
      }
    }
  });

  const isAvgMode = window.currentCalcMode === 'avg';
  const valFormatted = Math.round(isAvgMode ? sumVal/monthCount : sumVal).toLocaleString('id-ID');
  const boxFormatted = Math.round(isAvgMode ? sumBox/monthCount : sumBox).toLocaleString('id-ID');
  const uomFormatted = Math.round(isAvgMode ? sumUom/monthCount : sumUom).toLocaleString('id-ID');
  const avgSuffix = isAvgMode ? ' / bln' : '';

  const bufferInfoEl = document.getElementById('buffer-analysis-result');
  if (bufferInfoEl) {
    bufferInfoEl.innerHTML = `
      <div style="background: #121212; padding: 12px; border-radius: 8px; border: 1px solid rgba(220,38,38,0.4); margin-top: 10px; font-size: 11.5px; color:#ffffff;">
        <div style="font-weight: 700; font-size: 12px; color: #f59e0b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span>Potensi Area Radius ${radiusInKm} KM:</span>
        </div>
        <div style="color: #ffffff; margin-bottom: 6px;">• Toko Terlingkup: <b>${nearbyCount} Toko</b></div>
        <div style="border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 8px; display:flex; flex-direction:column; gap:6px; color:#ffffff;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span><b>Rupiah (VAL):</b> Rp ${valFormatted}${avgSuffix}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            <span><b>Karton (BOX):</b> ${boxFormatted} Box${avgSuffix}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            <span><b>Satuan (UOM):</b> ${uomFormatted} UOM${avgSuffix}</span>
          </div>
        </div>
      </div>
    `;
  }
}

window.drawBufferRadius = drawBufferRadius;