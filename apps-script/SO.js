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
