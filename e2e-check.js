// ReducePix E2E 21 项检查脚本
// 用于 integrated_code_mode Exec 工具执行
// 用法：将此文件内容粘贴到 Exec 的 code 参数中
//
// 检查 1-11：Shell 级 HTTP/SEO/安全头检查（curl）
// 检查 12-21：浏览器功能测试（Playwright + 系统 Chrome）

const BASE = 'https://reducepix.pages.dev';
const PROJECT_DIR = 'd:\\AI项目\\TRAE WORK\\图片工具站';

const results = [];
let passCount = 0;
let failCount = 0;

function report(name, passed, detail) {
  const status = passed ? 'PASS' : 'FAIL';
  if (passed) passCount++; else failCount++;
  results.push({ check: name, status, detail });
}

// 工具发现：打印可用工具名，方便调试
let toolNames = [];
try {
  toolNames = ALL_TOOLS.map(t => t.name);
} catch (e) {
  toolNames = ['ALL_TOOLS not available'];
}

// 辅助：通过 shell 执行 curl，返回 { code, headers, body }
async function curl(url) {
  const cmd = `curl.exe --compressed -sS -D - -o NUL -w "\\nHTTP_CODE:%{http_code}\\nCONTENT_TYPE:%{content_type}\\nSIZE:%{size_download}" "${url}"`;
  const res = await tools.shell({ command: cmd });
  const output = res.stdout || res.output || '';
  const codeMatch = output.match(/HTTP_CODE:(\d+)/);
  const typeMatch = output.match(/CONTENT_TYPE:([^\n\r]+)/);
  const sizeMatch = output.match(/SIZE:(\d+)/);
  return {
    code: codeMatch ? parseInt(codeMatch[1]) : 0,
    contentType: typeMatch ? typeMatch[1].trim() : '',
    size: sizeMatch ? parseInt(sizeMatch[1]) : 0,
    raw: output
  };
}

// 辅助：通过 shell 执行 curl 并获取 body 内容
async function curlBody(url) {
  const cmd = `curl.exe --compressed -sS "${url}"`;
  const res = await tools.shell({ command: cmd });
  return res.stdout || res.output || '';
}

// 辅助：通过 shell 获取响应头
async function curlHeaders(url) {
  const cmd = `curl.exe --compressed -sS -I "${url}"`;
  const res = await tools.shell({ command: cmd });
  return res.stdout || res.output || '';
}

// 辅助：通过 shell 执行命令
async function shellExec(command, cwd) {
  const args = { command };
  if (cwd) args.cwd = cwd;
  const res = await tools.shell(args);
  return res.stdout || res.output || '';
}

try {
  // ========================================
  // 第一部分：Shell 级检查（1-11）
  // ========================================

  // 检查 1：首页 HTTP 200 + 标题包含 ReducePix
  text('正在执行检查 1/21：首页状态 + 标题...');
  const homeBody = await curlBody(BASE + '/');
  const homeCheck = await curl(BASE + '/');
  const titleMatch = homeBody.match(/<title[^>]*>([^<]*)<\/title>/i);
  const titleText = titleMatch ? titleMatch[1].trim() : '';
  const hasReducePix = titleText.toLowerCase().includes('reducepix');
  const homeOk = homeCheck.code === 200 && hasReducePix;
  report(
    '1. 首页 HTTP 200 + 标题含 ReducePix',
    homeOk,
    `code=${homeCheck.code}, title="${titleText}", 含ReducePix=${hasReducePix}`
  );

  // 检查 2：/privacy 返回 200
  text('正在执行检查 2/21：隐私页...');
  const privacyCheck = await curl(BASE + '/privacy');
  report(
    '2. /privacy 返回 200',
    privacyCheck.code === 200,
    `code=${privacyCheck.code}, type=${privacyCheck.contentType}`
  );

  // 检查 3：/terms 返回 200
  text('正在执行检查 3/21：条款页...');
  const termsCheck = await curl(BASE + '/terms');
  report(
    '3. /terms 返回 200',
    termsCheck.code === 200,
    `code=${termsCheck.code}, type=${termsCheck.contentType}`
  );

  // 检查 4：robots.txt 200 + 包含 Sitemap 指令
  text('正在执行检查 4/21：robots.txt...');
  const robotsBody = await curlBody(BASE + '/robots.txt');
  const robotsCheck = await curl(BASE + '/robots.txt');
  const hasSitemap = /Sitemap:\s*\S+/i.test(robotsBody);
  const robotsOk = robotsCheck.code === 200 && hasSitemap;
  report(
    '4. robots.txt 200 + 含 Sitemap 指令',
    robotsOk,
    `code=${robotsCheck.code}, hasSitemap=${hasSitemap}, content=${robotsBody.replace(/\n/g, ' | ').substring(0, 200)}`
  );

  // 检查 5：sitemap.xml 200 + 包含 <loc> 条目
  text('正在执行检查 5/21：sitemap.xml...');
  const sitemapBody = await curlBody(BASE + '/sitemap.xml');
  const sitemapCheck = await curl(BASE + '/sitemap.xml');
  const locCount = (sitemapBody.match(/<loc>/g) || []).length;
  const sitemapOk = sitemapCheck.code === 200 && locCount >= 3;
  report(
    '5. sitemap.xml 200 + 含 <loc> 条目',
    sitemapOk,
    `code=${sitemapCheck.code}, type=${sitemapCheck.contentType}, locCount=${locCount}`
  );

  // 检查 6：首页不出现 PixelCrate 旧品牌名
  text('正在执行检查 6/21：旧品牌名检查...');
  const hasPixelCrate = /pixelcrate/i.test(homeBody);
  report(
    '6. 首页不含 PixelCrate',
    !hasPixelCrate,
    `pixelCrateFound=${hasPixelCrate}`
  );

  // 检查 7：首页 canonical 标签存在
  text('正在执行检查 7/21：canonical 标签...');
  const canonicalMatch = homeBody.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : '';
  report(
    '7. 首页 canonical 标签存在',
    canonicalUrl.length > 0,
    `canonical="${canonicalUrl}"`
  );

  // 检查 8：首页 OG + Twitter 元信息完整
  text('正在执行检查 8/21：OG/Twitter 元信息...');
  const ogTitle = homeBody.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogUrl = homeBody.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
  const ogImage = homeBody.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const twitterCard = homeBody.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i);
  const ogComplete = ogTitle && ogUrl && twitterCard;
  report(
    '8. OG + Twitter 元信息完整',
    !!ogComplete,
    `og:title=${ogTitle ? ogTitle[1] : 'MISSING'}, og:url=${ogUrl ? ogUrl[1] : 'MISSING'}, og:image=${ogImage ? 'present' : 'MISSING'}, twitter:card=${twitterCard ? twitterCard[1] : 'MISSING'}`
  );

  // 检查 9：首页 JSON-LD 结构化数据存在且可解析
  text('正在执行检查 9/21：JSON-LD 结构化数据...');
  const ldBlocks = homeBody.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let ldValid = false;
  let ldDetail = 'no JSON-LD found';
  if (ldBlocks && ldBlocks.length > 0) {
    ldDetail = `found ${ldBlocks.length} JSON-LD block(s)`;
    for (const block of ldBlocks) {
      const jsonMatch = block.match(/>([\s\S]*?)<\/script>/i);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          ldValid = true;
        } catch (e) {
          ldDetail += `; parse error: ${e.message}`;
        }
      }
    }
  }
  report(
    '9. JSON-LD 存在且可解析',
    ldValid,
    ldDetail
  );

  // 检查 10：安全响应头存在（CSP + X-Frame-Options + Referrer-Policy）
  text('正在执行检查 10/21：安全响应头...');
  const headersRaw = await curlHeaders(BASE + '/');
  const hasCSP = /content-security-policy:/i.test(headersRaw);
  const hasFrameOptions = /x-frame-options:/i.test(headersRaw);
  const hasReferrerPolicy = /referrer-policy:/i.test(headersRaw);
  const hasPermissionsPolicy = /permissions-policy:/i.test(headersRaw);
  const securityOk = hasCSP && hasFrameOptions && hasReferrerPolicy;
  report(
    '10. 安全响应头（CSP + X-Frame-Options + Referrer-Policy）',
    securityOk,
    `CSP=${hasCSP}, X-Frame-Options=${hasFrameOptions}, Referrer-Policy=${hasReferrerPolicy}, Permissions-Policy=${hasPermissionsPolicy}`
  );

  // 检查 11：favicon.svg 返回 200
  text('正在执行检查 11/21：favicon.svg...');
  const faviconCheck = await curl(BASE + '/favicon.svg');
  report(
    '11. /favicon.svg 返回 200',
    faviconCheck.code === 200,
    `code=${faviconCheck.code}, type=${faviconCheck.contentType}`
  );

  // ========================================
  // 第二部分：浏览器功能测试（12-21）
  // ========================================

  text('正在准备浏览器功能测试环境...');

  // 检查 playwright-core 是否已安装
  const checkPw = await shellExec(
    `cd "${PROJECT_DIR}"; node -e "require('playwright-core'); console.log('INSTALLED')"`,
    PROJECT_DIR
  );
  const pwInstalled = checkPw.includes('INSTALLED');

  if (!pwInstalled) {
    text('正在安装 playwright-core...');
    const installResult = await shellExec(
      `cd "${PROJECT_DIR}"; npm install playwright-core --no-save --silent`,
      PROJECT_DIR
    );
    text('playwright-core 安装完成');
  } else {
    text('playwright-core 已安装，跳过安装');
  }

  // 检查浏览器测试脚本是否存在
  const checkScript = await shellExec(
    `Test-Path "${PROJECT_DIR}\\e2e-browser-test.mjs"`,
    PROJECT_DIR
  );
  const scriptExists = checkScript.trim().toLowerCase().includes('true');

  if (!scriptExists) {
    report('12-21. 浏览器功能测试', false, 'e2e-browser-test.mjs 不存在于项目目录中');
  } else {
    text('正在运行浏览器功能测试（检查 12-21）...');
    text('这可能需要 30-60 秒，请耐心等待...');

    const browserTestResult = await shellExec(
      `cd "${PROJECT_DIR}"; node e2e-browser-test.mjs 2>&1`,
      PROJECT_DIR
    );

    // 解析浏览器测试结果
    const jsonMatch = browserTestResult.match(/===BROWSER_TEST_RESULTS===\s*\n([\s\S]*?)\n===END_BROWSER_TEST_RESULTS===/);
    if (jsonMatch) {
      try {
        const browserData = JSON.parse(jsonMatch[1].trim());
        if (browserData.results && Array.isArray(browserData.results)) {
          for (const r of browserData.results) {
            report(r.name, r.passed, r.detail);
          }
        }
        if (browserData.error) {
          report('浏览器测试错误', false, browserData.error);
        }
      } catch (e) {
        report('浏览器测试结果解析', false, `JSON 解析失败: ${e.message}, 原始输出: ${browserTestResult.substring(0, 500)}`);
      }
    } else if (browserTestResult.includes('"error"')) {
      const errorMatch = browserTestResult.match(/"error"\s*:\s*"([^"]+)"/);
      report('浏览器测试启动', false, errorMatch ? errorMatch[1] : browserTestResult.substring(0, 500));
    } else {
      report('浏览器测试执行', false, `未找到结果标记, 输出: ${browserTestResult.substring(0, 500)}`);
    }
  }

} catch (err) {
  report('执行异常', false, err.message || String(err));
}

// ========================================
// 输出汇总报告
// ========================================
let reportText = '\n';
reportText += '═══════════════════════════════════════════════════\n';
reportText += '  ReducePix E2E 完整检查报告（21 项）\n';
reportText += '  目标: ' + BASE + '\n';
reportText += '  日期: ' + new Date().toISOString().split('T')[0] + '\n';
reportText += '═══════════════════════════════════════════════════\n\n';

reportText += '── Shell 级检查 (1-11) ──\n\n';

for (const r of results) {
  const num = r.check.match(/^(\d+)\./);
  const numVal = num ? parseInt(num[1]) : 0;
  if (numVal === 12) {
    reportText += '\n── 浏览器功能测试 (12-21) ──\n\n';
  }
  const icon = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
  reportText += icon + ' ' + r.check + '\n';
  reportText += '       ' + r.detail + '\n';
}

reportText += '\n═══════════════════════════════════════════════════\n';
reportText += '总计: ' + passCount + ' 通过 / ' + failCount + ' 失败 / ' + results.length + ' 项\n';
reportText += '═══════════════════════════════════════════════════\n';

if (failCount === 0) {
  reportText += '\n结论: 全部 21 项通过，站点状态健康。\n';
} else {
  reportText += '\n结论: 有 ' + failCount + ' 项失败，需排查修复。\n';
  reportText += '失败项:\n';
  for (const r of results) {
    if (r.status === 'FAIL') {
      reportText += '  - ' + r.check + ': ' + r.detail + '\n';
    }
  }
}

text(reportText);
