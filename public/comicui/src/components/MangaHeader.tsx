import { FolderOpen } from "lucide-react";
import { type MangaInfo } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

type MangaHeaderProps = {
  mangaInfo?: Partial<MangaInfo>;
  title: string;
  fallbackIcon?: React.ReactNode;
  extra?: React.ReactNode;
};

export default function MangaHeader({ mangaInfo, title, fallbackIcon, extra }: MangaHeaderProps) {
  const displayTitle = mangaInfo?.title || title;
  
  return (
    <div className="border-b-[3px] border-foreground pb-4 mb-4 shrink-0">
      <div className="flex gap-5">
        <div className="w-28 h-40 shrink-0 flex items-center justify-center border-2 border-foreground bg-manga-success overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {mangaInfo?.cover ? (
            <img src={mangaInfo.cover} alt={displayTitle} className="w-full h-full object-cover" />
          ) : (
            fallbackIcon || <FolderOpen className="w-12 h-12 text-primary-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h2 className="manga-header text-3xl leading-none truncate pr-2">
              {displayTitle}
            </h2>
            {extra}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {mangaInfo?.author && (
              <span className="text-xs font-black bg-foreground text-background px-2 py-0.5 italic tracking-tighter uppercase">
                {mangaInfo.author}
              </span>
            )}
            {mangaInfo?.status && (
              <span className="text-xs font-black border-2 border-foreground px-2 py-0.5 tracking-tighter">
                {mangaInfo.status}
              </span>
            )}
          </div>
          
          {mangaInfo?.intro && (
            <ScrollArea className="flex-1 min-h-[60px] text-base text-muted-foreground font-serif italic border-l-[3px] border-foreground/20 pl-4 py-1 leading-relaxed">
              {mangaInfo.intro}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
