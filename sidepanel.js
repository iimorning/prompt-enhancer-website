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
let optimizedPrompts = [];
let currentPromptIndex = 0;
let optimizationCount = 0; // 追踪当前是第几次优化
const MAX_OPTIMIZATIONS = 3; // 定义最大优化次数 (总共3次)
// 【替换】用一个数组来存储每一版的优化结果
let sessionOptimizationHistory = []; 
// 【新增】追踪用户当前正在查看的是第几个版本
let viewingOptimizationIndex = 0; 
let initialAnalysis = ''; // 【新增】用于存储首次的问题分析结果

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

// sidepanel.js (粘贴到“工具与核心函数”区域)

// 【新增】专门用于渲染和更新版本对比视图的函数
function renderComparisonView() {
  // 获取需要操作的元素
  const promptOutputElem = document.getElementById('optimized-prompt-output');
  // 注意：我们获取的是新的 ID
  const paginationElem = document.getElementById('comparison-pagination'); 
  const prevBtn = document.getElementById('prev-version-btn');
  const nextBtn = document.getElementById('next-version-btn');

  // 如果元素不存在或历史记录为空，则直接返回
  // 注意：我们检查的是新的数组
  if (!promptOutputElem || sessionOptimizationHistory.length === 0) return; 

  // 1. 更新提示词内容
  // 注意：我们使用的是新的索引变量
  promptOutputElem.textContent = sessionOptimizationHistory[viewingOptimizationIndex];
  
 // 2. 更新分页信息，使用更简洁的 "1 / 3" 格式
paginationElem.textContent = `${viewingOptimizationIndex + 1} / ${sessionOptimizationHistory.length}`;

  // 3. 更新左右箭头按钮的禁用状态
  prevBtn.disabled = (viewingOptimizationIndex === 0);
  nextBtn.disabled = (viewingOptimizationIndex === sessionOptimizationHistory.length - 1);
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

function resetOptimization() {
   optimizationCount = 0;
    // 【替换】清空历史数组
    sessionOptimizationHistory = []; 
    viewingOptimizationIndex = 0;
    initialAnalysis = '';
    const optimizeBtn = document.getElementById('optimizeBtn');
    if(optimizeBtn) {
       optimizeBtn.disabled = false;
       optimizeBtn.textContent = '优化输入';
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
  // 首次优化：生成一个高质量的基础提示词
  optimize_initial: (input) => `作为一名顶级的提示词工程师（Prompt Engineer），请将以下用户的初步想法，转换成一个结构清晰、内容丰富、高质量的AI提示词。
  请直接给出优化后的提示词，不要包含任何解释性文字或标题。\n\n用户输入：\n---\n${input}`,
  // 再次优化：在前一次优化的基础上，增加更多细节
  optimize_again: (previous_prompt) => `作为一名提示词优化专家，请对以下这个已经很不错的提示词进行“锦上添花”式的增强。在不破坏其核心结构的前提下，
  为它增加3-4句更具体、更有深度的细节、约束或示例，使其变得更加完美。直接返回增强后的完整提示词，不要包含任何解释性的文字或标题。\n\n需要增强的提示词：\n---\n${previous_prompt}`,
  // 【保留】分析功能：只在第一次优化时调用
  analyze: (input) => `你是一位提示词分析专家。请简要分析以下用户输入，指出其可能存在的问题（例如：目标模糊、缺少上下文、信息不足等），并给出1-2条具体的改进建议。\n\n用户输入：\n---\n${input}`,
  structure: (input) => `你是一位结构化思维专家。请分析以下用户输入，并为其添加结构化的参数，例如：[角色]、[任务]、[背景]、[格式]、[约束]等，
  使其成为一个高质量的提示词。请以 Markdown 格式返回。\n\n用户输入：\n---\n${input}`,
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
    resetOptimization(); 
  }
});

// --- 功能按钮点击事件 ---
// sidepanel.js (事件处理区域)

// ↓↓↓↓ 用这段全新的代码，替换掉旧的 'optimizeBtn' 事件监听器 ↓↓↓↓
document.getElementById('optimizeBtn').addEventListener('click', async () => {
    if (!user) {
        resultOutputElem.textContent = '请先登录。';
        return;
    }

    const optimizeBtn = document.getElementById('optimizeBtn');
    let promptForApi = '';
    let apiPromises = []; // 用于存储所有 API 请求

    // 禁用按钮，防止重复点击
    optimizeBtn.disabled = true;

    // 判断这是第几次优化，并选择不同的行为
     if (optimizationCount === 0) {
        // --- 首次优化 ---
        if (!currentUserInput) {
            resultOutputElem.textContent = '没有检测到输入。';
            return;
        }
        // 【只有首次优化】才清空界面，显示加载状态
        resultOutputElem.innerHTML = '<p>正在进行首次优化与分析...</p>';
        
        apiPromises.push(callGeminiAPI(promptLibrary.optimize_initial(currentUserInput)));
        apiPromises.push(callGeminiAPI(promptLibrary.analyze(currentUserInput)));

   } else if (optimizationCount < MAX_OPTIMIZATIONS) {
    // --- 再次优化 ---
    // **在这里，我们不再触碰 resultOutputElem.innerHTML**
    // 从而让上一次的结果保持显示在界面上
    const previousPrompt = sessionOptimizationHistory[sessionOptimizationHistory.length - 1];
    apiPromises.push(callGeminiAPI(promptLibrary.optimize_again(previousPrompt)));
    
    } else {
        // 如果已经达到3次，则不执行任何操作
        optimizeBtn.disabled = true; // 确保按钮保持禁用
        return;
    }
    optimizeBtn.disabled = true;
    optimizeBtn.innerHTML = `
        <span class="spinner"></span>
        优化中...
    `; // 使用 innerHTML 来插入加载动画
     try {
        const results = await Promise.all(apiPromises);

        if (optimizationCount === 0) {
            // 【关键】将首次优化的结果存入数组，并保存分析
            sessionOptimizationHistory.push(cleanText(results[0]));
            initialAnalysis = cleanText(results[1]);
        } else {
            // 【关键】将再次优化的结果追加到数组
            sessionOptimizationHistory.push(cleanText(results[0]));
        }
           optimizationCount++;
        // 【关键】将正在查看的索引指向最新的版本
        viewingOptimizationIndex = sessionOptimizationHistory.length - 1;

        // 动态生成包含版本对比控件的全新HTML
        resultOutputElem.innerHTML = `
            <div class="result-block">
              <div class="result-block-header">
                <h4>✨ 优化后的提示词：</h4>
                <div class="comparison-controls">
                  <button id="prev-version-btn" class="icon-btn" title="上一个版本"><</button>
                  <span id="comparison-pagination"></span>
                  <button id="next-version-btn" class="icon-btn" title="下一个版本">></button>
                  <button id="copy-prompt-btn" class="icon-btn" title="复制当前版本">
                    <svg>...</svg>
                  </button>
                </div>
              </div>
              <div id="optimized-prompt-output" class="editable-result"></div>
            </div>
            <div class="result-block">
              <h4>🔬 问题分析：</h4>
              <div class="readonly-result">${initialAnalysis.replace(/\n/g, '<br>')}</div>
            </div>`;
        
        // 【关键】调用新的渲染函数来显示最新版本
        renderComparisonView();

        // 为新生成的按钮们绑定事件
        document.getElementById('prev-version-btn').addEventListener('click', () => {
            if (viewingOptimizationIndex > 0) {
                viewingOptimizationIndex--;
                renderComparisonView(); // 每次点击都重绘
            }
        });
        document.getElementById('next-version-btn').addEventListener('click', () => {
            if (viewingOptimizationIndex < sessionOptimizationHistory.length - 1) {
                viewingOptimizationIndex++;
                renderComparisonView(); // 每次点击都重绘
            }
        });
        document.getElementById('copy-prompt-btn').addEventListener('click', () => {
            const textToCopy = document.getElementById('optimized-prompt-output').textContent;
            if (textToCopy) navigator.clipboard.writeText(textToCopy);
        });
        
        // 更新主优化按钮的状态
        if (optimizationCount >= MAX_OPTIMIZATIONS) {
            optimizeBtn.textContent = '已达优化上限';
        } else {
            optimizeBtn.disabled = false;
            optimizeBtn.textContent = `再次优化 (${optimizationCount}/${MAX_OPTIMIZATIONS})`;
        }

    } catch (error) {
        resultOutputElem.textContent = `处理失败: ${error.message}`;
        resetOptimization(); 
    }
});

// 新的“结构化”按钮事件
document.getElementById('structureBtn').addEventListener('click', async () => {
    resetOptimization();
    if (!user || !currentUserInput) return;
    
    resultOutputElem.textContent = '正在思考中...';
    const metaPrompt = promptLibrary.structure(currentUserInput);
    const rawResult = await callGeminiAPI(metaPrompt);
    resultOutputElem.innerHTML = `<div class="result-block"><div class="editable-result">${cleanText(rawResult)}</div></div>`;
    
    // 在这里添加保存历史记录的逻辑
    // ...
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