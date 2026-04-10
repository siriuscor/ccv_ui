const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const pie = require("puppeteer-in-electron")
const puppeteer = require("puppeteer-core");
const { Mantaku, SiteManager } = require('./src/mantaku');
const { TaskManager, TaskQueue } = require('./src/task');

const mantaku = new Mantaku();
let taskManager = null;
let browser = null;
let mainWindow = null;
let windowIndex = 0;
let downloadWindow = [];
let debug = false;
// const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
app.commandLine.appendSwitch('ignore-certificate-errors');


async function newPage() {
    const window = new BrowserWindow({
        x: windowIndex * 400, y: 0,
        // x: mainWindow.getBounds().x + mainWindow.getBounds().width + windowIndex * 100, 
        // y: mainWindow.getBounds().y, 
        width: 400, height: 300, show: debug,
        title: `Downloader ${windowIndex + 1}`
    });
    windowIndex++;
    window.webContents.setZoomFactor(0.5);
    const page = await pie.getPage(browser, window);
    await page.setUserAgent(UA);
    mantaku.blocker.enableBlockingInPage(page);
    downloadWindow.push(window);
    return page;
}

async function browseOnce(fn) {
    const window = new BrowserWindow({ width: 400, height: 300, show: debug });
    const page = await pie.getPage(browser, window);
    mantaku.blocker.enableBlockingInPage(page);
    await page.setUserAgent(UA);
    let result = await fn(page);
    if (!debug) window.destroy();
    return result;
}

async function init() {
    await pie.initialize(app);
    browser = await pie.connect(app, puppeteer);
    await app.whenReady();

    ipcMain.handle('search', async (event, site, keyword) => {
        return await browseOnce((page) => {
            return mantaku.search(page, site, keyword);
        });
    });

    ipcMain.handle('getSites', async (event) => {
        return await mantaku.listSites();
    });

    ipcMain.handle('checkSites', async (event, sites) => {
        return await SiteManager.checkConnectivity(sites);
    });

    ipcMain.handle('getMangaInfo', async (event, url) => {
        return await browseOnce((page) => {
            return mantaku.getMangaInfo(page, url);
        });
    });

    ipcMain.handle('getTaskList', async (event) => {
        return await taskManager.list();
    });

    ipcMain.handle('addChapter', async (event, opts) => {
        taskManager.addChapter(opts.chapters, opts.type, opts.mangaInfo, opts.path);
        // taskManager.start();
    });

    ipcMain.handle('loadTask', async (event, opts) => {
        taskManager.loadTask(opts);
    });

    ipcMain.handle('pause', async (event, index) => {
        taskManager.stop(index);
    });

    ipcMain.handle('clean', async (event) => {
        taskManager.clean();
    });

    ipcMain.handle('resume', async (event, index) => {
        taskManager.start(index);
    });

    ipcMain.handle('remove', async (event, index) => {
        taskManager.removeTask(index);
    });

    ipcMain.handle('appPath', (event) => {
        return app.getAppPath();
    });

    ipcMain.handle('listDir', async (event, dir) => {
        const fs = require('fs-extra');
        try {
            if (!(await fs.exists(dir))) return [];
            let list = await fs.readdir(dir, { withFileTypes: true });
            return list.filter(entry => entry.isFile())
                .map(entry => entry.name);
        } catch (e) {
            console.error('listDir error:', e);
            return [];
        }
    });

    ipcMain.handle('readJson', async (event, filePath) => {
        const fs = require('fs-extra');
        try {
            if (!(await fs.exists(filePath))) return null;
            return await fs.readJson(filePath);
        } catch (e) {
            console.error('readJson error:', e);
            return null;
        }
    });

    ipcMain.handle('listDirs', async (event, dir) => {
        const fs = require('fs-extra');
        try {
            if (!(await fs.exists(dir))) return [];
            let list = await fs.readdir(dir, { withFileTypes: true });
            return list.filter(entry => entry.isDirectory())
                .map(entry => entry.name);
        } catch (e) {
            console.error('listDirs error:', e);
            return [];
        }
    });

    ipcMain.handle('selectFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (result.canceled) return null
        return result.filePaths[0]
    });

    ipcMain.handle('debugMode', (event, mode) => {
        if (mode) {
            debug = true;
            downloadWindow.forEach((win) => {
                if (win) {
                    win.show();
                    // win.webContents.openDevTools();
                }
            });
            if (mainWindow) mainWindow.webContents.openDevTools();
        } else {
            debug = false;
            downloadWindow.forEach((win) => {
                if (win) {
                    win.hide();
                    // win.webContents.openDevTools();
                }
            });
            if (mainWindow) mainWindow.webContents.closeDevTools();
        }
        console.log('debug mode:', debug);
    });

    ipcMain.handle('getComicFiles', async (event, filePath) => {
        const fs = require('fs-extra');
        const JSZip = require('jszip');
        try {
            if (!(await fs.exists(filePath))) return [];
            const data = await fs.readFile(filePath);
            const zip = await JSZip.loadAsync(data);
            const imageFiles = [];
            for (const [name, file] of Object.entries(zip.files)) {
                if (!file.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
                    imageFiles.push(name);
                }
            }
            imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            return imageFiles;
        } catch (e) {
            console.error('getComicFiles error:', e);
            return [];
        }
    });

    ipcMain.handle('getComicImage', async (event, filePath, imageName) => {
        const fs = require('fs-extra');
        const JSZip = require('jszip');
        try {
            if (!(await fs.exists(filePath))) return null;
            const data = await fs.readFile(filePath);
            const zip = await JSZip.loadAsync(data);
            const file = zip.file(imageName);
            if (!file) return null;
            const content = await file.async('base64');
            const ext = imageName.split('.').pop().toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            return `data:${mimeType};base64,${content}`;
        } catch (e) {
            console.error('getComicImage error:', e);
            return null;
        }
    });
    // app.on('activate', () => {
    //   if (BrowserWindow.getAllWindows().length === 0) createWindow()
    // });
    await mantaku.init({ usePuppeteer: false });
    // taskManager = new TaskManager({
    //     concurrency: 3,
    //     pages: [await newPage(), await newPage(), await newPage()],
    // });
    taskManager = new TaskQueue({
        // concurrency: 3,
        pages: [await newPage(), await newPage(), await newPage()],
    });

    taskManager.on('worker_progress', (worker_index, task, index, total) => {
        mainWindow.webContents.send('task_update');
    });
    taskManager.on('worker_status', (worker_index, task, status) => {
        mainWindow.webContents.send('task_update');
    });
    console.log("init mantaku over");
    await createWindow();
}

const createWindow = async () => {
    // Create the browser window.

    // await pie.initialize(app);
    // const browser = await pie.connect(app, puppeteer);

    // const window = new BrowserWindow({ width: 100,height: 100});
    // const url = "https://baidu.com/";
    // await window.loadURL(url);

    // const page = await pie.getPage(browser, window);
    // console.log(page.url());
    // window.destroy();

    const splashWindow = new BrowserWindow({
        width: parseInt(648 * 0.8),
        height: parseInt(1152 * 0.8),
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        show: false,
        backgroundColor: '#00000000',
        icon: path.join(__dirname, 'public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    splashWindow.loadFile(path.join(__dirname, 'public/splash.html'))
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
    });

    setTimeout(() => {
        mainWindow = new BrowserWindow({
            width: 648,
            height: 1152,
            show: false,
            autoHideMenuBar: true,
            icon: path.join(__dirname, 'public/icon.png'),
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        });
        mainWindow.setMenu(null);

        if (process.env.PROD_TEST === 'true' || app.isPackaged) {
            mainWindow.loadFile(path.join(__dirname, 'public/comicui/dist/index.html'))
        } else {
            mainWindow.loadFile(path.join(__dirname, 'public/comicui/dist/index.html'))
        }

        mainWindow.once('ready-to-show', () => {
            splashWindow.close();
            mainWindow.show();
            if (debug) mainWindow.webContents.openDevTools()
        });

        mainWindow.on('close', () => {
            app.quit();
        });
    }, 4000);
}
// createWindow()
// app.whenReady().then(() => {
//   createWindow()
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

init();
app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') 
    app.quit()
})