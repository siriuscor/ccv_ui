import { useState } from "react";
import { Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApi } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  downloadPath: string;
  setDownloadPath: (path: string) => void;
  packType: string;
  setPackType: (type: string) => void;
};

export default function SettingsDialog({ open, onClose, downloadPath, setDownloadPath, packType, setPackType }: Props) {
  const [path, setPath] = useState(downloadPath);

  const handleSelectFolder = async () => {
    const result = await getApi().selectFolder();
    if (result) {
      setPath(result);
      setDownloadPath(result);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md bg-background border-2 border-foreground p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">设置</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-bold mb-2 block">下载保存路径</label>
            <div className="flex gap-2">
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="选择保存路径"
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleSelectFolder}>
                <Folder className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">保存格式</label>
            <select
              value={packType}
              onChange={(e) => setPackType(e.target.value)}
              className="w-full px-3 py-2 bg-card border-2 border-foreground text-sm font-bold focus:outline-none focus:border-accent"
            >
              <option value="cbz">CBZ (漫画阅读器)</option>
              <option value="epub">EPUB (电子书)</option>
              <option value="zip">ZIP (压缩包)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>完成</Button>
        </div>
      </div>
    </div>
  );
}
