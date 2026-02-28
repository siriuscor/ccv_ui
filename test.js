let text = `尾声
第23卷附录
第22卷附录
第21卷附录
剧场版动画公映纪念短篇
特别番外篇
06卷附录
05卷附录
04卷附录
最速角色书
03卷附录
02卷附录
①卷附录
第28卷
第27卷
第26卷
第25卷
第24卷
第23卷
第22卷
第21卷
第20卷
第19卷
第18卷
第17卷
第16卷
第15卷
第14卷
第13卷
第12卷
第11卷
第10卷
第09卷
第08卷
第07卷
第06卷
第  05  卷
第04卷
第03卷
第02卷
第01卷
第00卷
第03回
第02回
第01回
第93话 涩谷事变（11）
第92话 涩谷事变（10）
第91话 涩谷事变（9）
第90话 涩谷事变（8）
第89话 涩谷事变（7）`

let titles = text.split('\n');


function computeWeight(title) {
  let weight = 0;
  let juanMatch = title.match(/第?\s*(\d+)\s*卷/);
  if (juanMatch) {
    weight = (parseInt(juanMatch[1]) + 1) * 1000;
  }
  let huiMatch = title.match(/第?\s*(\d+)\s*[回话]/);
  if (huiMatch) {
    weight = parseInt(huiMatch[1]);
  }

  if (!juanMatch && !huiMatch) {
    weight = 1000000;
  }
  return weight;
}

titles.sort((a, b) => {
  return computeWeight(a) - computeWeight(b);
});

// for(let i=0;i<titles.length;i++) {
//   console.log(titles[i], computeWeight(titles[i]));
// }
// console.log(titles);


const fs = require('fs-extra');
fs.ensureDirSync('./第37卷  --  后接 《龍狼傳2-中原繚亂篇》');