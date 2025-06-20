// content.js (v4.1 - Added Paste Functionality)

// ===================================================================
//      第一步：在文件最顶部，添加消息监听器和新函数
// ===================================================================

// 新增：填充文本到输入框的函数
function fillInput(text) {
  const element = findInputElement(); // 复用我们已有的函数来找到输入框
  if (!element) {
    console.warn('[Sidekick] Paste failed: Could not find input element.');
    return;
  }
  
  // 这是模拟真实用户输入的最佳实践
  element.focus();
  
  // 根据元素类型，用不同的方式赋值
  if (element.isContentEditable) {
    element.textContent = text;
  } else { // 适用于 <textarea>
    element.value = text;
  }
  
  // 手动触发一个 'input' 事件，这是关键！
  // 它会通知网页的框架（如 React）内容已经发生变化，从而更新其内部状态
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // 同时，也调用我们自己的 handleInput，让侧边栏的“当前输入”也立刻更新
  handleInput({ target: element });
}

// 新增：监听来自侧边栏(sidepanel.js)的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PASTE_TO_INPUT') {
    console.log('[Sidekick] Received paste command.');
    fillInput(message.text);
    sendResponse({ status: "ok" }); // 回复一个消息，表示已处理
  }
  
  // 为了让 sendMessage 的回调函数能正常工作，这里需要返回 true
  return true; 
});


// ===================================================================
//      第二步：你所有现有的代码，保持原样即可
// ===================================================================

// 全局变量，用于跟踪状态
let monitoredElement = null;
let lastSentText = '';
let debounceTimer;

// 定义目标网站的输入框选择器列表
const TARGET_SELECTORS = [
  '#prompt-textarea',                      // ChatGPT (div or textarea)
  'textarea.ds-input-textarea__inner',     // DeepSeek
  'textarea[data-testid="text-input"]',    // Claude
  '#searchbox',                            // Google Gemini
  '#chat-input',                           // Perplexity
  'textarea[data-testid="chat-input"]',    // Poe
  'textarea',                              // 最后的通用备用
  '[contenteditable="true"]'                 // 最后的备用可编辑元素
];

// 主动查找输入框的函数
function findInputElement() {
  for (const selector of TARGET_SELECTORS) {
    const element = document.querySelector(selector);
    // 确保找到的元素是可见的
    if (element && (element.offsetWidth > 0 || element.offsetHeight > 0)) {
      console.log(`%c[Sidekick] Found active input element with selector: ${selector}`, 'color: #28a745; font-weight: bold;');
      return element;
    }
  }
  return null;
}

// 发送消息到侧边栏
function sendMessageToPanel(text) {
  if (text.trim() === '' || text === lastSentText) {
    return;
  }

  try {
    // 注意：这里的 sendMessage 只发送 USER_INPUT，和上面的 onMessage 是独立的
    chrome.runtime.sendMessage({ type: "USER_INPUT", text: text }, (response) => {
      if (chrome.runtime.lastError) {
        monitoredElement = null; 
      } else {
        lastSentText = text;
        console.log(`[Sidekick] Sent: "${text}"`);
      }
    });
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      console.warn("[Sidekick] Extension updated. Please refresh the page.");
      observer.disconnect(); 
    } else {
      throw error;
    }
  }
}

// 处理输入事件的函数（带防抖功能）
function handleInput(event) {
  clearTimeout(debounceTimer);
  const element = event.target;
  debounceTimer = setTimeout(() => {
    const text = (element.tagName.toLowerCase() === 'textarea') ? element.value : element.textContent;
    sendMessageToPanel(text);
  }, 250);
}

// 附加事件监听器
function attachListener(element) {
  if (monitoredElement === element) {
    return;
  }
  
  if (monitoredElement) {
    monitoredElement.removeEventListener('input', handleInput);
  }
  
  console.log('[Sidekick] Attaching listener to a new element.');
  element.addEventListener('input', handleInput);
  monitoredElement = element;
  
  const initialText = (element.tagName.toLowerCase() === 'textarea') ? element.value : element.textContent;
  sendMessageToPanel(initialText);
}


// 使用 MutationObserver 持续监控页面变化
const observer = new MutationObserver(() => {
  const element = findInputElement();
  if (element) {
    attachListener(element);
  }
});

// 启动监听器
console.log('[Sidekick] Content script loaded. Starting observer.');
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false
});

// 页面加载时也尝试立即查找一次
window.addEventListener('load', () => {
    setTimeout(() => {
        const element = findInputElement();
        if (element) {
            attachListener(element);
        }
    }, 1000);
});