/**
 * SETUP SCRIPT - FASE 1
 * Fungsi `runSetupPhase1()` untuk membuat seluruh struktur Sheets & Script Properties.
 */

function runSetupPhase1() {
  const PARENT_FOLDER_ID = '1IC8xwCoTN_tra4piKq7bI2LQaedJbdZG';
  const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
  
  Logger.log('🚀 Memulai Setup Fase 1 di folder: ' + parentFolder.getName());

  // ==========================================
  // 1. BUAT SPREADSHEET: STOKIS_TEMPLATE_CABANG
  // ==========================================
  const templateSS = SpreadsheetApp.create('STOKIS_TEMPLATE_CABANG');
  const templateFile = DriveApp.getFileById(templateSS.getId());
  templateFile.moveTo(parentFolder);
  
  // Sheet: Master_Item
  const sheetMasterItem = templateSS.getActiveSheet();
  sheetMasterItem.setName('Master_Item');
  sheetMasterItem.appendRow([
    'Item_ID', 'Nama_Barang', 'Area', 'Satuan', 
    'Konversi_Isi', 'Konversi_Keterangan', 'Threshold', 'Aktif', 'Tanggal_Dibuat'
  ]);
  formatHeader_(sheetMasterItem);

  // Sheet: SO_Transaksi
  const sheetSO = templateSS.insertSheet('SO_Transaksi');
  sheetSO.appendRow([
    'Transaksi_ID', 'Timestamp', 'Tanggal_Operasional', 'Shift', 
    'Item_ID', 'Nama_Barang', 'Area', 'Step1', 'Step2', 'Total', 'Petugas', 'Sesi_ID'
  ]);
  formatHeader_(sheetSO);

  // Sheet: Laporan_PDF
  const sheetLaporan = templateSS.insertSheet('Laporan_PDF');
  sheetLaporan.appendRow([
    'Laporan_ID', 'Sesi_ID', 'Tanggal_Operasional', 'Shift', 
    'Petugas', 'Waktu_Dibuat', 'Link_PDF', 'Jumlah_Kritis', 'Jumlah_Hampir_Habis', 'Status_Kirim_WA'
  ]);
  formatHeader_(sheetLaporan);

  // Sheet: Petugas
  const sheetPetugas = templateSS.insertSheet('Petugas');
  sheetPetugas.appendRow(['Petugas_ID', 'Nama', 'Nomor_WA', 'Aktif']);
  formatHeader_(sheetPetugas);

  // Sheet: Settings
  const sheetSettings = templateSS.insertSheet('Settings');
  sheetSettings.appendRow(['Key', 'Value']);
  formatHeader_(sheetSettings);
  sheetSettings.appendRow(['Daftar_Shift', 'Opening, Closing']);
  sheetSettings.appendRow(['Kelipatan_Threshold_Hampir_Habis', 2]);
  sheetSettings.appendRow(['Daftar_Area', 'Meja Biru Depan, Chiller, Freezer Ayam dan Alat, Barang Alat dan Kebersihan, Meja Laci, Gas dan Utilitas']);

  Logger.log('✅ STOKIS_TEMPLATE_CABANG berhasil dibuat! ID: ' + templateSS.getId());

  // ==========================================
  // 2. BUAT SPREADSHEET: STOKIS_REGISTRY
  // ==========================================
  const registrySS = SpreadsheetApp.create('STOKIS_REGISTRY');
  const registryFile = DriveApp.getFileById(registrySS.getId());
  registryFile.moveTo(parentFolder);

  // Sheet: Daftar_Cabang
  const sheetDaftarCabang = registrySS.getActiveSheet();
  sheetDaftarCabang.setName('Daftar_Cabang');
  sheetDaftarCabang.appendRow([
    'Cabang_ID', 'Nama_Cabang', 'Alamat', 'Spreadsheet_ID', 
    'Folder_Drive_ID', 'PIC_Nama', 'Nomor_WA_Cabang', 'Aktif', 'Tanggal_Dibuat'
  ]);
  formatHeader_(sheetDaftarCabang);

  // Sheet: Template_Referensi
  const sheetTemplateRef = registrySS.insertSheet('Template_Referensi');
  sheetTemplateRef.appendRow(['Template_Spreadsheet_ID', 'Template_Versi', 'Terakhir_Diperbarui']);
  formatHeader_(sheetTemplateRef);
  sheetTemplateRef.appendRow([templateSS.getId(), 'v1', new Date()]);

  // Sheet: Settings_Global
  const sheetSettingsGlobal = registrySS.insertSheet('Settings_Global');
  sheetSettingsGlobal.appendRow(['Key', 'Value']);
  formatHeader_(sheetSettingsGlobal);
  sheetSettingsGlobal.appendRow(['Folder_Drive_Induk', PARENT_FOLDER_ID]);
  sheetSettingsGlobal.appendRow(['Nama_Sistem', 'Sistem Stock Opname Multi Cabang']);

  Logger.log('✅ STOKIS_REGISTRY berhasil dibuat! ID: ' + registrySS.getId());

  // ==========================================
  // 3. SET SCRIPT PROPERTIES
  // ==========================================
  const generatedApiKey = 'stk_' + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().substring(0, 8);
  const scriptProperties = PropertiesService.getScriptProperties();
  
  scriptProperties.setProperties({
    'REGISTRY_SPREADSHEET_ID': registrySS.getId(),
    'STOKIS_API_KEY': generatedApiKey,
    'FOLDER_DRIVE_INDUK': PARENT_FOLDER_ID
  });

  Logger.log('==================================================');
  Logger.log('🎉 SETUP FASE 1 SELESAI!');
  Logger.log('🔑 STOKIS_API_KEY : ' + generatedApiKey);
  Logger.log('📋 REGISTRY_ID    : ' + registrySS.getId());
  Logger.log('📄 TEMPLATE_ID    : ' + templateSS.getId());
  Logger.log('==================================================');
}

function formatHeader_(sheet) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground('#1a73e8')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}
