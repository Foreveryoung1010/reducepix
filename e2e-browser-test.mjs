// ReducePix 浏览器功能测试脚本
// 使用 playwright-core + 系统 Chrome
// 输出 JSON 结果到 stdout

import { chromium } from 'playwright-core';

const BASE = 'https://reducepix.pages.dev';
const PROJECT_DIR = 'd:\\AI项目\\TRAE WORK\\图片工具站';

const results = [];

function report(name, passed, detail) {
  results.push({ name, passed, detail });
}

// 在浏览器中生成测试图片，返回 { name, mimeType, buffer }
async function generateTestImage(page, format, width, height) {
  const dataUrl = await page.evaluate(({ format, width, height }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#44ff44');
    gradient.addColorStop(1, '#4444ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制几何图形
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 3, 0, Math.PI * 2);
    ctx.fill();

    // 绘制文字
    ctx.font = `bold ${Math.floor(width / 20)}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ReducePix Test', width / 2, height / 2);

    // 绘制随机噪点（增加文件大小，使压缩效果明显）
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';
    return canvas.toDataURL(mime, 0.95);
  }, { format, width, height });

  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const ext = format === 'jpeg' ? 'jpg' : format;
  const mime = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
  return { name: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`, mimeType: mime, buffer };
}

// 上传图片到页面
async function uploadImage(page, imageFile) {
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
  await page.click('#select-button');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(imageFile);
  await page.waitForFunction(() => {
    const btn = document.getElementById('compress-button');
    return btn && !btn.disabled;
  }, { timeout: 10000 });
}

// 压缩并等待结果
async function compressAndWait(page, expectedCount = 1) {
  await page.click('#compress-button');
  await page.waitForSelector('.result-card', { timeout: 30000 });
  await page.waitForFunction(
    (count) => document.querySelectorAll('.result-card').length >= count,
    expectedCount,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);
}

// 解析大小文本，返回字节数
function parseSize(text) {
  const match = text.match(/([\d.]+)\s*(B|KB|MB)/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  return unit === 'MB' ? num * 1024 * 1024 : unit === 'KB' ? num * 1024 : num;
}

async function main() {
  let browser;

  // 尝试启动 Chrome
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    try {
      browser = await chromium.launch({ headless: true });
    } catch (e2) {
      console.log(JSON.stringify({ error: '无法启动 Chrome: ' + e.message + ' / ' + e2.message }));
      process.exit(1);
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // 收集控制台错误
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // ========================================
    // 测试 12：首页加载无关键 JS 错误
    // ========================================
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    report(
      '12. 首页加载无关键 JS 错误',
      consoleErrors.length === 0,
      consoleErrors.length === 0 ? '无控制台错误' : `错误: ${consoleErrors.join('; ')}`
    );

    // ========================================
    // 测试 13：JPG 上传 → 压缩 → 结果出现
    // ========================================
    const jpgImage = await generateTestImage(page, 'jpeg', 800, 600);
    await uploadImage(page, jpgImage);
    await compressAndWait(page, 1);
    const jpgResultCount = await page.$$eval('.result-card', (cards) => cards.length);
    report('13. JPG 上传→压缩→结果出现', jpgResultCount >= 1, `结果卡片数: ${jpgResultCount}`);

    // ========================================
    // 测试 14：压缩后文件 ≤ 原始文件
    // ========================================
    const jpgSizesText = await page.$eval('.result-meta span', (el) => el.textContent);
    const jpgOrigMatch = jpgSizesText.match(/([\d.]+\s*(?:B|KB|MB))/);
    const jpgNewMatch = jpgSizesText.match(/→\s*([\d.]+\s*(?:B|KB|MB))/);
    const jpgOrigSize = jpgOrigMatch ? parseSize(jpgOrigMatch[1]) : 0;
    const jpgNewSize = jpgNewMatch ? parseSize(jpgNewMatch[1].replace('→', '').trim()) : 0;
    report(
      '14. 压缩后文件 ≤ 原始文件',
      jpgNewSize > 0 && jpgNewSize <= jpgOrigSize,
      `原始: ${jpgOrigMatch ? jpgOrigMatch[1] : '?'}, 压缩后: ${jpgNewMatch ? jpgNewMatch[1] : '?'}`
    );

    // ========================================
    // 测试 15：下载按钮存在且可点击
    // ========================================
    const downloadButton = await page.$('.download-button');
    const downloadExists = !!downloadButton;
    const downloadEnabled = downloadExists ? await downloadButton.isEnabled() : false;
    report(
      '15. 下载按钮存在且可点击',
      downloadExists && downloadEnabled,
      `存在: ${downloadExists}, 可用: ${downloadEnabled}`
    );

    // ========================================
    // 测试 16：PNG 上传 → 压缩
    // ========================================
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const pngImage = await generateTestImage(page, 'png', 800, 600);
    await uploadImage(page, pngImage);
    await compressAndWait(page, 1);
    const pngResultCount = await page.$$eval('.result-card', (cards) => cards.length);
    report('16. PNG 上传→压缩', pngResultCount >= 1, `结果卡片数: ${pngResultCount}`);

    // ========================================
    // 测试 17：WebP 上传 → 压缩
    // ========================================
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const webpImage = await generateTestImage(page, 'webp', 800, 600);
    await uploadImage(page, webpImage);
    await compressAndWait(page, 1);
    const webpResultCount = await page.$$eval('.result-card', (cards) => cards.length);
    report('17. WebP 上传→压缩', webpResultCount >= 1, `结果卡片数: ${webpResultCount}`);

    // ========================================
    // 测试 18：批量上传 3 张图片 → 全部压缩
    // ========================================
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const batchImages = await Promise.all([
      generateTestImage(page, 'jpeg', 800, 600),
      generateTestImage(page, 'jpeg', 1200, 800),
      generateTestImage(page, 'png', 600, 400)
    ]);
    const batchFileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await page.click('#select-button');
    const batchFileChooser = await batchFileChooserPromise;
    await batchFileChooser.setFiles(batchImages);
    await page.waitForFunction(() => {
      const btn = document.getElementById('compress-button');
      return btn && !btn.disabled;
    }, { timeout: 10000 });
    await page.click('#compress-button');
    await page.waitForSelector('.result-card', { timeout: 30000 });
    await page.waitForFunction((c) => document.querySelectorAll('.result-card').length >= c, 3, { timeout: 30000 });
    await page.waitForTimeout(500);
    const batchResultCount = await page.$$eval('.result-card', (cards) => cards.length);
    report('18. 批量上传 3 张→全部压缩', batchResultCount >= 3, `结果卡片数: ${batchResultCount}`);

    // ========================================
    // 测试 19：目标 KB 设置功能
    // ========================================
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // checkbox is visually hidden (opacity:0) inside .switch, so use evaluate
    await page.evaluate(() => {
      const cb = document.getElementById('target-toggle');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(200);
    await page.fill('#target-kb', '50');
    const largeJpg = await generateTestImage(page, 'jpeg', 1920, 1080);
    await uploadImage(page, largeJpg);
    await compressAndWait(page, 1);
    const targetSizesText = await page.$eval('.result-meta span', (el) => el.textContent);
    const targetNewMatch = targetSizesText.match(/→\s*([\d.]+\s*(?:B|KB|MB))/);
    const targetNewSize = targetNewMatch ? parseSize(targetNewMatch[1].replace('→', '').trim()) : 0;
    const targetKB = targetNewSize / 1024;
    report(
      '19. 目标 KB 设置功能 (目标 50KB)',
      targetKB <= 55,
      `目标: 50KB, 实际: ${targetNewMatch ? targetNewMatch[1] : '?'}, ${targetKB.toFixed(1)}KB`
    );

    // ========================================
    // 测试 20：桌面端布局正常 (1280px)
    // ========================================
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const desktopCheck = await page.evaluate(() => {
      const grid = document.querySelector('.tool-grid');
      const hero = document.querySelector('.hero');
      const toolShell = document.querySelector('.tool-shell');
      const gridRect = grid ? grid.getBoundingClientRect() : null;
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      return {
        gridVisible: gridRect ? gridRect.width > 0 && gridRect.height > 0 : false,
        gridWidth: gridRect ? gridRect.width : 0,
        heroVisible: heroRect ? heroRect.width > 0 && heroRect.height > 0 : false,
        toolShellVisible: toolShell ? toolShell.getBoundingClientRect().width > 0 : false,
        bodyScrollWidth: document.body.scrollWidth
      };
    });
    const desktopLayoutOk = desktopCheck.gridVisible && desktopCheck.heroVisible && desktopCheck.bodyScrollWidth <= 1280;
    report(
      '20. 桌面端布局正常 (1280px)',
      desktopLayoutOk,
      `grid: ${desktopCheck.gridVisible} (${desktopCheck.gridWidth}px), hero: ${desktopCheck.heroVisible}, scrollWidth: ${desktopCheck.bodyScrollWidth}`
    );

    // ========================================
    // 测试 21：移动端布局正常 (375px)
    // ========================================
    await page.setViewportSize({ width: 375, height: 700 });
    await page.waitForTimeout(500);
    const mobileCheck = await page.evaluate(() => {
      const grid = document.querySelector('.tool-grid');
      const hero = document.querySelector('.hero');
      const header = document.querySelector('.topbar');
      const footer = document.querySelector('.footer');
      const gridRect = grid ? grid.getBoundingClientRect() : null;
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;
      return {
        gridVisible: gridRect ? gridRect.width > 0 && gridRect.height > 0 : false,
        gridWidth: gridRect ? gridRect.width : 0,
        heroVisible: heroRect ? heroRect.width > 0 && heroRect.height > 0 : false,
        headerVisible: headerRect ? headerRect.width > 0 : false,
        bodyScrollWidth: document.body.scrollWidth,
        overflow: document.body.scrollWidth > 375
      };
    });
    const mobileLayoutOk = mobileCheck.gridVisible && mobileCheck.heroVisible && !mobileCheck.overflow;
    report(
      '21. 移动端布局正常 (375px)',
      mobileLayoutOk,
      `grid: ${mobileCheck.gridVisible} (${mobileCheck.gridWidth}px), hero: ${mobileCheck.heroVisible}, scrollWidth: ${mobileCheck.bodyScrollWidth}, 溢出: ${mobileCheck.overflow}`
    );

  } catch (err) {
    report('浏览器测试执行异常', false, err.message || String(err));
  } finally {
    await browser.close();
  }

  // 输出 JSON 结果
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  console.log('===BROWSER_TEST_RESULTS===');
  console.log(JSON.stringify({ results, passCount, failCount, total: results.length }));
  console.log('===END_BROWSER_TEST_RESULTS===');
}

main().catch((err) => {
  console.log(JSON.stringify({ error: err.message }));
  process.exit(1);
});
