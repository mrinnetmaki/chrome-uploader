let path = (process.env.NODE_ENV === 'production') ? 'resources': '.';
let i18nextOptions = module.exports = {
  backend: {
    loadPath: path + '/locales/{{lng}}/{{ns}}.json',
    addPath: path + '/locales/{{lng}}/{{ns}}.missing.json'
  },
  interpolation: {
    escapeValue: false
  },
  lng: 'fi',
  saveMissing: true,
  fallbackLng: 'en',
  returnEmptyString: false,
  whitelist: ['en', 'es', 'fi'],
  keySeparator: false,
  nsSeparator: '|',
  debug: false,
  wait: true
};
