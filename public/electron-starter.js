const { app, shell, BrowserWindow } = require("electron");

const path = require('path');
const url = require('url');

let mainWindow;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 900, height: 680}) 
        
  // and load the index.html of the app.
  // win.loadFile('index.html')
  win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`)
  win.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});