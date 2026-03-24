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
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024;

function get(url, maxRedirects) {
  if (maxRedirects === undefined) maxRedirects = 5;
  return new Promise(function(resolve, reject) {
    var client = url.startsWith('https') ? https : http;
    var req = client.get(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'DataMap/1.0' },
      timeout: 60000
    }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        var next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        return resolve(get(next, maxRedirects - 1));
      }
      if (res.statusCode >= 400) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() { reject(new Error('HTTP ' + res.statusCode + ' for ' + url + '\n' + body.substring(0, 200))); });
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

function getJSON(url) {
  return get(url).then(function(raw) { return JSON.parse(raw); });
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

// OECD country list as ISO3, used in filter keys
var OECD_COUNTRIES = 'AUT+BEL+BGR+HRV+CYP+CZE+DNK+EST+FIN+FRA+DEU+GRC+HUN+ISL+IRL+ITA+LVA+LTU+LUX+MLT+NLD+NOR+POL+PRT+ROU+SVK+SVN+ESP+SWE+CHE+GBR+ALB+BIH+MNE+MKD+SRB';

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
      var json = await getJSON(url);
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
// EUROSTAT FETCHER
// ============================================================
async function fetchEurostat(datasetCode, filters) {
  if (!filters) filters = {};
  console.log('  [EU] ' + datasetCode + '...');

  var url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/' + datasetCode + '?format=JSON&lang=EN';
  for (var y = 2025; y >= 2015; y--) url += '&time=' + y;
  Object.entries(filters).forEach(function([key, val]) { url += '&' + key + '=' + val; });

  try {
    var json = await getJSON(url);
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
// OECD FETCHER — new sdmx.oecd.org SDMX REST API
// Uses the exact same URL structure as OECD Data Explorer
// The dq= parameter from Data Explorer URLs becomes the filter
// key after the dataflow in the REST URL.
// ============================================================
async function fetchOECD(agency, dataflow, version, filterKey) {
  console.log('  [OECD] ' + dataflow + '...');

  var countries = {};
  var dataYear = 0;

  // Build URL exactly like OECD Data Explorer does:
  // https://sdmx.oecd.org/public/rest/data/{agency},{dataflow},{version}/{filterKey}
  var url = 'https://sdmx.oecd.org/public/rest/data/'
    + agency + ',' + dataflow + ',' + version
    + '/' + filterKey
    + '?dimensionAtObservation=AllDimensions';

  try {
    console.log('  [OECD] ' + url.substring(0, 200));
    var raw = await get(url);
    var json = JSON.parse(raw);

    if (!json.data || !json.data.dataSets || !json.data.dataSets[0]) {
      console.log('  [OECD] No data in response');
      return { countries: {}, year: 0 };
    }

    var dims = json.data.structure.dimensions.observation || [];
    var observations = json.data.dataSets[0].observations || {};

    var refIdx = -1, timeIdx = -1;
    dims.forEach(function(d, i) {
      if (d.id === 'REF_AREA') refIdx = i;
      if (d.id === 'TIME_PERIOD') timeIdx = i;
    });

    if (refIdx < 0 || timeIdx < 0) {
      console.log('  [OECD] Dims: ' + dims.map(function(d) { return d.id; }).join(', '));
      return { countries: {}, year: 0 };
    }

    var refValues = dims[refIdx].values;
    var timeValues = dims[timeIdx].values;

    console.log('  [OECD] Observations: ' + Object.keys(observations).length + ', Countries in response: ' + refValues.length);

    Object.entries(observations).forEach(function([key, valArr]) {
      var parts = key.split(':');
      var refObj = refValues[parseInt(parts[refIdx])];
      var timeObj = timeValues[parseInt(parts[timeIdx])];
      if (!refObj || !timeObj) return;

      var code = refObj.id;
      var a2 = A3_TO_A2[code];
      if (!a2 && EURO_SET.has(code)) a2 = code;
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

  } catch (e) {
    console.warn('  [OECD] FAILED: ' + e.message.substring(0, 250));
  }

  var result = {};
  Object.entries(countries).forEach(function([a2, d]) {
    result[a2] = Math.round(d.value * 100) / 100;
  });
  console.log('  [OECD] ' + dataflow + ': ' + Object.keys(result).length + ' countries, year ' + dataYear);
  await sleep(1500);
  return { countries: result, year: dataYear };
}

// ============================================================
// ILO/ILOSTAT FETCHER (YouthSTATS)
// ============================================================
async function fetchILO(dataflowId, filterKey) {
  console.log('  [ILO] ' + dataflowId + '...');

  var countries = {};
  var dataYear = 0;

  var url = 'https://sdmx.ilo.org/rest/data/' + dataflowId + '/' + filterKey
    + '?startPeriod=2018&endPeriod=2025&dimensionAtObservation=AllDimensions';

  try {
    console.log('  [ILO] ' + url.substring(0, 180));
    var raw = await get(url);
    var json = JSON.parse(raw);

    // SDMX-JSON v2 flat
    if (json.data && json.data.dataSets && json.data.dataSets[0]) {
      var dims = json.data.structure.dimensions.observation || [];
      var observations = json.data.dataSets[0].observations || {};

      var refIdx = -1, timeIdx = -1;
      dims.forEach(function(d, i) {
        if (d.id === 'REF_AREA') refIdx = i;
        if (d.id === 'TIME_PERIOD') timeIdx = i;
      });

      if (refIdx >= 0 && timeIdx >= 0) {
        var refValues = dims[refIdx].values;
        var timeValues = dims[timeIdx].values;

        Object.entries(observations).forEach(function([key, valArr]) {
          var parts = key.split(':');
          var refObj = refValues[parseInt(parts[refIdx])];
          var timeObj = timeValues[parseInt(parts[timeIdx])];
          if (!refObj || !timeObj) return;

          var code = refObj.id;
          var a2 = A3_TO_A2[code];
          if (!a2 && EURO_SET.has(code)) a2 = code;
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

    // Fallback: SDMX-JSON v1 series
    if (Object.keys(countries).length === 0 && json.dataSets && json.dataSets[0] && json.structure) {
      var allSeries = json.dataSets[0].series || {};
      var seriesDims = json.structure.dimensions.series || [];
      var obsDims = json.structure.dimensions.observation || [];

      var refDimIdx = -1;
      seriesDims.forEach(function(d, i) {
        if (d.id === 'REF_AREA') refDimIdx = i;
      });

      var timePeriods = obsDims[0] ? obsDims[0].values : [];

      if (refDimIdx >= 0) {
        Object.entries(allSeries).forEach(function([seriesKey, sData]) {
          var keyParts = seriesKey.split(':');
          var locObj = seriesDims[refDimIdx].values[parseInt(keyParts[refDimIdx])];
          if (!locObj) return;
          var code = locObj.id;
          var a2 = A3_TO_A2[code];
          if (!a2 && EURO_SET.has(code)) a2 = code;
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

  } catch (e) {
    console.warn('  [ILO] FAILED: ' + e.message.substring(0, 200));
  }

  var result = {};
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

  // Shorter OECD country list (only countries OECD actually has data for)
  var OC = OECD_COUNTRIES;

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
  // ILO YouthSTATS: unemployment rate by sex and age
  var uy_ilo = await fetchILO(
    'ILO,DF_UNE_2EAP_SEX_AGE_RT,1.0',
    '.' + OC + '.A..SEX_T.AGE_YTHADULT_Y15-24'
  );
  data.unemployment_youth = {
    label: 'Unemployment rate - Youth', unit: '%',
    category: 'economy',
    sources: {
      eurostat: { label: 'Eurostat', ...uy_eu },
      youthstats: { label: 'YouthSTATS (ILO)', ...uy_ilo },
      world_bank_wdi: { label: 'World Bank (WDI)', ...uy_wb }
    }
  };
  await sleep(1000);

  // 3. EARNINGS
  console.log('\n📊 Earnings');
  var earn_eu = await fetchEurostat('earn_nt_net', { estruct: 'SNG_NCHI', ecase: 'AW', currency: 'EUR' });
  var earn_wb = await fetchWorldBank('NY.GNP.PCAP.PP.CD');
  // OECD: Average annual wages in USD PPP
  // Decoded from OECD Data Explorer: agency=OECD.ELS.SAE, df=DSD_EARNINGS@DF_AV_AN_WAGE
  var earn_oecd = await fetchOECD(
    'OECD.ELS.SAE', 'DSD_EARNINGS@DF_AV_AN_WAGE', '1.0',
    OC + '.USDPPP'
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
  console.log('\n📊 Intentional Homicide');
  var hom_eu = await fetchEurostat('crim_off_cat', { iccs: 'ICCS0101', unit: 'P_HTHAB' });
  var hom_wb = await fetchWorldBank('VC.IHR.PSRC.P5');
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
  console.log('\n📊 Life Expectancy');
  var le_eu = await fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T' });
  var le_wb = await fetchWorldBank('SP.DYN.LE00.IN');
  // OECD: Life expectancy — exact URL from friend's Data Explorer link
  // agency=OECD.ELS.HD, df=DSD_HEALTH_STAT@DF_LE, version=1.1
  // dq= COUNTRIES.A.LFEXP..Y0._T.......
  var le_oecd = await fetchOECD(
    'OECD.ELS.HD', 'DSD_HEALTH_STAT@DF_LE', '1.1',
    OC + '.A.LFEXP..Y0._T.......'
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
  console.log('\n📊 Government Debt');
  var debt_eu = await fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' });
  var debt_wb = await fetchWorldBank('GC.DOD.TOTL.GD.ZS');
  // OECD: Government gross debt — exact from friend's Data Explorer link
  // agency=OECD.GOV.GIP, df=DSD_GOV@DF_GOV_PF_2025, version=1.0
  // dq= A.COUNTRIES.GGD.PT_B1GQ...
  var debt_oecd = await fetchOECD(
    'OECD.GOV.GIP', 'DSD_GOV@DF_GOV_PF_2025', '1.0',
    'A.' + OC + '.GGD.PT_B1GQ...'
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
  // OECD: Health expenditure % GDP
  var health_oecd = await fetchOECD(
    'OECD.ELS.HD', 'DSD_SHA@DF_SHA', '1.0',
    OC + '.A.EXP.PT_B1GQ.HCTOT.HFTOT._T'
  );
  data.healthcare_spending = {
    label: 'Healthcare spending', unit: '% of GDP',
    category: 'public_services',
    sources: {
      eurostat: { label: 'Eurostat', ...health_eu },
      oecd: { label: 'OECD', ...health_oecd },
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
