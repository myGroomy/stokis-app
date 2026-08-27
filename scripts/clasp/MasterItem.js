// MasterItem.js

function getMasterItems(cabangId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  return sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item')).filter(r => r['Aktif'] === true);
}

function addItem(cabangId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const itemId = 'ITM' + String(sheet.getLastRow()).padStart(5, '0');
  sheet.appendRow([
    itemId, payload.Nama_Barang, payload.Area, payload.Satuan,
    payload.Konversi_Isi || '', payload.Konversi_Keterangan || '',
    Number(payload.Threshold) || 0, true, new Date()
  ]);
  return { itemId };
}

function updateThreshold(cabangId, itemId, threshold) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === itemId);
  if (rowIdx === -1) throw new Error('Item ' + itemId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 7).setValue(Number(threshold) || 0);
  return { itemId, threshold: Number(threshold) || 0 };
}

function setItemActive(cabangId, itemId, aktif) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === itemId);
  if (rowIdx === -1) throw new Error('Item ' + itemId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 8).setValue(aktif === true || aktif === 'true');
  return { itemId, aktif };
}
