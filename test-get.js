const url = "https://script.google.com/macros/s/AKfycbz_r06KC0kGNdCxoOCcgaMJ2DTJ6oPrAZPrKJ_Ev7vaSWoihOR4-MCGkk9vVNY5yrqQgQ/exec";

async function test() {
  const payload = {
    tanggal: '2026-08-27',
    items: Array(100).fill({ id: 1, name: 'Test', qty: 10 }), // large payload
  };
  
  const params = {
    'x-api-key': 'stk_a2f79d39a8f24077af8ab723bbef727af5243d67',
    action: 'submitSO',
    cabangId: 'CBG01BDG',
    payload: JSON.stringify(payload)
  };
  
  const query = new URLSearchParams(params).toString();
  const getUrl = `${url}?${query}`;
  console.log("URL Length:", getUrl.length);
  
  const res = await fetch(getUrl, {
    method: 'GET',
    redirect: 'follow'
  });
  console.log("Status:", res.status);
  console.log("Response text:", (await res.text()).substring(0, 100));
}
test();
