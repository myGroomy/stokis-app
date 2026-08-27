// Utils.js

function formatDate_(date) {
  if (!date) return '';
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getSheetByName_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan pada spreadsheet ID: ' + spreadsheet.getId());
  return sheet;
}

function sheetToObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}
