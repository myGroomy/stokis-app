// Petugas.js

function getPetugasList(cabangId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  return sheetToObjects_(getSheetByName_(spreadsheet, 'Petugas')).filter(r => r['Aktif'] === true);
}

function addPetugas(cabangId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Petugas');
  const petugasId = 'PTG' + String(sheet.getLastRow()).padStart(4, '0');
  sheet.appendRow([petugasId, payload.Nama, payload.Nomor_WA || '', true]);
  return { petugasId };
}

function updatePetugas(cabangId, petugasId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Petugas');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === petugasId);
  if (rowIdx === -1) throw new Error('Petugas ' + petugasId + ' tidak ditemukan');
  if (payload.Nama) sheet.getRange(rowIdx + 1, 2).setValue(payload.Nama);
  if (payload.Nomor_WA !== undefined) sheet.getRange(rowIdx + 1, 3).setValue(payload.Nomor_WA);
  return { petugasId };
}

function setPetugasActive(cabangId, petugasId, aktif) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Petugas');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === petugasId);
  if (rowIdx === -1) throw new Error('Petugas ' + petugasId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 4).setValue(aktif === true || aktif === 'true');
  return { petugasId, aktif };
}
