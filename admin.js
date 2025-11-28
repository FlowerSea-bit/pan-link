// ============ LeanCloud 配置（与 app.js 保持一致）============
const LEANCLOUD_CONFIG = {
  appId: '6bijC37wqZ7WEYHldHo2uug4-gzGzoHsz',
  appKey: 'N43jv3jZO671FbvmNC7eoT0J',
  serverURL: 'https://6bijc37w.lc-cn-n1-shared.com'
};

let allFeedbacks = [];
let filteredFeedbacks = [];
let isCloudMode = false;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadFeedbacks();
  updateStats();
});

// 加载反馈数据
async function loadFeedbacks() {
  if (LEANCLOUD_CONFIG.appId !== 'YOUR_APP_ID') {
    // 从 LeanCloud 云端加载
    await loadFromCloud();
  } else {
    // 降级到本地存储
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    allFeedbacks = feedbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    filteredFeedbacks = [...allFeedbacks];
    renderFeedbacks();
    showModeNotice('local');
  }
}

// 从云端加载反馈
async function loadFromCloud() {
  try {
    const response = await fetch(
      `${LEANCLOUD_CONFIG.serverURL}/1.1/classes/Feedback?order=-createdAt&limit=1000`,
      {
        headers: {
          'X-LC-Id': LEANCLOUD_CONFIG.appId,
          'X-LC-Key': LEANCLOUD_CONFIG.appKey
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      allFeedbacks = data.results.map(item => ({
        ...item,
        _objectId: item.objectId,
        timestamp: item.timestamp || item.createdAt
      }));
      filteredFeedbacks = [...allFeedbacks];
      isCloudMode = true;
      renderFeedbacks();
      showModeNotice('cloud');
    } else {
      throw new Error('加载失败');
    }
  } catch (error) {
    console.error('云端加载失败:', error);
    // 降级到本地
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    allFeedbacks = feedbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    filteredFeedbacks = [...allFeedbacks];
    renderFeedbacks();
    showModeNotice('local');
  }
}

// 显示模式提示
function showModeNotice(mode) {
  const header = document.querySelector('.admin-header p');
  if (mode === 'cloud') {
    header.innerHTML = '✅ <span style="color: #4caf50;">云端模式</span> - 正在显示所有用户的反馈';
  } else {
    header.innerHTML = '⚠️ <span style="color: #ff9800;">本地模式</span> - 请配置 LeanCloud 以收集所有用户反馈 <a href="#" onclick="showSetupGuide()" style="color: #1f6bff;">查看配置教程</a>';
  }
}

// 渲染反馈列表
function renderFeedbacks() {
  const container = document.getElementById('feedbackContainer');
  
  if (filteredFeedbacks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div>暂无反馈信息</div>
        <div style="font-size: 14px; margin-top: 8px;">用户提交反馈后会在这里显示</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredFeedbacks.map((feedback, index) => `
    <div class="feedback-item">
      <div class="feedback-meta">
        <span class="feedback-type type-${feedback.type}">${getTypeLabel(feedback.type)}</span>
        <span class="feedback-time">${feedback.timestamp}</span>
      </div>
      
      <div class="feedback-content">
        ${feedback.resourceName ? `<div class="feedback-resource">资源名称：${feedback.resourceName}</div>` : ''}
        ${feedback.content ? `<div class="feedback-description">${feedback.content}</div>` : ''}
        ${feedback.contact ? `<div class="feedback-contact">联系方式：${feedback.contact}</div>` : ''}
      </div>
      
      <div style="margin-top: 12px;">
        <button class="btn btn-danger" onclick="deleteFeedback(${allFeedbacks.indexOf(feedback)})" style="font-size: 12px; padding: 4px 8px;">
          删除
        </button>
      </div>
    </div>
  `).join('');
}

// 获取类型标签
function getTypeLabel(type) {
  const labels = {
    missing: '缺少资源',
    broken: '链接失效',
    error: '资源错误',
    other: '其他问题'
  };
  return labels[type] || type;
}

// 更新统计数据
function updateStats() {
  const today = new Date().toDateString();
  const todayFeedbacks = allFeedbacks.filter(f => 
    new Date(f.timestamp).toDateString() === today
  );
  
  document.getElementById('totalCount').textContent = allFeedbacks.length;
  document.getElementById('todayCount').textContent = todayFeedbacks.length;
  document.getElementById('missingCount').textContent = 
    allFeedbacks.filter(f => f.type === 'missing').length;
  document.getElementById('brokenCount').textContent = 
    allFeedbacks.filter(f => f.type === 'broken').length;
}

// 筛选反馈
function filterFeedbacks() {
  const typeFilter = document.getElementById('typeFilter').value;
  
  if (typeFilter === 'all') {
    filteredFeedbacks = [...allFeedbacks];
  } else {
    filteredFeedbacks = allFeedbacks.filter(f => f.type === typeFilter);
  }
  
  renderFeedbacks();
}

// 刷新反馈
function refreshFeedbacks() {
  loadFeedbacks();
  updateStats();
  document.getElementById('typeFilter').value = 'all';
  alert('反馈数据已刷新');
}

// 删除单个反馈
async function deleteFeedback(index) {
  if (!confirm('确定要删除这条反馈吗？')) {
    return;
  }

  const feedback = allFeedbacks[index];

  if (isCloudMode && feedback._objectId) {
    // 从云端删除
    try {
      const response = await fetch(
        `${LEANCLOUD_CONFIG.serverURL}/1.1/classes/Feedback/${feedback._objectId}`,
        {
          method: 'DELETE',
          headers: {
            'X-LC-Id': LEANCLOUD_CONFIG.appId,
            'X-LC-Key': LEANCLOUD_CONFIG.appKey
          }
        }
      );
      if (!response.ok) throw new Error('删除失败');
    } catch (error) {
      console.error('云端删除失败:', error);
      alert('删除失败，请重试');
      return;
    }
  }
  
  allFeedbacks.splice(index, 1);
  if (!isCloudMode) {
    localStorage.setItem('feedbacks', JSON.stringify(allFeedbacks));
  }
  
  loadFeedbacks();
  updateStats();
  alert('反馈已删除');
}

// 清空所有反馈
async function clearAllFeedbacks() {
  if (!confirm('确定要清空所有反馈吗？此操作不可恢复！')) {
    return;
  }

  if (isCloudMode) {
    // 云端模式：逐个删除
    try {
      for (const feedback of allFeedbacks) {
        if (feedback._objectId) {
          await fetch(
            `${LEANCLOUD_CONFIG.serverURL}/1.1/classes/Feedback/${feedback._objectId}`,
            {
              method: 'DELETE',
              headers: {
                'X-LC-Id': LEANCLOUD_CONFIG.appId,
                'X-LC-Key': LEANCLOUD_CONFIG.appKey
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('清空失败:', error);
      alert('清空失败，请重试');
      return;
    }
  }
  
  localStorage.removeItem('feedbacks');
  allFeedbacks = [];
  filteredFeedbacks = [];
  
  renderFeedbacks();
  updateStats();
  alert('所有反馈已清空');
}

// 导出反馈数据
function exportFeedbacks() {
  if (allFeedbacks.length === 0) {
    alert('暂无反馈数据可导出');
    return;
  }
  
  const dataStr = JSON.stringify(allFeedbacks, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `feedbacks_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

// 添加导出按钮到页面
document.addEventListener('DOMContentLoaded', () => {
  const actionsDiv = document.querySelector('.feedback-actions');
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-primary';
  exportBtn.textContent = '导出数据';
  exportBtn.onclick = exportFeedbacks;
  actionsDiv.insertBefore(exportBtn, actionsDiv.lastElementChild);
});

// 显示配置教程
function showSetupGuide() {
  const guide = `
=== LeanCloud 配置教程 ===

1. 访问 https://console.leancloud.cn 注册账号

2. 创建一个新应用（选择开发版，免费）

3. 进入应用 → 设置 → 应用凭证，复制：
   - AppID
   - AppKey  
   - REST API 服务器地址

4. 打开 app.js 和 admin.js，将顶部的配置替换为你的信息：
   appId: '你的AppID',
   appKey: '你的AppKey',
   serverURL: '你的服务器地址'

5. 进入 设置 → 安全中心：
   - 添加你的网站域名到 Web 安全域名

配置完成后，所有用户的反馈都会自动保存到云端！
  `;
  alert(guide);
}
