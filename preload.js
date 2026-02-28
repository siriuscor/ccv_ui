window.api = {
  async search(url, sites = []) {
    let result = await ipcRenderer.invoke('search', url);
    console.log(result);
    return result;
  },
  async getSites() {
    return await ipcRenderer.invoke('getSites');
  },
  // async searchInSites(keyword, sites) {
  //   return await ipcRenderer.invoke('searchInSites', keyword, sites);
  // },
  async searchInSite(site, keyword) {
    let result = await ipcRenderer.invoke('search', site, keyword);
    console.log(result);
    return result;
  },
  async getMangaInfo(url) {
    return await ipcRenderer.invoke('getMangaInfo', url);
  },
  async addChapter(chapters, mangaInfo, path, type) {
    return await ipcRenderer.invoke('addChapter', {
      chapters: chapters,
      path: path,
      type: type,
      mangaInfo: mangaInfo
    });
  },
  async loadTask(task) {
    return await ipcRenderer.invoke('loadTask', task);
  },
  async getTaskList() {
    return await ipcRenderer.invoke('getTaskList');
  },
  async pauseTask(index) {
    return await ipcRenderer.invoke('pause', index);
  },
  async resumeTask(index) {
    return await ipcRenderer.invoke('resume', index);
  },
  async removeTask(index) {
    return await ipcRenderer.invoke('remove', index);
  },
  async cleanTask() {
    return await ipcRenderer.invoke('clean');
  },
  async onDownloadProgress(callback) {
    console.log('register download progress');
    ipcRenderer.on('task_update', (event, ...args) => {
      console.log('preload task update');
      callback(...args);
    });
  },
  async appPath() {
    return await ipcRenderer.invoke('appPath');
  },
  async selectFolder() {
    return await ipcRenderer.invoke('selectFolder');
  },
  async listDir(dir) {
    return await ipcRenderer.invoke('listDir', dir);
  },
  async debugMode(mode) {
    return await ipcRenderer.invoke('debugMode', mode);
  }
};

const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', window.api);