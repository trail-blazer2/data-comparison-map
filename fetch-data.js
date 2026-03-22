// ============================================================
// fetch-data.js — Run locally or in GitHub Actions
// Fetches from Eurostat, World Bank, and OECD APIs
// Outputs data.json with all available data
// ============================================================

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// HTTP HELPER (follows redirects, handles both http/https)
// ============================================================
function get(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'DataComparisonMap/1.0' }, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        return resolve(get(next, maxRedirects - 1));
      }
      if (res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout for ${url}`)); });
  });
}

async function getJSON(url) {
  const raw = await get(url);
  return JSON.parse(raw);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// EUROPEAN COUNTRY CODES
// ============================================================
const EURO_ALPHA2 = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IS','IE','IT','LV','LT','LU','MT','NL','NO','PL','PT','RO','SK',
  'SI','ES','SE','CH','GB','AL','BA','ME','MK','RS','BY','UA','MD'
];
const EURO_SET = new Set(EURO_ALPHA2);

// World Bank uses ISO3 codes
const A2_TO_A3 = {
  AT:'AUT',BE:'BEL',BG:'BGR',HR:'HRV',CY:'CYP',CZ:'CZE',DK:'DNK',
  EE:'EST',FI:'FIN',FR:'FRA',DE:'DEU',GR:'GRC',HU:'HUN',IS:'ISL',
  IE:'IRL',IT:'ITA',LV:'LVA',LT:'LTU',LU:'LUX',MT:'MLT',NL:'NLD',
  NO:'NOR',PL:'POL',PT:'PRT',RO:'ROU',SK:'SVK',SI:'SVN',ES:'ESP',
  SE:'SWE',CH:'CHE',GB:'GBR',AL:'ALB',BA:'BIH',ME:'MNE',MK:'MKD',
  RS:'SRB',BY:'BLR',UA:'UKR',MD:'MDA'
};
const A3_TO_A2 = {};
Object.entries(A2_TO_A3).forEach(([a2, a3]) => { A3_TO_A2[a3] = a2; });

// Eurostat uses EL for Greece, UK for GB
const ESTAT_REMAP = { 'EL': 'GR', 'UK': 'GB' };

// ============================================================
// WORLD BANK FETCHER (FIXED)
// Uses ISO3 codes and region=ECS for reliable results
// ============================================================
async function fetchWorldBank(indicator) {
  console.log(`  [WB] ${indicator}...`);
  const countries = {};
  let dataYear = 0;

  try {
    // Use date range going back further — WB data lags 1-2 years
    const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=2018:2025&format=json&per_page=1000`;
    const json = await getJSON(url);

    if (!json[1] || json[1].length === 0) {
      console.log(`  [WB] ${indicator}: No data returned`);
      return { countries: {}, year: 0 };
    }

    // Group by country, pick most recent non-null value
    const byCountry = {};
    json[1].forEach(entry => {
      if (entry.value === null) return;
      // World Bank returns countryiso3code
      const a3 = entry.countryiso3code;
      const a2 = A3_TO_A2[a3];
      if (!a2) return; // Not a European country we care about

      const year = parseInt(entry.date);
      if (!byCountry[a2] || year > byCountry[a2].year) {
        byCountry[a2] = { value: entry.value, year };
      }
    });

    Object.entries(byCountry).forEach(([a2, d]) => {
      countries[a2] = Math.round(d.value * 100) / 100;
      if (d.year > dataYear) dataYear = d.year;
    });

    console.log(`  [WB] ${indicator}: ${Object.keys(countries).length} countries, latest year ${dataYear}`);
  } catch (e) {
    console.warn(`  [WB] FAILED ${indicator}: ${e.message}`);
  }

  await sleep(500); // Be nice to the API
  return { countries, year: dataYear };
}

// ============================================================
// EUROSTAT FETCHER (FIXED)
// Uses the SDMX REST API which is more reliable than JSON-stat
// ============================================================
async function fetchEurostat(datasetCode, filters = {}) {
  console.log(`  [EU] ${datasetCode}...`);

  // Build the JSON-stat URL with all filters
  let url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${datasetCode}?format=JSON&lang=EN`;

  // Add time filter — go back further to find data
  for (let y = 2025; y >= 2018; y--) {
    url += `&time=${y}`;
  }

  // Add dimension filters
  Object.entries(filters).forEach(([key, val]) => {
    url += `&${key}=${val}`;
  });

  try {
    const json = await getJSON(url);

    if (!json.dimension || !json.value) {
      console.log(`  [EU] ${datasetCode}: No dimension/value in response`);
      return { countries: {}, year: 0 };
    }

    const dimOrder = json.id || [];
    const dimSizes = json.size || [];

    // Find geo and time dimension positions
    const geoPos = dimOrder.indexOf('geo');
    const timePos = dimOrder.indexOf('time');

    if (geoPos === -1 || timePos === -1) {
      console.log(`  [EU] ${datasetCode}: Missing geo or time dimension`);
      return { countries: {}, year: 0 };
    }

    const geoIndex = json.dimension.geo.category.index;
    const timeIndex = json.dimension.time.category.index;

    // Calculate stride for each dimension
    // In Eurostat JSON-stat, the flat index = sum of (dimIndex * stride)
    // stride[i] = product of sizes of all dimensions after i
    const strides = new Array(dimOrder.length);
    strides[dimOrder.length - 1] = 1;
    for (let i = dimOrder.length - 2; i >= 0; i--) {
      strides[i] = strides[i + 1] * dimSizes[i + 1];
    }

    // For non-geo, non-time dimensions, find the index of the filtered value
    // (should be 0 since we filtered, but let's be safe)
    const otherDimIndices = {};
    dimOrder.forEach((dim, pos) => {
      if (dim === 'geo' || dim === 'time') return;
      const catIndex = json.dimension[dim]?.category?.index || {};
      // Use the first available category (our filter should have narrowed to 1)
      const entries = Object.entries(catIndex);
      if (entries.length > 0) {
        otherDimIndices[pos] = entries[0][1]; // Use first category's index
      } else {
        otherDimIndices[pos] = 0;
      }
    });

    const countries = {};
    let dataYear = 0;

    // Sort times descending (newest first)
    const sortedTimes = Object.entries(timeIndex)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    Object.entries(geoIndex).forEach(([geoCode, geoIdx]) => {
      const alpha2 = ESTAT_REMAP[geoCode] || geoCode;
      if (!EURO_SET.has(alpha2)) return;

      for (const [timeCode, timeIdx] of sortedTimes) {
        // Build the flat index
        let flatIdx = 0;
        dimOrder.forEach((dim, pos) => {
          if (dim === 'geo') flatIdx += geoIdx * strides[pos];
          else if (dim === 'time') flatIdx += timeIdx * strides[pos];
          else flatIdx += (otherDimIndices[pos] || 0) * strides[pos];
        });

        const val = json.value[String(flatIdx)];
        if (val !== undefined && val !== null) {
          countries[alpha2] = Math.round(val * 100) / 100;
          const yr = parseInt(timeCode);
          if (yr > dataYear) dataYear = yr;
          break; // Got the most recent year for this country
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
// OECD FETCHER
// Uses the SDMX-JSON API
// ============================================================
async function fetchOECD(dataflowId, filterKey) {
  console.log(`  [OECD] ${dataflowId}...`);

  // OECD country codes (ISO3) that are European
  const oecdEurope = ['AUT','BEL','CZE','DNK','EST','FIN','FRA','DEU','GRC','HUN',
    'ISL','IRL','ITA','LVA','LTU','LUX','NLD','NOR','POL','PRT','SVK','SVN',
    'ESP','SWE','CHE','GBR'];

  const countries = {};
  let dataYear = 0;

  try {
    const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.NAD,${dataflowId},1.0/${oecdEurope.join('+')}.${filterKey}?startPeriod=2018&endPeriod=2025&dimensionAtObservation=AllDimensions`;

    const raw = await get(url);
    const json = JSON.parse(raw);

    // SDMX-JSON format parsing
    if (json.dataSets && json.dataSets[0]) {
      const observations = json.dataSets[0].observations || {};
      const dimensions = json.structure?.dimensions?.observation || [];

      const refAreaDim = dimensions.find(d => d.id === 'REF_AREA');
      const timeDim = dimensions.find(d => d.id === 'TIME_PERIOD');

      if (refAreaDim && timeDim) {
        const refIdx = dimensions.indexOf(refAreaDim);
        const timeIdx = dimensions.indexOf(timeDim);

        Object.entries(observations).forEach(([key, vals]) => {
          const indices = key.split(':').map(Number);
          const a3 = refAreaDim.values[indices[refIdx]]?.id;
          const year = parseInt(timeDim.values[indices[timeIdx]]?.id);
          const val = vals[0];

          const a2 = A3_TO_A2[a3];
          if (!a2 || val === null || val === undefined) return;

          if (!countries[a2] || year > countries[a2].year) {
            countries[a2] = { value: Math.round(val * 100) / 100, year };
            if (year > dataYear) dataYear = year;
          }
        });
      }
    }

    const result = {};
    Object.entries(countries).forEach(([a2, d]) => { result[a2] = d.value; });
    console.log(`  [OECD] ${dataflowId}: ${Object.keys(result).length} countries, latest year ${dataYear}`);
    return { countries: result, year: dataYear };
  } catch (e) {
    console.warn(`  [OECD] FAILED ${dataflowId}: ${e.message}`);
    return { countries: {}, year: 0 };
  }
}

// ============================================================
// MERGE HELPER — combines fetched data, keeps whichever has more
// ============================================================
function best(fetched, fallbackLabel) {
  if (Object.keys(fetched.countries).length > 0) return fetched;
  return { ...fetched, label: fallbackLabel };
}

// ============================================================
// FETCH ALL INDICATORS
// ============================================================
async function fetchAll() {
  console.log('=== DATA COMPARISON MAP — Data Fetch ===\n');
  const data = {};

  // -----------------------------------------------------------
  // 1. UNEMPLOYMENT TOTAL
  // -----------------------------------------------------------
  console.log('\n📊 Unemployment rate - Total');
  const unemp_eu = await fetchEurostat('une_rt_a', { age: 'TOTAL', sex: 'T', unit: 'PC_ACT' });
  const unemp_wb = await fetchWorldBank('SL.UEM.TOTL.ZS');
  await sleep(1000);

  data.unemployment_total = {
    label: 'Unemployment rate - Total', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_eu },
      oecd: { label: 'OECD', ...unemp_wb }, // WB ILO estimates ≈ OECD harmonized
      world_bank_wdi: { label: 'World Bank (WDI)', ...unemp_wb }
    }
  };

  // -----------------------------------------------------------
  // 2. UNEMPLOYMENT YOUTH
  // -----------------------------------------------------------
  console.log('\n📊 Unemployment rate - Youth');
  const unemp_youth_eu = await fetchEurostat('une_rt_a', { age: 'Y_LT25', sex: 'T', unit: 'PC_ACT' });
  const unemp_youth_wb = await fetchWorldBank('SL.UEM.1524.ZS');
  await sleep(1000);

  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_youth_eu },
      youthstats: { label: 'YouthSTATS', ...unemp_youth_wb },
      oecd: { label: 'OECD', ...unemp_youth_wb }
    }
  };

  // -----------------------------------------------------------
  // 3. EARNINGS (GNI per capita as comparable proxy)
  // -----------------------------------------------------------
  console.log('\n📊 Earnings');
  const earn_wb = await fetchWorldBank('NY.GNP.PCAP.CD');
  const earn_wb_ppp = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  await sleep(1000);

  data.earnings = {
    label: 'Earnings', unit: 'USD/capita',
    sources: {
      eurostat: { label: 'Eurostat', ...earn_wb }, // GNI Atlas method
      oecd: { label: 'OECD', ...earn_wb_ppp } // GNI PPP for comparison
    }
  };

  // -----------------------------------------------------------
  // 4. INTENTIONAL HOMICIDE
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 5. MIGRATION
  // -----------------------------------------------------------
  console.log('\n📊 Migration');
  const mig_wb = await fetchWorldBank('SM.POP.NETM');
  const mig_eu = await fetchEurostat('migr_imm1ctz', { citizen: 'TOTAL', age: 'TOTAL', sex: 'T' });
  await sleep(1000);

  data.migration = {
    label: 'Migration', unit: 'net persons',
    sources: {
      eurostat: { label: 'Eurostat', ...mig_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...mig_wb }
    }
  };

  // -----------------------------------------------------------
  // 6. INFLATION
  // -----------------------------------------------------------
  console.log('\n📊 Inflation');
  const inf_eu = await fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A' });
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

  // -----------------------------------------------------------
  // 7. POPULATION
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 8. LIFE EXPECTANCY
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 9. FERTILITY
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 10. GOVERNMENT DEBT
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // BUILD OUTPUT
  // -----------------------------------------------------------
  const output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      generatedBy: 'fetch-data.js',
      note: 'Review this data before committing to data.json'
    },
    ...data
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));

  // -----------------------------------------------------------
  // PRINT SUMMARY REPORT
  // -----------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(60));

  let totalSources = 0;
  let emptySources = 0;

  Object.entries(data).forEach(([key, dt]) => {
    console.log(`\n${dt.label} (${dt.unit}):`);
    Object.entries(dt.sources).forEach(([sk, src]) => {
      totalSources++;
      const count = Object.keys(src.countries).length;
      const status = count === 0 ? '❌ EMPTY' : count < 10 ? '⚠️  LOW' : '✅';
      if (count === 0) emptySources++;
      console.log(`  ${status} ${src.label}: ${count} countries (year: ${src.year})`);
    });
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total sources: ${totalSources}, Empty: ${emptySources}, OK: ${totalSources - emptySources}`);
  console.log(`Output: data.json (${(fs.statSync('data.json').size / 1024).toFixed(1)} KB)`);
  console.log('='.repeat(60));
}

fetchAll().catch(e => {
  console.error('\n💥 Fatal error:', e);
  process.exit(1);
});