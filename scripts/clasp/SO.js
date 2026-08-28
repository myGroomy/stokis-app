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
      step1, step2, total,
      payload.petugas, sesiId, keterangan
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
  const soRows = sheetToObjects_(getSheetByName_(spreadsheet, 'SO_Transaksi'));
  if (soRows.length === 0) return { latest: null, items: {}, history: [] };

  // Group by Sesi_ID
  const sessions = {};
  soRows.forEach(r => {
    const sid = r['Sesi_ID'];
    if (!sessions[sid]) sessions[sid] = { rows: [], timestamp: r['Timestamp'] };
    sessions[sid].rows.push(r);
  });

  // Sort sessions newest -> oldest
  const sortedSessions = Object.entries(sessions)
    .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));

  // Build history of recent sessions (newest first)
  const MAX_HISTORY = 8;
  const history = sortedSessions.slice(0, MAX_HISTORY).map(([sesiId, session]) => {
    const firstRow = session.rows[0];
    const items = {};
    session.rows.forEach(r => {
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
      sesiId,
      tanggal: formatDate_(firstRow['Tanggal_Operasional']),
      shift: firstRow['Shift'],
      petugas: firstRow['Petugas'],
      items,
    };
  });

  // Keep backward-compat: latest/items = most recent session
  const latestEntry = history[0] || null;
  return {
    latest: latestEntry ? {
      sesiId: latestEntry.sesiId,
      tanggal: latestEntry.tanggal,
      shift: latestEntry.shift,
      petugas: latestEntry.petugas,
    } : null,
    items: latestEntry ? latestEntry.items : {},
    history,
  };
}
