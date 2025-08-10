/**
 * 主题管理模块
 * 负责主题切换、主题初始化、主题状态管理等功能
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeObserver = null;
        this.init();
    }

    /**
     * 初始化主题管理器
     */
    init() {
        this.loadSavedTheme();
        this.bindThemeToggleEvents();
        this.updateThemeToggleIcons();
        this.setupThemeObserver();
    }

    /**
     * 从本地存储加载保存的主题
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            this.currentTheme = 'dark';
        } else {
            this.currentTheme = 'light';
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const body = document.body;

        if (this.currentTheme === 'light') {
            body.classList.add('dark-theme');
            this.currentTheme = 'dark';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            this.currentTheme = 'light';
            localStorage.setItem('theme', 'light');
        }

        // 更新所有主题切换按钮的图标
        this.updateThemeToggleIcons();
        
        // 触发主题变化事件
        this.triggerThemeChangeEvent();
        
        console.log('主题切换为:', this.currentTheme);
    }

    /**
     * 设置指定主题
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('无效的主题类型:', theme);
            return;
        }

        if (theme === this.currentTheme) return;

        const body = document.body;
        
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            this.currentTheme = 'dark';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            this.currentTheme = 'light';
            localStorage.setItem('theme', 'light');
        }

        this.updateThemeToggleIcons();
        this.triggerThemeChangeEvent();
    }

    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 检查是否为深色主题
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * 更新主题切换按钮图标
     */
    updateThemeToggleIcons() {
        const icon = this.currentTheme === 'dark' ? '☀️' : '🌙';

        // 更新桌面端主题切换按钮
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = icon;
            console.log('更新桌面端主题图标');
        }

        // 更新移动端登录用户主题切换按钮
        const themeToggleMobile = document.getElementById('themeToggleMobile');
        if (themeToggleMobile) {
            themeToggleMobile.textContent = icon;
            console.log('更新移动端登录用户主题图标');
        }

        // 更新移动端游客主题切换按钮
        const themeToggleGuest = document.getElementById('themeToggleGuest');
        if (themeToggleGuest) {
            themeToggleGuest.textContent = icon;
            console.log('更新移动端游客主题图标');
        }

        // 通用选择器作为备用
        const allThemeToggles = document.querySelectorAll('.theme-toggle');
        allThemeToggles.forEach(toggle => {
            if (toggle && !toggle.id) { // 只更新没有特定ID的按钮
                toggle.textContent = icon;
                console.log('更新通用主题切换按钮图标');
            }
        });
    }

    /**
     * 绑定主题切换事件
     */
    bindThemeToggleEvents() {
        // 绑定所有主题切换按钮的事件
        const bindThemeToggle = () => {
            // 绑定桌面端主题切换按钮
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle && !themeToggle.hasAttribute('data-theme-bound')) {
                themeToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleTheme();
                    console.log('桌面端主题切换成功');
                });
                themeToggle.setAttribute('data-theme-bound', 'true');
                console.log('桌面端主题切换按钮事件已绑定');
            }

            // 绑定移动端登录用户主题切换按钮
            const themeToggleMobile = document.getElementById('themeToggleMobile');
            if (themeToggleMobile && !themeToggleMobile.hasAttribute('data-theme-bound')) {
                themeToggleMobile.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleTheme();
                    console.log('移动端登录用户主题切换成功');
                });
                themeToggleMobile.setAttribute('data-theme-bound', 'true');
                console.log('移动端登录用户主题切换按钮事件已绑定');
            }

            // 绑定移动端游客主题切换按钮
            const themeToggleGuest = document.getElementById('themeToggleGuest');
            if (themeToggleGuest && !themeToggleGuest.hasAttribute('data-theme-bound')) {
                themeToggleGuest.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleTheme();
                    console.log('移动端游客主题切换成功');
                });
                themeToggleGuest.setAttribute('data-theme-bound', 'true');
                console.log('移动端游客主题切换按钮事件已绑定');
            }
        };

        // 立即尝试绑定
        bindThemeToggle();

        // 使用MutationObserver监听DOM变化，重新绑定事件
        this.themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    bindThemeToggle();
                }
            });
        });

        this.themeObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 确保页面加载完成后再次尝试绑定，防止DOM未完全加载
        setTimeout(bindThemeToggle, 500);
    }

    /**
     * 设置主题观察器，监听DOM变化
     */
    setupThemeObserver() {
        // 监听系统主题变化（如果支持）
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // 检查是否应该跟随系统主题
            const followSystem = localStorage.getItem('followSystemTheme') === 'true';
            
            if (followSystem) {
                this.setTheme(darkModeQuery.matches ? 'dark' : 'light');
            }

            // 监听系统主题变化
            darkModeQuery.addEventListener('change', (e) => {
                if (followSystem) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * 触发主题变化事件
     */
    triggerThemeChangeEvent() {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                isDark: this.isDarkTheme()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取主题相关的CSS变量值
     */
    getThemeColors() {
        const colors = {
            light: {
                background: '#ffffff',
                text: '#333333',
                secondary: '#666666',
                border: '#e5e5e5',
                hover: '#f5f5f5'
            },
            dark: {
                background: '#1a1a1a',
                text: '#e0e0e0',
                secondary: '#b0b0b0',
                border: '#404040',
                hover: '#2a2a2a'
            }
        };
        
        return colors[this.currentTheme];
    }

    /**
     * 应用主题色彩到指定元素
     */
    applyThemeColors(element) {
        if (!element) return;
        
        const colors = this.getThemeColors();
        
        element.style.backgroundColor = colors.background;
        element.style.color = colors.text;
    }

    /**
     * 启用跟随系统主题
     */
    enableFollowSystemTheme() {
        localStorage.setItem('followSystemTheme', 'true');
        
        // 立即应用系统主题
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.setTheme(darkModeQuery.matches ? 'dark' : 'light');
        }
    }

    /**
     * 禁用跟随系统主题
     */
    disableFollowSystemTheme() {
        localStorage.setItem('followSystemTheme', 'false');
    }

    /**
     * 获取主题切换动画类
     */
    getThemeTransitionClass() {
        return 'theme-transition';
    }

    /**
     * 添加主题切换动画
     */
    addThemeTransition() {
        document.body.classList.add('theme-transition');
        
        // 移除动画类以允许下次动画
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    }

    /**
     * 销毁主题管理器
     */
    destroy() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} else {
    window.ThemeManager = ThemeManager;
}