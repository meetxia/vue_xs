/**
 * 高性能瀑布流布局管理器
 * 实现完美贴合、自然流动、视觉平衡的瀑布流布局
 */
class WaterfallLayout {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            gap: 16,
            minColumnWidth: 280,
            maxColumns: 4,
            padding: 20,
            animationDuration: 300,
            debounceDelay: 150,
            ...options
        };

        this.columns = 2;
        this.columnWidth = 0;
        this.columnHeights = [];
        this.items = [];
        this.isLayouting = false;
        this.resizeObserver = null;
        this.imageLoadPromises = new Map();

        this.init();
    }

    init() {
        this.setupContainer();
        this.setupResizeObserver();
        this.bindEvents();
        this.setupVirtualScrolling();
    }

    setupContainer() {
        if (!this.container) return;

        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.minHeight = '200px';
    }

    setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(
                this.debounce(() => this.handleResize(), this.options.debounceDelay)
            );
            this.resizeObserver.observe(this.container);
        }
    }

    bindEvents() {
        // 窗口大小改变时重新布局
        window.addEventListener('resize',
            this.debounce(() => this.handleResize(), this.options.debounceDelay)
        );

        // 监听图片加载完成
        this.container.addEventListener('load', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageLoad(e.target);
            }
        }, true);
    }

    /**
     * 计算最优列数和列宽
     */
    calculateLayout() {
        const containerWidth = this.container.offsetWidth - (this.options.padding * 2);

        // 根据容器宽度和最小列宽计算最大可能列数
        const maxPossibleColumns = Math.floor(
            (containerWidth + this.options.gap) / (this.options.minColumnWidth + this.options.gap)
        );

        // 强制使用最大列数设置，如果容器足够宽
        if (containerWidth >= this.options.maxColumns * this.options.minColumnWidth) {
            this.columns = this.options.maxColumns;
        } else {
            // 否则使用计算出的最大可能列数，但不超过maxColumns
            this.columns = Math.min(maxPossibleColumns, this.options.maxColumns);
        }
        
        this.columns = Math.max(this.columns, 1); // 至少1列

        // 计算实际列宽
        this.columnWidth = (containerWidth - (this.columns - 1) * this.options.gap) / this.columns;

        // 初始化列高度数组
        this.columnHeights = new Array(this.columns).fill(0);
    }

    /**
     * 获取最短列的索引
     */
    getShortestColumnIndex() {
        let minHeight = Math.min(...this.columnHeights);
        return this.columnHeights.indexOf(minHeight);
    }

    /**
     * 智能选择列 - 考虑视觉平衡
     */
    getOptimalColumnIndex() {
        if (this.columns === 1) return 0;

        const minHeight = Math.min(...this.columnHeights);
        const maxHeight = Math.max(...this.columnHeights);

        // 如果高度差异很小，选择最短列
        if (maxHeight - minHeight < 100) {
            return this.getShortestColumnIndex();
        }

        // 否则优先选择最短列，但考虑相邻列的平衡
        const shortestIndex = this.getShortestColumnIndex();
        const candidates = [shortestIndex];

        // 查找高度相近的列
        this.columnHeights.forEach((height, index) => {
            if (Math.abs(height - minHeight) < 50 && index !== shortestIndex) {
                candidates.push(index);
            }
        });

        // 从候选列中选择最能保持平衡的列
        if (candidates.length > 1) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        return shortestIndex;
    }

    /**
     * 布局单个卡片
     */
    layoutItem(item, index) {
        if (!item) return;

        // 确保卡片是绝对定位
        item.style.position = 'absolute';
        item.style.width = `${this.columnWidth}px`;
        
        // 获取最优列
        const columnIndex = this.getOptimalColumnIndex();

        // 计算位置，考虑容器padding
        const left = this.options.padding + columnIndex * (this.columnWidth + this.options.gap);
        const top = this.columnHeights[columnIndex];

        // 设置位置
        item.style.left = `${left}px`;
        item.style.top = `${top}px`;
        item.style.transition = `all ${this.options.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        // 强制重排以获取准确高度
        item.offsetHeight;
        
        // 更新列高度
        const itemHeight = item.offsetHeight;
        this.columnHeights[columnIndex] += itemHeight + this.options.gap;
    }

    /**
     * 更新容器高度
     */
    updateContainerHeight() {
        const maxHeight = Math.max(...this.columnHeights);
        this.container.style.height = `${maxHeight}px`;
    }

    /**
     * 执行完整布局
     */
    async layout() {
        if (this.isLayouting) return;
        this.isLayouting = true;

        try {
            // 获取所有卡片
            this.items = Array.from(this.container.querySelectorAll('.novel-card'));

            if (this.items.length === 0) {
                this.isLayouting = false;
                return;
            }

            // 计算布局参数
            this.calculateLayout();

            // 先设置所有卡片为静态定位以获取自然高度
            this.items.forEach(item => {
                item.style.position = 'static';
                item.style.width = `${this.columnWidth}px`;
                item.style.left = 'auto';
                item.style.top = 'auto';
            });

            // 等待一帧确保样式应用
            await this.nextFrame();

            // 重新初始化列高度
            this.columnHeights = new Array(this.columns).fill(0);

            // 布局所有卡片
            this.items.forEach((item, index) => {
                this.layoutItem(item, index);
            });

            // 更新容器高度
            this.updateContainerHeight();

        } catch (error) {
            console.error('瀑布流布局失败:', error);
        } finally {
            this.isLayouting = false;
        }
    }

    /**
     * 等待图片加载完成
     */
    async waitForImages() {
        const images = this.container.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('图片加载超时'));
                }, 5000);

                img.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };

                img.onerror = () => {
                    clearTimeout(timeout);
                    resolve(); // 即使加载失败也继续布局
                };
            });
        });

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.warn('部分图片加载失败:', error);
        }
    }

    /**
     * 处理图片加载完成
     */
    handleImageLoad() {
        // 图片加载完成后重新布局
        this.debounce(() => this.layout(), 100)();
    }

    /**
     * 处理窗口大小改变
     */
    handleResize() {
        this.layout();
    }

    /**
     * 添加新卡片
     */
    addItems(newItems) {
        if (!Array.isArray(newItems)) {
            newItems = [newItems];
        }

        newItems.forEach(item => {
            this.container.appendChild(item);
        });

        this.layout();
    }

    /**
     * 清空并重新布局
     */
    refresh() {
        this.columnHeights = new Array(this.columns).fill(0);
        this.layout();
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        window.removeEventListener('resize', this.handleResize);
        this.container.removeEventListener('load', this.handleImageLoad);
    }

    /**
     * 性能优化：虚拟滚动检测
     */
    setupVirtualScrolling() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateVisibleItems();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * 更新可见卡片
     */
    updateVisibleItems() {
        if (!this.items.length) return;

        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const viewportTop = scrollTop - windowHeight; // 预加载区域
        const viewportBottom = scrollTop + windowHeight * 2; // 预加载区域

        this.items.forEach(item => {
            const rect = item.getBoundingClientRect();
            const itemTop = rect.top + scrollTop;
            const itemBottom = itemTop + rect.height;

            const isVisible = itemBottom >= viewportTop && itemTop <= viewportBottom;

            if (isVisible && !item.classList.contains('visible')) {
                item.classList.add('visible');
                this.animateItemIn(item);
            } else if (!isVisible && item.classList.contains('visible')) {
                item.classList.remove('visible');
            }
        });
    }

    /**
     * 卡片进入动画
     */
    animateItemIn(item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px) scale(0.95)';

        requestAnimationFrame(() => {
            item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
        });
    }

    /**
     * 性能优化：节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 工具方法：防抖
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 工具方法：等待下一帧
     */
    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    /**
     * 性能监控
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} 耗时: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterfallLayout;
} else {
    window.WaterfallLayout = WaterfallLayout;
}