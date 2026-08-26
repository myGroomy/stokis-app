// GetKey.js
function getOrSetApiKey() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('STOKIS_API_KEY');
  if (!key) {
    key = 'stk_supersecretkey_2026_bdg';
    props.setProperty('STOKIS_API_KEY', key);
  }
  Logger.log('CURRENT STOKIS_API_KEY: ' + key);
  return key;
}
