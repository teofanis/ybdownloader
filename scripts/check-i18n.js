#!/usr/bin/env node
/**
 * i18n Translation Validation Script
 * Ensures all translation files have the same keys as the source (en.json)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../frontend/src/locales');
const SOURCE_LOCALE = 'en.json';

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return [...acc, ...flattenKeys(value, fullKey)];
    }
    return [...acc, fullKey];
  }, []);
}

function loadLocale(filename) {
  const filepath = path.join(LOCALES_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

function main() {
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));
  
  if (!files.includes(SOURCE_LOCALE)) {
    console.error(`❌ Source locale '${SOURCE_LOCALE}' not found`);
    process.exit(1);
  }

  const sourceData = loadLocale(SOURCE_LOCALE);
  const sourceKeys = new Set(flattenKeys(sourceData));
  
  console.log(`📋 Source locale (${SOURCE_LOCALE}): ${sourceKeys.size} keys\n`);

  let hasErrors = false;
  const results = [];

  for (const file of files) {
    if (file === SOURCE_LOCALE) continue;

    const localeData = loadLocale(file);
    const localeKeys = new Set(flattenKeys(localeData));

    const missing = [...sourceKeys].filter(k => !localeKeys.has(k));
    const extra = [...localeKeys].filter(k => !sourceKeys.has(k));

    const status = {
      file,
      total: localeKeys.size,
      missing,
      extra,
      coverage: ((sourceKeys.size - missing.length) / sourceKeys.size * 100).toFixed(1)
    };

    results.push(status);

    if (missing.length > 0 || extra.length > 0) {
      hasErrors = true;
    }
  }

  // Print summary table
  console.log('Locale         Keys    Coverage  Missing  Extra');
  console.log('─'.repeat(50));
  
  for (const r of results) {
    const name = r.file.padEnd(14);
    const keys = String(r.total).padStart(4);
    const cov = `${r.coverage}%`.padStart(8);
    const miss = String(r.missing.length).padStart(7);
    const extra = String(r.extra.length).padStart(6);
    console.log(`${name} ${keys}    ${cov}  ${miss}  ${extra}`);
  }

  console.log('');

  // Print details for issues
  for (const r of results) {
    if (r.missing.length > 0) {
      console.log(`\n⚠️  ${r.file} - Missing keys:`);
      r.missing.forEach(k => console.log(`   - ${k}`));
    }
    if (r.extra.length > 0) {
      console.log(`\n⚠️  ${r.file} - Extra keys (not in source):`);
      r.extra.forEach(k => console.log(`   - ${k}`));
    }
  }

  if (hasErrors) {
    console.log('\n❌ Translation validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ All translations are complete and valid');
    process.exit(0);
  }
}

main();

