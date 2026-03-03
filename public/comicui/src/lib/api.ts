export interface Site {
  id: string;
  name: string;
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

declare global {
  interface Window {
    api: {
      searchInSite: (site: string, keyword: string) => Promise<SearchResult[]>;
      getSites: () => Promise<Site[]>;
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
      debugMode: (mode: boolean) => Promise<void>;
    };
  }
}

export const getApi = () => window.api;
