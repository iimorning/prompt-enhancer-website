// 语言切换功能
let currentLanguage = 'en'; // 默认英文

// 多语言文本配置
const translations = {
    zh: {
        logoText: '点石成金',
        navFeatures: '功能特色',
        navPricing: '价格方案',
        navDownload: '立即下载',
        langToggle: 'EN',
        footerAbout: '关于我们',
        footerDescription: '致力于提升AI交互体验的创新团队',
        footerContact: '联系方式',
        footerEmail: 'w978109720@gmail.com',
        footerLinks: '相关链接',
        footerPrivacy: '隐私政策',
        footerTerms: '使用条款',
        footerCopyright: '© 2024 点石成金. 保留所有权利.'
    },
    en: {
        logoText: 'Prompt Enhancer',
        navFeatures: 'Features',
        navPricing: 'Pricing',
        navDownload: 'Download',
        langToggle: '中文',
        footerAbout: 'About Us',
        footerDescription: 'Innovative team dedicated to enhancing AI interaction experience',
        footerContact: 'Contact',
        footerEmail: 'w978109720@gmail.com',
        footerLinks: 'Links',
        footerPrivacy: 'Privacy Policy',
        footerTerms: 'Terms of Service',
        footerCopyright: '© 2024 Prompt Enhancer. All rights reserved.'
    }
};

function updateTexts(lang) {
    const texts = translations[lang];
    
    // 更新导航和按钮文本
    document.getElementById('logoText').textContent = texts.logoText;
    document.getElementById('navFeatures').textContent = texts.navFeatures;
    document.getElementById('navPricing').textContent = texts.navPricing;
    document.getElementById('navDownload').textContent = texts.navDownload;
    document.getElementById('langToggle').textContent = texts.langToggle;
    
    // 更新页脚文本
    document.getElementById('footerAbout').textContent = texts.footerAbout;
    document.getElementById('footerDescription').textContent = texts.footerDescription;
    document.getElementById('footerContact').textContent = texts.footerContact;
    document.getElementById('footerEmail').textContent = texts.footerEmail;
    document.getElementById('footerLinks').textContent = texts.footerLinks;
    document.getElementById('footerPrivacy').textContent = texts.footerPrivacy;
    document.getElementById('footerTerms').textContent = texts.footerTerms;
    document.getElementById('footerCopyright').textContent = texts.footerCopyright;
}

function toggleLanguage() {
    console.log('toggleLanguage called, current language:', currentLanguage);
    
    const button = document.getElementById('langToggle');
    
    if (currentLanguage === 'zh') {
        // 切换到英文模式
        currentLanguage = 'en';
        console.log('Switching to English');
        
        // 隐藏中文内容，显示英文内容
        const zhElements = document.querySelectorAll('[id$="-zh"]');
        const enElements = document.querySelectorAll('[id$="-en"]');
        
        zhElements.forEach(el => {
            el.classList.add('hidden');
        });
        enElements.forEach(el => {
            el.classList.remove('hidden');
        });
        
        // 更新页面标题
        document.title = 'Prompt Enhancer - AI Prompt Enhancement Tool';
        
    } else {
        // 切换到中文模式
        currentLanguage = 'zh';
        console.log('Switching to Chinese');
        
        // 显示中文内容，隐藏英文内容
        const zhElements = document.querySelectorAll('[id$="-zh"]');
        const enElements = document.querySelectorAll('[id$="-en"]');
        
        enElements.forEach(el => {
            el.classList.add('hidden');
        });
        zhElements.forEach(el => {
            el.classList.remove('hidden');
        });
        
        // 更新页面标题
        document.title = '点石成金 Prompt Enhancer - 智能提示词增强器';
    }
    
    // 更新按钮状态
    if (currentLanguage === 'en') {
        button.classList.add('active');
    } else {
        button.classList.remove('active');
    }
    
    // 更新文本
    updateTexts(currentLanguage);
    
    // 保存语言偏好到本地存储
    localStorage.setItem('preferredLanguage', currentLanguage);
}

// 平滑滚动功能
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 头部滚动效果
function initHeaderScroll() {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.15)';
            header.style.backdropFilter = 'blur(30px)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.05)';
            header.style.backdropFilter = 'blur(20px)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// 动画观察器
function initAnimationObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    document.querySelectorAll('.feature-card, .step, .hero h1, .hero p, .cta-button').forEach(el => {
        observer.observe(el);
    });
}

// 加载语言偏好
function loadLanguagePreference() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage !== currentLanguage) {
        toggleLanguage();
    } else {
        // 初始化文本和语言内容显示状态
        updateTexts(currentLanguage);
        initLanguageContent();
    }
}

// 初始化语言内容显示状态
function initLanguageContent() {
    const zhElements = document.querySelectorAll('[id$="-zh"]');
    const enElements = document.querySelectorAll('[id$="-en"]');

    if (currentLanguage === 'en') {
        // 默认英文模式：显示英文，隐藏中文
        zhElements.forEach(el => {
            el.classList.add('hidden');
        });
        enElements.forEach(el => {
            el.classList.remove('hidden');
        });
    } else {
        // 中文模式：显示中文，隐藏英文
        enElements.forEach(el => {
            el.classList.add('hidden');
        });
        zhElements.forEach(el => {
            el.classList.remove('hidden');
        });
    }
}

// 移动端菜单切换（如果需要的话）
function initMobileMenu() {
    // 这里可以添加移动端菜单的逻辑
    // 目前我们在CSS中隐藏了移动端的导航链接
}

// 性能优化：防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // 绑定语言切换按钮
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Language toggle button clicked!');
            toggleLanguage();
        });
        console.log('Language toggle button event listener added');
    } else {
        console.error('Language toggle button not found');
    }
    
    // 初始化其他功能
    initSmoothScroll();
    initHeaderScroll();
    initAnimationObserver();
    initMobileMenu();
    initModals();
    loadLanguagePreference();

    // 初始化PayPal支付按钮
    setTimeout(() => {
        initPayPalButtons();
    }, 1000); // 延迟初始化，确保PayPal SDK已加载

    console.log('All initialization complete');
});

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // 页面重新可见时，可以重新启动动画等
        console.log('Page is now visible');
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// PayPal支付功能
function initPayPalButtons() {
    // 获取所有支付按钮
    const paymentButtons = document.querySelectorAll('.pro-btn, .enterprise-btn');

    paymentButtons.forEach(button => {
        if (button.dataset.plan && button.dataset.price) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const plan = this.dataset.plan;
                const price = this.dataset.price;

                // 创建PayPal支付
                createPayPalPayment(plan, price, this);
            });
        }
    });
}

function createPayPalPayment(plan, price, buttonElement) {
    // 创建PayPal支付容器
    const paypalContainer = document.createElement('div');
    paypalContainer.id = `paypal-button-container-${plan}`;
    paypalContainer.style.marginTop = '10px';

    // 替换按钮为PayPal容器
    buttonElement.style.display = 'none';
    buttonElement.parentNode.appendChild(paypalContainer);

    // 初始化PayPal按钮
    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: price,
                        currency_code: currentLanguage === 'zh' ? 'CNY' : 'USD'
                    },
                    description: `Prompt Enhancer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                // 支付成功处理
                handlePaymentSuccess(details, plan);
            });
        },
        onError: function(err) {
            // 支付错误处理
            handlePaymentError(err);

            // 恢复原始按钮
            buttonElement.style.display = 'block';
            paypalContainer.remove();
        },
        onCancel: function(data) {
            // 支付取消处理
            console.log('Payment cancelled:', data);

            // 恢复原始按钮
            buttonElement.style.display = 'block';
            paypalContainer.remove();
        }
    }).render(`#paypal-button-container-${plan}`);
}

function handlePaymentSuccess(details, plan) {
    console.log('Payment successful:', details);

    // 构建重定向URL参数
    const params = new URLSearchParams({
        order_id: details.id,
        plan: plan,
        amount: details.purchase_units[0].amount.value,
        currency: details.purchase_units[0].amount.currency_code
    });

    // 重定向到成功页面
    window.location.href = `/payment-success.html?${params.toString()}`;
}

function handlePaymentError(err) {
    console.error('Payment error:', err);

    // 构建错误页面URL参数
    const params = new URLSearchParams({
        error: err.name || 'PAYMENT_ERROR',
        message: encodeURIComponent(err.message || 'An error occurred during payment')
    });

    // 重定向到错误页面
    window.location.href = `/payment-error.html?${params.toString()}`;
}

// 弹窗功能
function initModals() {
    // 获取弹窗元素
    const privacyModal = document.getElementById('privacyModal');
    const termsModal = document.getElementById('termsModal');

    // 获取触发按钮
    const privacyBtn = document.getElementById('footerPrivacy');
    const termsBtn = document.getElementById('footerTerms');

    // 获取关闭按钮
    const closeButtons = document.querySelectorAll('.close');

    // 绑定打开弹窗事件
    if (privacyBtn) {
        privacyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('privacyModal');
        });
    }

    if (termsBtn) {
        termsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('termsModal');
        });
    }

    // 绑定关闭弹窗事件
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // 点击背景关闭弹窗
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // 加载内容
        loadModalContent(modalId);

        // 显示弹窗
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // 恢复滚动
    }
}

function loadModalContent(modalId) {
    const contentDiv = document.querySelector(`#${modalId} .policy-content`);
    const titleElement = document.querySelector(`#${modalId} .modal-header h2`);

    if (modalId === 'privacyModal') {
        titleElement.textContent = currentLanguage === 'zh' ? '隐私政策' : 'Privacy Policy';
        contentDiv.innerHTML = getPrivacyPolicyContent();
    } else if (modalId === 'termsModal') {
        titleElement.textContent = currentLanguage === 'zh' ? '使用条款' : 'Terms of Service';
        contentDiv.innerHTML = getTermsOfServiceContent();
    }
}

function getPrivacyPolicyContent() {
    if (currentLanguage === 'zh') {
        return `
            <h3>隐私政策</h3>
            <p><strong>最后更新日期：2024年7月12日</strong></p>

            <h4>1. 信息收集</h4>
            <p>我们收集以下类型的信息：</p>
            <ul>
                <li><strong>个人信息：</strong>当您注册账户或使用我们的服务时，我们可能收集您的邮箱地址、用户名等基本信息。</li>
                <li><strong>使用数据：</strong>我们收集您如何使用我们服务的信息，包括提示词优化请求、使用频率等。</li>
                <li><strong>技术信息：</strong>包括IP地址、浏览器类型、设备信息等技术数据。</li>
            </ul>

            <h4>2. 信息使用</h4>
            <p>我们使用收集的信息用于：</p>
            <ul>
                <li>提供和改进我们的AI提示词增强服务</li>
                <li>处理您的支付和账户管理</li>
                <li>发送服务相关通知和更新</li>
                <li>分析服务使用情况以改进用户体验</li>
                <li>防止欺诈和确保服务安全</li>
            </ul>

            <h4>3. 信息共享</h4>
            <p>我们不会出售、交易或转让您的个人信息给第三方，除非：</p>
            <ul>
                <li>获得您的明确同意</li>
                <li>法律要求或政府机关要求</li>
                <li>为了保护我们的权利、财产或安全</li>
                <li>与可信的第三方服务提供商合作（如支付处理商），这些合作伙伴同意保护您的信息</li>
            </ul>

            <h4>4. 数据安全</h4>
            <p>我们采用行业标准的安全措施来保护您的个人信息，包括：</p>
            <ul>
                <li>数据加密传输和存储</li>
                <li>定期安全审计和更新</li>
                <li>限制员工访问个人数据</li>
                <li>使用安全的第三方服务提供商</li>
            </ul>

            <h4>5. 数据保留</h4>
            <p>我们只在必要的时间内保留您的个人信息，通常包括：</p>
            <ul>
                <li>账户信息：直到您删除账户</li>
                <li>使用记录：最多保留2年</li>
                <li>支付记录：根据法律要求保留</li>
            </ul>

            <h4>6. 您的权利</h4>
            <p>您有权：</p>
            <ul>
                <li>访问和更新您的个人信息</li>
                <li>删除您的账户和相关数据</li>
                <li>选择退出某些数据收集</li>
                <li>要求数据可携性</li>
            </ul>

            <h4>7. Cookie使用</h4>
            <p>我们使用Cookie来改善您的体验，包括：</p>
            <ul>
                <li>记住您的语言偏好</li>
                <li>保持登录状态</li>
                <li>分析网站使用情况</li>
            </ul>

            <h4>8. 联系我们</h4>
            <p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
            <p><strong>邮箱：</strong>w978109720@gmail.com</p>

            <h4>9. 政策更新</h4>
            <p>我们可能会不时更新本隐私政策。重大变更将通过邮件或网站通知您。继续使用我们的服务即表示您接受更新后的政策。</p>
        `;
    } else {
        return `
            <h3>Privacy Policy</h3>
            <p><strong>Last Updated: July 12, 2024</strong></p>

            <h4>1. Information Collection</h4>
            <p>We collect the following types of information:</p>
            <ul>
                <li><strong>Personal Information:</strong> When you register an account or use our services, we may collect basic information such as your email address and username.</li>
                <li><strong>Usage Data:</strong> We collect information about how you use our services, including prompt optimization requests and usage frequency.</li>
                <li><strong>Technical Information:</strong> Including IP address, browser type, device information, and other technical data.</li>
            </ul>

            <h4>2. Information Use</h4>
            <p>We use the collected information to:</p>
            <ul>
                <li>Provide and improve our AI prompt enhancement services</li>
                <li>Process your payments and manage your account</li>
                <li>Send service-related notifications and updates</li>
                <li>Analyze service usage to improve user experience</li>
                <li>Prevent fraud and ensure service security</li>
            </ul>

            <h4>3. Information Sharing</h4>
            <p>We do not sell, trade, or transfer your personal information to third parties, except when:</p>
            <ul>
                <li>We have your explicit consent</li>
                <li>Required by law or government authorities</li>
                <li>To protect our rights, property, or safety</li>
                <li>Working with trusted third-party service providers (such as payment processors) who agree to protect your information</li>
            </ul>

            <h4>4. Data Security</h4>
            <p>We employ industry-standard security measures to protect your personal information, including:</p>
            <ul>
                <li>Encrypted data transmission and storage</li>
                <li>Regular security audits and updates</li>
                <li>Limited employee access to personal data</li>
                <li>Use of secure third-party service providers</li>
            </ul>

            <h4>5. Data Retention</h4>
            <p>We retain your personal information only for as long as necessary, typically including:</p>
            <ul>
                <li>Account information: Until you delete your account</li>
                <li>Usage records: Up to 2 years</li>
                <li>Payment records: As required by law</li>
            </ul>

            <h4>6. Your Rights</h4>
            <p>You have the right to:</p>
            <ul>
                <li>Access and update your personal information</li>
                <li>Delete your account and related data</li>
                <li>Opt out of certain data collection</li>
                <li>Request data portability</li>
            </ul>

            <h4>7. Cookie Usage</h4>
            <p>We use cookies to improve your experience, including:</p>
            <ul>
                <li>Remembering your language preferences</li>
                <li>Maintaining login status</li>
                <li>Analyzing website usage</li>
            </ul>

            <h4>8. Contact Us</h4>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p><strong>Email:</strong> w978109720@gmail.com</p>

            <h4>9. Policy Updates</h4>
            <p>We may update this Privacy Policy from time to time. Significant changes will be notified via email or website notice. Continued use of our services indicates acceptance of the updated policy.</p>
        `;
    }
}

function getTermsOfServiceContent() {
    if (currentLanguage === 'zh') {
        return `
            <h3>使用条款</h3>
            <p><strong>最后更新日期：2024年7月12日</strong></p>

            <h4>1. 服务描述</h4>
            <p>点石成金 Prompt Enhancer 是一款AI提示词增强工具，旨在帮助用户优化与AI系统的交互体验。我们的服务包括：</p>
            <ul>
                <li>智能提示词自动优化</li>
                <li>专家模式提示词工程</li>
                <li>语音输入功能</li>
                <li>多语言支持</li>
            </ul>

            <h4>2. 用户账户</h4>
            <p>使用我们的服务时，您需要：</p>
            <ul>
                <li>提供准确、完整的注册信息</li>
                <li>保护您的账户安全，不与他人共享登录凭据</li>
                <li>及时更新账户信息</li>
                <li>对您账户下的所有活动负责</li>
            </ul>

            <h4>3. 使用规则</h4>
            <p>您同意不会：</p>
            <ul>
                <li>使用服务进行任何非法、有害或不当的活动</li>
                <li>尝试破解、逆向工程或干扰我们的服务</li>
                <li>上传恶意软件或病毒</li>
                <li>侵犯他人的知识产权</li>
                <li>发布仇恨言论、暴力内容或其他不当内容</li>
                <li>进行商业垃圾邮件或未经授权的营销活动</li>
            </ul>

            <h4>4. 积分系统</h4>
            <p>我们的积分制收费模式规定：</p>
            <ul>
                <li>新用户享有20次免费试用机会</li>
                <li>付费积分按1美元100次使用的标准计费</li>
                <li>积分永不过期，但不可转让或退款</li>
                <li>我们保留调整价格的权利，但会提前通知用户</li>
            </ul>

            <h4>5. 知识产权</h4>
            <p>关于知识产权：</p>
            <ul>
                <li>我们的服务、软件和内容受知识产权法保护</li>
                <li>您保留对输入内容的所有权</li>
                <li>我们可能使用匿名化的使用数据来改进服务</li>
                <li>您授予我们处理和优化您的提示词的必要权限</li>
            </ul>

            <h4>6. 服务可用性</h4>
            <p>我们努力保持服务的高可用性，但：</p>
            <ul>
                <li>服务可能因维护、更新或技术问题而暂时中断</li>
                <li>我们不保证服务100%无故障运行</li>
                <li>我们保留修改或终止服务的权利</li>
            </ul>

            <h4>7. 免责声明</h4>
            <p>我们的服务按"现状"提供：</p>
            <ul>
                <li>我们不保证AI优化结果的准确性或适用性</li>
                <li>用户应自行判断优化后内容的合适性</li>
                <li>我们不对因使用服务而产生的任何损失负责</li>
            </ul>

            <h4>8. 责任限制</h4>
            <p>在法律允许的最大范围内：</p>
            <ul>
                <li>我们的责任限于您支付的服务费用</li>
                <li>我们不承担间接、特殊或后果性损害</li>
                <li>某些司法管辖区可能不允许责任限制</li>
            </ul>

            <h4>9. 终止</h4>
            <p>以下情况下服务可能被终止：</p>
            <ul>
                <li>您违反本使用条款</li>
                <li>您要求删除账户</li>
                <li>我们决定终止服务</li>
                <li>法律要求</li>
            </ul>

            <h4>10. 争议解决</h4>
            <p>如发生争议：</p>
            <ul>
                <li>我们鼓励通过友好协商解决</li>
                <li>本条款受中华人民共和国法律管辖</li>
                <li>争议应提交至我们所在地的法院</li>
            </ul>

            <h4>11. 联系我们</h4>
            <p>如果您对本使用条款有任何疑问，请联系我们：</p>
            <p><strong>邮箱：</strong>w978109720@gmail.com</p>

            <h4>12. 条款更新</h4>
            <p>我们可能会更新本使用条款。重大变更将提前通知用户。继续使用服务即表示接受更新后的条款。</p>
        `;
    } else {
        return `
            <h3>Terms of Service</h3>
            <p><strong>Last Updated: July 12, 2024</strong></p>

            <h4>1. Service Description</h4>
            <p>Prompt Enhancer is an AI prompt enhancement tool designed to help users optimize their interaction experience with AI systems. Our services include:</p>
            <ul>
                <li>Intelligent automatic prompt optimization</li>
                <li>Expert mode prompt engineering</li>
                <li>Voice input functionality</li>
                <li>Multi-language support</li>
            </ul>

            <h4>2. User Accounts</h4>
            <p>When using our services, you must:</p>
            <ul>
                <li>Provide accurate and complete registration information</li>
                <li>Protect your account security and not share login credentials with others</li>
                <li>Keep your account information up to date</li>
                <li>Be responsible for all activities under your account</li>
            </ul>

            <h4>3. Usage Rules</h4>
            <p>You agree not to:</p>
            <ul>
                <li>Use the service for any illegal, harmful, or inappropriate activities</li>
                <li>Attempt to hack, reverse engineer, or interfere with our services</li>
                <li>Upload malware or viruses</li>
                <li>Infringe on others' intellectual property rights</li>
                <li>Post hate speech, violent content, or other inappropriate content</li>
                <li>Engage in commercial spam or unauthorized marketing activities</li>
            </ul>

            <h4>4. Credits System</h4>
            <p>Our credit-based pricing model stipulates:</p>
            <ul>
                <li>New users receive 20 free trial uses</li>
                <li>Paid credits are charged at $1 for 100 uses</li>
                <li>Credits never expire but are non-transferable and non-refundable</li>
                <li>We reserve the right to adjust pricing with advance notice to users</li>
            </ul>

            <h4>5. Intellectual Property</h4>
            <p>Regarding intellectual property:</p>
            <ul>
                <li>Our services, software, and content are protected by intellectual property laws</li>
                <li>You retain ownership of your input content</li>
                <li>We may use anonymized usage data to improve services</li>
                <li>You grant us necessary permissions to process and optimize your prompts</li>
            </ul>

            <h4>6. Service Availability</h4>
            <p>We strive to maintain high service availability, but:</p>
            <ul>
                <li>Services may be temporarily interrupted due to maintenance, updates, or technical issues</li>
                <li>We do not guarantee 100% fault-free operation</li>
                <li>We reserve the right to modify or terminate services</li>
            </ul>

            <h4>7. Disclaimers</h4>
            <p>Our services are provided "as is":</p>
            <ul>
                <li>We do not guarantee the accuracy or applicability of AI optimization results</li>
                <li>Users should judge the appropriateness of optimized content themselves</li>
                <li>We are not responsible for any losses arising from service use</li>
            </ul>

            <h4>8. Limitation of Liability</h4>
            <p>To the maximum extent permitted by law:</p>
            <ul>
                <li>Our liability is limited to the service fees you have paid</li>
                <li>We do not assume indirect, special, or consequential damages</li>
                <li>Some jurisdictions may not allow liability limitations</li>
            </ul>

            <h4>9. Termination</h4>
            <p>Services may be terminated under the following circumstances:</p>
            <ul>
                <li>You violate these Terms of Service</li>
                <li>You request account deletion</li>
                <li>We decide to terminate services</li>
                <li>Legal requirements</li>
            </ul>

            <h4>10. Dispute Resolution</h4>
            <p>In case of disputes:</p>
            <ul>
                <li>We encourage resolution through friendly negotiation</li>
                <li>These terms are governed by the laws of the People's Republic of China</li>
                <li>Disputes should be submitted to courts in our jurisdiction</li>
            </ul>

            <h4>11. Contact Us</h4>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <p><strong>Email:</strong> w978109720@gmail.com</p>

            <h4>12. Terms Updates</h4>
            <p>We may update these Terms of Service. Significant changes will be notified to users in advance. Continued use of the service indicates acceptance of the updated terms.</p>
        `;
    }
}

// 导出函数供其他脚本使用（如果需要）
window.PromptEnhancerWebsite = {
    toggleLanguage,
    currentLanguage: () => currentLanguage,
    initPayPalButtons,
    openModal,
    closeModal
};
