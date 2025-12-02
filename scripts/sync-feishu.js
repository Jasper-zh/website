#!/usr/bin/env node

/**
 * 从飞书普通表格同步产品数据
 *
 * 使用方法:
 * 1. 设置环境变量（见 scripts/README.md）
 * 2. 运行: node scripts/sync-feishu.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置 - 先用固定值跑通流程，后面再抽成环境变量
const CONFIG = {
  // 这三个是你应用和表格中固定的值，如需改动只改这里
  APP_ID: process.env.FEISHU_APP_ID || 'cli_a9a799a880b8dbd1',
  APP_SECRET: process.env.FEISHU_APP_SECRET || 'MKItyL05UmQJy4cjuO8jLb3VvZwATjhE',
  SHEET_TOKEN: process.env.FEISHU_SHEET_TOKEN || 'Ov0rsznx3hGsaItk1GIcVm34nnO',

  // 下面两个是脚本内部使用的，可先用默认
  SHEET_INDEX: Number(process.env.FEISHU_SHEET_INDEX || 0), // 第几个 sheet，默认 0
  RANGE: process.env.FEISHU_RANGE || '!A1:D200', // 读取范围，默认 A1 到 D200
};

// 飞书 API 基础 URL
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

/**
 * 获取飞书访问令牌
 */
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: CONFIG.APP_ID,
      app_secret: CONFIG.APP_SECRET,
    });

    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            resolve(result.tenant_access_token);
          } else {
            reject(new Error(`获取 token 失败: ${result.msg}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 获取 sheet_id
 */
async function getSheetId(accessToken) {
  return new Promise((resolve, reject) => {
    const pathName = `/open-apis/sheets/v3/spreadsheets/${CONFIG.SHEET_TOKEN}/sheets/query`;

    const options = {
      hostname: 'open.feishu.cn',
      path: pathName,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0 && Array.isArray(result.data.sheets) && result.data.sheets.length > 0) {
            const index = Math.min(Math.max(CONFIG.SHEET_INDEX, 0), result.data.sheets.length - 1);
            const sheetId = result.data.sheets[index].sheet_id;
            resolve(sheetId);
          } else {
            reject(new Error(`获取 sheet_id 失败: ${result.msg || '无 sheet 数据'}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 获取表格数据（普通飞书表格）
 */
async function getSpreadsheetValues(accessToken, sheetId) {
  return new Promise((resolve, reject) => {
    const range = CONFIG.RANGE.startsWith('!') ? CONFIG.RANGE : `!${CONFIG.RANGE}`;
    const encodedRange = encodeURIComponent(range);
    const pathName = `/open-apis/sheets/v2/spreadsheets/${CONFIG.SHEET_TOKEN}/values/${sheetId}${encodedRange}`;

    const options = {
      hostname: 'open.feishu.cn',
      path: pathName,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            resolve(result.data.valueRange?.values || []);
          } else {
            reject(new Error(`获取数据失败: ${result.msg}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 转换飞书数据为 Hugo 格式
 */
function convertToHugoFormat(values) {
  if (!values || values.length === 0) {
    return { intro: '', categories: [] };
  }

  const headers = values[0];
  const rows = values.slice(1);

  const getValue = (row, key) => {
    const idx = headers.indexOf(key);
    if (idx < 0) return '';
    const cell = row[idx];
    if (cell === undefined || cell === null) return '';
    // 飞书表格的单元格可能是数字等非字符串，这里统一转成字符串再 trim
    return String(cell).trim();
  };

  const products = {
    intro: getValue(rows[0] || [], '简介') || 'Here is showing our frozen squid products, you may find what you need here.',
    categories: [],
  };

  const categoryMap = {};

  rows.forEach((row) => {
    if (!row || row.length === 0) {
      return;
    }

    // 检查关键字段：如果产品名称为空，跳过这一行（空行）
    const productName = getValue(row, '产品名称');
    if (!productName || productName.trim() === '') {
      return;
    }

    const categoryName = getValue(row, '分类') || 'Other';
    // 如果分类为空，也跳过（避免产生大量 Other）
    if (!categoryName || categoryName.trim() === '' || categoryName === 'Other') {
      return;
    }

    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');

    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        name: categoryName,
        id: categoryId,
        products: [],
      };
    }

    // 处理图片字段：飞书返回的是数组，包含对象，对象有 link 字段
    let imageUrl = '';
    const imageIdx = headers.indexOf('图片');
    if (imageIdx >= 0 && row[imageIdx]) {
      const imageCell = row[imageIdx];
      
      // 如果是数组（飞书链接格式）
      if (Array.isArray(imageCell) && imageCell.length > 0) {
        const firstItem = imageCell[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          // 提取 link 字段
          imageUrl = firstItem.link || firstItem.url || '';
        } else if (typeof firstItem === 'string') {
          imageUrl = firstItem;
        }
      }
      // 如果是对象（单个对象）
      else if (typeof imageCell === 'object' && imageCell !== null) {
        imageUrl = imageCell.link || imageCell.url || '';
      }
      // 如果是字符串
      else if (typeof imageCell === 'string') {
        imageUrl = imageCell.trim();
      }
    }
    
    // 如果还是没有图片，使用默认值
    if (!imageUrl || imageUrl === '') {
      imageUrl = 'images/product-default.svg';
    }

    categoryMap[categoryId].products.push({
      name: productName,
      image: imageUrl,
      alt: productName,
      specs: {
        rawMaterial: getValue(row, '原材料'),
        size: getValue(row, '尺寸'),
        minOrder: getValue(row, '最小订单'),
        package: getValue(row, '包装'),
        payment: getValue(row, '付款方式'),
        providedBy: getValue(row, '供应商') || 'MARINE FOOD PRODUCTS CO., LTD.',
      },
    });
  });

  products.categories = Object.values(categoryMap);
  return products;
}

/**
 * 保存为 YAML 文件
 */
function saveToYaml(data, filePath) {
  // 简单的 YAML 转换（生产环境建议使用 js-yaml 库）
  let yaml = `intro: "${data.intro}"\ncategories:\n`;
  
  data.categories.forEach(category => {
    yaml += `  - name: "${category.name}"\n`;
    yaml += `    id: "${category.id}"\n`;
    yaml += `    products:\n`;
    
    category.products.forEach(product => {
      yaml += `      - name: "${product.name}"\n`;
      yaml += `        image: "${product.image}"\n`;
      yaml += `        alt: "${product.alt}"\n`;
      yaml += `        specs:\n`;
      yaml += `          rawMaterial: "${product.specs.rawMaterial}"\n`;
      yaml += `          size: "${product.specs.size}"\n`;
      yaml += `          minOrder: "${product.specs.minOrder}"\n`;
      yaml += `          package: "${product.specs.package}"\n`;
      yaml += `          payment: "${product.specs.payment}"\n`;
      yaml += `          providedBy: "${product.specs.providedBy}"\n`;
    });
  });
  
  fs.writeFileSync(filePath, yaml, 'utf8');
  console.log(`✅ 数据已保存到 ${filePath}`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔄 开始同步飞书数据...');
    
    // 获取访问令牌
    console.log('📝 获取访问令牌...');
    const accessToken = await getAccessToken();
    console.log('✅ 令牌获取成功');
    
    // 获取 sheet_id
    console.log('📄 获取 sheet_id...');
    const sheetId = await getSheetId(accessToken);
    console.log(`✅ 获取到 sheet_id: ${sheetId}`);

    // 获取表格数据
    console.log('📊 获取表格数据...');
    const values = await getSpreadsheetValues(accessToken, sheetId);
    console.log(`✅ 获取到 ${Math.max(values.length - 1, 0)} 条记录（除表头）`);
    
    // 转换数据格式
    console.log('🔄 转换数据格式...');
    const hugoData = convertToHugoFormat(values);
    
    // 保存文件
    const outputPath = path.join(__dirname, '..', 'data', 'products.yaml');
    saveToYaml(hugoData, outputPath);
    
    console.log('🎉 同步完成！');
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { main };

