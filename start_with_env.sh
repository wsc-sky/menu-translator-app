#!/bin/bash

# 菜单翻译应用启动脚本 - 使用系统环境变量
# 使用方法: ./start_with_env.sh

echo "🚀 启动菜单翻译应用..."
echo "📋 使用系统环境变量配置"

# 检查是否设置了OpenAI API密钥
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 错误: 未设置 OPENAI_API_KEY 环境变量"
    echo ""
    echo "请先设置环境变量:"
    echo "  export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "或者使用以下命令临时设置并启动:"
    echo "  OPENAI_API_KEY='your-api-key-here' ./start_with_env.sh"
    exit 1
fi

echo "✅ 检测到 OpenAI API 密钥"
echo "🔧 启动 FastAPI 服务器..."

# 启动应用
export OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d'=' -f2) && python3 run.py