// SO.js

function submitSO(cabangId, payload) {
  const { spreadsheet, cabang } = resolveCabangSpreadsheet_(cabangId);
  const soSheet = getSheetByName_(spreadsheet, 'SO_Transaksi');
  const masterRows = sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item'));

  const sesiId = 'SES' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const timestamp = new Date();
  const transaksiList = [];

  const items = payload.items || [];
  items.forEach(item => {
    const master = masterRows.find(m => m['Item_ID'] === item.itemId);
    if (!master) return;
    const step1 = Number(item.step1) || 0;
    const step2 = Number(item.step2) || 0;
    const total = step1 + step2;
    const transaksiId = 'TRX' + String(soSheet.getLastRow()).padStart(6, '0');
    soSheet.appendRow([
      transaksiId, timestamp, payload.tanggalOperasional, payload.shift,
      item.itemId, master['Nama_Barang'], master['Area'],
      step1, step2, total, payload.petugas, sesiId
    ]);
    transaksiList.push({ transaksiId, itemId: item.itemId, total });
  });

  const laporanId = generatePDF_(cabangId, spreadsheet, cabang, sesiId, payload.tanggalOperasional, payload.shift, payload.petugas, transaksiList, masterRows);
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
  const soRows = sheetToObjects_(getSheetByName_(spreadsheet, 'SO_Transaksi'));
  if (soRows.length === 0) return { latest: null, items: {} };

  // Group by Sesi_ID and pick the most recent session
  const sessions = {};
  soRows.forEach(r => {
    const sid = r['Sesi_ID'];
    if (!sessions[sid]) sessions[sid] = { rows: [], timestamp: r['Timestamp'] };
    sessions[sid].rows.push(r);
  });

  const sortedSessions = Object.entries(sessions)
    .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));

  const [latestSesiId, latestSession] = sortedSessions[0];
  const latestRow = latestSession.rows[0];

  const items = {};
  latestSession.rows.forEach(r => {
    items[r['Nama_Barang']] = {
      step1: r['Step1'] || 0,
      step2: r['Step2'] || 0,
      total: r['Total'] || 0,
      tanggal: formatDate_(r['Tanggal_Operasional']),
      shift: r['Shift'] || '',
      petugas: r['Petugas'] || '',
    };
  });

  return {
    latest: {
      sesiId: latestSesiId,
      tanggal: formatDate_(latestRow['Tanggal_Operasional']),
      shift: latestRow['Shift'],
      petugas: latestRow['Petugas'],
    },
    items,
  };
}
