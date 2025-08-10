/**
 * 搜索管理模块
 * 负责搜索功能、标签筛选、移动端搜索界面管理等功能
 */
class SearchManager {
    constructor(options = {}) {
        this.options = {
            debounceDelay: 300,
            minSearchLength: 1,
            maxResults: 100,
            highlightMatches: true,
            ...options
        };

        this.novelsData = [];
        this.filteredNovels = [];
        this.currentSearchTerm = '';
        this.currentTag = 'all';
        this.searchHistory = [];
        
        this.init();
    }

    /**
     * 初始化搜索管理器
     */
    init() {
        this.loadSearchHistory();
        this.bindSearchEvents();
        this.bindTagFilterEvents();
        this.bindMobileSearchEvents();
        this.initTagScrollTouch();
    }

    /**
     * 设置小说数据
     */
    setNovelsData(data) {
        this.novelsData = Array.isArray(data) ? data : [];
        this.filteredNovels = [...this.novelsData];
    }

    /**
     * 获取过滤后的小说数据
     */
    getFilteredNovels() {
        return this.filteredNovels;
    }

    /**
     * 绑定搜索事件
     */
    bindSearchEvents() {
        // 绑定桌面端搜索输入框
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e);
            }, this.options.debounceDelay));

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch(e);
                }
            });
        }

        // 绑定移动端搜索输入框
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e);
            }, this.options.debounceDelay));

            mobileSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch(e);
                }
            });
        }
    }

    /**
     * 绑定标签筛选事件
     */
    bindTagFilterEvents() {
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                this.handleTagFilter(e.target);
            });
        });
    }

    /**
     * 绑定移动端搜索事件
     */
    bindMobileSearchEvents() {
        // 使用事件委托的方式绑定移动端搜索按钮事件
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.id === 'mobileSearchBtn' || e.target.closest('#mobileSearchBtn'))) {
                e.preventDefault();
                e.stopPropagation();
                console.log('移动端搜索按钮被点击（事件委托）');
                this.toggleMobileSearch();
                return;
            }
        });

        // 直接绑定移动端搜索按钮事件（备用方案）
        const bindMobileSearchBtn = () => {
            const mobileSearchBtn = document.getElementById('mobileSearchBtn');
            if (mobileSearchBtn && !mobileSearchBtn.hasAttribute('data-search-bound')) {
                // 添加点击事件监听器
                mobileSearchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('移动端搜索按钮被点击（直接绑定）');
                    this.toggleMobileSearch();
                });

                // 添加触摸事件支持
                mobileSearchBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    console.log('移动端搜索按钮触摸开始');
                });

                mobileSearchBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('移动端搜索按钮触摸结束');
                    this.toggleMobileSearch();
                });

                mobileSearchBtn.setAttribute('data-search-bound', 'true');
                console.log('移动端搜索按钮事件已绑定（直接绑定）');
            }
        };

        // 立即尝试绑定
        bindMobileSearchBtn();

        // 使用MutationObserver监听DOM变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    bindMobileSearchBtn();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 处理搜索
     */
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        this.currentSearchTerm = searchTerm;

        if (!searchTerm) {
            this.filteredNovels = [...this.novelsData];
            this.resetTagSelection();
        } else {
            this.filteredNovels = this.novelsData.filter(novel =>
                novel.title.toLowerCase().includes(searchTerm) ||
                novel.summary.toLowerCase().includes(searchTerm) ||
                novel.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );

            // 搜索时重置标签选择
            this.resetTagSelection();
            
            // 保存搜索历史
            this.saveSearchHistory(searchTerm);
        }

        // 触发搜索结果更新事件
        this.triggerSearchResultsUpdated();

        // 显示搜索结果反馈
        this.showSearchFeedback(searchTerm);
    }

    /**
     * 处理标签筛选
     */
    handleTagFilter(tagElement) {
        // 重置所有标签样式
        document.querySelectorAll('.tag').forEach(t => {
            t.className = 'tag px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-beige cursor-pointer whitespace-nowrap';
        });

        // 激活当前标签
        tagElement.className = 'tag px-4 py-2 rounded-full bg-xhs-red text-white cursor-pointer whitespace-nowrap';

        const selectedTag = tagElement.dataset.tag;
        this.currentTag = selectedTag;

        if (selectedTag === 'all') {
            this.filteredNovels = [...this.novelsData];
        } else {
            this.filteredNovels = this.novelsData.filter(novel =>
                novel.tags.some(tag => tag.includes(selectedTag))
            );
        }

        // 清空搜索框
        this.clearSearchInput();

        // 触发搜索结果更新事件
        this.triggerSearchResultsUpdated();

        // 显示筛选结果反馈
        this.showTagFilterFeedback(selectedTag);
    }

    /**
     * 切换移动端搜索
     */
    toggleMobileSearch() {
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const mobileSearchInput = document.getElementById('mobileSearchInput');

        if (mobileSearchBar) {
            // 检查当前状态 - 默认是隐藏的
            const isCurrentlyHidden = mobileSearchBar.classList.contains('hidden');

            console.log('toggleMobileSearch 被调用，当前状态:', isCurrentlyHidden ? '隐藏' : '显示');

            if (isCurrentlyHidden) {
                // 显示搜索栏 - 使用滑动动画
                mobileSearchBar.classList.remove('hidden');
                mobileSearchBar.style.maxHeight = '0px';
                mobileSearchBar.style.overflow = 'hidden';
                mobileSearchBar.style.transition = 'max-height 0.3s ease-in-out';

                // 强制重绘
                mobileSearchBar.offsetHeight;

                // 设置最大高度以显示内容
                mobileSearchBar.style.maxHeight = '80px';

                console.log('移动端搜索栏已显示');
                // 自动聚焦到搜索框
                if (mobileSearchInput) {
                    setTimeout(() => {
                        mobileSearchInput.focus();
                        console.log('移动端搜索框已聚焦');
                    }, 300);
                }
            } else {
                // 隐藏搜索栏 - 使用滑动动画
                mobileSearchBar.style.maxHeight = '0px';

                setTimeout(() => {
                    mobileSearchBar.classList.add('hidden');
                    mobileSearchBar.style.maxHeight = '';
                    mobileSearchBar.style.overflow = '';
                    mobileSearchBar.style.transition = '';

                    // 清空输入框
                    if (mobileSearchInput) {
                        mobileSearchInput.value = '';
                    }
                }, 300);
                console.log('移动端搜索栏已隐藏');
            }
        } else {
            console.error('找不到移动端搜索栏元素');
        }
    }

    /**
     * 清空搜索输入框
     */
    clearSearchInput() {
        const searchInput = document.getElementById('searchInput');
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        
        if (searchInput) searchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';
        
        this.currentSearchTerm = '';
    }

    /**
     * 重置标签选择
     */
    resetTagSelection() {
        document.querySelectorAll('.tag').forEach(t => {
            t.className = 'tag px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-beige cursor-pointer whitespace-nowrap';
        });
        
        const allTag = document.querySelector('.tag[data-tag="all"]');
        if (allTag) {
            allTag.className = 'tag px-4 py-2 rounded-full bg-xhs-red text-white cursor-pointer whitespace-nowrap';
        }
        
        this.currentTag = 'all';
    }

    /**
     * 显示搜索结果反馈
     */
    showSearchFeedback(searchTerm) {
        if (window.showToast) {
            if (searchTerm && this.filteredNovels.length === 0) {
                window.showToast(`没有找到包含"${searchTerm}"的小说`, 'error');
            } else if (searchTerm && this.filteredNovels.length > 0) {
                window.showToast(`找到 ${this.filteredNovels.length} 部相关小说`);
            }
        }
    }

    /**
     * 显示标签筛选反馈
     */
    showTagFilterFeedback(selectedTag) {
        if (window.showToast) {
            const tagText = selectedTag === 'all' ? '全部' : selectedTag;
            if (this.filteredNovels.length === 0) {
                window.showToast(`没有找到"${tagText}"相关的小说`, 'error');
            } else if (selectedTag !== 'all') {
                window.showToast(`找到 ${this.filteredNovels.length} 部"${tagText}"小说`);
            }
        }
    }

    /**
     * 触发搜索结果更新事件
     */
    triggerSearchResultsUpdated() {
        const event = new CustomEvent('searchResultsUpdated', {
            detail: {
                results: this.filteredNovels,
                searchTerm: this.currentSearchTerm,
                currentTag: this.currentTag,
                resultCount: this.filteredNovels.length
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory(searchTerm) {
        if (!searchTerm || searchTerm.length < this.options.minSearchLength) return;

        // 移除重复项
        this.searchHistory = this.searchHistory.filter(term => term !== searchTerm);
        
        // 添加到开头
        this.searchHistory.unshift(searchTerm);
        
        // 限制历史记录数量
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }

        // 保存到本地存储
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('searchHistory');
            if (history) {
                this.searchHistory = JSON.parse(history);
            }
        } catch (error) {
            console.error('加载搜索历史失败:', error);
            this.searchHistory = [];
        }
    }

    /**
     * 获取搜索历史
     */
    getSearchHistory() {
        return this.searchHistory;
    }

    /**
     * 清空搜索历史
     */
    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('searchHistory');
    }

    /**
     * 初始化标签滚动的触摸支持
     */
    initTagScrollTouch() {
        const tagScrollContainer = document.querySelector('.tag-scroll-container');
        if (!tagScrollContainer) return;

        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;

        // 鼠标/触摸开始
        tagScrollContainer.addEventListener('mousedown', startScroll);
        tagScrollContainer.addEventListener('touchstart', startScroll, { passive: true });

        // 鼠标/触摸移动
        tagScrollContainer.addEventListener('mousemove', duringScroll);
        tagScrollContainer.addEventListener('touchmove', duringScroll, { passive: true });

        // 鼠标/触摸结束
        tagScrollContainer.addEventListener('mouseup', endScroll);
        tagScrollContainer.addEventListener('touchend', endScroll);
        tagScrollContainer.addEventListener('mouseleave', endScroll);

        function startScroll(e) {
            isScrolling = true;
            tagScrollContainer.style.cursor = 'grabbing';
            startX = (e.type === 'mousedown' ? e.pageX : e.touches[0].pageX) - tagScrollContainer.offsetLeft;
            scrollLeft = tagScrollContainer.scrollLeft;
        }

        function duringScroll(e) {
            if (!isScrolling) return;
            e.preventDefault();
            const x = (e.type === 'mousemove' ? e.pageX : e.touches[0].pageX) - tagScrollContainer.offsetLeft;
            const walk = (x - startX) * 2; // 滚动速度
            tagScrollContainer.scrollLeft = scrollLeft - walk;
        }

        function endScroll() {
            isScrolling = false;
            tagScrollContainer.style.cursor = 'grab';
        }
    }

    /**
     * 获取搜索建议
     */
    getSearchSuggestions(searchTerm, maxSuggestions = 5) {
        if (!searchTerm || searchTerm.length < this.options.minSearchLength) {
            return [];
        }

        const suggestions = new Set();
        const term = searchTerm.toLowerCase();

        // 从小说标题中提取建议
        this.novelsData.forEach(novel => {
            if (novel.title.toLowerCase().includes(term)) {
                suggestions.add(novel.title);
            }
            
            // 从标签中提取建议
            novel.tags.forEach(tag => {
                if (tag.toLowerCase().includes(term)) {
                    suggestions.add(tag);
                }
            });
        });

        return Array.from(suggestions).slice(0, maxSuggestions);
    }

    /**
     * 高级搜索
     */
    advancedSearch(query) {
        const {
            title = '',
            tags = [],
            author = '',
            minViews = 0,
            maxViews = Infinity,
            accessLevel = null
        } = query;

        return this.novelsData.filter(novel => {
            // 标题匹配
            if (title && !novel.title.toLowerCase().includes(title.toLowerCase())) {
                return false;
            }

            // 标签匹配
            if (tags.length > 0) {
                const hasMatchingTag = tags.some(tag => 
                    novel.tags.some(novelTag => 
                        novelTag.toLowerCase().includes(tag.toLowerCase())
                    )
                );
                if (!hasMatchingTag) return false;
            }

            // 作者匹配
            if (author && !novel.author.toLowerCase().includes(author.toLowerCase())) {
                return false;
            }

            // 阅读量范围
            if (novel.views < minViews || novel.views > maxViews) {
                return false;
            }

            // 访问级别
            if (accessLevel && novel.accessLevel !== accessLevel) {
                return false;
            }

            return true;
        });
    }

    /**
     * 防抖函数
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
     * 销毁搜索管理器
     */
    destroy() {
        // 移除事件监听器等清理工作
        console.log('搜索管理器已销毁');
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
} else {
    window.SearchManager = SearchManager;
}