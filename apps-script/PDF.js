// PDF.js

function generatePDF_(cabangId, spreadsheet, cabang, sesiId, tanggal, shift, petugas, transaksiList, masterRows) {
  const laporanSheet = getSheetByName_(spreadsheet, 'Laporan_PDF');
  const laporanId = 'RPT' + String(laporanSheet.getLastRow()).padStart(5, '0');

  let jumlahKritis = 0;
  let jumlahHampirHabis = 0;
  const rows = transaksiList.map(t => {
    const master = masterRows.find(m => m['Item_ID'] === t.itemId) || {};
    const status = calculateStatus_(t.total, master['Threshold'] || 0);
    if (status === 'Kritis') jumlahKritis++;
    if (status === 'Hampir Habis') jumlahHampirHabis++;
    return { ...t, nama: master['Nama_Barang'] || '', area: master['Area'] || '', threshold: master['Threshold'] || 0, status };
  });

  // Buat PDF dari HTML
  const html = buildPdfHtml_(cabang['Nama_Cabang'], tanggal, shift, petugas, rows, sesiId);
  const pdfBlob = Utilities.newBlob(html, 'text/html').getAs('application/pdf');
  pdfBlob.setName(laporanId + '_' + tanggal + '_' + shift + '.pdf');

  // Simpan ke folder Drive cabang
  const folder = DriveApp.getFolderById(cabang['Folder_Drive_ID']);
  const file = folder.createFile(pdfBlob);
  const pdfUrl = file.getUrl();

  // Catat ke Laporan_PDF
  laporanSheet.appendRow([
    laporanId, sesiId, tanggal, shift, petugas,
    new Date(), pdfUrl, jumlahKritis, jumlahHampirHabis, 'Belum Dikirim'
  ]);

  return laporanId;
}

function buildPdfHtml_(namaCabang, tanggal, shift, petugas, rows, sesiId) {
  const statusColor = { 'Kritis': '#d93025', 'Hampir Habis': '#f29900', 'Aman': '#1e8e3e', 'Tidak Dipantau': '#5f6368' };
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:6px;border:1px solid #ddd">${r.nama}</td>
      <td style="padding:6px;border:1px solid #ddd">${r.area}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${r.total}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${r.threshold}</td>
      <td style="padding:6px;border:1px solid #ddd;color:${statusColor[r.status] || '#000'};font-weight:bold">${r.status}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;padding:24px;color:#202124">
    <h2 style="margin-bottom:4px;color:#1a73e8">Laporan Stock Opname</h2>
    <h3 style="margin-top:0;color:#3c4043">${namaCabang}</h3>
    <div style="background:#f8f9fa;padding:12px;border-radius:6px;margin-bottom:16px;font-size:14px">
      <p style="margin:4px 0">Tanggal: <b>${tanggal}</b> &nbsp;|&nbsp; Shift: <b>${shift}</b> &nbsp;|&nbsp; Petugas: <b>${petugas}</b></p>
      <p style="margin:4px 0;color:#5f6368;font-size:12px">Sesi ID: ${sesiId}</p>
    </div>
    <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:13px">
      <thead style="background:#f1f3f4">
        <tr>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Nama Barang</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Area</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Total</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Threshold</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body></html>`;
}
