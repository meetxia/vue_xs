// 搜索管理器
class SearchManager {
    constructor() {
        this.searchTerm = '';
        this.searchType = 'title'; // title, author, content
        this.searchResults = [];
        this.debounceTimer = null;
        this.isSearching = false;
        this.init();
    }

    init() {
        this.renderSearchUI();
        this.bindEvents();
    }

    // 渲染搜索界面
    renderSearchUI() {
        const searchContainer = document.getElementById('searchContainer');
        if (!searchContainer) return;

        searchContainer.innerHTML = `
            <div class="search-section bg-white rounded-lg p-4 mb-4 border">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-gray-700">搜索作品</h4>
                    <div class="flex items-center space-x-2">
                        <button id="advancedSearchToggle" class="btn btn-secondary btn-sm">
                            🔍 高级搜索
                        </button>
                        <button id="clearSearch" class="btn btn-secondary btn-sm" style="display: none;">
                            ✖️ 清空搜索
                        </button>
                    </div>
                </div>
                
                <!-- 基础搜索 -->
                <div class="basic-search">
                    <div class="flex items-center space-x-4">
                        <div class="flex-1">
                            <div class="relative">
                                <input type="text" 
                                       id="searchInput" 
                                       placeholder="搜索作品标题、作者或内容..." 
                                       class="form-input pr-10">
                                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div id="searchSpinner" class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" style="display: none;"></div>
                                    <svg id="searchIcon" class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <select id="searchType" class="form-input w-40">
                            <option value="all">全部内容</option>
                            <option value="title">标题</option>
                            <option value="author">作者</option>
                            <option value="summary">简介</option>
                            <option value="tags">标签</option>
                        </select>
                        <button id="searchBtn" class="btn btn-primary">
                            搜索
                        </button>
                    </div>
                </div>

                <!-- 高级搜索面板 -->
                <div id="advancedSearchPanel" class="advanced-search mt-4 p-4 bg-gray-50 rounded-lg" style="display: none;">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <!-- 作者搜索 -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">作者</label>
                            <input type="text" id="authorSearch" placeholder="作者名称" class="form-input">
                        </div>
                        
                        <!-- 字数范围 -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">字数范围</label>
                            <div class="flex items-center space-x-2">
                                <input type="number" id="minWords" placeholder="最少" class="form-input flex-1">
                                <span class="text-gray-500">-</span>
                                <input type="number" id="maxWords" placeholder="最多" class="form-input flex-1">
                            </div>
                        </div>
                        
                        <!-- 发布时间 -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">发布时间</label>
                            <select id="timeRange" class="form-input">
                                <option value="">不限</option>
                                <option value="today">今天</option>
                                <option value="week">本周</option>
                                <option value="month">本月</option>
                                <option value="year">本年</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- 自定义时间范围 -->
                    <div id="customTimeRange" class="grid grid-cols-2 gap-4 mb-4" style="display: none;">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
                            <input type="date" id="startDate" class="form-input">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
                            <input type="date" id="endDate" class="form-input">
                        </div>
                    </div>

                    <!-- 排序选项 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
                            <select id="sortBy" class="form-input">
                                <option value="createdAt">发布时间</option>
                                <option value="title">标题</option>
                                <option value="views">阅读量</option>
                                <option value="author">作者</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">排序顺序</label>
                            <select id="sortOrder" class="form-input">
                                <option value="desc">降序</option>
                                <option value="asc">升序</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 搜索建议 -->
                <div id="searchSuggestions" class="search-suggestions mt-2" style="display: none;">
                    <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                        <!-- 搜索建议将在这里显示 -->
                    </div>
                </div>

                <!-- 搜索结果统计 -->
                <div id="searchStats" class="mt-4 text-sm text-gray-600" style="display: none;">
                    <div class="flex items-center justify-between">
                        <span id="searchResultCount">找到 0 个结果</span>
                        <span id="searchTime">搜索用时: 0ms</span>
                    </div>
                </div>
            </div>
        `;

        this.bindSearchEvents();
    }

    // 绑定搜索相关事件
    bindSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const searchType = document.getElementById('searchType');
        const advancedSearchToggle = document.getElementById('advancedSearchToggle');
        const advancedSearchPanel = document.getElementById('advancedSearchPanel');
        const clearSearch = document.getElementById('clearSearch');
        const timeRange = document.getElementById('timeRange');
        const customTimeRange = document.getElementById('customTimeRange');

        // 实时搜索
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim();
                this.debounceSearch();
                this.showSearchSuggestions();
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });

            searchInput.addEventListener('focus', () => {
                if (this.searchTerm) {
                    this.showSearchSuggestions();
                }
            });

            searchInput.addEventListener('blur', () => {
                // 延迟隐藏建议，以便点击建议项
                setTimeout(() => this.hideSearchSuggestions(), 200);
            });
        }

        // 搜索按钮
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // 搜索类型改变
        if (searchType) {
            searchType.addEventListener('change', (e) => {
                this.searchType = e.target.value;
                if (this.searchTerm) {
                    this.debounceSearch();
                }
            });
        }

        // 高级搜索切换
        if (advancedSearchToggle && advancedSearchPanel) {
            advancedSearchToggle.addEventListener('click', () => {
                const isVisible = advancedSearchPanel.style.display !== 'none';
                advancedSearchPanel.style.display = isVisible ? 'none' : 'block';
                advancedSearchToggle.textContent = isVisible ? '🔍 高级搜索' : '📖 基础搜索';
            });
        }

        // 清空搜索
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // 时间范围选择
        if (timeRange && customTimeRange) {
            timeRange.addEventListener('change', (e) => {
                customTimeRange.style.display = e.target.value === 'custom' ? 'grid' : 'none';
            });
        }

        // 高级搜索字段变化时触发搜索
        document.addEventListener('input', (e) => {
            if (e.target.matches('#authorSearch, #minWords, #maxWords, #startDate, #endDate')) {
                if (this.searchTerm || this.hasAdvancedFilters()) {
                    this.debounceSearch();
                }
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#sortBy, #sortOrder')) {
                if (this.searchTerm || this.hasAdvancedFilters()) {
                    this.performSearch();
                }
            }
        });
    }

    // 防抖搜索
    debounceSearch() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    // 执行搜索
    async performSearch() {
        if (!this.searchTerm && !this.hasAdvancedFilters()) {
            this.clearSearchResults();
            return;
        }

        this.showSearchLoading(true);
        const startTime = Date.now();

        try {
            const searchParams = this.buildSearchParams();
            const response = await fetch(`/api/novels/search?${searchParams.toString()}`);
            const result = await response.json();

            const searchTime = Date.now() - startTime;

            if (result.success) {
                this.searchResults = result.novels || [];
                this.displaySearchResults(this.searchResults, searchTime);
            } else {
                console.error('搜索失败:', result.message);
                this.displaySearchError(result.message);
            }
        } catch (error) {
            console.error('搜索请求失败:', error);
            this.displaySearchError('搜索请求失败，请检查网络连接');
        } finally {
            this.showSearchLoading(false);
        }
    }

    // 构建搜索参数
    buildSearchParams() {
        const params = new URLSearchParams();

        // 基础搜索
        if (this.searchTerm) {
            params.append('q', this.searchTerm);
            params.append('type', this.searchType);
        }

        // 高级搜索参数
        const authorSearch = document.getElementById('authorSearch');
        if (authorSearch && authorSearch.value.trim()) {
            params.append('author', authorSearch.value.trim());
        }

        const minWords = document.getElementById('minWords');
        if (minWords && minWords.value) {
            params.append('minWords', minWords.value);
        }

        const maxWords = document.getElementById('maxWords');
        if (maxWords && maxWords.value) {
            params.append('maxWords', maxWords.value);
        }

        const timeRange = document.getElementById('timeRange');
        if (timeRange && timeRange.value) {
            if (timeRange.value === 'custom') {
                const startDate = document.getElementById('startDate');
                const endDate = document.getElementById('endDate');
                if (startDate && startDate.value) {
                    params.append('startDate', startDate.value);
                }
                if (endDate && endDate.value) {
                    params.append('endDate', endDate.value);
                }
            } else {
                params.append('timeRange', timeRange.value);
            }
        }

        const sortBy = document.getElementById('sortBy');
        if (sortBy && sortBy.value) {
            params.append('sortBy', sortBy.value);
        }

        const sortOrder = document.getElementById('sortOrder');
        if (sortOrder && sortOrder.value) {
            params.append('sortOrder', sortOrder.value);
        }

        return params;
    }

    // 检查是否有高级搜索条件
    hasAdvancedFilters() {
        const authorSearch = document.getElementById('authorSearch');
        const minWords = document.getElementById('minWords');
        const maxWords = document.getElementById('maxWords');
        const timeRange = document.getElementById('timeRange');

        return (authorSearch && authorSearch.value.trim()) ||
               (minWords && minWords.value) ||
               (maxWords && maxWords.value) ||
               (timeRange && timeRange.value);
    }

    // 显示搜索结果
    displaySearchResults(novels, searchTime) {
        // 显示搜索统计
        this.showSearchStats(novels.length, searchTime);

        // 渲染搜索结果
        if (window.filterManager && window.filterManager.renderFilteredNovels) {
            window.filterManager.renderFilteredNovels(novels);
        } else if (window.adminManager && window.adminManager.renderNovelsList) {
            window.adminManager.renderNovelsList(novels);
        }

        // 显示清空搜索按钮
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.style.display = 'inline-block';
        }
    }

    // 显示搜索统计信息
    showSearchStats(count, searchTime) {
        const searchStats = document.getElementById('searchStats');
        const searchResultCount = document.getElementById('searchResultCount');
        const searchTimeSpan = document.getElementById('searchTime');

        if (searchStats && searchResultCount && searchTimeSpan) {
            searchStats.style.display = 'block';
            searchResultCount.textContent = `找到 ${count} 个结果`;
            searchTimeSpan.textContent = `搜索用时: ${searchTime}ms`;
        }
    }

    // 显示搜索错误
    displaySearchError(message) {
        const novelsList = document.getElementById('novelsList');
        if (novelsList) {
            novelsList.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <div class="text-4xl mb-4">❌</div>
                    <p>搜索出错: ${message}</p>
                </div>
            `;
        }
    }

    // 显示/隐藏搜索加载状态
    showSearchLoading(show) {
        const searchSpinner = document.getElementById('searchSpinner');
        const searchIcon = document.getElementById('searchIcon');

        if (searchSpinner && searchIcon) {
            searchSpinner.style.display = show ? 'block' : 'none';
            searchIcon.style.display = show ? 'none' : 'block';
        }

        this.isSearching = show;
    }

    // 显示搜索建议
    async showSearchSuggestions() {
        if (!this.searchTerm || this.searchTerm.length < 2) {
            this.hideSearchSuggestions();
            return;
        }

        try {
            const response = await fetch(`/api/novels/suggestions?q=${encodeURIComponent(this.searchTerm)}`);
            const result = await response.json();

            if (result.success && result.suggestions.length > 0) {
                this.renderSearchSuggestions(result.suggestions);
            } else {
                this.hideSearchSuggestions();
            }
        } catch (error) {
            console.error('获取搜索建议失败:', error);
            this.hideSearchSuggestions();
        }
    }

    // 渲染搜索建议
    renderSearchSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer) return;

        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="suggestion-item p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                 onclick="searchManager.selectSuggestion('${suggestion.text}', '${suggestion.type}')">
                <div class="flex items-center">
                    <span class="suggestion-icon mr-2">
                        ${suggestion.type === 'title' ? '📖' : 
                          suggestion.type === 'author' ? '👤' : 
                          suggestion.type === 'tag' ? '🏷️' : '🔍'}
                    </span>
                    <span class="suggestion-text">${suggestion.text}</span>
                    <span class="suggestion-type text-xs text-gray-500 ml-auto">
                        ${suggestion.type === 'title' ? '标题' : 
                          suggestion.type === 'author' ? '作者' : 
                          suggestion.type === 'tag' ? '标签' : '内容'}
                    </span>
                </div>
            </div>
        `).join('');

        suggestionsContainer.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                ${suggestionsHTML}
            </div>
        `;
        suggestionsContainer.style.display = 'block';
    }

    // 隐藏搜索建议
    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    // 选择搜索建议
    selectSuggestion(text, type) {
        const searchInput = document.getElementById('searchInput');
        const searchType = document.getElementById('searchType');

        if (searchInput) {
            searchInput.value = text;
            this.searchTerm = text;
        }

        if (searchType && type !== 'content') {
            searchType.value = type;
            this.searchType = type;
        }

        this.hideSearchSuggestions();
        this.performSearch();
    }

    // 清空搜索
    clearSearch() {
        // 清空搜索框
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        // 重置搜索类型
        const searchType = document.getElementById('searchType');
        if (searchType) {
            searchType.value = 'all';
        }

        // 清空高级搜索字段
        const advancedFields = ['authorSearch', 'minWords', 'maxWords', 'startDate', 'endDate'];
        advancedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });

        // 重置时间范围
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            timeRange.value = '';
        }

        // 隐藏自定义时间范围
        const customTimeRange = document.getElementById('customTimeRange');
        if (customTimeRange) {
            customTimeRange.style.display = 'none';
        }

        // 重置排序
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');
        if (sortBy) sortBy.value = 'createdAt';
        if (sortOrder) sortOrder.value = 'desc';

        // 清空搜索相关状态
        this.searchTerm = '';
        this.searchType = 'all';
        this.searchResults = [];

        // 隐藏搜索建议和统计
        this.hideSearchSuggestions();
        const searchStats = document.getElementById('searchStats');
        if (searchStats) {
            searchStats.style.display = 'none';
        }

        // 隐藏清空按钮
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.style.display = 'none';
        }

        // 重新加载所有作品
        this.clearSearchResults();
    }

    // 清空搜索结果，显示所有作品
    clearSearchResults() {
        if (window.adminManager && window.adminManager.loadNovels) {
            window.adminManager.loadNovels();
        }
    }

    // 绑定事件
    bindEvents() {
        // 在这里绑定其他非搜索相关的事件
    }

    // 获取当前搜索状态
    getSearchState() {
        return {
            searchTerm: this.searchTerm,
            searchType: this.searchType,
            hasResults: this.searchResults.length > 0,
            isSearching: this.isSearching
        };
    }
}

// 全局搜索管理器实例
window.searchManager = new SearchManager();