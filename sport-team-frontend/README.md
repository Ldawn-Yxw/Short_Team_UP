# 🏃‍♀️ 运动组队系统 - Vue 前端

这是一个基于 Vue 3 + TypeScript + Vite 构建的现代化运动组队系统前端。

## ✨ 功能特性

- 🔐 用户注册和登录
- 🏠 主页浏览所有组队活动
- ➕ 创建新的运动组队
- 👥 我的组队管理（创建的/参与的）
- 🔍 活动搜索和筛选
- 📱 响应式设计，支持移动端

## 🛠 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: CSS3 + Flexbox + Grid
- **图标**: Font Awesome 6

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发环境运行

```bash
npm run dev
```

项目将在 `http://localhost:5173` 启动

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 📂 项目结构

```
src/
├── api/                 # API 接口
│   └── index.ts        # API 服务类
├── stores/             # Pinia 状态管理
│   ├── auth.ts         # 认证状态
│   └── teams.ts        # 组队状态
├── views/              # 页面组件
│   ├── LoginView.vue   # 登录页
│   ├── RegisterView.vue # 注册页
│   ├── MainView.vue    # 主页
│   ├── CreateTeamView.vue # 创建组队页
│   └── MyTeamsView.vue # 我的组队页
├── router/             # 路由配置
│   └── index.ts        # 路由定义
├── App.vue             # 根组件
└── main.ts             # 应用入口
```

## 🔗 后端接口

前端需要配合 Django 后端运行，确保后端服务在 `http://localhost:8000` 启动。

主要 API 接口：
- `POST /api/accounts/register/` - 用户注册
- `POST /api/accounts/login/` - 用户登录
- `GET /api/accounts/check-auth/` - 检查认证状态
- `GET /api/teams/` - 获取组队列表
- `POST /api/teams/` - 创建组队
- `POST /api/teams/{id}/join/` - 加入组队

## 🎨 设计特色

- **现代化 UI**: 渐变色彩、卡片设计、微动画效果
- **响应式布局**: 支持桌面端和移动端
- **用户体验**: 加载状态、错误提示、空状态处理
- **可访问性**: 语义化标签、键盘导航支持

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 运行测试
npm run test

# 端到端测试
npm run test:e2e
```

## 📱 页面截图

### 登录页面
- 渐变背景
- 双栏布局
- 表单验证

### 主页面
- 侧边栏导航
- 运动分类筛选
- 组队卡片展示

### 创建组队
- 分步表单
- 时间地点选择
- 实时验证

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## �� 许可证

MIT License
