if (typeof __mantaku == 'undefined') var __mantaku = {};
__mantaku = Object.assign(__mantaku, {
    id: 'manhuagui',
    name: '漫画柜',
    home: 'https://www.mhgui.com',
    canHandle: function canHandle(url) {
        return (url.match('tw.manhuagui.com') || url.match('www.mhgui.com') || url.match('www.manhuagui.com'));
    },
    searchUrl: function searchUrl(query) {
        return `https://www.manhuagui.com/s/${query}.html`;
    },
    mangaInfo: async function mangaInfo() {
        let adultBtn = document.querySelector('#checkAdult');
        if (adultBtn) adultBtn.click();
        return {
            title: document.querySelector('.book-title h1').innerText,
            author: document.querySelector('.detail-list li:nth-child(2) span:nth-child(2) a').innerText,
            intro: document.querySelector('#intro-cut').innerText,
            cover: document.querySelector('.book-cover img').src,
            status: document.querySelector('.status span span').innerText,
            web: window.location.href,
            chapters: Array.from(document.querySelectorAll('.chapter-list a')).map(a => {
                return { url: a.href, title: a.title };
            })
        };
    },
    search: async function search() {
        let list = document.querySelectorAll('.book-result ul li');
        return Array.from(list).map(li => {
            return {
                title: li.querySelector('.book-detail dt a').text,
                url: li.querySelector('.book-cover a').href,
                intro: li.querySelector('.book-detail .intro').innerText,
                author: li.querySelectorAll('.book-detail dd')[2].innerText
            };
        });
    },
    totalPage: async function totalPage() {
        return document.querySelector('#pageSelect').options.length;
    },
    nextPage: async function nextPage() {
        document.querySelector('#mangaBox').click()
        await __mantaku.waitFor('#imgLoading', false);
    },
    goPage: async function goPage(index) {
        let pageSelect = document.querySelector('#pageSelect');
        if (pageSelect) {
            pageSelect.value = index;
            pageSelect.dispatchEvent(new Event('change'));
            await __mantaku.waitFor('#imgLoading', false);
        }
    },
    getImage: async function getImage() {
        // console.log('begin find image', Date.now());
        // await __mantaku.wait(2000);
        // console.log('wait 2s', Date.now());
        await __mantaku.waitFor('#imgLoading', false);
        // console.log('wait for imgLoading false', Date.now());
        return document.querySelector('#mangaFile').src;
    }
});

if (typeof module !== 'undefined') module.exports = __mantaku; // for server use
