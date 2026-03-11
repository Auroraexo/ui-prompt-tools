# ✅ 配置已就绪，可以直接使用！

## 🎉 数据库凭据已配置

已为你创建好 `.env` 文件，包含以下配置：

```env
# PostgreSQL 远程数据库配置
POSTGRES_HOST=107.173.156.235
POSTGRES_PORT=5432
POSTGRES_DB=ui_tools
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## 🚀 快速启动（只需 3 步）

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 测试数据库连接
```bash
npm run db:test
```

**预期输出：**
```
🔗 正在测试远程数据库连接...
✅ 连接成功！
📊 PostgreSQL 版本: PostgreSQL 15.x ...
✅ 数据库 "ui_tools" 已存在
✅ 测试完成！数据库连接正常。
```

### 3️⃣ 初始化数据库 & 启动服务
```bash
# 如果提示需要初始化表
npm run db:init

# 一键启动前后端
npm run dev:all
```

访问：**http://localhost:5176**

---

## ⚠️ 重要提醒

### 1. 填写豆包 API Key

编辑 `.env` 文件，填入你的豆包 API Key：

```env
ARK_API_KEY=你的实际API密钥
```

**没有 API Key？** 你仍然可以使用配置管理功能（保存/加载配置），只是无法使用 AI 视觉功能。

### 2. 安全建议（生产环境）

当前使用的是默认密码 `postgres`，**强烈建议在生产环境中修改密码**：

#### 在服务器上修改密码：
```bash
# SSH 登录服务器
ssh user@107.173.156.235

# 修改密码
docker exec -it <container_name> psql -U postgres

# 在 psql 中执行
ALTER USER postgres WITH PASSWORD '你的强密码';
\q
```

#### 然后更新本地 .env：
```env
POSTGRES_PASSWORD=你的强密码
```

---

## 🎯 立即测试功能

### 测试配置管理

1. **调整左侧 UI 参数**
   - 修改圆角大小
   - 改变配色方案
   - 调整阴影效果

2. **保存配置**
   - 点击右侧 **"💾 保存当前配置"**
   - 输入名称："测试配置 1"
   - 点击"确认保存"

3. **修改并保存另一个配置**
   - 再次调整参数
   - 保存为："测试配置 2"

4. **加载配置**
   - 在配置列表中点击 **"加载"**
   - 左侧配置会自动切换

5. **验证数据持久化**
   - 刷新页面
   - 配置列表仍然存在（数据在数据库中）
   - `localStorage` 中的配置会在首次加载时自动清空

---

## 🧪 测试视觉反向工程（需要 API Key）

1. **上传 UI 截图**
   - 在 AI 图像理解卡片中上传图片
   
2. **提取参数**
   - 点击 **"✨ 提取参数"**
   - 等待 AI 分析

3. **应用到配置**
   - 点击 **"一键应用到左侧配置"**
   - 左侧配置自动更新

4. **保存到数据库**
   - 点击 **"💾 保存当前配置"**
   - 输入名称："AI 提取的配置"

---

## 📊 数据库状态查看

### 查看配置列表
```bash
# 在服务器上执行
docker exec -it <container_name> psql -U postgres -d ui_tools

# 在 psql 中执行
SELECT id, preset_name, created_at FROM ui_presets;
\q
```

### 查看配置详情
```bash
# 查看某个配置的完整数据（包括 JSONB）
docker exec -it <container_name> psql -U postgres -d ui_tools -c "SELECT * FROM ui_presets WHERE id = 1;"
```

---

## 🎨 功能清单

### ✅ 已可用功能
- [x] 7 维度 UI 参数管理
- [x] 实时 Prompt 生成
- [x] 配置保存到数据库
- [x] 配置加载/切换
- [x] 配置删除
- [x] 多设备同步（共享数据库）
- [x] 团队协作（所有人看到相同配置）

### 🔑 需要 API Key 的功能
- [ ] AI 图像理解（图片描述）
- [ ] 视觉反向工程（参数提取）

---

## 📚 完整文档

- [远程数据库连接指南](docs/远程数据库连接指南.md)
- [数据库配置指南](docs/数据库配置指南.md)
- [使用说明](docs/使用说明.md)
- [服务器配置](SERVER_SETUP.md)
- [实现总结](IMPLEMENTATION_COMPLETE.md)

---

## ❓ 遇到问题？

### 连接失败
```bash
# 测试连接
npm run db:test

# 查看详细错误信息
```

### 表不存在
```bash
# 初始化数据库表
npm run db:init
```

### 端口被占用
```bash
# 修改 .env 中的端口
AI_SERVER_PORT=5181
```

### 其他问题
查看详细文档：[远程数据库连接指南](docs/远程数据库连接指南.md)

---

## 🎊 开始使用

```bash
npm install
npm run db:test
npm run db:init
npm run dev:all
```

**然后访问：http://localhost:5176**

祝使用愉快！🚀
