import { callAppsScript } from './frontend/lib/appsscript';
import * as dotenv from 'dotenv';
dotenv.config({ path: './frontend/.env.local' });

async function main() {
  console.log("URL:", process.env.APPS_SCRIPT_URL);
  const result = await callAppsScript('getCabangList');
  console.log(JSON.stringify(result, null, 2));
}
main();
