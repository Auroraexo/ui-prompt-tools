# 📡 服务器端配置指南

## 服务器信息
- **IP 地址**: `107.173.156.235`
- **数据库**: PostgreSQL (Docker)

## 🚀 服务器端快速配置

SSH 登录服务器后，按以下步骤操作：

### 1. 检查 PostgreSQL 容器状态

```bash
# 查看所有运行中的容器
docker ps

# 查找 PostgreSQL 容器
docker ps | grep postgres
```

**如果容器正在运行，记下容器名称或 ID**（例如：`postgres-ui-tools` 或 `abc123def456`）

### 2. 如果容器未运行，启动容器

```bash
# 如果已有容器但未运行
docker start <container_name_or_id>

# 如果没有容器，创建新容器
docker run -d \
  --name postgres-ui-tools \
  -e POSTGRES_PASSWORD=你的密码 \
  -p 5432:5432 \
  -v ui_tools_data:/var/lib/postgresql/data \
  postgres:15
```

### 3. 配置 PostgreSQL 允许远程连接

```bash
# 进入容器
docker exec -it <container_name> bash

# 编辑配置文件
cd /var/lib/postgresql/data

# 方式 1：使用 sed 命令（推荐）
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" postgresql.conf

# 方式 2：手动编辑
apt-get update && apt-get install -y nano
nano postgresql.conf
# 找到 listen_addresses 改为：listen_addresses = '*'

# 添加远程访问规则
echo "host    all             all             0.0.0.0/0               md5" >> pg_hba.conf

# 退出容器
exit

# 重启容器使配置生效
docker restart <container_name>
```

### 4. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 5432/tcp
sudo ufw reload
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --add-port=5432/tcp --permanent
sudo firewall-cmd --reload
```

### 5. 创建数据库

```bash
# 方式 1：直接执行命令
docker exec -it <container_name> psql -U postgres -c "CREATE DATABASE ui_tools;"

# 方式 2：进入 psql 交互式界面
docker exec -it <container_name> psql -U postgres
CREATE DATABASE ui_tools;
\q
```

### 6. 验证配置

```bash
# 测试端口是否开放
netstat -tuln | grep 5432

# 预期输出：
# tcp        0      0 0.0.0.0:5432            0.0.0.0:*               LISTEN
```

## 🔒 安全配置（推荐）

### 1. 修改默认密码

```bash
docker exec -it <container_name> psql -U postgres

ALTER USER postgres WITH PASSWORD '强密码';
\q
```

### 2. 创建专用用户

```bash
docker exec -it <container_name> psql -U postgres

CREATE USER ui_tools_user WITH PASSWORD '强密码';
CREATE DATABASE ui_tools OWNER ui_tools_user;
GRANT ALL PRIVILEGES ON DATABASE ui_tools TO ui_tools_user;
\q
```

### 3. 限制访问来源（可选）

如果你只想允许特定 IP 访问：

```bash
docker exec -it <container_name> bash

# 编辑 pg_hba.conf
cd /var/lib/postgresql/data
nano pg_hba.conf

# 将这一行：
# host    all             all             0.0.0.0/0               md5
# 改为：
host    all             all             你的IP/32               md5

exit
docker restart <container_name>
```

## ✅ 一键脚本（推荐）

将以下脚本保存为 `setup-postgres.sh`，然后运行：

```bash
#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PostgreSQL Docker 配置脚本 ===${NC}\n"

# 检查容器
CONTAINER_NAME=$(docker ps -a --filter "ancestor=postgres" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
    echo -e "${YELLOW}未找到 PostgreSQL 容器，正在创建...${NC}"
    
    read -p "请输入 PostgreSQL 密码: " POSTGRES_PASSWORD
    
    docker run -d \
      --name postgres-ui-tools \
      -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
      -p 5432:5432 \
      -v ui_tools_data:/var/lib/postgresql/data \
      postgres:15
    
    CONTAINER_NAME="postgres-ui-tools"
    echo -e "${GREEN}✅ 容器创建成功${NC}"
    sleep 5
else
    echo -e "${GREEN}找到容器: $CONTAINER_NAME${NC}"
    
    # 启动容器（如果未运行）
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        echo -e "${GREEN}✅ 容器正在运行${NC}"
    else
        echo -e "${YELLOW}正在启动容器...${NC}"
        docker start $CONTAINER_NAME
        sleep 3
    fi
fi

# 配置远程访问
echo -e "\n${YELLOW}正在配置远程访问...${NC}"

docker exec $CONTAINER_NAME bash -c "
    cd /var/lib/postgresql/data
    sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '*'/\" postgresql.conf
    echo 'host    all             all             0.0.0.0/0               md5' >> pg_hba.conf
"

# 重启容器
echo -e "${YELLOW}正在重启容器...${NC}"
docker restart $CONTAINER_NAME
sleep 3

# 创建数据库
echo -e "\n${YELLOW}正在创建数据库 ui_tools...${NC}"
docker exec $CONTAINER_NAME psql -U postgres -c "CREATE DATABASE ui_tools;" 2>/dev/null || echo "数据库可能已存在"

# 配置防火墙
echo -e "\n${YELLOW}正在配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 5432/tcp
    sudo ufw reload
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --add-port=5432/tcp --permanent
    sudo firewall-cmd --reload
fi

echo -e "\n${GREEN}=== 配置完成！===${NC}"
echo -e "${GREEN}✅ 容器名称: $CONTAINER_NAME${NC}"
echo -e "${GREEN}✅ 端口: 5432${NC}"
echo -e "${GREEN}✅ 数据库: ui_tools${NC}\n"

echo -e "${YELLOW}请在客户端的 .env 文件中配置：${NC}"
echo "POSTGRES_HOST=107.173.156.235"
echo "POSTGRES_PORT=5432"
echo "POSTGRES_DB=ui_tools"
echo "POSTGRES_USER=postgres"
echo "POSTGRES_PASSWORD=你的密码"
```

运行脚本：

```bash
chmod +x setup-postgres.sh
./setup-postgres.sh
```

## 📊 维护命令

```bash
# 查看容器日志
docker logs <container_name>

# 实时查看日志
docker logs -f <container_name>

# 进入容器
docker exec -it <container_name> bash

# 连接 PostgreSQL
docker exec -it <container_name> psql -U postgres

# 查看数据库列表
docker exec -it <container_name> psql -U postgres -c "\l"

# 备份数据库
docker exec -t <container_name> pg_dump -U postgres ui_tools > backup.sql

# 恢复数据库
docker exec -i <container_name> psql -U postgres ui_tools < backup.sql

# 停止容器
docker stop <container_name>

# 启动容器
docker start <container_name>

# 重启容器
docker restart <container_name>
```

## ❓ 常见问题

### Q: 端口被占用

```bash
# 查看占用 5432 端口的进程
sudo lsof -i :5432

# 或使用 netstat
sudo netstat -tuln | grep 5432
```

### Q: 容器无法启动

```bash
# 查看容器日志
docker logs <container_name>

# 删除容器重新创建
docker rm -f <container_name>
# 然后重新运行创建命令
```

### Q: 忘记密码

```bash
# 删除容器和数据卷，重新创建
docker stop <container_name>
docker rm <container_name>
docker volume rm ui_tools_data

# 重新创建（会提示输入新密码）
./setup-postgres.sh
```

## 📚 下一步

服务器配置完成后，回到客户端：

1. 配置 `.env` 文件
2. 运行 `npm run db:test` 测试连接
3. 运行 `npm run db:init` 初始化表
4. 运行 `npm run dev:all` 启动服务

详见：[远程数据库连接指南](docs/远程数据库连接指南.md)
