const DataHandler = require('./dataHandler');

class UserUtils {
    // 获取用户会员状态
    static getUserMembershipStatus(user) {
        if (!user || !user.membership) {
            return { type: 'free', status: 'active', isValid: true };
        }
        
        const membership = user.membership;
        const now = new Date();
        
        // 检查会员是否过期
        if (membership.endDate && new Date(membership.endDate) < now) {
            return {
                type: membership.type,
                status: 'expired',
                isValid: false,
                endDate: membership.endDate
            };
        }
        
        return {
            type: membership.type,
            status: membership.status,
            isValid: membership.status === 'active',
            endDate: membership.endDate
        };
    }

    // 检查用户是否有访问特定内容的权限
    static checkContentAccess(userMembership, contentAccessLevel) {
        if (!contentAccessLevel || contentAccessLevel === 'free') {
            return true;
        }
        
        if (!userMembership || !userMembership.isValid) {
            return false;
        }
        
        const membershipHierarchy = {
            'free': 0,
            'premium': 1,
            'vip': 2
        };
        
        const userLevel = membershipHierarchy[userMembership.type] || 0;
        const requiredLevel = membershipHierarchy[contentAccessLevel] || 0;
        
        return userLevel >= requiredLevel;
    }

    // 更新用户在线状态
    static updateOnlineStatus(users) {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        users.forEach(user => {
            if (user.lastActivity) {
                const lastActivity = new Date(user.lastActivity);
                user.isOnline = lastActivity > fiveMinutesAgo;
            } else {
                user.isOnline = false;
            }
        });
        
        return users;
    }

    // 生成新用户ID
    static generateNewUserId(users) {
        return Math.max(...users.map(u => u.id), 0) + 1;
    }

    // 创建用户基本信息结构
    static createUserData(id, username, email, hashedPassword) {
        return {
            id,
            username,
            email,
            password: hashedPassword,
            avatar: 'default.png',
            registerTime: new Date().toISOString(),
            lastLogin: null,
            lastActivity: new Date().toISOString(),
            isOnline: false,
            favorites: [],
            likes: [],
            profile: {
                bio: '这个人很懒，什么都没写',
                location: '',
                website: ''
            },
            membership: {
                type: 'free',
                status: 'active',
                startDate: new Date().toISOString(),
                endDate: null,
                autoRenew: false,
                paymentHistory: []
            }
        };
    }

    // 清理用户敏感信息
    static sanitizeUser(user) {
        const { password, ...userInfo } = user;
        return userInfo;
    }

    // 创建会话信息
    static createSession(userId, token, req) {
        return {
            id: Date.now(),
            userId,
            token,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.ip || req.connection.remoteAddress
        };
    }

    // 清理过期会话
    static cleanupSessions(sessions, maxSessions = 50) {
        return sessions.length > maxSessions ? sessions.slice(-maxSessions) : sessions;
    }
}

module.exports = UserUtils;