export interface Site {
  id: string;
  name: string;
  home?: string;
}

export interface SiteStatus {
  id: string;
  status: 'ok' | 'timeout' | 'error';
  latency: number;
}

export interface SearchResult {
  url: string;
  title: string;
  author?: string;
  cover?: string;
}

export interface DownloadedComic {
  title: string;
  author?: string;
  cover?: string;
  path: string;
  files: string[];
  mangaInfo?: MangaInfo;
}

export interface MangaInfo {
  web: string;
  title: string;
  author?: string;
  status?: string;
  intro?: string;
  cover?: string;
  chapters: { title: string; url: string }[];
}

export interface TaskItem {
  mangaInfo?: {
    title: string;
    author?: string;
  };
  title: string;
  current: number;
  total: number;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'packing' | 'pause' | 'cancel';
}

interface AppApi {
  searchInSite: (site: string, keyword: string) => Promise<SearchResult[]>;
  getSites: () => Promise<Site[]>;
  checkSites: (sites: Site[]) => Promise<SiteStatus[]>;
  getMangaInfo: (url: string) => Promise<MangaInfo>;
  addChapter: (chapters: { title: string; url: string }[], mangaInfo: MangaInfo, path: string, type: string) => Promise<void>;
  loadTask: (task: TaskItem) => Promise<void>;
  getTaskList: () => Promise<TaskItem[]>;
  pauseTask: (index: number) => Promise<void>;
  resumeTask: (index: number) => Promise<void>;
  removeTask: (index: number) => Promise<void>;
  cleanTask: () => Promise<void>;
  appPath: () => Promise<string>;
  selectFolder: () => Promise<string | null>;
  listDir: (dir: string) => Promise<string[]>;
  listDirs: (dir: string) => Promise<string[]>;
  readJson: (filePath: string) => Promise<any | null>;
  debugMode: (mode: boolean) => Promise<void>;
  getComicFiles: (filePath: string) => Promise<string[]>;
  getComicImage: (filePath: string, imageName: string) => Promise<string | null>;
}

declare global {
  interface Window {
    api: AppApi;
    __TAURI__?: {
      core?: {
        invoke?: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }
}

const getTauriInvoke = () => window.__TAURI__?.core?.invoke;

const tauriApi: AppApi = {
  async getSites() {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<Site[]>("get_sites");
  },
  async searchInSite(site, keyword) {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<SearchResult[]>("search", { site, keyword });
  },
  async getMangaInfo(url) {
    const invoke = getTauriInvoke();
    if (!invoke) throw new Error("Tauri invoke unavailable");
    return await invoke<MangaInfo>("get_manga_info", { url });
  },
  async checkSites(sites) {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<SiteStatus[]>("check_sites", { sites });
  },
  async addChapter(chapters, mangaInfo, path, type) {
    const invoke = getTauriInvoke();
    if (!invoke) return;
    await invoke<void>("add_chapter", { payload: { chapters, mangaInfo, path, type } });
  },
  async loadTask(_task) { return; }, // TODO phase 4
  async getTaskList() {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<TaskItem[]>("get_task_list");
  },
  async pauseTask(_index) { return; }, // TODO phase 4
  async resumeTask(_index) { return; }, // TODO phase 4
  async removeTask(_index) { return; }, // TODO phase 4
  async cleanTask() { return; }, // TODO phase 4
  async appPath() {
    const invoke = getTauriInvoke();
    if (!invoke) return "";
    return await invoke<string>("app_path");
  },
  async selectFolder() {
    const invoke = getTauriInvoke();
    if (!invoke) return null;
    return await invoke<string | null>("select_folder");
  },
  async listDir(dir) {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<string[]>("list_dir", { dir });
  },
  async listDirs(dir) {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<string[]>("list_dirs", { dir });
  },
  async readJson(filePath) {
    const invoke = getTauriInvoke();
    if (!invoke) return null;
    return await invoke<any | null>("read_json", { file_path: filePath });
  },
  async debugMode(mode) {
    const invoke = getTauriInvoke();
    if (!invoke) return;
    await invoke<void>("debug_mode", { mode });
  },
  async getComicFiles(filePath) {
    const invoke = getTauriInvoke();
    if (!invoke) return [];
    return await invoke<string[]>("get_comic_files", { file_path: filePath });
  },
  async getComicImage(filePath, imageName) {
    const invoke = getTauriInvoke();
    if (!invoke) return null;
    return await invoke<string | null>("get_comic_image", {
      file_path: filePath,
      image_name: imageName,
    });
  },
};

export const getApi = (): AppApi => {
  if (window.api) return window.api;
  if (getTauriInvoke()) return tauriApi;
  throw new Error("No desktop API bridge found (Electron preload or Tauri invoke)");
};
