import { useState, useEffect } from "react";
import { Search, CheckCircle, Loader2, FolderOpen, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Site, type SiteStatus, type SearchResult, type DownloadedComic, getApi } from "@/lib/api";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  onSelect: (url: string, result: SearchResult) => void;
  onSelectDownloaded: (comic: DownloadedComic) => void;
  sites: Site[];
  selectedSite: string;
  onSiteChange: (site: string) => void;
  searchResults: SearchResult[];
  downloadedComics: DownloadedComic[];
  loading?: boolean;
  siteStatuses?: Record<string, SiteStatus>;
  activeTab: "search" | "downloaded";
  onSearch: (keyword: string) => void;
};

export default function ComicSearch({
  onSelect,
  onSelectDownloaded,
  sites,
  selectedSite,
  onSiteChange,
  searchResults,
  downloadedComics = [],
  loading = false,
  siteStatuses = {},
  onSearch,
  activeTab
}: Props) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const renderComic = (result: SearchResult, isDownloaded: boolean = false) => (
    <motion.button
      key={result.url}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(result.url, result)}
      className="bg-white p-3 text-left transition-all cursor-pointer group border-[3px] border-foreground rounded-2xl shadow-comic hover:-translate-y-1 hover:-translate-x-1 hover:shadow-comic-md hover:scale-[1.02] active:translate-y-0 active:translate-x-0 active:shadow-none flex flex-col relative overflow-hidden"
    >
      <div className={`w-full aspect-[3/4] shrink-0 flex items-center justify-center border-[3px] border-foreground bg-manga-gold/20 overflow-hidden relative transition-transform`}>
        {result.cover ? (
          <img src={result.cover} alt={result.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-foreground font-serif text-5xl font-black italic opacity-50">
            {result.title[0]}
          </span>
        )}
        {isDownloaded && (
          <div className="absolute top-2 right-2 bg-manga-success text-white px-2 py-1 rounded-lg border-2 border-foreground font-black text-xs rotate-[-5deg] shadow-sm">
            已下载
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-3">
        <h3 className="font-serif text-base font-black leading-tight truncate group-hover:text-manga-red transition-colors" title={result.title}>
          {result.title}
        </h3>
        <p className="text-sm font-bold text-muted-foreground truncate mt-1">{result.author || '未知作者'}</p>
      </div>
    </motion.button>
  );

  const renderDownloadedComic = (comic: DownloadedComic) => (
    <motion.button
      key={comic.path}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelectDownloaded(comic)}
      className="bg-white p-3 text-left transition-all cursor-pointer group border-[3px] border-foreground shadow-comic hover:-translate-y-1 hover:-translate-x-1 hover:shadow-comic-md hover:scale-[1.02] active:translate-y-0 active:translate-x-0 active:shadow-none flex flex-col"
    >
      <div className={`w-full aspect-[3/4] shrink-0 flex items-center justify-center border-[3px] border-foreground rounded-lg bg-manga-success/20 overflow-hidden relative transition-transform`}>
        {comic.mangaInfo && comic.mangaInfo.cover ? (
          <>
            <img src={comic.mangaInfo.cover} alt={comic.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
            <div className="absolute inset-0 border-[3px] border-foreground rounded-lg pointer-events-none" />
          </>
        ) : (
          <FolderOpen className="w-12 h-12 text-foreground opacity-50" />
        )}
        <div className="absolute bottom-2 right-2 bg-white text-foreground px-2 py-1 rounded-lg border-2 border-foreground font-black text-xs rotate-[3deg] shadow-sm">
          {comic.files.length} 卷
        </div>
      </div>
      <div className="min-w-0 flex-1 pt-3">
        <h3 className="font-serif text-base font-black leading-tight truncate group-hover:text-manga-success transition-colors" title={comic.mangaInfo?.title || comic.title}>
          {comic.mangaInfo?.title || comic.title}
        </h3>
        <p className="text-sm font-bold text-muted-foreground truncate mt-1">{comic.mangaInfo?.author || `本地缓存`}</p>
      </div>
    </motion.button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 max-h-full">
      {/* Search Header - Only visible in search tab */}
      {activeTab === "search" && (
        <div className="relative mb-6 pr-1">
          <div className="flex items-center gap-2 bg-white border-[3px] border-foreground p-2 shadow-comic">
            <div className="flex items-center gap-2 flex-1 pl-2">
              <Search className="w-6 h-6 text-foreground shrink-0" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索漫画资源..."
                className="border-0 bg-transparent text-xl font-black italic focus-visible:ring-0 placeholder:text-muted-foreground px-2 h-12"
              />
              {loading && <Loader2 className="w-6 h-6 animate-spin text-manga-red mr-2" />}
            </div>

            <div className="flex items-center gap-2 pr-2 border-l-[3px] border-foreground pl-4 h-8">
              <select
                value={selectedSite}
                onChange={e => onSiteChange(e.target.value)}
                className="bg-transparent text-base font-black italic cursor-pointer text-foreground hover:text-manga-red focus-visible:outline-none focus:outline-none appearance-none"
              >
                {sites.map(site => {
                  const status = siteStatuses[site.id];
                  let statusText = "";
                  if (status) {
                    if (status.status === 'ok') statusText = ` (${status.latency}ms)`;
                    else if (status.status === 'timeout') statusText = " (超时)";
                    else statusText = " (错误)";
                  }
                  return (
                    <option key={site.id} value={site.id} className="bg-card">
                      {site.name}{statusText}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 pr-1 pb-2">
            {activeTab === "search" ? (
              searchResults.length > 0 ? (
                searchResults.map(result => renderComic(result, downloadedComics.some(d => d.title === result.title)))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 col-span-3 lg:col-span-4 bg-white border-[3px] border-foreground shadow-comic">
                  <div className="relative mb-6">
                    <Search className="w-16 h-16 opacity-20" />
                    <div className="absolute -top-4 -right-8 bg-manga-gold text-foreground border-[3px] border-foreground rounded-xl px-3 py-1 shadow-sm rotate-12 font-black italic text-lg z-10">
                      Zzz...
                    </div>
                  </div>
                  <p className="font-serif italic font-black text-2xl">待机中...</p>
                  <p className="text-muted-foreground font-bold mt-2">输入你想看的漫画</p>
                </div>
              )
            ) : (
              downloadedComics.length > 0 ? (
                downloadedComics.map(renderDownloadedComic)
              ) : (
                <div className="flex flex-col items-center justify-center py-20 col-span-3 lg:col-span-4 bg-white border-[3px] border-foreground rounded-2xl shadow-comic">
                  <div className="relative mb-6">
                    <FolderOpen className="w-16 h-16 opacity-20" />
                  </div>
                  <p className="font-serif italic font-black text-2xl">空空如也</p>
                  <p className="text-muted-foreground font-bold mt-2">去搜索下载一些漫画吧！</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
