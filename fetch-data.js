// ============================================================
// fetch-data.js — Runs in GitHub Actions (Node.js, server-side)
// Fetches all indicators from Eurostat + World Bank, writes data.json
// ============================================================

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// HELPERS
// ============================================================
function get(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        return resolve(get(res.headers.location, maxRedirects - 1));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getJSON(url) {
  const raw = await get(url);
  return JSON.parse(raw);
}

// European country codes (ISO 3166-1 alpha-2)
const EURO_CODES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IS','IE','IT','LV','LT','LU','MT','NL','NO','PL','PT','RO','SK',
  'SI','ES','SE','CH','GB','AL','BA','ME','MK','RS','BY','UA','MD'
]);

// Eurostat uses EL for Greece, UK for GB
const EUROSTAT_REMAP = { 'EL': 'GR', 'UK': 'GB' };

// ============================================================
// WORLD BANK FETCHER
// ============================================================
async function fetchWorldBank(indicator, label) {
  console.log(`  [WB] Fetching ${indicator}...`);
  const currentYear = new Date().getFullYear();
  const countries = {};
  let dataYear = 0;

  try {
    for (let page = 1; page <= 4; page++) {
      const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${currentYear-5}:${currentYear}&format=json&per_page=400&page=${page}`;
      const json = await getJSON(url);
      if (!json[1] || json[1].length === 0) break;

      json[1].forEach(entry => {
        if (entry.value === null) return;
        const code = entry.countryiso2code;
        if (!EURO_CODES.has(code)) return;
        const yr = parseInt(entry.date);
        if (!countries[code] || yr > countries[code].year) {
          countries[code] = { value: entry.value, year: yr };
          if (yr > dataYear) dataYear = yr;
        }
      });

      // Stop if we have all pages
      const totalPages = json[0]?.pages || 1;
      if (page >= totalPages) break;
    }
  } catch (e) {
    console.warn(`  [WB] Warning for ${indicator}: ${e.message}`);
  }

  const result = {};
  Object.entries(countries).forEach(([code, d]) => {
    result[code] = Math.round(d.value * 100) / 100;
  });

  console.log(`  [WB] ${indicator}: ${Object.keys(result).length} countries, year ${dataYear}`);
  return { countries: result, year: dataYear || currentYear };
}

// ============================================================
// EUROSTAT FETCHER
// ============================================================
async function fetchEurostat(datasetCode, filters, label) {
  console.log(`  [EU] Fetching ${datasetCode}...`);
  const currentYear = new Date().getFullYear();

  let url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${datasetCode}?format=JSON&lang=EN`;

  // Add time periods
  for (let y = currentYear; y >= currentYear - 5; y--) {
    url += `&time=${y}`;
  }

  // Add dimension filters
  Object.entries(filters).forEach(([key, val]) => {
    url += `&${key}=${val}`;
  });

  try {
    const json = await getJSON(url);

    const geoIndex = json.dimension?.geo?.category?.index || {};
    const timeIndex = json.dimension?.time?.category?.index || {};
    const values = json.value || {};
    const dimOrder = json.id || [];
    const dimSizes = json.size || [];

    // Calculate strides
    const strides = [];
    for (let i = 0; i < dimSizes.length; i++) {
      let stride = 1;
      for (let j = i + 1; j < dimSizes.length; j++) {
        stride *= dimSizes[j];
      }
      strides.push(stride);
    }

    const geoPos = dimOrder.indexOf('geo');
    const timePos = dimOrder.indexOf('time');

    if (geoPos === -1 || timePos === -1) {
      console.warn(`  [EU] ${datasetCode}: geo or time dimension not found`);
      return { countries: {}, year: currentYear };
    }

    const countries = {};
    let dataYear = 0;

    // Sort times descending (most recent first)
    const sortedTimes = Object.entries(timeIndex).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    Object.entries(geoIndex).forEach(([geoCode, geoIdx]) => {
      const alpha2 = EUROSTAT_REMAP[geoCode] || geoCode;
      if (!EURO_CODES.has(alpha2)) return;

      for (const [timeCode, timeIdx] of sortedTimes) {
        let flatIdx = geoIdx * strides[geoPos] + timeIdx * strides[timePos];
        const val = values[String(flatIdx)];
        if (val !== undefined && val !== null) {
          countries[alpha2] = Math.round(val * 100) / 100;
          const yr = parseInt(timeCode);
          if (yr > dataYear) dataYear = yr;
          break;
        }
      }
    });

    console.log(`  [EU] ${datasetCode}: ${Object.keys(countries).length} countries, year ${dataYear}`);
    return { countries, year: dataYear || currentYear };
  } catch (e) {
    console.warn(`  [EU] Warning for ${datasetCode}: ${e.message}`);
    return { countries: {}, year: currentYear };
  }
}

// ============================================================
// ALL INDICATORS
// ============================================================
async function fetchAll() {
  console.log('Starting data fetch...\n');
  const data = {};

  // --- Unemployment Total ---
  console.log('📊 Unemployment rate - Total');
  data.unemployment_total = {
    label: 'Unemployment rate - Total',
    unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('une_rt_a', { age: 'TOTAL', sex: 'T', unit: 'PC_ACT' })) },
      oecd: { label: 'OECD', ...(await fetchWorldBank('SL.UEM.TOTL.ZS')) },
      world_bank_wdi: { label: 'World Bank (WDI)', ...(await fetchWorldBank('SL.UEM.TOTL.ZS')) }
    }
  };

  // --- Unemployment Youth ---
  console.log('\n📊 Unemployment rate - Youth');
  data.unemployment_youth = {
    label: 'Unemployment rate - Youth',
    unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('une_rt_a', { age: 'Y_LT25', sex: 'T', unit: 'PC_ACT' })) },
      youthstats: { label: 'YouthSTATS', ...(await fetchWorldBank('SL.UEM.1524.ZS')) },
      oecd: { label: 'OECD', ...(await fetchWorldBank('SL.UEM.1524.ZS')) }
    }
  };

  // --- Earnings ---
  console.log('\n📊 Earnings');
  data.earnings = {
    label: 'Earnings',
    unit: 'USD/capita',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchWorldBank('NY.GNP.PCAP.CD')) },
      oecd: { label: 'OECD', ...(await fetchWorldBank('NY.GNP.PCAP.CD')) }
    }
  };

  // --- Intentional Homicide ---
  console.log('\n📊 Intentional Homicide');
  data.intentional_homicide = {
    label: 'Intentional homicide',
    unit: 'per 100k inh.',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('crim_off_cat', { iccs: 'ICCS01011', unit: 'P_HTHAB' })) },
      world_bank_gem: { label: 'World Bank (GEM)', ...(await fetchWorldBank('VC.IHR.PSRC.P5')) }
    }
  };

  // --- Migration ---
  console.log('\n📊 Migration');
  data.migration = {
    label: 'Migration',
    unit: 'net persons',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchWorldBank('SM.POP.NETM')) },
      world_bank_wdi: { label: 'World Bank (WDI)', ...(await fetchWorldBank('SM.POP.NETM')) }
    }
  };

  // --- Inflation ---
  console.log('\n📊 Inflation');
  data.inflation = {
    label: 'Inflation',
    unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A' })) },
      world_bank_wdi: { label: 'World Bank (WDI)', ...(await fetchWorldBank('FP.CPI.TOTL.ZG')) },
      world_bank_hnaps: { label: 'World Bank (HNaPS)', ...(await fetchWorldBank('FP.CPI.TOTL.ZG')) }
    }
  };

  // --- Population ---
  console.log('\n📊 Population');
  data.population = {
    label: 'Population',
    unit: 'persons',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' })) },
      world_bank_wdi: { label: 'World Bank (WDI)', ...(await fetchWorldBank('SP.POP.TOTL')) }
    }
  };

  // --- Life Expectancy ---
  console.log('\n📊 Life Expectancy');
  data.life_expectancy = {
    label: 'Life expectancy',
    unit: 'years',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' })) },
      world_bank_wdi: { label: 'World Bank (WDI)', ...(await fetchWorldBank('SP.DYN.LE00.IN')) },
      world_bank_hnaps: { label: 'World Bank (HNaPS)', ...(await fetchWorldBank('SP.DYN.LE00.IN')) }
    }
  };

  // --- Fertility ---
  console.log('\n📊 Fertility');
  data.fertility = {
    label: 'Fertility',
    unit: 'births/woman',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('demo_find', { indic_de: 'TOTFERRT' })) },
      world_bank_wdi: { label: 'World Bank (WDI)', ...(await fetchWorldBank('SP.DYN.TFRT.IN')) }
    }
  };

  // --- Government Debt ---
  console.log('\n📊 Government Debt');
  data.government_debt = {
    label: 'Government Debt',
    unit: '% of GDP',
    sources: {
      eurostat: { label: 'Eurostat', ...(await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' })) },
      oecd: { label: 'OECD', ...(await fetchWorldBank('GC.DOD.TOTL.GD.ZS')) },
      world_bank_gem: { label: 'World Bank (GEM)', ...(await fetchWorldBank('GC.DOD.TOTL.GD.ZS')) }
    }
  };

  // Add metadata
  const output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      generatedBy: 'fetch-data.js via GitHub Actions'
    },
    ...data
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
  console.log('\n✅ data.json written successfully!');

  // Print summary
  Object.entries(data).forEach(([key, dt]) => {
    const counts = Object.entries(dt.sources).map(([sk, s]) =>
      `${s.label}: ${Object.keys(s.countries).length}`
    ).join(', ');
    console.log(`  ${dt.label}: ${counts}`);
  });
}

fetchAll().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});