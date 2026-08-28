// SO.js

function submitSO(cabangId, payload) {
  const { spreadsheet, cabang } = resolveCabangSpreadsheet_(cabangId);
  const soSheet = getSheetByName_(spreadsheet, 'SO_Transaksi');
  const masterRows = sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item'));

  const sesiId = 'SES' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const timestamp = new Date();
  const transaksiList = [];

  // Fetch previous SO data for comparison in PDF
  const prevData = getPreviousSO(cabangId);
  const prevItems = prevData && prevData.items ? prevData.items : {};
  const prevInfo = prevData && prevData.latest ? prevData.latest : null;

  const items = payload.items || [];
  items.forEach(item => {
    const master = masterRows.find(m => m['Item_ID'] === item.itemId);
    if (!master) return;
    const step1 = Number(item.step1) || 0;
    const step2 = Number(item.step2) || 0;
    const total = step1 + step2;
    const keterangan = item.keterangan || '';
    const transaksiId = 'TRX' + String(soSheet.getLastRow()).padStart(6, '0');

    // Kolom: Transaksi_ID, Timestamp, Tanggal_Operasional, Shift,
    //        Item_ID, Nama_Barang, Area, Step1, Step2, Total,
    //        Petugas, Sesi_ID, Keterangan
    soSheet.appendRow([
      transaksiId, timestamp, payload.tanggalOperasional, payload.shift,
      item.itemId, master['Nama_Barang'], master['Area'],
      step1, step2, total, payload.petugas, sesiId, keterangan
    ]);

    // Look up previous SO data for this item by Nama_Barang
    const prev = prevItems[master['Nama_Barang']] || null;

    transaksiList.push({
      transaksiId,
      itemId: item.itemId,
      nama: master['Nama_Barang'],
      area: master['Area'],
      threshold: master['Threshold'] || 0,
      step1: step1,
      step2: step2,
      total: total,
      keterangan: keterangan,
      prevStep1: prev ? prev.step1 : null,
      prevStep2: prev ? prev.step2 : null,
      prevTotal: prev ? prev.total : null,
    });
  });

  const laporanId = generatePDF_(
    cabangId, spreadsheet, cabang, sesiId,
    payload.tanggalOperasional, payload.shift, payload.petugas,
    transaksiList, masterRows, prevInfo
  );
  return { sesiId, laporanId };
}

function calculateStatus_(total, threshold) {
  if (!threshold || threshold <= 0) return 'Tidak Dipantau';
  if (total <= threshold) return 'Kritis';
  if (total <= threshold * 2) return 'Hampir Habis';
  return 'Aman';
}

function getPreviousSO(cabangId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const soSheet = spreadsheet.getSheetByName('SO_Transaksi');
  if (!soSheet || soSheet.getLastRow() < 2) return { latest: null, items: {} };
  const soRows = sheetToObjects_(soSheet);
  if (soRows.length === 0) return { latest: null, items: {} };

  // Group by Sesi_ID and pick the most recent session
  var sessions = {};
  soRows.forEach(function(r) {
    var sid = r['Sesi_ID'];
    if (!sid) return;
    if (!sessions[sid]) sessions[sid] = { rows: [], timestamp: r['Timestamp'] };
    sessions[sid].rows.push(r);
  });

  var sortedSessions = Object.keys(sessions)
    .map(function(sid) { return [sid, sessions[sid]]; })
    .sort(function(a, b) { return new Date(b[1].timestamp) - new Date(a[1].timestamp); });

  if (sortedSessions.length === 0) return { latest: null, items: {} };

  var latestSesiId = sortedSessions[0][0];
  var latestSession = sortedSessions[0][1];
  var latestRow = latestSession.rows[0];

  var items = {};
  latestSession.rows.forEach(function(r) {
    items[r['Nama_Barang']] = {
      step1: Number(r['Step1']) || 0,
      step2: Number(r['Step2']) || 0,
      total: Number(r['Total']) || 0,
      tanggal: formatDate_(r['Tanggal_Operasional']),
      shift: r['Shift'] || '',
      petugas: r['Petugas'] || '',
      keterangan: r['Keterangan'] || '',
    };
  });

  return {
    latest: {
      sesiId: latestSesiId,
      tanggal: formatDate_(latestRow['Tanggal_Operasional']),
      shift: latestRow['Shift'],
      petugas: latestRow['Petugas'],
    },
    items: items,
  };
}
