import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Download, Settings } from "lucide-react";
import ComicSearch from "@/components/ComicSearch";
import ChapterSelector from "@/components/ChapterSelector";
import DownloadedFiles from "@/components/DownloadedFiles";
import DownloadQueue from "@/components/DownloadQueue";
import SettingsDialog from "@/components/SettingsDialog";
import { type Site, type SiteStatus, type SearchResult, type MangaInfo, type TaskItem, type DownloadedComic, getApi } from "@/lib/api";
import { motion } from "framer-motion";

type View = { type: "search"; tab: "search" | "downloaded" | "queue" } | { type: "chapters"; url: string } | { type: "downloaded_viewer"; comic: DownloadedComic };

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const nextDebug = !localStorage.getItem('debugMode');
        if (nextDebug) {
          localStorage.setItem('debugMode', 'true');
        } else {
          localStorage.removeItem('debugMode');
        }
        getApi().debugMode(nextDebug);
        console.log('debug mode toggled:', nextDebug);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [view, setView] = useState<View>(() => {
    const saved = sessionStorage.getItem('lastView');
    return saved ? JSON.parse(saved) : { type: "search", tab: "search" };
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [sites, setSites] = useState<Site[]>([]);
  const [siteStatuses, setSiteStatuses] = useState<Record<string, SiteStatus>>({});
  const [selectedSite, setSelectedSite] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    const saved = sessionStorage.getItem('lastSearchResults');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  const [downloadPath, setDownloadPath] = useState(localStorage.getItem('downloadPath') || '');
  const [packType, setPackType] = useState(localStorage.getItem('packType') || 'cbz');
  const [showSettings, setShowSettings] = useState(false);
  const [downloadedComics, setDownloadedComics] = useState<DownloadedComic[]>([]);
  const [initialized, setInitialized] = useState(false);

  const fetchDownloadedComics = useCallback(async () => {
    if (!downloadPath) return;
    try {
      const dirs = await getApi().listDirs(downloadPath);
      const comics: DownloadedComic[] = [];
      for (const dir of dirs) {
        const dirPath = downloadPath + '/' + dir;
        const files = await getApi().listDir(dirPath);
        const comicFiles = files.filter(f => f.match(/\.(cbz|zip|epub)$/i));
        if (comicFiles.length > 0) {
          const mangaInfo = await getApi().readJson(dirPath + '/mangaInfo.json');
          comics.push({ title: dir, path: dirPath, files: comicFiles, mangaInfo });
        }
      }
      setDownloadedComics(comics);
    } catch {
      // Silently fail - UI will remain empty
    }
  }, [downloadPath]);

  const handleSelectDownloaded = useCallback((comic: DownloadedComic) => {
    setView({ type: "downloaded_viewer", comic });
  }, []);

  useEffect(() => {
    const init = async () => {
      const siteList = await getApi().getSites();
      setSites(siteList);
      if (siteList.length > 0) {
        const saved = localStorage.getItem('selectedSite');
        setSelectedSite(saved || siteList[0].id);
      }

      // Check site connectivity and sort
      getApi().checkSites(siteList).then(statuses => {
        const statusMap = statuses.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as Record<string, SiteStatus>);
        setSiteStatuses(statusMap);

        const sortedSites = [...siteList].sort((a, b) => {
          const sA = statusMap[a.id];
          const sB = statusMap[b.id];
          if (!sA && !sB) return 0;
          if (!sA) return 1;
          if (!sB) return -1;
          if (sA.status === 'ok' && sB.status === 'ok') return sA.latency - sB.latency;
          if (sA.status === 'ok') return -1;
          if (sB.status === 'ok') return 1;
          return 0;
        });
        setSites(sortedSites);
      });
      if (!downloadPath) {
        const appPath = await getApi().appPath();
        setShowSettings(true);
      }
      const taskList = await getApi().getTaskList();
      if (taskList.length === 0) {
        const savedTasksStr = localStorage.getItem('tasks');
        if (savedTasksStr) {
          try {
            const savedTasks = JSON.parse(savedTasksStr);
            if (Array.isArray(savedTasks) && savedTasks.length > 0) {
              console.log('Restoring tasks from localStorage:', savedTasks.length);
              for (const task of savedTasks) {
                await getApi().loadTask(task);
              }
              const restoredTaskList = await getApi().getTaskList();
              setTasks(restoredTaskList);
            }
          } catch (e) {
            console.error('Failed to parse saved tasks:', e);
          }
        }
      } else {
        setTasks(taskList);
      }
      setInitialized(true);
      await fetchDownloadedComics();
    };
    init();
  }, [downloadPath, fetchDownloadedComics]);

  useEffect(() => {
    fetchDownloadedComics();
  }, [downloadPath, fetchDownloadedComics]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const taskList = await getApi().getTaskList();
      setTasks(prevTasks => {
        // If a task just completed, refresh the downloaded comics list
        const recentlyCompleted = taskList.some(t => t.status === 'completed' && !prevTasks.find(pt => pt.title === t.title && pt.status === 'completed'));
        if (recentlyCompleted) {
          fetchDownloadedComics();
        }
        return taskList;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchDownloadedComics]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, initialized]);

  useEffect(() => {
    sessionStorage.setItem('lastView', JSON.stringify(view));
  }, [view]);

  useEffect(() => {
    sessionStorage.setItem('lastSearchResults', JSON.stringify(searchResults));
  }, [searchResults]);

  const handleSearch = useCallback(async (keyword: string) => {
    setLoading(true);
    try {
      localStorage.setItem('lastKeyword', keyword);
      localStorage.setItem('selectedSite', selectedSite);
      const results = await getApi().searchInSite(selectedSite, keyword);
      setSearchResults(results);
    } catch {
      // Search failed - results will remain empty
    }
    setLoading(false);
  }, [selectedSite]);

  const handleSelectManga = useCallback((url: string) => {
    setView({ type: "chapters", url });
  }, []);

  const handleDownload = useCallback(async (mangaInfo: MangaInfo, chapters: { title: string; url: string }[]) => {
    const path = downloadPath + '/' + mangaInfo.title + '/';
    await getApi().addChapter(chapters, mangaInfo, path, packType);
    const taskList = await getApi().getTaskList();
    setTasks(taskList);
    // After starting download, usually we stay in the current view or return to search if explicitly desired.
    // However, keeping consistent with original behavior:
    setView({ type: "search", tab: "search" });
  }, [downloadPath, packType]);

  const handleRead = useCallback((filePath: string) => {
    const comicId = encodeURIComponent(filePath);
    navigate(`/viewer/${comicId}/1`);
  }, [navigate]);

  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="ink-wash fixed inset-0 pointer-events-none z-0" />

      <header className="relative z-30 bg-background h-16">
        {/* Decorative underline layer */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground z-0" />
        
        <div className="relative z-10 container max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 bg-manga-gold/20 px-4 py-2 rounded-xl border-4 border-foreground shadow-comic rotate-[-2deg] transition-transform hover:rotate-[-1deg]">
            <img src="../../icon.png" alt="logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <h1 className="manga-header text-4xl tracking-wider text-manga-ink drop-shadow-[2px_2px_0px_#fff]">Manmori</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground font-black bg-white px-3 py-1.5 border-[3px] border-foreground shadow-comic rounded-lg">
              <Download className="w-4 h-4" />
              {completedCount}/{tasks.length} 完成
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-manga-success/20 hover:bg-manga-success text-foreground border-[3px] border-foreground rounded-lg shadow-comic transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-comic-md active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
              aria-label="设置"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container max-w-6xl mx-auto px-4 py-4 screentone" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <div className="h-full">
          <motion.div
            key={view.type + (view.type === 'search' ? view.tab : '')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            {view.type === "search" ? (
              <>
                <div className="flex gap-3 mb-6 px-1">
                  <button
                    onClick={() => setView({ type: "search", tab: "search" })}
                    className={`flex-1 py-3 px-2 font-black italic tracking-wide text-lg border-[3px] border-foreground rounded-xl transition-all ${view.tab === 'search' ? 'bg-manga-gold text-foreground shadow-comic-md -translate-y-1' : 'bg-card text-muted-foreground shadow-comic hover:-translate-y-0.5 hover:shadow-comic-md hover:bg-white'}`}
                  >
                    搜索
                  </button>
                  <button
                    onClick={() => setView({ type: "search", tab: "downloaded" })}
                    className={`flex-1 py-3 px-2 font-black italic tracking-wide text-lg border-[3px] border-foreground rounded-xl transition-all ${view.tab === 'downloaded' ? 'bg-manga-success text-white shadow-comic-md -translate-y-1' : 'bg-card text-muted-foreground shadow-comic hover:-translate-y-0.5 hover:shadow-comic-md hover:bg-white'}`}
                  >
                    已下载
                  </button>
                  <button
                    onClick={() => setView({ type: "search", tab: "queue" })}
                    className={`flex-1 py-3 px-2 font-black italic tracking-wide text-lg border-[3px] border-foreground rounded-xl transition-all ${view.tab === 'queue' ? 'bg-manga-red text-white shadow-comic-md -translate-y-1' : 'bg-card text-muted-foreground shadow-comic hover:-translate-y-0.5 hover:shadow-comic-md hover:bg-white'}`}
                  >
                    任务 ({tasks.length})
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  {view.tab === 'search' || view.tab === 'downloaded' ? (
                    <ComicSearch
                      activeTab={view.tab}
                      onSelect={handleSelectManga}
                      onSelectDownloaded={handleSelectDownloaded}
                      sites={sites}
                      selectedSite={selectedSite}
                      siteStatuses={siteStatuses}
                      onSiteChange={setSelectedSite}
                      searchResults={searchResults}
                      downloadedComics={downloadedComics}
                      loading={loading}
                      onSearch={handleSearch}
                    />
                  ) : (
                    <DownloadQueue
                      items={tasks}
                      onPause={(idx) => getApi().pauseTask(idx)}
                      onResume={(idx) => getApi().resumeTask(idx)}
                      onRemove={(idx) => getApi().removeTask(idx)}
                      onClear={() => getApi().cleanTask()}
                    />
                  )}
                </div>
              </>
            ) : view.type === "chapters" ? (
              <ChapterSelector
                mangaUrl={view.url}
                onBack={() => setView({ type: "search", tab: "search" })}
                onDownload={handleDownload}
                onRead={handleRead}
                downloadPath={downloadPath}
              />
            ) : (
              <DownloadedFiles
                comic={view.comic}
                onBack={() => setView({ type: "search", tab: "downloaded" })}
                onRead={handleRead}
                onSelectOnline={handleSelectManga}
              />
            )}
          </motion.div>
        </div>
      </main>

      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        downloadPath={downloadPath}
        setDownloadPath={(path) => {
          setDownloadPath(path);
          localStorage.setItem('downloadPath', path);
        }}
        packType={packType}
        setPackType={(type) => {
          setPackType(type);
          localStorage.setItem('packType', type);
        }}
      />
    </div>
  );
};

export default Index;
