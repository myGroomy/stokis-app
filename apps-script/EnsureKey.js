// EnsureKey.js
function setFixedApiKey() {
  const FIXED_KEY = 'stk_9f83a7c64d21e8b0a9f5c4e3d2b1a098';
  PropertiesService.getScriptProperties().setProperty('STOKIS_API_KEY', FIXED_KEY);
  Logger.log('STOKIS_API_KEY set to: ' + FIXED_KEY);
}
