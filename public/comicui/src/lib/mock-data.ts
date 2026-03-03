export type Comic = {
  id: string;
  title: string;
  author: string;
  genre: string;
  chapters: number;
  status: "ongoing" | "completed";
  description: string;
};

export type Chapter = {
  id: string;
  number: number;
  title: string;
  pages: number;
  sizeMb: number;
};

export type DownloadItem = {
  id: string;
  comicTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  progress: number;
  status: "queued" | "downloading" | "completed" | "failed";
  sizeMb: number;
};

export const MOCK_COMICS: Comic[] = [
  { id: "1", title: "暗影刀传", author: "田中圭", genre: "动作", chapters: 142, status: "ongoing", description: "一位流浪剑客在被黑暗吞噬的世界中寻求复仇。" },
  { id: "2", title: "霓虹幽灵", author: "�的木凛子", genre: "科幻", chapters: 89, status: "completed", description: "在赛博朋克都市中，一名黑客发现自己能穿越数字现实。" },
  { id: "3", title: "最后的炼金术师", author: "伊藤诚", genre: "奇幻", chapters: 210, status: "ongoing", description: "一位被驱逐的炼金术师掌握着拯救崩塌帝国的关键。" },
  { id: "4", title: "死锁竞技场", author: "中村悠介", genre: "动作", chapters: 67, status: "completed", description: "囚犯们在地下锦标赛中为自由而战。" },
  { id: "5", title: "狐之低语", author: "山本葵", genre: "灵异", chapters: 156, status: "ongoing", description: "灵媒少女与恐吓村庄的古代狐神成为朋友。" },
  { id: "6", title: "铁之安魂曲", author: "小林拓也", genre: "机甲", chapters: 98, status: "completed", description: "巨型机甲在决定人类命运的战争中激烈交锋。" },
  { id: "7", title: "暗黑之城", author: "森田翔", genre: "黑色", chapters: 45, status: "ongoing", description: "一位侦探在太阳永不升起的城市中穿行。" },
  { id: "8", title: "绯红誓约", author: "藤本遥", genre: "暗黑奇幻", chapters: 178, status: "ongoing", description: "被血誓束缚的骑士们与来自彼方的诡异恐怖搏斗。" },
];

export function generateChapters(comic: Comic): Chapter[] {
  return Array.from({ length: comic.chapters }, (_, i) => ({
    id: `${comic.id}-ch-${i + 1}`,
    number: i + 1,
    title: `第${i + 1}话`,
    pages: Math.floor(Math.random() * 20) + 15,
    sizeMb: +(Math.random() * 30 + 10).toFixed(1),
  }));
}

export function generateMockPages(chapterNumber: number, pageCount: number): string[] {
  // Generate placeholder manga page URLs (grayscale abstract patterns)
  return Array.from({ length: pageCount }, (_, i) => {
    const seed = chapterNumber * 100 + i;
    return `https://picsum.photos/seed/${seed}/800/1200?grayscale`;
  });
}
