// SuperClaude Framework 数据定义

// 命令数据
const commandsData = [
    // 开发类命令
    {
        id: 'implement',
        name: '/sc:implement',
        title: '功能实现专家',
        category: 'development',
        icon: 'fas fa-code',
        complexity: 3,
        description: '实现新功能、添加新特性，自动选择合适的技术栈和架构模式',
        personas: ['前端专家', '后端专家', '架构师'],
        tags: ['功能开发', '代码生成', '架构设计'],
        examples: [
            {
                code: '/sc:implement 用户登录功能',
                description: '实现完整的用户登录系统，包括前端表单和后端验证'
            },
            {
                code: '/sc:implement 购物车功能 --framework react --with-persistence',
                description: '为React应用创建购物车组件，包含数据持久化'
            },
            {
                code: '/sc:implement 实时聊天系统 @src/chat --with-websocket',
                description: '在指定目录实现WebSocket实时聊天功能'
            }
        ]
    },
    {
        id: 'build',
        name: '/sc:build',
        title: '项目构建专家',
        category: 'development',
        icon: 'fas fa-hammer',
        complexity: 2,
        description: '编译、打包、部署项目，支持多种构建工具和部署平台',
        personas: ['架构师', 'DevOps专家'],
        tags: ['构建', '打包', '部署'],
        examples: [
            {
                code: '/sc:build',
                description: '自动检测项目类型并执行标准构建流程'
            },
            {
                code: '/sc:build production --optimize',
                description: '构建生产版本，启用代码压缩和资源优化'
            },
            {
                code: '/sc:build docker --platform linux/amd64',
                description: '构建Docker镜像并指定目标平台'
            }
        ]
    },
    {
        id: 'design',
        name: '/sc:design',
        title: '设计协调专家',
        category: 'development',
        icon: 'fas fa-drafting-compass',
        complexity: 4,
        description: '系统设计、架构规划、UI设计，提供全方位的设计解决方案',
        personas: ['架构师', '前端专家', '设计师'],
        tags: ['系统设计', '架构规划', 'UI设计'],
        examples: [
            {
                code: '/sc:design 用户注册页面',
                description: '设计用户注册页面的UI布局和交互流程'
            },
            {
                code: '/sc:design 微服务架构 --for e-commerce',
                description: '为电商系统设计微服务架构方案'
            },
            {
                code: '/sc:design 分布式系统 @docs/architecture',
                description: '设计分布式系统架构并生成文档'
            }
        ]
    },

    // 分析类命令
    {
        id: 'analyze',
        name: '/sc:analyze',
        title: '多维度分析专家',
        category: 'analysis',
        icon: 'fas fa-search',
        complexity: 4,
        description: '深度代码分析、性能分析、安全分析，提供全面的项目洞察',
        personas: ['分析师', '安全专家', '性能专家'],
        tags: ['代码分析', '性能分析', '安全审计'],
        examples: [
            {
                code: '/sc:analyze @src/main.js',
                description: '分析单个文件的代码质量和潜在问题'
            },
            {
                code: '/sc:analyze @src --type security --depth 3',
                description: '深度安全分析，检查安全漏洞和风险'
            },
            {
                code: '/sc:analyze @. --type performance --report detailed',
                description: '全项目性能分析，生成详细报告'
            }
        ]
    },
    {
        id: 'troubleshoot',
        name: '/sc:troubleshoot',
        title: '问题诊断专家',
        category: 'analysis',
        icon: 'fas fa-stethoscope',
        complexity: 3,
        description: '智能问题诊断、错误排查、解决方案推荐',
        personas: ['分析师', 'QA专家', '运维专家'],
        tags: ['问题诊断', '错误排查', '解决方案'],
        examples: [
            {
                code: '/sc:troubleshoot 页面加载缓慢',
                description: '诊断页面性能问题并提供优化建议'
            },
            {
                code: '/sc:troubleshoot @logs/error.log --recent 24h',
                description: '分析最近24小时的错误日志'
            },
            {
                code: '/sc:troubleshoot 内存泄漏 @src --auto-fix',
                description: '诊断内存泄漏问题并尝试自动修复'
            }
        ]
    },
    {
        id: 'explain',
        name: '/sc:explain',
        title: '教育解释专家',
        category: 'analysis',
        icon: 'fas fa-chalkboard-teacher',
        complexity: 2,
        description: '深入浅出的概念解释、代码说明、技术教学',
        personas: ['导师', '文档专家'],
        tags: ['概念解释', '教学', '知识分享'],
        examples: [
            {
                code: '/sc:explain 什么是Promise',
                description: '详细解释JavaScript Promise的概念和用法'
            },
            {
                code: '/sc:explain @src/algorithm.js --level beginner',
                description: '用初学者能理解的方式解释算法代码'
            },
            {
                code: '/sc:explain 微服务架构 --compare monolith',
                description: '解释微服务架构并与单体架构对比'
            }
        ]
    },

    // 质量类命令
    {
        id: 'improve',
        name: '/sc:improve',
        title: '代码增强专家',
        category: 'quality',
        icon: 'fas fa-arrow-up',
        complexity: 3,
        description: '代码重构、性能优化、质量提升，让代码更优雅高效',
        personas: ['重构专家', '性能专家'],
        tags: ['代码重构', '性能优化', '质量提升'],
        examples: [
            {
                code: '/sc:improve @src/utils.js',
                description: '重构工具函数，提升代码质量和可读性'
            },
            {
                code: '/sc:improve @src --type performance',
                description: '专注于性能优化的代码改进'
            },
            {
                code: '/sc:improve @. --refactor legacy --modern-patterns',
                description: '将遗留代码重构为现代化模式'
            }
        ]
    },
    {
        id: 'test',
        name: '/sc:test',
        title: '测试工作流专家',
        category: 'quality',
        icon: 'fas fa-vial',
        complexity: 3,
        description: '智能测试生成、测试执行、覆盖率分析',
        personas: ['QA专家', '测试工程师'],
        tags: ['单元测试', '集成测试', '测试覆盖率'],
        examples: [
            {
                code: '/sc:test @src/calculator.js',
                description: '为计算器模块生成完整的单元测试'
            },
            {
                code: '/sc:test @src/api --type integration --coverage 90%',
                description: '生成API集成测试，确保90%覆盖率'
            },
            {
                code: '/sc:test @. --type e2e --browser chrome,firefox',
                description: '运行端到端测试，支持多浏览器'
            }
        ]
    },
    {
        id: 'cleanup',
        name: '/sc:cleanup',
        title: '项目清理专家',
        category: 'quality',
        icon: 'fas fa-broom',
        complexity: 2,
        description: '清理冗余代码、整理项目结构、优化依赖关系',
        personas: ['重构专家', '架构师'],
        tags: ['代码清理', '结构优化', '依赖管理'],
        examples: [
            {
                code: '/sc:cleanup @src',
                description: '清理源码目录中的冗余代码和未使用文件'
            },
            {
                code: '/sc:cleanup @. --remove unused-imports,dead-code',
                description: '移除未使用的导入和死代码'
            },
            {
                code: '/sc:cleanup @. --restructure --backup',
                description: '重构项目结构并创建备份'
            }
        ]
    },

    // 管理类命令
    {
        id: 'document',
        name: '/sc:document',
        title: '文档生成专家',
        category: 'management',
        icon: 'fas fa-file-alt',
        complexity: 2,
        description: '智能文档生成、API文档、使用说明、技术规范',
        personas: ['文档专家', '导师'],
        tags: ['文档生成', 'API文档', '技术写作'],
        examples: [
            {
                code: '/sc:document @src/api.js',
                description: '为API文件生成详细的接口文档'
            },
            {
                code: '/sc:document @src --type api --format markdown',
                description: '生成Markdown格式的API文档'
            },
            {
                code: '/sc:document @. --type full --interactive',
                description: '生成完整的交互式项目文档'
            }
        ]
    },
    {
        id: 'git',
        name: '/sc:git',
        title: 'Git工作流助手',
        category: 'management',
        icon: 'fab fa-git-alt',
        complexity: 2,
        description: '智能Git操作、版本控制、分支管理、提交优化',
        personas: ['DevOps专家', '版本控制专家'],
        tags: ['版本控制', '分支管理', '提交优化'],
        examples: [
            {
                code: '/sc:git status',
                description: '查看Git状态并提供操作建议'
            },
            {
                code: '/sc:git commit --smart-message',
                description: '根据代码变更自动生成提交信息'
            },
            {
                code: '/sc:git workflow --type gitflow --setup',
                description: '设置GitFlow工作流程'
            }
        ]
    },
    {
        id: 'estimate',
        name: '/sc:estimate',
        title: '项目估算专家',
        category: 'management',
        icon: 'fas fa-calculator',
        complexity: 3,
        description: '基于证据的工作量估算、时间规划、资源分配',
        personas: ['分析师', '项目经理', '架构师'],
        tags: ['工作量估算', '时间规划', '项目管理'],
        examples: [
            {
                code: '/sc:estimate 添加用户认证功能',
                description: '估算用户认证功能的开发时间和复杂度'
            },
            {
                code: '/sc:estimate @requirements.md --team-size 3',
                description: '基于需求文档估算3人团队的开发时间'
            },
            {
                code: '/sc:estimate @project-spec.md --method story-points',
                description: '使用故事点方法进行项目估算'
            }
        ]
    },
    {
        id: 'task',
        name: '/sc:task',
        title: '任务管理专家',
        category: 'management',
        icon: 'fas fa-tasks',
        complexity: 3,
        description: '项目管理、任务分解、进度跟踪、团队协作',
        personas: ['项目经理', '架构师'],
        tags: ['项目管理', '任务分解', '进度跟踪'],
        examples: [
            {
                code: '/sc:task create "实现用户登录"',
                description: '创建用户登录功能的开发任务'
            },
            {
                code: '/sc:task breakdown @project-plan.md --priority high',
                description: '将项目计划分解为高优先级任务'
            },
            {
                code: '/sc:task manage @. --track-progress',
                description: '管理项目任务并跟踪进度'
            }
        ]
    },

    // 元命令
    {
        id: 'index',
        name: '/sc:index',
        title: '命令索引专家',
        category: 'management',
        icon: 'fas fa-list',
        complexity: 1,
        description: '浏览所有命令、查找功能、获取帮助信息',
        personas: ['导师', '助手'],
        tags: ['命令索引', '帮助系统', '功能查找'],
        examples: [
            {
                code: '/sc:index',
                description: '显示所有可用命令的完整列表'
            },
            {
                code: '/sc:index --category development',
                description: '显示开发类命令的详细信息'
            },
            {
                code: '/sc:index --search "代码质量"',
                description: '搜索与代码质量相关的命令'
            }
        ]
    },
    {
        id: 'load',
        name: '/sc:load',
        title: '项目上下文加载专家',
        category: 'management',
        icon: 'fas fa-download',
        complexity: 2,
        description: '智能加载项目信息、建立上下文、理解项目结构',
        personas: ['分析师', '架构师'],
        tags: ['上下文加载', '项目分析', '结构理解'],
        examples: [
            {
                code: '/sc:load @.',
                description: '加载当前项目的完整上下文信息'
            },
            {
                code: '/sc:load @src --include dependencies,structure',
                description: '加载源码目录，包含依赖和结构信息'
            },
            {
                code: '/sc:load @. --deep-analysis --cache',
                description: '深度分析项目并缓存结果'
            }
        ]
    },
    {
        id: 'spawn',
        name: '/sc:spawn',
        title: '任务编排专家',
        category: 'management',
        icon: 'fas fa-sitemap',
        complexity: 5,
        description: '复杂任务编排、工作流自动化、多命令协调执行',
        personas: ['架构师', 'DevOps专家', '编排专家'],
        tags: ['任务编排', '工作流', '自动化'],
        examples: [
            {
                code: '/sc:spawn development-workflow',
                description: '启动标准开发工作流程'
            },
            {
                code: '/sc:spawn ci-cd-pipeline --platform github-actions',
                description: '创建GitHub Actions CI/CD流水线'
            },
            {
                code: '/sc:spawn full-project-setup --from-scratch',
                description: '从零开始的完整项目设置流程'
            }
        ]
    }
];

// 智能人格数据
const personasData = [
    {
        id: 'architect',
        name: '架构师',
        icon: 'fas fa-building',
        color: '#6366f1',
        role: '系统设计与架构规划专家',
        description: '专注于系统整体设计、技术选型、架构规划，从全局角度思考问题，确保系统的可扩展性和维护性。',
        skills: ['系统设计', '技术选型', '架构规划', '可扩展性', '性能优化'],
        triggers: [
            '使用 /sc:design 命令时',
            '涉及系统架构问题时',
            '需要技术选型建议时',
            '复杂项目规划时'
        ],
        style: '从全局角度分析问题，考虑长远发展，提供多种方案对比'
    },
    {
        id: 'frontend',
        name: '前端专家',
        icon: 'fas fa-palette',
        color: '#10b981',
        role: '用户界面与体验设计专家',
        description: '专精于前端技术、用户界面设计、用户体验优化，关注可访问性和响应式设计。',
        skills: ['React/Vue', 'CSS/SCSS', '响应式设计', '用户体验', '可访问性'],
        triggers: [
            '涉及UI/UX设计时',
            '前端代码分析时',
            '用户交互问题时',
            '界面优化需求时'
        ],
        style: '关注用户体验，考虑响应式设计，注重可访问性和性能'
    },
    {
        id: 'backend',
        name: '后端专家',
        icon: 'fas fa-server',
        color: '#f59e0b',
        role: '服务器端开发与数据处理专家',
        description: '专注于服务器开发、数据库设计、API开发，确保系统的稳定性和安全性。',
        skills: ['Node.js/Python', '数据库设计', 'API开发', '微服务', '系统集成'],
        triggers: [
            '服务器端代码时',
            '数据库设计时',
            'API开发时',
            '后端性能优化时'
        ],
        style: '关注性能和安全，考虑数据一致性，注重可扩展性'
    },
    {
        id: 'analyzer',
        name: '分析师',
        icon: 'fas fa-chart-line',
        color: '#8b5cf6',
        role: '问题诊断与数据分析专家',
        description: '擅长深入分析问题根因、代码质量评估、性能瓶颈识别，提供数据驱动的解决方案。',
        skills: ['问题诊断', '数据分析', '性能分析', '代码审查', '质量评估'],
        triggers: [
            '使用 /sc:analyze 命令时',
            '问题排查时',
            '性能分析时',
            '代码审查时'
        ],
        style: '深入分析问题根因，提供数据支持，给出具体改进建议'
    },
    {
        id: 'security',
        name: '安全专家',
        icon: 'fas fa-shield-alt',
        color: '#ef4444',
        role: '网络安全与防护专家',
        description: '专注于安全漏洞识别、防护措施设计、安全最佳实践，确保系统安全可靠。',
        skills: ['安全审计', '漏洞扫描', '防护设计', '加密技术', '安全合规'],
        triggers: [
            '安全相关问题时',
            '代码安全审查时',
            '防护措施设计时',
            '合规性检查时'
        ],
        style: '识别安全风险，提供防护方案，遵循安全最佳实践'
    },
    {
        id: 'scribe',
        name: '文档专家',
        icon: 'fas fa-pen-fancy',
        color: '#06b6d4',
        role: '技术写作与知识管理专家',
        description: '专精于技术文档编写、知识整理、信息架构，让复杂技术变得易于理解。',
        skills: ['技术写作', '文档架构', '知识管理', '信息设计', '内容策略'],
        triggers: [
            '使用 /sc:document 命令时',
            '需要文档说明时',
            '知识整理时',
            '技术写作时'
        ],
        style: '结构化组织信息，使用清晰的语言，提供完整的说明'
    },
    {
        id: 'qa',
        name: 'QA专家',
        icon: 'fas fa-bug',
        color: '#84cc16',
        role: '质量保证与测试专家',
        description: '专注于软件质量保证、测试策略设计、缺陷管理，确保产品质量。',
        skills: ['测试设计', '自动化测试', '质量保证', '缺陷管理', '测试策略'],
        triggers: [
            '使用 /sc:test 命令时',
            '质量问题时',
            '测试策略设计时',
            '缺陷分析时'
        ],
        style: '系统性测试思维，关注边界条件，确保质量标准'
    },
    {
        id: 'devops',
        name: 'DevOps专家',
        icon: 'fas fa-infinity',
        color: '#f97316',
        role: '开发运维与自动化专家',
        description: '专注于CI/CD流程、基础设施自动化、监控运维，实现开发运维一体化。',
        skills: ['CI/CD', '容器化', '基础设施', '监控运维', '自动化部署'],
        triggers: [
            '部署相关问题时',
            'CI/CD流程设计时',
            '运维自动化时',
            '基础设施管理时'
        ],
        style: '注重自动化和效率，考虑运维便利性，确保系统稳定'
    }
];

// Wave系统数据
const waveSystemData = {
    title: 'Wave深度处理系统',
    description: '当任务复杂度达到一定阈值时，SuperClaude会自动启动Wave模式，分多个阶段深度处理任务',
    triggerConditions: [
        '复杂度评分 ≥ 0.7',
        '涉及文件数量 > 20个',
        '操作类型 > 2种',
        '需要多个专家协作'
    ],
    stages: [
        {
            number: 1,
            title: '需求分析与规划',
            description: '深入理解需求，分析技术可行性，制定详细的实施计划',
            tasks: ['需求澄清', '技术调研', '方案设计', '风险评估']
        },
        {
            number: 2,
            title: '详细设计与架构',
            description: '设计系统架构，定义接口规范，确定技术选型和实现方案',
            tasks: ['架构设计', '接口定义', '数据建模', '技术选型']
        },
        {
            number: 3,
            title: '核心实现与开发',
            description: '按照设计方案实现核心功能，编写高质量的代码',
            tasks: ['核心开发', '模块实现', '接口开发', '数据处理']
        },
        {
            number: 4,
            title: '测试与质量保证',
            description: '全面测试功能，确保代码质量，修复发现的问题',
            tasks: ['单元测试', '集成测试', '性能测试', '安全测试']
        },
        {
            number: 5,
            title: '优化与部署准备',
            description: '性能优化，文档完善，部署配置，确保生产就绪',
            tasks: ['性能优化', '文档编写', '部署配置', '监控设置']
        }
    ]
};

// 快速入门数据
const quickstartData = {
    title: '快速入门向导',
    description: '跟随这些步骤，快速掌握SuperClaude Framework的使用',
    steps: [
        {
            number: 1,
            title: '验证安装',
            description: '确认SuperClaude Framework已正确安装并可以使用',
            code: '/sc:index',
            expected: '显示所有可用命令列表，确认安装成功'
        },
        {
            number: 2,
            title: '加载项目上下文',
            description: '让SuperClaude了解你的项目结构和代码',
            code: '/sc:load @.',
            expected: 'SuperClaude分析项目结构，建立上下文理解'
        },
        {
            number: 3,
            title: '项目健康检查',
            description: '分析项目当前状态，识别潜在问题',
            code: '/sc:analyze @. --health-check',
            expected: '获得项目健康度报告和改进建议'
        },
        {
            number: 4,
            title: '尝试功能实现',
            description: '使用SuperClaude实现一个简单功能',
            code: '/sc:implement 添加Hello World页面',
            expected: 'SuperClaude生成完整的页面代码和相关文件'
        },
        {
            number: 5,
            title: '生成测试代码',
            description: '为新实现的功能生成测试用例',
            code: '/sc:test @新增文件 --type unit',
            expected: '自动生成单元测试代码，确保功能正确性'
        },
        {
            number: 6,
            title: '生成文档',
            description: '为项目生成或更新文档',
            code: '/sc:document @. --type overview',
            expected: '生成项目概述文档，包含功能说明和使用指南'
        }
    ]
};

// MCP服务器数据
const mcpServersData = [
    {
        name: 'Context7',
        icon: 'fas fa-book',
        description: '官方文档查询专家，提供准确的库文档和API参考',
        capabilities: ['文档查询', 'API参考', '示例代码', '最佳实践']
    },
    {
        name: 'Sequential',
        icon: 'fas fa-brain',
        description: '复杂逻辑思维专家，处理多步骤推理和复杂问题',
        capabilities: ['逻辑推理', '多步骤分析', '复杂问题分解', '决策支持']
    },
    {
        name: 'Magic',
        icon: 'fas fa-magic',
        description: '现代UI组件生成专家，快速创建美观的界面组件',
        capabilities: ['UI组件生成', '样式设计', '响应式布局', '交互效果']
    },
    {
        name: 'Playwright',
        icon: 'fas fa-robot',
        description: '浏览器自动化测试专家，提供端到端测试解决方案',
        capabilities: ['E2E测试', '浏览器自动化', '性能测试', '截图对比']
    }
];
