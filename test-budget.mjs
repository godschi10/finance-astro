import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

const results = { light: {}, dark: {}, errors: [] };

async function testTheme(theme) {
  try {
    await page.goto('http://localhost:8766/money-tools/50-30-20-budget-calculator/', { waitUntil: 'networkidle2' });
    
    await page.evaluate((t) => {
      localStorage.setItem('gwill-finance-theme-v3', t);
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 500));
    
    await page.screenshot({ path: `/home/opc/work/research-notes/a9-503020-${theme}-initial.png`, fullPage: true });
    
    const incomeInput = await page.$('input[type="number"]');
    if (incomeInput) {
      await incomeInput.click({ clickCount: 3 });
      await incomeInput.type('200000');
      await new Promise(r => setTimeout(r, 300));
    }
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Fill') || text.includes('Apply') || text.includes('Default'))) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }
    
    await page.screenshot({ path: `/home/opc/work/research-notes/a9-503020-${theme}-step1.png`, fullPage: true });
    
    const step1Text = await page.evaluate(() => document.body.innerText);
    results[theme].step1Text = step1Text.substring(0, 5000);
    
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Next') || text.includes('Step 2') || text.includes('Break down') || text.includes('Needs'))) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }
    
    const needValues = [80000, 40000, 15000, 10000, 5000];
    const inputs = await page.$$('input[type="number"]');
    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      await inputs[i].click({ clickCount: 3 });
      await inputs[i].type(String(needValues[i]));
      await new Promise(r => setTimeout(r, 200));
    }
    
    await page.screenshot({ path: `/home/opc/work/research-notes/a9-503020-${theme}-step2.png`, fullPage: true });
    
    const step2Text = await page.evaluate(() => document.body.innerText);
    results[theme].step2Text = step2Text.substring(0, 5000);
    results[theme].fullText = step2Text.substring(0, 10000);
    
  } catch (e) {
    results.errors.push({ theme, error: e.message });
  }
}

await testTheme('light');
await testTheme('dark');

await browser.close();
console.log(JSON.stringify(results, null, 2));
