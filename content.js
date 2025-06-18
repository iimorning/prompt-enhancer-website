// content.js (v2.0 - 更智能的版本)

let lastSentText = '';
let monitoredTextarea = null;

// 定义不同网站的输入框“门牌号”（CSS 选择器）
const selectors = [
  '#prompt-textarea',                  // ChatGPT
  'textarea[data-testid="text-input"]',// Claude 3
  'textarea.ds-input-textarea__inner', // DeepSeek
  'textarea'                           // 备用通用选择器
];

function findChatTextarea() {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`AI Chat Sidekick: Found textarea with selector: ${selector}`);
      return element;
    }
  }
  return null;
}

// content.js (v2.3 - 终极健壮版本)
// content.js (v2.4 - 真正终极健壮版，结合 try-catch)

function sendTextToSidePanel(text) {
  if (text !== lastSentText) {
    try {
      // 我们将 sendMessage 调用包裹在 try 块中
      chrome.runtime.sendMessage({ type: "USER_INPUT", text: text }, () => {
        // 这个回调函数仍然处理“情况A”：侧边栏关闭
        if (chrome.runtime.lastError) {
          console.log("Side panel is closed. Will retry on next input.");
          // 注意：此处不更新 lastSentText，因为消息未成功发送
        } else {
          // 消息发送成功，安全更新状态
          lastSentText = text;
          console.log(`Successfully sent text: "${text}"`);
        }
      });
    } catch (error) {
      // 这个 catch 块专门处理“情况B”：扩展被重载，“孤儿脚本”出错
      if (error.message.includes("Extension context invalidated")) {
        console.warn(
          "AI Chat Sidekick: The extension has been updated. Please refresh the page to activate the new version. This error is expected."
        );
        // 在这里我们也可以选择停止监听，但只打印警告通常足够了
      } else {
        // 如果是其他意料之外的错误，还是把它抛出去
        throw error;
      }
    }
  }
}

function attachListener(textarea) {
  if (monitoredTextarea === textarea) return; // 如果已经监听，则不重复添加

  console.log("AI Chat Sidekick: Attaching listener to new textarea.");
  monitoredTextarea = textarea;
  
  // 实时监听输入
  textarea.addEventListener('input', (event) => {
    sendTextToSidePanel(event.target.value);
  });
  
  // 初始发送一次当前内容（如果有的话）
  sendTextToSidePanel(textarea.value);
}

// 使用 MutationObserver 来应对动态加载的输入框
// 网页内容变化时（比如切换对话），也能重新找到输入框
const observer = new MutationObserver((mutations) => {
  const textarea = findChatTextarea();
  if (textarea) {
    attachListener(textarea);
  }
});

// 开始观察整个页面的变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 页面加载时也尝试立即查找一次
const initialTextarea = findChatTextarea();
if (initialTextarea) {
  attachListener(initialTextarea);
}