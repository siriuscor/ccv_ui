import { CheckCircle, XCircle, Loader2, Clock, Trash2, Play, Pause } from "lucide-react";
import { type TaskItem } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  items: TaskItem[];
  onPause: (index: number) => void;
  onResume: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
};

const STATUS_ICON = {
  downloading: <Loader2 className="w-4 h-4 animate-spin text-foreground" />,
  completed: <CheckCircle className="w-4 h-4 text-manga-success" />,
  error: <XCircle className="w-4 h-4 text-destructive" />,
  packing: <Loader2 className="w-4 h-4 animate-spin text-manga-gold" />,
  pause: <Pause className="w-4 h-4 text-muted-foreground" />,
  cancel: <XCircle className="w-4 h-4 text-muted-foreground" />,
};

const STATUS_LABEL: Record<string, string> = {
  downloading: "下载中",
  completed: "已完成",
  error: "错误",
  packing: "打包中",
  pause: "暂停",
  cancel: "已取消",
};

export default function DownloadQueue({ items, onPause, onResume, onRemove, onClear }: Props) {
  const completed = items.filter(i => i.status === "completed").length;
  const total = items.length;

  if (items.length === 0) {
    return (
      <div className="p-6 text-center screentone-dense">
        <p className="manga-header text-xl text-muted-foreground">暂无下载</p>
        <p className="text-sm text-muted-foreground mt-1">搜索漫画并选择章节开始下载</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b-[3px] border-foreground speed-lines-h">
        <h3 className="manga-header text-lg">
          下载列表 ({completed}/{total})
        </h3>
        <button onClick={onClear} className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded p-1" aria-label="清空下载列表">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <ScrollArea className="h-[300px]">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-3 py-2 border-b border-border last:border-0 flex items-center gap-2"
            >
              <div className="shrink-0">{STATUS_ICON[item.status]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.mangaInfo?.title || '未知漫画'}</p>
                <p className="text-xs text-muted-foreground truncate">{item.title}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 border border-border shrink-0 ${
                item.status === "completed" ? "bg-manga-success text-primary-foreground" :
                item.status === "error" ? "bg-destructive text-destructive-foreground" :
                item.status === "downloading" ? "bg-manga-gold" :
                item.status === "packing" ? "bg-manga-gold" :
                "bg-secondary"
              }`}>
                {item.status === "downloading" ? `${Math.round(item.progress)}%` : STATUS_LABEL[item.status]}
              </span>
              <div className="flex gap-0.5 shrink-0">
                {['pause', 'error', 'cancel'].includes(item.status) ? (
                  <button onClick={() => onResume(idx)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" aria-label="继续">
                    <Play className="w-3 h-3" />
                  </button>
                ) : item.status === "downloading" ? (
                  <button onClick={() => onPause(idx)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" aria-label="暂停">
                    <Pause className="w-3 h-3" />
                  </button>
                ) : null}
                <button onClick={() => onRemove(idx)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" aria-label="删除">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
