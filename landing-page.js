// 语言切换功能
let currentLanguage = 'zh'; // 默认中文

function toggleLanguage() {
    console.log('toggleLanguage called, current language:', currentLanguage);
    
    const button = document.getElementById('langToggle');
    const logoText = document.getElementById('logoText');
    const navFeatures = document.getElementById('navFeatures');
    const navDownload = document.getElementById('navDownload');

    console.log('Elements found:', { button, logoText, navFeatures, navDownload });

    if (currentLanguage === 'zh') {
        // 切换到英文模式
        currentLanguage = 'en';
        console.log('Switching to English');
        
        if (button) button.textContent = '中文';
        if (button) button.classList.add('active');
        if (logoText) logoText.textContent = 'Prompt Enhancer';
        if (navFeatures) navFeatures.textContent = 'Features';
        if (navDownload) navDownload.textContent = 'Download';

        // 隐藏中文内容，显示英文内容
        const zhElements = document.querySelectorAll('[id$="-zh"]');
        const enElements = document.querySelectorAll('[id$="-en"]');
        console.log('Found elements:', { zhElements: zhElements.length, enElements: enElements.length });
        
        zhElements.forEach(el => {
            el.classList.add('hidden');
        });
        enElements.forEach(el => {
            el.classList.remove('hidden');
        });

    } else {
        // 切换到中文模式
        currentLanguage = 'zh';
        console.log('Switching to Chinese');
        
        if (button) button.textContent = 'EN';
        if (button) button.classList.remove('active');
        if (logoText) logoText.textContent = '点石成金';
        if (navFeatures) navFeatures.textContent = '功能特色';
        if (navDownload) navDownload.textContent = '立即下载';

        // 显示中文内容，隐藏英文内容
        const zhElements = document.querySelectorAll('[id$="-zh"]');
        const enElements = document.querySelectorAll('[id$="-en"]');
        
        enElements.forEach(el => {
            el.classList.add('hidden');
        });
        zhElements.forEach(el => {
            el.classList.remove('hidden');
        });
    }
}

// 平滑滚动功能
function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 确保DOM加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // 绑定语言切换按钮
    const langToggle = document.getElementById('langToggle');
    console.log('langToggle element:', langToggle);
    
    if (langToggle) {
        langToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Button clicked!');
            toggleLanguage();
        });
        console.log('Language toggle button event listener added');
    } else {
        console.error('Language toggle button not found');
    }
    
    // 初始化平滑滚动
    smoothScroll();
});
