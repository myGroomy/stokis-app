import { callAppsScript } from './lib/appsscript';

async function main() {
  const payload = {
    tanggalOperasional: '2026-08-27',
    shift: 'Malam',
    petugas: 'Alex',
    items: Array(150).fill({ itemId: 'ITM1234567890', step1: 5, step2: 5 })
  };
  
  const result = await callAppsScript('submitSO', 'CBG01BDG', payload);
  console.log("Status:", result.success);
  if (result.success) {
    console.log("Sesi:", result.data.sesiId);
  } else {
    console.log("Error:", result.error);
  }
}
main();
