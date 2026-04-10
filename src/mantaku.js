const fs = require('fs-extra');
const { EventEmitter } = require('events');
const mime = require('mime');
const p = require('path');
const utils = require('./utils');

class Mantaku {
    constructor() {
        this.browser = null;
    }
    async init(opts) {
        opts = opts || {};
        await SiteManager.load();
        if (opts.usePuppeteer) {
            await this.initHeadlessBrowser(opts.puppeteerOpts);
        }
        const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer');
        this.blocker = PuppeteerBlocker.parse(fs.readFileSync(p.join(__dirname, 'easylist.txt'), 'utf-8'));
    }

    listSites() {
        return SiteManager.list();
    }

    async initHeadlessBrowser(opts) {
        const puppeteer = require('puppeteer-core');
        opts = Object.assign({ ignoreHTTPSErrors: true }, opts);
        if (!opts.executablePath) {
            opts.executablePath = utils.getDefaultChromePath();
        }
        this.browser = await puppeteer.launch(opts);
    }

    async newBrowserPage() {
        let page = await this.browser.newPage();
        this.blocker.enableBlockingInPage(page);
        return page;
    }
    async getMangaInfo(page, url) {
        await utils.retry(page.goto.bind(page), url);
        let mangaInfo = await this.browseManga(page);
        return mangaInfo;
    }

    async browseManga(page) {
        await SiteManager.injectSiteScript(page);
        return await page.evaluate(async () => {
            return await __mantaku.mangaInfo();
        });
    }

    async DownloadChapter(page, url, title, path) {
        let cd = new ChapterDownloader();
        cd.download(page, url, title, path);
        return cd;
    }

    async search(page, siteName, keyword) {
        return await SiteManager.search(page, siteName, keyword);
    }
}

class SiteManager {
    static sites = null;
    static scriptPath = p.join(__dirname, 'sites/');
    static async load(forceReload = false) {
        if (this.sites && !forceReload) return;
        this.sites = {};
        let scriptPath = this.scriptPath;
        let files = await fs.readdir(scriptPath);
        let scripts = files.filter((file) => file.endsWith('.js'));
        for (let file of scripts) {
            if (file == 'common.js') continue;
            let site = require(scriptPath + file);
            this.sites[site.id] = {
                id: site.id,
                name: site.name,
                home: site.home,
                canHandle: site.canHandle,
                searchUrl: site.searchUrl,
                path: scriptPath + file,
            };
        }
    }

    static list() {
        let l = [];
        for (let siteName in this.sites) {
            let site = this.sites[siteName];
            l.push({ id: site.id, name: site.name, home: site.home });
        }
        return l;
    }

    static detect(url) {
        for (let siteName in this.sites) {
            let site = this.sites[siteName];
            if (site.canHandle && site.canHandle(url)) {
                return site;
            }
        }
        return null;
    }

    static async injectSiteScript(page) {
        await page.evaluate(await fs.readFile(this.scriptPath + 'common.js', 'utf8'));
        let site = this.detect(page.url());
        if (!site) throw Error('No injector found for ' + page.url());
        await page.evaluate(await fs.readFile(site.path, 'utf8'));
    }

    static async search(page, siteName, keyword) {
        let site = this.sites[siteName];
        if (!site) throw new Error('site not found');
        let url = site.searchUrl(keyword);
        // console.log('search url', url);
        await utils.retry(page.goto.bind(page), url);
        await this.injectSiteScript(page);
        let result = await page.evaluate(async () => {
            return await __mantaku.search();
        });
        return result;
    }

    static async checkConnectivity(sites) {
        const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
        console.log('begin check connectivity');
        const results = await Promise.all(sites.map(async (site) => {
            const start = Date.now();
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(site.home, {
                    signal: controller.signal,
                    headers: { 'User-Agent': UA }
                });
                clearTimeout(timeoutId);
                const latency = Date.now() - start;
                console.log('check site', site, latency);
                return { id: site.id, status: (response.ok || response.status === 403) ? 'ok' : 'error', latency };
            } catch (e) {
                const latency = Date.now() - start;
                console.log('check site error', site.id, e.name, latency);
                return { id: site.id, status: e.name === 'AbortError' ? 'timeout' : 'error', latency };
            }
        }));
        return results;
    }
}

class ChapterDownloader extends EventEmitter {
    constructor(opts) {
        super();
        this.status = opts.status || 'pause';
        this.opts = opts || {};
        this.total = 0;
        this.current = 0;
        this._paused = false;
        this._cancelled = false;
    }

    changeStatus(status) {
        this.status = status;
        this.emit('status', status);
        console.log('change status to', status);
    }

    pause() {
        this.changeStatus('pause');
        this._paused = true;
    }

    resume() {
        this._paused = false;
        this._resume();
        this.changeStatus('downloading');
    }

    cancel() {
        if (this.status == 'completed' || this.status == 'packing') return;
        this.changeStatus('cancel');
        this._cancelled = true;
    }

    async start(page) {
        try {
            this._cancelled = false;
            await this.download(page, this.opts.url, this.opts.title, this.opts.path, this.opts.packType, this.opts.mangaInfo);
        } catch (e) {
            console.error('download error', e, this.opts, page);
            this.status = 'error';
            this.errorMsg = e.message || e.toString();
            this.emit('error', e); // cause exit
        }
    }

    async download(page, url, title, path, packType, mangaInfo) {
        this.changeStatus('downloading');
        this.current = 0;
        this.total = 0;
        let imageCache = {};
        function responseListener(response) {
            const url = new URL(response.url());
            let type = mime.getExtension(response.headers()['content-type']);
            if (type === 'bin') type = 'png';
            if (['jpeg', 'png', 'gif', 'webp'].includes(type)) {
                response.mimeType = type;
                imageCache[url.href] = response;
            }
        }
        page.on('response', responseListener);

        await page.goto(url);
        await SiteManager.injectSiteScript(page);
        let total = await page.evaluate(async () => {
            return await __mantaku.totalPage();
        });

        this.total = total;
        let savePath = p.normalize(p.resolve(path, title));
        await fs.ensureDir(savePath);

        let mangaInfoPath = p.resolve(path, 'mangaInfo.json');
        try {
            if (mangaInfo && !(await fs.exists(mangaInfoPath))) {
                await fs.ensureDir(path);
                const infoToSave = { ...mangaInfo };
                delete infoToSave.chapters;
                await fs.writeJson(mangaInfoPath, infoToSave, { spaces: 2 });
            }
        } catch (e) { console.error('save mangaInfo error', e); }

        let hasGoPageFunc = await page.evaluate(async () => {
            return __mantaku.goPage ? true : false;
        });
        let begin = 1;
        if (hasGoPageFunc) {
            // 检查已经下载的图片
            let files = await fs.readdir(savePath);
            if (files.length > 0) {
                let names = files.map(f => p.parse(f).name);
                for (let i = 1; i <= total; i++) {
                    let padNum = i.toString().padStart(3, '0');
                    if (names.includes(padNum)) {
                        begin = i;
                    } else {
                        break;
                    }
                }
                begin = begin + 1; // 从下一张开始
            }
            console.log(`skip check, ${url} ${title}, begin from ${begin} page`);
            await page.evaluate(async (i) => {
                return await __mantaku.goPage(i);
            }, begin);
            this.current = begin;
            this.emit('progress', begin, total);
        }

        for (let i = begin; i <= total; i++) {
            // 检查是否被取消
            if (this._cancelled) {
                this.emit('cancelled', i, total);
                break;
            }
            // 检查是否暂停
            if (this._paused) {
                await new Promise(resolve => {
                    this._resume = resolve;
                    this._pausePromise = this._pausePromise || new Promise(r => this._resume = r);
                    this.emit('paused', i, total);
                    return this._pausePromise;
                });
                // this.emit('resume', i, total);
            }
            let image = await page.evaluate(async (i) => {
                return await __mantaku.getImage(i);
            }, i);
            let fromCache = imageCache[image];
            if (!fromCache) {
                console.error('image not found in cache', image);
                throw new Error('image not found');
            } else {
                //debug(`save image ${url} -> ${savePath}`);
                let padNum = i.toString().padStart(3, '0');
                if (fromCache.mimeType === 'webp') {
                    try {
                        const base64Data = await page.evaluate(async (url) => {
                            try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const img = await createImageBitmap(blob);
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                canvas.getContext('2d').drawImage(img, 0, 0);
                                return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                            } catch (err) {
                                throw new Error('Canvas conversion failed: ' + err.message);
                            }
                        }, image);
                        await fs.outputFile(`${savePath}/${padNum}.jpg`, Buffer.from(base64Data, 'base64'));
                        console.log(`[OK] Page ${padNum} converted to JPEG via browser`);
                    } catch (e) {
                        console.error(`[WARN] Page ${padNum} conversion failed, saving original webp:`, e.message);
                        await fs.outputFile(`${savePath}/${padNum}.webp`, await fromCache.buffer());
                    }
                } else {
                    await fs.outputFile(`${savePath}/${padNum}.${fromCache.mimeType}`, await fromCache.buffer());
                    if (fromCache.mimeType === 'png') {
                        await utils.convertPng(savePath, padNum);
                    }
                }
            }

            await page.evaluate(async (i) => {
                await __mantaku.nextPage(i);
            }, i);

            this.current = i;
            this.emit('progress', i, total);
        }
        page.off('response', responseListener);

        if (!this._cancelled) {
            this.changeStatus('packing');
            let dir = p.resolve(path, title);
            await utils.pack(dir, p.resolve(path, title), packType, mangaInfo);
            await utils.rmdir(dir);
            this.changeStatus('completed');
        }
    }

    toJSON() {
        return {
            url: this.opts.url,
            title: this.opts.title,
            path: this.opts.path,
            status: this.status,
            errorMsg: this.errorMsg,
            packType: this.opts.packType,
            current: this.current,
            total: this.total,
            mangaInfo: this.opts.mangaInfo,
            progress: this.total > 0 ? parseInt(this.current / this.total * 100) : 0,
        };
    }
}

module.exports = { Mantaku, ChapterDownloader, SiteManager };
