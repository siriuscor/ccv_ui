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

export interface AppConfig {
  mangaInfoFileName: string;
}

export interface AddChapterResult {
  added: { title: string; url: string }[];
  skipped: { title: string; url: string }[];
}

declare global {
  interface Window {
    api: {
      searchInSite: (site: string, keyword: string) => Promise<SearchResult[]>;
      getSites: () => Promise<Site[]>;
      checkSites: (sites: Site[]) => Promise<SiteStatus[]>;
      getMangaInfo: (url: string) => Promise<MangaInfo>;
      addChapter: (chapters: { title: string; url: string }[], mangaInfo: MangaInfo, path: string, type: string) => Promise<AddChapterResult>;
      loadTask: (task: TaskItem) => Promise<void>;
      getTaskList: () => Promise<TaskItem[]>;
      pauseTask: (index: number) => Promise<void>;
      resumeTask: (index: number) => Promise<void>;
      removeTask: (index: number) => Promise<void>;
      cleanTask: () => Promise<void>;
      appPath: () => Promise<string>;
      getAppConfig: () => Promise<AppConfig>;
      selectFolder: () => Promise<string | null>;
      listDir: (dir: string) => Promise<string[]>;
      listDirs: (dir: string) => Promise<string[]>;
      readJson: (filePath: string) => Promise<MangaInfo | null>;
      debugMode: (mode: boolean) => Promise<void>;
      getComicFiles: (filePath: string) => Promise<string[]>;
      getComicImage: (filePath: string, imageName: string) => Promise<string | null>;
    };
  }
}


export const getApi = () => {
  if (window.api) return window.api;
  throw new Error("No desktop API bridge found (Electron preload or Tauri invoke)");
};
