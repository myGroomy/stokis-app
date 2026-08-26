// Laporan.js

function searchLaporan(cabangId, params) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  let rows = sheetToObjects_(getSheetByName_(spreadsheet, 'Laporan_PDF'));
  if (params.tanggal) rows = rows.filter(r => formatDate_(r['Tanggal_Operasional']) === params.tanggal);
  if (params.shift)   rows = rows.filter(r => r['Shift'] === params.shift);
  if (params.petugas) rows = rows.filter(r => r['Petugas'] === params.petugas);
  return rows;
}

function getShareWhatsAppLink(cabangId, laporanId) {
  const { spreadsheet, cabang } = resolveCabangSpreadsheet_(cabangId);
  const rows = sheetToObjects_(getSheetByName_(spreadsheet, 'Laporan_PDF'));
  const laporan = rows.find(r => r['Laporan_ID'] === laporanId);
  if (!laporan) throw new Error('Laporan ' + laporanId + ' tidak ditemukan');
  const nomorWA = String(cabang['Nomor_WA_Cabang']).replace(/\D/g, '');
  const teks = `Laporan SO ${cabang['Nama_Cabang']} - ${formatDate_(laporan['Tanggal_Operasional'])} ${laporan['Shift']}\n${laporan['Link_PDF']}`;
  return { waLink: `https://wa.me/${nomorWA}?text=${encodeURIComponent(teks)}`, laporan };
}

function updateStatusKirimWA(cabangId, laporanId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Laporan_PDF');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === laporanId);
  if (rowIdx === -1) throw new Error('Laporan ' + laporanId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 10).setValue('Sudah Dikirim');
  return { laporanId, status: 'Sudah Dikirim' };
}
