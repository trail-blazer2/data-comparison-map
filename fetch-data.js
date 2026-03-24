// ============================================================
// fetch-data.js — Run via GitHub Actions (manual trigger)
// Fetches from Eurostat + World Bank + OECD APIs
// Outputs data.json
// ============================================================

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// HTTP HELPERS
// ============================================================
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024;

function httpGet(url, accept, maxRedirects) {
  if (maxRedirects === undefined) maxRedirects = 5;
  if (!accept) accept = 'application/json';
  return new Promise(function(resolve, reject) {
    var client = url.startsWith('https') ? https : http;
    var req = client.get(url, {
      headers: {
        'Accept': accept,
        'User-Agent': 'DataMap/1.0'
      },
      timeout: 90000
    }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        var next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        return resolve(httpGet(next, accept, maxRedirects - 1));
      }
      if (res.statusCode >= 400) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() { reject(new Error('HTTP ' + res.statusCode + ' for ' + url + '\n' + body.substring(0, 300))); });
        return;
      }
      var chunks = [];
      var totalLen = 0;
      res.on('data', function(chunk) {
        totalLen += chunk.length;
        if (totalLen > MAX_RESPONSE_SIZE) {
          res.destroy();
          reject(new Error('Response too large for ' + url));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', function() { resolve(Buffer.concat(chunks).toString('utf8')); });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('Timeout: ' + url)); });
  });
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ============================================================
// COUNTRY CODE MAPPINGS
// ============================================================
var COUNTRIES = {
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

var EURO_A2 = Object.keys(COUNTRIES);
var EURO_SET = new Set(EURO_A2);

var A2_TO_A3 = {
  AT:'AUT',BE:'BEL',BG:'BGR',HR:'HRV',CY:'CYP',CZ:'CZE',DK:'DNK',
  EE:'EST',FI:'FIN',FR:'FRA',DE:'DEU',GR:'GRC',HU:'HUN',IS:'ISL',
  IE:'IRL',IT:'ITA',LV:'LVA',LT:'LTU',LU:'LUX',MT:'MLT',NL:'NLD',
  NO:'NOR',PL:'POL',PT:'PRT',RO:'ROU',SK:'SVK',SI:'SVN',ES:'ESP',
  SE:'SWE',CH:'CHE',GB:'GBR',AL:'ALB',BA:'BIH',ME:'MNE',MK:'MKD',
  RS:'SRB',BY:'BLR',UA:'UKR',MD:'MDA'
};
var A3_TO_A2 = {};
Object.entries(A2_TO_A3).forEach(function([a2, a3]) { A3_TO_A2[a3] = a2; });

var ESTAT_REMAP = { 'EL': 'GR', 'UK': 'GB' };
var WB_CODES = Object.values(A2_TO_A3).join(';');

// OECD member/partner European countries only
var OECD_EUR = 'AUT+BEL+BGR+HRV+CZE+DNK+EST+FIN+FRA+DEU+GRC+HUN+ISL+IRL+ITA+LVA+LTU+LUX+NLD+NOR+POL+PRT+ROU+SVK+SVN+ESP+SWE+CHE+GBR';

// ============================================================
// WORLD BANK FETCHER
// ============================================================
async function fetchWorldBank(indicator) {
  console.log('  [WB] ' + indicator + '...');
  var countries = {};
  var dataYear = 0;

  try {
    var page = 1, totalPages = 1;
    while (page <= totalPages && page <= 5) {
      var url = 'https://api.worldbank.org/v2/country/' + WB_CODES + '/indicator/' + indicator + '?date=2015:2025&format=json&per_page=500&page=' + page;
      var raw = await httpGet(url, 'application/json');
      var json = JSON.parse(raw);
      if (!json[1] || json[1].length === 0) break;
      totalPages = json[0].pages || 1;

      json[1].forEach(function(entry) {
        if (entry.value === null) return;
        var a3 = entry.countryiso3code;
        var a2 = A3_TO_A2[a3];
        if (!a2) return;
        var year = parseInt(entry.date);
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

  var result = {};
  Object.entries(countries).forEach(function([a2, d]) { result[a2] = Math.round(d.value * 100) / 100; });
  console.log('  [WB] ' + indicator + ': ' + Object.keys(result).length + ' countries, year ' + dataYear);
  await sleep(500);
  return { countries: result, year: dataYear };
}

// ============================================================
// EUROSTAT FETCHER — uses Accept: application/json
// ============================================================
async function fetchEurostat(datasetCode, filters) {
  if (!filters) filters = {};
  console.log('  [EU] ' + datasetCode + '...');

  var url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/' + datasetCode + '?format=JSON&lang=EN';
  for (var y = 2025; y >= 2015; y--) url += '&time=' + y;
  Object.entries(filters).forEach(function([key, val]) { url += '&' + key + '=' + val; });

  try {
    var raw = await httpGet(url, 'application/json');
    var json = JSON.parse(raw);
    if (!json.dimension || json.value === undefined) {
      console.log('  [EU] ' + datasetCode + ': Empty response');
      return { countries: {}, year: 0 };
    }

    var dimOrder = json.id || [];
    var dimSizes = json.size || [];

    if (dimOrder.indexOf('geo') === -1 || dimOrder.indexOf('time') === -1) {
      console.log('  [EU] ' + datasetCode + ': Missing geo/time');
      return { countries: {}, year: 0 };
    }

    var geoIndex = json.dimension.geo.category.index;
    var timeIndex = json.dimension.time.category.index;

    var strides = new Array(dimOrder.length);
    strides[dimOrder.length - 1] = 1;
    for (var i = dimOrder.length - 2; i >= 0; i--) {
      strides[i] = strides[i + 1] * dimSizes[i + 1];
    }

    var fixedIndices = {};
    dimOrder.forEach(function(dim, pos) {
      if (dim === 'geo' || dim === 'time') return;
      fixedIndices[pos] = 0;
    });

    console.log('  [EU] ' + datasetCode + ': values=' + Object.keys(json.value).length);

    var countries = {};
    var dataYear = 0;
    var sortedTimes = Object.entries(timeIndex).sort(function(a, b) { return parseInt(b[0]) - parseInt(a[0]); });

    Object.entries(geoIndex).forEach(function([geoCode, geoIdx]) {
      var alpha2 = ESTAT_REMAP[geoCode] || geoCode;
      if (!EURO_SET.has(alpha2)) return;

      for (var ti = 0; ti < sortedTimes.length; ti++) {
        var timeCode = sortedTimes[ti][0];
        var timeIdx = sortedTimes[ti][1];
        var flatIdx = 0;
        dimOrder.forEach(function(dim, pos) {
          if (dim === 'geo') flatIdx += geoIdx * strides[pos];
          else if (dim === 'time') flatIdx += timeIdx * strides[pos];
          else flatIdx += (fixedIndices[pos] || 0) * strides[pos];
        });

        var val = json.value[String(flatIdx)];
        if (val !== undefined && val !== null) {
          countries[alpha2] = Math.round(val * 100) / 100;
          var yr = parseInt(timeCode);
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
// SDMX-JSON PARSER — handles OECD's response format
//
// OECD returns:
//   json.data.dataSets[0].observations  (flat, with dimensionAtObservation=AllDimensions)
//   json.data.dataSets[0].series        (series-based, without that param)
//   json.data.structures[0].dimensions  (note: "structures" plural!)
// ============================================================
function resolveCountryCode(code) {
  if (A3_TO_A2[code]) return A3_TO_A2[code];
  if (EURO_SET.has(code)) return code;
  return null;
}

function findDimIndex(dims, names) {
  for (var i = 0; i < dims.length; i++) {
    if (names.indexOf(dims[i].id) >= 0) return i;
  }
  // Fallback: check values for country codes or year patterns
  return -1;
}

function findCountryDimByValues(dims) {
  for (var i = 0; i < dims.length; i++) {
    var hasCountry = dims[i].values.some(function(v) { return resolveCountryCode(v.id) !== null; });
    if (hasCountry) return i;
  }
  return -1;
}

function findTimeDimByValues(dims) {
  for (var i = 0; i < dims.length; i++) {
    var hasYear = dims[i].values.some(function(v) { return /^\d{4}$/.test(v.id); });
    if (hasYear) return i;
  }
  return -1;
}

function parseSdmxJson(json, label) {
  var countries = {};
  var dataYear = 0;

  // Find dataSets and structure from wherever they are in the response
  var dataSet = null;
  var structure = null;

  // OECD format: json.data.dataSets + json.data.structures (plural!)
  if (json.data) {
    if (json.data.dataSets && json.data.dataSets.length > 0) {
      dataSet = json.data.dataSets[0];
    }
    // KEY FIX: structures (plural) not structure (singular)
    if (json.data.structures && json.data.structures.length > 0) {
      structure = json.data.structures[0];
    }
    if (json.data.structure) {
      structure = json.data.structure;
    }
  }
  // Older SDMX-JSON v1: root-level dataSets + structure
  if (!dataSet && json.dataSets && json.dataSets.length > 0) {
    dataSet = json.dataSets[0];
  }
  if (!structure && json.structure) {
    structure = json.structure;
  }

  if (!dataSet) {
    console.log('  [PARSE] ' + label + ': no dataSet found');
    return { countries: {}, year: 0 };
  }
  if (!structure) {
    console.log('  [PARSE] ' + label + ': no structure found');
    return { countries: {}, year: 0 };
  }

  var dims = structure.dimensions || {};
  var countryNames = ['REF_AREA', 'LOCATION', 'COU', 'COUNTRY', 'CNTRY'];
  var timeNames = ['TIME_PERIOD', 'TIME', 'PERIOD'];

  // ---- CASE A: Flat observations (dimensionAtObservation=AllDimensions) ----
  if (dataSet.observations && Object.keys(dataSet.observations).length > 0) {
    var obsDims = dims.observation || [];

    var refIdx = findDimIndex(obsDims, countryNames);
    var timeIdx = findDimIndex(obsDims, timeNames);
    if (refIdx < 0) refIdx = findCountryDimByValues(obsDims);
    if (timeIdx < 0) timeIdx = findTimeDimByValues(obsDims);

    if (refIdx >= 0 && timeIdx >= 0) {
      var refValues = obsDims[refIdx].values;
      var timeValues = obsDims[timeIdx].values;

      Object.entries(dataSet.observations).forEach(function([key, valArr]) {
        var parts = key.split(':');
        var refObj = refValues[parseInt(parts[refIdx])];
        var timeObj = timeValues[parseInt(parts[timeIdx])];
        if (!refObj || !timeObj) return;

        var a2 = resolveCountryCode(refObj.id);
        if (!a2) return;

        var year = parseInt(timeObj.id);
        if (isNaN(year)) return;
        var val = valArr[0];
        if (val === null || val === undefined || isNaN(val)) return;

        if (!countries[a2] || year > countries[a2].year) {
          countries[a2] = { value: val, year: year };
          if (year > dataYear) dataYear = year;
        }
      });

      console.log('  [PARSE] ' + label + ' flat: ' + Object.keys(countries).length + ' countries');
    } else {
      console.log('  [PARSE] ' + label + ' flat: no country/time dim. Dims: ' + obsDims.map(function(d){return d.id;}).join(', '));
    }
  }

  // ---- CASE B: Series-based observations ----
  if (Object.keys(countries).length === 0 && dataSet.series && Object.keys(dataSet.series).length > 0) {
    var seriesDims = dims.series || [];
    var obsDimsB = dims.observation || [];

    var countryDimIdx = findDimIndex(seriesDims, countryNames);
    if (countryDimIdx < 0) countryDimIdx = findCountryDimByValues(seriesDims);

    var timePeriods = obsDimsB.length > 0 ? obsDimsB[0].values : [];

    if (countryDimIdx >= 0) {
      Object.entries(dataSet.series).forEach(function([seriesKey, sData]) {
        var keyParts = seriesKey.split(':');
        var locObj = seriesDims[countryDimIdx].values[parseInt(keyParts[countryDimIdx])];
        if (!locObj) return;

        var a2 = resolveCountryCode(locObj.id);
        if (!a2) return;

        var obs = sData.observations || {};
        Object.entries(obs).forEach(function([tIdx, valArr]) {
          var tp = timePeriods[parseInt(tIdx)];
          if (!tp) return;
          var year = parseInt(tp.id || tp.name);
          if (isNaN(year)) return;
          var val = valArr[0];
          if (val === null || val === undefined || isNaN(val)) return;

          if (!countries[a2] || year > countries[a2].year) {
            countries[a2] = { value: val, year: year };
            if (year > dataYear) dataYear = year;
          }
        });
      });

      console.log('  [PARSE] ' + label + ' series: ' + Object.keys(countries).length + ' countries');
    } else {
      console.log('  [PARSE] ' + label + ' series: no country dim. Dims: ' + seriesDims.map(function(d){return d.id;}).join(', '));
    }
  }

  var result = {};
  Object.entries(countries).forEach(function([a2, d]) { result[a2] = Math.round(d.value * 100) / 100; });
  return { countries: result, year: dataYear };
}

// ============================================================
// OECD FETCHER — uses Accept: application/vnd.sdmx.data+json
// ============================================================
async function fetchOECD(agency, dataflow, version, filterKey, label) {
  if (!label) label = dataflow;
  console.log('  [OECD] ' + label + '...');

  var baseUrl = 'https://sdmx.oecd.org/public/rest/data/'
    + agency + ',' + dataflow + ',' + version
    + '/' + filterKey;

  // OECD SDMX API needs this Accept header for JSON
  var accept = 'application/vnd.sdmx.data+json;version=2.0.0';

  var urls = [
    baseUrl + '?dimensionAtObservation=AllDimensions',
    baseUrl
  ];

  for (var i = 0; i < urls.length; i++) {
    try {
      console.log('  [OECD] Try ' + (i+1) + ': ' + urls[i].substring(0, 200));
      var raw = await httpGet(urls[i], accept);
      var json = JSON.parse(raw);
      var parsed = parseSdmxJson(json, label + ' try' + (i+1));
      if (Object.keys(parsed.countries).length > 0) {
        console.log('  [OECD] ' + label + ': ' + Object.keys(parsed.countries).length + ' countries, year ' + parsed.year);
        await sleep(1500);
        return parsed;
      }
    } catch (e) {
      console.warn('  [OECD] Try ' + (i+1) + ' failed: ' + e.message.substring(0, 200));
    }
  }

  console.log('  [OECD] ' + label + ': 0 countries, year 0');
  await sleep(1500);
  return { countries: {}, year: 0 };
}

// ============================================================
// FETCH ALL INDICATORS
// ============================================================
async function fetchAll() {
  console.log('=== DATA COMPARISON MAP — Data Fetch ===');
  console.log('Run at: ' + new Date().toISOString());
  console.log('Sources: Eurostat, World Bank, OECD');
  console.log('European countries: ' + EURO_A2.length + '\n');

  var OC = OECD_EUR;
  var data = {};

  // 1. UNEMPLOYMENT TOTAL
  console.log('\n📊 Unemployment rate - Total');
  var unemp_eu = await fetchEurostat('une_rt_a', { age: 'Y15-74', sex: 'T', unit: 'PC_ACT' });
  var unemp_wb = await fetchWorldBank('SL.UEM.TOTL.ZS');
  data.unemployment_total = {
    label: 'Unemployment rate - Total', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...unemp_wb }
    }
  };
  await sleep(1000);

  // 2. UNEMPLOYMENT YOUTH
  console.log('\n📊 Unemployment rate - Youth');
  var uy_eu = await fetchEurostat('une_rt_a', { age: 'Y15-24', sex: 'T', unit: 'PC_ACT' });
  var uy_wb = await fetchWorldBank('SL.UEM.1524.ZS');
  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...uy_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...uy_wb }
    }
  };
  await sleep(1000);

  // 3. EARNINGS
  // From friend's OECD URL: agency=OECD.ELS.SAE, df=DSD_EARNINGS@AV_AN_WAGE, v=1.0
  // dq= AUT+BEL+EST+...EUR..Q..
  console.log('\n📊 Earnings');
  var earn_eu = await fetchEurostat('earn_nt_net', { estruct: 'SNG_NCHI', ecase: 'AW', currency: 'EUR' });
  var earn_wb = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  var earn_oecd = await fetchOECD(
    'OECD.ELS.SAE', 'DSD_EARNINGS@AV_AN_WAGE', '1.0',
    OC + '..EUR..Q..', 'AV_AN_WAGE'
  );
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
  // From friend's OECD URL: agency=OECD.CFE.EDS, df=DSD_REG_SOC@DF_SAFETY, v=2.2
  // dq= A.CTRY.BEL+CZE+...HOMIC...CS_10P5PS
  console.log('\n📊 Intentional Homicide');
  var hom_eu = await fetchEurostat('crim_off_cat', { iccs: 'ICCS0101', unit: 'P_HTHAB' });
  var hom_wb = await fetchWorldBank('VC.IHR.PSRC.P5');
  var hom_oecd = await fetchOECD(
    'OECD.CFE.EDS', 'DSD_REG_SOC@DF_SAFETY', '2.2',
    'A.CTRY.' + OC + '..HOMIC...CS_10P5PS', 'SAFETY'
  );
  data.intentional_homicide = {
    label: 'Intentional homicide', unit: 'per 100k inh.',
    category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...hom_eu },
      oecd: { label: 'OECD', ...hom_oecd },
      world_bank: { label: 'World Bank', ...hom_wb }
    }
  };
  await sleep(1000);

  // 5a. IMMIGRATION
  console.log('\n📊 Immigration');
  var imm_eu = await fetchEurostat('migr_imm1ctz', { citizen: 'TOTAL', age: 'TOTAL', sex: 'T' });
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
  var mig_wb = await fetchWorldBank('SM.POP.NETM');
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
  var inf_eu = await fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A_AVG' });
  var inf_wb = await fetchWorldBank('FP.CPI.TOTL.ZG');
  data.inflation = {
    label: 'Inflation', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...inf_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...inf_wb }
    }
  };
  await sleep(1000);

  // 7. POPULATION
  console.log('\n📊 Population');
  var pop_eu = await fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' });
  var pop_wb = await fetchWorldBank('SP.POP.TOTL');
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
  // From friend's OECD URL: agency=OECD.ELS.HD, df=DSD_HEALTH_STAT@DF_LE, v=1.1
  // dq= AUT+BEL+...A.LFEXP..Y0._T.......
  console.log('\n📊 Life Expectancy');
  var le_eu = await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' });
  var le_wb = await fetchWorldBank('SP.DYN.LE00.IN');
  var le_oecd = await fetchOECD(
    'OECD.ELS.HD', 'DSD_HEALTH_STAT@DF_LE', '1.1',
    OC + '.A.LFEXP..Y0._T.......', 'LE'
  );
  data.life_expectancy = {
    label: 'Life expectancy', unit: 'years',
    category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...le_eu },
      oecd: { label: 'OECD', ...le_oecd },
      world_bank_wdi: { label: 'World Bank (WDI)', ...le_wb }
    }
  };
  await sleep(1000);

  // 9. FERTILITY
  console.log('\n📊 Fertility');
  var fert_eu = await fetchEurostat('demo_find', { indic_de: 'TOTFERRT' });
  var fert_wb = await fetchWorldBank('SP.DYN.TFRT.IN');
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
  // From friend's OECD URL: agency=OECD.GOV.GIP, df=DSD_GOV@DF_GOV_PF_2025, v=1.0
  // dq= A.BEL+CZE+...GGD.PT_B1GQ...
  console.log('\n📊 Government Debt');
  var debt_eu = await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' });
  var debt_wb = await fetchWorldBank('GC.DOD.TOTL.GD.ZS');
  var debt_oecd = await fetchOECD(
    'OECD.GOV.GIP', 'DSD_GOV@DF_GOV_PF_2025', '1.0',
    'A.' + OC + '.GGD.PT_B1GQ...', 'GOV_DEBT'
  );
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
  var health_eu = await fetchEurostat('hlth_sha11_hf', { icha11_hf: 'TOT_HF', unit: 'PC_GDP' });
  var health_wb = await fetchWorldBank('SH.XPD.CHEX.GD.ZS');
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
  var edu_eu = await fetchEurostat('educ_uoe_fine09', { isced11: 'ED0-8', unit: 'PC_GDP' });
  var edu_wb = await fetchWorldBank('SE.XPD.TOTL.GD.ZS');
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
  var mil_wb = await fetchWorldBank('MS.MIL.XPND.GD.ZS');
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
  var rd_eu = await fetchEurostat('rd_e_gerdtot', { sectperf: 'TOTAL', unit: 'PC_GDP' });
  var rd_wb = await fetchWorldBank('GB.XPD.RSDV.GD.ZS');
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
  var pov_eu = await fetchEurostat('ilc_li02', { indic_il: 'LI_R_MD60', unit: 'PC' });
  var pov_wb = await fetchWorldBank('SI.POV.NAHC');
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
  var infm_eu = await fetchEurostat('demo_minfind', { indic_de: 'INFMORRT' });
  var infm_wb = await fetchWorldBank('SP.DYN.IMRT.IN');
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
  var tert_wb = await fetchWorldBank('SE.TER.ENRR');
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
  var fdi_wb = await fetchWorldBank('BX.KLT.DINV.WD.GD.ZS');
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
  var gdp_wb = await fetchWorldBank('NY.GDP.MKTP.KD.ZG');
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
  var gdppc_wb = await fetchWorldBank('NY.GDP.PCAP.PP.CD');
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
  var gini_eu = await fetchEurostat('ilc_di12', {});
  var gini_wb = await fetchWorldBank('SI.POV.GINI');
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
  // POST-PROCESS: Remove empty sources
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
  var output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      generatedBy: 'fetch-data.js via GitHub Actions',
      indicatorCount: Object.keys(data).length,
      sources: ['Eurostat', 'World Bank', 'OECD'],
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

  var total = 0, empty = 0, low = 0, ok = 0;

  Object.entries(data).forEach(function([key, dt]) {
    console.log('\n  ' + dt.label + ' (' + dt.unit + '):');
    Object.entries(dt.sources).forEach(function([sk, src]) {
      total++;
      var n = Object.keys(src.countries).length;
      var icon;
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
