// 百度网盘分享文本转JSON工具
// 用法: node convert.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('请粘贴百度网盘分享文本（输入空行结束）：\n');

let inputText = '';
let emptyLineCount = 0;

rl.on('line', (line) => {
  if (line.trim() === '') {
    emptyLineCount++;
    if (emptyLineCount >= 2) {
      processInput();
      rl.close();
      return;
    }
  } else {
    emptyLineCount = 0;
  }
  inputText += line + '\n';
});

function processInput() {
  const entries = inputText.split(/通过百度网盘分享的文件：/).filter(s => s.trim());
  const results = [];

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const name = lines[0].trim();
    const linkLine = lines.find(l => l.startsWith('链接：'));
    
    if (name && linkLine) {
      const url = linkLine.replace('链接：', '').trim();
      results.push(`  "${name}": "${url}"`);
    }
  }

  console.log('\n--- 转换结果 ---\n');
  console.log(results.join(',\n'));
  console.log('\n--- 结束 ---');
}
