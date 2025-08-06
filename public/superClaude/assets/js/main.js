// 主要应用逻辑

// 应用状态
const appState = {
    currentSection: 'overview',
    searchTerm: '',
    selectedCategory: 'all',
    isLoading: true
};

// DOM元素引用
const elements = {
    navbar: null,
    navLinks: null,
    sections: null,
    backToTop: null,
    commandsGrid: null,
    searchInput: null,
    filterTabs: null,
    personasShowcase: null,
    waveVisualization: null,
    quickstartWizard: null
};

// 初始化应用
function initApp() {
    // 缓存DOM元素
    cacheElements();
    
    // 添加样式
    addToastStyles();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 渲染内容
    renderContent();
    
    // 初始化动画
    initAnimations();
    
    // 设置页面加载完成
    setTimeout(() => {
        appState.isLoading = false;
        document.body.classList.add('loaded');
    }, 1000);
}

// 缓存DOM元素
function cacheElements() {
    elements.navbar = document.getElementById('navbar');
    elements.navLinks = document.querySelectorAll('.nav-link');
    elements.sections = document.querySelectorAll('.section');
    elements.backToTop = document.getElementById('back-to-top');
    elements.commandsGrid = document.getElementById('commands-grid');
    elements.searchInput = document.getElementById('command-search');
    elements.filterTabs = document.querySelectorAll('.filter-tab');
    elements.personasShowcase = document.querySelector('.personas-showcase');
    elements.waveVisualization = document.querySelector('.wave-visualization');
    elements.quickstartWizard = document.querySelector('.quickstart-wizard');
}

// 设置事件监听器
function setupEventListeners() {
    // 导航链接点击
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
    
    // 移动端导航切换
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // 搜索功能
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            appState.searchTerm = e.target.value;
            filterCommands(appState.searchTerm, appState.selectedCategory);
        });
    }
    
    // 分类筛选
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 更新活动状态
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 更新状态并筛选
            appState.selectedCategory = tab.dataset.category;
            filterCommands(appState.searchTerm, appState.selectedCategory);
        });
    });
    
    // 滚动事件
    window.addEventListener('scroll', handleScroll);
    
    // 返回顶部按钮
    if (elements.backToTop) {
        elements.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboard);
    
    // 窗口大小变化
    window.addEventListener('resize', handleResize);
}

// 渲染内容
function renderContent() {
    // 渲染命令卡片
    if (elements.commandsGrid) {
        const commandCards = commandsData.map(command => generateCommandCard(command)).join('');
        elements.commandsGrid.innerHTML = commandCards;
    }
    
    // 渲染人格展示
    if (elements.personasShowcase) {
        const personaCards = personasData.map(persona => generatePersonaCard(persona)).join('');
        elements.personasShowcase.innerHTML = personaCards;
    }
    
    // 渲染Wave系统
    if (elements.waveVisualization) {
        elements.waveVisualization.innerHTML = generateWaveVisualization();
    }
    
    // 渲染快速入门
    if (elements.quickstartWizard) {
        elements.quickstartWizard.innerHTML = generateQuickstartWizard();
    }
    
    // 在概述部分添加MCP服务器展示
    const overviewSection = document.getElementById('overview');
    if (overviewSection) {
        const mcpSection = document.createElement('div');
        mcpSection.className = 'mcp-section';
        mcpSection.innerHTML = generateMCPServers();
        overviewSection.querySelector('.container').appendChild(mcpSection);
    }
}

// 初始化动画
function initAnimations() {
    // 滚动动画
    initScrollAnimations();
    
    // 计数器动画
    initCounters();
    
    // 为卡片添加悬停效果
    document.querySelectorAll('.command-card, .persona-card, .feature-card').forEach(card => {
        card.classList.add('card-hover-effect');
    });
}

// 切换页面部分
function switchSection(sectionId) {
    // 更新状态
    appState.currentSection = sectionId;
    
    // 隐藏所有部分
    elements.sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示目标部分
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // 添加进入动画
        const animateElements = targetSection.querySelectorAll('.scroll-animate');
        animateElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('animate');
        });
    }
    
    // 更新导航状态
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 关闭移动端菜单
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
}

// 处理滚动事件
function handleScroll() {
    const scrollY = window.scrollY;
    
    // 导航栏滚动效果
    if (scrollY > 50) {
        elements.navbar.classList.add('scrolled');
    } else {
        elements.navbar.classList.remove('scrolled');
    }
    
    // 返回顶部按钮
    if (scrollY > 300) {
        elements.backToTop.classList.add('show');
    } else {
        elements.backToTop.classList.remove('show');
    }
    
    // 滚动进度指示器（可选）
    updateScrollProgress();
}

// 更新滚动进度
function updateScrollProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    // 更新进度条
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
}

// 切换快捷键提示
function toggleShortcuts() {
    const shortcuts = document.getElementById('keyboard-shortcuts');
    if (shortcuts) {
        shortcuts.classList.toggle('show');
    }
}

// 处理键盘事件
function handleKeyboard(e) {
    // ESC键关闭移动端菜单
    if (e.key === 'Escape') {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
    
    // 数字键快速导航
    const numKey = parseInt(e.key);
    if (numKey >= 1 && numKey <= 5 && !e.ctrlKey && !e.altKey) {
        const sections = ['overview', 'commands', 'personas', 'wave', 'quickstart'];
        if (sections[numKey - 1]) {
            switchSection(sections[numKey - 1]);
        }
    }
    
    // Ctrl+K 聚焦搜索框
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (elements.searchInput) {
            switchSection('commands');
            setTimeout(() => elements.searchInput.focus(), 300);
        }
    }
}

// 处理窗口大小变化
function handleResize() {
    // 重新计算动画
    const animatedElements = document.querySelectorAll('.animate');
    animatedElements.forEach(el => {
        el.classList.remove('animate');
        setTimeout(() => el.classList.add('animate'), 100);
    });
}

// 滚动到指定部分
function scrollToSection(sectionId) {
    switchSection(sectionId);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 显示加载器
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(loader);
    
    // 初始化应用
    initApp();
    
    // 隐藏加载器
    setTimeout(() => {
        loader.classList.add('hide');
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 500);
    }, 1500);
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // 页面重新可见时，重新启动动画
        const pausedAnimations = document.querySelectorAll('.animate-pulse');
        pausedAnimations.forEach(el => {
            el.style.animationPlayState = 'running';
        });
    } else {
        // 页面隐藏时，暂停动画以节省资源
        const runningAnimations = document.querySelectorAll('.animate-pulse');
        runningAnimations.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
    showToast('应用遇到错误，请刷新页面重试', 'error');
});

// 导出全局函数供HTML使用
window.switchSection = switchSection;
window.scrollToSection = scrollToSection;
window.copyToClipboard = copyToClipboard;
window.toggleExamples = toggleExamples;
window.toggleStepCompletion = toggleStepCompletion;
window.filterCommands = filterCommands;
window.toggleShortcuts = toggleShortcuts;

// 性能监控（开发环境）
if (window.location.hostname === 'localhost') {
    // 监控页面性能
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('页面加载性能:', {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
        });
    });
}
