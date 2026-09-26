/* ==============================================================================
   SpotRevenue Module: Route Planner (Time-Window Planning & Multi-Sales Balancing)
   Fitur 2: Estimasi Durasi Kunjungan & Jam Kerja (Time Window)
   Fitur 3: Multi-Salesman Route Balancing (Pembagian Kluster Tim)
   ============================================================================== */

window.SpotRoutePlanner = {

  // FITUR 2: Kalkulasi Jam Kedatangan (ETA) & Total Durasi Kerja Salesman
  calculateTimeWindowSchedule: function(route, avgStopoverMinutes = 15, avgSpeedKmH = 25, startTimeStr = "08:00") {
    if (!route || route.length === 0) return { schedule: [], totalDurationMinutes: 0, endTimeStr: startTimeStr };

    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);

    const schedule = [];

    route.forEach((item, idx) => {
      let travelMinutes = 0;
      if (idx > 0) {
        const prev = route[idx - 1];
        const pLat = parseFloat(prev.lat ?? prev.latitude);
        const pLng = parseFloat(prev.lng ?? prev.longitude);
        const cLat = parseFloat(item.lat ?? item.latitude);
        const cLng = parseFloat(item.lng ?? item.longitude);

        if (typeof getDistanceInMeters === 'function') {
          const distKm = getDistanceInMeters(pLat, pLng, cLat, cLng) / 1000;
          travelMinutes = Math.max(2, Math.round((distKm / avgSpeedKmH) * 60));
        }
      }

      // Tambahkan waktu tempuh ke waktu saat ini
      currentTime.setMinutes(currentTime.getMinutes() + travelMinutes);
      const arrivalStr = currentTime.toTimeString().substring(0, 5);

      // Tambahkan waktu pelayanan toko (Stopover)
      currentTime.setMinutes(currentTime.getMinutes() + avgStopoverMinutes);
      const departureStr = currentTime.toTimeString().substring(0, 5);

      schedule.push({
        outlet: item,
        eta: arrivalStr,
        etd: departureStr,
        travelTime: travelMinutes,
        serviceTime: avgStopoverMinutes
      });
    });

    const startMs = new Date().setHours(startHour, startMinute, 0, 0);
    const totalDurationMinutes = Math.round((currentTime.getTime() - startMs) / (1000 * 60));

    return {
      schedule: schedule,
      totalDurationMinutes: totalDurationMinutes,
      endTimeStr: currentTime.toTimeString().substring(0, 5)
    };
  },

  // FITUR 3: Pembagian Rute Adil Antar Multi-Salesman (Spatial Clustering)
  balanceMultiSalesmanRoutes: function(outlets, numSalesmen = 2) {
    if (!outlets || outlets.length === 0) return [];

    // Filter outlet berkoordinat valid
    const validOutlets = outlets.filter(o => {
      const lat = parseFloat(o.lat ?? o.latitude);
      const lng = parseFloat(o.lng ?? o.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    });

    if (validOutlets.length < numSalesmen) return [validOutlets];

    // Algoritma K-Means Clustering Sederhana
    let centroids = [];
    for (let i = 0; i < numSalesmen; i++) {
      const randomIdx = Math.floor(i * (validOutlets.length / numSalesmen));
      centroids.push({
        lat: parseFloat(validOutlets[randomIdx].lat ?? validOutlets[randomIdx].latitude),
        lng: parseFloat(validOutlets[randomIdx].lng ?? validOutlets[randomIdx].longitude)
      });
    }

    let clusters = Array.from({ length: numSalesmen }, () => []);

    // 5 Iterasi Penyempurnaan Kluster
    for (let iter = 0; iter < 5; iter++) {
      clusters = Array.from({ length: numSalesmen }, () => []);

      validOutlets.forEach(o => {
        const oLat = parseFloat(o.lat ?? o.latitude);
        const oLng = parseFloat(o.lng ?? o.longitude);

        let closestIdx = 0;
        let minDist = Infinity;

        centroids.forEach((c, idx) => {
          const dist = Math.hypot(oLat - c.lat, oLng - c.lng);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        clusters[closestIdx].push(o);
      });

      // Update ulang posisi centroid
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return { lat: 0, lng: 0 };
        const sumLat = cluster.reduce((s, item) => s + parseFloat(item.lat ?? item.latitude), 0);
        const sumLng = cluster.reduce((s, item) => s + parseFloat(item.lng ?? item.longitude), 0);
        return { lat: sumLat / cluster.length, lng: sumLng / cluster.length };
      });
    }

    return clusters;
  }
};