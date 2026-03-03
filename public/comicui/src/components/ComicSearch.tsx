import { useState, useEffect } from "react";
import { Search, CheckCircle, Loader2, FolderOpen, ArrowLeft, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Site, type SearchResult, type DownloadedComic, getApi } from "@/lib/api";
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
  onSearch 
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "downloaded">("search");

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
      className="bg-card p-3 text-left hover:bg-muted transition-colors cursor-pointer group border-b border-r border-border last:border-b-0"
    >
      <div className="flex gap-3">
        <div className={`w-16 h-22 shrink-0 flex items-center justify-center border-2 border-foreground ${
          isDownloaded ? "bg-manga-success" : "bg-primary"
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
            <h3 className="font-serif text-lg leading-tight truncate group-hover:text-accent transition-colors">
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
        <div className="w-16 h-22 shrink-0 flex items-center justify-center border-2 border-foreground bg-manga-success">
          <FolderOpen className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg leading-tight truncate group-hover:text-accent transition-colors">
              {comic.title}
            </h3>
            <CheckCircle className="w-4 h-4 text-manga-success shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground">{comic.files.length} 个文件</p>
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex border-b-2 border-foreground">
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 font-bold text-sm transition-colors ${
            activeTab === "search" 
              ? "border-b-2 border-foreground -mb-px text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-4 h-4 inline mr-1" />
          搜索
        </button>
        <button
          onClick={() => setActiveTab("downloaded")}
          className={`px-4 py-2 font-bold text-sm transition-colors ${
            activeTab === "downloaded" 
              ? "border-b-2 border-foreground -mb-px text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          已下载 ({downloadedComics.length})
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === "search" && (
        <div className="border-b-[3px] border-foreground pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-foreground shrink-0" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索漫画..."
                className="border-0 bg-transparent text-lg font-bold focus-visible:ring-0 placeholder:text-muted-foreground placeholder:font-normal"
              />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            </div>
            {sites.length > 0 && (
              <>
                <div className="w-px h-6 bg-foreground/30" />
                <select
                  value={selectedSite}
                  onChange={e => onSiteChange(e.target.value)}
                  className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer text-foreground hover:text-accent"
                >
                  {sites.map(site => (
                    <option key={site.id} value={site.id} className="bg-card">{site.name}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "search" ? (
        <div className="manga-frame-section">
          <div className="manga-section-label">
            <Search className="w-4 h-4" />
            搜索结果 ({searchResults.length})
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {searchResults.map(c => renderComic(c, false))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>输入关键词搜索漫画</p>
            </div>
          )}
        </div>
      ) : (
        <div className="manga-frame-section">
          <div className="manga-section-label">
            <CheckCircle className="w-4 h-4" />
            已下载 ({downloadedComics.length})
          </div>
          {downloadedComics.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {downloadedComics.map(c => renderDownloadedComic(c))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-8 h-8 mx-auto mb-2" />
              <p>暂无已下载漫画</p>
              <p className="text-sm mt-1">在设置中配置下载路径</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
