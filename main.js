// main.js
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const notesFilePath = path.join(__dirname, 'notes.json');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 350,
        height: 500,
        minWidth: 60,
        minHeight: 60,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: true,
        hasShadow: true,
        roundedCorners: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.setBackgroundColor('#00000000');

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    mainWindow.setPosition(width - 360, Math.floor((height - 500) / 2));
    mainWindow.setMovable(true);

    mainWindow.on('focus', () => {
        mainWindow.setBackgroundColor('#00000000');
    });
    mainWindow.on('blur', () => {
        mainWindow.setBackgroundColor('#00000000');
    });
    
}

app.whenReady().then(() => {
    createWindow();
    if (process.platform === 'darwin') {
        app.dock.hide();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('read-notes', async () => {
    try {
        if (fs.existsSync(notesFilePath)) {
            const data = fs.readFileSync(notesFilePath, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('读取笔记失败:', error);
        return {};
    }
});

ipcMain.handle('write-notes', async (event, notes) => {
    try {
        fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
        return { success: true };
    } catch (error) {
        console.error('写入笔记失败:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('toggle-always-on-top', () => {
    if (mainWindow) {
        const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
        return !isAlwaysOnTop;
    }
    return false;
});

ipcMain.handle('get-window-position', () => {
    if (mainWindow) return mainWindow.getPosition();
    return [0, 0];
});

ipcMain.handle('setWindowPosition', (event, x, y) => {
    if (mainWindow) mainWindow.setPosition(Math.round(x), Math.round(y));
});

ipcMain.handle('set-window-size', (event, width, height) => {
    if (mainWindow) {
        mainWindow.setSize(width, height, true);
        mainWindow.focus();
    }
});

ipcMain.handle('get-window-size', () => {
    if (mainWindow) return mainWindow.getSize();
    return [350, 500];
});

ipcMain.handle('focus-window', () => {
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.setBackgroundColor('#00000000');
    }
});

ipcMain.handle('get-screen-size', () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    return primaryDisplay.workAreaSize;
});

ipcMain.handle('set-window-opacity', (event, opacity) => {
    if (mainWindow) mainWindow.setOpacity(opacity);
});

ipcMain.handle('set-window-draggable', (event, draggable) => {
    if (mainWindow) mainWindow.setMovable(draggable);
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('quit-app', () => {
    app.quit();
});

ipcMain.handle('hide-window', () => {
    if (mainWindow) mainWindow.hide();
});

ipcMain.handle('show-window', () => {
    if (mainWindow) mainWindow.show();
});

ipcMain.handle('get-window-state', () => {
    if (mainWindow) {
        return {
            isVisible: mainWindow.isVisible(),
            isMinimized: mainWindow.isMinimized(),
            isMaximized: mainWindow.isMaximized(),
            isAlwaysOnTop: mainWindow.isAlwaysOnTop(),
            isFocused: mainWindow.isFocused()
        };
    }
    return null;
});

ipcMain.handle('export-notes', async (event, notes) => {
    try {
        const { dialog } = require('electron');
        const result = await dialog.showSaveDialog(mainWindow, {
            title: '导出笔记',
            defaultPath: `notes_${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON 文件', extensions: ['json'] }, { name: '所有文件', extensions: ['*'] }]
        });
        if (!result.canceled) {
            fs.writeFileSync(result.filePath, JSON.stringify(notes, null, 2));
            return { success: true, path: result.filePath };
        }
        return { success: false, canceled: true };
    } catch (error) {
        console.error('导出笔记失败:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('import-notes', async () => {
    try {
        const { dialog } = require('electron');
        const result = await dialog.showOpenDialog(mainWindow, {
            title: '导入笔记',
            filters: [{ name: 'JSON 文件', extensions: ['json'] }, { name: '所有文件', extensions: ['*'] }],
            properties: ['openFile']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const data = fs.readFileSync(result.filePaths[0], 'utf8');
            const notes = JSON.parse(data);
            return { success: true, notes: notes };
        }
        return { success: false, canceled: true };
    } catch (error) {
        console.error('导入笔记失败:', error);
        return { success: false, error: error.message };
    }
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
});