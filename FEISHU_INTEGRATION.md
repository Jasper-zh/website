# 使用飞书表格动态更新产品内容

## 方案概述

飞书表格提供了 API，但需要认证且存在跨域问题。这里提供两种实用方案。

## 方案1: 使用 GitHub Actions 自动同步（推荐）

### 优点
- ✅ 完全免费
- ✅ 无需服务器
- ✅ 自动同步，更新飞书表格后自动更新网站
- ✅ 数据安全，API 密钥存储在 GitHub Secrets 中

### 实现步骤

#### 1. 在飞书开放平台创建应用

1. 访问 https://open.feishu.cn/
2. 创建企业自建应用
3. 获取 `App ID` 和 `App Secret`
4. 在权限管理中开启：
   - 与飞书表格（Sheets）相关的读取权限（如 `sheets:sheet`）

#### 2. 获取表格信息

1. 在飞书中创建表格（Spreadsheet）
2. 记录表格的 `sheet_token`（URL 中 `shtcn...` 或 `Ov0rsznx...`）
3. 记录工作表的 `sheet_id`（可通过 `sheets/query` API 获取，如 `0b2b15`）
4. 确定需要读取的 `range`（例如 `!A1:D200`）

#### 3. 配置 GitHub Secrets

在 GitHub 仓库设置中添加：
- `FEISHU_APP_ID` - 应用 ID
- `FEISHU_APP_SECRET` - 应用密钥
- `FEISHU_SHEET_TOKEN` - 表格 token
- `FEISHU_SHEET_ID` - 工作表 ID
- `FEISHU_RANGE` - 读取范围（可选）

#### 4. 创建同步脚本

创建 `.github/workflows/sync-feishu.yml`：

```yaml
name: Sync Feishu Products

on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时同步一次
  workflow_dispatch:  # 手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Sync from Feishu
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_SHEET_TOKEN: ${{ secrets.FEISHU_SHEET_TOKEN }}
          FEISHU_SHEET_ID: ${{ secrets.FEISHU_SHEET_ID }}
          FEISHU_RANGE: ${{ secrets.FEISHU_RANGE }}
        run: |
          node scripts/sync-feishu.js
```

## 方案2: 使用简单的 Serverless 代理（更灵活）

### 使用 Vercel/Netlify Functions 作为代理

创建一个 serverless 函数来代理飞书 API 请求。

#### 1. 创建 API 路由

**Vercel 方式** (`api/feishu-products.js`):
```javascript
export default async function handler(req, res) {
  // 获取飞书访问令牌
  const token = await getFeishuToken();
  
  // 调用飞书 API 获取表格数据
  const data = await fetchFeishuData(token);
  
  res.json(data);
}
```

**Netlify 方式** (`netlify/functions/feishu-products.js`):
```javascript
exports.handler = async (event, context) => {
  const token = await getFeishuToken();
  const data = await fetchFeishuData(token);
  
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
```

#### 2. 在前端调用

```javascript
fetch('/api/feishu-products')
  .then(res => res.json())
  .then(data => renderProducts(data));
```

## 方案3: 使用飞书 Webhook（最简单但有限制）

如果飞书支持 Webhook，可以在表格更新时触发 GitHub Actions。

## 快速开始 - 推荐方案1

我已经为你准备了一个完整的实现方案。你需要：

1. **在飞书创建表格**
   - 表格结构建议：
     - 分类名称
     - 产品名称
     - 产品图片
     - 规格信息（JSON 格式或分列）

2. **获取 API 凭证**
   - App ID
   - App Secret
   - 表格 Token
   - Sheet ID

3. **配置 GitHub Secrets**
   - 在仓库 Settings > Secrets 中添加上述凭证

4. **使用我提供的同步脚本**

需要我帮你创建具体的同步脚本吗？

