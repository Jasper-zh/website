# 飞书数据同步脚本

## 快速开始

### 1. 在飞书创建表格

使用飞书普通表格（Spreadsheet），建议字段：
- 分类
- 产品名称
- 图片（图片或文本 URL）
- 原材料
- 尺寸
- 最小订单
- 包装
- 付款方式
- 供应商
- 简介（可选，写在首行作为页面 Intro）

### 2. 获取 API 凭证

1. 访问 https://open.feishu.cn/
2. 创建企业自建应用
3. 获取 `App ID` 和 `App Secret`
4. 开启权限：
   - `sheets` 相关的只读权限（如 `sheets:sheet`）
5. 获取表格信息：
   - `SHEET_TOKEN`: 表格 token，可在分享链接或 API Explorer 中查看（如 `Ov0rsznx...`）
   - `SHEET_ID`: 工作表 ID，可通过 `sheets/query` API 获取（如 `0b2b15`）
   - `RANGE`: 需要抓取的范围（如 `!A1:D200`），可选

### 3. 配置凭证

#### 方式1: 本地测试（使用环境变量）
```bash
export FEISHU_APP_ID="your_app_id"
export FEISHU_APP_SECRET="your_app_secret"
export FEISHU_SHEET_TOKEN="your_sheet_token"
export FEISHU_SHEET_ID="your_sheet_id"
export FEISHU_RANGE="!A1:D200"

node scripts/sync-feishu.js
```

#### 方式2: GitHub Actions（推荐）
在 GitHub 仓库设置中添加 Secrets：
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_SHEET_TOKEN`
- `FEISHU_SHEET_ID`
- `FEISHU_RANGE`（可选）

然后 GitHub Actions 会自动同步。

### 4. 调整数据转换逻辑

根据你的表格字段名称，修改 `scripts/sync-feishu.js` 中的 `convertToHugoFormat` 函数（当前默认表头为：分类、产品名称、图片、原材料、尺寸、最小订单、包装、付款方式、供应商、简介）。

## 注意事项

1. **字段映射**: 脚本中的字段名称需要与你的飞书表格字段名称一致
2. **数据格式**: 确保图片字段是 URL 格式
3. **分类处理**: 脚本会自动按分类分组产品
4. **错误处理**: 如果同步失败，检查 API 凭证和权限设置

## 手动同步

```bash
node scripts/sync-feishu.js
```

## 自动同步

GitHub Actions 会每6小时自动同步一次，你也可以在 Actions 页面手动触发。

