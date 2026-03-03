import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { MOCK_COMICS, generateChapters, generateMockPages } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Viewer() {
  const { comicId, chapterNum } = useParams();
  const navigate = useNavigate();

  const comic = MOCK_COMICS.find(c => c.id === comicId);
  const chapters = useMemo(() => (comic ? generateChapters(comic) : []), [comic]);
  const currentChapter = chapters.find(ch => ch.number === Number(chapterNum));

  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const pages = useMemo(
    () => (currentChapter ? generateMockPages(currentChapter.number, currentChapter.pages) : []),
    [currentChapter]
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [chapterNum]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setCurrentPage(p => Math.min(p + 1, pages.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentPage(p => Math.max(p - 1, 0));
      } else if (e.key === "Escape") {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pages.length]);

  if (!comic || !currentChapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center manga-panel p-8">
          <p className="font-serif text-2xl">未找到漫画</p>
          <button onClick={() => navigate("/")} className="mt-4 text-accent hover:underline">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const prevChapter = chapters.find(ch => ch.number === currentChapter.number - 1);
  const nextChapter = chapters.find(ch => ch.number === currentChapter.number + 1);

  return (
    <div className={`min-h-screen bg-background ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b-[3px] border-foreground bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </button>

          <div className="text-center flex-1 min-w-0 px-4">
            <h1 className="font-serif text-lg truncate">{comic.title}</h1>
            <p className="text-xs text-muted-foreground">
              第{currentChapter.number}话 · {currentPage + 1}/{pages.length}
            </p>
          </div>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Page viewer */}
      <main className="container max-w-3xl mx-auto px-4 py-6">
        {/* Main image */}
        <div className="relative flex items-center justify-center">
          {/* Prev overlay */}
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
            disabled={currentPage === 0}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer disabled:cursor-default group"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 p-2 border border-border">
              <ChevronLeft className="w-6 h-6" />
            </div>
          </button>

          {/* Next overlay */}
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, pages.length - 1))}
            disabled={currentPage === pages.length - 1}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer disabled:cursor-default group"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 p-2 border border-border">
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>

          <AnimatePresence mode="wait">
            <motion.img
              key={currentPage}
              src={pages[currentPage]}
              alt={`第${currentPage + 1}页`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="manga-page w-full max-w-2xl mx-auto bg-card"
              loading="lazy"
            />
          </AnimatePresence>
        </div>

        {/* Page indicator dots */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-1 bg-card border border-border px-3 py-2">
            <span className="text-sm text-muted-foreground mr-2">页码</span>
            <input
              type="range"
              min={0}
              max={pages.length - 1}
              value={currentPage}
              onChange={e => setCurrentPage(Number(e.target.value))}
              className="w-40 accent-foreground"
            />
            <span className="text-sm font-bold ml-2">
              {currentPage + 1}/{pages.length}
            </span>
          </div>
        </div>

        {/* Chapter navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!prevChapter}
            onClick={() => prevChapter && navigate(`/viewer/${comic.id}/${prevChapter.number}`)}
            className="manga-panel-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一话
          </Button>
          <span className="font-serif text-lg">第{currentChapter.number}话</span>
          <Button
            variant="outline"
            disabled={!nextChapter}
            onClick={() => nextChapter && navigate(`/viewer/${comic.id}/${nextChapter.number}`)}
            className="manga-panel-sm"
          >
            下一话
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Thumbnail strip */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2 font-serif">缩略图</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {pages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`shrink-0 w-14 h-20 border-2 transition-all ${
                    i === currentPage
                      ? "border-accent shadow-md"
                      : "border-border opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt={`缩略图 ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
