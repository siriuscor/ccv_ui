import { ArrowLeft, FolderOpen, FileText, Eye, BookOpen, ExternalLink } from "lucide-react";
import { type DownloadedComic } from "@/lib/api";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import MangaHeader from "./MangaHeader";

type Props = {
  comic: DownloadedComic;
  onBack: () => void;
  onRead: (path: string) => void;
  onSelectOnline?: (url: string) => void;
};

export default function DownloadedFiles({ comic, onBack, onRead, onSelectOnline }: Props) {
  const getFileIcon = (filename: string) => {
    if (filename.match(/\.(cbz|zip)$/i)) {
      return <span className="text-xs text-manga-gold">📦</span>;
    } else if (filename.match(/\.epub$/i)) {
      return <span className="text-xs text-accent">📚</span>;
    }
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const getFileLabel = (filename: string) => {
    return filename.replace(/\.(cbz|zip|epub)$/i, '');
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded shrink-0 w-fit">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <MangaHeader 
        mangaInfo={comic.mangaInfo}
        title={comic.title}
        extra={comic.mangaInfo?.web && onSelectOnline && (
          <button
            onClick={() => onSelectOnline(comic.mangaInfo!.web)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border-2 border-foreground font-black italic text-xs hover:bg-foreground hover:text-background transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            去源站下载
          </button>
        )}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-sm font-black italic mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> 已下载章节 ({comic.files.length})
        </h3>
        <ScrollArea className="flex-1 border-2 border-foreground bg-card screentone">
          <div className="grid grid-cols-2 gap-px bg-foreground/10 p-px">
            {comic.files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2.5 bg-card hover:bg-muted transition-colors group"
              >
                <div className="shrink-0">{getFileIcon(file)}</div>
                <span className="flex-1 text-sm font-bold truncate group-hover:text-accent transition-colors">
                  {getFileLabel(file)}
                </span>
                <button
                  onClick={() => onRead(comic.path + '/' + file)}
                  className="p-1.5 bg-foreground text-background hover:bg-accent hover:text-foreground transition-all shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                  title="阅读"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}
