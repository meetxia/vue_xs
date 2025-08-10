// 组件生成和渲染函数

// 生成命令卡片
function generateCommandCard(command) {
    const complexityStars = Array.from({length: 5}, (_, i) => 
        `<div class="complexity-star ${i < command.complexity ? 'active' : ''}"></div>`
    ).join('');

    const examples = command.examples.map(example => `
        <div class="example-item">
            <div class="example-code">
                ${example.code}
                <button class="copy-btn" onclick="copyToClipboard('${example.code}')">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <div class="example-description">${example.description}</div>
        </div>
    `).join('');

    const tags = command.tags.map(tag => `<span class="command-tag">${tag}</span>`).join('');
    const personas = command.personas.map(persona => `<span class="command-tag">${persona}</span>`).join('');

    return `
        <div class="command-card card-hover-effect" data-category="${command.category}" data-command="${command.id}">
            <div class="command-header">
                <div class="command-icon">
                    <i class="${command.icon}"></i>
                </div>
                <div class="command-info">
                    <h3>${command.title}</h3>
                    <div class="command-syntax">${command.name}</div>
                </div>
            </div>
            
            <div class="command-description">${command.description}</div>
            
            <div class="command-complexity">
                <span class="complexity-label">复杂度:</span>
                <div class="complexity-stars">${complexityStars}</div>
            </div>
            
            <div class="command-tags">
                ${tags}
            </div>
            
            <div class="command-examples">
                <div class="examples-header">
                    <span class="examples-title">使用示例</span>
                    <button class="examples-toggle" onclick="toggleExamples(this)">
                        展开 <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="examples-content">
                    ${examples}
                </div>
            </div>
        </div>
    `;
}

// 生成人格卡片
function generatePersonaCard(persona) {
    const skills = persona.skills.map(skill => 
        `<span class="skill-tag" style="--persona-color: ${persona.color}; --persona-rgb: ${hexToRgb(persona.color)}">${skill}</span>`
    ).join('');

    const triggers = persona.triggers.map(trigger => `<li>${trigger}</li>`).join('');

    return `
        <div class="persona-card card-hover-effect" style="--persona-color: ${persona.color}; --persona-light: ${lightenColor(persona.color)}; --persona-rgb: ${hexToRgb(persona.color)}">
            <div class="persona-header">
                <div class="persona-avatar">
                    <i class="${persona.icon}"></i>
                </div>
                <div class="persona-info">
                    <h3>${persona.name}</h3>
                    <div class="persona-role">${persona.role}</div>
                </div>
            </div>
            
            <div class="persona-description">${persona.description}</div>
            
            <div class="persona-skills">
                <div class="skills-title">专业技能</div>
                <div class="skills-list">${skills}</div>
            </div>
            
            <div class="persona-triggers">
                <div class="triggers-title">激活场景</div>
                <ul class="triggers-list">${triggers}</ul>
            </div>
        </div>
    `;
}

// 生成Wave系统可视化
function generateWaveVisualization() {
    const stages = waveSystemData.stages.map(stage => {
        const tasks = stage.tasks.map(task => `<span class="wave-task">${task}</span>`).join('');
        
        return `
            <div class="wave-stage scroll-animate">
                <div class="wave-number">${stage.number}</div>
                <div class="wave-content">
                    <div class="wave-title">第${stage.number}波: ${stage.title}</div>
                    <div class="wave-description">${stage.description}</div>
                    <div class="wave-tasks">${tasks}</div>
                </div>
            </div>
        `;
    }).join('');

    const conditions = waveSystemData.triggerConditions.map(condition => 
        `<li>${condition}</li>`
    ).join('');

    return `
        <div class="wave-info scroll-animate">
            <h3>触发条件</h3>
            <ul>${conditions}</ul>
        </div>
        <div class="wave-flow">
            ${stages}
        </div>
    `;
}

// 生成快速入门向导
function generateQuickstartWizard() {
    const steps = quickstartData.steps.map((step, index) => `
        <div class="wizard-step scroll-animate animate-delay-${index * 100}" onclick="toggleStepCompletion(this)">
            <div class="step-number">${step.number}</div>
            <div class="step-content">
                <div class="step-title">${step.title}</div>
                <div class="step-description">${step.description}</div>
                <div class="step-code">
                    ${step.code}
                    <button class="copy-btn" onclick="copyToClipboard('${step.code}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="step-expected">
                    <strong>预期结果:</strong> ${step.expected}
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="wizard-intro scroll-animate">
            <p>${quickstartData.description}</p>
        </div>
        <div class="wizard-steps">
            ${steps}
        </div>
    `;
}

// 生成MCP服务器展示
function generateMCPServers() {
    const servers = mcpServersData.map(server => {
        const capabilities = server.capabilities.map(cap => `<span class="tag">${cap}</span>`).join('');
        
        return `
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="${server.icon}"></i>
                </div>
                <h3 class="feature-title">${server.name}</h3>
                <p class="feature-description">${server.description}</p>
                <div class="feature-tags">${capabilities}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="section-header">
            <h3>MCP服务器集成</h3>
            <p>SuperClaude集成了多个专业服务器，提供强大的外部工具支持</p>
        </div>
        <div class="features-grid">
            ${servers}
        </div>
    `;
}

// 工具函数
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '99, 102, 241';
}

function lightenColor(hex, percent = 20) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板!', 'success');
    }).catch(() => {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('已复制到剪贴板!', 'success');
    });
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
        <span>${message}</span>
    `;
    
    // 添加toast样式（如果还没有）
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const container = document.querySelector('.toast-container');
    container.appendChild(toast);
    
    // 显示动画
    setTimeout(() => toast.classList.add('show'), 100);
    
    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

// 切换示例展示
function toggleExamples(button) {
    const content = button.parentElement.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        button.innerHTML = '展开 <i class="fas fa-chevron-down"></i>';
    } else {
        content.classList.add('show');
        button.innerHTML = '收起 <i class="fas fa-chevron-up"></i>';
    }
}

// 切换步骤完成状态
function toggleStepCompletion(step) {
    step.classList.toggle('completed');
    
    // 检查是否所有步骤都完成
    const allSteps = document.querySelectorAll('.wizard-step');
    const completedSteps = document.querySelectorAll('.wizard-step.completed');
    
    if (completedSteps.length === allSteps.length) {
        showToast('🎉 恭喜！你已经完成了所有入门步骤！', 'success');
    }
}

// 命令搜索功能
function filterCommands(searchTerm, category = 'all') {
    const commands = document.querySelectorAll('.command-card');
    const searchLower = searchTerm.toLowerCase();
    
    commands.forEach(card => {
        const commandData = commandsData.find(cmd => cmd.id === card.dataset.command);
        const matchesSearch = !searchTerm || 
            commandData.title.toLowerCase().includes(searchLower) ||
            commandData.description.toLowerCase().includes(searchLower) ||
            commandData.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        const matchesCategory = category === 'all' || commandData.category === category;
        
        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
            card.classList.add('animate-fadeIn');
        } else {
            card.style.display = 'none';
            card.classList.remove('animate-fadeIn');
        }
    });
    
    // 显示无结果提示
    const visibleCards = document.querySelectorAll('.command-card[style*="block"]');
    const noResults = document.querySelector('.no-results');
    
    if (visibleCards.length === 0) {
        if (!noResults) {
            const message = document.createElement('div');
            message.className = 'no-results';
            message.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>未找到匹配的命令</h3>
                    <p>尝试使用不同的关键词或选择其他分类</p>
                </div>
            `;
            document.getElementById('commands-grid').appendChild(message);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

// 滚动动画观察器
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.scroll-animate').forEach(el => {
        observer.observe(el);
    });
}

// 数字计数动画
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// 初始化计数器动画
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.textContent);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// 添加toast样式到页面
function addToastStyles() {
    if (document.querySelector('#toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            background: white;
            border-radius: var(--radius-lg);
            padding: 1rem 1.5rem;
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--primary-color);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            min-width: 250px;
        }
        
        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .toast-success {
            border-left-color: var(--secondary-color);
        }
        
        .toast-success i {
            color: var(--secondary-color);
        }
        
        .toast i {
            color: var(--primary-color);
            font-size: 1.125rem;
        }
        
        .toast span {
            color: var(--text-primary);
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
}
