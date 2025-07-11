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
        footerEmail: 'support@promptenhancer.com',
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
        footerEmail: 'support@promptenhancer.com',
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
        // 初始化文本
        updateTexts(currentLanguage);
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

// 导出函数供其他脚本使用（如果需要）
window.PromptEnhancerWebsite = {
    toggleLanguage,
    currentLanguage: () => currentLanguage,
    initPayPalButtons
};
