
// =============================================================
//  1. 初始化与常量定义
// =============================================================
const SUPABASE_URL = 'https://mhiyubxpmdvgondrtfsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXl1YnhwbWR2Z29uZHJ0ZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTcxMzksImV4cCI6MjA2NTczMzEzOX0.kzAUt6NPcYpMyMm3_F9zc8-eti_HfvUAHzMdigKl8k4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_OPTIMIZATIONS = 3;
let user = null;
let currentUserInput = '';
let history = [];
let optimizationCount = 0;
let sessionOptimizationHistory = [];
let viewingOptimizationIndex = 0;
let initialAnalysis = '';
let currentLanguage = 'en'; // 添加当前语言跟踪，默认英文
let currentTheme = 'light'; // 添加当前主题跟踪

// 定义主界面输入框选择器（与content.js保持一致）
const TARGET_SELECTORS = [
  '#prompt-textarea',                      // ChatGPT (div or textarea)
  'textarea.ds-input-textarea__inner',     // DeepSeek
  'textarea[data-testid="text-input"]',    // Claude
  '#searchbox',                            // Google Gemini
  '#chat-input',                           // Perplexity
  'textarea[data-testid="chat-input"]',    // Poe
  'textarea',                              // 最后的通用备用
  '[contenteditable="true"]'               // 最后的备用可编辑元素
];

// =============================================================
//  1.5. 工具函数定义
// =============================================================

// 格式化优化结果的函数
function formatOptimizedResult(text) {
    // 先清理文本，移除开头和结尾的空白
    const cleanText = text.trim();
    if (!cleanText) return '';

    const lines = cleanText.split('\n');
    let formattedHtml = '';
    let lastWasEmpty = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 处理空行，但避免连续的空行
        if (line === '') {
            if (!lastWasEmpty && formattedHtml !== '') {
                formattedHtml += '<br>';
                lastWasEmpty = true;
            }
            continue;
        }

        lastWasEmpty = false;

        // 检查是否是标题（中文和英文）
        if (line.includes('潜在问题：') || line.includes('改进建议：') ||
            line.includes('Potential Issues:') || line.includes('Improvement Suggestions:') ||
            line.includes('问题分析：') || line.includes('优化建议：') ||
            line.includes('Problem Analysis:') || line.includes('Optimization Suggestions:') ||
            line.includes('具体领域：') || line.includes('Specific Areas:') ||
            line.includes('技能框架：') || line.includes('Skills Framework:') ||
            line.includes('学习路径：') || line.includes('Learning Path:') ||
            line.includes('实现路径：') || line.includes('Implementation Path:')) {
            formattedHtml += `<div class="analysis-section-title">${line}</div>`;
        } else {
            formattedHtml += `<div class="analysis-content">${line}</div>`;
        }
    }

    return formattedHtml;
}

// =============================================================
//  2. DOM 元素获取 (只在脚本开始时获取一次)
// =============================================================
const authContainer = document.getElementById('authContainer');
const loginButton = document.getElementById('loginButton');
const mainContent = document.getElementById('mainContent');
const userEmailElem = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const currentUserInputElem = document.getElementById('currentUserInput');
const optimizeBtn = document.getElementById('optimizeBtn');
const structureBtn = document.getElementById('structureBtn');
const resultOutputElem = document.getElementById('resultOutput');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyDropdown = document.getElementById('historyDropdown');
const historyListElem = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const voiceInputBtn = document.getElementById('voice-input-btn');

// =============================================================
//  3. 核心函数
// =============================================================
function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[*#]/g, '').replace(/\n\s*\n/g, '\n\n').trim();
}

// 显示复制成功反馈
function showCopyFeedback(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  // 如果按钮已经在显示成功状态，则不重复执行
  if (button.dataset.showingFeedback === 'true') return;

  // 标记按钮正在显示反馈状态
  button.dataset.showingFeedback = 'true';

  const originalTitle = button.title;
  const originalHTML = button.innerHTML;
  const originalColor = button.style.color;

  // 临时显示复制成功状态
  button.title = '复制成功！';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;
  button.style.color = '#10b981';

  // 清除可能存在的旧定时器
  if (button.feedbackTimer) {
    clearTimeout(button.feedbackTimer);
  }

  // 1.5秒后恢复原状
  button.feedbackTimer = setTimeout(() => {
    // 确保按钮仍然存在且仍在显示反馈状态
    if (button && button.dataset.showingFeedback === 'true') {
      button.title = originalTitle;
      button.innerHTML = originalHTML;
      button.style.color = originalColor;
      button.dataset.showingFeedback = 'false';
      button.feedbackTimer = null;
    }
  }, 1500);
}

function resetOptimization() {
  optimizationCount = 0;
  sessionOptimizationHistory = [];
  viewingOptimizationIndex = 0;
  initialAnalysis = '';
  optimizeBtn.disabled = false;
  optimizeBtn.textContent = window.getMessage('optimizeInputButton', currentLanguage);
  optimizeBtn.title = window.getMessage('optimizeButtonWithShortcut', currentLanguage);
}

function renderComparisonView() {
  const promptOutputElem = document.getElementById('optimized-prompt-output');
  const paginationElem = document.getElementById('comparison-pagination');
  const prevBtn = document.getElementById('prev-version-btn');
  const nextBtn = document.getElementById('next-version-btn');
  if (!promptOutputElem || sessionOptimizationHistory.length === 0) return;
  promptOutputElem.innerHTML = formatOptimizedResult(sessionOptimizationHistory[viewingOptimizationIndex]);
  paginationElem.textContent = `${viewingOptimizationIndex + 1} / ${sessionOptimizationHistory.length}`;
  prevBtn.disabled = (viewingOptimizationIndex === 0);
  nextBtn.disabled = (viewingOptimizationIndex === sessionOptimizationHistory.length - 1);
}

function renderHistory() {
  historyListElem.innerHTML = '';
  if (history.length === 0) {
    historyListElem.innerHTML = `<p class="history-empty-message">${window.getMessage('noHistoryMessage', currentLanguage)}</p>`;
    return;
  }
  history.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    // 智能截断文本 - 根据容器宽度调整
    const truncateText = (text, maxLength = 50) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    historyItem.innerHTML = `
      <p><strong>输入:</strong> ${truncateText(item.userInput)}</p>
      <p><strong>结果:</strong> ${truncateText(item.result)}</p>
      <div class="timestamp">${item.timestamp}</div>
    `;

    historyItem.addEventListener('click', () => {
      currentUserInputElem.textContent = item.userInput;
      resultOutputElem.innerHTML = `<div class="result-block"><div class="editable-result">${item.result}</div></div>`;
      currentUserInput = item.userInput;
      resetOptimization();
      historyDropdown.classList.remove('active');
    });
    historyListElem.appendChild(historyItem);
  });
}

async function loadUserHistory() {
  if (!user) return;
  try {
    const { data, error } = await supabase.from('history').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    history = data.map(item => ({
        id: item.id,
        userInput: item.user_input,
        result: item.result,
        timestamp: new Date(item.created_at).toLocaleString(currentLanguage === 'en' ? 'en-US' : 'zh-CN')
    }));
    renderHistory();
  } catch (error) {
    console.error('Error loading history:', error);
  }
}
// sidepanel.js (工具与核心函数区域)

// ↓↓↓↓ 用这段全新的函数，替换掉旧的 callGeminiAPI 函数 ↓↓↓↓
async function callGeminiAPI(action, input, onChunk = null) {
  try {
    // 获取 Supabase 配置
    const supabaseUrl = supabase.supabaseUrl;
    const supabaseKey = supabase.supabaseKey;

    // 直接调用 Edge Function 的 URL，传递语言信息
    const response = await fetch(`${supabaseUrl}/functions/v1/call-gemini`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, input, language: currentLanguage }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 如果提供了 onChunk 回调，处理流式响应
    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  onChunk(content, fullText); // 调用回调函数
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullText;
    } else {
      // 非流式响应的处理（保持兼容性）
      const text = await response.text();
      return text;
    }
  } catch (error) {
    console.error("Function invoke error:", error);
    return `错误: ${error.message}`;
  }
}

// =============================================================
//  4. 事件监听器
// =============================================================
// 在现有的事件监听器设置中添加
function setupEventListeners() {
  // 监听语言变更事件
  window.addEventListener('languageChanged', (event) => {
    updateDynamicContent();
  });

  // 登录按钮事件
  loginButton.addEventListener('click', () => {
    const manifest = chrome.runtime.getManifest();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    const params = new URLSearchParams({
      client_id: manifest.oauth2.client_id,
      response_type: 'id_token',
      redirect_uri: `https://${chrome.runtime.id}.chromiumapp.org/`,
      scope: manifest.oauth2.scopes.join(' '),
      nonce: String(Math.random()),
    });
    authUrl.search = params.toString();
    chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true }, async (redirectedTo) => {
      if (chrome.runtime.lastError || !redirectedTo) return console.error(chrome.runtime.lastError);
      const url = new URL(redirectedTo);
      const id_token = new URLSearchParams(url.hash.substring(1)).get('id_token');
      if (id_token) await supabase.auth.signInWithIdToken({ provider: 'google', token: id_token });
    });
  });

  // 【修复】将语音功能代码移到这里，与其他事件监听器平级
  // --- 语音输入功能 ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    window.recognition = recognition; // 设为全局变量以便语言切换时访问
    recognition.continuous = false;
    recognition.lang = currentLanguage === 'en' ? 'en-US' : 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // 为语音按钮绑定点击事件
    voiceInputBtn.addEventListener('click', async () => {
      console.log('麦克风按钮被点击了！准备启动识别...');
      console.log('当前的 recognition 对象是:', recognition);

      // 检查是否为安全上下文
      if (!window.isSecureContext) {
        alert(window.getMessage('httpsRequired', currentLanguage) || '语音功能需要HTTPS连接，请使用https://访问网站');
        return;
      }

      // 检查麦克风权限
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          console.log('麦克风权限状态:', permission.state);

          if (permission.state === 'denied') {
            alert(window.getMessage('microphonePermissionDenied', currentLanguage) || '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
            return;
          }
        }

        recognition.start();
      } catch (error) {
        console.error('权限检查失败:', error);
        recognition.start(); // 仍然尝试启动，让浏览器处理权限请求
      }
    });

    // 当开始聆听时
    recognition.onstart = () => {
      voiceInputBtn.classList.add('is-listening');
      voiceInputBtn.title = window.getMessage('listening', currentLanguage);
    };

    // 当获取到最终结果时
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      currentUserInput = transcript;
      currentUserInputElem.textContent = transcript;
      resetOptimization();
    };

    // 当识别结束时
    recognition.onend = () => {
      voiceInputBtn.classList.remove('is-listening');
      voiceInputBtn.title = window.getMessage('voiceInputTitle', currentLanguage);
    };

    // 当发生错误时
    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);

      // 提供更详细的错误信息
      let errorMessage = '';
      switch(event.error) {
        case 'not-allowed':
          errorMessage = window.getMessage('microphonePermissionDenied', currentLanguage) || '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
          break;
        case 'no-speech':
          errorMessage = window.getMessage('noSpeechDetected', currentLanguage) || '未检测到语音，请重试';
          break;
        case 'audio-capture':
          errorMessage = window.getMessage('audioCaptureFailed', currentLanguage) || '音频捕获失败，请检查麦克风设备';
          break;
        case 'network':
          errorMessage = window.getMessage('networkError', currentLanguage) || '网络错误，请检查网络连接';
          break;
        case 'service-not-allowed':
          errorMessage = window.getMessage('speechServiceNotAllowed', currentLanguage) || '语音服务不可用，请确保使用HTTPS访问';
          break;
        default:
          errorMessage = window.getMessage('speechRecognitionError', currentLanguage) || `语音识别错误: ${event.error}`;
      }

      // 显示错误提示
      alert(errorMessage);

      // 重置按钮状态
      voiceInputBtn.classList.remove('is-listening');
      voiceInputBtn.title = window.getMessage('voiceInputTitle', currentLanguage);
    };
  } else {
    // 如果浏览器不支持，则隐藏语音按钮
    voiceInputBtn.style.display = 'none';
    console.warn("浏览器不支持 Web Speech API。");

    // 显示诊断信息
    console.log("语音功能诊断信息:");
    console.log("- 浏览器:", navigator.userAgent);
    console.log("- 是否安全上下文:", window.isSecureContext);
    console.log("- 协议:", window.location.protocol);
    console.log("- 主机:", window.location.host);
  }

  // 添加语音功能诊断函数
  window.diagnoseSpeechSupport = function() {
    console.log("=== 语音功能诊断报告 ===");
    console.log("1. 浏览器支持:");
    console.log("   - SpeechRecognition:", !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    console.log("   - getUserMedia:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log("2. 安全上下文:");
    console.log("   - isSecureContext:", window.isSecureContext);
    console.log("   - 协议:", window.location.protocol);
    console.log("   - 主机:", window.location.host);
    console.log("3. 权限API:");
    console.log("   - permissions API:", !!navigator.permissions);
    console.log("4. 用户代理:", navigator.userAgent);
    console.log("========================");

    if (!window.isSecureContext) {
      console.warn("⚠️ 警告: 当前不是安全上下文，语音功能可能无法正常工作");
      console.log("💡 解决方案: 请使用 https:// 协议访问，或在 localhost 上测试");
    }
  };

  // 设置按钮事件监听器
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsDropdown = document.getElementById('settingsDropdown');
  
  if (settingsBtn && settingsDropdown) {
    // 设置按钮点击事件
    settingsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = settingsDropdown.style.display !== 'none';
      settingsDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // 点击其他地方关闭设置菜单
    document.addEventListener('click', function(e) {
      const settingsContainer = document.querySelector('.settings-container');
      
      if (settingsContainer && !settingsContainer.contains(e.target)) {
        settingsDropdown.style.display = 'none';
      }
    });
  }
  
  // 产品主页按钮事件
  const landingPageButton = document.getElementById('landingPageButton');
  landingPageButton.addEventListener('click', () => {
    const landingPageUrl = chrome.runtime.getURL('landing-page.html');
    chrome.tabs.create({ url: landingPageUrl });
  });

  // 登出按钮事件
  logoutButton.addEventListener('click', () => supabase.auth.signOut());
  
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) {
      user = session.user;
      authContainer.style.display = 'none';
      mainContent.style.display = 'block';
      
      // 更新用户邮箱显示（如果还保留原来的显示）
      if (userEmailElem) {
        userEmailElem.textContent = `已登录: ${user.email}`;
      }
      
      // 更新设置菜单中的用户邮箱
      const userEmailInSettingsElem = document.getElementById('userEmailInSettings');
      if (userEmailInSettingsElem) {
        userEmailInSettingsElem.textContent = user.email;
      }
      
      loadUserHistory();
    } else {
      user = null;
      history = [];
      renderHistory();
      authContainer.style.display = 'block';
      mainContent.style.display = 'none';
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "USER_INPUT") {
      currentUserInput = message.text;
      currentUserInputElem.textContent = currentUserInput || window.getMessage('waitingForInput', currentLanguage);
      resetOptimization();
    } else if (message.type === "TRIGGER_OPTIMIZATION") {
      // 处理TAB键触发的优化请求
      currentUserInput = message.text;
      currentUserInputElem.textContent = currentUserInput;
      currentUserInputElem.classList.remove('placeholder');
      resetOptimization();

      // 触发优化功能
      if (user && currentUserInput && !optimizeBtn.disabled) {
        optimizeBtn.click();
      }
    }
  });

  // 音频功能已移除

  optimizeBtn.addEventListener('click', async () => {
    if (!user || (optimizationCount === 0 && !currentUserInput)) return;

    // 音频功能已移除

    optimizeBtn.disabled = true;
    optimizeBtn.innerHTML = `<span class="spinner"></span> ${window.getMessage('optimizing', currentLanguage)}`;

    try {
      if (optimizationCount === 0) {
        // 首次优化：同时进行优化和分析
        // 创建流式显示的容器，包含初始加载状态
        resultOutputElem.innerHTML = `
          <div class="result-block">
            <div class="result-block-header">
              <h4>${window.getMessage('optimizedPromptTitle', currentLanguage)}</h4>
              <div class="comparison-controls">
                <button id="prev-version-btn" class="icon-btn" title="上一个版本"><</button>
                <span id="comparison-pagination">1 / 1</span>
                <button id="next-version-btn" class="icon-btn" title="下一个版本">></button>
                <button id="copy-prompt-btn" class="icon-btn" title="复制当前版本">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
            <div id="optimized-prompt-output" class="editable-result">
              <div class="loading-state">
                <span class="spinner"></span>
                <span class="loading-text">${window.getMessage('generatingOptimizedPrompt', currentLanguage)}</span>
              </div>
            </div>
          </div>
          <div class="result-block">
            <h4>${window.getMessage('problemAnalysisTitle', currentLanguage)}</h4>
            <div id="analysis-output" class="readonly-result">
              <div class="loading-state">
                <span class="spinner"></span>
                <span class="loading-text">${window.getMessage('analyzingInput', currentLanguage)}</span>
              </div>
            </div>
          </div>`;

        const promptOutputElem = document.getElementById('optimized-prompt-output');
        const analysisOutputElem = document.getElementById('analysis-output');

        // 并行处理优化和分析，使用流式显示
        const [optimizedResult, analysisResult] = await Promise.all([
          callGeminiAPI('optimize_initial', currentUserInput, (chunk, fullText) => {
            promptOutputElem.innerHTML = formatOptimizedResult(fullText);
          }),
          callGeminiAPI('analyze', currentUserInput, (chunk, fullText) => {
            analysisOutputElem.innerHTML = formatAnalysisResult(fullText);
          })
        ]);

        sessionOptimizationHistory.push(cleanText(optimizedResult));
        initialAnalysis = cleanText(analysisResult);

      } else if (optimizationCount < MAX_OPTIMIZATIONS) {
        // 再次优化
        const previousPrompt = sessionOptimizationHistory[sessionOptimizationHistory.length - 1];

        // 获取显示容器，保留原内容直到新内容生成完成
        const promptOutputElem = document.getElementById('optimized-prompt-output');

        const result = await callGeminiAPI('optimize_again', previousPrompt, (chunk, fullText) => {
          if (promptOutputElem) {
            // 直接更新内容，不需要额外的加载指示器（按钮已经显示"优化中..."）
            promptOutputElem.innerHTML = formatOptimizedResult(fullText);
          }
        });

        sessionOptimizationHistory.push(cleanText(result));
      } else {
        return;
      }

      optimizationCount++;
      viewingOptimizationIndex = sessionOptimizationHistory.length - 1;

      // 更新控件
      renderComparisonView();
      document.getElementById('prev-version-btn')?.addEventListener('click', () => {
        if (viewingOptimizationIndex > 0) {
          viewingOptimizationIndex--;
          renderComparisonView();
        }
      });
      document.getElementById('next-version-btn')?.addEventListener('click', () => {
        if (viewingOptimizationIndex < sessionOptimizationHistory.length - 1) {
          viewingOptimizationIndex++;
          renderComparisonView();
        }
      });
      // 复制按钮事件已通过事件委托处理，无需重复绑定

      if (optimizationCount >= MAX_OPTIMIZATIONS) {
        optimizeBtn.textContent = window.getMessage('optimizationLimitReached', currentLanguage);
      } else {
        optimizeBtn.disabled = false;
        optimizeBtn.textContent = `${window.getMessage('optimizeAgainButton', currentLanguage)} (${optimizationCount}/${MAX_OPTIMIZATIONS})`;
      }

      try {
        await supabase.from('history').insert({
          user_input: currentUserInput,
          action: `optimize-v${optimizationCount}`,
          result: sessionOptimizationHistory[sessionOptimizationHistory.length - 1]
        });
        loadUserHistory();
      } catch (e) {
        console.error('Error saving history:', e);
      }
    } catch (error) {
      resultOutputElem.textContent = `${window.getMessage('processingFailed', currentLanguage)}: ${error.message}`;
      resetOptimization();
    }
  });

 // sidepanel.js (事件处理区域)

// 格式化分析结果的函数
function formatAnalysisResult(text) {
    // 先清理文本，移除开头和结尾的空白
    const cleanText = text.trim();
    if (!cleanText) return '';

    const lines = cleanText.split('\n');
    let formattedHtml = '';
    let lastWasEmpty = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 处理空行，但避免连续的空行
        if (line === '') {
            if (!lastWasEmpty && formattedHtml !== '') {
                formattedHtml += '<br>';
                lastWasEmpty = true;
            }
            continue;
        }

        lastWasEmpty = false;

        // 检查是否是小标题（中文和英文）
        if (line.includes('潜在问题：') || line.includes('改进建议：') ||
            line.includes('Potential Issues:') || line.includes('Improvement Suggestions:') ||
            line.includes('问题分析：') || line.includes('优化建议：') ||
            line.includes('Problem Analysis:') || line.includes('Optimization Suggestions:')) {
            formattedHtml += `<div class="analysis-section-title">${line}</div>`;
        } else {
            formattedHtml += `<div class="analysis-content">${line}</div>`;
        }
    }

    return formattedHtml;
}



// 识别是否为结构化标题的函数
function isStructureTitle(line) {
    const titlePatterns = [
        // 新的中文标题（专家模式）
        '角色与使命',
        '核心原则与方法论',
        '专业能力与工具集',
        '互动风格与语气',
        // 旧的中文标题（向后兼容）
        '角色与目标',
        '核心原则与哲学',
        '知识领域',
        // 英文标题
        'Role & Mission',
        'Core Principles & Methodology',
        'Expertise & Capabilities',
        'Interaction Style & Tone',
        // 旧的英文标题（向后兼容）
        'Role & Objectives',
        'Core Principles & Philosophy',
        'Knowledge Domains',
        'Role and Objectives',
        'Core Principles and Philosophy',
        'Knowledge Domain',
        'Interaction Style and Tone'
    ];

    // 只匹配完全相同的标题模式
    return titlePatterns.includes(line.trim());
}

// 格式化结构化提示词的函数
function formatStructuredPrompt(text) {
    // 先清理文本，移除开头和结尾的空白
    const cleanText = text.trim();
    if (!cleanText) return '';

    // 将文本按行分割
    const lines = cleanText.split('\n');
    let formattedHtml = '';
    let lastWasEmpty = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 处理空行，但避免连续的空行
        if (line === '') {
            if (!lastWasEmpty && formattedHtml !== '') {
                formattedHtml += '<div style="height: 8px;"></div>';
                lastWasEmpty = true;
            }
            continue;
        }

        // 跳过分隔符（如 --- 或 ——— 等）
        if (line.match(/^[-—=]{3,}$/)) {
            continue;
        }

        lastWasEmpty = false;

        // 处理一级标题 (# 标题 或 常见的结构化标题)
        if (line.startsWith('# ')) {
            formattedHtml += `<div class="structure-title-h1">${line.substring(2)}</div>`;
        }
        // 处理二级标题 (## 标题)
        else if (line.startsWith('## ')) {
            formattedHtml += `<div class="structure-title-h2">${line.substring(3)}</div>`;
        }
        // 识别常见的结构化标题模式
        else if (isStructureTitle(line)) {
            formattedHtml += `<div class="structure-title-h1">${line}</div>`;
        }
        // 处理列表项 (- 或数字.)
        else if (line.startsWith('- ') || /^\d+\.\s/.test(line)) {
            formattedHtml += `<div class="structure-list-item">${line}</div>`;
        }
        // 处理带冒号的小标题（中文"角色名称："或英文"Role Name:"）
        else if ((line.endsWith('：') && line.length < 15 && !line.includes('，') && !line.includes('。')) ||
                 (line.endsWith(':') && line.length < 20 && !line.includes(',') && !line.includes('.'))) {
            formattedHtml += `<div class="structure-title-h2">${line}</div>`;
        }
        // 处理粗体文本 (**文本**)
        else if (line.includes('**')) {
            const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="structure-bold">$1</strong>');
            formattedHtml += `<div class="structure-paragraph">${formattedLine}</div>`;
        }
        // 普通段落
        else {
            formattedHtml += `<div class="structure-paragraph">${line}</div>`;
        }
    }

    return formattedHtml;
}

// ↓↓↓↓ 用这段全新的代码，替换掉旧的 'structureBtn' 事件监听器 ↓↓↓↓
structureBtn.addEventListener('click', async () => {
    if (!user || !currentUserInput) return;

    resetOptimization(); // 调用重置，确保状态统一

    // 设置初始界面
    resultOutputElem.innerHTML = `
        <div class="result-block">
          <div class="result-block-header">
            <h4>${window.getMessage('structuredPromptTitle', currentLanguage)}</h4>
            <div class="comparison-controls">
              <button id="copy-structure-btn" class="icon-btn" title="复制结果">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </div>
          <div id="structure-output" class="editable-result">${window.getMessage('thinking', currentLanguage)}</div>
        </div>`;

    const structureOutputElem = document.getElementById('structure-output');
    let cleanResult = '';

    // 使用流式显示
    const rawResult = await callGeminiAPI('structure', currentUserInput, (chunk, fullText) => {
        cleanResult = cleanText(fullText);
        const formattedResult = formatStructuredPrompt(cleanResult);
        structureOutputElem.innerHTML = formattedResult;
    });

    // 确保最终结果正确
    cleanResult = cleanText(rawResult);
    const formattedResult = formatStructuredPrompt(cleanResult);
    structureOutputElem.innerHTML = formattedResult;

    // 【关键】为新生成的复制按钮绑定事件 - 已移至事件委托处理
    /* document.getElementById('copy-structure-btn').addEventListener('click', () => {
        // 获取当前显示的内容（包括用户编辑的内容）
        const structureOutputElem = document.getElementById('structure-output');
        if (structureOutputElem) {
          // 获取纯文本内容，去除HTML标签
          const currentContent = structureOutputElem.innerText || structureOutputElem.textContent || '';
          navigator.clipboard.writeText(currentContent.trim());
        } else {
          // 如果无法获取显示内容，则使用原始内容作为备选
          navigator.clipboard.writeText(cleanResult);
        }
        showCopyFeedback('copy-structure-btn');
        // (可选) 可以在这里增加一个“复制成功”的视觉反馈
    }); */
    
    // 保存历史记录的逻辑（保持不变）
    try { 
        await supabase.from('history').insert({ user_input: currentUserInput, action: 'structure', result: cleanResult }); 
        loadUserHistory(); 
    } catch (e) { 
        console.error('Error saving history:', e); 
    }
});
  
  historyToggleBtn.addEventListener('click', (event) => {
    historyDropdown.classList.toggle('active');

    // 智能定位：根据可用空间调整弹窗位置
    if (historyDropdown.classList.contains('active')) {
      adjustDropdownPosition();
    }

    event.stopPropagation();
  });

  // 智能定位函数
  function adjustDropdownPosition() {
    const dropdown = historyDropdown;
    const container = document.querySelector('.container');
    const containerWidth = container.offsetWidth;
    const dropdownWidth = 320;

    // 重置样式
    dropdown.style.left = '';
    dropdown.style.right = '';
    dropdown.style.width = '';

    // 如果容器宽度小于400px，使用全宽布局
    if (containerWidth < 400) {
      dropdown.style.position = 'fixed';
      dropdown.style.left = '8px';
      dropdown.style.right = '8px';
      dropdown.style.width = 'auto';
    } else {
      // 检查右侧是否有足够空间
      const rightSpace = containerWidth - 16; // 16px 是右边距
      if (rightSpace < dropdownWidth) {
        // 右侧空间不足，调整到左侧
        dropdown.style.left = '16px';
        dropdown.style.right = 'auto';
      } else {
        // 右侧空间充足，保持原位置
        dropdown.style.right = '16px';
        dropdown.style.left = 'auto';
      }
      dropdown.style.width = `${Math.min(dropdownWidth, rightSpace)}px`;
    }
  }
  clearHistoryBtn.addEventListener('click', () => {
  // 1. 获取自定义对话框的 DOM 元素
  const confirmOverlay = document.getElementById('custom-confirm-overlay');
  if (!confirmOverlay) return;

  // 2. 显示自定义对话框
  confirmOverlay.classList.add('active');

  // 3. 为对话框内的按钮绑定一次性的点击事件
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');

  const handleConfirm = async () => {
    // 执行真正的删除操作
    if (!user) return;
    try {
      await supabase.from('history').delete().eq('user_id', user.id);
      history = [];
      renderHistory();
    } catch (error) {
      alert(window.getMessage('clearHistoryFailed', currentLanguage));
    }
    cleanup(); // 关闭对话框并移除监听器
  };

  const handleCancel = () => {
    cleanup(); // 只关闭对话框并移除监听器
  };
  
  // 清理函数，用于关闭对话框和移除事件监听器，防止内存泄漏
  const cleanup = () => {
    confirmOverlay.classList.remove('active');
    okBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  // 绑定事件
  okBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
});

  // 监听窗口大小变化，重新调整弹窗位置
  window.addEventListener('resize', () => {
    if (historyDropdown.classList.contains('active')) {
      adjustDropdownPosition();
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!historyDropdown.contains(target) && !target.closest('#historyToggleBtn')) {
      historyDropdown.classList.remove('active');
    }
    
    // 处理结果区域的可编辑功能
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
    
    // 【新增】处理输入框的可编辑功能
    const inputTarget = target.closest('.editable-input');
    if (inputTarget && inputTarget.contentEditable !== 'true') {
      // 如果是默认提示文字，清空内容
      if (inputTarget.textContent === window.getMessage('waitingForInput', currentLanguage)) {
        inputTarget.textContent = '';
      }
      
      inputTarget.contentEditable = true;
      inputTarget.classList.add('editable');
      inputTarget.classList.remove('placeholder');
      inputTarget.focus();
      
      // 将光标移到末尾
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(inputTarget);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  
  document.addEventListener('blur', (event) => {
    if (event.target.classList.contains('editable-result')) {
      event.target.contentEditable = false;
      event.target.classList.remove('editable');
    }

    // 【新增】处理输入框失去焦点
    if (event.target.classList.contains('editable-input')) {
      event.target.contentEditable = false;
      event.target.classList.remove('editable');

      // 更新currentUserInput变量
      const newText = event.target.textContent.trim();
      if (newText === '') {
        event.target.textContent = window.getMessage('waitingForInput', currentLanguage);
        event.target.classList.add('placeholder');
        currentUserInput = '';
      } else {
        currentUserInput = newText;
        event.target.classList.remove('placeholder');
      }

      // 重置优化状态
      resetOptimization();
    }
  }, true);

  // 【新增】TAB键快捷键功能
  document.addEventListener('keydown', (event) => {
    // 检查是否按下了TAB键
    if (event.key === 'Tab') {
      const target = event.target;

      // 检查是否在侧边栏的输入框中
      if (target.classList.contains('editable-input')) {
        event.preventDefault(); // 阻止默认的TAB行为

        // 确保输入框内容已更新
        const newText = target.textContent.trim();
        if (newText && newText !== window.getMessage('waitingForInput', currentLanguage)) {
          currentUserInput = newText;
          target.classList.remove('placeholder');

          // 触发优化功能
          if (user && currentUserInput && !optimizeBtn.disabled) {
            optimizeBtn.click();
          }
        }
        return;
      }

      // 检查是否在主界面的AI输入框中（通过content.js监听的输入框）
      // 这些输入框的选择器在content.js中定义
      const isMainInputBox = TARGET_SELECTORS.some(selector => {
        try {
          return target.matches(selector);
        } catch (e) {
          return false;
        }
      });

      if (isMainInputBox) {
        event.preventDefault(); // 阻止默认的TAB行为

        // 获取输入框内容
        const inputText = (target.tagName.toLowerCase() === 'textarea') ? target.value : target.textContent;
        if (inputText && inputText.trim()) {
          // 更新侧边栏的输入内容
          currentUserInput = inputText.trim();
          currentUserInputElem.textContent = currentUserInput;
          currentUserInputElem.classList.remove('placeholder');
          resetOptimization();

          // 触发优化功能
          if (user && currentUserInput && !optimizeBtn.disabled) {
            optimizeBtn.click();
          }
        }
      }
    }
  });

  // 使用事件委托处理动态创建的复制按钮
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('button');
    if (!target) return;

    // 处理复制提示词按钮
    if (target.id === 'copy-prompt-btn') {
      event.preventDefault();
      try {
        // 获取当前显示的内容（包括用户编辑的内容）
        const promptOutputElem = document.getElementById('optimized-prompt-output');
        let contentToCopy = '';

        if (promptOutputElem) {
          // 获取纯文本内容，去除HTML标签
          contentToCopy = promptOutputElem.innerText || promptOutputElem.textContent || '';
        } else {
          // 如果无法获取显示内容，则使用原始内容作为备选
          contentToCopy = sessionOptimizationHistory[viewingOptimizationIndex];
        }

        await navigator.clipboard.writeText(contentToCopy.trim());
        showCopyFeedback('copy-prompt-btn');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }

    // 处理复制结构化提示词按钮
    if (target.id === 'copy-structure-btn') {
      event.preventDefault();
      try {
        // 获取当前显示的内容（包括用户编辑的内容）
        const structureOutputElem = document.getElementById('structure-output');
        let contentToCopy = '';

        if (structureOutputElem) {
          // 获取纯文本内容，去除HTML标签
          contentToCopy = structureOutputElem.innerText || structureOutputElem.textContent || '';
        }

        await navigator.clipboard.writeText(contentToCopy.trim());
        showCopyFeedback('copy-structure-btn');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  });
}

// =============================================================
//  5. 主题切换功能
// =============================================================

/**
 * 应用主题到页面
 * @param {string} theme - 主题名称 ('light', 'dark', 'auto')
 */
function applyTheme(theme) {
  const body = document.body;

  if (theme === 'auto') {
    // 跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  } else if (theme === 'dark') {
    body.classList.add('dark-theme');
  } else {
    body.classList.remove('dark-theme');
  }
}

/**
 * 设置主题并保存到存储
 * @param {string} theme - 主题名称
 */
function setTheme(theme) {
  currentTheme = theme;
  chrome.storage.local.set({ theme: theme }, () => {
    applyTheme(theme);
    console.log(`Theme set to ${theme}`);
  });
}

/**
 * 初始化主题设置
 */
async function initTheme() {
  const themeSelector = document.getElementById('themeSelector');

  // 从存储中获取保存的主题，默认为 'light'
  chrome.storage.local.get('theme', (data) => {
    const savedTheme = data.theme || 'light';
    currentTheme = savedTheme;
    themeSelector.value = savedTheme;
    applyTheme(savedTheme);
  });

  // 监听主题选择器的变化
  themeSelector.addEventListener('change', (event) => {
    setTheme(event.target.value);
  });

  // 监听系统主题变化（仅在auto模式下生效）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

// =============================================================
//  6. 国际化 (i18n)
// =============================================================

/**
 * Sets the application language, saves it, and applies the translation.
 * @param {string} lang - The language code (e.g., 'en', 'zh_CN').
 */
function setLanguage(lang) {
  currentLanguage = lang; // 更新当前语言

  // 更新语音识别语言
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && window.recognition) {
    window.recognition.lang = lang === 'en' ? 'en-US' : 'zh-CN';
  }

  chrome.storage.local.set({ language: lang }, () => {
    window.applyI18n(lang); // 调用全局的 applyI18n 函数
    console.log(`Language set to ${lang}`);
  });
}

/**
 * Initializes the language settings and loads translations.
 */
async function initLanguage() {
  // Load all available translations from i18n.js
  await window.loadMessages(['en', 'zh_CN']); // 调用全局的 loadMessages 函数

  const languageSelector = document.getElementById('languageSelector');

  // Get the saved language from storage, or default to 'en'
  chrome.storage.local.get('language', (data) => {
    const currentLang = data.language || 'en';
    currentLanguage = currentLang; // 设置当前语言
    languageSelector.value = currentLang;
    window.applyI18n(currentLang); // Apply the translation on load
  });

  // Listen for changes on the language selector
  languageSelector.addEventListener('change', (event) => {
    setLanguage(event.target.value);
  });
}

/**
 * Updates dynamic content when language changes
 */
function updateDynamicContent() {
  // 更新按钮文本
  if (optimizationCount === 0) {
    optimizeBtn.textContent = window.getMessage('optimizeInputButton', currentLanguage);
  } else if (optimizationCount >= MAX_OPTIMIZATIONS) {
    optimizeBtn.textContent = window.getMessage('optimizationLimitReached', currentLanguage);
  } else {
    optimizeBtn.textContent = `${window.getMessage('optimizeAgainButton', currentLanguage)} (${optimizationCount}/${MAX_OPTIMIZATIONS})`;
  }

  // 更新按钮的title提示（包含快捷键信息）
  optimizeBtn.title = window.getMessage('optimizeButtonWithShortcut', currentLanguage);

  // 更新输入框占位符文本
  if (currentUserInputElem.classList.contains('placeholder') || !currentUserInput) {
    currentUserInputElem.textContent = window.getMessage('waitingForInput', currentLanguage);
    currentUserInputElem.classList.add('placeholder');
  }

  // 更新语音按钮标题
  if (!voiceInputBtn.classList.contains('is-listening')) {
    voiceInputBtn.title = window.getMessage('voiceInputTitle', currentLanguage);
  }

  // 重新渲染历史记录
  renderHistory();
}


// =============================================================
//  7. 脚本启动
// =============================================================

// 脚本主入口：当 DOM 加载完成后，执行初始化操作
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  // REMOVE the old call:
  // initLanguageSelector();
  // ADD the new call:
  initLanguage();
  initTheme(); // 初始化主题
  // 音频功能已移除

  // 初始化输入框的placeholder状态
  if (!currentUserInput) {
    currentUserInputElem.classList.add('placeholder');
  }
});