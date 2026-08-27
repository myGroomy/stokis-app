const url = "https://script.google.com/macros/s/AKfycbz_r06KC0kGNdCxoOCcgaMJ2DTJ6oPrAZPrKJ_Ev7vaSWoihOR4-MCGkk9vVNY5yrqQgQ/exec";

async function test() {
  const params = {
    'x-api-key': 'stk_a2f79d39a8f24077af8ab723bbef727af5243d67',
    action: 'addPetugas',
    cabangId: 'CBG01BDG',
    nama: 'Test Petugas',
    posisi: 'Admin'
  };
  
  const query = new URLSearchParams(params).toString();
  const getUrl = `${url}?${query}`;
  
  const res = await fetch(getUrl, {
    method: 'GET',
    redirect: 'follow'
  });
  console.log("Status:", res.status);
  console.log("Response text:", await res.text());
}
test();
