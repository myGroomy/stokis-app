// Dashboard.js

function getDashboardHarian(cabangId, tanggal) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const masterRows = sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item'));
  const soRows = sheetToObjects_(getSheetByName_(spreadsheet, 'SO_Transaksi'))
    .filter(r => formatDate_(r['Tanggal_Operasional']) === tanggal);

  const detail = soRows.map(r => {
    const master = masterRows.find(m => m['Item_ID'] === r['Item_ID']) || {};
    return { ...r, Status: calculateStatus_(r['Total'], master['Threshold'] || 0) };
  });

  return {
    tanggal,
    totalTransaksi: soRows.length,
    kritis: detail.filter(r => r.Status === 'Kritis').length,
    hampirHabis: detail.filter(r => r.Status === 'Hampir Habis').length,
    detail
  };
}

function getDashboardMingguan(cabangId, dari, sampai) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const soRows = sheetToObjects_(getSheetByName_(spreadsheet, 'SO_Transaksi'))
    .filter(r => { 
      const t = formatDate_(r['Tanggal_Operasional']); 
      return (!dari || t >= dari) && (!sampai || t <= sampai); 
    });

  const trenPerHari = {};
  soRows.forEach(r => {
    const t = formatDate_(r['Tanggal_Operasional']);
    trenPerHari[t] = (trenPerHari[t] || 0) + 1;
  });
  return { dari, sampai, totalTransaksi: soRows.length, trenPerHari };
}
