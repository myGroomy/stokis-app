// SetKey.js
function setDefaultApiKeyIfEmpty() {
  const props = PropertiesService.getScriptProperties();
  const current = props.getProperty('STOKIS_API_KEY');
  if (!current) {
    props.setProperty('STOKIS_API_KEY', 'stk_stokis_2026_bdg_key');
  }
}
