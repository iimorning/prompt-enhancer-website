// content.js (v3.0 - 支持 contentEditable div)

let lastSentText = '';
let monitoredElement = null;

// 增强的“嫌疑人名单”，现在可以匹配多种元素
const selectors = [
  '#prompt-textarea',                      // ChatGPT 的 ID (可以是 textarea 或 div)
  'textarea[data-testid="chat-input"]',    // Poe.com
  'textarea.ds-input-textarea__inner',     // DeepSeek
  'textarea[data-testid="text-input"]',    // Claude 3
  '#searchbox',                            // Google Gemini
  'textarea',                              // 备用 textarea
  '[contenteditable="true"]'                 // 备用可编辑元素
];

function findChatElement() {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`%cAI Chat Sidekick: SUCCESS! Found element with selector: ${selector}`, 'color: green; font-weight: bold;');
      return element;
    }
  }
  return null;
}

function sendTextToSidePanel(element) {
  // 根据元素类型，使用不同的方式获取文本
  const text = (element.tagName.toLowerCase() === 'textarea') ? element.value : element.textContent;

  if (text !== lastSentText) {
    try {
      chrome.runtime.sendMessage({ type: "USER_INPUT", text: text }, () => {
        if (chrome.runtime.lastError) {
          console.log("Side panel is closed. Retrying on next input.");
        } else {
          lastSentText = text;
          console.log(`Successfully sent text: "${text}"`);
        }
      });
    } catch (error) {
      if (error.message.includes("Extension context invalidated")) {
        console.warn("Extension has been updated. Please refresh the page.");
      } else {
        throw error;
      }
    }
  }
}

function attachListener(element) {
  if (monitoredElement === element) return; // 避免重复监听

  console.log("AI Chat Sidekick: Attaching 'input' listener to new element.");
  monitoredElement = element;
  
  // 'input' 事件对 textarea 和 contentEditable div 都有效
  element.addEventListener('input', (event) => {
    sendTextToSidePanel(event.target);
  });
  
  // 初始发送一次当前内容
  sendTextToSidePanel(element);
}

// 使用 MutationObserver 来应对动态加载的输入框
const observer = new MutationObserver(() => {
  const element = findChatElement();
  if (element && element !== monitoredElement) {
    attachListener(element);
  }
});

// 开始观察整个页面的变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 页面加载时也尝试立即查找一次
setTimeout(() => {
    const initialElement = findChatElement();
    if (initialElement) {
      attachListener(initialElement);
    }
}, 1000); // 延迟1秒执行，确保页面元素加载完毕