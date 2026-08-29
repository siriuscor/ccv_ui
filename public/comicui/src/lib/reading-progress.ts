export const LAST_READING_PROGRESS_KEY = "lastReadingProgress";

export type LastReadingProgress = {
  filePath: string;
  comicTitle: string;
  chapterTitle: string;
  page: number;
};

export function readLastReadingProgress(): LastReadingProgress | null {
  try {
    const value = localStorage.getItem(LAST_READING_PROGRESS_KEY);
    if (!value) return null;

    const progress = JSON.parse(value) as Partial<LastReadingProgress>;
    if (
      typeof progress.filePath !== "string" ||
      typeof progress.comicTitle !== "string" ||
      typeof progress.chapterTitle !== "string" ||
      typeof progress.page !== "number"
    ) {
      return null;
    }

    return progress as LastReadingProgress;
  } catch {
    return null;
  }
}

export function saveLastReadingProgress(progress: LastReadingProgress) {
  localStorage.setItem(LAST_READING_PROGRESS_KEY, JSON.stringify(progress));
}
