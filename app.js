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

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("searchBtn").addEventListener("click", search);
  document.getElementById("keyword").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      search();
    }
  });
});
