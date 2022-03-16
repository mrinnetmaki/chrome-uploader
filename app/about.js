import _ from 'lodash';
import React, { Fragment } from 'react';
import { render } from 'react-dom';


import { remote } from 'electron';
const i18n = remote.getGlobal( 'i18n' );


import config from '../lib/config';
window.DEBUG = config.DEBUG;

import './app.global.css';
import '../styles/main.less';





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
render(


 
  <div>
    <header>
      <img alt="" height="35" src="resources/sensotrend.svg"></img>
    </header>
    <h2>Welcome to about page!</h2>
  </div>,
  document.getElementById('about-page')
);
