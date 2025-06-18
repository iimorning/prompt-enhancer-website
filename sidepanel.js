// sidepanel.js

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const currentUserInputElem = document.getElementById('currentUserInput');
const resultOutputElem = document.getElementById('resultOutput');
const copyResultBtn = document.getElementById('copyResult');
const actionButtons = document.querySelectorAll('.action-btn');

let currentUserInput = '';
let geminiApiKey = '';

// --- Gemini API 调用核心函数 ---
async function callGeminiAPI(prompt, apiKey) {
    // 定义要使用的模型
    const modelName = 'gemini-1.5-flash-latest'; // <--- 单独定义模型名称
    // API URL 使用了新的模型名称变量
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "contents": [{ "parts": [{ "text": prompt }] }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return `错误: ${error.message}`;
  }
}

// --- "元提示词" (Meta-Prompts) 库 ---
const promptLibrary = {
  analyze: (input) => `你是一位提示词分析专家。请简要分析以下用户输入，指出其可能存在的问题（例如：目标模糊、缺少上下文、信息不足等），并给出1-2条具体的改进建议。\n\n用户输入：\n---\n${input}`,
  optimize: (input) => `你是一位顶级的提示词工程师（Prompt Engineer）。请将以下用户输入优化成一个更清晰、更具体、更高效的提示词，以便AI能更好地理解和执行。直接给出优化后的提示词，不要包含任何解释性的文字。\n\n原始输入：\n---\n${input}`,
  structure: (input) => `你是一位结构化思维专家。请分析以下用户输入，并为其添加结构化的参数，例如：[角色]、[任务]、[背景]、[格式]、[约束]等，使其成为一个高质量的提示词。请以 Markdown 格式返回。\n\n用户输入：\n---\n${input}`,
  suggest: (input) => `你是一位富有启发性的AI对话教练。基于以下用户的提问，请提出3个相关的、能引导用户进行更深层次思考或探索的“更聪明”的问题。直接以无序列表的形式返回这3个问题即可。\n\n用户的提问：\n---\n${input}`,
};


// --- 事件处理 ---

// 1. 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "USER_INPUT") {
    currentUserInput = message.text;
    currentUserInputElem.textContent = currentUserInput || '正在等待用户输入...';
  }
});

// 2. 保存 API Key
saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    chrome.storage.local.set({ geminiApiKey: key }, () => {
      geminiApiKey = key;
      alert('API Key 已保存！');
    });
  }
});

// 3. 加载已保存的 API Key
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      geminiApiKey = result.geminiApiKey;
      apiKeyInput.value = geminiApiKey;
    }
  });
});

// 4. 处理功能按钮点击
actionButtons.forEach(button => {
  button.addEventListener('click', async () => {
    if (!geminiApiKey) {
      resultOutputElem.textContent = '请先设置并保存您的 Gemini API Key。';
      return;
    }
    if (!currentUserInput) {
      resultOutputElem.textContent = '主聊天窗口没有检测到输入内容。';
      return;
    }

    const action = button.dataset.action;
    const metaPrompt = promptLibrary[action](currentUserInput);

    resultOutputElem.textContent = '正在思考中，请稍候...';
    
    const result = await callGeminiAPI(metaPrompt, geminiApiKey);
    
    resultOutputElem.textContent = result;
  });
});

// 5. 复制结果
copyResultBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(resultOutputElem.textContent).then(() => {
    copyResultBtn.textContent = '已复制!';
    setTimeout(() => {
      copyResultBtn.textContent = '复制结果';
    }, 2000);
  });
});
// --- 新增功能：让结果框可点击编辑 ---

// 1. 当用户点击结果框时，使其变为可编辑状态
resultOutputElem.addEventListener('click', () => {
  // 检查结果框是否已经处于编辑模式，以及是否有内容，避免重复操作和对空框操作
  if (resultOutputElem.contentEditable !== 'true' && resultOutputElem.textContent.trim() !== '') {
    // 设置 contentEditable 属性为 true，这是让任何元素可编辑的关键
    resultOutputElem.contentEditable = true;
    
    // 添加我们刚才定义的 'editable' CSS 类，显示视觉提示
    resultOutputElem.classList.add('editable');
    
    // 立即让元素获得焦点，并把光标移动到文本末尾，方便用户直接修改
    resultOutputElem.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(resultOutputElem);
    range.collapse(false); // false 表示折叠到末尾
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

// 2. 当结果框失去焦点时（用户点击了其他地方），取消编辑状态
resultOutputElem.addEventListener('blur', () => {
  // 设置 contentEditable 属性为 false，使其变回普通的只读元素
  resultOutputElem.contentEditable = false;
  
  // 移除 'editable' CSS 类，恢复原始样式
  resultOutputElem.classList.remove('editable');
});