// 点赞收藏功能测试脚本
console.log('开始测试点赞收藏功能...');

// 测试点赞API
async function testLikeAPI() {
    console.log('\n=== 测试点赞API ===');
    
    // 模拟用户登录 (需要真实token)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoibW9tbzAxIiwiZW1haWwiOiIxMzU3NDk5MTI4QHFxLmNvbSIsImlhdCI6MTc1NDQ3MDA3MywiZXhwIjoxNzU0NTU2NDczfQ.rDNE5aN40uS7dh8tE6NywchNcLOIctbAobCSojxW86A';
    
    try {
        // 测试点赞
        console.log('1. 测试点赞小说ID为1的作品...');
        const likeResponse = await fetch('http://localhost:3000/api/novels/1/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const likeResult = await likeResponse.json();
        console.log('点赞结果:', likeResult);
        
        // 测试获取互动状态
        console.log('2. 测试获取互动状态...');
        const statusResponse = await fetch('http://localhost:3000/api/novels/1/interaction', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const statusResult = await statusResponse.json();
        console.log('互动状态:', statusResult);
        
        // 测试取消点赞
        console.log('3. 测试取消点赞...');
        const unlikeResponse = await fetch('http://localhost:3000/api/novels/1/like', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const unlikeResult = await unlikeResponse.json();
        console.log('取消点赞结果:', unlikeResult);
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 测试收藏API
async function testFavoriteAPI() {
    console.log('\n=== 测试收藏API ===');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoibW9tbzAxIiwiZW1haWwiOiIxMzU3NDk5MTI4QHFxLmNvbSIsImlhdCI6MTc1NDQ3MDA3MywiZXhwIjoxNzU0NTU2NDczfQ.rDNE5aN40uS7dh8tE6NywchNcLOIctbAobCSojxW86A';
    
    try {
        // 测试收藏
        console.log('1. 测试收藏小说ID为1的作品...');
        const favoriteResponse = await fetch('http://localhost:3000/api/novels/1/favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const favoriteResult = await favoriteResponse.json();
        console.log('收藏结果:', favoriteResult);
        
        // 测试取消收藏
        console.log('2. 测试取消收藏...');
        const unfavoriteResponse = await fetch('http://localhost:3000/api/novels/1/favorite', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const unfavoriteResult = await unfavoriteResponse.json();
        console.log('取消收藏结果:', unfavoriteResult);
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 测试获取小说列表的用户状态
async function testNovelListWithUserState() {
    console.log('\n=== 测试小说列表用户状态 ===');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoibW9tbzAxIiwiZW1haWwiOiIxMzU3NDk5MTI4QHFxLmNvbSIsImlhdCI6MTc1NDQ3MDA3MywiZXhwIjoxNzU0NTU2NDczfQ.rDNE5aN40uS7dh8tE6NywchNcLOIctbAobCSojxW86A';
    
    try {
        console.log('测试获取小说列表（带用户状态）...');
        const response = await fetch('http://localhost:3000/api/novels?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        console.log('小说列表（前5个）:', result.novels?.slice(0, 2).map(novel => ({
            id: novel.id,
            title: novel.title,
            likes: novel.likes,
            favorites: novel.favorites,
            userHasLiked: novel.userHasLiked,
            userHasFavorited: novel.userHasFavorited
        })));
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 运行测试
async function runTests() {
    await testLikeAPI();
    await testFavoriteAPI();
    await testNovelListWithUserState();
    console.log('\n=== 测试完成 ===');
}

runTests();