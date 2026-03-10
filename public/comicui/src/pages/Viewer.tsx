import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Settings,
  Grid3X3,
  BookOpen,
  Sun,
  ArrowRight,
  ArrowDown,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ReadingMode = "ltr" | "rtl" | "vertical";

export default function Viewer() {
  const { comicId, chapterNum } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const filePath = useMemo(() => {
    if (!comicId) return "";
    return decodeURIComponent(comicId);
  }, [comicId]);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>("rtl");
  const [showSettings, setShowSettings] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [isVertical, setIsVertical] = useState(false);
  const [pageCache, setPageCache] = useState<Record<number, string>>({});

  const totalPages = images.length;
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      if (!filePath) {
        setError("无效的文件路径");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const imageList = await window.api.getComicFiles(filePath);
        if (imageList.length === 0) {
          setError("无法读取漫画文件或文件中没有图片");
        } else {
          setImages(imageList);
          setCurrentPage(0);
          setPageCache({});
        }
      } catch (e) {
        setError("加载漫画失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
      setLoading(false);
    };

    loadImages();
  }, [filePath]);

  useEffect(() => {
    const loadPage = async () => {
      if (images.length === 0 || pageCache[currentPage]) return;
      
      try {
        const imageData = await window.api.getComicImage(filePath, images[currentPage]);
        if (imageData) {
          setPageCache(prev => ({ ...prev, [currentPage]: imageData }));
        }
      } catch (e) {
        console.error("Failed to load page:", e);
      }
    };

    loadPage();
  }, [currentPage, images, filePath, pageCache]);

  const preloadPages = useCallback((page: number) => {
    const pagesToPreload = [page - 1, page + 1].filter(p => p >= 0 && p < images.length);
    pagesToPreload.forEach(async (p) => {
      if (!pageCache[p]) {
        try {
          const imageData = await window.api.getComicImage(filePath, images[p]);
          if (imageData) {
            setPageCache(prev => ({ ...prev, [p]: imageData }));
          }
        } catch (e) {
          console.error("Failed to preload page:", e);
        }
      }
    });
  }, [images.length, filePath, images, pageCache]);

  useEffect(() => {
    if (images.length > 0 && currentPage < images.length) {
      preloadPages(currentPage);
    }
  }, [currentPage, images.length, preloadPages, images]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    resetControlsTimer();
  }, [filePath, resetControlsTimer]);

  useEffect(() => {
    resetControlsTimer();
  }, [currentPage, resetControlsTimer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (readingMode === "rtl") {
          setCurrentPage(p => Math.max(p - 1, 0));
        } else {
          setCurrentPage(p => Math.min(p + 1, totalPages - 1));
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (readingMode === "rtl") {
          setCurrentPage(p => Math.min(p + 1, totalPages - 1));
        } else {
          setCurrentPage(p => Math.max(p - 1, 0));
        }
      } else if (e.key === "Escape") {
        if (fullscreen) {
          setFullscreen(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else if (showThumbnails) {
          setShowThumbnails(false);
        } else {
          navigate("/");
        }
      } else if (e.key === " " || e.key === "Enter") {
        setShowControls(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages, readingMode, fullscreen, showSettings, showThumbnails, navigate]);

  useEffect(() => {
    if (fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [fullscreen]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    if (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime) {
      if (readingMode === "rtl") {
        if (deltaX > 0) {
          setCurrentPage(p => Math.min(p + 1, totalPages - 1));
        } else {
          setCurrentPage(p => Math.max(p - 1, 0));
        }
      } else {
        if (deltaX < 0) {
          setCurrentPage(p => Math.min(p + 1, totalPages - 1));
        } else {
          setCurrentPage(p => Math.max(p - 1, 0));
        }
      }
    } else if (Math.abs(deltaY) > minSwipeDistance && deltaTime < maxSwipeTime && isVertical) {
      if (deltaY > 0) {
        setCurrentPage(p => Math.min(p + 1, totalPages - 1));
      } else {
        setCurrentPage(p => Math.max(p - 1, 0));
      }
    }
    
    touchStartRef.current = null;
  }, [totalPages, readingMode, isVertical]);

  const handleTapZone = useCallback((zone: "left" | "center" | "right") => {
    resetControlsTimer();
    if (zone === "center") {
      setShowControls(prev => !prev);
      return;
    }
    
    if (readingMode === "rtl") {
      if (zone === "left") {
        setCurrentPage(p => Math.min(p + 1, totalPages - 1));
      } else {
        setCurrentPage(p => Math.max(p - 1, 0));
      }
    } else {
      if (zone === "right") {
        setCurrentPage(p => Math.min(p + 1, totalPages - 1));
      } else {
        setCurrentPage(p => Math.max(p - 1, 0));
      }
    }
  }, [totalPages, readingMode, resetControlsTimer]);

  const getComicTitle = () => {
    if (!filePath) return "未知漫画";
    const fileName = filePath.split('/').pop() || "";
    return fileName.replace(/\.(cbz|zip|epub)$/i, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="font-serif text-xl">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center manga-panel p-8">
          <p className="font-serif text-xl text-destructive mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="text-accent hover:underline">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
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

  const currentImage = pageCache[currentPage];
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div 
      ref={containerRef}
      className={`reader-container ${fullscreen ? "reader-fullscreen" : ""}`}
      style={{ filter: `brightness(${brightness}%)` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => resetControlsTimer()}
    >
      <div className="reader-progress" style={{ width: `${progress}%` }} />

      {isVertical ? (
        <div className="reader-vertical pt-16 pb-24 px-4">
          {images.map((imgName, i) => (
            <div key={i} className="mb-4">
              {pageCache[i] ? (
                <img
                  src={pageCache[i]}
                  alt={`第${i + 1}页`}
                  className="w-full max-w-2xl mx-auto"
                  loading={i < 2 ? "eager" : "lazy"}
                />
              ) : (
                <div className="w-full max-w-2xl mx-auto h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="reader-surface">
          <div 
            className="reader-tap-zone reader-tap-zone-left"
            onClick={(e) => { e.stopPropagation(); handleTapZone("left"); }}
          />
          <div 
            className="reader-tap-zone reader-tap-zone-center"
            onClick={(e) => { e.stopPropagation(); handleTapZone("center"); }}
          />
          <div 
            className="reader-tap-zone reader-tap-zone-right"
            onClick={(e) => { e.stopPropagation(); handleTapZone("right"); }}
          />

          <AnimatePresence mode="wait">
            {currentImage ? (
              <motion.img
                key={currentPage}
                src={currentImage}
                alt={`第${currentPage + 1}页`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="manga-page-paper max-h-[calc(100vh-120px)] max-w-full object-contain"
                style={{ 
                  marginTop: 'env(safe-area-inset-top, 0px)',
                  marginBottom: 'env(safe-area-inset-bottom, 0px)'
                }}
              />
            ) : (
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showControls && (
          <motion.header 
            className="reader-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => navigate("/")}
                className="reader-icon-btn flex items-center gap-2"
                aria-label="返回"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">返回</span>
              </button>

              <div className="text-center flex-1 min-w-0 px-4">
                <h1 className="reader-chapter-title text-base truncate">{getComicTitle()}</h1>
                <p className="reader-page-indicator text-xs">
                  {currentPage + 1}/{totalPages}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowThumbnails(!showThumbnails); }}
                  className={`reader-icon-btn ${showThumbnails ? "bg-reader-surface" : ""}`}
                  aria-label="缩略图"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                  className={`reader-icon-btn ${showSettings ? "bg-reader-surface" : ""}`}
                  aria-label="设置"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setFullscreen(!fullscreen); }}
                  className="reader-icon-btn"
                  aria-label={fullscreen ? "退出全屏" : "全屏"}
                >
                  {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && showSettings && (
          <motion.div
            className="reader-settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="reader-chapter-title text-sm">阅读设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="reader-icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-reader-muted mb-2 block">阅读方向</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setReadingMode("ltr"); setIsVertical(false); }}
                    className={`reader-mode-btn flex items-center gap-1 ${readingMode === "ltr" && !isVertical ? "active" : ""}`}
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>从左到右</span>
                  </button>
                  <button
                    onClick={() => { setReadingMode("rtl"); setIsVertical(false); }}
                    className={`reader-mode-btn flex items-center gap-1 ${readingMode === "rtl" && !isVertical ? "active" : ""}`}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>从右到左</span>
                  </button>
                  <button
                    onClick={() => { setIsVertical(true); }}
                    className={`reader-mode-btn flex items-center gap-1 ${isVertical ? "active" : ""}`}
                  >
                    <ArrowDown className="w-3 h-3" />
                    <span>垂直滚动</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-reader-muted mb-2 block flex items-center gap-2">
                  <Sun className="w-3 h-3" />
                  亮度
                </label>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="reader-brightness"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && showThumbnails && (
          <motion.div
            className="reader-footer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="reader-chapter-title text-sm">选择页面</h3>
                <button
                  onClick={() => setShowThumbnails(false)}
                  className="reader-icon-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="reader-thumbnails">
                {images.map((imgName, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i);
                      setShowThumbnails(false);
                    }}
                    className={`reader-thumbnail ${i === currentPage ? "active" : ""}`}
                  >
                    {pageCache[i] ? (
                      <img src={pageCache[i]} alt={`第${i + 1}页`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && !isVertical && !showThumbnails && (
          <motion.footer 
            className="reader-footer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="reader-page-indicator text-xs min-w-[40px]">
                  {currentPage + 1}
                </span>
                <input
                  type="range"
                  min={0}
                  max={totalPages - 1}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="reader-slider flex-1"
                />
                <span className="reader-page-indicator text-xs min-w-[40px] text-right">
                  {totalPages}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                  className="reader-nav-btn flex items-center gap-1 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">上一页</span>
                </button>

                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-reader-muted" />
                  <span className="reader-page-indicator text-sm">
                    {currentPage + 1} / {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="reader-nav-btn flex items-center gap-1 text-sm"
                >
                  <span className="hidden sm:inline">下一页</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
