// Users.js — Autentikasi & manajemen pengguna via spreadsheet Registry
//
// CATATAN KEAMANAN: PIN masih disimpan plaintext (kolom PIN) selama MVP.
// Direkomendasikan memindahkan ke hashing (mis. kode PIN 4-6 digit tetap
// butuh kendali akses; pertimbangkan `Users` dengan permission ketat).

const USERS_HEADERS = ['User_ID', 'Username', 'PIN', 'Nama', 'Role', 'Cabang_ID', 'Aktif', 'Created_At'];

function getUsersSheet_() {
  return getSheetByName_(getRegistry_(), 'Users');
}

function login(payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const pin = String(payload.pin || '').trim();
  if (!username || !pin) {
    throw ApiError_('validation_error', 'Username dan PIN wajib diisi');
  }

  const sheet = getUsersSheet_();
  const rows = sheetToObjects_(sheet);

  const user = rows.find(r =>
    String(r['Username']).toLowerCase() === username &&
    String(r['PIN']) === pin &&
    r['Aktif'] !== false
  );

  if (!user) {
    throw ApiError_('authentication_failed', 'Username atau PIN salah');
  }

  return {
    username: user['Username'],
    nama: user['Nama'],
    role: user['Role'],
    cabangId: user['Cabang_ID'] || '',
  };
}

function getUsers(cabangId) {
  const rows = sheetToObjects_(getUsersSheet_());
  return cabangId
    ? rows.filter(r => String(r['Cabang_ID']).includes(cabangId))
    : rows;
}

function addUser(payload) {
  if (!payload.username || !payload.pin) {
    throw ApiError_('validation_error', 'username dan pin wajib diisi');
  }
  const sheet = getUsersSheet_();
  const userId = 'USR' + newRandomToken_(8);
  sheet.appendRow([
    userId,
    String(payload.username).trim(),
    String(payload.pin),
    payload.nama || '',
    payload.role || 'petugas',
    payload.cabangId || '',
    payload.aktif !== false,
    new Date(),
  ]);
  return { userId };
}

function updateUser(userId, payload) {
  const sheet = getUsersSheet_();
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === userId);
  if (rowIdx === -1) throw ApiError_('not_found', 'User ' + userId + ' tidak ditemukan');

  // Kolom: B=Username(2), C=PIN(3), D=Nama(4), E=Role(5), F=Cabang_ID(6)
  const updated = rows[rowIdx].slice();
  if (payload.username !== undefined) updated[1] = String(payload.username).trim();
  if (payload.pin !== undefined) updated[2] = String(payload.pin);
  if (payload.nama !== undefined) updated[3] = payload.nama;
  if (payload.role !== undefined) updated[4] = payload.role;
  if (payload.cabangId !== undefined) updated[5] = payload.cabangId;
  sheet.getRange(rowIdx + 1, 1, 1, updated.length).setValues([updated]);
  return { userId };
}

function setUserActive(userId, aktif) {
  const sheet = getUsersSheet_();
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === userId);
  if (rowIdx === -1) throw ApiError_('not_found', 'User ' + userId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 7).setValue(aktif === true || aktif === 'true');
  return { userId, aktif };
}