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
      className="bg-card p-3 text-left hover:bg-muted transition-colors cursor-pointer group border-b border-r border-border"
    >
      <div className="flex gap-3">
        <div className={`w-16 h-22 shrink-0 flex items-center justify-center border-2 border-foreground ${isDownloaded ? "bg-manga-success" : "bg-primary"
          }`}>
          {result.cover ? (
            <img src={result.cover} alt={result.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-foreground font-serif text-2xl font-bold">
              {result.title[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg leading-tight truncate group-hover:text-accent transition-colors" title={result.title}>
              {result.title}
            </h3>
            {isDownloaded && <CheckCircle className="w-4 h-4 text-manga-success shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">{result.author || '未知作者'}</p>
        </div>
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
      className="bg-card p-3 text-left hover:bg-muted transition-colors cursor-pointer group border-b border-r border-border last:border-b-0"
    >
      <div className="flex gap-3">
        {comic.mangaInfo && comic.mangaInfo.cover ? (
          <div className="w-16 h-22 shrink-0 flex items-center justify-center border-2 border-foreground bg-manga-success">
            <img src={comic.mangaInfo.cover} alt={comic.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-22 shrink-0 flex items-center justify-center border-2 border-foreground bg-manga-success">
            <FolderOpen className="w-8 h-8 text-primary-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg leading-tight truncate group-hover:text-accent transition-colors" title={comic.mangaInfo?.title || comic.title}>
              {comic.mangaInfo?.title || comic.title}
            </h3>
            <CheckCircle className="w-4 h-4 text-manga-success shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground truncate">{comic.mangaInfo?.author || `${comic.files.length} 个文件`}</p>
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Header - Only visible in search tab */}
      {activeTab === "search" && (
        <div className="border-b-[3px] border-foreground pb-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-foreground shrink-0" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索资源..."
                className="border-0 bg-transparent text-lg font-black italic focus-visible:ring-0 placeholder:text-muted-foreground px-0"
              />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />}
            </div>

            <div className="flex items-center gap-2 pr-1 border-l-[3px] border-foreground/20 pl-4">
              <select
                value={selectedSite}
                onChange={e => onSiteChange(e.target.value)}
                className="bg-transparent text-sm font-black italic cursor-pointer text-foreground hover:text-accent focus-visible:outline-none focus:outline-none appearance-none"
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
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-2 manga-frame-section">
            {activeTab === "search" ? (
              searchResults.length > 0 ? (
                searchResults.map(result => renderComic(result, downloadedComics.some(d => d.title === result.title)))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground screentone col-span-2">
                  <Search className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-serif italic font-bold">待机中...</p>
                </div>
              )
            ) : (
              downloadedComics.length > 0 ? (
                downloadedComics.map(renderDownloadedComic)
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground screentone">
                  <FolderOpen className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-serif italic font-bold">暂无存档</p>
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
