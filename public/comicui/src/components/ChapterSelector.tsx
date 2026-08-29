import { useState, useMemo, useEffect, useRef, type MouseEvent } from "react";
import { ArrowLeft, Download, CheckSquare, Square, ChevronsUpDown, Loader2, Eye, ListRestart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MangaInfo, getApi } from "@/lib/api";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import MangaHeader from "./MangaHeader";

type Props = {
  mangaUrl: string;
  onBack: () => void;
  onDownload: (mangaInfo: MangaInfo, chapters: { title: string; url: string }[]) => void;
  onRead?: (chapterUrl: string) => void;
  downloadPath: string;
};

export default function ChapterSelector({ mangaUrl, onBack, onDownload, onRead, downloadPath }: Props) {
  const [mangaInfo, setMangaInfo] = useState<MangaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(true);
  const [downloadedChapters, setDownloadedChapters] = useState<Set<string>>(new Set());
  const lastSelectedIndex = useRef<number | null>(null);

  useEffect(() => {
    const fetchMangaInfo = async () => {
      setLoading(true);
      try {
        const info = await getApi().getMangaInfo(mangaUrl);
        setMangaInfo(info);
        if (downloadPath && info.title) {
          const path = downloadPath + '/' + info.title + '/';
          const files = await getApi().listDir(path);
          setDownloadedChapters(new Set(files.map(f => f.replace(/\.(cbz|epub|zip)$/i, ''))));
        }
      } catch {
        // Failed to load manga info
      }
      setLoading(false);
    };
    fetchMangaInfo();
  }, [mangaUrl, downloadPath]);

  const computeWeight = (title: string) => {
    // 第n卷 -> weight: 0-9999
    const juanMatch = title.match(/第\s*([\d.]+)\s*卷/);
    if (juanMatch) {
      return parseFloat(juanMatch[1]);
    }
    // 第n回/第n话 -> weight: 10000-19999
    const huiMatch = title.match(/第\s*([\d.]+)\s*[回話话]/);
    if (huiMatch) {
      return 10000 + parseFloat(huiMatch[1]);
    }
    // 无法识别的 -> 排在最后
    return 100000;
  };

  const sortedChapters = useMemo(() => {
    if (!mangaInfo) return [];
    return [...mangaInfo.chapters].sort((a, b) =>
      sortAsc ? computeWeight(a.title) - computeWeight(b.title) : computeWeight(b.title) - computeWeight(a.title)
    );
  }, [mangaInfo, sortAsc]);

  const toggleChapter = (index: number, shiftKey: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);

      if (shiftKey && lastSelectedIndex.current !== null) {
        const start = Math.min(lastSelectedIndex.current, index);
        const end = Math.max(lastSelectedIndex.current, index);
        for (let i = start; i <= end; i += 1) {
          next.add(sortedChapters[i].url);
        }
        lastSelectedIndex.current = index;
        return next;
      }

      const chapterUrl = sortedChapters[index].url;
      if (next.has(chapterUrl)) {
        next.delete(chapterUrl);
        if (lastSelectedIndex.current === index) {
          lastSelectedIndex.current = null;
        }
      } else {
        next.add(chapterUrl);
        lastSelectedIndex.current = index;
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!mangaInfo) return;
    lastSelectedIndex.current = null;
    if (selected.size === mangaInfo.chapters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(mangaInfo.chapters.map(chapter => chapter.url)));
    }
  };

  const invertSelection = () => {
    if (!mangaInfo) return;
    lastSelectedIndex.current = null;
    setSelected(prev => new Set(mangaInfo.chapters.map(chapter => chapter.url).filter(url => !prev.has(url))));
  };

  const selectedChapters = sortedChapters.filter(chapter => selected.has(chapter.url));

  if (loading) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded">
          <ArrowLeft className="w-4 h-4" /> 返回搜索
        </button>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  if (!mangaInfo) return null;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded">
        <ArrowLeft className="w-4 h-4" /> 返回搜索
      </button>

      {/* Comic info panel */}
      <MangaHeader 
        mangaInfo={mangaInfo}
        title={mangaInfo.title}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button onClick={toggleAll} className="flex items-center gap-1.5 text-sm hover:text-foreground text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1">
            {selected.size === mangaInfo.chapters.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selected.size === mangaInfo.chapters.length ? "取消全选" : "全选"}
          </button>
          <button onClick={invertSelection} className="flex items-center gap-1.5 text-sm hover:text-foreground text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1">
            <ListRestart className="w-4 h-4" />
            反选
          </button>
          <button onClick={() => {
            lastSelectedIndex.current = null;
            setSortAsc(!sortAsc);
          }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1">
            <ChevronsUpDown className="w-4 h-4" />
            {sortAsc ? "正序" : "倒序"}
          </button>
        </div>
        <span className="text-sm text-muted-foreground">
          已选 {selected.size} 话
        </span>
      </div>

      <ScrollArea className="h-[300px] border-2 border-foreground bg-card">
        <div className="grid grid-cols-3 gap-px bg-border p-px">
          {sortedChapters.map((ch, idx) => {
            const isSelected = selected.has(ch.url);
            const isDownloaded = downloadedChapters.has(ch.title);
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 px-2.5 py-2 transition-colors bg-card ${isDownloaded ? "bg-manga-success/10" :
                    isSelected ? "bg-secondary" : "hover:bg-muted"
                  }`}
              >
                <button
                  onClick={(event: MouseEvent<HTMLButtonElement>) => toggleChapter(idx, event.shiftKey)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                  {isDownloaded ? (
                    <span className="text-manga-success text-xs font-bold">✓</span>
                  ) : isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-foreground shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm font-bold truncate ${isDownloaded ? 'line-through text-muted-foreground' : ''}`}>
                    {ch.title}
                  </span>
                </button>
                {isDownloaded && onRead && (
                  <button
                    onClick={() => onRead(ch.url)}
                    className="p-1 text-muted-foreground hover:text-accent transition-colors shrink-0"
                    title="阅读"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {selected.size > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-2"
        >
          <Button
            onClick={() => onDownload(mangaInfo, selectedChapters)}
            className="w-full border-2 border-foreground bg-primary text-primary-foreground font-bold py-3 hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            下载 {selected.size} 话
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
