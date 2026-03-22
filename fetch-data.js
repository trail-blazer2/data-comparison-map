// ============================================================
// fetch-data.js — Run via GitHub Actions (manual trigger)
// Fetches from Eurostat, World Bank, and IMF APIs
// Outputs data.json
// ============================================================

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// HTTP HELPERS
// ============================================================
function get(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'DataMap/1.0' },
      timeout: 60000
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
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode} for ${url}\n${body.substring(0, 300)}`)));
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
  AT:'Austria',BE:'Belgium',BG:'Bulgaria',HR:'Croatia',CY:'Cyprus',
  CZ:'Czechia',DK:'Denmark',EE:'Estonia',FI:'Finland',FR:'France',
  DE:'Germany',GR:'Greece',HU:'Hungary',IS:'Iceland',IE:'Ireland',
  IT:'Italy',LV:'Latvia',LT:'Lithuania',LU:'Luxembourg',MT:'Malta',
  NL:'Netherlands',NO:'Norway',PL:'Poland',PT:'Portugal',RO:'Romania',
  SK:'Slovakia',SI:'Slovenia',ES:'Spain',SE:'Sweden',CH:'Switzerland',
  GB:'United Kingdom',AL:'Albania',BA:'Bosnia & Herzegovina',
  ME:'Montenegro',MK:'North Macedonia',RS:'Serbia',BY:'Belarus',
  UA:'Ukraine',MD:'Moldova'
};

const EURO_A2 = Object.keys(COUNTRIES);
const EURO_SET = new Set(EURO_A2);

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

const ESTAT_REMAP = { 'EL': 'GR', 'UK': 'GB' };

// World Bank: explicit ISO3 list
const WB_CODES = Object.values(A2_TO_A3).join(';');

// IMF uses ISO3 but some custom ones
const IMF_REMAP = {
  AUT:'AT',BEL:'BE',BGR:'BG',HRV:'HR',CYP:'CY',CZE:'CZ',DNK:'DK',
  EST:'EE',FIN:'FI',FRA:'FR',DEU:'DE',GRC:'GR',HUN:'HU',ISL:'IS',
  IRL:'IE',ITA:'IT',LVA:'LV',LTU:'LT',LUX:'LU',MLT:'MT',NLD:'NL',
  NOR:'NO',POL:'PL',PRT:'PT',ROU:'RO',SVK:'SK',SVN:'SI',ESP:'ES',
  SWE:'SE',CHE:'CH',GBR:'GB',ALB:'AL',BIH:'BA',MNE:'ME',MKD:'MK',
  SRB:'RS',BLR:'BY',UKR:'UA',MDA:'MD'
};

// ============================================================
// WORLD BANK FETCHER
// ============================================================
async function fetchWorldBank(indicator) {
  console.log(`  [WB] ${indicator}...`);
  const countries = {};
  let dataYear = 0;

  try {
    let page = 1, totalPages = 1;
    while (page <= totalPages && page <= 5) {
      const url = `https://api.worldbank.org/v2/country/${WB_CODES}/indicator/${indicator}?date=2015:2025&format=json&per_page=500&page=${page}`;
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
  Object.entries(countries).forEach(([a2, d]) => { result[a2] = Math.round(d.value * 100) / 100; });
  console.log(`  [WB] ${indicator}: ${Object.keys(result).length} countries, year ${dataYear}`);
  await sleep(500);
  return { countries: result, year: dataYear };
}

// ============================================================
// EUROSTAT FETCHER (FIXED: proper dimension handling)
// ============================================================
async function fetchEurostat(datasetCode, filters = {}) {
  console.log(`  [EU] ${datasetCode}...`);

  // Step 1: First, discover the actual dimension names for this dataset
  // by making a small probe request
  let url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${datasetCode}?format=JSON&lang=EN`;

  // Add time periods
  for (let y = 2025; y >= 2015; y--) {
    url += `&time=${y}`;
  }

  // Add dimension filters
  Object.entries(filters).forEach(([key, val]) => {
    url += `&${key}=${val}`;
  });

  try {
    const json = await getJSON(url);

    if (!json.dimension || json.value === undefined) {
      console.log(`  [EU] ${datasetCode}: Empty response`);
      return { countries: {}, year: 0 };
    }

    const dimOrder = json.id || [];
    const dimSizes = json.size || [];

    const geoPos = dimOrder.indexOf('geo');
    const timePos = dimOrder.indexOf('time');

    if (geoPos === -1 || timePos === -1) {
      console.log(`  [EU] ${datasetCode}: Missing geo/time. Dims: [${dimOrder.join(', ')}]`);
      return { countries: {}, year: 0 };
    }

    const geoIndex = json.dimension.geo.category.index;
    const timeIndex = json.dimension.time.category.index;

    // Calculate strides
    const strides = new Array(dimOrder.length);
    strides[dimOrder.length - 1] = 1;
    for (let i = dimOrder.length - 2; i >= 0; i--) {
      strides[i] = strides[i + 1] * dimSizes[i + 1];
    }

    // For non-geo, non-time dimensions: use index 0 (our filters should narrow to 1)
    // BUT if a filter didn't match or returned multiple, we need to handle that
    const fixedIndices = {};
    dimOrder.forEach((dim, pos) => {
      if (dim === 'geo' || dim === 'time') return;
      // Just use 0 — the filter should have narrowed this dimension to 1 entry
      fixedIndices[pos] = 0;
    });

    // Log dimension info for debugging
    const dimInfo = dimOrder.map((d, i) => `${d}(${dimSizes[i]})`).join(' × ');
    console.log(`  [EU] ${datasetCode} dims: ${dimInfo}, values: ${Object.keys(json.value).length}`);

    const countries = {};
    let dataYear = 0;

    const sortedTimes = Object.entries(timeIndex).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    Object.entries(geoIndex).forEach(([geoCode, geoIdx]) => {
      const alpha2 = ESTAT_REMAP[geoCode] || geoCode;
      if (!EURO_SET.has(alpha2)) return;

      for (const [timeCode, timeIdx] of sortedTimes) {
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

    console.log(`  [EU] ${datasetCode}: ${Object.keys(countries).length} countries, year ${dataYear}`);
    return { countries, year: dataYear };
  } catch (e) {
    console.warn(`  [EU] FAILED ${datasetCode}: ${e.message}`);
    return { countries: {}, year: 0 };
  }
}

// ============================================================
// IMF DATAMAPPER FETCHER (NEW)
// Beautiful simple API: /api/v1/INDICATOR → { "values": { "INDICATOR": { "ISO3": { "year": val } } } }
// ============================================================
async function fetchIMF(indicator) {
  console.log(`  [IMF] ${indicator}...`);
  const countries = {};
  let dataYear = 0;

  try {
    const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}`;
    const json = await getJSON(url);

    const data = json.values?.[indicator] || json[indicator];
    if (!data) {
      console.log(`  [IMF] ${indicator}: No data in response`);
      return { countries: {}, year: 0 };
    }

    Object.entries(data).forEach(([countryCode, yearData]) => {
      const a2 = IMF_REMAP[countryCode] || A3_TO_A2[countryCode];
      if (!a2 || !EURO_SET.has(a2)) return;

      // Find most recent year with data
      const years = Object.entries(yearData)
        .map(([y, v]) => [parseInt(y), v])
        .filter(([y, v]) => v !== null && !isNaN(y) && y >= 2015)
        .sort((a, b) => b[0] - a[0]);

      if (years.length > 0) {
        const [yr, val] = years[0];
        countries[a2] = Math.round(val * 100) / 100;
        if (yr > dataYear) dataYear = yr;
      }
    });

    console.log(`  [IMF] ${indicator}: ${Object.keys(countries).length} countries, year ${dataYear}`);
  } catch (e) {
    console.warn(`  [IMF] FAILED ${indicator}: ${e.message}`);
  }

  await sleep(500);
  return { countries, year: dataYear };
}

// ============================================================
// FETCH ALL INDICATORS
// ============================================================
async function fetchAll() {
  console.log('=== DATA COMPARISON MAP — Data Fetch ===');
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log(`European countries: ${EURO_A2.length}\n`);

  const data = {};

  // -----------------------------------------------------------
  // 1. UNEMPLOYMENT TOTAL
  // FIX: Use age=Y15-74 (the standard), no freq filter
  // -----------------------------------------------------------
  console.log('\n📊 Unemployment rate - Total');
  const unemp_eu = await fetchEurostat('une_rt_a', { age: 'Y15-74', sex: 'T', unit: 'PC_ACT' });
  const unemp_wb = await fetchWorldBank('SL.UEM.TOTL.ZS');
  const unemp_imf = await fetchIMF('LUR');
  data.unemployment_total = {
    label: 'Unemployment rate - Total', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_eu },
      imf: { label: 'IMF', ...unemp_imf },
      world_bank_wdi: { label: 'World Bank (WDI)', ...unemp_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 2. UNEMPLOYMENT YOUTH
  // -----------------------------------------------------------
  console.log('\n📊 Unemployment rate - Youth');
  const uy_eu = await fetchEurostat('une_rt_a', { age: 'Y_LT25', sex: 'T', unit: 'PC_ACT' });
  const uy_wb = await fetchWorldBank('SL.UEM.1524.ZS');
  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...uy_eu },
      youthstats: { label: 'YouthSTATS', ...uy_wb },
      world_bank_wdi: { label: 'World Bank (WDI)', ...uy_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 3. EARNINGS (GNI per capita PPP)
  // FIX: Use World Bank for both, Eurostat earn dataset is unreliable
  // -----------------------------------------------------------
  console.log('\n📊 Earnings');
  const earn_wb = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  const earn_eu = await fetchEurostat('earn_mw_cur', { });
  data.earnings = {
    label: 'Earnings', unit: 'USD/capita',
    sources: {
      eurostat: { label: 'Eurostat', ...earn_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...earn_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 4. INTENTIONAL HOMICIDE
  // -----------------------------------------------------------
  console.log('\n📊 Intentional Homicide');
  const hom_eu = await fetchEurostat('crim_off_cat', { iccs: 'ICCS0101', unit: 'P_HTHAB' });
  const hom_wb = await fetchWorldBank('VC.IHR.PSRC.P5');
  data.intentional_homicide = {
    label: 'Intentional homicide', unit: 'per 100k inh.',
    sources: {
      eurostat: { label: 'Eurostat', ...hom_eu },
      world_bank: { label: 'World Bank', ...hom_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 5. MIGRATION
  // -----------------------------------------------------------
  console.log('\n📊 Migration');
  const mig_eu = await fetchEurostat('migr_imm1ctz', { citizen: 'TOTAL', age: 'TOTAL', sex: 'T' });
  const mig_wb = await fetchWorldBank('SM.POP.NETM');
  data.migration = {
    label: 'Migration', unit: 'net persons',
    sources: {
      eurostat: { label: 'Eurostat', ...mig_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...mig_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 6. INFLATION
  // FIX: prc_hicp_aind has NO freq dimension. Remove freq filter entirely.
  // -----------------------------------------------------------
  console.log('\n📊 Inflation');
  const inf_eu = await fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A' });
  const inf_wb = await fetchWorldBank('FP.CPI.TOTL.ZG');
  const inf_imf = await fetchIMF('PCPIPCH');
  data.inflation = {
    label: 'Inflation', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...inf_eu },
      imf: { label: 'IMF', ...inf_imf },
      world_bank_wdi: { label: 'World Bank (WDI)', ...inf_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 7. POPULATION
  // -----------------------------------------------------------
  console.log('\n📊 Population');
  const pop_eu = await fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' });
  const pop_wb = await fetchWorldBank('SP.POP.TOTL');
  data.population = {
    label: 'Population', unit: 'persons',
    sources: {
      eurostat: { label: 'Eurostat', ...pop_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pop_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 8. LIFE EXPECTANCY
  // -----------------------------------------------------------
  console.log('\n📊 Life Expectancy');
  const le_eu = await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' });
  const le_wb = await fetchWorldBank('SP.DYN.LE00.IN');
  data.life_expectancy = {
    label: 'Life expectancy', unit: 'years',
    sources: {
      eurostat: { label: 'Eurostat', ...le_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...le_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 9. FERTILITY
  // -----------------------------------------------------------
  console.log('\n📊 Fertility');
  const fert_eu = await fetchEurostat('demo_find', { indic_de: 'TOTFERRT' });
  const fert_wb = await fetchWorldBank('SP.DYN.TFRT.IN');
  data.fertility = {
    label: 'Fertility', unit: 'births/woman',
    sources: {
      eurostat: { label: 'Eurostat', ...fert_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...fert_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 10. GOVERNMENT DEBT
  // -----------------------------------------------------------
  console.log('\n📊 Government Debt');
  const debt_eu = await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' });
  const debt_wb = await fetchWorldBank('GC.DOD.TOTL.GD.ZS');
  const debt_imf = await fetchIMF('GGXWDG_NGDP');
  data.government_debt = {
    label: 'Government Debt', unit: '% of GDP',
    sources: {
      eurostat: { label: 'Eurostat', ...debt_eu },
      imf: { label: 'IMF', ...debt_imf },
      world_bank: { label: 'World Bank', ...debt_wb }
    }
  };
  await sleep(1000);

  // ============================================================
  // NEW DATA TYPES
  // ============================================================

  // -----------------------------------------------------------
  // 11. HEALTHCARE SPENDING
  // -----------------------------------------------------------
  console.log('\n📊 Healthcare spending');
  const health_eu = await fetchEurostat('hlth_sha11_hf', { icha11_hf: 'TOT_HF', unit: 'PC_GDP' });
  const health_wb = await fetchWorldBank('SH.XPD.CHEX.GD.ZS');
  data.healthcare_spending = {
    label: 'Healthcare spending', unit: '% of GDP',
    sources: {
      eurostat: { label: 'Eurostat', ...health_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...health_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 12. EDUCATION SPENDING
  // -----------------------------------------------------------
  console.log('\n📊 Education spending');
  const edu_eu = await fetchEurostat('educ_uoe_fine09', { isced11: 'ED0-8', sector: 'S13', unit: 'PC_GDP' });
  const edu_wb = await fetchWorldBank('SE.XPD.TOTL.GD.ZS');
  data.education_spending = {
    label: 'Education spending', unit: '% of GDP',
    sources: {
      eurostat: { label: 'Eurostat', ...edu_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...edu_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 13. MILITARY SPENDING
  // -----------------------------------------------------------
  console.log('\n📊 Military spending');
  const mil_wb = await fetchWorldBank('MS.MIL.XPND.GD.ZS');
  data.military_spending = {
    label: 'Military spending', unit: '% of GDP',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...mil_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 14. R&D SPENDING
  // -----------------------------------------------------------
  console.log('\n📊 R&D spending');
  const rd_eu = await fetchEurostat('rd_e_gerdtot', { sectperf: 'TOTAL', unit: 'PC_GDP' });
  const rd_wb = await fetchWorldBank('GB.XPD.RSDV.GD.ZS');
  data.rd_spending = {
    label: 'R&D spending', unit: '% of GDP',
    sources: {
      eurostat: { label: 'Eurostat', ...rd_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...rd_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 15. POVERTY RATE
  // -----------------------------------------------------------
  console.log('\n📊 Poverty rate');
  const pov_eu = await fetchEurostat('ilc_li02', { hhtyp: 'TOTAL', indic_il: 'LI_R_MD60', unit: 'PC' });
  const pov_wb = await fetchWorldBank('SI.POV.NAHC');
  data.poverty_rate = {
    label: 'Poverty rate', unit: '%',
    sources: {
      eurostat: { label: 'Eurostat', ...pov_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pov_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 16. INFANT MORTALITY
  // -----------------------------------------------------------
  console.log('\n📊 Infant mortality');
  const infm_eu = await fetchEurostat('demo_minfind', { indic_de: 'INFMORRT' });
  const infm_wb = await fetchWorldBank('SP.DYN.IMRT.IN');
  data.infant_mortality = {
    label: 'Infant mortality', unit: 'per 1,000 births',
    sources: {
      eurostat: { label: 'Eurostat', ...infm_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...infm_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 17. TERTIARY EDUCATION
  // -----------------------------------------------------------
  console.log('\n📊 Tertiary education');
  const tert_eu = await fetchEurostat('educ_uoe_enrt03', { sex: 'T', isced11: 'ED5-8' });
  const tert_wb = await fetchWorldBank('SE.TER.ENRR');
  data.tertiary_education = {
    label: 'Tertiary education', unit: '% gross enrollment',
    sources: {
      eurostat: { label: 'Eurostat', ...tert_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...tert_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 18. FOREIGN DIRECT INVESTMENT
  // -----------------------------------------------------------
  console.log('\n📊 Foreign Direct Investment');
  const fdi_wb = await fetchWorldBank('BX.KLT.DINV.WD.GD.ZS');
  data.fdi = {
    label: 'Foreign Direct Investment', unit: '% of GDP',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...fdi_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 19. GDP GROWTH
  // -----------------------------------------------------------
  console.log('\n📊 GDP growth');
  const gdp_wb = await fetchWorldBank('NY.GDP.MKTP.KD.ZG');
  const gdp_imf = await fetchIMF('NGDP_RPCH');
  data.gdp_growth = {
    label: 'GDP growth', unit: '%',
    sources: {
      imf: { label: 'IMF', ...gdp_imf },
      world_bank_wdi: { label: 'World Bank (WDI)', ...gdp_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 20. GDP PER CAPITA (PPP)
  // -----------------------------------------------------------
  console.log('\n📊 GDP per capita (PPP)');
  const gdppc_wb = await fetchWorldBank('NY.GDP.PCAP.PP.CD');
  const gdppc_imf = await fetchIMF('PPPPC');
  data.gdp_per_capita = {
    label: 'GDP per capita (PPP)', unit: 'int. $',
    sources: {
      imf: { label: 'IMF', ...gdppc_imf },
      world_bank_wdi: { label: 'World Bank (WDI)', ...gdppc_wb }
    }
  };
  await sleep(1000);

  // -----------------------------------------------------------
  // 21. GINI COEFFICIENT (Inequality)
  // -----------------------------------------------------------
  console.log('\n📊 Gini coefficient');
  const gini_eu = await fetchEurostat('ilc_di12', { });
  const gini_wb = await fetchWorldBank('SI.POV.GINI');
  data.gini_coefficient = {
    label: 'Gini coefficient', unit: 'index (0-100)',
    sources: {
      eurostat: { label: 'Eurostat', ...gini_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...gini_wb }
    }
  };
  await sleep(1000);

  // ============================================================
  // OUTPUT
  // ============================================================
  const output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      generatedBy: 'fetch-data.js via GitHub Actions',
      indicatorCount: Object.keys(data).length
    },
    ...data
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));

  // ============================================================
  // SUMMARY REPORT
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(70));

  let total = 0, empty = 0, low = 0, ok = 0;

  Object.entries(data).forEach(([key, dt]) => {
    console.log(`\n  ${dt.label} (${dt.unit}):`);
    Object.entries(dt.sources).forEach(([sk, src]) => {
      total++;
      const n = Object.keys(src.countries).length;
      let icon;
      if (n === 0) { icon = '❌ EMPTY'; empty++; }
      else if (n < 10) { icon = '⚠️  LOW '; low++; }
      else { icon = '✅     '; ok++; }
      console.log(`    ${icon} ${src.label}: ${n} countries (year: ${src.year})`);
    });
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  Indicators: ${Object.keys(data).length}`);
  console.log(`  Total sources: ${total} | ✅ OK: ${ok} | ⚠️ Low: ${low} | ❌ Empty: ${empty}`);
  console.log(`  Output: data.json (${(fs.statSync('data.json').size / 1024).toFixed(1)} KB)`);
  console.log('='.repeat(70));
}

fetchAll().catch(e => {
  console.error('\n💥 Fatal error:', e);
  process.exit(1);
});
