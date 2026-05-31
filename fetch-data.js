// Fetches from Eurostat + World Bank + OECD + ILO + WHO APIs
// Outputs data.json strictly locked to a single global year

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================================
// GLOBAL CONFIGURATION
// ============================================================================
const GLOBAL_YEAR = 2024; // Forces EVERY source/indicator to strictly use this year

// HTTP HELPERS
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

// COUNTRY CODE MAPPINGS (GLOBAL)
var COUNTRIES = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AO:'Angola',AM:'Armenia',
  AR:'Argentina',AU:'Australia',AT:'Austria',AZ:'Azerbaijan',BD:'Bangladesh',
  BE:'Belgium',BJ:'Benin',BT:'Bhutan',BO:'Bolivia',BA:'Bosnia & Herzegovina',
  BW:'Botswana',BR:'Brazil',BN:'Brunei',BG:'Bulgaria',BI:'Burundi',
  BY:'Belarus',KH:'Cambodia',CM:'Cameroon',CA:'Canada',CF:'Central African Republic',
  TD:'Chad',CL:'Chile',CN:'China',CO:'Colombia',CG:'Congo',CD:'DR Congo',
  KM:'Comoros',CR:'Costa Rica',CI:"Côte d'Ivoire",HR:'Croatia',CU:'Cuba',
  CY:'Cyprus',CZ:'Czechia',DK:'Denmark',DJ:'Djibouti',DO:'Dominican Republic',
  EC:'Ecuador',EG:'Egypt',SV:'El Salvador',GQ:'Equatorial Guinea',ER:'Eritrea',
  EE:'Estonia',ET:'Ethiopia',FJ:'Fiji',FI:'Finland',FR:'France',GA:'Gabon',
  GM:'Gambia',GE:'Georgia',DE:'Germany',GH:'Ghana',GR:'Greece',GT:'Guatemala',
  GN:'Guinea',GY:'Guyana',HT:'Haiti',HN:'Honduras',HU:'Hungary',IS:'Iceland',
  IN:'India',ID:'Indonesia',IR:'Iran',IQ:'Iraq',IE:'Ireland',IL:'Israel',
  IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',KZ:'Kazakhstan',KE:'Kenya',
  KP:'North Korea',KR:'South Korea',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',
  LB:'Lebanon',LS:'Lesotho',LR:'Liberia',LY:'Libya',LT:'Lithuania',LU:'Luxembourg',
  LV:'Latvia',MG:'Madagascar',MW:'Malawi',MY:'Malaysia',ML:'Mali',MT:'Malta',
  MR:'Mauritania',MU:'Mauritius',MX:'Mexico',MD:'Moldova',ME:'Montenegro',
  MN:'Mongolia',MA:'Morocco',MZ:'Mozambique',MM:'Myanmar',NA:'Namibia',
  NP:'Nepal',NL:'Netherlands',NC:'New Caledonia',NZ:'New Zealand',NI:'Nicaragua',
  NE:'Niger',NG:'Nigeria',MK:'North Macedonia',NO:'Norway',PK:'Pakistan',
  PA:'Panama',PG:'Papua New Guinea',PY:'Paraguay',PE:'Peru',PH:'Philippines',
  PL:'Poland',PT:'Portugal',QA:'Qatar',RO:'Romania',RU:'Russia',RW:'Rwanda',
  ST:'São Tomé & Príncipe',SA:'Saudi Arabia',SN:'Senegal',RS:'Serbia',
  SL:'Sierra Leone',SK:'Slovakia',SI:'Slovenia',SO:'Somalia',ZA:'South Africa',
  SS:'South Sudan',ES:'Spain',LK:'Sri Lanka',SD:'Sudan',SR:'Suriname',
  SZ:'Eswatini',SE:'Sweden',CH:'Switzerland',SY:'Syria',TJ:'Tajikistan',
  TZ:'Tanzania',TH:'Thailand',TG:'Togo',TN:'Tunisia',TR:'Türkiye',
  TM:'Turkmenistan',UG:'Uganda',UA:'Ukraine',AE:'United Arab Emirates',
  GB:'United Kingdom',US:'United States',UY:'Uruguay',UZ:'Uzbekistan',
  VE:'Venezuela',VN:'Vietnam',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe'
};

var EURO_A2 = Object.keys(COUNTRIES);
var EURO_SET = new Set(EURO_A2);

var A2_TO_A3 = {
  AF:'AFG',AL:'ALB',DZ:'DZA',AO:'AGO',AM:'ARM',AR:'ARG',AU:'AUS',AT:'AUT',
  AZ:'AZE',BD:'BGD',BE:'BEL',BJ:'BEN',BT:'BTN',BO:'BOL',BA:'BIH',BW:'BWA',
  BR:'BRA',BN:'BRN',BG:'BGR',BI:'BDI',BY:'BLR',KH:'KHM',CM:'CMR',CA:'CAN',
  CF:'CAF',TD:'TCD',CL:'CHL',CN:'CHN',CO:'COL',CG:'COG',CD:'COD',KM:'COM',
  CR:'CRI',CI:'CIV',HR:'HRV',CU:'CUB',CY:'CYP',CZ:'CZE',DK:'DNK',DJ:'DJI',
  DO:'DOM',EC:'ECU',EG:'EGY',SV:'SLV',GQ:'GNQ',ER:'ERI',EE:'EST',ET:'ETH',
  FJ:'FJI',FI:'FIN',FR:'FRA',GA:'GAB',GM:'GMB',GE:'GEO',DE:'DEU',GH:'GHA',
  GR:'GRC',GT:'GTM',GN:'GIN',GY:'GUY',HT:'HTI',HN:'HND',HU:'HUN',IS:'ISL',
  IN:'IND',ID:'IDN',IR:'IRN',IQ:'IRQ',IE:'IRL',IL:'ISR',IT:'ITA',JM:'JAM',
  JP:'JPN',JO:'JOR',KZ:'KAZ',KE:'KEN',KP:'PRK',KR:'KOR',KW:'KWT',KG:'KGZ',
  LA:'LAO',LB:'LBN',LS:'LSO',LR:'LBR',LY:'LBY',LT:'LTU',LU:'LUX',LV:'LVA',
  MG:'MDG',MW:'MWI',MY:'MYS',ML:'MLI',MT:'MLT',MR:'MRT',MU:'MUS',MX:'MEX',
  MD:'MDA',ME:'MNE',MN:'MNG',MA:'MAR',MZ:'MOZ',MM:'MMR',NA:'NAM',NP:'NPL',
  NL:'NLD',NC:'NCL',NZ:'NZL',NI:'NIC',NE:'NER',NG:'NGA',MK:'MKD',NO:'NOR',
  PK:'PAK',PA:'PAN',PG:'PNG',PY:'PRY',PE:'PER',PH:'PHL',PL:'POL',PT:'PRT',
  QA:'QAT',RO:'ROU',RU:'RUS',RW:'RWA',ST:'STP',SA:'SAU',SN:'SEN',RS:'SRB',
  SL:'SLE',SK:'SVK',SI:'SVN',SO:'SOM',ZA:'ZAF',SS:'SSD',ES:'ESP',LK:'LKA',
  SD:'SDN',SR:'SUR',SZ:'SWZ',SE:'SWE',CH:'CHE',SY:'SYR',TJ:'TJK',TZ:'TZA',
  TH:'THA',TG:'TGO',TN:'TUN',TR:'TUR',TM:'TKM',UG:'UGA',UA:'UKR',AE:'ARE',
  GB:'GBR',US:'USA',UY:'URY',UZ:'UZB',VE:'VEN',VN:'VNM',YE:'YEM',ZM:'ZMB',
  ZW:'ZWE'
};

var A3_TO_A2 = {};
Object.entries(A2_TO_A3).forEach(function([a2, a3]) { A3_TO_A2[a3] = a2; });

var ESTAT_REMAP = { 'EL': 'GR', 'UK': 'GB' };
var WB_CODES = 'all';
var OECD_EUR = ''; 


// ============================================================================
// WORLD BANK FETCHER
// ============================================================================
async function fetchWorldBank(indicator) {
  console.log('  [WB] ' + indicator + '...');
  var countries = {};

  try {
    var page = 1, totalPages = 1;
    while (page <= totalPages && page <= 5) {
      // Fetch strictly for GLOBAL_YEAR
      var url = 'https://api.worldbank.org/v2/country/' + WB_CODES + '/indicator/' + indicator + '?date=' + GLOBAL_YEAR + '&format=json&per_page=500&page=' + page;
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
        
        if (year === GLOBAL_YEAR) {
          countries[a2] = Math.round(entry.value * 100) / 100;
        }
      });
      page++;
      if (page <= totalPages) await sleep(300);
    }
  } catch (e) {
    console.warn('  [WB] FAILED ' + indicator + ': ' + e.message);
  }

  console.log('  [WB] ' + indicator + ': ' + Object.keys(countries).length + ' countries');
  await sleep(500);
  return { countries: countries, year: GLOBAL_YEAR };
}

// ============================================================================
// EUROSTAT FETCHER
// ============================================================================
async function fetchEurostat(datasetCode, filters) {
  if (!filters) filters = {};
  console.log('  [EU] ' + datasetCode + '...');

  // Fetch strictly for GLOBAL_YEAR
  var url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/' + datasetCode + '?format=JSON&lang=EN&time=' + GLOBAL_YEAR;
  Object.entries(filters).forEach(function([key, val]) { url += '&' + key + '=' + val; });

  var countries = {};
  try {
    var raw = await httpGet(url, 'application/json');
    var json = JSON.parse(raw);
    if (!json.dimension || json.value === undefined) {
      console.log('  [EU] ' + datasetCode + ': Empty response');
      return { countries: {}, year: GLOBAL_YEAR };
    }

    var dimOrder = json.id || [];
    var dimSizes = json.size || [];

    if (dimOrder.indexOf('geo') === -1 || dimOrder.indexOf('time') === -1) {
      console.log('  [EU] ' + datasetCode + ': Missing geo/time');
      return { countries: {}, year: GLOBAL_YEAR };
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
          var yr = parseInt(timeCode);
          if (yr === GLOBAL_YEAR) {
             countries[alpha2] = Math.round(val * 100) / 100;
          }
        }
      }
    });

    console.log('  [EU] ' + datasetCode + ': ' + Object.keys(countries).length + ' countries');
    return { countries: countries, year: GLOBAL_YEAR };
  } catch (e) {
    console.warn('  [EU] FAILED ' + datasetCode + ': ' + e.message);
    return { countries: {}, year: GLOBAL_YEAR };
  }
}

// ============================================================================
// OECD FETCHER
// ============================================================================
function resolveCountryCode(code) {
  if (A3_TO_A2[code]) return A3_TO_A2[code];
  if (EURO_SET.has(code)) return code;
  return null;
}

function findDimIndex(dims, names) {
  for (var i = 0; i < dims.length; i++) {
    if (names.indexOf(dims[i].id) >= 0) return i;
  }
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
  var dataSet = null;
  var structure = null;

  if (json.data) {
    if (json.data.dataSets && json.data.dataSets.length > 0) dataSet = json.data.dataSets[0];
    if (json.data.structures && json.data.structures.length > 0) structure = json.data.structures[0];
    if (json.data.structure) structure = json.data.structure;
  }
  if (!dataSet && json.dataSets && json.dataSets.length > 0) dataSet = json.dataSets[0];
  if (!structure && json.structure) structure = json.structure;

  if (!dataSet || !structure) return { countries: {}, year: GLOBAL_YEAR };

  var dims = structure.dimensions || {};
  var countryNames = ['REF_AREA', 'LOCATION', 'COU', 'COUNTRY', 'CNTRY'];
  var timeNames = ['TIME_PERIOD', 'TIME', 'PERIOD'];

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
        if (isNaN(year) || year !== GLOBAL_YEAR) return;

        var val = valArr[0];
        if (val === null || val === undefined || isNaN(val)) return;

        countries[a2] = Math.round(val * 100) / 100;
      });
    }
  }

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
          if (isNaN(year) || year !== GLOBAL_YEAR) return;

          var val = valArr[0];
          if (val === null || val === undefined || isNaN(val)) return;

          countries[a2] = Math.round(val * 100) / 100;
        });
      });
    }
  }
  return { countries: countries, year: GLOBAL_YEAR };
}

async function fetchOECD(agency, dataflow, version, filterKey, label) {
  if (!label) label = dataflow;
  console.log('  [OECD] ' + label + '...');

  var baseUrl = 'https://sdmx.oecd.org/public/rest/data/' + agency + ',' + dataflow + ',' + version + '/' + filterKey;
  var accept = 'application/vnd.sdmx.data+json;version=2.0.0';

  // Request strictly for GLOBAL_YEAR
  var urls = [
    baseUrl + '?dimensionAtObservation=AllDimensions&startPeriod=' + GLOBAL_YEAR + '&endPeriod=' + GLOBAL_YEAR,
    baseUrl + '?startPeriod=' + GLOBAL_YEAR + '&endPeriod=' + GLOBAL_YEAR
  ];

  for (var i = 0; i < urls.length; i++) {
    try {
      var raw = await httpGet(urls[i], accept);
      var json = JSON.parse(raw);
      var parsed = parseSdmxJson(json, label + ' try' + (i+1));
      if (Object.keys(parsed.countries).length > 0) {
        console.log('  [OECD] ' + label + ': ' + Object.keys(parsed.countries).length + ' countries');
        await sleep(1500);
        return parsed;
      }
    } catch (e) {}
  }

  console.log('  [OECD] ' + label + ': 0 countries');
  await sleep(1500);
  return { countries: {}, year: GLOBAL_YEAR };
}

// ============================================================================
// ILO FETCHER
// ============================================================================
async function fetchILO(indicatorId, params, rowFilter) {
  console.log('  [ILO] ' + indicatorId + '...');
  
  // Request strictly for GLOBAL_YEAR
  var url = 'https://rplumber.ilo.org/data/indicator?id=' + indicatorId + '&timefrom=' + GLOBAL_YEAR + '&timeto=' + GLOBAL_YEAR + '&type=code&format=.csv';
  if (params) Object.entries(params).forEach(function([k, v]) { url += '&' + k + '=' + v; });

  var countries = {};
  try {
    var raw = await httpGet(url, 'text/csv');
    var lines = raw.split('\n');
    if (lines.length < 2) return { countries: {}, year: GLOBAL_YEAR };

    var header = lines[0].replace(/\uFEFF/g, '').replace(/"/g, '').split(',').map(function(h) { return h.trim(); });
    var refCol = header.indexOf('ref_area');
    var timeCol = header.indexOf('time');
    var valCol = header.indexOf('obs_value');

    if (refCol < 0 || timeCol < 0 || valCol < 0) return { countries: {}, year: GLOBAL_YEAR };

    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var cols = lines[i].replace(/"/g, '').split(',').map(function(c) { return c.trim(); });

      if (rowFilter) {
        var rowObj = {};
        header.forEach(function(h, idx) { rowObj[h] = cols[idx] || ''; });
        if (!rowFilter(rowObj)) continue;
      }

      var code = cols[refCol];
      var year = parseInt(cols[timeCol]);
      var val = parseFloat(cols[valCol]);

      if (!code || isNaN(year) || isNaN(val)) continue;
      if (year !== GLOBAL_YEAR) continue;

      var a2 = A3_TO_A2[code];
      if (!a2 && EURO_SET.has(code)) a2 = code;
      if (!a2) continue;

      countries[a2] = Math.round(val * 100) / 100;
    }
  } catch (e) {
    console.warn('  [ILO] FAILED: ' + e.message);
  }

  console.log('  [ILO] ' + indicatorId + ': ' + Object.keys(countries).length + ' countries');
  await sleep(1000);
  return { countries: countries, year: GLOBAL_YEAR };
}

// ============================================================================
// WHO FETCHER
// ============================================================================
async function fetchWHO(indicatorCode) {
  console.log('  [WHO] ' + indicatorCode + '...');
  var url = 'https://ghoapi.azureedge.net/api/' + indicatorCode;
  var countries = {};

  try {
    var raw = await httpGet(url, 'application/json');
    var json = JSON.parse(raw);
    if (json && json.value) {
      json.value.forEach(function(item) {
        if (item.SpatialDimType !== 'COUNTRY') return;
        var a3 = item.SpatialDim;
        var a2 = A3_TO_A2[a3];
        if (!a2) return;

        var year = parseInt(item.TimeDim);
        var val = parseFloat(item.NumericValue);

        // Filter strictly for GLOBAL_YEAR
        if (!isNaN(year) && !isNaN(val) && year === GLOBAL_YEAR) {
          countries[a2] = Math.round(val * 100) / 100;
        }
      });
    }
  } catch (e) {
    console.warn('  [WHO] FAILED ' + indicatorCode + ': ' + e.message);
  }

  console.log('  [WHO] ' + indicatorCode + ': ' + Object.keys(countries).length + ' countries');
  await sleep(1000);
  return { countries: countries, year: GLOBAL_YEAR };
}

// ============================================================================
// FETCH ALL INDICATORS
// ============================================================================
async function fetchAll() {
  console.log('=== DATA COMPARISON MAP — Data Fetch ===');
  console.log('Run at: ' + new Date().toISOString());
  console.log('GLOBAL FORCED YEAR: ' + GLOBAL_YEAR);
  console.log('Sources: Eurostat, World Bank, OECD, ILO, WHO');
  console.log('European countries: ' + EURO_A2.length + '\n');

  var OC = OECD_EUR;
  var data = {};

  // 1. UNEMPLOYMENT TOTAL
  console.log('\n📊 Unemployment rate - Total');
  var unemp_eu = await fetchEurostat('une_rt_a', { age: 'Y15-74', sex: 'T', unit: 'PC_ACT' });
  var unemp_wb = await fetchWorldBank('SL.UEM.TOTL.ZS');
  var unemp_ilo = await fetchILO('UNE_2EAP_SEX_AGE_RT_A', {}, function(row) { return row.sex === 'SEX_T' && (!row.classif1 || /TOTAL|YGE15/i.test(row.classif1)); });
  data.unemployment_total = {
    label: 'Unemployment rate - Total', unit: '%', category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...unemp_eu },
      ilo: { label: 'ILOSTAT', ...unemp_ilo },
      world_bank_wdi: { label: 'World Bank (WDI)', ...unemp_wb }
    }
  };

  // 2. UNEMPLOYMENT YOUTH
  console.log('\n📊 Unemployment rate - Youth');
  var uy_eu = await fetchEurostat('une_rt_a', { age: 'Y15-24', sex: 'T', unit: 'PC_ACT' });
  var uy_wb = await fetchWorldBank('SL.UEM.1524.ZS');
  var uy_ilo = await fetchILO('UNE_3EAP_SEX_AGE_DSB_RT_A', {}, function(row) { return row.sex === 'SEX_T' && /Y15-24|YTH/.test(row.classif1) && /TOTAL|TOT/.test(row.classif2); });
  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%', category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...uy_eu },
      youthstats: { label: 'YouthSTATS (ILO)', ...uy_ilo },
      world_bank_wdi: { label: 'World Bank (WDI)', ...uy_wb }
    }
  };

  // 3. EARNINGS
  console.log('\n📊 Earnings');
  var earn_eu = await fetchEurostat('earn_nt_net', { estruct: 'SNG_NCHI', ecase: 'AW', currency: 'EUR' });
  var earn_wb = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  var earn_oecd = await fetchOECD('OECD.ELS.SAE', 'DSD_EARNINGS@AV_AN_WAGE', '1.0', OC + '..EUR..Q..', 'AV_AN_WAGE');
  data.earnings = {
    label: 'Earnings', unit: 'USD/capita', category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...earn_eu },
      oecd: { label: 'OECD', ...earn_oecd },
      world_bank_wdi: { label: 'World Bank (WDI)', ...earn_wb }
    }
  };

  // 4. INTENTIONAL HOMICIDE
  console.log('\n📊 Intentional Homicide');
  var hom_eu = await fetchEurostat('crim_off_cat', { iccs: 'ICCS0101', unit: 'P_HTHAB' });
  var hom_wb = await fetchWorldBank('VC.IHR.PSRC.P5');
  var hom_oecd = await fetchOECD('OECD.CFE.EDS', 'DSD_REG_SOC@DF_SAFETY', '2.2', 'A.CTRY.' + OC + '..HOMIC...CS_10P5PS', 'SAFETY');
  data.intentional_homicide = {
    label: 'Intentional homicide', unit: 'per 100k inh.', category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...hom_eu },
      oecd: { label: 'OECD', ...hom_oecd },
      world_bank: { label: 'World Bank', ...hom_wb }
    }
  };

  // 5a. IMMIGRATION
  console.log('\n📊 Immigration');
  var imm_eu = await fetchEurostat('migr_imm1ctz', { citizen: 'TOTAL', age: 'TOTAL', sex: 'T' });
  data.immigration = {
    label: 'Immigration', unit: 'persons', category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...imm_eu }
    }
  };

  // 5b. NET MIGRATION
  console.log('\n📊 Net migration');
  var mig_wb = await fetchWorldBank('SM.POP.NETM');
  data.net_migration = {
    label: 'Net migration', unit: 'net persons', category: 'society',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...mig_wb }
    }
  };

  // 6. INFLATION
  console.log('\n📊 Inflation');
  var inf_eu = await fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A_AVG' });
  var inf_wb = await fetchWorldBank('FP.CPI.TOTL.ZG');
  data.inflation = {
    label: 'Inflation', unit: '%', category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...inf_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...inf_wb }
    }
  };

  // 7. POPULATION
  console.log('\n📊 Population');
  var pop_eu = await fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' });
  var pop_wb = await fetchWorldBank('SP.POP.TOTL');
  data.population = {
    label: 'Population', unit: 'persons', category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...pop_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pop_wb }
    }
  };

  // 8. LIFE EXPECTANCY
  console.log('\n📊 Life Expectancy');
  var le_eu = await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' });
  var le_wb = await fetchWorldBank('SP.DYN.LE00.IN');
  var le_oecd = await fetchOECD('OECD.ELS.HD', 'DSD_HEALTH_STAT@DF_LE', '1.1', OC + '.A.LFEXP..Y0._T.......', 'LE');
  var le_who = await fetchWHO('WHOSIS_000001'); 
  data.life_expectancy = {
    label: 'Life expectancy', unit: 'years', category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...le_eu },
      oecd: { label: 'OECD', ...le_oecd },
      who: { label: 'WHO', ...le_who },
      world_bank_wdi: { label: 'World Bank (WDI)', ...le_wb }
    }
  };

  // 9. FERTILITY
  console.log('\n📊 Fertility');
  var fert_eu = await fetchEurostat('demo_find', { indic_de: 'TOTFERRT' });
  var fert_wb = await fetchWorldBank('SP.DYN.TFRT.IN');
  data.fertility = {
    label: 'Fertility', unit: 'births/woman', category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...fert_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...fert_wb }
    }
  };

  // 10. GOVERNMENT DEBT
  console.log('\n📊 Government Debt');
  var debt_eu = await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' });
  var debt_wb = await fetchWorldBank('GC.DOD.TOTL.GD.ZS');
  var debt_oecd = await fetchOECD('OECD.GOV.GIP', 'DSD_GOV@DF_GOV_PF_2025', '1.0', 'A.' + OC + '.GGD.PT_B1GQ...', 'GOV_DEBT');
  data.government_debt = {
    label: 'Government Debt', unit: '% of GDP', category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...debt_eu },
      oecd: { label: 'OECD', ...debt_oecd },
      world_bank: { label: 'World Bank', ...debt_wb }
    }
  };

  // 11. HEALTHCARE SPENDING
  console.log('\n📊 Healthcare spending');
  var health_eu = await fetchEurostat('hlth_sha11_hf', { icha11_hf: 'TOT_HF', unit: 'PC_GDP' });
  var health_wb = await fetchWorldBank('SH.XPD.CHEX.GD.ZS');
  data.healthcare_spending = {
    label: 'Healthcare spending', unit: '% of GDP', category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...health_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...health_wb }
    }
  };

  // 12. EDUCATION SPENDING
  console.log('\n📊 Education spending');
  var edu_eu = await fetchEurostat('educ_uoe_fine09', { isced11: 'ED0-8', unit: 'PC_GDP' });
  var edu_wb = await fetchWorldBank('SE.XPD.TOTL.GD.ZS');
  data.education_spending = {
    label: 'Education spending', unit: '% of GDP', category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...edu_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...edu_wb }
    }
  };

  // 13. MILITARY SPENDING
  console.log('\n📊 Military spending');
  var mil_wb = await fetchWorldBank('MS.MIL.XPND.GD.ZS');
  data.military_spending = {
    label: 'Military spending', unit: '% of GDP', category: 'public_services',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...mil_wb }
    }
  };

  // 14. R&D SPENDING
  console.log('\n📊 R&D spending');
  var rd_eu = await fetchEurostat('rd_e_gerdtot', { sectperf: 'TOTAL', unit: 'PC_GDP' });
  var rd_wb = await fetchWorldBank('GB.XPD.RSDV.GD.ZS');
  data.rd_spending = {
    label: 'R&D spending', unit: '% of GDP', category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...rd_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...rd_wb }
    }
  };

  // 15. POVERTY RATE
  console.log('\n📊 Poverty rate');
  var pov_eu = await fetchEurostat('ilc_li02', { indic_il: 'LI_R_MD60', unit: 'PC' });
  var pov_wb = await fetchWorldBank('SI.POV.NAHC');
  data.poverty_rate = {
    label: 'Poverty rate', unit: '%', category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...pov_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...pov_wb }
    }
  };

  // 16. INFANT MORTALITY
  console.log('\n📊 Infant mortality');
  var infm_eu = await fetchEurostat('demo_minfind', { indic_de: 'INFMORRT' });
  var infm_wb = await fetchWorldBank('SP.DYN.IMRT.IN');
  var infm_who = await fetchWHO('MDG_0000000001'); 
  data.infant_mortality = {
    label: 'Infant mortality', unit: 'per 1,000 births', category: 'demographics',
    sources: {
      eurostat: { label: 'Eurostat', ...infm_eu },
      who: { label: 'WHO', ...infm_who },
      world_bank_wdi: { label: 'World Bank (WDI)', ...infm_wb }
    }
  };

  // 17. TERTIARY EDUCATION
  console.log('\n📊 Tertiary education');
  var tert_wb = await fetchWorldBank('SE.TER.ENRR');
  data.tertiary_education = {
    label: 'Tertiary education', unit: '% gross enrollment', category: 'public_services',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...tert_wb }
    }
  };

  // 18. FOREIGN DIRECT INVESTMENT
  console.log('\n📊 Foreign Direct Investment');
  var fdi_wb = await fetchWorldBank('BX.KLT.DINV.WD.GD.ZS');
  data.fdi = {
    label: 'Foreign Direct Investment', unit: '% of GDP', category: 'economy',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...fdi_wb }
    }
  };

  // 19. GDP GROWTH
  console.log('\n📊 GDP growth');
  var gdp_wb = await fetchWorldBank('NY.GDP.MKTP.KD.ZG');
  data.gdp_growth = {
    label: 'GDP growth', unit: '%', category: 'economy',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...gdp_wb }
    }
  };

  // 20. GDP PER CAPITA (PPP)
  console.log('\n📊 GDP per capita (PPP)');
  var gdppc_wb = await fetchWorldBank('NY.GDP.PCAP.PP.CD');
  data.gdp_per_capita = {
    label: 'GDP per capita (PPP)', unit: 'int. $', category: 'economy',
    sources: {
      world_bank_wdi: { label: 'World Bank (WDI)', ...gdppc_wb }
    }
  };

  // 21. GINI COEFFICIENT
  console.log('\n📊 Gini coefficient');
  var gini_eu = await fetchEurostat('ilc_di12', {});
  var gini_wb = await fetchWorldBank('SI.POV.GINI');
  data.gini_coefficient = {
    label: 'Gini coefficient', unit: 'index (0-100)', category: 'society',
    sources: {
      eurostat: { label: 'Eurostat', ...gini_eu },
      world_bank_wdi: { label: 'World Bank (WDI)', ...gini_wb }
    }
  };

  // POST-PROCESS: Remove empty sources
  Object.entries(data).forEach(function([key, dt]) {
    var cleanSources = {};
    Object.entries(dt.sources).forEach(function([sk, src]) {
      if (Object.keys(src.countries).length > 0) {
        cleanSources[sk] = src;
      } else {
        console.log('  Removing empty source (No data for ' + GLOBAL_YEAR + '): ' + dt.label + ' / ' + src.label);
      }
    });
    dt.sources = cleanSources;
  });

  // OUTPUT
  var output = {
    _meta: {
      lastUpdated: new Date().toISOString(),
      globalYear: GLOBAL_YEAR, // Explicitly tag the locked year
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

  // SUMMARY
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
      console.log('    ' + icon + ' ' + src.label + ': ' + n + ' countries (Year: ' + src.year + ')');
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log('  Global Locked Year: ' + GLOBAL_YEAR);
  console.log('  Indicators: ' + Object.keys(data).length);
  console.log('  Total sources: ' + total + ' | OK: ' + ok + ' | Low: ' + low + ' | Empty: ' + empty);
  console.log('  Output: data.json (' + (fs.statSync('data.json').size / 1024).toFixed(1) + ' KB)');
  console.log('='.repeat(70));
}

fetchAll().catch(function(e) {
  console.error('\n Fatal error:', e);
  process.exit(1);
});
