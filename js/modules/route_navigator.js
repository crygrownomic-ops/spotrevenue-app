/* ==============================================================================
   SpotRevenue Module: Route Navigator (WhatsApp, Google Maps, PDF)
   Fitur 1: Direct WhatsApp Sharing & Google Maps Turn-by-Turn
   Fitur 5: Print & PDF Daily Itinerary Export
   ============================================================================== */

window.SpotRouteNavigator = {

  // FITUR 1A: Kirim Ringkasan Rute Kunjungan Langsung ke WhatsApp Salesman
  shareRouteToWhatsApp: function(route, salesName = "Salesman") {
    if (!route || route.length === 0) {
      if (typeof showToast === 'function') showToast("Belum ada rute untuk dikirim!");
      return;
    }

    let text = `*🚩 JADWAL RUTE KUNJUNGAN SALESMAN*\n`;
    text += `👤 *Petugas:* ${salesName}\n`;
    text += `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `📍 *Total Kunjungan:* ${route.length} Toko\n`;
    text += `------------------------------------\n\n`;

    route.forEach((item, idx) => {
      const code = item.customer_number || item.id || '-';
      const lat = item.lat ?? item.latitude;
      const lng = item.lng ?? item.longitude;
      const mapsUrl = (lat && lng) ? `https://maps.google.com/?q=${lat},${lng}` : '-';

      text += `*${idx + 1}. ${item.name}* (${code})\n`;
      text += `   • Alamat: ${item.address || '-'}\n`;
      text += `   • Omset: Rp ${Math.round(item.current_total || item.total_sales || 0).toLocaleString('id-ID')}\n`;
      text += `   • Map Toko: ${mapsUrl}\n\n`;
    });

    text += `📲 *Buka Rute Navigasi Google Maps HP:*\n`;
    text += this.generateGoogleMapsMultiStopUrl(route) + `\n\n`;
    text += `_Dibuat otomatis oleh SpotRevenue GIS_`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  },

  // FITUR 1B: Buat Link Multi-Stop Google Maps untuk Navigasi HP
  generateGoogleMapsMultiStopUrl: function(route) {
    if (!route || route.length === 0) return '#';

    const coords = route
      .map(o => `${o.lat ?? o.latitude},${o.lng ?? o.longitude}`)
      .filter(c => c && !c.includes('undefined') && !c.includes('null'));

    if (coords.length === 0) return '#';

    const origin = coords[0];
    const destination = coords[coords.length - 1];
    const waypoints = coords.slice(1, -1).join('|');

    if (waypoints.length > 0) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }
  },

  openGoogleMapsNav: function(route) {
    const url = this.generateGoogleMapsMultiStopUrl(route);
    if (url !== '#') {
      window.open(url, '_blank');
    } else {
      if (typeof showToast === 'function') showToast("Koordinat rute tidak valid.");
    }
  },

  // FITUR 5: Export Printable PDF Surat Jalan Rute
  exportRouteToPDF: function(route, scheduleData = null) {
    if (!route || route.length === 0) {
      if (typeof showToast === 'function') showToast("Tidak ada data rute untuk dicetak.");
      return;
    }

    const printWindow = window.open('', '_blank');
    let totalSales = 0;

    let rowsHtml = '';
    route.forEach((item, idx) => {
      const sales = item.current_total || item.total_sales || 0;
      totalSales += sales;
      const timeInfo = scheduleData && scheduleData[idx] ? scheduleData[idx].eta : '-';

      rowsHtml += `
        <tr>
          <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
          <td>${timeInfo}</td>
          <td><b>${item.name}</b><br><small style="color:#64748b;">Kode: ${item.customer_number || item.id}</small></td>
          <td>${item.address || '-'}</td>
          <td>${Array.isArray(item.kecamatan) ? item.kecamatan.join(', ') : (item.kecamatan || '-')}</td>
          <td style="text-align:right; font-weight:bold; color:#059669;">Rp ${Math.round(sales).toLocaleString('id-ID')}</td>
          <td style="width:70px; border-bottom: 1px solid #000;"></td>
        </tr>
      `;
    });

    const docHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Jalan & Rute Kunjungan Field Sales</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; color: #0f172a; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
          .meta-table { width: 100%; margin-bottom: 15px; font-size: 12px; }
          .meta-table td { padding: 4px; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 8px; }
          .data-table th { background: #f1f5f9; text-align: left; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; text-align: center; }
          .sig-box { width: 30%; border-top: 1px solid #000; padding-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>SURAT JALAN & ROUTE SHEET KUNJUNGAN</h2>
          <p>SPOTREVENUE GEOGRAPHIC INFORMATION SYSTEM</p>
        </div>

        <table class="meta-table">
          <tr>
            <td><b>Tanggal Cetak:</b> ${new Date().toLocaleDateString('id-ID')}</td>
            <td><b>Total Outlet:</b> ${route.length} Toko</td>
          </tr>
          <tr>
            <td><b>Estimasi Omset Rute:</b> Rp ${Math.round(totalSales).toLocaleString('id-ID')}</td>
            <td><b>Status Rute:</b> Optimized Road-Network</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width:30px;">No</th>
              <th style="width:70px;">EST. JAM</th>
              <th>Nama Toko</th>
              <th>Alamat</th>
              <th>Kecamatan</th>
              <th style="text-align:right;">Target Omset</th>
              <th>Paraf Toko</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div class="sig-box">Salesman</div>
          <div class="sig-box">Supervisor Area</div>
          <div class="sig-box">Logistik / Admin</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(docHtml);
    printWindow.document.close();
  }
};