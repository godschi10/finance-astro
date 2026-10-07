import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'http://localhost:8765/money-tools/50-30-20-budget-calculator/';
const WIDTH = 390;
const HEIGHT = 844; // iPhone 12/13/14 height

async function runTest(theme) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    colorScheme: theme,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  // Navigate and wait for load
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Wait for JS to initialize
  await page.waitForFunction(() => window.render !== undefined || document.getElementById('bg-inc') !== null);
  await page.waitForTimeout(500);
  
  // Take initial screenshot
  await page.screenshot({ path: `a7-503020-${theme}-initial.png`, fullPage: true });
  
  // Test E6 regression: Trust badges, copy button, hint-class feet, Reset line
  const e6Data = await page.evaluate(() => {
    const results = {
      trustBadges: {},
      copyButton: {},
      hintClass: {},
      resetLine: {}
    };
    
    // Check trust badges on 10 figures
    const trustFields = ['bg-inc', 'bg-needs', 'bg-wants', 'bg-save', 'bg-spn', 'bg-spw', 'bg-sps', 'al-rent', 'al-food', 'al-transport'];
    for (const id of trustFields) {
      const el = document.getElementById(id);
      if (el) {
        const field = el.closest('.field');
        if (field) {
          results.trustBadges[id] = {
            hasDataSd: field.hasAttribute('data-sd'),
            hasDataR: field.hasAttribute('data-r'),
            value: el.value
          };
        }
      }
    }
    
    // Check copy button states
    const copyBtn = document.getElementById('bg-copy');
    const copyWhy = document.getElementById('bg-copywhy');
    if (copyBtn && copyWhy) {
      results.copyButton = {
        text: copyBtn.textContent,
        whyText: copyWhy.textContent,
        whyDataTrust: copyWhy.getAttribute('data-trust')
      };
    }
    
    // Check hint-class feet (receipt-foot with class hint)
    const hintFeet = document.querySelectorAll('.receipt-foot.hint');
    results.hintClass.count = hintFeet.length;
    results.hintClass.texts = Array.from(hintFeet).map(el => el.textContent);
    
    // Check Reset line
    const resetNote = document.getElementById('bg-resetnote');
    if (resetNote) {
      results.resetLine.text = resetNote.textContent;
    }
    
    return results;
  });
  
  // Keystroke audit: simulate cold load → complete all 3 steps
  // Step 1: Income + splits (4 fields)
  // Step 1: Actuals (3 fields) 
  // Step 2: 5 shares (rent, food, transport, data, bills)
  // Total fields = 12
  
  // Count interactions for cold completion
  const keystrokeData = await page.evaluate(() => {
    // Simulate the interaction count
    const fields = [
      'bg-inc', 'bg-needs', 'bg-wants', 'bg-save',  // 4 split fields
      'bg-spn', 'bg-spw', 'bg-sps',                   // 3 actuals fields
      'al-rent', 'al-food', 'al-transport', 'al-data', 'al-bills'  // 5 share fields
    ];
    
    // Each field: 1 tap to focus + keystrokes to enter value + 1 tap to next (or Enter)
    // For mobile: tap to focus, type value, tap next field
    // Typical: tap (1) + type digits (varies) + tap next (1) = ~3-5 per field
    // But we want to count raw interactions
    
    return {
      totalFields: fields.length,
      step1Fields: 4,
      step1ActualsFields: 3,
      step2Fields: 5,
      // Target: Step 1 (income + splits) from 33 → ≤15 interactions
      // Current estimate: 4 fields × ~8 interactions each = 32
      // With chips/presets: 1 tap for income preset + 1 tap for split preset = 2-3
    };
  });
  
  // Quick-fill opportunities: check for chips/presets
  const quickFillData = await page.evaluate(() => {
    // Check if there are any preset buttons/chips
    const presetButtons = document.querySelectorAll('.preset, .chip, [data-preset], button[value]');
    const allButtons = document.querySelectorAll('button');
    let incomePresetsCount = 0;
    allButtons.forEach(btn => {
      if (btn.textContent.includes('₦')) incomePresetsCount++;
    });
    
    return {
      presetButtonsCount: presetButtons.length,
      incomePresetsCount,
      hasQuickFill: presetButtons.length > 0 || incomePresetsCount > 0
    };
  });
  
  // Mobile thumb flow: check touch targets
  const thumbFlowData = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    const buttons = document.querySelectorAll('button, .receipt-row[data-goto]');
    
    const results = {
      inputs: [],
      buttons: [],
      issues: []
    };
    
    inputs.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const label = document.querySelector(`label[for="${el.id}"]`);
      results.inputs.push({
        id: el.id,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        labelText: label?.textContent?.trim(),
        hittable: rect.width >= 44 && rect.height >= 44
      });
      if (rect.width < 44 || rect.height < 44) {
        results.issues.push(`Input ${el.id}: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px - below 44px`);
      }
    });
    
    buttons.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      results.buttons.push({
        text: el.textContent?.trim().slice(0, 30),
        width: rect.width,
        height: rect.height,
        hittable: rect.width >= 44 && rect.height >= 44
      });
      if (rect.width < 44 || rect.height < 44) {
        results.issues.push(`Button "${el.textContent?.trim().slice(0, 20)}": ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px - below 44px`);
      }
    });
    
    return results;
  });
  
  // Autocomplete/OS integration: check input types and inputmode
  const autocompleteData = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    const results = {
      fields: [],
      hasInputModeDecimal: 0,
      missingInputMode: []
    };
    
    inputs.forEach(el => {
      const inputMode = el.getAttribute('inputmode');
      const type = el.getAttribute('type');
      const autocomplete = el.getAttribute('autocomplete');
      
      results.fields.push({
        id: el.id,
        type,
        inputMode,
        autocomplete,
        optimal: inputMode === 'decimal' && type === 'text'
      });
      
      if (inputMode === 'decimal') results.hasInputModeDecimal++;
      if (inputMode !== 'decimal') results.missingInputMode.push(el.id);
    });
    
    return results;
  });
  
  // Simulate quick-fill interaction test
  // Test: tap income field, see if browser offers saved values
  await page.focus('#bg-inc');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `a7-503020-${theme}-focus-income.png`, fullPage: true });
  
  // Fill income with a test value
  await page.fill('#bg-inc', '250000');
  await page.waitForTimeout(200);
  
  // Tap needs split
  await page.focus('#bg-needs');
  await page.waitForTimeout(200);
  
  // Take final screenshot
  await page.screenshot({ path: `a7-503020-${theme}-filled.png`, fullPage: true });
  
  await browser.close();
  
  return {
    theme,
    e6: e6Data,
    keystrokes: keystrokeData,
    quickFill: quickFillData,
    thumbFlow: thumbFlowData,
    autocomplete: autocompleteData
  };
}

async function main() {
  console.log('Testing light theme...');
  const lightResults = await runTest('light');
  
  console.log('Testing dark theme...');
  const darkResults = await runTest('dark');
  
  // Write results
  const report = {
    timestamp: new Date().toISOString(),
    url: URL,
    viewport: `${WIDTH}x${HEIGHT}`,
    light: lightResults,
    dark: darkResults
  };
  
  fs.writeFileSync('a7-results.json', JSON.stringify(report, null, 2));
  console.log('Results written to a7-results.json');
  
  // Print summary
  console.log('\n=== E6 REGRESSION ===');
  console.log('Light theme trust badges:', Object.keys(lightResults.e6.trustBadges).length, 'fields checked');
  console.log('Dark theme trust badges:', Object.keys(darkResults.e6.trustBadges).length, 'fields checked');
  console.log('Copy button (light):', lightResults.e6.copyButton.text, '|', lightResults.e6.copyButton.whyText);
  console.log('Copy button (dark):', darkResults.e6.copyButton.text, '|', darkResults.e6.copyButton.whyText);
  console.log('Hint feet (light):', lightResults.e6.hintClass.count);
  console.log('Hint feet (dark):', darkResults.e6.hintClass.count);
  console.log('Reset line:', lightResults.e6.resetLine.text);
  
  console.log('\n=== KEYSTROKE AUDIT ===');
  console.log('Total fields:', lightResults.keystrokes.totalFields);
  console.log('Step 1 (income+splits):', lightResults.keystrokes.step1Fields, 'fields');
  console.log('Step 1 actuals:', lightResults.keystrokes.step1ActualsFields, 'fields');
  console.log('Step 2 (shares):', lightResults.keystrokes.step2Fields, 'fields');
  
  console.log('\n=== QUICK-FILL ===');
  console.log('Preset buttons (light):', lightResults.quickFill.presetButtonsCount);
  console.log('Preset buttons (dark):', darkResults.quickFill.presetButtonsCount);
  console.log('Has quick-fill:', lightResults.quickFill.hasQuickFill);
  
  console.log('\n=== THUMB FLOW ===');
  console.log('Input issues (light):', lightResults.thumbFlow.issues.length);
  lightResults.thumbFlow.issues.forEach(i => console.log('  -', i));
  console.log('Input issues (dark):', darkResults.thumbFlow.issues.length);
  darkResults.thumbFlow.issues.forEach(i => console.log('  -', i));
  
  console.log('\n=== AUTOCOMPLETE ===');
  console.log('Fields with inputmode=decimal (light):', lightResults.autocomplete.hasInputModeDecimal, '/', lightResults.autocomplete.fields.length);
  console.log('Missing inputmode (light):', lightResults.autocomplete.missingInputMode);
  console.log('Fields with inputmode=decimal (dark):', darkResults.autocomplete.hasInputModeDecimal, '/', darkResults.autocomplete.fields.length);
  console.log('Missing inputmode (dark):', darkResults.autocomplete.missingInputMode);
}

main().catch(console.error);