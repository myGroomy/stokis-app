import { callAppsScript } from './lib/appsscript';

async function main() {
  console.log("URL:", process.env.APPS_SCRIPT_URL);
  const result = await callAppsScript('getCabangList');
  console.log(JSON.stringify(result, null, 2));
}
main();
