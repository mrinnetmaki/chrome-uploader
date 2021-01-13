import {join} from 'path';

let path = (process.env.NODE_ENV === 'production') ? 'resources': '.';
if (process.env.APPIMAGE && process.env.APPDIR) {
  // In AppImage we need to prepend the mount path to path where we look
  // for resources. Current work directory is not the mount path.
  path = join(process.env.APPDIR, path);
}

let i18nextOptions = module.exports = {
  backend: {
    loadPath: path + '/locales/{{lng}}/{{ns}}.json',
    addPath: path + '/locales/{{lng}}/{{ns}}.missing.json'
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
