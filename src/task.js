const { ChapterDownloader } = require('./mantaku');
const { EventEmitter } = require('events');

function isSameTask(task, candidate) {
    const taskPath = task.path || task.opts?.path;
    const taskTitle = task.title || task.opts?.title;
    const taskUrl = task.url || task.opts?.url;
    return taskPath === candidate.path && (
        taskTitle === candidate.title ||
        (taskUrl && candidate.url && taskUrl === candidate.url)
    );
}

class DownloadTask extends ChapterDownloader {
    constructor(url, title, path, type, mangaInfo) {
        super();
        this.url = url;
        this.path = path;
        this.title = title;
        this.type = type;
        this.mangaInfo = mangaInfo;
    }

    async start(page) {
        try {
            await this.download(page, this.url, this.title, this.path, this.type, this.mangaInfo);
        } catch (e) {
            this.emit('error', e);
            // this.stop();
        }
    }

    toJSON() {
        return {
            url: this.url,
            title: this.title,
            path: this.path,
            status: this.status,
            type: this.type,
        };
    }
}

class TaskManager extends EventEmitter {
    constructor(opts) {
        super();
        this.tasks = [];
        this.concurrency = opts.concurrency || 2;
        this.pages = opts.pages;
        this.path = opts.path;
        this.status = 'idle'; // idle, running, paused
        this.currentIndex = 0;
        this.workers = [];
        if (this.pages.length < this.concurrency) {
            this.concurrency = this.pages.length;
            console.error('concurrency is larger than page size, set to', this.concurrency);
        }
    }

    list() {
        return this.tasks.map(task => task.toJSON());
    }

    addChapter(chapters, type, mangeInfo, path) {
        const result = { added: [], skipped: [] };
        for (let chapter of chapters) {
            const candidate = {
                url: chapter.url,
                title: chapter.title,
                path: path || this.path,
            };
            if (this.tasks.some(task => isSameTask(task, candidate))) {
                result.skipped.push(chapter);
                continue;
            }
            let task = new ChapterDownloader({
                url: chapter.url,
                title: chapter.title,
                path: path || this.path,
                packType: type,
                mangaInfo: mangeInfo,
            });
            this.tasks.push(task);
            result.added.push(chapter);
        }
        return result;
    }

    start() {
        if (this.tasks.length <= 0) return;
        if (this.status === 'running') return;

        this.status = 'running';
        this.currentIndex = 0;
        let con = this.concurrency;
        if (this.tasks.length < con) con = this.tasks.length;

        this.workers = new Array(con).fill(0);
        this.workers.map(async (_, i) => {
            this.emit('worker_start', i);
            await this.workerLoop(i);
        });
    }

    async workerLoop(workerIndex) {
        while (this.currentIndex < this.tasks.length && this.status === 'running') {
            // 检查是否暂停
            while (this.status === 'paused') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (this.status !== 'running') break;

            let task = this.tasks[this.currentIndex++];
            try {
                task.on('progress', (current, total) => {
                    this.emit('worker_progress', workerIndex, task, current, total);
                });
                this.emit('worker_progress', workerIndex, task, 0, 100);
                await task.start(this.pages[workerIndex]);
            } catch (e) {
                console.error(`Worker ${workerIndex} on ${task.title} Failed, `, e);
                this.emit('worker_progress', workerIndex, task, 0, 100);
            }
        }
        this.emit('worker_done', workerIndex);
    }

    pause() {
        if (this.status === 'running') {
            this.status = 'paused';
            // 暂停所有正在运行的任务
            this.tasks.forEach(task => {
                if (task.status === 'downloading') {
                    task.pause();
                }
            });
            this.emit('paused');
        }
    }

    resume() {
        if (this.status === 'paused') {
            this.status = 'running';
            // 恢复所有暂停的任务
            this.tasks.forEach(task => {
                if (task.status === 'paused') {
                    task.status = 'downloading';
                }
            });
            this.emit('resumed');
        }
    }

    stop() {
        this.status = 'stopped';
        // 停止所有任务
        this.tasks.forEach(task => {
            if (task.status === 'downloading' || task.status === 'paused') {
                task.stop();
            }
        });
        this.emit('stopped');
    }
}

class TaskQueue extends EventEmitter {
    constructor(opts) {
        super();
        this.running = 0;
        this.queue = [];
        this.paused = false;
        this.availablePages = opts.pages;
        this.concurrency = opts.pages.length;
    }

    addTask(task) {
        this.queue.push(task);
        this.next();
    }

    isRunning(task) {
        return !['pause', 'error', 'cancel'].includes(task.status);
    }

    start(i) {
        if (i > this.queue.length) {
            console.error('start index out of range', i, this.queue.length);
            return;
        }
        if (this.availablePages.length <= 0) {
            console.error('no available pages');
            return;
        }

        let task = this.queue[i];
        if (this.isRunning(task)) {
            console.error('task is not in pause or error state', task.status);
            return;
        }
        this.startTask(task);
    }

    stop(i) {
        if (i > this.queue.length) {
            console.error('stop index out of range', i, this.queue.length);
            return;
        }
        let task = this.queue[i];
        if (!this.isRunning(task)) {
            console.error('task is not in running state', task.status);
            return;
        }
        this.endTask(task);
    }

    startTask(task) {
        let page = this.availablePages.shift();
        if (!page) {
            console.error('no available pages');
            return;
        }
        task.page = page;
        task.on('progress', (current, total) => {
            this.emit('worker_progress', 0, task, current, total);
        });
        task.on('status', (status) => {
            this.emit('worker_status', 0, task, status);
            // if (status == 'completed') {
            //     this.endTask(task);
            // }
        });
        this.running++;
        console.log('start task', task.opts.title);
        task.start(task.page)
            .then(() => {
                console.log(`[完成] 任务 ${task.opts.title} 完成, 当前运行数: ${this.running}`);
            })
            .catch(err => {
                console.error(`[错误] 任务 ${task.opts.title} 出错:`, err);
            })
            .finally(() => {
                this.endTask(task);
                this.next();
            });
    }

    endTask(task) {
        console.log('end task', task.opts.title);
        this.running--;
        task.cancel();
        task.removeAllListeners();
        let page = task.page;
        task.page = null;
        this.availablePages.push(page);
        console.log('check availablePages', this.availablePages.length);
    }

    pauseAll() {
        this.paused = true;
    }

    resumeAll() {
        if (!this.paused) return;
        this.paused = false;
        this.next();
    }

    removeTask(i) {
        if (i > this.queue.length) {
            console.error('cancel index out of range', i, this.queue.length);
            return;
        }
        let task = this.queue[i];
        this.endTask(task);
        this.queue.splice(i, 1);
    }

    loadTask(taskData) {
        if (taskData.status != 'completed') { // recover other status
            taskData.status = 'pause';
        }
        this.addTask(new ChapterDownloader(taskData));
    }

    addChapter(chapters, type, mangeInfo, path) {
        const result = { added: [], skipped: [] };
        for (let chapter of chapters) {
            const candidate = {
                url: chapter.url,
                title: chapter.title,
                path: path,
            };
            if (this.queue.some(task => isSameTask(task, candidate))) {
                result.skipped.push(chapter);
                continue;
            }
            let task = new ChapterDownloader({
                url: chapter.url,
                title: chapter.title,
                path: path,
                packType: type,
                mangaInfo: mangeInfo,
            });
            this.addTask(task);
            result.added.push(chapter);
        }
        return result;
    }

    clean() { // clean finished task
        this.queue = this.queue.filter(task => task.status !== 'completed');
    }

    list() {
        return this.queue.map(task => task.toJSON());
    }

    getPaused() {
        return this.queue.filter(task => task.status === 'pause');
    }

    async next() {
        if (this.paused) return;
        let pausedTask = this.getPaused();
        console.log('begin call next', pausedTask.length);
        while (this.running < this.concurrency && pausedTask.length > 0) {
            const task = pausedTask.shift();
            this.startTask(task);
        }
        console.log('exit next');
    }
}

module.exports = { DownloadTask, TaskManager, TaskQueue };
