const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultList = document.getElementById('resultList');
// const chapterSelect = document.getElementById('chapterSelect');
const chapterList = document.getElementById('chapterList');
const downloadBtn = document.getElementById('downloadBtn');
const downloadPanel = document.getElementById('downloadPanel');

let currentComic = null;
let currentChapters = [];
let downloading = {};

// 搜索漫画
searchBtn.onclick = async () => {
    // window.api.openWindow('https://baidu.com/');
  const keyword = '海贼王';//searchInput.value.trim();
  if (!keyword) return;
  resultList.innerHTML = '<li>正在搜索...</li>';
  // 假设 window.api.search 返回漫画数组 [{id, title, cover}]
  const comics = await api.search(keyword);
  resultList.innerHTML = '';
  if (!comics.length) {
    resultList.innerHTML = '<li>没有找到相关漫画</li>';
    return;
  }
  comics.forEach(comic => {
    const li = document.createElement('li');
    li.className = 'nes-pointer';
    li.innerHTML = `<span>${comic.title}</span>`;
    li.onclick = () => selectComic(comic);
    resultList.appendChild(li);
  });

  // let mangaInfo = await api.getMangaInfo('https://www.mangabz.com/139bz/');
  // console.log(mangaInfo);

  // api.addChapter(mangaInfo.chapters.slice(0, 5),mangaInfo);

  // api.onDownloadProgress((...args) => {
  //   console.log('download-progress', ...args);
  // });

  // console.log("task list", await api.getTaskList());
//   window.api.download({
//     url: 'https://baidu.com/',
//     title: '海贼王',
//     path: '~/Downloads',
//     packType: 'cbz',
//     mangaInfo: {}
//   });
//   chapterSelect.hidden = true;
};

async function selectComic(comic) {
  console.log("selectComic", comic);
  // currentComic = comic;
  // chapterSelect.hidden = false;
  chapterList.innerHTML = '加载章节中...';
  // 假设 window.api.getChapters 返回章节数组 [{id, title}]
  const info = await window.api.getMangaInfo(comic.url);
  currentComic = info;
  console.log('get info', info);
  const chapters = info.chapters;
  chapterList.innerHTML = '';
  chapters.forEach((chap, index) => {
    const label = document.createElement('label');
    label.className = 'nes-checkbox';
    label.style = 'display:block; margin-bottom:6px;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = index;
    label.appendChild(input);
    label.innerHTML += `<span>${chap.title}</span>`;
    chapterList.appendChild(label);
  });
}


downloadBtn.onclick = async () => {
  // collect selected chapters
  const selectedChapters = chapterList.querySelectorAll('input:checked');
  console.log('selectedChapters', selectedChapters.values());
  
  const chapters = [];
  chapterList.querySelectorAll('input:checked').forEach(i => {
    chapters.push(currentComic.chapters[i.value]);
  })
  console.log('chapters', chapters);
  api.addChapter(chapters,currentComic);


  console.log("task list", await api.getTaskList());
  function renderDownloadProgress() {
    downloadPanel.innerHTML = '';
    api.getTaskList().then(downloadProgress => {
      console.log('downloadProgress', downloadProgress);
      downloadProgress.forEach(p => {
        downloadPanel.innerHTML += `<div><span>${p.mangaInfo.title} - ${p.title} (${p.current}/${p.total})</span>
          <progress class="nes-progress is-primary" value="${p.current/p.total*100}" max="100"></progress>
          <span>${p.status}</span>
        </div>`;
      });
    });
  }
  api.onDownloadProgress((...args) => {
    console.log('download-progress', ...args);
    // downloadProgress[args[0]] = {
    //   title: args[1].title,
    //   current: args[2],
    //   total: args[3],
    // };
    renderDownloadProgress();
  });
};