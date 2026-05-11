// ============================================================
// DATA COMPARISON MAP — Wix Custom Element
// Styles in styles.css · Data in data.json
// ============================================================

const LOW_RES_MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const HIGH_RES_MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';
const DETAIL_LAYER_ZOOM_THRESHOLD = 2.5;
const WORLD_VIEWBOX_WIDTH = 1000;
const WORLD_VIEWBOX_HEIGHT = 500;
const WORLD_VIEWBOX = { x: 0, y: 0, w: WORLD_VIEWBOX_WIDTH, h: WORLD_VIEWBOX_HEIGHT };

const OVERVIEW_LAYER_DECIMAL_PLACES = 1;
const DETAIL_LAYER_DECIMAL_PLACES = 2; 

const PROJECTION_HEIGHT = 650; 
const PROJECTION_Y_OFFSET = (WORLD_VIEWBOX_HEIGHT - PROJECTION_HEIGHT) / 2;

const WORLD_CONTENT_PADDING_X = 20;
const WORLD_CONTENT_PADDING_Y = 20;
const WORLD_CONTENT_BBOX = {
  x: WORLD_VIEWBOX.x - WORLD_CONTENT_PADDING_X,
  y: PROJECTION_Y_OFFSET - WORLD_CONTENT_PADDING_Y,
  w: WORLD_VIEWBOX.w + (WORLD_CONTENT_PADDING_X * 2),
  h: PROJECTION_HEIGHT + (WORLD_CONTENT_PADDING_Y * 2)
};

const ANTIMERIDIAN_SPLIT_THRESHOLD = 90;

const NUMERIC_TO_ALPHA2 = {
  '004':'AF','008':'AL','012':'DZ','024':'AO','031':'AZ','032':'AR',
  '036':'AU','040':'AT','050':'BD','051':'AM','056':'BE','064':'BT',
  '068':'BO','070':'BA','072':'BW','076':'BR','096':'BN','100':'BG',
  '104':'MM','108':'BI','112':'BY','116':'KH','120':'CM','124':'CA',
  '140':'CF','144':'LK','148':'TD','152':'CL','156':'CN','170':'CO',
  '174':'KM','178':'CG','180':'CD','188':'CR','191':'HR','192':'CU',
  '196':'CY','203':'CZ','204':'BJ','208':'DK','214':'DO','218':'EC',
  '222':'SV','226':'GQ','231':'ET','232':'ER','233':'EE','242':'FJ',
  '246':'FI','250':'FR','262':'DJ','266':'GA','268':'GE','270':'GM',
  '276':'DE','288':'GH','300':'GR','320':'GT','324':'GN','328':'GY',
  '332':'HT','340':'HN','348':'HU','352':'IS','356':'IN','360':'ID',
  '364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','384':'CI',
  '388':'JM','392':'JP','398':'KZ','400':'JO','404':'KE','408':'KP',
  '410':'KR','414':'KW','417':'KG','418':'LA','422':'LB','426':'LS',
  '428':'LV','430':'LR','434':'LY','440':'LT','442':'LU','450':'MG',
  '454':'MW','458':'MY','466':'ML','470':'MT','478':'MR','480':'MU',
  '484':'MX','496':'MN','498':'MD','499':'ME','504':'MA','508':'MZ',
  '516':'NA','524':'NP','528':'NL','540':'NC','554':'NZ','558':'NI',
  '562':'NE','566':'NG','578':'NO','586':'PK','591':'PA','598':'PG',
  '600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','634':'QA',
  '642':'RO','643':'RU','646':'RW','678':'ST','682':'SA','686':'SN',
  '688':'RS','694':'SL','703':'SK','704':'VN','705':'SI','706':'SO',
  '710':'ZA','716':'ZW','724':'ES','728':'SS','729':'SD','740':'SR',
  '748':'SZ','752':'SE','756':'CH','760':'SY','762':'TJ','764':'TH',
  '768':'TG','784':'AE','788':'TN','792':'TR','795':'TM','800':'UG',
  '804':'UA','807':'MK','818':'EG','826':'GB','834':'TZ','840':'US',
  '858':'UY','860':'UZ','862':'VE','887':'YE','894':'ZM'
};
const ALPHA2_TO_NAME = {
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

const CATEGORY_META = {
  economy: { label: 'Economy', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/><path d="M4 12a8 8 0 018-8v2a6 6 0 100 12v2a8 8 0 01-8-8z"/>' },
  demographics: { label: 'Demographics', icon: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>' },
  society: { label: 'Society', icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>' },
  public_services: { label: 'Services', icon: '<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>' }
};

function getColor(t) {
  const c = [[200,214,229],[131,149,167],[87,101,116],[34,47,62],[10,22,40]];
  const n = c.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = (t * n) - i;
  return `rgb(${Math.round(c[i][0]+(c[i+1][0]-c[i][0])*f)},${Math.round(c[i][1]+(c[i+1][1]-c[i][1])*f)},${Math.round(c[i][2]+(c[i+1][2]-c[i][2])*f)})`;
}

function fmt(val, unit) {
  if (val == null) return 'No data';
  if (unit === 'persons' && Math.abs(val) >= 1e6) return (val/1e6).toFixed(1) + 'M';
  if (unit === 'persons') return val.toLocaleString();
  if (unit === 'net persons' && Math.abs(val) >= 1e6) return (val > 0 ? '+' : '') + (val/1e6).toFixed(1) + 'M';
  if (unit === 'net persons') return (val > 0 ? '+' : '') + val.toLocaleString();
  if (unit === 'USD/capita' || unit === 'int. $') return '$' + Math.round(val).toLocaleString();
  if (unit === '% of GDP' || unit === '%') return val.toFixed(1) + '%';
  if (unit === 'births/woman') return val.toFixed(2);
  if (unit === 'years') return val.toFixed(1);
  if (unit === 'per 100k inh.') return val.toFixed(2);
  if (unit === 'per 1,000 births') return val.toFixed(1);
  if (unit === '% gross enrollment') return val.toFixed(1) + '%';
  if (unit === 'index (0-100)') return val.toFixed(1);
  return String(val);
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function animateValue(el, startVal, endVal, unit, duration = 300) {
  if (startVal === endVal) { el.textContent = fmt(endVal, unit); return; }
  if (endVal == null || isNaN(endVal)) { el.textContent = fmt(endVal, unit); return; }
  if (startVal == null || isNaN(startVal)) { el.textContent = fmt(endVal, unit); return; }
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (endVal - startVal) * ease;
    el.textContent = fmt(current, unit);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(endVal, unit);
  }
  requestAnimationFrame(tick);
}

// Hardcoded Historical Data (2020-2024)
const HISTORY_DATA = {
  gdp_per_capita: {
    US: { 2020: 63527, 2021: 70667, 2022: 76329, 2023: 81632, 2024: 85300, txt: { 2020: "COVID-19 pandemic caused a dip in GDP.", 2024: "Strong economic recovery and tech sector growth." } },
    CN: { 2020: 10408, 2021: 12556, 2022: 12720, 2023: 12614, 2024: 13100, txt: { 2020: "Only major economy to grow in 2020.", 2024: "Post-lockdown adjustments and real estate cooling." } },
    DE: { 2020: 46772, 2021: 51203, 2022: 48717, 2023: 52729, 2024: 54200, txt: { 2022: "Energy crisis impacted industrial output." } },
    CZ: { 2020: 22933, 2021: 26821, 2022: 27691, 2023: 30426, 2024: 31200, txt: { 2023: "High inflation impacted real wage growth." } },
    SK: { 2020: 19442, 2021: 21383, 2022: 21258, 2023: 24470, 2024: 25100, txt: { 2020: "Automotive sector slowdown during pandemic." } }
  },
  population: {
    US: { 2020: 331.4, 2021: 332.0, 2022: 333.2, 2023: 334.9, 2024: 335.8, txt: {} },
    CN: { 2020: 1411.1, 2021: 1412.3, 2022: 1412.1, 2023: 1409.6, 2024: 1407.0, txt: { 2022: "First population decline in decades.", 2024: "Aging population demographics accelerate." } },
    DE: { 2020: 83.1, 2021: 83.2, 2022: 84.3, 2023: 84.4, 2024: 84.5, txt: { 2022: "Population bump due to Ukrainian refugees." } },
    CZ: { 2020: 10.7, 2021: 10.5, 2022: 10.8, 2023: 10.9, 2024: 10.9, txt: { 2022: "Significant influx of refugees increased total pop." } },
    SK: { 2020: 5.46, 2021: 5.43, 2022: 5.43, 2023: 5.42, 2024: 5.42, txt: {} }
  },
  rd_spending: {
    US: { 2020: 3.45, 2021: 3.46, 2022: 3.46, 2023: 3.50, 2024: 3.52, txt: {} },
    CN: { 2020: 2.40, 2021: 2.43, 2022: 2.54, 2023: 2.64, 2024: 2.70, txt: { 2024: "Heavy investments in AI and semiconductors." } },
    DE: { 2020: 3.13, 2021: 3.13, 2022: 3.13, 2023: 3.14, 2024: 3.15, txt: {} },
    CZ: { 2020: 1.99, 2021: 1.99, 2022: 1.96, 2023: 1.98, 2024: 2.00, txt: {} },
    SK: { 2020: 0.91, 2021: 0.92, 2022: 0.98, 2023: 1.00, 2024: 1.05, txt: {} }
  },
  life_expectancy: {
    US: { 2020: 77.0, 2021: 76.4, 2022: 77.5, 2023: 77.6, 2024: 77.8, txt: { 2021: "Significant drop due to pandemic." } },
    CN: { 2020: 77.9, 2021: 78.2, 2022: 78.5, 2023: 78.6, 2024: 78.8, txt: {} },
    DE: { 2020: 81.1, 2021: 80.8, 2022: 80.7, 2023: 81.2, 2024: 81.5, txt: {} },
    CZ: { 2020: 78.2, 2021: 77.3, 2022: 79.0, 2023: 79.5, 2024: 79.8, txt: {} },
    SK: { 2020: 76.8, 2021: 74.5, 2022: 77.0, 2023: 77.8, 2024: 78.1, txt: { 2021: "Severe COVID impact on mortality rates." } }
  }
};

// Future Projection Engine Data
const FUTURE_DATA = {
  gdp_per_capita: {
    CZ: {
      desc: "The Czech Republic's growth isn't really decided in Prague; it’s decided by consumer demand in Germany, trade policy in Washington, and the global price of gas/electricity.",
      base_growth: 0.005, // 0.5% default baseline growth
      factors: [
        { id: "cz_auto", title: "Does the German Auto Industry Recover?", info: "Since the Czech Republic is essentially an industrial sub-supplier for Germany, our GDP is tied to their success.", yes: "If German car brands successfully pivot to EVs, Czech factories will boom.", no: "If Germany stays in a recession, the Czech Republic's industrial core will shrink.", impact: 0.02 },
        { id: "cz_trade", title: "Do Global Trade Tariffs Stay Low?", info: "The Czech Republic is one of the most export-dependent countries in the world.", yes: "If global trade remains open, Czech products will continue to drive growth.", no: "If the US imposes heavy tariffs, it will devastate Czech exports.", impact: 0.015 },
        { id: "cz_energy", title: "Will Energy Prices Stabilize?", info: "Czech industry is 'energy-heavy' (steel, glass, chemicals, automotive).", yes: "If the Czech Republic builds out new nuclear blocks, factories will stay.", no: "If electricity stays expensive, manufacturers will move.", impact: 0.01 }
      ]
    },
    DE: {
      desc: "Germany is transitioning from an export-led industrial powerhouse to a more service-oriented economy amidst severe demographic and energy challenges.",
      base_growth: 0.002,
      factors: [
        { id: "de_energy", title: "Successful Green Energy Transition?", info: "Germany's 'Energiewende' must provide cheap, reliable power for heavy industry.", yes: "Abundant renewables lower industrial costs, keeping manufacturing domestic.", no: "High energy costs cause deindustrialization and capital flight.", impact: 0.015 },
        { id: "de_tech", title: "Can Germany Catch Up in AI & Software?", info: "Germany dominates hardware but lags in global software and AI sectors.", yes: "Massive EU/state investment creates a booming European tech hub.", no: "Continued reliance on legacy mechanics limits productivity growth.", impact: 0.012 },
        { id: "de_labor", title: "Integration of Skilled Migrants?", info: "With a rapidly aging workforce, Germany needs millions of skilled workers.", yes: "Successful integration fills labor shortages and boosts consumption.", no: "Labor shortages cripple mid-sized 'Mittelstand' companies.", impact: 0.01 }
      ]
    },
    US: {
      desc: "The US economy relies on massive consumer spending, global dollar dominance, and undisputed leadership in the technology and financial sectors.",
      base_growth: 0.015,
      factors: [
        { id: "us_ai", title: "Does AI Drive the Next Productivity Boom?", info: "The US leads the global AI race, which promises massive efficiency gains.", yes: "AI adoption creates a 'Roaring 2020s' productivity miracle.", no: "AI proves to be a bubble with minimal real-world economic translation.", impact: 0.02 },
        { id: "us_debt", title: "Can the US Manage its National Debt?", info: "Rising interest rates make the massive US deficit more expensive to maintain.", yes: "Fiscal discipline and high growth naturally shrink the debt burden.", no: "Debt servicing crowds out infrastructure and research investments.", impact: 0.01 },
        { id: "us_reshoring", title: "Does 'Made in America' Reshoring Succeed?", info: "Trillions are being spent to bring chip and battery manufacturing back to the US.", yes: "New domestic factories create high-paying jobs and secure supply chains.", no: "High domestic labor costs make reshored products uncompetitive globally.", impact: 0.015 }
      ]
    },
    CN: {
      desc: "China is shifting from real-estate and infrastructure-led growth to high-tech manufacturing, while battling deflation and a shrinking population.",
      base_growth: 0.03,
      factors: [
        { id: "cn_export", title: "Do Chinese EVs Dominate Global Markets?", info: "China has massively subsidized its EV and solar panel industries.", yes: "Chinese brands become the global standard, driving massive export wealth.", no: "Western tariffs block Chinese cars, stalling the manufacturing engine.", impact: 0.02 },
        { id: "cn_property", title: "Does the Real Estate Market Stabilize?", info: "Property once drove 25% of China's GDP, but is now in a managed decline.", yes: "The government safely absorbs bad debts, restoring consumer confidence.", no: "A prolonged property slump causes a 'Japanese-style' lost decade.", impact: 0.015 },
        { id: "cn_consumer", title: "Will the Chinese Consumer Spend?", info: "China needs its middle class to spend more to offset falling exports.", yes: "Social safety nets improve, unleashing trillions in domestic spending.", no: "Deflationary mindset takes hold; citizens save instead of spend.", impact: 0.015 }
      ]
    },
    SK: {
      desc: "Slovakia is the world's largest car producer per capita, making it highly vulnerable to automotive trends and automation.",
      base_growth: 0.01,
      factors: [
        { id: "sk_ev", title: "Successful Pivot to EV Manufacturing?", info: "Slovak plants assemble traditional cars; they must retool for electric vehicles.", yes: "Major battery plants are built, and factories successfully retool.", no: "Automakers shift EV production to cheaper or more subsidized countries.", impact: 0.02 },
        { id: "sk_brain", title: "Reversing the 'Brain Drain'?", info: "Hundreds of thousands of young Slovaks leave for Czechia and Austria.", yes: "Economic reforms and tech investments lure young professionals back.", no: "The loss of educated youth stifles innovation and tax revenues.", impact: 0.015 },
        { id: "sk_infra", title: "Completion of Key Infrastructure?", info: "Slovakia's east-west highway and rail networks have been delayed for decades.", yes: "EU funds are fully utilized to connect the poorer East to European markets.", no: "Corruption and bureaucracy leave EU funds unspent and infrastructure broken.", impact: 0.01 }
      ]
    }
  }
};


// ============================================================
class DataComparisonMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.DATA = {};
    this.categories = {};
    this.currentCategory = null;
    this.currentDataType = null;
    this.currentSource = null;
    this.geoFeaturesLowRes = [];
    this.geoFeaturesHighRes = [];
    this._lastTtVal = null;
    this._lastTtDataType = null;
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._panStartPanX = 0;
    this._panStartPanY = 0;
    this._dragged = false;
    this._animFrame = null;
    this._isHighResVisible = false;
    this._isDesktop = false;
    this._minZoom = 1;
    this._maxZoom = 6;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.html();
    this._isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.init();
  }

  $(s) { return this.shadowRoot.querySelector(s); }
  $$(s) { return this.shadowRoot.querySelectorAll(s); }

  async init() {
    const scripts = document.querySelectorAll('script[src*="data-comparison-map"]');
    let baseUrl = '';
    if (scripts.length) { const src = scripts[scripts.length - 1].src; baseUrl = src.substring(0, src.lastIndexOf('/') + 1); }
    this._baseUrl = baseUrl;

    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = baseUrl + 'styles.css';
    this.shadowRoot.prepend(link);
    await new Promise(resolve => { link.onload = resolve; link.onerror = resolve; });

    const [, dataRaw, lowResTopoRaw, highResTopoRaw] = await Promise.all([
      loadScript(TOPOJSON_CLIENT_URL),
      fetch(baseUrl + 'data.json').then(r => r.json()),
      fetch(LOW_RES_MAP_TOPO_URL).then(r => r.json()),
      fetch(HIGH_RES_MAP_TOPO_URL).then(r => r.json())
    ]);

    Object.entries(dataRaw).forEach(([k, v]) => { if (k !== '_meta') this.DATA[k] = v; });
    this.categories = {};
    Object.entries(this.DATA).forEach(([key, dt]) => {
      const cat = dt.category || 'other';
      if (!this.categories[cat]) this.categories[cat] = [];
      this.categories[cat].push(key);
    });

    if (dataRaw._meta && dataRaw._meta.lastUpdated) {
      const d = new Date(dataRaw._meta.lastUpdated);
      this.$('#lastUpdated').textContent = 'Data updated: ' + d.toLocaleDateString();
    }

    const logoEl = this.$('#navLogo'); if (logoEl) logoEl.src = baseUrl + 'logo.png';
    const logoMob = this.$('#navLogoMobile'); if (logoMob) logoMob.src = baseUrl + 'logo-mobile.png';

    const supportBtn = this.$('#supportBtn');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => {
        window.parent.postMessage({ action: 'openLightbox', lightboxName: 'Support Us' }, '*');
      });
    }

    const aboutBtn = this.$('#aboutBtn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        window.parent.postMessage({ action: 'redirect', url: '/landing' }, '*');
      });
    }

    if (this._isDesktop) {
      const filterDiv = document.createElement('div');
      filterDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" role="presentation" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence"/><feComponentTransfer in="turbulence" result="mapped"><feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/><feFuncG type="gamma" amplitude="0" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5"/></feComponentTransfer><feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"/><feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lighting-color="white" result="specLight"><fePointLight x="-200" y="-200" z="300"/></feSpecularLighting><feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage"/><feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
      this.shadowRoot.appendChild(filterDiv.firstChild);
    }

    const lowResAll = topojson.feature(lowResTopoRaw, lowResTopoRaw.objects.countries);
    const highResAll = topojson.feature(highResTopoRaw, highResTopoRaw.objects.countries);
    this.geoFeaturesLowRes = lowResAll.features.filter(f => NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')]);
    this.geoFeaturesHighRes = highResAll.features.filter(f => NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')]);

    this.drawMap();
    this.buildCategoryButtons();
    const firstCat = Object.keys(this.categories)[0];
    if (firstCat) this.selectCategory(firstCat);
    if (this._isDesktop) this.initZoomPan();

    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';
  }

  _lonToX(lon) { return (lon + 180) * (WORLD_VIEWBOX.w / 360); }
  _latToY(lat) { return ((90 - lat) * (PROJECTION_HEIGHT / 180)) + PROJECTION_Y_OFFSET; }
  _proj(c) { return [this._lonToX(c[0]), this._latToY(c[1])]; }

  _getEventCenter(e, pathEl) {
    if (!e) return '50% 50%';
    const svg = this.$('#mapSvg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    pt.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    if (pt.x === 0 && pt.y === 0) return '50% 50%';
    
    try {
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const bbox = pathEl.getBBox();
      if (bbox.width === 0 || bbox.height === 0) return '50% 50%';
      const px = ((svgP.x - bbox.x) / bbox.width) * 100;
      const py = ((svgP.y - bbox.y) / bbox.height) * 100;
      return `${Math.max(0, Math.min(100, px))}% ${Math.max(0, Math.min(100, py))}%`;
    } catch(err) {
      return '50% 50%';
    }
  }

  drawMap() {
    const svg = this.$('#mapSvg');
    svg.innerHTML = '';
    const proj = c => this._proj(c);
    svg.appendChild(this._buildResolutionGroup(this.geoFeaturesLowRes, 'euro-group low-res', proj, OVERVIEW_LAYER_DECIMAL_PLACES));
    svg.appendChild(this._buildResolutionGroup(this.geoFeaturesHighRes, 'euro-group high-res', proj, DETAIL_LAYER_DECIMAL_PLACES));
    this._isHighResVisible = !(this._zoom >= DETAIL_LAYER_ZOOM_THRESHOLD);
    this._syncDetailLayerVisibility();

    // Persistent overlays for animation
    const overlayG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlayG.setAttribute('id', 'mapOverlayGroup');
    overlayG.style.pointerEvents = 'none';
    
    const sPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    sPath.setAttribute('id', 'selectOverlay');
    sPath.setAttribute('class', 'overlay-selected');
    sPath.style.clipPath = 'circle(0% at 50% 50%)';
    
    const hPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hPath.setAttribute('id', 'hoverOverlay');
    hPath.setAttribute('class', 'overlay-hovered');
    hPath.style.clipPath = 'circle(0% at 50% 50%)';

    // Hover FIRST, then select SECOND, so select is always on top!
    overlayG.appendChild(hPath);
    overlayG.appendChild(sPath);
    svg.appendChild(overlayG);

    const self = this;
    // Click ocean to deselect
    svg.addEventListener('click', function(e) {
      if (self._dragged) return; // ignore if we just dragged
      if (!e.target.classList.contains('cp')) self.closeSidePanel();
    });
    svg.addEventListener('touchstart', function(e) {
      if (!e.target.classList.contains('cp')) {
        self.$$('.cp.touched').forEach(el => el.classList.remove('touched'));
        self.ttHide();
        self.closeSidePanel();
      }
    });
  }

  _buildResolutionGroup(features, className, proj, precision) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    features.forEach(f => {
      const a2 = NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')];
      if (!a2) return;
      this.geoPaths(f.geometry, proj, precision).forEach(d => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        p.dataset.code = a2;
        p.dataset.name = ALPHA2_TO_NAME[a2] || a2;
        p.classList.add('cp', 'no-data');
        this._bindCountryInteractions(p);
        group.appendChild(p);
      });
    });
    return group;
  }

  _bindCountryInteractions(pathEl) {
    const self = this;
    pathEl.addEventListener('mouseenter', function(e) { 
      const hOverlay = self.$('#hoverOverlay');
      if(hOverlay) {
        hOverlay.style.transition = 'none';
        hOverlay.setAttribute('d', pathEl.getAttribute('d'));
        const origin = self._getEventCenter(e, pathEl);
        hOverlay.style.clipPath = `circle(0% at ${origin})`;
        hOverlay.offsetHeight; // reflow
        hOverlay.style.transition = 'clip-path 0.25s ease-out';
        hOverlay.style.clipPath = `circle(150% at ${origin})`;
      }
      self.ttShow(e); 
    });
    pathEl.addEventListener('mousemove', function(e) { self.ttMove(e); });
    pathEl.addEventListener('mouseleave', function(e) { 
      const hOverlay = self.$('#hoverOverlay');
      if(hOverlay) {
        const origin = self._getEventCenter(e, pathEl);
        hOverlay.style.clipPath = `circle(0% at ${origin})`; // Shrink back to exit point
      }
      self.ttHide(); 
    });
    pathEl.addEventListener('click', function(e) { 
      if (self._dragged) return; 
      self.openSidePanel(pathEl.dataset.code, pathEl.dataset.name, pathEl, e); 
    });
    pathEl.addEventListener('touchstart', function(e) {
      e.preventDefault();
      self.$$('.cp.touched').forEach(el => el.classList.remove('touched'));
      pathEl.classList.add('touched');
      const hOverlay = self.$('#hoverOverlay');
      if(hOverlay) {
        hOverlay.style.transition = 'none';
        hOverlay.setAttribute('d', pathEl.getAttribute('d'));
        hOverlay.style.clipPath = 'circle(150% at 50% 50%)';
      }
      const touch = e.touches[0];
      const fakeEvent = { target: pathEl, clientX: touch.clientX, clientY: touch.clientY };
      self.ttShow(fakeEvent);
      self.ttMove(fakeEvent);
    }, { passive: false });
  }

  openSidePanel(code, name, pathEl, e) {
    this._selectedCountryCode = code;
    this._selectedCountryName = name;

    this.$$('.cp').forEach(el => el.classList.remove('selected'));
    if (!pathEl) pathEl = this.$$(`.cp[data-code="${code}"]`)[0];
    if (pathEl) pathEl.classList.add('selected');

    if (pathEl && e) {
      const sOverlay = this.$('#selectOverlay');
      if (sOverlay) {
        sOverlay.style.transition = 'none';
        sOverlay.setAttribute('d', pathEl.getAttribute('d'));
        const origin = this._getEventCenter(e, pathEl);
        sOverlay.style.clipPath = `circle(0% at ${origin})`;
        sOverlay.offsetHeight; 
        sOverlay.style.transition = 'clip-path 0.3s ease-out';
        sOverlay.style.clipPath = `circle(150% at ${origin})`;
      }
    }

    if (!HISTORY_DATA[this.currentDataType] || !HISTORY_DATA[this.currentDataType][code]) {
      this.$('#panelContainer').classList.remove('open');
      return;
    }

    this._activeHistoryCode = code;
    this.$('#panelCountry').textContent = name;
    this.$('#panelMetric').textContent = this.DATA[this.currentDataType].label;
    
    // Bind Mode Buttons
    this.$$('.mode-btn').forEach(btn => {
      btn.onclick = () => {
        this.$$('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.$$('.panel-view').forEach(v => v.classList.remove('active'));
        this.$(`#view${btn.dataset.mode === 'history' ? 'History' : 'Future'}`).classList.add('active');
      };
    });

    const slider = this.$('#histSlider');
    slider.oninput = (e) => this.updateHistoryView(e.target.value);
    
    this.$('#panelContainer').classList.add('open');
    this.$('#closeLeftBtn').onclick = () => this.closeSidePanel();

    requestAnimationFrame(() => {
      this.updateHistoryView(slider.value);
      this.buildFutureView(code);
    });
  }

  closeSidePanel() {
    this._selectedCountryCode = null;
    this._selectedCountryName = null;
    this._activeHistoryCode = null;
    this.$('#panelContainer').classList.remove('open');
    this.$$('.cp').forEach(el => el.classList.remove('selected'));
    const sOverlay = this.$('#selectOverlay');
    if (sOverlay) sOverlay.style.clipPath = 'circle(0% at 50% 50%)';
  }

  updateHistoryView(year) {
    const metricData = HISTORY_DATA[this.currentDataType][this._activeHistoryCode];
    if (!metricData) return;

    this.$('#yearLabels').querySelectorAll('span').forEach(span => {
      if (span.dataset.val === String(year)) span.classList.add('active');
      else span.classList.remove('active');
    });
    
    const svg = this.$('#histChart');
    const w = 280, h = 140, pad = 12;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const years = [2020, 2021, 2022, 2023, 2024];
    const vals = years.map(y => metricData[y]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max === min ? 1 : max - min;

    let pathD = "", pointsHtml = "";
    years.forEach((y, i) => {
      const cx = pad + (i / (years.length - 1)) * (w - pad * 2);
      const cy = h - pad - ((vals[i] - min) / range) * (h - pad * 2);
      pathD += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
      pointsHtml += `<circle cx="${cx}" cy="${cy}" r="4" class="chart-point ${y == year ? 'active' : ''}" />`;
    });
    svg.innerHTML = `<path class="chart-line" d="${pathD}" />${pointsHtml}`;

    const txt = metricData.txt[year] || "Normal yearly progression. No major outliers recorded.";
    const valString = fmt(metricData[year], this.DATA[this.currentDataType].unit);
    
    this.$('#histText').innerHTML = `
      <div class="hist-value-box">
        <div class="hist-value-number">${valString}</div>
      </div>
      <div class="hist-info-text">
        <strong>${year} Context:</strong><br/>${txt}
      </div>
    `;
  }

  buildFutureView(code) {
    const futData = FUTURE_DATA[this.currentDataType] && FUTURE_DATA[this.currentDataType][code];
    const container = this.$('#futFactors');
    container.innerHTML = '';
    
    if (!futData) {
      this.$('#futDesc').textContent = "Future projections not yet available for this metric/country.";
      this.$('#futChart').innerHTML = '';
      this.$('#futResult').innerHTML = '';
      return;
    }

    this.$('#futDesc').textContent = futData.desc;
    
    futData.factors.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'factor-row';
      div.innerHTML = `
        <label class="factor-label">
          <input type="checkbox" class="factor-cb" data-impact="${f.impact}">
          <span class="cb-custom"></span>
          <span class="factor-title">${f.title}</span>
        </label>
        <div class="factor-info-btn">i
          <div class="factor-tooltip">
            <strong>Context:</strong> ${f.info}<br/><br/>
            <span style="color:#27ae60">✔ ${f.yes}</span><br/>
            <span style="color:#c0392b">✘ ${f.no}</span>
          </div>
        </div>
      `;
      div.querySelector('.factor-cb').onchange = () => this.updateFutureChart(code, futData);
      container.appendChild(div);
    });

    this.updateFutureChart(code, futData);
  }

  updateFutureChart(code, futData) {
    const baseVal = HISTORY_DATA[this.currentDataType][code][2024];
    let totalGrowthRate = futData.base_growth;
    
    this.$$('.factor-cb').forEach(cb => {
      if (cb.checked) totalGrowthRate += parseFloat(cb.dataset.impact);
    });

    // Project 5 years
    const years = [2024, 2025, 2026, 2027, 2028, 2029];
    const vals = [baseVal];
    for(let i=1; i<=5; i++) {
      vals.push(vals[i-1] * (1 + totalGrowthRate));
    }

    const svg = this.$('#futChart');
    const w = 280, h = 120, pad = 12;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    
    const min = Math.min(baseVal, ...vals), max = Math.max(baseVal, ...vals);
    const range = max === min ? 1 : max - min;

    let pathD = "", pointsHtml = "";
    years.forEach((y, i) => {
      const cx = pad + (i / (years.length - 1)) * (w - pad * 2);
      const cy = h - pad - ((vals[i] - min) / range) * (h - pad * 2);
      pathD += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
      pointsHtml += `<circle cx="${cx}" cy="${cy}" r="4" class="chart-point fut-point" />
                     <text x="${cx}" y="${cy-10}" class="fut-label" text-anchor="middle">${y==2024||y==2029?y:''}</text>`;
    });
    
    // Draw chart with a different color scheme for the future
    svg.innerHTML = `
      <defs><linearGradient id="futGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8395a7"/><stop offset="100%" stop-color="#34d399"/></linearGradient></defs>
      <path class="chart-line" d="${pathD}" style="stroke: url(#futGrad); stroke-dasharray: 4 4;" />
      ${pointsHtml}
    `;

    const finalVal = fmt(vals[5], this.DATA[this.currentDataType].unit);
    this.$('#futResult').innerHTML = `Projected 2029: <strong>${finalVal}</strong>`;
  }


  initZoomPan() {
    const svg = this.$('#mapSvg');
    const wrap = this.$('.map-wrap');
    if (!svg || !wrap) return;
    this._origVB = { ...WORLD_VIEWBOX };
    this._contentBBox = { ...WORLD_CONTENT_BBOX };
    this._zoom = 1; this._panX = 0; this._panY = 0;
    this._applyTransform();

    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      const newZoom = Math.max(this._minZoom, Math.min(this._maxZoom, this._zoom + delta));
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const oldW = this._origVB.w / this._zoom, newW = this._origVB.w / newZoom;
      const oldH = this._origVB.h / this._zoom, newH = this._origVB.h / newZoom;
      this._panX += (oldW - newW) * mx; this._panY += (oldH - newH) * my;
      this._zoom = newZoom; this._clampAndApply();
    }, { passive: false });

    wrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this._isPanning = true; 
      this._dragged = false; 
      this._panStartX = e.clientX; this._panStartY = e.clientY;
      this._panStartPanX = this._panX; this._panStartPanY = this._panY;
      wrap.style.cursor = 'grabbing'; e.preventDefault();
    });
    
    window.addEventListener('mousemove', (e) => {
      if (!this._isPanning) return;
      if (Math.abs(e.clientX - this._panStartX) > 3 || Math.abs(e.clientY - this._panStartY) > 3) {
        this._dragged = true;
      }
      const rect = svg.getBoundingClientRect(); const vb = this._getViewBox();
      this._panX = this._panStartPanX - (e.clientX - this._panStartX) * (vb.w / rect.width);
      this._panY = this._panStartPanY - (e.clientY - this._panStartY) * (vb.h / rect.height);
      this._applyTransform();
    });
    window.addEventListener('mouseup', () => {
      if (!this._isPanning) return;
      this._isPanning = false; wrap.style.cursor = ''; this._snapBack();
    });
    wrap.addEventListener('dblclick', (e) => { e.preventDefault(); this._animateTo(1, 0, 0); });

    const zoomIn = this.$('#zoomIn'), zoomOut = this.$('#zoomOut'), zoomReset = this.$('#zoomReset');
    if (zoomIn) zoomIn.addEventListener('click', () => {
      const nz = Math.min(this._maxZoom, this._zoom + 0.3);
      const oW = this._origVB.w / this._zoom, nW = this._origVB.w / nz;
      const oH = this._origVB.h / this._zoom, nH = this._origVB.h / nz;
      this._animateTo(nz, this._panX + (oW - nW) * 0.5, this._panY + (oH - nH) * 0.5);
    });
    if (zoomOut) zoomOut.addEventListener('click', () => {
      const nz = Math.max(this._minZoom, this._zoom - 0.3);
      const oW = this._origVB.w / this._zoom, nW = this._origVB.w / nz;
      const oH = this._origVB.h / this._zoom, nH = this._origVB.h / nz;
      this._animateTo(nz, this._panX + (oW - nW) * 0.5, this._panY + (oH - nH) * 0.5);
    });
    if (zoomReset) zoomReset.addEventListener('click', () => { this._animateTo(1, 0, 0); });
  }

  _getViewBox() {
    const w = this._origVB.w / this._zoom, h = this._origVB.h / this._zoom;
    return { x: this._origVB.x + this._panX, y: this._origVB.y + this._panY, w, h };
  }
  _applyTransform() {
    const svg = this.$('#mapSvg'); if (!svg) return;
    const vb = this._getViewBox();
    svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
  }
  _syncDetailLayerVisibility() {
    const lowResGroup = this.$('.euro-group.low-res');
    const highResGroup = this.$('.euro-group.high-res');
    if (!lowResGroup || !highResGroup) return;
    const showHighRes = this._zoom >= DETAIL_LAYER_ZOOM_THRESHOLD;
    if (this._isHighResVisible === showHighRes) return;
    this._isHighResVisible = showHighRes;
    lowResGroup.style.visibility = showHighRes ? 'hidden' : 'visible';
    lowResGroup.style.opacity = showHighRes ? '0' : '1';
    lowResGroup.style.pointerEvents = showHighRes ? 'none' : 'auto';
    highResGroup.style.visibility = showHighRes ? 'visible' : 'hidden';
    highResGroup.style.opacity = showHighRes ? '1' : '0';
    highResGroup.style.pointerEvents = showHighRes ? 'auto' : 'none';
  }
  _getPanBounds() {
    const vw = this._origVB.w / this._zoom;
    const vh = this._origVB.h / this._zoom;
    const cb = this._contentBBox;
    const overX = vw * 0.15; 
    const overY = vh * 0.15;
    
    return {
      minX: Math.min(cb.x - this._origVB.x - overX, 0),
      maxX: Math.max((cb.x + cb.w) - this._origVB.x - vw + overX, 0),
      minY: Math.min(cb.y - this._origVB.y - overY, 0),
      maxY: Math.max((cb.y + cb.h) - this._origVB.y - vh + overY, 0)
    };
  }
  _clampPan() {
    const b = this._getPanBounds();
    this._panX = Math.max(b.minX, Math.min(b.maxX, this._panX));
    this._panY = Math.max(b.minY, Math.min(b.maxY, this._panY));
  }
  _clampAndApply() { this._clampPan(); this._applyTransform(); this._syncDetailLayerVisibility(); }
  _snapBack() {
    const b = this._getPanBounds();
    const tx = Math.max(b.minX, Math.min(b.maxX, this._panX));
    const ty = Math.max(b.minY, Math.min(b.maxY, this._panY));
    if (Math.abs(tx - this._panX) < 0.5 && Math.abs(ty - this._panY) < 0.5) {
      this._panX = tx; this._panY = ty; this._applyTransform(); return;
    }
    this._animateTo(this._zoom, tx, ty, 350);
  }
  _animateTo(targetZoom, targetPanX, targetPanY, duration) {
    duration = duration || 400;
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    const sz = this._zoom, sx = this._panX, sy = this._panY;
    
    const tvw = this._origVB.w / targetZoom, tvh = this._origVB.h / targetZoom, cb = this._contentBBox;
    const overX = tvw * 0.15, overY = tvh * 0.15;
    targetPanX = Math.max(Math.min(cb.x - this._origVB.x - overX, 0), Math.min(Math.max((cb.x + cb.w) - this._origVB.x - tvw + overX, 0), targetPanX));
    targetPanY = Math.max(Math.min(cb.y - this._origVB.y - overY, 0), Math.min(Math.max((cb.y + cb.h) - this._origVB.y - tvh + overY, 0), targetPanY));
    
    const st = performance.now();
    const tick = (now) => {
      const p = Math.min((now - st) / duration, 1);
      const c1 = 1.70158, c3 = c1 + 1;
      const ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
      this._zoom = sz + (targetZoom - sz) * ease;
      this._panX = sx + (targetPanX - sx) * ease;
      this._panY = sy + (targetPanY - sy) * ease;
      this._applyTransform();
      if (p < 1) this._animFrame = requestAnimationFrame(tick);
      else { this._zoom = targetZoom; this._panX = targetPanX; this._panY = targetPanY; this._applyTransform(); this._syncDetailLayerVisibility(); this._animFrame = null; }
    };
    this._animFrame = requestAnimationFrame(tick);
  }

  _appendPathPoint(path, command, point, precision) { path.push(`${command}${point[0].toFixed(precision)},${point[1].toFixed(precision)}`); }
  _segmentCrossesAntimeridian(from, to) { const lonDelta = Math.abs(to[0] - from[0]); const wrapDelta = 360 - lonDelta; return lonDelta > ANTIMERIDIAN_SPLIT_THRESHOLD && wrapDelta < lonDelta && Math.abs(from[0]) > ANTIMERIDIAN_SPLIT_THRESHOLD && Math.abs(to[0]) > ANTIMERIDIAN_SPLIT_THRESHOLD; }
  _splitAntimeridianSegment(from, to) { const wrapsEastward = to[0] < from[0]; const exitLon = wrapsEastward ? 180 : -180; const entryLon = wrapsEastward ? -180 : 180; const adjustedToLon = wrapsEastward ? to[0] + 360 : to[0] - 360; const t = (exitLon - from[0]) / (adjustedToLon - from[0]); const interpolatedLat = from[1] + (to[1] - from[1]) * t; const exitPoint = this._proj([exitLon, interpolatedLat]); const entryPoint = this._proj([entryLon, interpolatedLat]); return { exitPoint, entryPoint }; }

  _ringToPath(ring, proj, precision) {
    if (!ring.length) return '';
    const path = [];
    const firstPoint = proj(ring[0]);
    this._appendPathPoint(path, 'M', firstPoint, precision);

    for (let i = 1; i < ring.length; i += 1) {
      const previous = ring[i - 1];
      const current = ring[i];
      if (!this._segmentCrossesAntimeridian(previous, current)) {
        this._appendPathPoint(path, 'L', proj(current), precision);
        continue;
      }
      const { exitPoint, entryPoint } = this._splitAntimeridianSegment(previous, current);
      this._appendPathPoint(path, 'L', exitPoint, precision);
      path.push('Z');
      this._appendPathPoint(path, 'M', entryPoint, precision);
      this._appendPathPoint(path, 'L', proj(current), precision);
    }
    const lastPoint = ring[ring.length - 1];
    const firstCoord = ring[0];
    if (this._segmentCrossesAntimeridian(lastPoint, firstCoord)) {
      const { exitPoint, entryPoint } = this._splitAntimeridianSegment(lastPoint, firstCoord);
      this._appendPathPoint(path, 'L', exitPoint, precision);
      path.push('Z');
      this._appendPathPoint(path, 'M', entryPoint, precision);
      this._appendPathPoint(path, 'L', firstPoint, precision);
      path.push('Z');
      return path.join(' ');
    }
    path.push('Z');
    return path.join(' ');
  }

  geoPaths(geom, proj, precision) {
    const ring = r => this._ringToPath(r, proj, precision);
    if (geom.type === 'Polygon') return [geom.coordinates.map(ring).join(' ')];
    if (geom.type === 'MultiPolygon') return geom.coordinates.map(p => p.map(ring).join(' '));
    return [];
  }

  moveSlider(container, activeBtn) {
    let slider = container.querySelector('.slider');
    if (!slider) { slider = document.createElement('div'); slider.className = 'slider'; container.prepend(slider); }
    if (!activeBtn) { slider.classList.remove('visible'); return; }
    slider.style.top = activeBtn.offsetTop + 'px'; slider.style.height = activeBtn.offsetHeight + 'px'; slider.classList.add('visible');
  }

  buildCategoryButtons() {
    const c = this.$('#catBtns'); c.innerHTML = '';
    Object.entries(this.categories).forEach(([catKey]) => {
      const meta = CATEGORY_META[catKey] || { icon: '', label: catKey };
      const b = document.createElement('button'); b.className = 'cat-btn'; b.dataset.key = catKey;
      b.innerHTML = '<span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' + meta.icon + '</svg></span><span class="cat-label">' + meta.label + '</span>';
      b.onclick = () => this.selectCategory(catKey); c.appendChild(b);
    });
  }

  selectCategory(catKey) {
    this.currentCategory = catKey;
    this.$$('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.key === catKey));
    this.buildDataTypeButtons(catKey);
    this._lastTtVal = null; this._lastTtDataType = null;
    const keys = this.categories[catKey]; if (keys && keys[0]) this.selectDataType(keys[0]);
  }

  buildDataTypeButtons(catKey) {
    const c = this.$('#dtBtns'); c.innerHTML = '';
    const slider = document.createElement('div'); slider.className = 'slider'; c.appendChild(slider);
    (this.categories[catKey] || []).forEach(key => {
      const dt = this.DATA[key]; if (!dt) return;
      const b = document.createElement('button'); b.className = 'btn'; b.dataset.key = key;
      const srcCount = Object.keys(dt.sources).length;
      const okCount = Object.values(dt.sources).filter(s => Object.keys(s.countries).length > 0).length;
      b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + dt.label + '</span></span><span class="badge">' + okCount + '/' + srcCount + '</span>';
      b.onclick = () => this.selectDataType(key); c.appendChild(b);
    });
  }

  buildSourceButtons(dtKey) {
    const c = this.$('#srcBtns'); c.innerHTML = '';
    const slider = document.createElement('div'); slider.className = 'slider'; c.appendChild(slider);
    const dt = this.DATA[dtKey]; if (!dt) return;
    Object.entries(dt.sources).forEach(([key, src]) => {
      const count = Object.keys(src.countries).length; const isEmpty = count === 0;
      const b = document.createElement('button'); b.className = 'btn' + (isEmpty ? ' disabled' : ''); b.dataset.key = key;
      if (isEmpty) b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + src.label + '</span></span><span class="badge badge-empty">No data</span>';
      else { b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + src.label + '</span></span><span class="badge">' + count + ' · ' + src.year + '</span>'; b.onclick = () => this.selectSource(key); }
      c.appendChild(b);
    });
  }

  selectDataType(k) {
    this.currentDataType = k;
    this.$$('#dtBtns .btn').forEach(b => b.classList.toggle('active', b.dataset.key === k));
    const dtc = this.$('#dtBtns'), ab = dtc.querySelector('.btn[data-key="' + k + '"]');
    requestAnimationFrame(() => { requestAnimationFrame(() => this.moveSlider(dtc, ab)); });
    this._lastTtVal = null; this._lastTtDataType = k; this.buildSourceButtons(k);
    const dt = this.DATA[k]; if (!dt) return;
    const firstOk = Object.entries(dt.sources).find(([, s]) => Object.keys(s.countries).length > 0);
    if (firstOk) {
      this.selectSource(firstOk[0]);
    } else {
      this.currentSource = null; this.$('#mapTitle').textContent = dt.label;
      this.$('#mapSub').textContent = 'No data available for any source';
      this.$('#legMin').textContent = '\u2014'; this.$('#legMax').textContent = '\u2014';
      this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
    }
    
    // Reactively update the left panel if a country is currently selected
    if (this._selectedCountryCode) {
      this.openSidePanel(this._selectedCountryCode, this._selectedCountryName);
    }
  }

  selectSource(k) {
    this.currentSource = k;
    this.$$('#srcBtns .btn').forEach(b => { if (!b.classList.contains('disabled')) b.classList.toggle('active', b.dataset.key === k); });
    const sc = this.$('#srcBtns'), ab = sc.querySelector('.btn.active');
    requestAnimationFrame(() => { requestAnimationFrame(() => this.moveSlider(sc, ab)); });
    this.paint();
  }

  paint() {
    const dt = this.DATA[this.currentDataType]; if (!dt) return;
    const src = dt.sources[this.currentSource]; if (!src) return;
    this.$('#mapTitle').textContent = dt.label;
    this.$('#mapSub').textContent = src.label + ' \u00B7 ' + src.year + ' \u00B7 ' + dt.unit;
    const vals = Object.values(src.countries).filter(v => v != null);
    if (!vals.length) { this.$('#legMin').textContent = '\u2014'; this.$('#legMax').textContent = '\u2014'; this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); }); return; }
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    this.$('#legMin').textContent = fmt(min, dt.unit); this.$('#legMax').textContent = fmt(max, dt.unit);
    this.$$('.cp').forEach(p => {
      const v = src.countries[p.dataset.code];
      if (v != null) { p.classList.remove('no-data'); p.setAttribute('fill', getColor(max !== min ? (v - min) / (max - min) : 0.5)); }
      else { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); }
    });
  }

  ttShow(e) {
    const dt = this.DATA[this.currentDataType]; if (!dt || !this.currentSource) return;
    const src = dt.sources[this.currentSource]; if (!src) return;
    const code = e.target.dataset.code;
    const newVal = (src.countries && src.countries[code] != null) ? src.countries[code] : null;
    this.$('#ttName').textContent = e.target.dataset.name;
    this.$('#ttUnit').textContent = newVal != null ? dt.unit : '';
    this.$('#ttSrc').textContent = (src.label || '\u2014') + ' \u00B7 ' + (src.year || '\u2014');
    const valEl = this.$('#ttVal');
    if (this._lastTtDataType === this.currentDataType && newVal != null && this._lastTtVal != null && !isNaN(this._lastTtVal) && !isNaN(newVal))
      animateValue(valEl, this._lastTtVal, newVal, dt.unit, 300);
    else valEl.textContent = fmt(newVal, dt.unit);
    this._lastTtVal = newVal; this._lastTtDataType = this.currentDataType;
    this.checkDiscrepancy(code);
    const marker = this.$('#legMarker');
    if (newVal != null) {
      const vs = Object.values(src.countries).filter(v => v != null);
      const mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
      marker.style.left = (mx !== mn ? ((newVal - mn) / (mx - mn)) * 100 : 50) + '%'; marker.classList.add('visible');
    } else marker.classList.remove('visible');
    this.$('#tt').classList.add('visible');
  }
  ttMove(e) { const tt = this.$('#tt'); tt.style.left = (e.clientX + 18) + 'px'; tt.style.top = (e.clientY - 12) + 'px'; }
  ttHide() { this.$('#tt').classList.remove('visible'); this.$('#legMarker').classList.remove('visible'); }
  checkDiscrepancy(code) {
    const el = this.$('#ttDisc');
    const dt = this.DATA[this.currentDataType];
    if (!dt) return;
    const vals = [];
    Object.values(dt.sources).forEach(s => {
      if (s.countries[code] != null) vals.push(s.countries[code]);
    });
    if (vals.length >= 2) {
      const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const diff = avg ? ((mx - mn) / Math.abs(avg)) * 100 : 0;
      if (diff > 10) {
        el.style.display = 'block'; el.textContent = '\u26A0\uFE0F ' + diff.toFixed(0) + '% variance across ' + vals.length + ' sources'; return;
      }
    }
    el.style.display = 'none';
  }

  html() {
    return `<div class="app">
  <nav class="top-nav">
    <div class="nav-logo" onclick="location.reload();" style="cursor: pointer;">
      <div class="nav-logo-icon">
        <img id="navLogo" class="logo-desktop" src="" alt="Logo" />
        <img id="navLogoMobile" class="logo-mobile" src="" alt="Logo" />
      </div>
    </div>
    <div class="nav-links">
      <button class="nav-link" id="aboutBtn">About</button>
      <button class="nav-link primary" id="supportBtn">Support us</button>
    </div>
  </nav>
  <div id="initLoader" class="init-loader"><div class="orbit"></div><span>Loading map & data\u2026</span></div>
  <div class="main" id="mainContent" style="opacity:0">
    <div class="map-panel">
      <div class="title-row">
        <div><div class="map-title" id="mapTitle">\u2014</div><div class="map-sub" id="mapSub">\u2014</div></div>
        <div class="zoom-controls" id="zoomControls">
          <button class="zoom-btn" id="zoomIn" title="Zoom in"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
          <button class="zoom-btn" id="zoomReset" title="Reset view"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></button>
          <button class="zoom-btn" id="zoomOut" title="Zoom out"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg></button>
        </div>
      </div>
      <div class="legend"><span id="legMin">\u2014</span><div class="legend-bar"><div class="legend-marker" id="legMarker"></div></div><span id="legMax">\u2014</span></div>
      <div class="map-wrap"><svg id="mapSvg" viewBox="${WORLD_VIEWBOX.x} ${WORLD_VIEWBOX.y} ${WORLD_VIEWBOX.w} ${WORLD_VIEWBOX.h}" preserveAspectRatio="xMidYMid meet"></svg></div>
      
      <!-- MODE BAR & LEFT PANEL -->
      <div class="panel-container" id="panelContainer">
        
        <div class="mode-bar" id="modeBar">
          <button class="mode-btn active" data-mode="history">HISTORY</button>
          <button class="mode-btn" data-mode="future">FUTURE</button>
        </div>

        <div class="side-panel left glass" id="leftPanel">
          <button class="close-btn" id="closeLeftBtn">✕</button>
          <div>
            <div class="history-header" id="panelCountry">Country</div>
            <div class="history-sub" id="panelMetric">Metric</div>
          </div>
          
          <!-- HISTORY VIEW -->
          <div id="viewHistory" class="panel-view active">
            <div class="chart-container"><svg class="chart-svg" id="histChart"></svg></div>
            <div class="year-slider-wrap">
              <input type="range" min="2020" max="2024" value="2024" class="year-slider" id="histSlider" step="1">
              <div class="year-labels" id="yearLabels">
                <span data-val="2020">2020</span><span data-val="2021">2021</span><span data-val="2022">2022</span><span data-val="2023">2023</span><span data-val="2024">2024</span>
              </div>
            </div>
            <div class="history-content" id="histText"></div>
          </div>

          <!-- FUTURE VIEW -->
          <div id="viewFuture" class="panel-view">
            <div class="future-desc" id="futDesc">Description</div>
            <div class="chart-container"><svg class="chart-svg" id="futChart"></svg></div>
            <div class="future-factors" id="futFactors">
              <!-- Checkboxes injected here -->
            </div>
            <div class="future-result" id="futResult"></div>
          </div>

        </div>
      </div>

    </div>
    
    <div class="controls glass">
      <div><div class="sec-title">Category</div><div class="cat-tabs" id="catBtns"></div></div>
      <div><div class="sec-title">Data Type</div><div class="btn-group" id="dtBtns"></div></div>
      <div><div class="sec-title">Source</div><div class="btn-group" id="srcBtns"></div></div>
    </div>
  </div>
  <div class="footer" id="lastUpdated">Data updated via Eurostat & World Bank APIs</div>
</div>
<div class="tooltip" id="tt">
  <div class="tt-name" id="ttName">\u2014</div>
  <div><span class="tt-val" id="ttVal">\u2014</span><span class="tt-unit" id="ttUnit"></span></div>
  <div class="tt-src" id="ttSrc"></div>
  <div class="tt-disc" id="ttDisc"></div>
</div>`;
  }
}

customElements.define('data-comparison-map', DataComparisonMap);
