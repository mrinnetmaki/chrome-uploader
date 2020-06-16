/* global __ROLLBAR_POST_TOKEN__ */
import _ from 'lodash';
import { app, BrowserWindow, Menu, shell, ipcMain, crashReporter, dialog } from 'electron';
import os from 'os';
import osName from 'os-name';
import open from 'open';
import { autoUpdater } from 'electron-updater';
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder';
import { sync as syncActions } from './actions';
import debugMode from '../app/utils/debugMode';
import Rollbar from 'rollbar/src/server/rollbar';
import uploadDataPeriod from './utils/uploadDataPeriod';
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

let rollbar;
if(process.env.NODE_ENV === 'production') {
  rollbar = new Rollbar({
    accessToken: __ROLLBAR_POST_TOKEN__,
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
        environment: 'electron_main_process'
    }
  });
}

crashReporter.start({
  productName: 'Uploader',
  companyName: 'Tidepool',
  submitURL: '',
  uploadToServer: false
});

console.log('Crash logs can be found in:',crashReporter.getCrashesDirectory());
console.log('Last crash report:', crashReporter.getLastCrashReport());

let menu;
let template;
let mainWindow = null;

// Web Bluetooth should only be an experimental feature on Linux
app.commandLine.appendSwitch('enable-experimental-web-platform-features', true);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support'); // eslint-disable-line
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')(); // eslint-disable-line global-require
  const path = require('path'); // eslint-disable-line
  const p = path.join(__dirname, '..', 'app', 'node_modules'); // eslint-disable-line
  require('module').globalPaths.push(p); // eslint-disable-line
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const installExtensions = async () => {
  if (process.env.NODE_ENV === 'development') {
    const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');

    try {
      const name = await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS]);
      console.log(`Added Extension:  ${name}`);
    } catch (err) {
      console.log('An error occurred: ', err);
    }
  }
};

function addDataPeriodGlobalListener(menu) {
  ipcMain.on('setUploadDataPeriodGlobal', (event, arg) => {
    const item = _.find(menu.items, ['id', 'upload']);
    if (arg === uploadDataPeriod.PERIODS.ALL) {
      console.log('Uploading all data');
      item.submenu.items[0].checked = true;
    } else if (arg === uploadDataPeriod.PERIODS.DELTA) {
      console.log('Uploading only new records');
      item.submenu.items[1].checked = true;
    }
  });
};

app.on('ready', async () => {
  // await installExtensions();
  const resizable = (process.env.NODE_ENV === 'development');

  mainWindow = new BrowserWindow({
    show: false,
    width: 663,
    height: 769,
    resizable: resizable,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  mainWindow.webContents.on('did-finish-load', async () => {
    if (osName() === 'Windows 7') {
      const options = {
        type: 'info',
        title: 'Please update to a modern operating system',
        message:
          `Windows 7 won't be patched for any new viruses or security problems
going forward.

While Windows 7 will continue to work, Microsoft recommends you
start planning to upgrade to Windows 10, or an alternative
operating system, as soon as possible.`,
        buttons: ['Continue']
      };
      await dialog.showMessageBox(options);
    }

    mainWindow.show();
    mainWindow.focus();
    checkUpdates();
  });

  mainWindow.webContents.on('new-window', function(event, url){
    event.preventDefault();
    let platform = os.platform();
    let chromeInstalls = chromeFinder[platform]();
    if(chromeInstalls.length === 0){
      // no chrome installs found, open user's default browser
      open(url);
    } else {
      open(url, {app: chromeInstalls[0]}, function(error){
        if(error){
          // couldn't open chrome, try OS default
          open(url);
        }
      });
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    console.log('Device list:', deviceList);
    let [result] = deviceList;
    global.bluetoothDeviceId = result.deviceId;
    if (!result) {
      callback('');
    } else {
      callback(result.deviceId);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click() {
          mainWindow.inspectElement(x, y);
        }
      }]).popup(mainWindow);
    });
  }

  if (process.platform === 'darwin') {
    template = [{
      label: 'Sensotrend Uploader',
      submenu: [{
        label: 'About Sensotrend Uploader',
        click() {
          aboutDialog();
        }
      }, {
        label: 'Check for Updates',
        click() {
          manualCheck = true;
          autoUpdater.checkForUpdates();
        }
      }, {
        type: 'separator'
      }, {
        label: 'Hide Sensotrend Uploader',
        accelerator: 'Command+H',
        selector: 'hide:'
      }, {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      }, {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      }, {
        type: 'separator'
      }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() {
          app.quit();
        }
      }]
    }, {
      label: 'Edit',
      submenu: [{
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
      }, {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
      }, {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      }, {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      }, {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
      }]
    }, {
      label: 'View',
      submenu: (process.env.NODE_ENV === 'development') ?
      [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click() {
            mainWindow.webContents.reload();
          }
        }, {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }, {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click() {
            mainWindow.toggleDevTools();
          }
        }
      ] : [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }, {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click() {
            mainWindow.toggleDevTools();
          }
        }
      ]
    }, {
      label: '&Upload',
      id: 'upload',
      submenu: [{
        label: 'All data',
        type: 'radio',
        click() {
          console.log('Uploading all data');
          uploadDataPeriod.setPeriodGlobal(
            uploadDataPeriod.PERIODS.ALL, mainWindow);
        }
      }, {
        label: 'Data since last upload',
        type: 'radio',
        click() {
          console.log('Uploading only new records');
          uploadDataPeriod.setPeriodGlobal(
            uploadDataPeriod.PERIODS.DELTA, mainWindow);
        }
      }]
    }, {
      label: 'Window',
      submenu: [{
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:'
      }, {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'performClose:'
      }, {
        type: 'separator'
      }, {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }]
    }, {
      label: 'Help',
      submenu: [{
        label: 'Get Support',
        click() {
          shell.openExternal('http://support.tidepool.org/');
        }
      }, {
        label: 'Privacy Policy',
        click() {
          shell.openExternal('https://developer.tidepool.org/privacy-policy/');
        }
      }]
    }];

    menu = Menu.buildFromTemplate(template);
    addDataPeriodGlobalListener(menu);
    Menu.setApplicationMenu(menu);
  } else {
    template = [{
      label: '&File',
      submenu: [{
        label: '&Exit',
        accelerator: 'Alt+F4',
        click() {
          mainWindow.close();
        }
      }]
    }, {
      label: '&View',
      submenu: (process.env.NODE_ENV === 'development') ? [{
        label: '&Reload',
        accelerator: 'Ctrl+R',
        click() {
          mainWindow.webContents.reload();
        }
      }, {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click() {
          mainWindow.toggleDevTools();
        }
      }] : [{
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click() {
          mainWindow.toggleDevTools();
        }
      }]
    }, {
      label: '&Upload',
      id: 'upload',
      submenu: [{
        label: 'All data',
        type: 'radio',
        click() {
          console.log('Uploading all data');
          uploadDataPeriod.setPeriodGlobal(
            uploadDataPeriod.PERIODS.ALL, mainWindow);
        }
      }, {
        label: 'Data since last upload',
        type: 'radio',
        click() {
          console.log('Uploading only new records');
          uploadDataPeriod.setPeriodGlobal(
            uploadDataPeriod.PERIODS.DELTA, mainWindow);
        }
      }]
    }, {
      label: 'Help',
      submenu: [{
        label: 'Get Support',
        click() {
          shell.openExternal('http://support.tidepool.org/');
        }
      }, {
        label: 'Check for Updates',
        click() {
          manualCheck = true;
          autoUpdater.checkForUpdates();
        }
      }, {
        label: 'Privacy Policy',
        click() {
          shell.openExternal('https://developer.tidepool.org/privacy-policy/');
        }
      }, {
        label: 'About Sensotrend Uploader',
        click() {
          aboutDialog();
        }
      }]
    }];
    menu = Menu.buildFromTemplate(template);
    addDataPeriodGlobalListener(menu);
    mainWindow.setMenu(menu);
  }
});

let aboutWindow = null;
function aboutDialog() {
  if (aboutWindow !== null) {
    aboutWindow.show();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 600,
    height: 600,
    minWidth: 400,
    minHeight: 400,
    useContentSize: true,
    center: true,
    titleBarStyle: 'hidden-inset',
    icon: `file://${__dirname}/resources/icon.png`,
    webPreferences: {
        nodeIntegration: true,
    },
    parent: mainWindow,
    skipTaskbar: true,
    // devTools: false,
    // modal: true,
    show: false
  });

  aboutWindow.loadURL(`file://${__dirname}/about.html`).catch((reason) => {
    console.log(reason);
  });
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
  });
  aboutWindow.once('closed', () => {
    aboutWindow = null;
  });
  aboutWindow.webContents.on('will-navigate', (e, url) => {
    e.preventDefault();
    shell.openExternal(url).catch((reason) => {
      console.log('Could not open external: ' + reason);
    });
  });
  aboutWindow.setMenu(null);
}

function checkUpdates(){
  // in production NODE_ENV we check for updates, but not if NODE_ENV is 'development'
  // this prevents a Webpack build error that masks other build errors during local development
  if (process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdates();
  }
}

setInterval(checkUpdates, 1000 * 60 * 60 * 24);

let manualCheck = false;

function sendAction(action) {
  mainWindow.webContents.send('action', action);
}

autoUpdater.on('checking-for-update', () => {
  if(manualCheck) {
    manualCheck = false;
    sendAction(syncActions.manualCheckingForUpdates());
  } else {
    sendAction(syncActions.autoCheckingForUpdates());
  }
});

autoUpdater.on('update-available', (ev, info) => {
  sendAction(syncActions.updateAvailable(info));
  /*
  Example `info`
  {
    "version":"0.310.0-alpha",
    "releaseDate":"2017-04-03T22:29:55.809Z",
    "url":"https://github.com/tidepool-org/uploader/releases/download/v0.310.0-alpha/tidepool-uploader-dev-0.310.0-alpha-mac.zip",
    "releaseJsonUrl":"https://github.com//tidepool-org/uploader/releases/download/v0.310.0-alpha/latest-mac.json"
  }
   */
});

autoUpdater.on('update-not-available', (ev, info) => {
  sendAction(syncActions.updateNotAvailable(info));
});

autoUpdater.on('error', (ev, err) => {
  sendAction(syncActions.autoUpdateError(err));
});

autoUpdater.on('update-downloaded', (ev, info) => {
  sendAction(syncActions.updateDownloaded(info));
});

ipcMain.on('autoUpdater', (event, arg) => {
  if(arg === 'checkForUpdates') {
    manualCheck = true;
  }
  autoUpdater[arg]();
});

if(!app.isDefaultProtocolClient('tidepoolupload')){
  app.setAsDefaultProtocolClient('tidepoolupload');
}

app.on('window-all-closed', () => {
  app.quit();
});
