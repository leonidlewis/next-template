const path = require('path');
const { createHash } = require('crypto');
const fs = require('fs');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

export async function generateOgImage(props) {
  const params = new URLSearchParams(props);
  const url = `file:${path.join(
    process.cwd(),
    `build/articles/og-image.html?${params}`
  )}`;

  const hash = createHash('md5').update(url).digest('hex');
  const ogImageDir = path.join(process.cwd(), `public/og`);
  const imageName = `${hash}.png`;
  const imagePath = `${ogImageDir}/${imageName}`;
  const publicPath = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/og/${imageName}`;

  try {
    fs.statSync(imagePath);
    return publicPath;
  } catch (error) {
    // File does not exist, create it
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot();
  await browser.close();

  fs.mkdirSync(ogImageDir, { recursive: true });
  fs.writeFileSync(imagePath, buffer);

  return publicPath;
}
