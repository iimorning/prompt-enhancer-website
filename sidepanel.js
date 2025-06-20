// sidepanel.js (v2.0 - Refactored with robust copy logic)

// --- 全局变量和常量 ---
const GEMINI_API_KEY = "AIzaSyB6ALtaxikMP3yLtaRwO4tn-XKA_SpmE3g"; // <--- 确保这里是你的真实 Key
let currentUserInput = '';
let history = []; 

// --- DOM Elements ---
const currentUserInputElem = document.getElementById('currentUserInput');
const resultOutputElem = document.getElementById('resultOutput');
const actionButtons = document.querySelectorAll('.action-btn');
const historyListElem = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyDropdown = document.getElementById('historyDropdown');
// 新的复制按钮
const copyResultBtn = document.getElementById('copyResultBtn'); 

// --- 工具函数 ---
function cleanText(text) {
  let cleanedText = text.replace(/[*#]/g, '');
  cleanedText = cleanedText.replace(/\n\s*\n/g, '\n\n').trim();
  return cleanedText;
}

function renderHistory() {
  historyListElem.innerHTML = ''; 
  if (history.length === 0) {
    historyListElem.innerHTML = '<p class="history-empty-message">暂无历史记录。</p>';
  } else {
    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.id = item.id;
      historyItem.innerHTML = `
        <p><strong>输入:</strong> ${item.userInput}</p>
        <p><strong>结果:</strong> ${item.result}</p>
        <div class="timestamp">${item.timestamp}</div>`;
      historyItem.addEventListener('click', () => {
        currentUserInputElem.textContent = item.userInput;
        resultOutputElem.innerHTML = `<div class="editable-result">${item.result}</div>`; // 点击历史也恢复为可编辑
        currentUserInput = item.userInput;
        document.querySelector('.container').scrollTop = 0;
      });
      historyListElem.appendChild(historyItem);
    });
  }
}

async function callGeminiAPI(prompt, apiKey) {
  const modelName = 'gemini-1.5-flash-latest';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "contents": [{ "parts": [{ "text": prompt }] }] }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return `错误: ${error.message}`;
  }
}

const promptLibrary = {
  analyze: (input) => `你是一位提示词分析专家。请简要分析以下用户输入，指出其可能存在的问题（例如：目标模糊、缺少上下文、信息不足等），并给出1-2条具体的改进建议。\n\n用户输入：\n---\n${input}`,
  optimize: (input) => `你是一位顶级的提示词工程师（Prompt Engineer）。请将以下用户输入优化成一个更清晰、更具体、更高效的提示词，以便AI能更好地理解和执行。直接给出优化后的提示词，不要包含任何解释性的文字。\n\n原始输入：\n---\n${input}`,
  structure: (input) => `你是一位结构化思维专家。请分析以下用户输入，并为其添加结构化的参数，例如：[角色]、[任务]、[背景]、[格式]、[约束]等，使其成为一个高质量的提示词。请以 Markdown 格式返回。\n\n用户输入：\n---\n${input}`,
};


// --- 事件处理 ---

// 1. 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "USER_INPUT") {
    currentUserInput = message.text;
    currentUserInputElem.textContent = currentUserInput || '正在等待用户输入...';
  }
});

// 2. 处理功能按钮点击
actionButtons.forEach(button => {
  button.addEventListener('click', async () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("在这里")) {
      resultOutputElem.textContent = '请在 sidepanel.js 文件中设置您的 Gemini API Key。';
      return;
    }
    if (!currentUserInput) {
      resultOutputElem.textContent = '主聊天窗口没有检测到输入内容。';
      return;
    }
    const action = button.dataset.action;
    
    if (action === 'optimize-and-analyze') {
      resultOutputElem.innerHTML = '<p>正在优化和分析中...</p>';
      const optimizePromise = callGeminiAPI(promptLibrary.optimize(currentUserInput), GEMINI_API_KEY);
      const analyzePromise = callGeminiAPI(promptLibrary.analyze(currentUserInput), GEMINI_API_KEY);
      try {
        const [optimizeResult, analyzeResult] = await Promise.all([optimizePromise, analyzePromise]);
        resultOutputElem.innerHTML = `
          <div class="result-block">
            <div class="result-block-header"><h4>✨ 优化后的提示词：</h4></div>
            <div class="editable-result">${cleanText(optimizeResult)}</div>
          </div>
          <div class="result-block">
            <div class="result-block-header"><h4>🔬 问题分析：</h4></div>
            <div class="readonly-result">${cleanText(analyzeResult).replace(/\n/g, '<br>')}</div>
          </div>`;
      } catch (error) { resultOutputElem.textContent = `处理失败: ${error.message}`; }
    } else {
      resultOutputElem.textContent = '正在思考中...';
      const metaPrompt = promptLibrary[action](currentUserInput);
      const rawResult = await callGeminiAPI(metaPrompt, GEMINI_API_KEY);
      resultOutputElem.innerHTML = `<div class="editable-result">${cleanText(rawResult)}</div>`;
    }

    const itemToSave = {
      id: Date.now(),
      userInput: currentUserInput,
      action: action,
      result: resultOutputElem.querySelector('.editable-result')?.textContent || resultOutputElem.textContent,
      timestamp: new Date().toLocaleString('zh-CN')
    };
    history.push(itemToSave);
    chrome.storage.local.set({ history: history }, () => renderHistory());
  });
});

document.addEventListener('blur', (event) => {
    if (event.target.classList.contains('editable-result')) {
        event.target.contentEditable = false;
        event.target.classList.remove('editable');
    }
}, true);

// 4. 新的、智能的复制按钮逻辑
copyResultBtn.addEventListener('click', () => {
  let textToCopy = '';
  const editableResult = resultOutputElem.querySelector('.editable-result');
  if (editableResult) {
    textToCopy = editableResult.textContent;
  } else if (resultOutputElem.textContent.trim() !== '') {
    textToCopy = resultOutputElem.textContent;
  }
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyResultBtn.classList.add('is-copied');
      setTimeout(() => {
        copyResultBtn.classList.remove('is-copied');
      }, 1500);
    });
  }
});

// 5. 历史记录相关
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['history'], (result) => {
    if (result.history) {
      history = result.history;
      renderHistory();
    }
  });
});
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    history = [];
    chrome.storage.local.set({ history: [] }, () => renderHistory());
  }
});
historyToggleBtn.addEventListener('click', (event) => {
  historyDropdown.classList.toggle('active');
  event.stopPropagation(); 
});

// --- 整合的全局点击事件监听器 ---
document.addEventListener('click', (event) => {
  const target = event.target;
  
  // 逻辑 1：处理“点击编辑”
  const editableTarget = target.closest('.editable-result');
  if (editableTarget && editableTarget.contentEditable !== 'true') {
    editableTarget.contentEditable = true;
    editableTarget.classList.add('editable');
    editableTarget.focus();
    // 移动光标的代码
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editableTarget);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    // 注意：这里我们不阻止事件继续，因为可能还需要执行关闭下拉菜单的逻辑
  }

  // 逻辑 2：处理“点击外部关闭下拉菜单”
  // 检查点击的既不是下拉菜单本身，也不是触发它的按钮
  if (!historyDropdown.contains(target) && !target.closest('#historyToggleBtn')) {
    historyDropdown.classList.remove('active');
  }
});
