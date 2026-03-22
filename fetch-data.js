// ============================================================
// fetch-data.js — Run via GitHub Actions (manual trigger)
// Fetches from Eurostat + World Bank APIs, outputs data.json
// ============================================================

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// HTTP HELPER
// ============================================================
function get(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'DataMap/1.0' },
      timeout: 45000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        return resolve(get(next, maxRedirects - 1));
      }
      if (res.statusCode >= 400) {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode} for ${url}\n${body.substring(0, 200)}`)));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

async function getJSON(url) {
  const raw = await get(url);
  return JSON.parse(raw);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// COUNTRY CODE MAPPINGS
// ============================================================
const COUNTRIES = {
  AT: { name: 'Austria',        a3: 'AUT' },
  BE: { name: 'Belgium',        a3: 'BEL' },
  BG: { name: 'Bulgaria',       a3: 'BGR' },
  HR: { name: 'Croatia',        a3: 'HRV' },
  CY: { name: 'Cyprus',         a3: 'CYP' },
  CZ: { name: 'Czechia',        a3: 'CZE' },
  DK: { name: 'Denmark',        a3: 'DNK' },
  EE: { name: 'Estonia',        a3: 'EST' },
  FI: { name: 'Finland',        a3: 'FIN' },
  FR: { name: 'France',         a3: 'FRA' },
  DE: { name: 'Germany',        a3: 'DEU' },
  GR: { name: 'Greece',         a3: 'GRC' },
  HU: { name: 'Hungary',        a3: 'HUN' },
  IS: { name: 'Iceland',        a3: 'ISL' },
  IE: { name: 'Ireland',        a3: 'IRL' },
  IT: { name: 'Italy',          a3: 'ITA' },
  LV: { name: 'Latvia',         a3: 'LVA' },
  LT: { name: 'Lithuania',      a3: 'LTU' },
  LU: { name: 'Luxembourg',     a3: 'LUX' },
  MT: { name: 'Malta',          a3: 'MLT' },
  NL: { name: 'Netherlands',    a3: 'NLD' },
  NO: { name: 'Norway',         a3: 'NOR' },
  PL: { name: 'Poland',         a3: 'POL' },
  PT: { name: 'Portugal',       a3: 'PRT' },
  RO: { name: 'Romania',        a3: 'ROU' },
  SK: { name: 'Slovakia',       a3: 'SVK' },
  SI: { name: 'Slovenia',       a3: 'SVN' },
  ES: { name: 'Spain',          a3: 'ESP' },
  SE: { name: 'Sweden',         a3: 'SWE' },
  CH: { name: 'Switzerland',    a3: 'CHE' },
  GB: { name: 'United Kingdom', a3: 'GBR' },
  AL: { name: 'Albania',        a3: 'ALB' },
  BA: { name: 'Bosnia & Herz.', a3: 'BIH' },
  ME: { name: 'Montenegro',     a3: 'MNE' },
  MK: { name: 'North Macedonia',a3: 'MKD' },
  RS: { name: 'Serbia',         a3: 'SRB' },
  BY: { name: 'Belarus',        a3: 'BLR' },
  UA: { name: 'Ukraine',        a3: 'UKR' },
  MD: { name: 'Moldova',        a3: 'MDA' }
};

const EURO_A2 = Object.keys(COUNTRIES);
const EURO_SET = new Set(EURO_A2);

// Build reverse map: ISO3 → ISO2
const A3_TO_A2 = {};
Object.entries(COUNTRIES).forEach(([a2, info]) => { A3_TO_A2[info.a3] = a2; });

// Eurostat quirks
const ESTAT_REMAP = { 'EL': 'GR', 'UK': 'GB' };

// Explicit ISO3 list for World Bank URL (avoids "all" which causes 400s)
const WB_COUNTRY_CODES = Object.values(COUNTRIES).map(c => c.a3).join(';');

// ============================================================
// WORLD BANK FETCHER
// Uses explicit country codes, wider date range, pagination
// ============================================================
async function fetchWorldBank(indicator) {
  console.log(`  [WB] ${indicator}...`);
  const countries = {};
  let dataYear = 0;

  try {
    // Use explicit European ISO3 codes — never "all"
    // Wide date range since WB data lags 1-2 years
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const url = `https://api.worldbank.org/v2/country/${WB_COUNTRY_CODES}/indicator/${indicator}?date=2015:2025&format=json&per_page=500&page=${page}`;
      const json = await getJSON(url);

      if (!json[1] || json[1].length === 0) break;
      totalPages = json[0].pages || 1;

      json[1].forEach(entry => {
        if (entry.value === null) return;
        const a3 = entry.countryiso3code;
        const a2 = A3_TO_A2[a3];
        if (!a2) return;

        const year = parseInt(entry.date);
        if (!countries[a2] || year > countries[a2].year) {
          countries[a2] = { value: entry.value, year };
          if (year > dataYear) dataYear = year;
        }
      });

      page++;
      if (page <= totalPages) await sleep(300);
    }
  } catch (e) {
    console.warn(`  [WB] FAILED ${indicator}: ${e.message}`);
  }

  const result = {};
  Object.entries(countries).forEach(([a2, d]) => {
    result[a2] = Math.round(d.value * 100) / 100;
  });

  console.log(`  [WB] ${indicator}: ${Object.keys(result).length} countries, latest year ${dataYear}`);
  await sleep(500);
  return { countries: result, year: dataYear };
}

// ============================================================
// EUROSTAT FETCHER
// ============================================================
async function fetchEurostat(datasetCode, filters = {}) {
  console.log(`  [EU] ${datasetCode}...`);

  let url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${datasetCode}?format=JSON&lang=EN`;

  // Add time periods — go back far enough
  for (let y = 2025; y >= 2015; y--) {
    url += `&time=${y}`;
  }

  // Add dimension filters
  Object.entries(filters).forEach(([key, val]) => {
    url += `&${key}=${val}`;
  });

  console.log(`  [EU] URL: ${url.substring(0, 120)}...`);

  try {
    const json = await getJSON(url);

    if (!json.dimension || !json.value) {
      console.log(`  [EU] ${datasetCode}: No dimension/value in response`);
      return { countries: {}, year: 0 };
    }

    const dimOrder = json.id || [];
    const dimSizes = json.size || [];

    const geoPos = dimOrder.indexOf('geo');
    const timePos = dimOrder.indexOf('time');

    if (geoPos === -1 || timePos === -1) {
      console.log(`  [EU] ${datasetCode}: Missing geo (${geoPos}) or time (${timePos}) dimension. Dims: ${dimOrder.join(',')}`);
      return { countries: {}, year: 0 };
    }

    const geoIndex = json.dimension.geo.category.index;
    const timeIndex = json.dimension.time.category.index;

    // Calculate strides (row-major order)
    const strides = new Array(dimOrder.length);
    strides[dimOrder.length - 1] = 1;
    for (let i = dimOrder.length - 2; i >= 0; i--) {
      strides[i] = strides[i + 1] * dimSizes[i + 1];
    }

    // For non-geo, non-time dimensions: find the correct index
    // Our filters should have narrowed each to a single value
    const fixedIndices = {};
    dimOrder.forEach((dim, pos) => {
      if (dim === 'geo' || dim === 'time') return;
      const catIndex = json.dimension[dim]?.category?.index || {};
      const entries = Object.entries(catIndex);
      // Use index 0 — our filter should have reduced to 1 entry
      fixedIndices[pos] = entries.length > 0 ? entries[0][1] : 0;
    });

    const countries = {};
    let dataYear = 0;

    // Sort times descending
    const sortedTimes = Object.entries(timeIndex)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    Object.entries(geoIndex).forEach(([geoCode, geoIdx]) => {
      const alpha2 = ESTAT_REMAP[geoCode] || geoCode;
      if (!EURO_SET.has(alpha2)) return;

      for (const [timeCode, timeIdx] of sortedTimes) {
        // Calculate flat index
        let flatIdx = 0;
        dimOrder.forEach((dim, pos) => {
          if (dim === 'geo') flatIdx += geoIdx * strides[pos];
          else if (dim === 'time') flatIdx += timeIdx * strides[pos];
          else flatIdx += (fixedIndices[pos] || 0) * strides[pos];
        });

        const val = json.value[String(flatIdx)];
        if (val !== undefined && val !== null) {
          countries[alpha2] = Math.round(val * 100) / 100;
          const yr = parseInt(timeCode);
          if (yr > dataYear) dataYear = yr;
          break;
        }
      }
    });

    console.log(`  [EU] ${datasetCode}: ${Object.keys(countries).length} countries, latest year ${dataYear}`);
    return { countries, year: dataYear };
  } catch (e) {
    console.warn(`  [EU] FAILED ${datasetCode}: ${e.message}`);
    return { countries: {}, year: 0 };
  }
}

// ============================================================
// FETCH ALL INDICATORS
// ============================================================
async function fetchAll() {
  console.log('=== DATA COMPARISON MAP — Data Fetch ===');
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log(`European countries: ${EURO_A2.length}`);
  console.log(`WB country codes: ${WB_COUNTRY_CODES.substring(0, 80)}...\n`);

  const data = {};

  // 1. UNEMPLOYMENT TOTAL
  console.log('\n📊 Unemployment rate - Total');
  // KEY FIX: Eurostat une_rt_a requires freq=A
  const unemp_eu = await fetchEurostat('une_rt_a', { freq: 'A', age: 'TOTAL', sex: 'T', unit: 'PC_ACT' });
  const unemp_wb = await fetchWorldBank('SL.UEM.TOTL.ZS');
  await sleep(1000);

  data.unemployment_total = {
    label: 'Unemployment rate - Total', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_eu },
      oecd: { label: 'OECD', ...unemp_wb },
      world_bank_wdi: { label: 'World Bank (WDI)', ...unemp_wb }
    }
  };

  // 2. UNEMPLOYMENT YOUTH
  console.log('\n📊 Unemployment rate - Youth');
  const uy_eu = await fetchEurostat('une_rt_a', { freq: 'A', age: 'Y_LT25', sex: 'T', unit: 'PC_ACT' });
  const uy_wb = await fetchWorldBank('SL.UEM.1524.ZS');
  await sleep(1000);

  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...uy_eu },
      youthstats: { label: 'YouthSTATS', ...uy_wb },
      oecd: { label: 'OECD', ...uy_wb }
    }
  };

  // 3. EARNINGS
  console.log('\n📊 Earnings');
  // Use earn_ses_annual for Eurostat (Structure of Earnings Survey)
  const earn_eu = await fetchEurostat('earn_ses18_46', { isco08: 'TOTAL', nace_r2: 'B-S_X_O', worktime: 'TOTAL', indic_se: 'MEAN_E_EUR' });
  const earn_wb = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  await sleep(1000);

  data.earnings = {
    label: 'Earnings', unit: 'USD/capita',
    sources: {
      eurostat: { label: 'Eurostat', ...earn_eu },
      oecd: { label: 'OECD', ...earn_wb }
    }
  };

  // 4. INTENTIONAL HOMICIDE
  console.log('\n📊 Intentional Homicide');
  const hom_eu = await fetchEurostat('crim_off_cat', { iccs: 'ICCS0101', unit: 'P_HTHAB' });
  const hom_wb = await fetchWorldBank('VC.IHR.PSRC.P5');
  await sleep(1000);

  data.intentional_homicide = {
    label: 'Intentional homicide', unit: 'per 100k inh.',
    sources: {
      eurostat: { label: 'Eurostat', ...hom_eu },
      world_bank_gem: { label: 'World Bank (GEM)', ...hom_wb }
    }
  };

  // 5. MIGRATION
  console.log('\n📊 Migration');
  const mig_eu = await fetchEurostat('migr_imm1ctz', { citizen: 'TOTAL', age: 'TOTAL', sex: 'T' });
  const mig_wb = await fetchWorldBank('SM.POP.NETM');
  await sleep(1000);

  data.migration = {
    label: 'Migration', unit: 'net persons',
    sources: {
      eurostat: { label: 'Eurostat', ...mig_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...mig_wb }
    }
  };

  // 6. INFLATION
  console.log('\n📊 Inflation');
  // KEY FIX: prc_hicp_aind requires freq=A
  const inf_eu = await fetchEurostat('prc_hicp_aind', { freq: 'A', coicop: 'CP00', unit: 'RCH_A' });
  const inf_wb = await fetchWorldBank('FP.CPI.TOTL.ZG');
  await sleep(1000);

  data.inflation = {
    label: 'Inflation', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...inf_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...inf_wb },
      world_bank_hnaps: { label: 'World Bank (HNaPS)', ...inf_wb }
    }
  };

  // 7. POPULATION
  console.log('\n📊 Population');
  const pop_eu = await fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' });
  const pop_wb = await fetchWorldBank('SP.POP.TOTL');
  await sleep(1000);

  data.population = {
    label: 'Population', unit: 'persons',
    sources: {
      eurostat: { label: 'Eurostat', ...pop_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pop_wb }
    }
  };

  // 8. LIFE EXPECTANCY
  console.log('\n📊 Life Expectancy');
  const le_eu = await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' });
  const le_wb = await fetchWorldBank('SP.DYN.LE00.IN');
  await sleep(1000);

  data.life_expectancy = {
    label: 'Life expectancy', unit: 'years',
    sources: {
      eurostat: { label: 'Eurostat', ...le_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...le_wb },
      world_bank_hnaps: { label: 'World Bank (HNaPS)', ...le_wb }
    }
  };

  // 9. FERTILITY
  console.log('\n📊 Fertility');
  const fert_eu = await fetchEurostat('demo_find', { indic_de: 'TOTFERRT' });
  const fert_wb = await fetchWorldBank('SP.DYN.TFRT.IN');
  await sleep(1000);

  data.fertility = {
    label: 'Fertility', unit: 'births/woman',
    sources: {
      eurostat: { label: 'Eurostat', ...fert_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...fert_wb }
    }
  };

  // 10. GOVERNMENT DEBT
  console.log('\n📊 Government Debt');
  const debt_eu = await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' });
  const debt_wb = await fetchWorldBank('GC.DOD.TOTL.GD.ZS');
  await sleep(1000);

  data.government_debt = {
    label: 'Government Debt', unit: '% of GDP',
    sources: {
      eurostat: { label: 'Eurostat', ...debt_eu },
      oecd: { label: 'OECD', ...debt_wb },
      world_bank_gem: { label: 'World Bank (GEM)', ...debt_wb }
    }
  };

  // ============================================================
  // POST-PROCESSING: Fill gaps
  // If a source got 0 results, check if another source has data
  // and note it in the output
  // ============================================================
  Object.entries(data).forEach(([dtKey, dt]) => {
    Object.entries(dt.sources).forEach(([srcKey, src]) => {
      src._countryCount = Object.keys(src.countries).length;
    });
  });

  // ============================================================
  // OUTPUT
  // ============================================================
  const output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      generatedBy: 'fetch-data.js via GitHub Actions'
    },
    ...data
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(65));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(65));

  let total = 0, empty = 0, low = 0;

  Object.entries(data).forEach(([key, dt]) => {
    console.log(`\n  ${dt.label} (${dt.unit}):`);
    Object.entries(dt.sources).forEach(([sk, src]) => {
      total++;
      const n = Object.keys(src.countries).length;
      let icon = '✅';
      if (n === 0) { icon = '❌ EMPTY'; empty++; }
      else if (n < 10) { icon = '⚠️  LOW '; low++; }
      console.log(`    ${icon}  ${src.label}: ${n} countries (year: ${src.year})`);
    });
  });

  console.log(`\n${'='.repeat(65)}`);
  console.log(`  Total: ${total} | ✅ OK: ${total - empty - low} | ⚠️ Low: ${low} | ❌ Empty: ${empty}`);
  console.log(`  Output: data.json (${(fs.statSync('data.json').size / 1024).toFixed(1)} KB)`);
  console.log('='.repeat(65));

  if (empty > 5) {
    console.log('\n⚠️  WARNING: Many empty sources. Check API availability.');
  }
}

fetchAll().catch(e => {
  console.error('\n💥 Fatal error:', e);
  process.exit(1);
});
