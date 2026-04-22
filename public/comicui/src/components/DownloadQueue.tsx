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
      <div className="p-12 flex flex-col items-center justify-center bg-white border-[3px] border-foreground shadow-comic m-2">
        <div className="relative mb-6">
          <Clock className="w-16 h-16 opacity-20" />
          <div className="absolute -top-4 -right-12 bg-manga-success text-white border-[3px] border-foreground px-3 py-1 rounded-xl shadow-sm rotate-6 font-black italic text-lg z-10">
            闲置中
          </div>
        </div>
        <p className="font-serif italic font-black text-2xl">暂无下载任务</p>
        <p className="text-muted-foreground font-bold mt-2">去搜索喜欢的漫画吧！</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-[3px] border-foreground rounded-2xl shadow-comic mx-2 mb-4 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 speed-lines opacity-50 pointer-events-none" />
        <h3 className="font-serif font-black italic text-xl z-10">
          下载任务 <span className="bg-foreground text-white px-2 py-0.5 rounded-lg text-lg ml-2">{completed}/{total}</span>
        </h3>
        <button onClick={onClear} className="z-10 bg-white border-[3px] border-foreground p-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground hover:text-manga-red hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0 active:translate-x-0 active:shadow-none" aria-label="清空下载列表">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <ScrollArea className="h-full flex-1 px-2 pb-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-4 py-3 bg-white border-[3px] border-foreground rounded-xl mb-2 mr-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-comic transition-shadow flex items-center gap-3"
            >
              <div className="shrink-0 p-2 bg-muted rounded-xl border-2 border-foreground">{STATUS_ICON[item.status]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black truncate">{item.mangaInfo?.title || '未知漫画'}</p>
                <p className="text-sm font-bold text-muted-foreground truncate leading-none mt-1">{item.title}</p>
              </div>
              <span className={`text-xs font-black italic px-3 py-1 border-[2px] border-foreground rounded-lg shrink-0 ${
                item.status === "completed" ? "bg-manga-success text-white" :
                item.status === "error" ? "bg-destructive text-white" :
                item.status === "downloading" ? "bg-manga-gold text-foreground" :
                item.status === "packing" ? "bg-manga-gold text-foreground" :
                "bg-white text-muted-foreground"
              }`}>
                {item.status === "downloading" ? `${Math.round(item.progress)}%` : STATUS_LABEL[item.status]}
              </span>
              <div className="flex gap-2 shrink-0 ml-2">
                {['pause', 'error', 'cancel'].includes(item.status) ? (
                  <button onClick={() => onResume(idx)} className="p-2 border-2 border-foreground rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-manga-success/20 hover:bg-manga-success hover:text-white transition-all active:translate-y-px active:shadow-none" aria-label="继续">
                    <Play className="w-4 h-4" />
                  </button>
                ) : item.status === "downloading" ? (
                  <button onClick={() => onPause(idx)} className="p-2 border-2 border-foreground rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-manga-gold/20 hover:bg-manga-gold hover:text-foreground transition-all active:translate-y-px active:shadow-none" aria-label="暂停">
                    <Pause className="w-4 h-4" />
                  </button>
                ) : null}
                <button onClick={() => onRemove(idx)} className="p-2 border-2 border-foreground rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-manga-red/20 hover:bg-manga-red hover:text-white transition-all active:translate-y-px active:shadow-none" aria-label="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
