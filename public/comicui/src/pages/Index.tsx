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

type View = { type: "search" } | { type: "chapters"; url: string } | { type: "downloaded"; comic: DownloadedComic };

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
    return saved ? JSON.parse(saved) : { type: "search" };
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
          comics.push({ title: dir, path: dirPath, files: comicFiles });
        }
      }
      setDownloadedComics(comics);
    } catch {
      // Silently fail - UI will remain empty
    }
  }, [downloadPath]);

  const handleSelectDownloaded = useCallback((comic: DownloadedComic) => {
    setView({ type: "downloaded", comic });
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
      setTasks(taskList);
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
      setTasks(taskList);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    setView({ type: "search" });
  }, [downloadPath, packType]);

  const handleRead = useCallback((filePath: string) => {
    const comicId = encodeURIComponent(filePath);
    navigate(`/viewer/${comicId}/1`);
  }, [navigate]);

  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="ink-wash fixed inset-0 pointer-events-none z-0" />

      <header className="relative z-10 border-b-[3px] border-foreground bg-background speed-lines h-16">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground flex items-center justify-center border-2 border-foreground">
              <BookOpen className="w-5 h-5 text-background" />
            </div>
            <h1 className="manga-header text-3xl tracking-wide">Manmori</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
              <Download className="w-4 h-4" />
              {completedCount}/{tasks.length} 完成
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container max-w-6xl mx-auto px-4 py-4 screentone" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        <div className="manga-grid h-full">
          <div className="manga-frame-cell h-full overflow-hidden">
            <motion.div
              key={view.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {view.type === "search" ? (
                <ComicSearch
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
              ) : view.type === "chapters" ? (
                <ChapterSelector
                  mangaUrl={view.url}
                  onBack={() => setView({ type: "search" })}
                  onDownload={handleDownload}
                  onRead={handleRead}
                  downloadPath={downloadPath}
                />
              ) : (
                <DownloadedFiles
                  comic={view.comic}
                  onBack={() => setView({ type: "search" })}
                  onRead={handleRead}
                />
              )}
            </motion.div>
          </div>

          <div className="manga-frame-cell h-full overflow-hidden">
            <div className="h-full overflow-hidden">
              <DownloadQueue
                items={tasks}
                onPause={(idx) => getApi().pauseTask(idx)}
                onResume={(idx) => getApi().resumeTask(idx)}
                onRemove={(idx) => getApi().removeTask(idx)}
                onClear={() => getApi().cleanTask()}
              />
            </div>
          </div>
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
