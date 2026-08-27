const url = "https://script.google.com/macros/s/AKfycbz_r06KC0kGNdCxoOCcgaMJ2DTJ6oPrAZPrKJ_Ev7vaSWoihOR4-MCGkk9vVNY5yrqQgQ/exec";

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'x-api-key': 'stk_a2f79d39a8f24077af8ab723bbef727af5243d67',
      action: 'getCabangList'
    })
  });
  console.log("Status:", res.status);
  console.log("Response text:", await res.text());
}
test();
