// sidepanel.js (v3.0 - Refactored and Finalized)

// =============================================================
//  1. 初始化与常量定义
// =============================================================

// Supabase 客户端配置
const SUPABASE_URL = 'https://mhiyubxpmdvgondrtfsr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXl1YnhwbWR2Z29uZHJ0ZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTcxMzksImV4cCI6MjA2NTczMzEzOX0.kzAUt6NPcYpMyMm3_F9zc8-eti_HfvUAHzMdigKl8k4'; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 全局状态变量
let currentUserInput = '';
let history = []; 
let user = null;

// =============================================================
//  2. DOM 元素获取 (只获取一次！)
// =============================================================

// 认证相关
const authContainer = document.getElementById('authContainer');
const loginButton = document.getElementById('loginButton');
const authMessage = document.getElementById('authMessage');

// 主内容区
const mainContent = document.getElementById('mainContent');
const userEmailElem = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const currentUserInputElem = document.getElementById('currentUserInput');
const resultOutputElem = document.getElementById('resultOutput');
const actionButtons = document.querySelectorAll('.action-btn');

// 历史记录相关
const historyListElem = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyToggleBtn = document.getElementById('historyToggleBtn'); // 获取历史记录按钮
const historyDropdown = document.getElementById('historyDropdown');   // 获取历史记录下拉菜单

// 其他按钮
const copyResultBtn = document.getElementById('copyResultBtn');

// =============================================================
//  3. 工具与核心函数
// =============================================================

function cleanText(text) {
  if (typeof text !== 'string') return '';
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
        resultOutputElem.innerHTML = `<div class="editable-result">${item.result}</div>`;
        currentUserInput = item.userInput;
        historyDropdown.classList.remove('active'); // 点击后关闭历史记录
        document.querySelector('.container').scrollTop = 0;
      });
      historyListElem.appendChild(historyItem);
    });
  }
}

async function loadUserHistory() {
  if (!user) return;
  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    history = data.map(item => ({
        id: item.id,
        userInput: item.user_input,
        result: item.result,
        action: item.action,
        timestamp: new Date(item.created_at).toLocaleString('zh-CN')
    }));
    
    renderHistory();
  } catch (error) {
    console.error('Error loading history from Supabase:', error);
    historyListElem.innerHTML = '<p class="history-empty-message">加载历史记录失败。</p>';
  }
}

async function callGeminiAPI(prompt) {
  try {
    const { data, error } = await supabase.functions.invoke('call-gemini', {
      body: { prompt: prompt },
    });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error("Failed to invoke Supabase function:", error);
    return `错误: ${error.message}`;
  }
}

const promptLibrary = {
  analyze: (input) => `你是一位提示词分析专家。请简要分析以下用户输入，指出其可能存在的问题（例如：目标模糊、缺少上下文、信息不足等），并给出1-2条具体的改进建议。\n\n用户输入：\n---\n${input}`,
  optimize: (input) => `你是一位顶级的提示词工程师（Prompt Engineer）。请将以下用户输入优化成一个更清晰、更具体、更高效的提示词，以便AI能更好地理解和执行。直接给出优化后的提示词，不要包含任何解释性的文字。\n\n原始输入：\n---\n${input}`,
  structure: (input) => `你是一位结构化思维专家。请分析以下用户输入，并为其添加结构化的参数，例如：[角色]、[任务]、[背景]、[格式]、[约束]等，使其成为一个高质量的提示词。请以 Markdown 格式返回。\n\n用户输入：\n---\n${input}`,
};

// =============================================================
//  4. 事件处理与监听器 (只绑定一次！)
// =============================================================

// --- 认证相关事件 ---
loginButton.addEventListener('click', () => {
  const manifest = chrome.runtime.getManifest();
  const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
  const params = new URLSearchParams({
    client_id: manifest.oauth2.client_id,
    response_type: 'id_token',
    redirect_uri: `https://${chrome.runtime.id}.chromiumapp.org/`,
    scope: manifest.oauth2.scopes.join(' '),
    nonce: (Math.random() * 10000).toString()
  });
  authUrl.search = params.toString();

  chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true },
    async (redirectedTo) => {
      if (chrome.runtime.lastError || !redirectedTo) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const url = new URL(redirectedTo);
      const urlParams = new URLSearchParams(url.hash.substring(1));
      const id_token = urlParams.get('id_token');
      if (!id_token) {
        console.error('在返回的 URL 中未找到 id_token');
        return;
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });
      if (error) console.error('Supabase 登录失败:', error);
    }
  );
});

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) {
        user = session.user;
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
        userEmailElem.textContent = `已登录: ${user.email}`;
        loadUserHistory();
    } else {
        user = null;
        history = [];
        renderHistory();
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
    }
});

// --- content.js 消息监听 ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "USER_INPUT") {
    currentUserInput = message.text;
    currentUserInputElem.textContent = currentUserInput || '正在等待用户输入...';
  }
});

// --- 功能按钮点击事件 ---
actionButtons.forEach(button => {
  button.addEventListener('click', async () => {
    if (!user || !currentUserInput) {
      resultOutputElem.textContent = !user ? '请先登录。' : '没有检测到输入。';
      return;
    }
    const action = button.dataset.action;
    if (action === 'optimize-and-analyze') {
      resultOutputElem.innerHTML = '<p>正在优化和分析中...</p>';
      const optimizePromise = callGeminiAPI(promptLibrary.optimize(currentUserInput));
      const analyzePromise = callGeminiAPI(promptLibrary.analyze(currentUserInput));
      try {
        const [optimizeResult, analyzeResult] = await Promise.all([optimizePromise, analyzePromise]);
        resultOutputElem.innerHTML = `
          <div class="result-block"><h4>✨ 优化后的提示词：</h4><div class="editable-result">${cleanText(optimizeResult)}</div></div>
          <div class="result-block"><h4>🔬 问题分析：</h4><div class="readonly-result">${cleanText(analyzeResult).replace(/\n/g, '<br>')}</div></div>`;
      } catch (error) { resultOutputElem.textContent = `处理失败: ${error.message}`; }
    } else {
      resultOutputElem.textContent = '正在思考中...';
      const metaPrompt = promptLibrary[action](currentUserInput);
      const rawResult = await callGeminiAPI(metaPrompt);
      resultOutputElem.innerHTML = `<div class="editable-result">${cleanText(rawResult)}</div>`;
    }
    try {
        const resultText = resultOutputElem.querySelector('.editable-result')?.textContent || resultOutputElem.textContent;
        const { error } = await supabase.from('history').insert({ user_input: currentUserInput, action, result: resultText });
        if (error) throw error;
        loadUserHistory();
    } catch(error) {
        console.error('Error saving history after action:', error);
    }
  });
});

// --- 其他 UI 交互事件 ---
copyResultBtn.addEventListener('click', () => {
  const editableResult = resultOutputElem.querySelector('.editable-result');
  const textToCopy = editableResult ? editableResult.textContent : resultOutputElem.textContent;
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyResultBtn.classList.add('is-copied');
      setTimeout(() => copyResultBtn.classList.remove('is-copied'), 1500);
    });
  }
});

clearHistoryBtn.addEventListener('click', async () => {
  if (!user || !confirm('确定要清空所有历史记录吗？')) return;
  try {
    const { error } = await supabase.from('history').delete().eq('user_id', user.id);
    if (error) throw error;
    history = [];
    renderHistory();
  } catch (error) {
     alert('清空历史记录失败。');
  }
});

// 【关键修复】为历史记录按钮添加事件监听器
historyToggleBtn.addEventListener('click', (event) => {
  historyDropdown.classList.toggle('active');
  event.stopPropagation();
});

document.addEventListener('click', (event) => {
  const target = event.target;
  const editableTarget = target.closest('.editable-result');
  if (editableTarget && editableTarget.contentEditable !== 'true') {
    editableTarget.contentEditable = true;
    editableTarget.classList.add('editable');
    editableTarget.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editableTarget);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  if (!historyDropdown.contains(target) && !target.closest('#historyToggleBtn')) {
    historyDropdown.classList.remove('active');
  }
});

document.addEventListener('blur', (event) => {
    if (event.target.classList.contains('editable-result')) {
        event.target.contentEditable = false;
        event.target.classList.remove('editable');
    }
}, true);