/**
 * 返回顶部组件 - 小红书风格
 * 提供平滑滚动到顶部功能，支持自动显示/隐藏
 */
class BackToTop {
    constructor(options = {}) {
        this.options = {
            showOffset: 400,        // 显示组件的滚动距离
            scrollDuration: 800,    // 滚动动画时长
            throttleDelay: 100,     // 滚动事件节流延迟
            className: 'back-to-top',
            ...options
        };
        
        this.button = null;
        this.isScrolling = false;
        this.throttleTimer = null;
        
        this.init();
    }
    
    // 初始化组件
    init() {
        this.createButton();
        this.bindEvents();
        this.updateVisibility();
    }
    
    // 创建返回顶部按钮
    createButton() {
        // 检查是否已存在按钮
        if (document.querySelector(`.${this.options.className}`)) {
            return;
        }
        
        this.button = document.createElement('button');
        this.button.className = this.options.className;
        this.button.setAttribute('aria-label', '返回页面顶部');
        this.button.setAttribute('title', '返回顶部');
        this.button.type = 'button';
        
        // 创建SVG图标
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.classList.add('back-to-top-icon');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z');
        
        icon.appendChild(path);
        this.button.appendChild(icon);
        
        document.body.appendChild(this.button);
    }
    
    // 绑定事件
    bindEvents() {
        if (!this.button) return;
        
        // 点击事件
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.scrollToTop();
        });
        
        // 键盘事件支持
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.scrollToTop();
            }
        });
        
        // 滚动事件（节流处理）
        window.addEventListener('scroll', () => {
            this.throttledUpdateVisibility();
        }, { passive: true });
        
        // 页面大小变化事件
        window.addEventListener('resize', () => {
            this.throttledUpdateVisibility();
        }, { passive: true });
    }
    
    // 节流处理滚动事件
    throttledUpdateVisibility() {
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
        }
        
        this.throttleTimer = setTimeout(() => {
            this.updateVisibility();
        }, this.options.throttleDelay);
    }
    
    // 更新按钮可见性
    updateVisibility() {
        if (!this.button) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldShow = scrollTop > this.options.showOffset;
        
        if (shouldShow) {
            this.button.classList.add('show');
        } else {
            this.button.classList.remove('show');
        }
    }
    
    // 平滑滚动到顶部
    scrollToTop() {
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        const startPosition = window.pageYOffset;
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.options.scrollDuration, 1);
            
            // 使用easeInOutCubic缓动函数
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentPosition = startPosition * (1 - easeProgress);
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                this.isScrolling = false;
                // 确保滚动到最顶部
                window.scrollTo(0, 0);
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
    
    // 销毁组件
    destroy() {
        if (this.button) {
            this.button.remove();
            this.button = null;
        }
        
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = null;
        }
        
        this.isScrolling = false;
    }
}

// 自动初始化
let backToTopInstance = null;

// DOM加载完成后初始化
function initBackToTop() {
    if (backToTopInstance) {
        backToTopInstance.destroy();
    }
    
    backToTopInstance = new BackToTop();
}

// 确保在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackToTop);
} else {
    initBackToTop();
}

// 导出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackToTop;
} else if (typeof window !== 'undefined') {
    window.BackToTop = BackToTop;
}