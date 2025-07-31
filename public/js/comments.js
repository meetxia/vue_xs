// 评论系统类
class CommentsSystem {
    constructor(novelId) {
        this.novelId = novelId;
        this.currentUser = null;
        this.comments = [];
        this.currentPage = 1;
        this.hasMoreComments = true;
        this.currentSort = 'time';
        this.isLoading = false;
        
        this.init();
    }
    
    // 初始化评论系统
    async init() {
        console.log('开始初始化评论系统，小说ID:', this.novelId);
        await this.checkUserAuth();
        this.bindEvents();
        await this.loadComments();
        this.showCommentsSection();
        console.log('评论系统初始化完成');
    }
    
    // 检查用户认证状态
    async checkUserAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.currentUser = result.data;
                    this.updateUserAvatar();
                } else {
                    // Token 过期，清除本地存储
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('检查用户认证失败:', error);
            }
        }
        
        // 如果未登录，显示登录提示
        if (!this.currentUser) {
            this.showLoginPrompt();
        }
    }
    
    // 更新用户头像
    updateUserAvatar() {
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && this.currentUser) {
            userAvatar.src = this.currentUser.avatar === 'default.png' 
                ? 'assets/default-avatar.svg' 
                : `assets/avatars/${this.currentUser.avatar}`;
        }
    }
    
    // 显示登录提示
    showLoginPrompt() {
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.innerHTML = `
                <div class="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                    <p class="text-gray-600 mb-4">登录后即可发表评论与其他读者交流</p>
                    <button onclick="window.location.href='/login.html'" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        立即登录
                    </button>
                </div>
            `;
        }
    }
    
    // 绑定事件
    bindEvents() {
        // 评论输入框字数统计
        const commentInput = document.getElementById('commentInput');
        const charCount = document.getElementById('charCount');
        if (commentInput && charCount) {
            commentInput.addEventListener('input', (e) => {
                charCount.textContent = e.target.value.length;
            });
        }
        
        // 发布评论按钮
        const submitBtn = document.getElementById('submitComment');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitComment());
        }
        
        // 取消按钮
        const cancelBtn = document.getElementById('cancelComment');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelComment());
        }
        
        // 排序选择
        const sortSelect = document.getElementById('commentSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.resetAndLoadComments();
            });
        }
        
        // 加载更多按钮
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }
    }
    
    // 显示评论区域
    showCommentsSection() {
        const commentsSection = document.getElementById('commentsSection');
        if (commentsSection) {
            commentsSection.style.display = 'block';
            console.log('评论区域已显示');
        } else {
            console.error('找不到评论区域元素');
        }
    }
    
    // 加载评论
    async loadComments(page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            const response = await fetch(`/api/novels/${this.novelId}/comments?sort=${this.currentSort}&page=${page}&limit=10`);
            const result = await response.json();
            
            if (result.success) {
                if (page === 1) {
                    this.comments = result.data.comments;
                } else {
                    this.comments.push(...result.data.comments);
                }
                
                this.hasMoreComments = result.data.pagination.page < result.data.pagination.totalPages;
                this.currentPage = page;
                
                this.renderComments();
                this.updateCommentCount(result.data.stats.totalComments);
                this.updateLoadMoreButton();
            }
        } catch (error) {
            console.error('加载评论失败:', error);
            this.showError('加载评论失败，请稍后重试');
        } finally {
            this.isLoading = false;
        }
    }
    
    // 重置并加载评论
    async resetAndLoadComments() {
        this.currentPage = 1;
        this.hasMoreComments = true;
        await this.loadComments(1);
    }
    
    // 加载更多评论
    async loadMoreComments() {
        if (this.hasMoreComments && !this.isLoading) {
            await this.loadComments(this.currentPage + 1);
        }
    }
    
    // 渲染评论列表
    renderComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        if (this.comments.length === 0) {
            commentsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">💭</div>
                    <p>还没有评论，快来抢沙发吧！</p>
                </div>
            `;
            return;
        }
        
        const commentsHTML = this.comments.map(comment => this.renderComment(comment)).join('');
        commentsList.innerHTML = commentsHTML;
    }
    
    // 渲染单个评论
    renderComment(comment) {
        const isOwner = this.currentUser && this.currentUser.id === comment.userId;
        const isLiked = comment.likedUsers && this.currentUser && comment.likedUsers.includes(this.currentUser.id);
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-user">
                        <img src="${comment.user?.avatar === 'default.png' ? 'assets/default-avatar.svg' : `assets/avatars/${comment.user?.avatar}`}" alt="${comment.user?.username || '用户'}">
                        <div>
                            <div class="comment-username">${comment.user?.username || '匿名用户'}</div>
                            <div class="comment-time">${this.formatTime(comment.createTime)}</div>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="comment-menu">
                            <div class="comment-menu-btn" onclick="toggleCommentMenu(${comment.id})">⋯</div>
                            <div class="comment-menu-dropdown" id="menu-${comment.id}">
                                <div class="comment-menu-item" onclick="editComment(${comment.id})">编辑</div>
                                <div class="comment-menu-item" onclick="deleteComment(${comment.id})">删除</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="comment-content" id="content-${comment.id}">${comment.content}</div>
                
                <div class="comment-edit-form" id="edit-${comment.id}">
                    <textarea class="reply-input" id="edit-input-${comment.id}">${comment.content}</textarea>
                    <div class="reply-actions">
                        <button class="btn-secondary" onclick="cancelEdit(${comment.id})">取消</button>
                        <button class="btn-primary" onclick="saveEdit(${comment.id})">保存</button>
                    </div>
                </div>
                
                <div class="comment-actions">
                    <div class="comment-action ${isLiked ? 'liked' : ''}" onclick="toggleLike(${comment.id})">
                        <span>${isLiked ? '❤️' : '🤍'}</span>
                        <span>${comment.likes || 0}</span>
                    </div>
                    ${this.currentUser ? `
                        <div class="comment-action" onclick="showReplyForm(${comment.id})">
                            <span>💬</span>
                            <span>回复</span>
                        </div>
                    ` : ''}
                </div>
                
                ${this.currentUser ? `
                    <div class="reply-form" id="reply-${comment.id}">
                        <textarea class="reply-input" placeholder="写下你的回复..." rows="3" maxlength="1000"></textarea>
                        <div class="reply-actions">
                            <button class="btn-secondary" onclick="hideReplyForm(${comment.id})">取消</button>
                            <button class="btn-primary" onclick="submitReply(${comment.id})">回复</button>
                        </div>
                    </div>
                ` : ''}
                
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.repliesData ? comment.repliesData.map(reply => this.renderReply(reply)).join('') : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // 渲染回复
    renderReply(reply) {
        const isOwner = this.currentUser && this.currentUser.id === reply.userId;
        const isLiked = reply.likedUsers && this.currentUser && reply.likedUsers.includes(this.currentUser.id);
        
        return `
            <div class="reply-item" data-comment-id="${reply.id}">
                <div class="comment-header">
                    <div class="comment-user">
                        <img src="${reply.user?.avatar === 'default.png' ? 'assets/default-avatar.svg' : `assets/avatars/${reply.user?.avatar}`}" alt="${reply.user?.username || '用户'}">
                        <div>
                            <div class="comment-username">${reply.user?.username || '匿名用户'}</div>
                            <div class="comment-time">${this.formatTime(reply.createTime)}</div>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="comment-menu">
                            <div class="comment-menu-btn" onclick="toggleCommentMenu(${reply.id})">⋯</div>
                            <div class="comment-menu-dropdown" id="menu-${reply.id}">
                                <div class="comment-menu-item" onclick="editComment(${reply.id})">编辑</div>
                                <div class="comment-menu-item" onclick="deleteComment(${reply.id})">删除</div>  
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="comment-content" id="content-${reply.id}">${reply.content}</div>
                
                <div class="comment-edit-form" id="edit-${reply.id}">
                    <textarea class="reply-input" id="edit-input-${reply.id}">${reply.content}</textarea>
                    <div class="reply-actions">
                        <button class="btn-secondary" onclick="cancelEdit(${reply.id})">取消</button>
                        <button class="btn-primary" onclick="saveEdit(${reply.id})">保存</button>
                    </div>
                </div>
                
                <div class="comment-actions">
                    <div class="comment-action ${isLiked ? 'liked' : ''}" onclick="toggleLike(${reply.id})">
                        <span>${isLiked ? '❤️' : '🤍'}</span>
                        <span>${reply.likes || 0}</span>
                    </div>
                    ${this.currentUser && reply.level < 2 ? `
                        <div class="comment-action" onclick="showReplyForm(${reply.id}, ${reply.parentId || reply.id})">
                            <span>💬</span>
                            <span>回复</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // 提交评论
    async submitComment() {
        if (!this.currentUser) {
            this.showError('请先登录');
            return;
        }
        
        const commentInput = document.getElementById('commentInput');
        const content = commentInput.value.trim();
        
        if (!content) {
            this.showError('评论内容不能为空');
            return;
        }
        
        const submitBtn = document.getElementById('submitComment');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '发布中...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`/api/novels/${this.novelId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });
            
            const result = await response.json();
            
            if (result.success) {
                commentInput.value = '';
                document.getElementById('charCount').textContent = '0';
                this.showSuccess('评论发布成功！');
                
                // 刷新评论列表
                await this.resetAndLoadComments();
            } else {
                this.showError(result.message || '评论发布失败');
            }
        } catch (error) {
            console.error('发布评论失败:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // 取消评论
    cancelComment() {
        const commentInput = document.getElementById('commentInput');
        commentInput.value = '';
        document.getElementById('charCount').textContent = '0';
    }
    
    // 更新评论数量
    updateCommentCount(count) {
        const commentCount = document.getElementById('commentCount');
        if (commentCount) {
            commentCount.textContent = count;
        }
    }
    
    // 更新加载更多按钮
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            if (this.hasMoreComments) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.textContent = this.isLoading ? '加载中...' : '加载更多评论';
                loadMoreBtn.disabled = this.isLoading;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }
    
    // 格式化时间
    formatTime(timeString) {
        const time = new Date(timeString);
        const now = new Date();
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 30) return `${days}天前`;
        
        return time.toLocaleDateString();
    }
    
    // 显示错误消息
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    // 显示成功消息
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        }`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // 3秒后自动消失
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// 全局函数，供HTML调用
let commentsSystem = null;

// 初始化评论系统
function initCommentsSystem(novelId) {
    console.log('调用initCommentsSystem，小说ID:', novelId);
    if (!novelId) {
        console.error('小说ID无效，无法初始化评论系统');
        return;
    }
    commentsSystem = new CommentsSystem(novelId);
}

// 切换评论菜单
function toggleCommentMenu(commentId) {
    const menu = document.getElementById(`menu-${commentId}`);
    if (menu) {
        menu.classList.toggle('active');
    }
    
    // 点击其他地方关闭菜单
    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('.comment-menu')) {
            menu.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });
}

// 编辑评论
function editComment(commentId) {
    const contentEl = document.getElementById(`content-${commentId}`);
    const editForm = document.getElementById(`edit-${commentId}`);
    const menu = document.getElementById(`menu-${commentId}`);
    
    if (contentEl && editForm) {
        contentEl.style.display = 'none';
        editForm.classList.add('active');
        menu.classList.remove('active');
    }
}

// 取消编辑
function cancelEdit(commentId) {
    const contentEl = document.getElementById(`content-${commentId}`);
    const editForm = document.getElementById(`edit-${commentId}`);
    
    if (contentEl && editForm) {
        contentEl.style.display = 'block';
        editForm.classList.remove('active');
    }
}

// 保存编辑
async function saveEdit(commentId) {
    const editInput = document.getElementById(`edit-input-${commentId}`);
    const content = editInput.value.trim();
    
    if (!content) {
        commentsSystem.showError('评论内容不能为空');
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const contentEl = document.getElementById(`content-${commentId}`);
            const editForm = document.getElementById(`edit-${commentId}`);
            
            contentEl.textContent = content;
            contentEl.style.display = 'block';
            editForm.classList.remove('active');
            
            commentsSystem.showSuccess('评论更新成功！');
        } else {
            commentsSystem.showError(result.message || '更新失败');
        }
    } catch (error) {
        console.error('更新评论失败:', error);
        commentsSystem.showError('网络错误，请稍后重试');
    }
}

// 删除评论
async function deleteComment(commentId) {
    if (!confirm('确定要删除这条评论吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            commentsSystem.showSuccess('评论删除成功！');
            // 刷新评论列表
            await commentsSystem.resetAndLoadComments();
        } else {
            commentsSystem.showError(result.message || '删除失败');
        }
    } catch (error) {
        console.error('删除评论失败:', error);
        commentsSystem.showError('网络错误，请稍后重试');
    }
}

// 切换点赞
async function toggleLike(commentId) {
    if (!commentsSystem.currentUser) {
        commentsSystem.showError('请先登录');
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 更新UI
            const actionEl = document.querySelector(`[data-comment-id="${commentId}"] .comment-action`);
            if (actionEl) {
                const isLiked = result.data.isLiked;
                actionEl.classList.toggle('liked', isLiked);
                actionEl.querySelector('span:first-child').textContent = isLiked ? '❤️' : '🤍';
                actionEl.querySelector('span:last-child').textContent = result.data.likes;
            }
        } else {
            commentsSystem.showError(result.message || '操作失败');
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        commentsSystem.showError('网络错误，请稍后重试');
    }
}

// 显示回复表单
function showReplyForm(commentId, parentId = null) {
    const replyForm = document.getElementById(`reply-${commentId}`);
    if (replyForm) {
        replyForm.classList.add('active');
        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        }
    }
}

// 隐藏回复表单
function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-${commentId}`);
    if (replyForm) {
        replyForm.classList.remove('active');
        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
            textarea.value = '';
        }
    }
}

// 提交回复
async function submitReply(commentId) {
    const replyForm = document.getElementById(`reply-${commentId}`);
    const textarea = replyForm.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        commentsSystem.showError('回复内容不能为空');
        return;
    }
    
    const submitBtn = replyForm.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '发布中...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/novels/${commentsSystem.novelId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                content,
                parentId: commentId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            textarea.value = '';
            replyForm.classList.remove('active');
            commentsSystem.showSuccess('回复发布成功！');
            
            // 刷新评论列表
            await commentsSystem.resetAndLoadComments();
        } else {
            commentsSystem.showError(result.message || '回复发布失败');
        }
    } catch (error) {
        console.error('发布回复失败:', error);
        commentsSystem.showError('网络错误，请稍后重试');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}