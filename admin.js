let allFeedbacks = [];
let filteredFeedbacks = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadFeedbacks();
  updateStats();
});

// 加载反馈数据
function loadFeedbacks() {
  const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
  allFeedbacks = feedbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  filteredFeedbacks = [...allFeedbacks];
  renderFeedbacks();
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
function deleteFeedback(index) {
  if (!confirm('确定要删除这条反馈吗？')) {
    return;
  }
  
  allFeedbacks.splice(index, 1);
  localStorage.setItem('feedbacks', JSON.stringify(allFeedbacks));
  
  loadFeedbacks();
  updateStats();
  alert('反馈已删除');
}

// 清空所有反馈
function clearAllFeedbacks() {
  if (!confirm('确定要清空所有反馈吗？此操作不可恢复！')) {
    return;
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
