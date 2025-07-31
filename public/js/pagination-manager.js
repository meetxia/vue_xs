// 小说分页管理器
class PaginationManager {
    constructor(novelReader) {
        this.novelReader = novelReader;
        this.currentPage = 1;
        this.totalPages = 1;
        this.pages = [];
        this.wordsPerPage = 3000; // 每页字数限制
        this.originalContent = '';
        
        this.initializeElements();
        this.bindEvents();
        
        // 从localStorage恢复分页状态
        this.restorePaginationState();
    }

    // 初始化DOM元素
    initializeElements() {
        this.elements = {
            paginationContainer: document.getElementById('paginationContainer'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            currentPageNum: document.getElementById('currentPageNum'),
            totalPagesNum: document.getElementById('totalPagesNum'),
            pageJumpInput: document.getElementById('pageJumpInput'),
            pageJumpBtn: document.getElementById('pageJumpBtn'),
            novelContent: document.getElementById('novelContent')
        };
    }

    // 绑定事件
    bindEvents() {
        // 上一页按钮
        this.elements.prevPageBtn.addEventListener('click', () => {
            this.goToPreviousPage();
        });

        // 下一页按钮
        this.elements.nextPageBtn.addEventListener('click', () => {
            this.goToNextPage();
        });

        // 页面跳转
        this.elements.pageJumpBtn.addEventListener('click', () => {
            this.jumpToPage();
        });

        // 回车键跳转
        this.elements.pageJumpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.jumpToPage();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // 处理键盘快捷键
    handleKeyboardShortcuts(event) {
        // 如果在输入框中，不处理快捷键
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.goToPreviousPage();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.goToNextPage();
                break;
            case 'Home':
                event.preventDefault();
                this.goToPage(1);
                break;
            case 'End':
                event.preventDefault();
                this.goToPage(this.totalPages);
                break;
        }
    }

    // 处理小说内容并进行分页
    processContent(content) {
        console.log('分页管理器开始处理内容:', content.length, '字符');
        this.originalContent = content;
        
        if (!content || content.trim().length === 0) {
            console.log('内容为空，设置默认页面');
            this.pages = ['<p class="text-center text-gray-500 py-8">暂无内容</p>'];
            this.totalPages = 1;
            this.currentPage = 1;
            this.displayCurrentPage();
            this.hidePagination();
            return;
        }

        // 计算内容字数
        const textContent = this.extractTextFromHTML(content);
        const totalWords = textContent.length;

        console.log(`小说总字数: ${totalWords}`);

        // 如果字数少于3000字，不需要分页
        if (totalWords <= this.wordsPerPage) {
            console.log('内容较短，不需要分页，直接显示');
            this.pages = [content];
            this.totalPages = 1;
            this.currentPage = 1;
            this.displayCurrentPage(); // 这里是关键！必须显示内容
            this.hidePagination();
            return;
        }

        // 进行智能分页
        console.log('内容较长，开始智能分页');
        this.pages = this.smartPaginate(content);
        this.totalPages = this.pages.length;
        
        // 恢复用户之前的页面位置
        const savedPage = this.getSavedPage();
        this.currentPage = Math.min(savedPage, this.totalPages);
        
        console.log(`分页完成: 共${this.totalPages}页，当前第${this.currentPage}页`);
        
        this.showPagination();
        this.displayCurrentPage();
        this.updatePaginationUI();
    }

    // 从HTML内容中提取纯文本
    extractTextFromHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // 智能分页算法
    smartPaginate(content) {
        const pages = [];
        const div = document.createElement('div');
        div.innerHTML = content;
        
        // 获取所有段落元素
        const elements = Array.from(div.children);
        let currentPageContent = '';
        let currentPageWords = 0;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const elementText = element.textContent || element.innerText || '';
            const elementWords = elementText.length;

            // 检查添加当前元素是否会超过页面限制
            if (currentPageWords + elementWords > this.wordsPerPage && currentPageContent.trim()) {
                // 在合适的位置分页
                const breakPoint = this.findOptimalBreakPoint(elements, i, currentPageWords);
                
                if (breakPoint > i - 10) { // 避免页面过短
                    pages.push(currentPageContent);
                    currentPageContent = element.outerHTML;
                    currentPageWords = elementWords;
                } else {
                    currentPageContent += element.outerHTML;
                    currentPageWords += elementWords;
                }
            } else {
                currentPageContent += element.outerHTML;
                currentPageWords += elementWords;
            }
        }

        // 添加最后一页
        if (currentPageContent.trim()) {
            pages.push(currentPageContent);
        }

        return pages.length > 0 ? pages : [content];
    }

    // 寻找最佳分页点
    findOptimalBreakPoint(elements, currentIndex, currentWords) {
        // 寻找合适的分页点：章节标题、段落结束等
        for (let i = Math.max(0, currentIndex - 5); i < Math.min(elements.length, currentIndex + 5); i++) {
            const element = elements[i];
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent || '';
            
            // 优先在章节标题处分页
            if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
                return i;
            }
            
            // 在段落结束处分页（避免在对话中间断开）
            if (tagName === 'p' && !text.includes('"') && !text.includes('"')) {
                return i + 1;
            }
        }
        
        return currentIndex;
    }

    // 显示当前页内容
    displayCurrentPage() {
        console.log('显示当前页内容, 页码:', this.currentPage, '总页数:', this.totalPages);
        
        if (this.pages.length === 0) {
            console.error('没有页面内容可显示');
            return;
        }
        
        const pageContent = this.pages[this.currentPage - 1] || '';
        console.log('当前页内容长度:', pageContent.length);
        
        if (!pageContent) {
            console.error('当前页内容为空');
            this.elements.novelContent.innerHTML = '<p class="text-center text-gray-500 py-8">页面内容为空</p>';
            return;
        }
        
        // 更新内容
        this.elements.novelContent.innerHTML = pageContent;
        console.log('内容已更新到DOM');
        
        // 重新应用排版设置
        if (this.novelReader && this.novelReader.applySmartTypography) {
            this.novelReader.applySmartTypography();
        }
        
        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 保存当前页码状态
        this.savePaginationState();
    }

    // 上一页
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        } else {
            this.novelReader.showToast('已经是第一页了', 'info');
        }
    }

    // 下一页
    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        } else {
            this.novelReader.showToast('已经是最后一页了', 'info');
        }
    }

    // 跳转到指定页面
    goToPage(pageNum) {
        const targetPage = parseInt(pageNum);
        
        if (isNaN(targetPage) || targetPage < 1 || targetPage > this.totalPages) {
            this.novelReader.showToast('无效的页码', 'error');
            return;
        }
        
        if (targetPage === this.currentPage) {
            return;
        }
        
        this.currentPage = targetPage;
        this.displayCurrentPage();
        this.updatePaginationUI();
        
        this.novelReader.showToast(`跳转到第${targetPage}页`, 'success');
    }

    // 页面跳转
    jumpToPage() {
        const targetPage = parseInt(this.elements.pageJumpInput.value);
        this.goToPage(targetPage);
    }

    // 更新分页UI
    updatePaginationUI() {
        // 更新页码显示
        this.elements.currentPageNum.textContent = this.currentPage;
        this.elements.totalPagesNum.textContent = this.totalPages;
        this.elements.pageJumpInput.max = this.totalPages;
        this.elements.pageJumpInput.value = this.currentPage;

        // 更新按钮状态
        this.elements.prevPageBtn.classList.toggle('disabled', this.currentPage <= 1);
        this.elements.nextPageBtn.classList.toggle('disabled', this.currentPage >= this.totalPages);
    }

    // 显示分页导航
    showPagination() {
        this.elements.paginationContainer.style.display = 'flex';
    }

    // 隐藏分页导航
    hidePagination() {
        this.elements.paginationContainer.style.display = 'none';
    }

    // 保存分页状态到localStorage
    savePaginationState() {
        if (!this.novelReader.novelId) return;
        
        const state = {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`novel-${this.novelReader.novelId}-pagination`, JSON.stringify(state));
    }

    // 恢复分页状态
    restorePaginationState() {
        if (!this.novelReader.novelId) return;
        
        const saved = localStorage.getItem(`novel-${this.novelReader.novelId}-pagination`);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.currentPage = state.currentPage || 1;
                // totalPages会在processContent中重新计算
            } catch (error) {
                console.error('恢复分页状态失败:', error);
            }
        }
    }

    // 获取保存的页码
    getSavedPage() {
        if (!this.novelReader.novelId) return 1;
        
        const saved = localStorage.getItem(`novel-${this.novelReader.novelId}-pagination`);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                return state.currentPage || 1;
            } catch (error) {
                console.error('获取保存页码失败:', error);
            }
        }
        return 1;
    }

    // 重置分页
    reset() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.pages = [];
        this.originalContent = '';
        this.hidePagination();
    }

    // 获取分页信息
    getPaginationInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            wordsPerPage: this.wordsPerPage,
            hasMultiplePages: this.totalPages > 1
        };
    }

    // 设置每页字数限制
    setWordsPerPage(words) {
        if (words > 0 && words <= 10000) {
            this.wordsPerPage = words;
            // 如果有内容，重新分页
            if (this.originalContent) {
                this.processContent(this.originalContent);
            }
        }
    }
}

// 导出到全局作用域
window.PaginationManager = PaginationManager;