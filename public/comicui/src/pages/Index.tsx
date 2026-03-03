import { useState, useEffect, useCallback } from "react";
import { BookOpen, Download, Settings } from "lucide-react";
import ComicSearch from "@/components/ComicSearch";
import ChapterSelector from "@/components/ChapterSelector";
import DownloadedFiles from "@/components/DownloadedFiles";
import DownloadQueue from "@/components/DownloadQueue";
import SettingsDialog from "@/components/SettingsDialog";
import { type Site, type SearchResult, type MangaInfo, type TaskItem, type DownloadedComic, getApi } from "@/lib/api";
import { motion } from "framer-motion";

type View = { type: "search" } | { type: "chapters"; url: string } | { type: "downloaded"; comic: DownloadedComic };

const Index = () => {
  const [view, setView] = useState<View>({ type: "search" });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
    } catch (err) {
      console.error('Fetch downloaded comics error:', err);
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
      if (!downloadPath) {
        const appPath = await getApi().appPath();
        setShowSettings(true);
      }
      const taskList = await getApi().getTaskList();
      setTasks(taskList);
      await fetchDownloadedComics();
    };
    init();
  }, []);

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

  const handleSearch = useCallback(async (keyword: string) => {
    setLoading(true);
    try {
      localStorage.setItem('lastKeyword', keyword);
      localStorage.setItem('selectedSite', selectedSite);
      const results = await getApi().searchInSite(selectedSite, keyword);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
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
    setView({ type: "search" });
  }, [downloadPath, packType]);

  const handleRead = useCallback((chapterUrl: string) => {
    window.open(chapterUrl, '_blank');
  }, []);

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
            <h1 className="manga-header text-3xl tracking-wide">漫画下载器</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
              <Download className="w-4 h-4" />
              {completedCount}/{tasks.length} 完成
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
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
