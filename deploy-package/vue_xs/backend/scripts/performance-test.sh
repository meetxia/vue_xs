#!/bin/bash

# API性能测试脚本
# Week 2 Day 8

echo "======================================"
echo "API性能测试"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  
  echo -n "测试 $name ... "
  
  # 执行3次取平均值
  local total_time=0
  for i in {1..3}; do
    time=$(curl -o /dev/null -s -w '%{time_total}\n' -X $method "$BASE_URL$url")
    total_time=$(echo "$total_time + $time" | bc)
  done
  
  avg_time=$(echo "scale=3; $total_time / 3" | bc)
  avg_time_ms=$(echo "$avg_time * 1000" | bc)
  
  # 判断性能
  if (( $(echo "$avg_time_ms < 100" | bc -l) )); then
    echo -e "${GREEN}${avg_time_ms}ms ✓${NC} (优秀)"
  elif (( $(echo "$avg_time_ms < 200" | bc -l) )); then
    echo -e "${YELLOW}${avg_time_ms}ms ✓${NC} (良好)"
  else
    echo -e "${RED}${avg_time_ms}ms ✗${NC} (需优化)"
  fi
}

echo "开始测试..."
echo ""

# 测试各个API
test_api "健康检查" "/health"
test_api "小说列表" "/api/novels?page=1&pageSize=20"
test_api "小说详情" "/api/novels/1"
test_api "搜索功能" "/api/search?keyword=测试"
test_api "热门推荐" "/api/recommendations/hot?limit=20"
test_api "搜索建议" "/api/search/suggestions?keyword=测试"
test_api "热门搜索" "/api/search/hot"

echo ""
echo "======================================"
echo "测试完成"
echo "======================================"

