import { ArrowLeft, FolderOpen, FileText, Eye } from "lucide-react";
import { type DownloadedComic } from "@/lib/api";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  comic: DownloadedComic;
  onBack: () => void;
  onRead: (path: string) => void;
};

export default function DownloadedFiles({ comic, onBack, onRead }: Props) {
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
    >
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="border-b-2 border-foreground pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 bg-manga-success flex items-center justify-center border-2 border-foreground">
            <FolderOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold">{comic.title}</h2>
            <p className="text-sm text-muted-foreground">{comic.files.length} 个文件</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px] border-2 border-foreground bg-card">
        <div className="p-2">
          {comic.files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded hover:bg-muted transition-colors"
            >
              {getFileIcon(file)}
              <span className="flex-1 text-sm font-medium truncate">{getFileLabel(file)}</span>
              <button
                onClick={() => onRead(comic.path + '/' + file)}
                className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                title="阅读"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
