# Vercel入口文件
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# 导出app供Vercel使用
# Vercel会自动处理ASGI应用