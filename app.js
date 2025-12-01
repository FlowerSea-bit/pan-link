// ============ LeanCloud 配置 ============
// 请在 https://console.leancloud.cn 注册并创建应用后，填入以下信息
const LEANCLOUD_CONFIG = {
  appId: '6bijC37wqZ7WEYHldHo2uug4-gzGzoHsz',
  appKey: 'N43jv3jZO671FbvmNC7eoT0J',
  serverURL: 'https://6bijc37w.lc-cn-n1-shared.com'
};

// 初始化 LeanCloud
function initLeanCloud() {
  if (LEANCLOUD_CONFIG.appId === 'YOUR_APP_ID') {
    console.warn('请先配置 LeanCloud，详见 app.js 顶部说明');
    return false;
  }
  return true;
}

function search() {
  const keyword = document.getElementById("keyword").value.trim();
  
  if (!keyword) {
    alert("请输入搜索关键词");
    return;
  }
  
  // 跳转到搜索结果页面，传递搜索关键词
  window.location.href = `search.html?q=${encodeURIComponent(keyword)}`;
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
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // 保存到 LeanCloud 云端数据库
  saveFeedbackToCloud(feedbackData);
}

// 保存反馈到 LeanCloud 云端
async function saveFeedbackToCloud(data) {
  if (!initLeanCloud()) {
    // 如果没配置 LeanCloud，降级到本地存储
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.push(data);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    alert('反馈提交成功！（本地模式）');
    closeFeedbackModal();
    return;
  }

  try {
    const response = await fetch(`${LEANCLOUD_CONFIG.serverURL}/1.1/classes/Feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LC-Id': LEANCLOUD_CONFIG.appId,
        'X-LC-Key': LEANCLOUD_CONFIG.appKey
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('提交响应:', response.status, result);
    
    if (response.ok) {
      alert('反馈提交成功！感谢您的反馈，我会尽快处理~');
      closeFeedbackModal();
      console.log('反馈已保存到云端:', data);
    } else {
      throw new Error(result.error || '提交失败');
    }
  } catch (error) {
    console.error('云端保存失败:', error);
    alert('云端提交失败: ' + error.message + '\n已保存到本地');
    // 降级到本地存储
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.push(data);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    closeFeedbackModal();
  }
}

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("searchBtn").addEventListener("click", search);
  document.getElementById("keyword").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      search();
    }
  });
});
