// PDF.js

function generatePDF_(cabangId, spreadsheet, cabang, sesiId, tanggal, shift, petugas, transaksiList, masterRows, prevInfo) {
  const laporanSheet = getSheetByName_(spreadsheet, 'Laporan_PDF');
  const laporanId = 'RPT' + String(laporanSheet.getLastRow()).padStart(5, '0');

  let jumlahKritis = 0;
  let jumlahHampirHabis = 0;

  const rows = transaksiList.map(function(t) {
    const status = calculateStatus_(t.total, t.threshold || 0);
    if (status === 'Kritis') jumlahKritis++;
    if (status === 'Hampir Habis') jumlahHampirHabis++;
    return {
      transaksiId: t.transaksiId,
      itemId: t.itemId,
      nama: t.nama || '',
      area: t.area || '',
      threshold: t.threshold || 0,
      step1: t.step1 || 0,
      step2: t.step2 || 0,
      total: t.total || 0,
      keterangan: t.keterangan || '',
      prevStep1: t.prevStep1 !== undefined ? t.prevStep1 : null,
      prevStep2: t.prevStep2 !== undefined ? t.prevStep2 : null,
      prevTotal: t.prevTotal !== undefined ? t.prevTotal : null,
      status: status,
    };
  });

  // Sort: Kritis → Hampir Habis → Aman → Tidak Dipantau
  var statusOrder = { 'Kritis': 0, 'Hampir Habis': 1, 'Aman': 2, 'Tidak Dipantau': 3 };
  rows.sort(function(a, b) { return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3); });

  // Standardized filename: [KODE_CABANG]-[TANGGAL]-[SHIFT]
  var kodeCabang = (cabang['Kode_Cabang'] || cabangId).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  var tglFormatted = tanggal.replace(/-/g, '');
  var fileName = kodeCabang + '-' + tglFormatted + '-' + shift.toUpperCase() + '.pdf';

  var html = buildPdfHtml_(cabang['Nama_Cabang'], tanggal, shift, petugas, rows, sesiId, laporanId, kodeCabang, prevInfo);
  var pdfBlob = Utilities.newBlob(html, 'text/html').getAs('application/pdf');
  pdfBlob.setName(fileName);

  var folder = DriveApp.getFolderById(cabang['Folder_Drive_ID']);
  var file = folder.createFile(pdfBlob);
  var pdfUrl = file.getUrl();

  laporanSheet.appendRow([
    laporanId, sesiId, tanggal, shift, petugas,
    new Date(), pdfUrl, jumlahKritis, jumlahHampirHabis, 'Belum Dikirim'
  ]);

  return laporanId;
}

function buildPdfHtml_(namaCabang, tanggal, shift, petugas, rows, sesiId, laporanId, kodeCabang, prevInfo) {
  var statusColor = {
    'Kritis': '#CA3521',
    'Hampir Habis': '#B38600',
    'Aman': '#216E4E',
    'Tidak Dipantau': '#6B778C'
  };
  var statusBg = {
    'Kritis': '#FFEBE6',
    'Hampir Habis': '#FFFAE6',
    'Aman': '#E3FCEF',
    'Tidak Dipantau': '#F1F2F4'
  };

  // Count by status
  var counts = { 'Kritis': 0, 'Hampir Habis': 0, 'Aman': 0, 'Tidak Dipantau': 0 };
  rows.forEach(function(r) { if (counts[r.status] !== undefined) counts[r.status]++; });

  // Overview boxes
  var overviewHtml = Object.keys(counts).map(function(status) {
    return '<div style="display:inline-block;width:22%;text-align:center;background:' + statusBg[status] +
      ';border:1px solid ' + statusColor[status] + ';border-radius:6px;padding:8px 4px;margin:0 1%">' +
      '<div style="font-size:22px;font-weight:900;color:' + statusColor[status] + '">' + counts[status] + '</div>' +
      '<div style="font-size:9px;font-weight:700;color:' + statusColor[status] + ';text-transform:uppercase">' + status + '</div>' +
      '</div>';
  }).join('');

  // Previous SO info banner
  var prevBanner = '';
  if (prevInfo) {
    prevBanner = '<div style="background:#E9F2FF;border:1px solid #B3D4FF;border-radius:4px;padding:6px 12px;margin-bottom:8px;font-size:11px;color:#1868DB;font-weight:600">' +
      'SO Sebelumnya: ' + (prevInfo.tanggal || '-') + ' &middot; Shift ' + (prevInfo.shift || '-') +
      ' &nbsp;&nbsp;|&nbsp;&nbsp; SO Sekarang: ' + tanggal + ' &middot; Shift ' + shift +
      '</div>';
  }

  // Comparison table rows
  var tdStyle = 'padding:5px 6px;border:1px solid #DCDFE4;font-size:11px;vertical-align:middle';
  var thStyle = 'padding:5px 6px;border:1px solid #B3D4FF;font-size:10px;font-weight:700;text-align:left';

  var tableRows = rows.map(function(r, idx) {
    var rowBg = r.status === 'Kritis' ? '#FFF5F3' :
                r.status === 'Hampir Habis' ? '#FFFCF0' :
                idx % 2 === 0 ? '#F7F8F9' : '#FFFFFF';
    var prevS1 = r.prevStep1 !== null && r.prevStep1 !== undefined ? r.prevStep1 : '-';
    var prevS2 = r.prevStep2 !== null && r.prevStep2 !== undefined ? r.prevStep2 : '-';
    var prevT  = r.prevTotal !== null && r.prevTotal !== undefined ? r.prevTotal : '-';
    var penggunaan = (r.prevTotal !== null && r.prevTotal !== undefined)
      ? r.prevTotal - r.total
      : '-';
    var penggunaanColor = penggunaan === '-' ? '#6B778C' :
                           penggunaan > 0 ? '#CA3521' : '#216E4E';
    var penggunaanText = penggunaan === '-' ? '-' :
                          penggunaan > 0 ? '+' + penggunaan : String(penggunaan);
    var borderLeft = (r.status === 'Kritis' || r.status === 'Hampir Habis')
      ? 'border-left:3px solid ' + statusColor[r.status] + ';' : '';

    return '<tr style="background:' + rowBg + ';' + borderLeft + '">' +
      '<td style="' + tdStyle + '">' + (idx + 1) + '</td>' +
      '<td style="' + tdStyle + ';font-weight:600">' + r.nama + '</td>' +
      '<td style="' + tdStyle + ';color:#6B778C;font-size:10px">' + r.area + '</td>' +
      '<td style="' + tdStyle + ';text-align:right">' + prevS1 + '</td>' +
      '<td style="' + tdStyle + ';text-align:right">' + prevS2 + '</td>' +
      '<td style="' + tdStyle + ';text-align:right;font-weight:700">' + prevT + '</td>' +
      '<td style="' + tdStyle + ';text-align:right">' + r.step1 + '</td>' +
      '<td style="' + tdStyle + ';text-align:right">' + r.step2 + '</td>' +
      '<td style="' + tdStyle + ';text-align:right;font-weight:700">' + r.total + '</td>' +
      '<td style="' + tdStyle + ';text-align:right;font-weight:700;color:' + penggunaanColor + '">' + penggunaanText + '</td>' +
      '<td style="' + tdStyle + ';color:#44546F;font-size:10px">' + (r.keterangan || '') + '</td>' +
      '<td style="' + tdStyle + ';font-weight:700;color:' + statusColor[r.status] + '">' + r.status + '</td>' +
      '</tr>';
  }).join('');

  // Kritis detail footer
  var kritisRows = rows.filter(function(r) { return r.status === 'Kritis'; });
  var kritisFooter = '';
  if (kritisRows.length > 0) {
    kritisFooter = '<div style="margin-top:20px;border-top:2px solid #CA3521;padding-top:12px">' +
      '<div style="font-size:12px;font-weight:700;color:#CA3521;margin-bottom:8px">&#9888; ITEM KRITIS &#8212; SEGERA RESTOK (' + kritisRows.length + ' ITEM)</div>' +
      kritisRows.map(function(r, i) {
        return '<div style="background:#FFEBE6;border:1px solid #FFBDAD;border-radius:4px;padding:6px 10px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-weight:600;font-size:12px">' + (i + 1) + '. ' + r.nama + ' <span style="font-weight:400;color:#44546F;font-size:11px">(' + r.area + ')</span></span>' +
          '<span style="font-weight:700;color:#CA3521;font-size:12px">Stok: ' + r.total + ' | Min: ' + r.threshold + ' | Kekurangan: ' + (r.threshold - r.total) + '</span>' +
          '</div>' +
          (r.keterangan ? '<div style="font-size:10px;color:#6B778C;margin-left:16px;margin-bottom:4px">Ket: ' + r.keterangan + '</div>' : '');
      }).join('') +
      '</div>';
  }

  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8">' +
    '<style>' +
    '  @page { size: A4 landscape; margin: 10mm; }' +
    '  body { font-family: Arial, sans-serif; padding: 16px; color: #172B4D; margin: 0; font-size: 11px; }' +
    '  h2 { margin: 0; font-size: 18px; }' +
    '  table { border-collapse: collapse; width: 100%; }' +
    '</style>' +
    '</head><body>' +

    '<!-- Header -->' +
    '<div style="background:#1868DB;color:#fff;padding:14px 20px;border-radius:8px;margin-bottom:10px">' +
    '<h2>LAPORAN STOCK OPNAME</h2>' +
    '<div style="font-size:12px;opacity:0.85;margin-top:4px">' + namaCabang + ' &nbsp;&middot;&nbsp; ' + tanggal + ' &nbsp;&middot;&nbsp; Shift ' + shift + '</div>' +
    '</div>' +

    '<!-- Info row -->' +
    '<div style="display:flex;gap:8px;margin-bottom:10px">' +
    '<div style="flex:1;background:#F7F8F9;border:1px solid #DCDFE4;border-radius:6px;padding:8px 12px">' +
    '<div style="font-size:9px;font-weight:700;color:#44546F;text-transform:uppercase">No. Laporan</div>' +
    '<div style="font-weight:700;font-size:13px">' + laporanId + '</div>' +
    '</div>' +
    '<div style="flex:1;background:#F7F8F9;border:1px solid #DCDFE4;border-radius:6px;padding:8px 12px">' +
    '<div style="font-size:9px;font-weight:700;color:#44546F;text-transform:uppercase">Petugas</div>' +
    '<div style="font-weight:700;font-size:13px">' + petugas + '</div>' +
    '</div>' +
    '<div style="flex:1;background:#F7F8F9;border:1px solid #DCDFE4;border-radius:6px;padding:8px 12px">' +
    '<div style="font-size:9px;font-weight:700;color:#44546F;text-transform:uppercase">Kode Cabang</div>' +
    '<div style="font-weight:700;font-size:13px">' + kodeCabang + '</div>' +
    '</div>' +
    '</div>' +

    '<!-- Status Overview -->' +
    '<div style="margin-bottom:12px;text-align:center">' +
    overviewHtml +
    '</div>' +

    '<!-- Previous SO Info Banner -->' +
    prevBanner +

    '<!-- Comparison Table Title -->' +
    '<div style="font-size:11px;font-weight:700;color:#172B4D;margin-bottom:4px;text-transform:uppercase">' +
    'Perbandingan Stok &#8212; Kritis Lebih Dulu' +
    '</div>' +

    '<!-- Comparison Table -->' +
    '<table>' +
    '<tr style="background:#172B4D;color:#fff">' +
    '<th style="' + thStyle + ';color:#fff;border-color:#172B4D" colspan="3"></th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:center;border-color:#172B4D" colspan="3">SO Sebelumnya</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:center;border-color:#172B4D" colspan="3">SO Sekarang</th>' +
    '<th style="' + thStyle + ';color:#fff;border-color:#172B4D" colspan="3"></th>' +
    '</tr>' +
    '<tr style="background:#44546F;color:#fff">' +
    '<th style="' + thStyle + ';color:#fff;width:28px">No</th>' +
    '<th style="' + thStyle + ';color:#fff;width:140px">Nama Barang</th>' +
    '<th style="' + thStyle + ';color:#fff;width:70px">Area</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:right;width:32px">S1</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:right;width:32px">S2</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:right;width:36px">Tot</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:right;width:32px">S1</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:right;width:32px">S2</th>' +
    '<th style="' + thStyle + ';color:#B3D4FF;text-align:right;width:36px">Tot</th>' +
    '<th style="' + thStyle + ';color:#fff;text-align:right;width:44px">Pemakaian</th>' +
    '<th style="' + thStyle + ';color:#fff;width:90px">Keterangan</th>' +
    '<th style="' + thStyle + ';color:#fff;width:55px">Status</th>' +
    '</tr>' +
    tableRows +
    '</table>' +

    '<!-- Kritis detail footer -->' +
    kritisFooter +

    '<!-- Footer -->' +
    '<div style="margin-top:16px;font-size:9px;color:#B3BAC5;text-align:center;border-top:1px solid #DCDFE4;padding-top:8px">' +
    kodeCabang + '-' + tanggal.replace(/-/g, '') + '-' + shift.toUpperCase() + '.pdf &nbsp;&middot;&nbsp; Sistem Stokis &nbsp;&middot;&nbsp; ' + new Date().toLocaleString('id-ID') +
    '</div>' +
    '</body></html>';
}
