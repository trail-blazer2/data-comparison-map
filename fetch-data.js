// ============================================================
// fetch-data.js — Run via GitHub Actions (manual trigger)
// Fetches from Eurostat + World Bank + OECD + ILO APIs
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
      headers: { 'Accept': 'application/vnd.sdmx.data+json;version=2.0.0, application/json', 'User-Agent': 'DataMap/1.0' },
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
        res.on('end', () => reject(new Error('HTTP ' + res.statusCode + ' for ' + url + '\n' + body.substring(0, 300))));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout: ' + url)); });
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
const WB_CODES = Object.values(A2_TO_A3).join(';');

// ============================================================
// WORLD BANK FETCHER
// ============================================================
async function fetchWorldBank(indicator) {
  console.log('  [WB] ' + indicator + '...');
  const countries = {};
  let dataYear = 0;

  try {
    let page = 1, totalPages = 1;
    while (page <= totalPages && page <= 5) {
      const url = 'https://api.worldbank.org/v2/country/' + WB_CODES + '/indicator/' + indicator + '?date=2015:2025&format=json&per_page=500&page=' + page;
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
          countries[a2] = { value: entry.value, year: year };
          if (year > dataYear) dataYear = year;
        }
      });
      page++;
      if (page <= totalPages) await sleep(300);
    }
  } catch (e) {
    console.warn('  [WB] FAILED ' + indicator + ': ' + e.message);
  }

  const result = {};
  Object.entries(countries).forEach(([a2, d]) => { result[a2] = Math.round(d.value * 100) / 100; });
  console.log('  [WB] ' + indicator + ': ' + Object.keys(result).length + ' countries, year ' + dataYear);
  await sleep(500);
  return { countries: result, year: dataYear };
}

// ============================================================
// EUROSTAT FETCHER
// ============================================================
async function fetchEurostat(datasetCode, filters) {
  if (!filters) filters = {};
  console.log('  [EU] ' + datasetCode + '...');

  var url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/' + datasetCode + '?format=JSON&lang=EN';
  for (var y = 2025; y >= 2015; y--) url += '&time=' + y;
  Object.entries(filters).forEach(([key, val]) => { url += '&' + key + '=' + val; });

  try {
    const json = await getJSON(url);
    if (!json.dimension || json.value === undefined) {
      console.log('  [EU] ' + datasetCode + ': Empty response');
      return { countries: {}, year: 0 };
    }

    const dimOrder = json.id || [];
    const dimSizes = json.size || [];
    const geoPos = dimOrder.indexOf('geo');
    const timePos = dimOrder.indexOf('time');

    if (geoPos === -1 || timePos === -1) {
      console.log('  [EU] ' + datasetCode + ': Missing geo/time');
      return { countries: {}, year: 0 };
    }

    const geoIndex = json.dimension.geo.category.index;
    const timeIndex = json.dimension.time.category.index;

    const strides = new Array(dimOrder.length);
    strides[dimOrder.length - 1] = 1;
    for (var i = dimOrder.length - 2; i >= 0; i--) {
      strides[i] = strides[i + 1] * dimSizes[i + 1];
    }

    const fixedIndices = {};
    dimOrder.forEach((dim, pos) => {
      if (dim === 'geo' || dim === 'time') return;
      fixedIndices[pos] = 0;
    });

    console.log('  [EU] ' + datasetCode + ': values=' + Object.keys(json.value).length);

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

    console.log('  [EU] ' + datasetCode + ': ' + Object.keys(countries).length + ' countries, year ' + dataYear);
    return { countries: countries, year: dataYear };
  } catch (e) {
    console.warn('  [EU] FAILED ' + datasetCode + ': ' + e.message);
    return { countries: {}, year: 0 };
  }
}

// ============================================================
// OECD FETCHER (SDMX REST API)
// Uses the OECD Data Explorer API at sdmx.oecd.org
// The key challenge: each dataflow has a different number of
// dimensions. We use a generic approach that discovers the
// structure from the response.
// ============================================================
async function fetchOECD(dataflowAgency, dataflowId, filterKey) {
  if (!filterKey) filterKey = '';
  console.log('  [OECD] ' + dataflowId + '...');

  const countries = {};
  let dataYear = 0;

  // Try multiple URL patterns since OECD API is finicky
  var urls = [
    // Pattern 1: Full agency path with version
    'https://sdmx.oecd.org/public/rest/data/' + dataflowAgency + ',' + dataflowId + ',1.0/' + filterKey + '?startPeriod=2018&endPeriod=2025&dimensionAtObservation=AllDimensions&format=jsondata',
    // Pattern 2: Just dataflow ID (simpler)
    'https://sdmx.oecd.org/public/rest/data/' + dataflowId + '/' + filterKey + '?startPeriod=2018&endPeriod=2025&dimensionAtObservation=AllDimensions&format=jsondata',
    // Pattern 3: Legacy stats.oecd.org
    'https://stats.oecd.org/SDMX-JSON/data/' + dataflowId + '/' + (filterKey || 'all') + '/all?startTime=2018&endTime=2025'
  ];

  for (var ui = 0; ui < urls.length; ui++) {
    try {
      console.log('  [OECD] Trying URL pattern ' + (ui + 1) + '...');
      const raw = await get(urls[ui]);
      const json = JSON.parse(raw);

      // Handle SDMX-JSON v2 format (sdmx.oecd.org)
      if (json.data && json.data.dataSets && json.data.dataSets.length > 0) {
        const structure = json.data.structure;
        const observations = json.data.dataSets[0].observations || {};
        const dimensions = structure.dimensions.observation || [];

        // Find REF_AREA and TIME_PERIOD dimension indices
        var refAreaDimIdx = -1;
        var timeDimIdx = -1;
        dimensions.forEach(function(dim, idx) {
          if (dim.id === 'REF_AREA') refAreaDimIdx = idx;
          if (dim.id === 'TIME_PERIOD') timeDimIdx = idx;
        });

        if (refAreaDimIdx >= 0 && timeDimIdx >= 0) {
          var refAreaValues = dimensions[refAreaDimIdx].values;
          var timeValues = dimensions[timeDimIdx].values;

          Object.entries(observations).forEach(function([key, valArr]) {
            var indices = key.split(':');
            var countryObj = refAreaValues[parseInt(indices[refAreaDimIdx])];
            var timeObj = timeValues[parseInt(indices[timeDimIdx])];
            if (!countryObj || !timeObj) return;

            var a3 = countryObj.id;
            var a2 = A3_TO_A2[a3];
            if (!a2) return;

            var year = parseInt(timeObj.id);
            var val = valArr[0];
            if (val === null || val === undefined || isNaN(val)) return;

            if (!countries[a2] || year > countries[a2].year) {
              countries[a2] = { value: val, year: year };
              if (year > dataYear) dataYear = year;
            }
          });
        }
      }

      // Handle legacy SDMX-JSON v1 format (stats.oecd.org)
      if (json.dataSets && json.dataSets[0] && json.structure) {
        var series = json.dataSets[0].series || {};
        var dims = json.structure.dimensions.series || [];
        var timeDims = json.structure.dimensions.observation || [];

        var refIdx = -1;
        dims.forEach(function(d, i) {
          if (d.id === 'LOCATION' || d.id === 'REF_AREA' || d.id === 'COU') refIdx = i;
        });

        var timePeriods = timeDims[0] ? timeDims[0].values : [];

        if (refIdx >= 0) {
          Object.entries(series).forEach(function([seriesKey, seriesData]) {
            var keyParts = seriesKey.split(':');
            var locObj = dims[refIdx].values[parseInt(keyParts[refIdx])];
            if (!locObj) return;
            var a3 = locObj.id;
            var a2 = A3_TO_A2[a3];
            if (!a2) return;

            var obs = seriesData.observations || {};
            Object.entries(obs).forEach(function([timeIdx, valArr]) {
              var tp = timePeriods[parseInt(timeIdx)];
              if (!tp) return;
              var year = parseInt(tp.id);
              var val = valArr[0];
              if (val === null || val === undefined || isNaN(val)) return;

              if (!countries[a2] || year > countries[a2].year) {
                countries[a2] = { value: val, year: year };
                if (year > dataYear) dataYear = year;
              }
            });
          });
        }
      }

      // If we got data, stop trying other URLs
      if (Object.keys(countries).length > 0) break;

    } catch (e) {
      console.warn('  [OECD] Pattern ' + (ui + 1) + ' failed: ' + e.message.substring(0, 150));
    }
  }

  const result = {};
  Object.entries(countries).forEach(function([a2, d]) {
    result[a2] = Math.round(d.value * 100) / 100;
  });
  console.log('  [OECD] ' + dataflowId + ': ' + Object.keys(result).length + ' countries, year ' + dataYear);
  await sleep(1000);
  return { countries: result, year: dataYear };
}

// ============================================================
// ILO/ILOSTAT FETCHER (YouthSTATS)
// Base URL: https://sdmx.ilo.org/rest/data/
// ============================================================
async function fetchILO(dataflowId, filterKey) {
  if (!filterKey) filterKey = '';
  console.log('  [ILO] ' + dataflowId + '...');

  const countries = {};
  let dataYear = 0;

  // Try multiple base URLs since ILO has changed endpoints
  var urls = [
    'https://sdmx.ilo.org/rest/data/ILO,' + dataflowId + ',1.0/' + filterKey + '?startPeriod=2018&endPeriod=2025&format=jsondata&dimensionAtObservation=AllDimensions',
    'https://sdmx.ilo.org/rest/data/' + dataflowId + '/' + filterKey + '?startPeriod=2018&endPeriod=2025&format=jsondata&dimensionAtObservation=AllDimensions',
    'https://ilostat.ilo.org/sdmx/rest/data/' + dataflowId + '/' + filterKey + '?startPeriod=2018&endPeriod=2025&format=jsondata'
  ];

  for (var ui = 0; ui < urls.length; ui++) {
    try {
      console.log('  [ILO] Trying URL pattern ' + (ui + 1) + '...');
      const raw = await get(urls[ui]);
      const json = JSON.parse(raw);

      // SDMX-JSON v2 format
      if (json.data && json.data.dataSets && json.data.dataSets[0]) {
        var dims = json.data.structure.dimensions.observation || [];
        var observations = json.data.dataSets[0].observations || {};

        var refAreaIdx = -1;
        var timeIdx = -1;
        dims.forEach(function(d, i) {
          if (d.id === 'REF_AREA') refAreaIdx = i;
          if (d.id === 'TIME_PERIOD') timeIdx = i;
        });

        if (refAreaIdx >= 0 && timeIdx >= 0) {
          var refValues = dims[refAreaIdx].values;
          var timeValues = dims[timeIdx].values;

          Object.entries(observations).forEach(function([key, valArr]) {
            var parts = key.split(':');
            var refObj = refValues[parseInt(parts[refAreaIdx])];
            var timeObj = timeValues[parseInt(parts[timeIdx])];
            if (!refObj || !timeObj) return;

            var code = refObj.id;
            // ILO uses ISO3 codes
            var a2 = A3_TO_A2[code] || (EURO_SET.has(code) ? code : null);
            if (!a2) return;

            var year = parseInt(timeObj.id);
            var val = valArr[0];
            if (val === null || val === undefined || isNaN(val)) return;

            if (!countries[a2] || year > countries[a2].year) {
              countries[a2] = { value: val, year: year };
              if (year > dataYear) dataYear = year;
            }
          });
        }
      }

      // Legacy SDMX-JSON v1 format
      if (json.dataSets && json.dataSets[0] && json.structure) {
        var seriesData = json.dataSets[0].series || {};
        var seriesDims = json.structure.dimensions.series || [];
        var obsDims = json.structure.dimensions.observation || [];

        var refDimIdx = -1;
        seriesDims.forEach(function(d, i) {
          if (d.id === 'REF_AREA') refDimIdx = i;
        });

        var timePeriods = obsDims[0] ? obsDims[0].values : [];

        if (refDimIdx >= 0) {
          Object.entries(seriesData).forEach(function([seriesKey, sData]) {
            var keyParts = seriesKey.split(':');
            var locObj = seriesDims[refDimIdx].values[parseInt(keyParts[refDimIdx])];
            if (!locObj) return;
            var code = locObj.id;
            var a2 = A3_TO_A2[code] || (EURO_SET.has(code) ? code : null);
            if (!a2) return;

            var obs = sData.observations || {};
            Object.entries(obs).forEach(function([tIdx, valArr]) {
              var tp = timePeriods[parseInt(tIdx)];
              if (!tp) return;
              var year = parseInt(tp.id);
              var val = valArr[0];
              if (val === null || val === undefined || isNaN(val)) return;

              if (!countries[a2] || year > countries[a2].year) {
                countries[a2] = { value: val, year: year };
                if (year > dataYear) dataYear = year;
              }
            });
          });
        }
      }

      if (Object.keys(countries).length > 0) break;

    } catch (e) {
      console.warn('  [ILO] Pattern ' + (ui + 1) + ' failed: ' + e.message.substring(0, 150));
    }
  }

  const result = {};
  Object.entries(countries).forEach(function([a2, d]) {
    result[a2] = Math.round(d.value * 100) / 100;
  });
  console.log('  [ILO] ' + dataflowId + ': ' + Object.keys(result).length + ' countries, year ' + dataYear);
  await sleep(1000);
  return { countries: result, year: dataYear };
}

// ============================================================
// FETCH ALL INDICATORS
// ============================================================
async function fetchAll() {
  console.log('=== DATA COMPARISON MAP — Data Fetch ===');
  console.log('Run at: ' + new Date().toISOString());
  console.log('Sources: Eurostat, World Bank, OECD, ILO');
  console.log('European countries: ' + EURO_A2.length + '\n');

  const data = {};

  // 1. UNEMPLOYMENT TOTAL
  console.log('\n📊 Unemployment rate - Total');
  const unemp_eu = await fetchEurostat('une_rt_a', { age: 'Y15-74', sex: 'T', unit: 'PC_ACT' });
  const unemp_wb = await fetchWorldBank('SL.UEM.TOTL.ZS');
  // OECD: Use DF_IALFS_INDIC with full dimension keys (9 dims):
  // REF_AREA.FREQ.MEASURE.AGE.SEX.ADJUSTMENT.BORN.EDUCATION.DURATION
  const unemp_oecd = await fetchOECD('OECD.SDD.TPS', 'DSD_LFS@DF_IALFS_INDIC', '..UNE_LF_M...Y._T.Y_GE15..');
  data.unemployment_total = {
    label: 'Unemployment rate - Total', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_eu },
      oecd: { label: 'OECD', ...unemp_oecd },
      world_bank_wdi: { label: 'World Bank (WDI)', ...unemp_wb }
    }
  };
  await sleep(1000);

  // 2. UNEMPLOYMENT YOUTH
  console.log('\n📊 Unemployment rate - Youth');
  const uy_eu = await fetchEurostat('une_rt_a', { age: 'Y15-24', sex: 'T', unit: 'PC_ACT' });
  const uy_wb = await fetchWorldBank('SL.UEM.1524.ZS');
  const uy_oecd = await fetchOECD('OECD.SDD.TPS', 'DSD_LFS@DF_IALFS_INDIC', '..UNE_LF_M...Y._T.Y15T24..');
  // ILO YouthSTATS: DF_SDG_0852_SEX_AGE_RT — SDG youth unemployment
  const uy_ilo = await fetchILO('DF_SDG_0852_SEX_AGE_RT', '..SEX_T.AGE_YTHADULT_Y15-24');
  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...uy_eu },
      oecd: { label: 'OECD', ...uy_oecd },
      youthstats: { label: 'YouthSTATS (ILO)', ...uy_ilo },
      world_bank_wdi: { label: 'World Bank (WDI)', ...uy_wb }
    }
  };
  await sleep(1000);

  // 3. EARNINGS
  console.log('\n📊 Earnings');
  const earn_eu = await fetchEurostat('earn_nt_net', { estruct: 'SNG_NCHI', ecase: 'AW', currency: 'EUR' });
  const earn_wb = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  // OECD: AV_AN_WAGE — average annual wages
  const earn_oecd = await fetchOECD('OECD.ELS.SAE', 'DSD_EARNINGS@AV_AN_WAGE', '...');
  data.earnings = {
    label: 'Earnings', unit: 'USD/capita',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...earn_eu },
      oecd: { label: 'OECD', ...earn_oecd },
      world_bank_wdi: { label: 'World Bank (WDI)', ...earn_wb }
    }
  };
  await sleep(1000);

  // 4. INTENTIONAL HOMICIDE
  console.log('\n📊 Intentional Homicide');
  const hom_eu = await fetchEurostat('crim_off_cat', { iccs: 'ICCS0101', unit: 'P_HTHAB' });
  const hom_wb = await fetchWorldBank('VC.IHR.PSRC.P5');
  data.intentional_homicide = {
    label: 'Intentional homicide', unit: 'per 100k inh.',
    category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...hom_eu },
      world_bank: { label: 'World Bank', ...hom_wb }
    }
  };
  await sleep(1000);

  // 5a. IMMIGRATION
  console.log('\n📊 Immigration');
  const imm_eu = await fetchEurostat('migr_imm1ctz', { citizen: 'TOTAL', age: 'TOTAL', sex: 'T' });
  data.immigration = {
    label: 'Immigration', unit: 'persons',
    category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...imm_eu }
    }
  };
  await sleep(1000);

  // 5b. NET MIGRATION
  console.log('\n📊 Net migration');
  const mig_wb = await fetchWorldBank('SM.POP.NETM');
  data.net_migration = {
    label: 'Net migration', unit: 'net persons',
    category: 'society',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...mig_wb }
    }
  };
  await sleep(1000);

  // 6. INFLATION
  console.log('\n📊 Inflation');
  const inf_eu = await fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A_AVG' });
  const inf_wb = await fetchWorldBank('FP.CPI.TOTL.ZG');
  // OECD: Consumer prices
  const inf_oecd = await fetchOECD('OECD.SDD.TPS', 'DSD_PRICES@DF_PRICES_ALL', '..CPI.PA._T.GY..');
  data.inflation = {
    label: 'Inflation', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...inf_eu },
      oecd: { label: 'OECD', ...inf_oecd },
      world_bank_wdi: { label: 'World Bank (WDI)', ...inf_wb }
    }
  };
  await sleep(1000);

  // 7. POPULATION
  console.log('\n📊 Population');
  const pop_eu = await fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' });
  const pop_wb = await fetchWorldBank('SP.POP.TOTL');
  data.population = {
    label: 'Population', unit: 'persons',
    category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...pop_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pop_wb }
    }
  };
  await sleep(1000);

  // 8. LIFE EXPECTANCY
  console.log('\n📊 Life Expectancy');
  const le_eu = await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' });
  const le_wb = await fetchWorldBank('SP.DYN.LE00.IN');
  data.life_expectancy = {
    label: 'Life expectancy', unit: 'years',
    category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...le_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...le_wb }
    }
  };
  await sleep(1000);

  // 9. FERTILITY
  console.log('\n📊 Fertility');
  const fert_eu = await fetchEurostat('demo_find', { indic_de: 'TOTFERRT' });
  const fert_wb = await fetchWorldBank('SP.DYN.TFRT.IN');
  data.fertility = {
    label: 'Fertility', unit: 'births/woman',
    category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...fert_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...fert_wb }
    }
  };
  await sleep(1000);

  // 10. GOVERNMENT DEBT
  console.log('\n📊 Government Debt');
  const debt_eu = await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' });
  const debt_wb = await fetchWorldBank('GC.DOD.TOTL.GD.ZS');
  // OECD: General government debt % of GDP
  const debt_oecd = await fetchOECD('OECD.SDD.NAD', 'DSD_NASEC14@DF_TABLE14', '..S13.GD.._T.PT_B1GQ.A');
  data.government_debt = {
    label: 'Government Debt', unit: '% of GDP',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...debt_eu },
      oecd: { label: 'OECD', ...debt_oecd },
      world_bank: { label: 'World Bank', ...debt_wb }
    }
  };
  await sleep(1000);

  // 11. HEALTHCARE SPENDING
  console.log('\n📊 Healthcare spending');
  const health_eu = await fetchEurostat('hlth_sha11_hf', { icha11_hf: 'TOT_HF', unit: 'PC_GDP' });
  const health_wb = await fetchWorldBank('SH.XPD.CHEX.GD.ZS');
  data.healthcare_spending = {
    label: 'Healthcare spending', unit: '% of GDP',
    category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...health_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...health_wb }
    }
  };
  await sleep(1000);

  // 12. EDUCATION SPENDING
  console.log('\n📊 Education spending');
  const edu_eu = await fetchEurostat('educ_uoe_fine09', { isced11: 'ED0-8', unit: 'PC_GDP' });
  const edu_wb = await fetchWorldBank('SE.XPD.TOTL.GD.ZS');
  data.education_spending = {
    label: 'Education spending', unit: '% of GDP',
    category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...edu_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...edu_wb }
    }
  };
  await sleep(1000);

  // 13. MILITARY SPENDING
  console.log('\n📊 Military spending');
  const mil_wb = await fetchWorldBank('MS.MIL.XPND.GD.ZS');
  data.military_spending = {
    label: 'Military spending', unit: '% of GDP',
    category: 'public_services',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...mil_wb }
    }
  };
  await sleep(1000);

  // 14. R&D SPENDING
  console.log('\n📊 R&D spending');
  const rd_eu = await fetchEurostat('rd_e_gerdtot', { sectperf: 'TOTAL', unit: 'PC_GDP' });
  const rd_wb = await fetchWorldBank('GB.XPD.RSDV.GD.ZS');
  data.rd_spending = {
    label: 'R&D spending', unit: '% of GDP',
    category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...rd_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...rd_wb }
    }
  };
  await sleep(1000);

  // 15. POVERTY RATE
  console.log('\n📊 Poverty rate');
  const pov_eu = await fetchEurostat('ilc_li02', { indic_il: 'LI_R_MD60', unit: 'PC' });
  const pov_wb = await fetchWorldBank('SI.POV.NAHC');
  data.poverty_rate = {
    label: 'Poverty rate', unit: '%',
    category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...pov_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pov_wb }
    }
  };
  await sleep(1000);

  // 16. INFANT MORTALITY
  console.log('\n📊 Infant mortality');
  const infm_eu = await fetchEurostat('demo_minfind', { indic_de: 'INFMORRT' });
  const infm_wb = await fetchWorldBank('SP.DYN.IMRT.IN');
  data.infant_mortality = {
    label: 'Infant mortality', unit: 'per 1,000 births',
    category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...infm_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...infm_wb }
    }
  };
  await sleep(1000);

  // 17. TERTIARY EDUCATION
  console.log('\n📊 Tertiary education');
  const tert_wb = await fetchWorldBank('SE.TER.ENRR');
  data.tertiary_education = {
    label: 'Tertiary education', unit: '% gross enrollment',
    category: 'public_services',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...tert_wb }
    }
  };
  await sleep(1000);

  // 18. FOREIGN DIRECT INVESTMENT
  console.log('\n📊 Foreign Direct Investment');
  const fdi_wb = await fetchWorldBank('BX.KLT.DINV.WD.GD.ZS');
  data.fdi = {
    label: 'Foreign Direct Investment', unit: '% of GDP',
    category: 'economy',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...fdi_wb }
    }
  };
  await sleep(1000);

  // 19. GDP GROWTH
  console.log('\n📊 GDP growth');
  const gdp_wb = await fetchWorldBank('NY.GDP.MKTP.KD.ZG');
  data.gdp_growth = {
    label: 'GDP growth', unit: '%',
    category: 'economy',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...gdp_wb }
    }
  };
  await sleep(1000);

  // 20. GDP PER CAPITA (PPP)
  console.log('\n📊 GDP per capita (PPP)');
  const gdppc_wb = await fetchWorldBank('NY.GDP.PCAP.PP.CD');
  data.gdp_per_capita = {
    label: 'GDP per capita (PPP)', unit: 'int. $',
    category: 'economy',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...gdppc_wb }
    }
  };
  await sleep(1000);

  // 21. GINI COEFFICIENT
  console.log('\n📊 Gini coefficient');
  const gini_eu = await fetchEurostat('ilc_di12', {});
  const gini_wb = await fetchWorldBank('SI.POV.GINI');
  data.gini_coefficient = {
    label: 'Gini coefficient', unit: 'index (0-100)',
    category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...gini_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...gini_wb }
    }
  };
  await sleep(1000);

  // ============================================================
  // POST-PROCESS: Remove empty sources so UI doesn't show them
  // ============================================================
  Object.entries(data).forEach(function([key, dt]) {
    var cleanSources = {};
    Object.entries(dt.sources).forEach(function([sk, src]) {
      if (Object.keys(src.countries).length > 0) {
        cleanSources[sk] = src;
      } else {
        console.log('  Removing empty source: ' + dt.label + ' / ' + src.label);
      }
    });
    dt.sources = cleanSources;
  });

  // ============================================================
  // OUTPUT
  // ============================================================
  const output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      generatedBy: 'fetch-data.js via GitHub Actions',
      indicatorCount: Object.keys(data).length,
      sources: ['Eurostat', 'World Bank', 'OECD', 'ILO/YouthSTATS'],
      categories: {
        economy: 'Economy',
        demographics: 'Demographics',
        society: 'Society',
        public_services: 'Public Services'
      }
    },
    ...data
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(70));

  let total = 0, empty = 0, low = 0, ok = 0;

  Object.entries(data).forEach(function([key, dt]) {
    console.log('\n  ' + dt.label + ' (' + dt.unit + '):');
    Object.entries(dt.sources).forEach(function([sk, src]) {
      total++;
      const n = Object.keys(src.countries).length;
      let icon;
      if (n === 0) { icon = '❌ EMPTY'; empty++; }
      else if (n < 10) { icon = '⚠️  LOW '; low++; }
      else { icon = '✅     '; ok++; }
      console.log('    ' + icon + ' ' + src.label + ': ' + n + ' countries (year: ' + src.year + ')');
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log('  Indicators: ' + Object.keys(data).length);
  console.log('  Total sources: ' + total + ' | OK: ' + ok + ' | Low: ' + low + ' | Empty: ' + empty);
  console.log('  Output: data.json (' + (fs.statSync('data.json').size / 1024).toFixed(1) + ' KB)');
  console.log('='.repeat(70));
}

fetchAll().catch(function(e) {
  console.error('\n Fatal error:', e);
  process.exit(1);
});
