// Users.js — Auth & user management via Registry spreadsheet

function login(payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const pin = String(payload.pin || '').trim();
  if (!username || !pin) throw new Error('Username dan PIN wajib diisi');

  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Users');
  const rows = sheetToObjects_(sheet);

  const user = rows.find(r =>
    String(r['Username']).toLowerCase() === username &&
    String(r['PIN']) === pin &&
    r['Aktif'] === true
  );

  if (!user) throw new Error('Username atau PIN salah');

  return {
    username: user['Username'],
    nama: user['Nama'],
    role: user['Role'],
    cabangId: user['Cabang_ID'] || '',
  };
}

function getUsers(cabangId) {
  const registry = getRegistry_();
  let rows = sheetToObjects_(getSheetByName_(registry, 'Users'));
  if (cabangId) {
    rows = rows.filter(r => String(r['Cabang_ID']).includes(cabangId));
  }
  return rows;
}

function addUser(payload) {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Users');
  const userId = 'USR' + String(sheet.getLastRow()).padStart(5, '0');
  sheet.appendRow([
    userId,
    payload.username || '',
    payload.pin || '',
    payload.nama || '',
    payload.role || 'petugas',
    payload.cabangId || '',
    payload.aktif !== false,
    new Date(),
  ]);
  return { userId };
}

function updateUser(userId, payload) {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Users');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === userId);
  if (rowIdx === -1) throw new Error('User ' + userId + ' tidak ditemukan');

  const map = { username: 2, pin: 3, nama: 4, role: 5, cabangId: 6 };
  Object.entries(map).forEach(([key, col]) => {
    if (payload[key] !== undefined) sheet.getRange(rowIdx + 1, col).setValue(payload[key]);
  });
  return { userId };
}

function setUserActive(userId, aktif) {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Users');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === userId);
  if (rowIdx === -1) throw new Error('User ' + userId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 7).setValue(aktif === true || aktif === 'true');
  return { userId, aktif };
}
