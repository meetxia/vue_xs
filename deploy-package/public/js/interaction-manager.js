/**
 * 用户互动管理器
 * 处理点赞、收藏等用户交互功能，支持登录状态检查和持久化存储
 */
class InteractionManager {
    constructor(userManager) {
        this.userManager = userManager;
    }
    
    /**
     * 处理点赞功能
     */
    async handleLike(event, novelId) {
        event.stopPropagation();
        
        // 检查用户登录状态
        if (!this.userManager || !this.userManager.isLoggedIn()) {
            if (confirm('点赞需要登录，是否前往登录？')) {
                window.location.href = 'user-profile.html';
            }
            return;
        }
        
        const btn = event.target.closest('.like-btn');
        const icon = btn.querySelector('.like-icon');
        const count = btn.querySelector('.like-count');
        const isLiked = btn.classList.contains('liked');
        const method = isLiked ? 'DELETE' : 'POST';
        const url = `/api/novels/${novelId}/like`;
        
        try {
            // 立即更新UI
            if (isLiked) {
                btn.classList.remove('liked');
                icon.textContent = '🤍';
            } else {
                btn.classList.add('liked');
                icon.textContent = '❤️';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userManager.getToken()}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (count) count.textContent = formatViews(result.data.likes);
                showToast(result.message, 'success');
                
                // 更新本地数据
                if (window.novelsData) {
                    const novel = window.novelsData.find(n => n.id === novelId);
                    if (novel) {
                        novel.likes = result.data.likes;
                        novel.userHasLiked = result.data.userHasLiked;
                    }
                }
            } else {
                // 回滚UI
                if (isLiked) {
                    btn.classList.add('liked');
                    icon.textContent = '❤️';
                } else {
                    btn.classList.remove('liked');
                    icon.textContent = '🤍';
                }
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            // 回滚UI
            if (isLiked) {
                btn.classList.add('liked');
                icon.textContent = '❤️';
            } else {
                btn.classList.remove('liked');
                icon.textContent = '🤍';
            }
            showToast('点赞操作失败，请稍后重试', 'error');
        }
    }
    
    /**
     * 处理收藏功能
     */
    async handleFavorite(event, novelId) {
        event.stopPropagation();
        
        // 检查用户登录状态
        if (!this.userManager || !this.userManager.isLoggedIn()) {
            if (confirm('收藏需要登录，是否前往登录？')) {
                window.location.href = 'user-profile.html';
            }
            return;
        }
        
        const btn = event.target.closest('.favorite-btn');
        const icon = btn.querySelector('.favorite-icon');
        const count = btn.querySelector('.favorite-count');
        const isFavorited = btn.classList.contains('favorited');
        const method = isFavorited ? 'DELETE' : 'POST';
        const url = `/api/novels/${novelId}/favorite`;
        
        try {
            // 立即更新UI
            if (isFavorited) {
                btn.classList.remove('favorited');
                icon.textContent = '☆';
            } else {
                btn.classList.add('favorited');
                icon.textContent = '⭐';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userManager.getToken()}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (count) count.textContent = formatViews(result.data.favorites);
                showToast(result.message, 'success');
                
                // 更新本地数据
                if (window.novelsData) {
                    const novel = window.novelsData.find(n => n.id === novelId);
                    if (novel) {
                        novel.favorites = result.data.favorites;
                        novel.userHasFavorited = result.data.userHasFavorited;
                    }
                }
            } else {
                // 回滚UI
                if (isFavorited) {
                    btn.classList.add('favorited');
                    icon.textContent = '⭐';
                } else {
                    btn.classList.remove('favorited');
                    icon.textContent = '☆';
                }
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            // 回滚UI
            if (isFavorited) {
                btn.classList.add('favorited');
                icon.textContent = '⭐';
            } else {
                btn.classList.remove('favorited');
                icon.textContent = '☆';
            }
            showToast('收藏操作失败，请稍后重试', 'error');
        }
    }
    
    /**
     * 初始化小说卡片的交互状态
     */
    initializeCardInteractions(novels) {
        if (!Array.isArray(novels)) return;
        
        novels.forEach(novel => {
            // 查找对应的点赞按钮
            const likeButtons = document.querySelectorAll(`[data-novel-id="${novel.id}"] .like-btn, .like-btn[data-novel-id="${novel.id}"]`);
            likeButtons.forEach(btn => {
                const icon = btn.querySelector('.like-icon');
                if (novel.userHasLiked) {
                    btn.classList.add('liked');
                    if (icon) icon.textContent = '❤️';
                } else {
                    btn.classList.remove('liked');
                    if (icon) icon.textContent = '🤍';
                }
            });
            
            // 查找对应的收藏按钮
            const favoriteButtons = document.querySelectorAll(`[data-novel-id="${novel.id}"] .favorite-btn, .favorite-btn[data-novel-id="${novel.id}"]`);
            favoriteButtons.forEach(btn => {
                const icon = btn.querySelector('.favorite-icon');
                if (novel.userHasFavorited) {
                    btn.classList.add('favorited');
                    if (icon) icon.textContent = '⭐';
                } else {
                    btn.classList.remove('favorited');
                    if (icon) icon.textContent = '☆';
                }
            });
        });
    }
}

// 全局交互管理器实例（注释掉避免与main.js重复声明）
// let interactionManager = null;

// 全局函数，供按钮onclick调用
function handleLike(event, novelId) {
    if (window.interactionManager) {
        window.interactionManager.handleLike(event, novelId);
    } else if (window.handleLike) {
        window.handleLike(event, novelId);
    }
}

function handleFavorite(event, novelId) {
    if (window.interactionManager) {
        window.interactionManager.handleFavorite(event, novelId);
    } else if (window.handleFavorite) {
        window.handleFavorite(event, novelId);
    }
}

// 初始化函数
function initializeInteractionManager(userManagerInstance) {
    window.interactionManager = new InteractionManager(userManagerInstance);
    return window.interactionManager;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InteractionManager, initializeInteractionManager };
} else {
    window.InteractionManager = InteractionManager;
    window.initializeInteractionManager = initializeInteractionManager;
}