import _ from 'lodash';
import React, { Fragment } from 'react';
import { render } from 'react-dom';
import BuildTime from './BuildTime';

import { remote } from 'electron';
const i18n = remote.getGlobal( 'i18n' );


import config from '../lib/config';
window.DEBUG = config.DEBUG;

import './app.global.css';
import '../styles/main.less';
const fs = require('fs');

const PKG = 'app/package.json';
const LICENSE = 'LICENSE';
//Closing the about page using'ESC' key
let _isEscDown = false;
function isEsc(event) {
  return event.code === "Escape" && !(event.isComposing || event.altKey || event.ctrlKey || event.shiftKey);
}
document.onkeydown = function (event) {
  _isEscDown = isEsc(event);
}
document.onkeyup = function (event) {
  if (_isEscDown && isEsc(event)) {
    window.close();
  } else {
    _isEscDown = false;
  }
}
//parsing the package.json file
const pkg = JSON.parse((fs.readFileSync(PKG)));


const now = new Date();
function pad(number) {
  return `${number < 10 ? 0 : ''}${number}`;
}

//insert date to 'pkg' 
//need to figure out how to insert the date of the build instead of date everytime application is launched.
pkg['date'] = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const licenseFile = fs.readFileSync(LICENSE).toString()
pkg['licenseFile'] = licenseFile;

const copyrights = [];
for (const line of licenseFile.split('\n')) {
    if (line.startsWith('Copyright (c) ')) {
        copyrights.push(line.replace('Copyright (c)', '\u00a9'));
    } else {
        break;
    }
}

render(
  <div>
    <header>
      <img alt="" height="35" src="resources/sensotrend.svg"></img>
    </header>
    <h2>{pkg.description} <small>v{pkg.version}</small></h2>
    <section id="ce">
      <img alt="CE" src="resources/ce.svg" />
      <p>{i18n.t('Sensotrend Uploader on luokan I lääkinnällinen laite.')}</p>
      <p>{i18n.t('Ks.')} <a
        href="https://www.sensotrend.fi/connect/static/media/DECO-T5-DC-MDD_EU_Declaration_of_Conformity_-_Sensotrend_Uploader_-_signed.17445413.pdf">{i18n.t('Vaatimustenmukaisuusvakuutus')}</a>.</p>
    </section>
    <section id="device">
      <img alt={i18n.t('Unique Device Identification')} title={i18n.t('Unique Device Identification')} src="resources/udi.png" />
      <p>UDI-DI: D-FIMF000000500SU000001QT</p>
    </section>
    <section id="date">
      <img alt={i18n.t('Manifacturing date')} title={i18n.t('Manifacturing date')} src="resources/manufacturingDate.png" />
      {BuildTime}
    </section>
    <section id="manufacturer">
      <img alt={i18n.t('Manifacturer')} title={i18n.t('Manifacturer')} src="resources/manufacturer.png" />
      <address>Sensotrend Oy<br />
        Tampellan esplanadi 19 A 55<br />
        33180 Tampere, Finland<br />
        <a href={i18n.t('mailto:tuki@sensotrend.com')}>{i18n.t('tuki@sensotrend.com')}</a>
      </address>
    </section>
    <section id="info">
      <img alt={i18n.t('Additional info')} title={i18n.t('Additional info')} src="resources/website.png" />
      <p><a href="https://www.sensotrend.fi/uploader">https://www.sensotrend.fi/uploader</a></p>
    </section>
    <section id="credits">
      <h4>{i18n.t('Pohjautuu')}<a href="https://www.tidepool.org/download#tidepool-uploader">Tidepool
          Universal Uploaderiin</a>.</h4>
      <p className='copyrights'>{copyrights}
        <br />{i18n.t('Jaettu lisenssillä')} {pkg.license} {i18n.t('license')}
      </p>
    </section>

  </div>,
  document.getElementById('about-page')
);
