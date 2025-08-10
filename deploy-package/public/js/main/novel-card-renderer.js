/**
 * 小说卡片渲染模块
 * 负责小说卡片的生成、渲染和交互处理
 */
class NovelCardRenderer {
    constructor(options = {}) {
        this.options = {
            enableLazyLoading: true,
            enableAnimations: true,
            cardClickHandler: null,
            ...options
        };
    }

    /**
     * 创建小说卡片
     * @param {Object} novel 小说数据
     * @param {Object} userManager 用户管理器实例
     * @returns {HTMLElement} 卡片元素
     */
    createNovelCard(novel, userManager = null) {
        const card = document.createElement('div');
        card.className = 'novel-card bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1';

        // 使用服务器返回的权限信息，如果没有则回退到客户端计算
        const hasAccess = novel.hasAccess !== undefined ? novel.hasAccess :
                         (!userManager || userManager.canAccessContent(novel.accessLevel));
        const requiresLogin = novel.requiresLogin !== undefined ? novel.requiresLogin :
                             (userManager && !userManager.isLoggedIn() && novel.accessLevel !== 'free');

        // 调试日志 - 仅显示高级会员内容的权限信息
        if (novel.accessLevel === 'premium') {
            console.log(`高级会员小说 "${novel.title}" 权限检查:`, {
                serverHasAccess: novel.hasAccess,
                finalHasAccess: hasAccess,
                userLoggedIn: userManager ? userManager.isLoggedIn() : false,
                membershipType: userManager ? userManager.getMembershipStatus().type : 'unknown'
            });
        }

        // 设置点击事件
        card.onclick = () => this.handleCardClick(novel, hasAccess, requiresLogin);

        // 生成封面
        const coverHtml = this.generateCover(novel);
        
        // 生成访问级别标识
        const accessLevelBadge = this.getAccessLevelBadge(novel.accessLevel, hasAccess);

        // 检测是否为移动端
        const isMobile = window.innerWidth <= 768;

        // 格式化时间
        const timeAgo = this.getTimeAgo(novel.publishTime);

        if (isMobile) {
            // 移动端简化版卡片
            card.innerHTML = this.generateMobileCardHTML(novel, coverHtml, accessLevelBadge, hasAccess, requiresLogin, timeAgo);
        } else {
            // 桌面端完整版卡片
            card.innerHTML = this.generateDesktopCardHTML(novel, coverHtml, accessLevelBadge, hasAccess, requiresLogin, timeAgo);
        }

        return card;
    }

    /**
     * 生成移动端卡片HTML
     */
    generateMobileCardHTML(novel, coverHtml, accessLevelBadge, hasAccess, requiresLogin, timeAgo) {
        return `
            ${coverHtml}
            <div class="card-content">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="flex-1">${this.escapeHtml(novel.title)}</h3>
                    ${accessLevelBadge}
                </div>
                <div class="card-tags mb-2">
                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mr-1">${novel.tags[0] || ''}</span>
                </div>
                ${!hasAccess ? '<div class="access-restriction text-xs text-orange-600 mb-2">🔒 ' + this.getAccessRestrictionText(novel.accessLevel, requiresLogin) + '</div>' : ''}
                <div class="card-footer">
                    <div class="card-actions">
                        <button class="like-btn flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 ${novel.userHasLiked ? 'liked text-red-500' : ''}"
                                data-novel-id="${novel.id}"
                                onclick="handleLike(event, ${novel.id})">
                            <span class="like-icon">${novel.userHasLiked ? '❤️' : '🤍'}</span>
                            <span class="like-count">${this.formatViews(novel.likes || 0)}</span>
                        </button>
                        <button class="favorite-btn flex items-center space-x-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors duration-200 ${novel.userHasFavorited ? 'favorited text-yellow-500' : ''}"
                                data-novel-id="${novel.id}"
                                onclick="handleFavorite(event, ${novel.id})">
                            <span class="favorite-icon">${novel.userHasFavorited ? '⭐' : '☆'}</span>
                            <span class="favorite-count">${this.formatViews(novel.favorites || 0)}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成桌面端卡片HTML
     */
    generateDesktopCardHTML(novel, coverHtml, accessLevelBadge, hasAccess, requiresLogin, timeAgo) {
        const tagsHtml = novel.tags.map(tag =>
            `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mr-1 mb-1">${this.escapeHtml(tag)}</span>`
        ).join('');

        return `
            ${coverHtml}
            <div class="card-content">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="flex-1">${this.escapeHtml(novel.title)}</h3>
                    ${accessLevelBadge}
                </div>
                <div class="card-tags mb-3">
                    ${tagsHtml}
                </div>
                ${!hasAccess ? '<div class="access-restriction text-xs text-orange-600 mb-2">🔒 ' + this.getAccessRestrictionText(novel.accessLevel, requiresLogin) + '</div>' : ''}
                <div class="card-extra-info flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span class="flex items-center">
                        <span class="mr-3">👁 ${this.formatViews(novel.views)}</span>
                        <span>📅 ${timeAgo}</span>
                    </span>
                </div>
                <div class="flex items-center justify-between border-t pt-2 mt-2">
                    <div class="flex items-center space-x-3">
                        <button class="like-btn flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 ${novel.userHasLiked ? 'liked text-red-500' : ''}"
                                data-novel-id="${novel.id}"
                                onclick="handleLike(event, ${novel.id})">
                            <span class="like-icon">${novel.userHasLiked ? '❤️' : '🤍'}</span>
                            <span class="like-count">${this.formatViews(novel.likes || 0)}</span>
                        </button>
                        <button class="favorite-btn flex items-center space-x-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors duration-200 ${novel.userHasFavorited ? 'favorited text-yellow-500' : ''}"
                                data-novel-id="${novel.id}"
                                onclick="handleFavorite(event, ${novel.id})">
                            <span class="favorite-icon">${novel.userHasFavorited ? '⭐' : '☆'}</span>
                            <span class="favorite-count">${this.formatViews(novel.favorites || 0)}</span>
                        </button>
                    </div>
                    <!-- 离线下载和分享功能已移除 -->
                </div>
            </div>
        `;
    }

    /**
     * 生成封面HTML
     * @param {Object} novel 小说数据
     * @returns {string} 封面HTML
     */
    generateCover(novel) {
        if (novel.coverType === 'text') {
            return this.generateTextCover(novel);
        } else if (novel.coverType === 'image' && novel.coverData) {
            return this.generateImageCover(novel);
        } else {
            return this.generateDefaultCover();
        }
    }

    /**
     * 生成文本封面
     */
    generateTextCover(novel) {
        let coverData = novel.coverData;
        if (typeof coverData === 'string') {
            try {
                coverData = JSON.parse(coverData);
            } catch (e) {
                coverData = { backgroundColor: '#FFE4E1', textColor: '#8B4513' };
            }
        }

        const backgroundColor = coverData?.backgroundColor || '#FFE4E1';
        const textColor = coverData?.textColor || '#8B4513';

        // 随机选择高度比例
        const heightClasses = ['square', 'medium', 'tall'];
        const randomHeight = heightClasses[Math.floor(Math.random() * heightClasses.length)];

        return `
            <div class="novel-cover text-cover ${randomHeight}"
                 style="background-color: ${backgroundColor}; color: ${textColor};">
                <h2>${this.escapeHtml(novel.title)}</h2>
            </div>
        `;
    }

    /**
     * 生成图片封面
     */
    generateImageCover(novel) {
        const heightClasses = ['square', 'medium', 'tall'];
        const randomHeight = heightClasses[Math.floor(Math.random() * heightClasses.length)];

        const lazyLoading = this.options.enableLazyLoading ? 'loading="lazy"' : '';

        return `
            <div class="novel-cover ${randomHeight}">
                <img src="${novel.coverData}"
                     alt="${this.escapeHtml(novel.title)}"
                     class="w-full h-full object-cover lazy-image"
                     ${lazyLoading}
                     onload="handleImageLoaded(this)"
                     onerror="handleImageError(this)">
            </div>
        `;
    }

    /**
     * 生成默认封面
     */
    generateDefaultCover() {
        return `
            <div class="novel-cover bg-gray-200 flex items-center justify-center square">
                <span class="text-gray-500">暂无封面</span>
            </div>
        `;
    }

    /**
     * 处理卡片点击
     */
    handleCardClick(novel, hasAccess, requiresLogin) {
        if (this.options.cardClickHandler) {
            this.options.cardClickHandler(novel, hasAccess, requiresLogin);
            return;
        }

        // 默认处理逻辑
        if (!hasAccess) {
            if (requiresLogin) {
                if (confirm('此内容需要登录后查看，是否前往登录？')) {
                    window.location.href = 'login.html';
                }
                return;
            } else {
                const levelText = novel.accessLevel === 'premium' ? '高级会员' : 'VIP会员';
                if (confirm(`此内容需要${levelText}权限，是否开通会员？`)) {
                    this.showMembershipCenter();
                }
                return;
            }
        }
        
        // 有权限访问，跳转到阅读页面
        window.location.href = `read.html?id=${novel.id}`;
    }

    /**
     * 处理点赞
     */
    async handleLike(event, novelId) {
        event.stopPropagation();
        
        if (window.handleLike) {
            window.handleLike(event, novelId);
        }
    }

    /**
     * 处理收藏
     */
    async handleFavorite(event, novelId) {
        event.stopPropagation();
        
        if (window.handleFavorite) {
            window.handleFavorite(event, novelId);
        }
    }

    // 离线下载和分享功能已移除

    /**
     * 处理图片加载完成
     */
    handleImageLoaded(img) {
        img.classList.add('loaded');
        
        // 触发瀑布流重新布局
        if (window.waterfallInstance) {
            clearTimeout(window.imageLoadTimeout);
            window.imageLoadTimeout = setTimeout(() => {
                window.waterfallInstance.layout();
            }, 100);
        }
    }

    /**
     * 处理图片加载失败
     */
    handleImageError(img) {
        const parent = img.parentElement;
        if (parent) {
            parent.innerHTML = `
                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span class="text-gray-500 text-sm">图片加载失败</span>
                </div>
            `;
        }

        // 触发重新布局
        if (window.waterfallInstance) {
            setTimeout(() => {
                window.waterfallInstance.layout();
            }, 50);
        }
    }

    /**
     * 获取访问级别徽章
     */
    getAccessLevelBadge(accessLevel, hasAccess) {
        if (window.Utils && window.Utils.getAccessLevelBadge) {
            return window.Utils.getAccessLevelBadge(accessLevel, hasAccess);
        }
        return '';
    }

    /**
     * 获取访问限制文本
     */
    getAccessRestrictionText(accessLevel, requiresLogin) {
        if (window.Utils && window.Utils.getAccessRestrictionText) {
            return window.Utils.getAccessRestrictionText(accessLevel, requiresLogin);
        }
        
        if (requiresLogin) {
            return '请登录后查看';
        }
        
        const levelText = accessLevel === 'premium' ? '高级会员' : 'VIP会员';
        return `需要${levelText}权限`;
    }

    /**
     * 格式化阅读量
     */
    formatViews(views) {
        if (window.Utils && window.Utils.formatViews) {
            return window.Utils.formatViews(views);
        }
        
        if (views >= 10000) {
            return Math.floor(views / 1000) / 10 + 'w';
        } else if (views >= 1000) {
            return Math.floor(views / 100) / 10 + 'k';
        }
        return views.toString();
    }

    /**
     * 计算时间差
     */
    getTimeAgo(publishTime) {
        if (window.Utils && window.Utils.getTimeAgo) {
            return window.Utils.getTimeAgo(publishTime);
        }
        
        const now = new Date();
        const publish = new Date(publishTime);
        const diffTime = Math.abs(now - publish);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1天前';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
        return `${Math.floor(diffDays / 365)}年前`;
    }

    /**
     * 转义HTML字符
     */
    escapeHtml(str) {
        if (window.Utils && window.Utils.escapeHtml) {
            return window.Utils.escapeHtml(str);
        }
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 显示会员中心
     */
    showMembershipCenter() {
        if (window.showMembershipCenter) {
            window.showMembershipCenter();
        }
    }

    /**
     * 批量渲染小说卡片
     * @param {Array} novels 小说数据数组
     * @param {HTMLElement} container 容器元素
     * @param {Object} userManager 用户管理器
     */
    renderNovels(novels, container, userManager = null) {
        if (!container) return;

        // 清空容器
        container.innerHTML = '';
        
        // 创建文档片段提高性能
        const fragment = document.createDocumentFragment();
        
        // 渲染所有小说卡片
        novels.forEach(novel => {
            const card = this.createNovelCard(novel, userManager);
            fragment.appendChild(card);
        });
        
        // 一次性添加到容器
        container.appendChild(fragment);
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NovelCardRenderer;
} else {
    window.NovelCardRenderer = NovelCardRenderer;
}