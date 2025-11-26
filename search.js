let data = {};
let dataReady = false;
let currentResults = [];
let currentFilter = 'all';

const getPwdFromLink = (link) => {
  try {
    const url = new URL(link);
    return url.searchParams.get('pwd') || '无';
  } catch (err) {
    const matched = link.match(/pwd=([^&]+)/);
    return matched ? matched[1] : '无';
  }
};

// 多个数据源配置
const dataSources = [
  'guangboju-wanjie.json',    // 完结广播剧
  'guangboju-gengxin.json',   // 更新中广播剧
  'xiaoshuo-wanjie.json',     // 完结小说
  'xiaoshuo-gengxin.json',    // 更新中小说
  'manhua-wanjie.json',       // 完结漫画
  'manhua-gengxin.json',      // 更新中漫画
  'qita.json',                // 其他资源
  'data.json'
];

// 加载所有数据源
Promise.all(
  dataSources.map(file => 
    fetch(file)
      .then(res => res.ok ? res.json() : {})
      .catch(() => ({})) // 文件不存在时返回空对象
  )
).then(results => {
  // 合并所有数据
  results.forEach(fileData => {
    Object.assign(data, fileData);
  });
  dataReady = true;
  console.log('已加载资源数量:', Object.keys(data).length);
  
  // 从URL参数获取搜索关键词并执行搜索
  const urlParams = new URLSearchParams(window.location.search);
  const keyword = urlParams.get('q');
  if (keyword) {
    performSearch(keyword);
  }
}).catch(() => {
  document.getElementById("resultsList").innerHTML = `
    <div style="text-align: center; padding: 40px; color: #ff6b6b;">
      数据加载失败，请刷新页面重试。
    </div>
  `;
});

function performSearch(keyword) {
  if (!dataReady) {
    setTimeout(() => performSearch(keyword), 100);
    return;
  }

  const matched = Object.entries(data).filter(([name]) =>
    name.includes(keyword)
  );

  currentResults = matched;
  
  // 更新搜索关键词和结果数量
  document.getElementById('searchKeyword').textContent = keyword;
  document.getElementById('resultCount').textContent = matched.length;
  
  if (matched.length === 0) {
    document.getElementById('resultsList').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #88919f;">
        未找到包含"${keyword}"的资源，请尝试其他关键词。
      </div>
    `;
    return;
  }
  
  // 渲染结果列表
  renderResults(matched);
}

function renderResults(results) {
  const resultsList = document.getElementById('resultsList');
  
  resultsList.innerHTML = results.map(([name, link]) => {
    const pwd = getPwdFromLink(link);
    const category = getCategoryFromName(name);
    const date = getRandomDate(); // 模拟日期
    const source = getSourceFromLink(link);
    
    return `
      <div class="result-card">
        <div class="result-card-title">${name}</div>
        <div class="result-card-meta">
          <span>📅 ${date}</span>
          <span>🌐 来源：${source}</span>
        </div>
        <div class="result-card-actions">
          <a href="#" class="action-btn secondary" onclick="copyLink('${link}')">📋 复制分享</a>
          <a href="#" class="action-btn secondary">👁 查看详情</a>
          <a href="${link}" target="_blank" class="action-btn primary">🔗 立即访问</a>
        </div>
      </div>
    `;
  }).join('');
}

function getCategoryFromName(name) {
  if (name.includes('广播剧')) return '广播剧';
  if (name.includes('小说')) return '小说';
  if (name.includes('漫画')) return '漫画';
  return '其他';
}

function getRandomDate() {
  const dates = ['2025-06-14', '2025-11-12', '2025-10-08', '2025-09-22'];
  return dates[Math.floor(Math.random() * dates.length)];
}

function getSourceFromLink(link) {
  if (link.includes('baidu.com')) return '百度网盘';
  return '其他网盘';
}

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    alert('链接已复制到剪贴板');
  });
}

function goHome() {
  window.location.href = 'index.html';
}

// 反馈弹窗功能
function showFeedbackModal() {
  document.getElementById('feedbackModal').classList.add('active');
  document.body.style.overflow = 'hidden'; // 防止背景滚动
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  // 清空表单
  document.getElementById('feedbackForm').reset();
}

function submitFeedback() {
  const type = document.getElementById('feedbackType').value;
  const resourceName = document.getElementById('resourceName').value.trim();
  const content = document.getElementById('feedbackContent').value.trim();
  const contact = document.getElementById('contactInfo').value.trim();

  if (!resourceName && !content) {
    alert('请至少填写资源名称或详细描述');
    return;
  }

  // 构建反馈信息
  const feedbackData = {
    type: type,
    resourceName: resourceName,
    content: content,
    contact: contact,
    timestamp: new Date().toLocaleString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // 方案1：保存到本地存储
  let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
  feedbacks.push(feedbackData);
  localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

  // 方案2：通过邮件发送反馈
  sendEmailFeedback(feedbackData);

  // 方案3：发送到第三方服务（如果配置了）
  sendToWebhook(feedbackData);

  // 显示成功提示
  alert('反馈提交成功！感谢您的反馈，我会尽快处理~');
  
  // 关闭弹窗
  closeFeedbackModal();

  // 在控制台输出反馈信息（方便开发者查看）
  console.log('新反馈:', feedbackData);
}

// 方案2：通过邮件发送反馈
function sendEmailFeedback(data) {
  const typeLabels = {
    missing: '缺少资源',
    broken: '链接失效', 
    error: '资源错误',
    other: '其他问题'
  };

  const subject = `[资源站反馈] ${typeLabels[data.type]} - ${data.resourceName || '用户反馈'}`;
  const body = `
反馈类型：${typeLabels[data.type]}
资源名称：${data.resourceName || '未填写'}
详细描述：${data.content || '未填写'}
联系方式：${data.contact || '未提供'}
提交时间：${data.timestamp}
页面地址：${data.url}
浏览器信息：${data.userAgent}
  `.trim();

  // 方法1：使用 mailto 链接（会打开用户的邮件客户端）
  const mailtoLink = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // 静默尝试打开邮件客户端（用户可能没有配置）
  try {
    const link = document.createElement('a');
    link.href = mailtoLink;
    link.style.display = 'none';
    document.body.appendChild(link);
    // link.click(); // 取消自动点击，避免打扰用户
    document.body.removeChild(link);
  } catch (e) {
    console.log('邮件客户端不可用');
  }
}

// 方案3：发送到第三方服务
function sendToWebhook(data) {
  // 可以使用免费的第三方服务，如：
  // 1. Formspree.io
  // 2. Netlify Forms  
  // 3. Google Forms
  // 4. 企业微信机器人
  // 5. 钉钉机器人

  // 示例：发送到企业微信机器人（需要替换为你的webhook地址）
  const webhookUrl = 'YOUR_WEBHOOK_URL_HERE'; // 替换为实际的webhook地址
  
  if (webhookUrl && webhookUrl !== 'YOUR_WEBHOOK_URL_HERE') {
    const message = {
      msgtype: "text",
      text: {
        content: `📝 新的资源反馈\n类型：${data.type}\n资源：${data.resourceName}\n描述：${data.content}\n联系：${data.contact}\n时间：${data.timestamp}`
      }
    };

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    }).catch(err => {
      console.log('Webhook发送失败:', err);
    });
  }
}

// 方案4：生成反馈报告并提示用户发送
function generateFeedbackReport() {
  const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
  if (feedbacks.length === 0) {
    alert('暂无反馈数据');
    return;
  }

  const report = feedbacks.map((item, index) => {
    return `
=== 反馈 ${index + 1} ===
类型：${item.type}
资源名称：${item.resourceName || '未填写'}
详细描述：${item.content || '未填写'}
联系方式：${item.contact || '未提供'}
提交时间：${item.timestamp}
    `.trim();
  }).join('\n\n');

  // 创建下载链接
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `反馈报告_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
  URL.revokeObjectURL(url);

  alert('反馈报告已下载，请将文件发送给管理员');
}

function searchFromHeader() {
  const keyword = document.getElementById("headerKeyword").value.trim();
  
  if (!keyword) {
    alert("请输入搜索关键词");
    return;
  }
  
  // 更新URL参数并重新搜索
  const newUrl = `search.html?q=${encodeURIComponent(keyword)}`;
  window.history.pushState({}, '', newUrl);
  
  // 执行搜索
  performSearch(keyword);
}

// 筛选功能
document.addEventListener('DOMContentLoaded', () => {
  // 绑定顶部搜索功能
  const headerSearchBtn = document.getElementById("headerSearchBtn");
  const headerKeyword = document.getElementById("headerKeyword");
  
  if (headerSearchBtn) {
    headerSearchBtn.addEventListener("click", searchFromHeader);
  }
  
  if (headerKeyword) {
    headerKeyword.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        searchFromHeader();
      }
    });
    
    // 将当前搜索关键词填入顶部搜索框
    const urlParams = new URLSearchParams(window.location.search);
    const currentKeyword = urlParams.get('q');
    if (currentKeyword) {
      headerKeyword.value = currentKeyword;
    }
  }

  document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', () => {
      // 更新激活状态
      document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // 获取筛选类型
      const filter = option.dataset.filter;
      currentFilter = filter;
      
      // 筛选结果
      let filteredResults = currentResults;
      if (filter !== 'all') {
        filteredResults = currentResults.filter(([name]) => {
          switch(filter) {
            case 'guangboju': return name.includes('广播剧') || name.includes('有声');
            case 'xiaoshuo': return name.includes('小说');
            case 'manhua': return name.includes('漫画');
            case 'qita': return !name.includes('广播剧') && !name.includes('小说') && !name.includes('漫画') && !name.includes('有声');
            default: return true;
          }
        });
      }
      
      // 更新结果数量和列表
      document.getElementById('resultCount').textContent = filteredResults.length;
      renderResults(filteredResults);
    });
  });
});
