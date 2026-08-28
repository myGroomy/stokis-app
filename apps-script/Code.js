// Code.js
const API_KEY_PROP = 'STOKIS_API_KEY';

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  let body = {};
  try {
    body = e.postData ? JSON.parse(e.postData.contents) : {};
  } catch (err) {
    body = {};
  }

  // 1. Validasi API Key
  const apiKey = PropertiesService.getScriptProperties().getProperty(API_KEY_PROP);
  const incomingKey = body['x-api-key'] || (e.parameter && e.parameter['x-api-key']);

  if (!incomingKey || incomingKey !== apiKey) {
    return jsonResponse_({ success: false, error: { code: 'UNAUTHORIZED', message: 'API key tidak valid' } });
  }

  // 2. Route Action
  const action = body.action || (e.parameter && e.parameter.action);
  const cabangId = body.cabangId || (e.parameter && e.parameter.cabangId);
  const payload = body.payload || {};

  try {
    return routeAction_(action, cabangId, payload, e.parameter || {});
  } catch (err) {
    Logger.log('ERROR [%s] cabang=%s : %s', action, cabangId, err.message);
    return jsonResponse_({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

function routeAction_(action, cabangId, payload, params) {
  switch (action) {
    // Cabang
    case 'getCabangList':        return jsonResponse_({ success: true, data: getCabangList() });
    case 'createCabang':         return jsonResponse_({ success: true, data: createCabang(payload) });
    case 'updateCabang':         return jsonResponse_({ success: true, data: updateCabang(cabangId, payload) });
    case 'setCabangActive':      return jsonResponse_({ success: true, data: setCabangActive(cabangId, payload.aktif) });
    // Master Item
    case 'getMasterItems':       return jsonResponse_({ success: true, data: getMasterItems(cabangId) });
    case 'addItem':              return jsonResponse_({ success: true, data: addItem(cabangId, payload) });
    case 'updateThreshold':      return jsonResponse_({ success: true, data: updateThreshold(cabangId, payload.itemId, payload.threshold) });
    case 'setItemActive':        return jsonResponse_({ success: true, data: setItemActive(cabangId, payload.itemId, payload.aktif) });
    // Petugas
    case 'getPetugasList':       return jsonResponse_({ success: true, data: getPetugasList(cabangId) });
    case 'addPetugas':           return jsonResponse_({ success: true, data: addPetugas(cabangId, payload) });
    case 'updatePetugas':        return jsonResponse_({ success: true, data: updatePetugas(cabangId, payload.petugasId, payload) });
    case 'setPetugasActive':     return jsonResponse_({ success: true, data: setPetugasActive(cabangId, payload.petugasId, payload.aktif) });
    // SO
    case 'submitSO':             return jsonResponse_({ success: true, data: submitSO(cabangId, payload) });
    case 'getPreviousSO':        return jsonResponse_({ success: true, data: getPreviousSO(cabangId) });
    // Laporan
    case 'searchLaporan':        return jsonResponse_({ success: true, data: searchLaporan(cabangId, params) });
    case 'getShareWhatsAppLink': return jsonResponse_({ success: true, data: getShareWhatsAppLink(cabangId, payload.laporanId) });
    case 'updateStatusKirimWA':  return jsonResponse_({ success: true, data: updateStatusKirimWA(cabangId, payload.laporanId) });
    // Dashboard
    case 'getDashboardHarian':   return jsonResponse_({ success: true, data: getDashboardHarian(cabangId, params.tanggal) });
    case 'getDashboardMingguan': return jsonResponse_({ success: true, data: getDashboardMingguan(cabangId, params.dari, params.sampai) });

    default:
      return jsonResponse_({ success: false, error: { code: 'ACTION_TIDAK_DIKENAL', message: 'Action tidak dikenal: ' + action } });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
