var path = require('path');
console.log(__dirname);
let dirPath = (process.env.NODE_ENV === 'production') ? path.join(__dirname, '../') : '.';
let i18nextOptions = module.exports = {
  backend: {
    loadPath: dirPath + '/locales/{{lng}}/{{ns}}.json',
    addPath: dirPath + '/locales/{{lng}}/{{ns}}.missing.json'
  },
  interpolation: {
    escapeValue: false
  },
  lng: 'fi',
  saveMissing: process.env.NODE_ENV !== 'production',
  fallbackLng: 'en',
  returnEmptyString: false,
  whitelist: ['en', 'es', 'fi'],
  keySeparator: false,
  nsSeparator: '|',
  debug: false,
  wait: true
};
