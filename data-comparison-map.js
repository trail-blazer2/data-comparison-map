import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ============================================================
// FIREBASE CONFIGURATION (Paste your config from Firebase here)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAocOPQSgjuaQFkQy1RAypWrXbnhAWbKRE",
  authDomain: "rwvtesting.firebaseapp.com",
  projectId: "rwvtesting",
  storageBucket: "rwvtesting.firebasestorage.app",
  messagingSenderId: "473502983675",
  appId: "1:473502983675:web:f3a9c602b6662c2180175e",
  measurementId: "G-RW2W1N3DDS"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// DATA COMPARISON MAP — Wix Custom Element
// ============================================================

const LOW_RES_MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const HIGH_RES_MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';
const D3_URL = 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js';
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

const CS_COUNTRIES = {
  AF:'Afghánistán',AL:'Albánie',DZ:'Alžírsko',AO:'Angola',AM:'Arménie',
  AR:'Argentina',AU:'Austrálie',AT:'Rakousko',AZ:'Ázerbájdžán',BD:'Bangladéš',
  BE:'Belgie',BJ:'Benin',BT:'Bhútán',BO:'Bolívie',BA:'Bosna a Hercegovina',
  BW:'Botswana',BR:'Brazílie',BN:'Brunej',BG:'Bulharsko',BI:'Burundi',
  BY:'Bělorusko',KH:'Kambodža',CM:'Kamerun',CA:'Kanada',CF:'Středoafrická republika',
  TD:'Čad',CL:'Chile',CN:'Čína',CO:'Kolumbie',CG:'Kongo',CD:'DR Kongo',
  KM:'Komory',CR:'Kostarika',CI:"Pobřeží slonoviny",HR:'Chorvatsko',CU:'Kuba',
  CY:'Kypr',CZ:'Česko',DK:'Dánsko',DJ:'Džibutsko',DO:'Dominikánská republika',
  EC:'Ekvádor',EG:'Egypt',SV:'Salvador',GQ:'Rovníková Guinea',ER:'Eritrea',
  EE:'Estonsko',ET:'Etiopie',FJ:'Fidži',FI:'Finsko',FR:'Francie',GA:'Gabon',
  GM:'Gambie',GE:'Gruzie',DE:'Německo',GH:'Ghana',GR:'Řecko',GT:'Guatemala',
  GN:'Guinea',GY:'Guyana',HT:'Haiti',HN:'Honduras',HU:'Maďarsko',IS:'Island',
  IN:'Indie',ID:'Indonésie',IR:'Írán',IQ:'Irák',IE:'Irsko',IL:'Izrael',
  IT:'Itálie',JM:'Jamajka',JP:'Japonsko',JO:'Jordánsko',KZ:'Kazachstán',KE:'Keňa',
  KP:'Severní Korea',KR:'Jižní Korea',KW:'Kuvajt',KG:'Kyrgyzstán',LA:'Laos',
  LB:'Libanon',LS:'Lesotho',LR:'Libérie',LY:'Libye',LT:'Litva',LU:'Lucembursko',
  LV:'Lotyšsko',MG:'Madagaskar',MW:'Malawi',MY:'Malajsie',ML:'Mali',MT:'Malta',
  MR:'Mauritánie',MU:'Mauricius',MX:'Mexiko',MD:'Moldavsko',ME:'Černá Hora',
  MN:'Mongolsko',MA:'Maroko',MZ:'Mosambik',MM:'Myanmar',NA:'Namibie',
  NP:'Nepál',NL:'Nizozemsko',NC:'Nová Kaledonie',NZ:'Nový Zéland',NI:'Nikaragua',
  NE:'Niger',NG:'Nigérie',MK:'Severní Makedonie',NO:'Norsko',PK:'Pákistán',
  PA:'Panama',PG:'Papua Nová Guinea',PY:'Paraguay',PE:'Peru',PH:'Filipíny',
  PL:'Polsko',PT:'Portugalsko',QA:'Katar',RO:'Rumunsko',RU:'Rusko',RW:'Rwanda',
  ST:'Svatý Tomáš a Princův ostrov',SA:'Saúdská Arábie',SN:'Senegal',RS:'Srbsko',
  SL:'Sierra Leone',SK:'Slovensko',SI:'Slovinsko',SO:'Somálsko',ZA:'Jižní Afrika',
  SS:'Jižní Súdán',ES:'Španělsko',LK:'Srí Lanka',SD:'Súdán',SR:'Surinam',
  SZ:'Eswatini',SE:'Švédsko',CH:'Švýcarsko',SY:'Sýrie',TJ:'Tádžikistán',
  TZ:'Tanzanie',TH:'Thajsko',TG:'Togo',TN:'Tunisko',TR:'Turecko',
  TM:'Turkmenistán',UG:'Uganda',UA:'Ukrajina',AE:'Spojené arabské emiráty',
  GB:'Velká Británie',US:'USA',UY:'Uruguay',UZ:'Uzbekistán',
  VE:'Venezuela',VN:'Vietnam',YE:'Jemen',ZM:'Zambie',ZW:'Zimbabwe'
};

const I18N = {
  en: {
    about: "About", support: "Support us", loading: "Loading map & data…",
    category: "Category", dataType: "Data Type", source: "Source",
    history: "HISTORY", future: "FUTURE", country: "Country", metric: "Metric", desc: "Description",
    updated: "Data updated via Eurostat & World Bank APIs",
    updatedDate: "Data updated: ",
    projected: "Projected 2029: ",
    context: "Context:",
    noProj: "Future projections not yet available for this metric/country combination.",
    normProg: "Normal yearly progression. No major outliers recorded.",
    noData: "No data",
    noDataSrc: "No data available for any source",
    "Economy": "Economy", "Demographics": "Demographics",
    "Society": "Society", "Public Services": "Services", "other": "Other",
    "persons": "persons", "net persons": "net persons", "USD/capita": "USD/capita", "int. $": "int. $",
    "% of GDP": "% of GDP", "%": "%", "births/woman": "births/woman", "years": "years",
    "per 100k inh.": "per 100k inh.", "per 1,000 births": "per 1,000 births",
    "% gross enrollment": "% gross enrollment", "index (0-100)": "index (0-100)"
  },
  cs: {
    about: "O nás", support: "Podpořte nás", loading: "Načítání mapy a dat…",
    category: "Kategorie", dataType: "Typ dat", source: "Zdroj",
    history: "HISTORIE", future: "BUDOUCNOST", country: "Země", metric: "Metrika", desc: "Popis",
    updated: "Data aktualizována přes API Eurostatu a Světové banky",
    updatedDate: "Data aktualizována: ",
    projected: "Projekce 2029: ",
    context: "Kontext:",
    noProj: "Pro tuto kombinaci metriky a země zatím nejsou k dispozici budoucí projekce.",
    normProg: "Normální roční vývoj. Nezaznamenány žádné významné odchylky.",
    noData: "Žádná data",
    noDataSrc: "Žádná data nejsou k dispozici pro žádný zdroj",
    "Economy": "Ekonomika", "Demographics": "Demografie",
    "Society": "Společnost", "Public Services": "Služby", "other": "Ostatní",
    "Unemployment rate - Total": "Míra nezaměstnanosti - Celkem",
    "Unemployment rate - Youth": "Míra nezaměstnanosti - Mládež",
    "Earnings": "Příjmy", "Intentional homicide": "Úmyslné zabití",
    "Immigration": "Imigrace", "Net migration": "Čistá migrace",
    "Inflation": "Inflace", "Population": "Populace",
    "Life expectancy": "Naděje dožití", "Fertility": "Plodnost",
    "Government Debt": "Vládní dluh", "Healthcare spending": "Výdaje na zdravotnictví",
    "Education spending": "Výdaje na vzdělávání", "Military spending": "Vojenské výdaje",
    "R&D spending": "Výdaje na výzkum a vývoj", "Poverty rate": "Míra chudoby",
    "Infant mortality": "Kojenecká úmrtnost", "Tertiary education": "Terciární vzdělávání",
    "Foreign Direct Investment": "Přímé zahraniční investice", "GDP growth": "Růst HDP",
    "GDP per capita (PPP)": "HDP na obyvatele (PPP)", "Gini coefficient": "Giniho koeficient",
    "persons": "osob", "net persons": "osob (čisté)", "USD/capita": "USD/obyvatele",
    "int. $": "int. $", "% of GDP": "% HDP", "%": "%", "births/woman": "dětí/ženu",
    "years": "let", "per 100k inh.": "na 100k obyv.", "per 1,000 births": "na 1 000 naroz.",
    "% gross enrollment": "% hrubé zápisy", "index (0-100)": "index (0-100)"
  }
};

const CATEGORY_META = {
  economy: { labelKey: 'Economy', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/><path d="M4 12a8 8 0 018-8v2a6 6 0 100 12v2a8 8 0 01-8-8z"/>' },
  demographics: { labelKey: 'Demographics', icon: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>' },
  society: { labelKey: 'Society', icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>' },
  public_services: { labelKey: 'Public Services', icon: '<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>' }
};

const QUESTIONNAIRE = [
  {
    id: 'ai_auto',
    title: 'The AI & Automation Revolution',
    questions: [
      { id: 'q1', text: 'Will AI displace >20% of administrative/coding jobs by 2030 without replacing them with equal-paying roles?' },
      { id: 'q2', text: 'Will Western economies successfully automate and reshore critical manufacturing in the next decade?' },
      { id: 'q3', text: 'Will AI-driven drug discovery add 2+ years to average global life expectancy by 2035?' }
    ]
  },
  {
    id: 'geopolitics',
    title: 'Geopolitics & The End of Free Trade',
    questions: [
      { id: 'q1', text: 'Will the US and China economically decouple into two completely separate tech ecosystems?' },
      { id: 'q2', text: 'Will global defense spending permanently exceed 2.5% of GDP across NATO and allies?' },
      { id: 'q3', text: 'Will blanket multi-national tariffs end the era of frictionless free trade?' }
    ]
  },
  {
    id: 'demographics',
    title: 'The Demographic & Climate Tipping Point',
    questions: [
      { id: 'q1', text: 'Will advanced aging economies (Germany, Japan) avoid GDP stagnation via mass skilled immigration?' },
      { id: 'q2', text: 'Will the transition to green energy cause a global energy price spike lasting more than 5 years?' },
      { id: 'q3', text: 'Will climate events create over 50 million global climate refugees by 2030?' }
    ]
  }
];

function getColor(t) {
  const c = [
    [203,219,240], [132,155,186], [84,105,137], [33,52,78], [10,24,49]
  ];
  const n = c.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = (t * n) - i;
  return `rgb(${Math.round(c[i][0] + (c[i+1][0] - c[i][0]) * f)},${Math.round(c[i][1] + (c[i+1][1] - c[i][1]) * f)},${Math.round(c[i][2] + (c[i+1][2] - c[i][2]) * f)})`;
}

function fmt(val, unit, tFn) {
  const t = tFn || (k => k);
  if (val == null) return t('noData');
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

function animateValue(el, startVal, endVal, unit, duration = 300, tFn = k=>k) {
  if (startVal === endVal) { el.textContent = fmt(endVal, unit, tFn); return; }
  if (endVal == null || isNaN(endVal)) { el.textContent = fmt(endVal, unit, tFn); return; }
  if (startVal == null || isNaN(startVal)) { el.textContent = fmt(endVal, unit, tFn); return; }
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (endVal - startVal) * ease;
    el.textContent = fmt(current, unit, tFn);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(endVal, unit, tFn);
  }
  requestAnimationFrame(tick);
}

// ============================================================
class DataComparisonMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._lang = 'en';
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
    
    this._is3D = false;
    this._globeRotation = [0, 0, 0];
    this._spinVelocity = 0;
    this._lastSpinTime = 0;
    this._autoSpinning = true; 

    // Firebase Data State
    this._points = 0;
    this._completedTopics = [];
    this._answers = {};
    this._user = null;
  }

  t(key) {
    return (I18N[this._lang] && I18N[this._lang][key]) ? I18N[this._lang][key] : key;
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

    // Set up Firebase Auth Listener
    onAuthStateChanged(auth, async (user) => {
      this._user = user;
      if (user) {
        // Fetch user's points and answers from DB
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          this._points = data.points || 0;
          this._completedTopics = data.completedTopics || [];
          this._answers = data.answers || {};
          this.updatePointsDisplay();
        }
      }
    });

    // Fallback: If not logged in, try loading local storage temporarily
    if (!this._user) {
      const savedPoints = localStorage.getItem('datamap_points');
      const savedTopics = localStorage.getItem('datamap_topics');
      if (savedPoints) this._points = parseInt(savedPoints);
      if (savedTopics) this._completedTopics = JSON.parse(savedTopics);
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = baseUrl + 'styles.css';
    this.shadowRoot.prepend(link);
    await new Promise(resolve => { link.onload = resolve; link.onerror = resolve; });

    const [, , dataRaw, lowResTopoRaw, highResTopoRaw] = await Promise.all([
      loadScript(TOPOJSON_CLIENT_URL),
      loadScript(D3_URL),
      fetch(baseUrl + 'data.json').then(r => r.json()),
      fetch(LOW_RES_MAP_TOPO_URL).then(r => r.json()),
      fetch(HIGH_RES_MAP_TOPO_URL).then(r => r.json())
    ]);

    Object.entries(dataRaw).forEach(([k, v]) => { if (k !== '_meta') this.DATA[k] = v; });
    this.DATA._meta = dataRaw._meta || {};
    this.categories = {};
    Object.entries(this.DATA).forEach(([key, dt]) => {
      if (key === '_meta') return;
      const cat = dt.category || 'other';
      if (!this.categories[cat]) this.categories[cat] = [];
      this.categories[cat].push(key);
    });

    const langSwitchBtn = this.$('#langSwitchBtn');
    const langDropdown = this.$('#langDropdown');
    const currentLangLabel = this.$('#currentLangLabel');
    const langOptions = this.$$('.lang-option');

    if (langSwitchBtn && langDropdown) {
      langSwitchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
        langSwitchBtn.classList.toggle('open');
      });

      langOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          this._lang = opt.dataset.lang;
          currentLangLabel.textContent = opt.textContent;
          langOptions.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          langDropdown.classList.remove('open');
          langSwitchBtn.classList.remove('open');
          this.applyLanguage();
        });
      });

      this.shadowRoot.addEventListener('click', (e) => {
        if (!langSwitchBtn.contains(e.target) && !langDropdown.contains(e.target)) {
          langDropdown.classList.remove('open');
          langSwitchBtn.classList.remove('open');
        }
      });
    }

    if (this.DATA._meta.lastUpdated) {
      const d = new Date(this.DATA._meta.lastUpdated);
      this.$('#lastUpdated').textContent = this.t('updatedDate') + d.toLocaleDateString(this._lang === 'cs' ? 'cs-CZ' : 'en-US');
    }

    const logoEl = this.$('#navLogo'); if (logoEl) logoEl.src = baseUrl + 'logo.png';
    const logoMob = this.$('#navLogoMobile'); if (logoMob) logoMob.src = baseUrl + 'logo-mobile.png';

    const aboutBtn = this.$('#aboutBtn');
    if (aboutBtn) aboutBtn.addEventListener('click', () => { window.parent.postMessage({ action: 'redirect', url: '/landing' }, '*'); });

    if (this._isDesktop) {
      const filterDiv = document.createElement('div');
      filterDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" role="presentation" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence"/><feComponentTransfer in="turbulence" result="mapped"><feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/><feFuncG type="gamma" amplitude="0" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5"/></feComponentTransfer><feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"/><feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lighting-color="white" result="specLight"><fePointLight x="-200" y="-200" z="300"/></feSpecularLighting><feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage"/><feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
      this.shadowRoot.appendChild(filterDiv.firstChild);
    } else {
      this.$('#mapSvg').setAttribute('preserveAspectRatio', 'xMidYMid slice');
    }

    const lowResAll = topojson.feature(lowResTopoRaw, lowResTopoRaw.objects.countries);
    const highResAll = topojson.feature(highResTopoRaw, highResTopoRaw.objects.countries);
    this.geoFeaturesLowRes = lowResAll.features.filter(f => NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')]);
    this.geoFeaturesHighRes = highResAll.features.filter(f => NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')]);

    this.drawMap();
    this.applyLanguage(); 

    const firstCat = Object.keys(this.categories)[0];
    if (firstCat) this.selectCategory(firstCat);
    this.initZoomPan();

    // Modal Listeners
    this.updatePointsDisplay();
    
    this.$('#btnUpgrade').addEventListener('click', () => this.openModal('proModal'));
    this.$('#btnPoints').addEventListener('click', () => this.openQuestionnaireModal());
    
    this.$$('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal-overlay').classList.remove('active');
      });
    });

    // Handle Auth Submission
    this.$('#authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this.$('#authEmail').value;
      const pass = this.$('#authPass').value;
      const btn = this.$('#authSubmitBtn');
      
      btn.textContent = "Creating Account...";
      btn.disabled = true;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        // Save the points they earned while not logged in
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          points: this._points,
          completedTopics: this._completedTopics,
          answers: this._answers,
          createdAt: new Date().toISOString()
        });

        this.$('#authModal').classList.remove('active');
        this.renderQuestionnaireMenu();
      } catch (error) {
        alert("Error creating account: " + error.message);
      } finally {
        btn.textContent = "Sign Up & Save Points";
        btn.disabled = false;
      }
    });

    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';
  }

  openModal(id) {
    this.$$('.modal-overlay').forEach(m => m.classList.remove('active'));
    this.$('#' + id).classList.add('active');
  }

  updatePointsDisplay() {
    this.$('#pointsCount').textContent = this._points + ' Pts';
  }

  openQuestionnaireModal() {
    this.renderQuestionnaireMenu();
    this.openModal('questionnaireModal');
  }

  renderQuestionnaireMenu() {
    const container = this.$('#qList');
    container.innerHTML = '';
    
    QUESTIONNAIRE.forEach(topic => {
      const isCompleted = this._completedTopics.includes(topic.id);
      const btn = document.createElement('button');
      btn.className = `q-topic-btn ${isCompleted ? 'completed' : ''}`;
      btn.innerHTML = `
        <span class="q-topic-title">${topic.title}</span>
        <span class="q-topic-reward">${isCompleted ? '✔ Done' : '+50 Pts'}</span>
      `;
      if (!isCompleted) {
        btn.onclick = () => this.renderTopic(topic);
      }
      container.appendChild(btn);
    });
  }

  renderTopic(topic) {
    const container = this.$('#qList');
    container.innerHTML = `<h3 class="modal-title" style="font-size:1.2rem; margin-bottom:16px;">${topic.title}</h3>`;
    
    let tempAnswers = {};

    topic.questions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'q-question-card';
      card.innerHTML = `
        <div class="q-text">${index + 1}. ${q.text}</div>
        <div class="q-actions">
          <button class="btn-vote yes" data-q="${q.id}" data-val="yes">Yes</button>
          <button class="btn-vote no" data-q="${q.id}" data-val="no">No</button>
        </div>
      `;
      container.appendChild(card);

      const btns = card.querySelectorAll('.btn-vote');
      btns.forEach(btn => {
        btn.onclick = () => {
          btns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          tempAnswers[q.id] = btn.dataset.val;

          // Check if all questions are answered
          if (Object.keys(tempAnswers).length === topic.questions.length) {
            this.completeTopic(topic.id, tempAnswers);
          }
        };
      });
    });
  }

  async completeTopic(topicId, newAnswers) {
    setTimeout(async () => {
      // 1. Update local state
      this._completedTopics.push(topicId);
      this._points += 50;
      this._answers = { ...this._answers, ...newAnswers };
      
      // Update local storage as a backup
      localStorage.setItem('datamap_topics', JSON.stringify(this._completedTopics));
      localStorage.setItem('datamap_points', this._points);
      
      this.updatePointsDisplay();
      
      // 2. If logged in, save to Firebase
      if (this._user) {
        try {
          await setDoc(doc(db, "users", this._user.uid), {
            points: this._points,
            completedTopics: this._completedTopics,
            answers: this._answers
          }, { merge: true });
          this.renderQuestionnaireMenu();
        } catch (e) {
          console.error("Error saving to db", e);
        }
      } else {
        // 3. Prompt Auth if not logged in
        this.openModal('authModal');
      }
    }, 400); 
  }

  applyLanguage() {
    this.$$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[this._lang] && I18N[this._lang][key]) el.textContent = I18N[this._lang][key];
    });

    if (this.DATA && this.DATA._meta && this.DATA._meta.lastUpdated) {
       const d = new Date(this.DATA._meta.lastUpdated);
       this.$('#lastUpdated').textContent = this.t('updatedDate') + d.toLocaleDateString(this._lang === 'cs' ? 'cs-CZ' : 'en-US');
    }

    this.buildCategoryButtons();
    if (this.currentCategory) {
      this.$$('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.key === this.currentCategory));
      this.buildDataTypeButtons(this.currentCategory);
    }
    if (this.currentDataType) {
      this.$$('#dtBtns .btn').forEach(b => b.classList.toggle('active', b.dataset.key === this.currentDataType));
      this.buildSourceButtons(this.currentDataType);
    }
    if (this.currentSource) {
      this.$$('#srcBtns .btn').forEach(b => { if (!b.classList.contains('disabled')) b.classList.toggle('active', b.dataset.key === this.currentSource); });
      this.paint();
    }

    this.$$('.cp').forEach(p => {
      p.dataset.name = this._lang === 'cs' ? (CS_COUNTRIES[p.dataset.code] || ALPHA2_TO_NAME[p.dataset.code]) : ALPHA2_TO_NAME[p.dataset.code];
    });

    if (this._selectedCountryCode) {
      this.$('#panelCountry').textContent = this._lang === 'cs' ? (CS_COUNTRIES[this._selectedCountryCode] || ALPHA2_TO_NAME[this._selectedCountryCode]) : ALPHA2_TO_NAME[this._selectedCountryCode];
      this.$('#panelMetric').textContent = this.DATA[this.currentDataType] ? this.t(this.DATA[this.currentDataType].label) : '';
      const activeBtn = this.$('.mode-btn.active');
      if (activeBtn) {
          if (activeBtn.dataset.mode === 'history') {
              this.updateHistoryView(this.$('#histSlider').value);
          } else {
              this.buildFutureView(this._selectedCountryCode);
          }
      }
    }
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
    } catch(err) { return '50% 50%'; }
  }

  drawMap() {
    const svg = this.$('#mapSvg');
    svg.innerHTML = '';
    const isSpinning = this._is3D && (this._isPanning || Math.abs(this._spinVelocity) > 0.01 || this._autoSpinning);
    let cx, cy, scale;

    if (this._is3D) {
      scale = Math.min(WORLD_VIEWBOX.w, WORLD_VIEWBOX.h) / 2.2;
      cx = WORLD_VIEWBOX.w / 2 + this._panX;
      cy = WORLD_VIEWBOX.h / 2 + this._panY;
      const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ocean.setAttribute('cx', cx); ocean.setAttribute('cy', cy);
      ocean.setAttribute('r', scale * this._zoom); ocean.setAttribute('class', 'globe-ocean');
      svg.appendChild(ocean);
    }
    
    const proj = c => this._proj(c);
    svg.appendChild(this._buildResolutionGroup(this.geoFeaturesLowRes, 'euro-group low-res', proj, OVERVIEW_LAYER_DECIMAL_PLACES));
    
    if (!this._is3D || !isSpinning) {
      svg.appendChild(this._buildResolutionGroup(this.geoFeaturesHighRes, 'euro-group high-res', proj, DETAIL_LAYER_DECIMAL_PLACES));
    }

    if (this._is3D) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `<radialGradient id="globeFog" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stop-color="rgba(224, 242, 254, 0)"/><stop offset="100%" stop-color="rgba(224, 242, 254, 0.4)"/>
        </radialGradient>`;
      svg.appendChild(defs);
      const fog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      fog.setAttribute('cx', cx); fog.setAttribute('cy', cy);
      fog.setAttribute('r', scale * this._zoom); fog.setAttribute('fill', 'url(#globeFog)');
      fog.setAttribute('pointer-events', 'none'); 
      svg.appendChild(fog);
    }

    this._isHighResVisible = !(this._zoom >= DETAIL_LAYER_ZOOM_THRESHOLD);
    this._syncDetailLayerVisibility();

    const overlayG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlayG.setAttribute('id', 'mapOverlayGroup');
    overlayG.style.pointerEvents = 'none';
    
    const sPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    sPath.setAttribute('id', 'selectOverlay'); sPath.setAttribute('class', 'overlay-selected');
    sPath.style.clipPath = 'circle(0% at 50% 50%)';
    const hPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hPath.setAttribute('id', 'hoverOverlay'); hPath.setAttribute('class', 'overlay-hovered');
    hPath.style.clipPath = 'circle(0% at 50% 50%)';

    overlayG.appendChild(hPath); overlayG.appendChild(sPath);
    svg.appendChild(overlayG);

    const self = this;
    svg.addEventListener('click', function(e) {
      if (self._dragged) return; 
      if (!e.target.classList.contains('cp')) self.closeSidePanel();
    });
    svg.addEventListener('touchstart', function(e) {
      if (!e.target.classList.contains('cp')) {
        self.$$('.cp.touched').forEach(el => el.classList.remove('touched'));
        self.ttHide(); self.closeSidePanel();
      }
    });
    
    this.$$('.mode-btn').forEach(btn => {
      btn.onclick = () => {
        if(btn.disabled) return;
        this.$$('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.$$('.panel-view').forEach(v => v.classList.remove('active'));
        this.$(`#view${btn.dataset.mode === 'history' ? 'History' : 'Future'}`).classList.add('active');
        this.$('#leftPanel').classList.add('open');
        const slider = this.$('#histSlider');
        slider.oninput = (ev) => this.updateHistoryView(ev.target.value);
        if (btn.dataset.mode === 'history') this.updateHistoryView(slider.value);
        else this.buildFutureView(this._selectedCountryCode);
      };
    });
    this.$('#closeLeftBtn').onclick = () => this.closeLeftPanelOnly();
    if(this.currentSource) this.paint();
  }

  _buildResolutionGroup(features, className, proj, precision) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    let pathGenerator;
    if (this._is3D) {
      const scale = Math.min(WORLD_VIEWBOX.w, WORLD_VIEWBOX.h) / 2.2;
      const projection = d3.geoOrthographic()
        .scale(scale * this._zoom)
        .translate([WORLD_VIEWBOX.w / 2 + this._panX, WORLD_VIEWBOX.h / 2 + this._panY])
        .rotate(this._globeRotation);
      pathGenerator = d3.geoPath().projection(projection);
    }
    features.forEach(f => {
      const a2 = NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')];
      if (!a2) return;
      let paths = [];
      if (this._is3D) { const d = pathGenerator(f); if (d) paths = [d]; } 
      else { paths = this.geoPaths(f.geometry, proj, precision); }
      paths.forEach(d => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d); p.dataset.code = a2; 
        p.dataset.name = this._lang === 'cs' ? (CS_COUNTRIES[a2] || ALPHA2_TO_NAME[a2]) : ALPHA2_TO_NAME[a2];
        p.classList.add('cp', 'no-data');
        this._bindCountryInteractions(p); group.appendChild(p);
      });
    });
    return group;
  }

  _bindCountryInteractions(pathEl) {
    const self = this;
    pathEl.addEventListener('mouseenter', function(e) { 
      const hOverlay = self.$('#hoverOverlay');
      if(hOverlay) {
        const code = pathEl.dataset.code;
        const allPaths = self.$$(`.cp[data-code="${code}"]`);
        let combinedD = '';
        allPaths.forEach(p => combinedD += p.getAttribute('d') + ' ');
        hOverlay.style.transition = 'none';
        hOverlay.setAttribute('d', combinedD.trim());
        const origin = self._getEventCenter(e, pathEl);
        hOverlay.style.clipPath = `circle(0% at ${origin})`;
        hOverlay.offsetHeight; 
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
        hOverlay.style.clipPath = `circle(0% at ${origin})`; 
      }
      self.ttHide(); 
    });
    pathEl.addEventListener('click', function(e) { 
      if (self._dragged) return; 
      self.openSidePanel(pathEl.dataset.code, pathEl.dataset.name, pathEl, e); 
    });
    pathEl.addEventListener('touchstart', function(e) {
      self.$$('.cp.touched').forEach(el => el.classList.remove('touched'));
      const code = pathEl.dataset.code;
      const allPaths = self.$$(`.cp[data-code="${code}"]`);
      let combinedD = '';
      allPaths.forEach(p => { p.classList.add('touched'); combinedD += p.getAttribute('d') + ' '; });
      const hOverlay = self.$('#hoverOverlay');
      if(hOverlay) {
        hOverlay.style.transition = 'none';
        hOverlay.setAttribute('d', combinedD.trim());
        hOverlay.style.clipPath = 'circle(150% at 50% 50%)';
      }
    }, { passive: true });
  }

  openSidePanel(code, name, pathEl, e) {
    this._selectedCountryCode = code;
    this._selectedCountryName = name;
    this._activeHistoryCode = code;

    this.$$('.cp').forEach(el => el.classList.remove('selected'));
    const allPaths = this.$$(`.cp[data-code="${code}"]`);
    allPaths.forEach(p => p.classList.add('selected'));

    if (allPaths.length > 0 && e) {
      const sOverlay = this.$('#selectOverlay');
      if (sOverlay) {
        let combinedD = '';
        allPaths.forEach(p => combinedD += p.getAttribute('d') + ' ');
        sOverlay.style.transition = 'none'; sOverlay.setAttribute('d', combinedD.trim());
        const origin = this._getEventCenter(e, pathEl || allPaths[0]);
        sOverlay.style.clipPath = `circle(0% at ${origin})`;
        sOverlay.offsetHeight; 
        sOverlay.style.transition = 'clip-path 0.3s ease-out';
        sOverlay.style.clipPath = `circle(150% at ${origin})`;
      }
    }

    this.$('#panelCountry').textContent = name;
    this.$('#panelMetric').textContent = this.DATA[this.currentDataType] ? this.t(this.DATA[this.currentDataType].label) : '';

    const hasData = window.HISTORY_DATA && window.HISTORY_DATA[this.currentDataType] && window.HISTORY_DATA[this.currentDataType][code];
    if (!hasData) {
      this.$$('.mode-btn').forEach(b => { b.disabled = true; b.classList.remove('active'); });
      this.closeLeftPanelOnly();
      return;
    }
    this.$$('.mode-btn').forEach(b => b.disabled = false);
    
    if (this.$('#leftPanel').classList.contains('open')) {
        const activeBtn = this.$('.mode-btn.active');
        if (activeBtn) {
            if (activeBtn.dataset.mode === 'history') this.updateHistoryView(this.$('#histSlider').value);
            else this.buildFutureView(code);
        }
    }
  }
  
  closeLeftPanelOnly() {
    this.$('#leftPanel').classList.remove('open');
    this.$$('.mode-btn').forEach(b => b.classList.remove('active'));
  }

  closeSidePanel() {
    this._selectedCountryCode = null; this._selectedCountryName = null; this._activeHistoryCode = null;
    this.closeLeftPanelOnly();
    this.$$('.mode-btn').forEach(b => b.disabled = true);
    this.$$('.cp').forEach(el => el.classList.remove('selected'));
    const sOverlay = this.$('#selectOverlay');
    if (sOverlay) sOverlay.style.clipPath = 'circle(0% at 50% 50%)';
  }

  updateHistoryView(year) {
    const metricData = window.HISTORY_DATA[this.currentDataType][this._activeHistoryCode];
    if (!metricData) return;

    this.$('#yearLabels').querySelectorAll('span').forEach(span => {
      if (span.dataset.val === String(year)) span.classList.add('active');
      else span.classList.remove('active');
    });
    
    let svg = this.$('#histChart');
    if(svg.tagName !== 'svg' && svg.tagName !== 'SVG') {
      this.$('#viewHistory .chart-container').innerHTML = '<svg class="chart-svg" id="histChart"></svg>';
      svg = this.$('#histChart');
    }

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

    const txtObj = metricData.txt[year];
    const txt = txtObj ? (txtObj[this._lang] || txtObj.en) : (this._lang === 'cs' ? "Normální roční vývoj. Nezaznamenány žádné významné odchylky." : "Normal yearly progression. No major outliers recorded.");
    
    const dt = this.DATA[this.currentDataType];
    const targetVal = metricData[year];

    let valContainer = this.$('#histText .hist-value-number');
    if (!valContainer) {
      this.$('#histText').innerHTML = `
        <div class="hist-value-box">
          <div class="hist-value-number" id="histValNum">${fmt(targetVal, dt.unit, k=>this.t(k))}</div>
        </div>
        <div class="hist-info-text" id="histInfoTxt"></div>
      `;
      valContainer = this.$('#histValNum');
      this._lastHistVal = targetVal;
    }

    if (this._lastHistVal !== undefined && !isNaN(this._lastHistVal) && !isNaN(targetVal)) {
      animateValue(valContainer, this._lastHistVal, targetVal, dt.unit, 300, k=>this.t(k));
    } else {
      valContainer.textContent = fmt(targetVal, dt.unit, k=>this.t(k));
    }
    this._lastHistVal = targetVal;
    this.$('#histInfoTxt').innerHTML = `<strong>${year} ${this.t('context')}</strong><br/>${txt}`;
  }

  buildFutureView(code) {
    const futData = window.FUTURE_DATA[this.currentDataType] && window.FUTURE_DATA[this.currentDataType][code];
    const container = this.$('#futFactors');
    container.innerHTML = '';
    
    if (!futData) {
      this.$('#futDesc').textContent = this.t('noProj');
      let svg = this.$('#futChart');
      if (svg) svg.innerHTML = '';
      this.$('#futResult').innerHTML = '';
      return;
    }

    this.$('#futDesc').textContent = futData.desc[this._lang] || futData.desc.en;
    
    futData.factors.forEach((f, i) => {
      const div = document.createElement('div'); div.className = 'factor-row';
      div.innerHTML = `
        <label class="factor-label">
          <input type="checkbox" class="factor-cb" data-id="${f.id}">
          <span class="cb-custom"></span><span class="factor-title">${f.title[this._lang] || f.title.en}</span>
        </label>
        <div class="factor-info-btn">i
          <div class="factor-tooltip">
            <strong>${this.t('context')}</strong> ${f.info[this._lang] || f.info.en}<br/><br/>
            <span style="color:#27ae60">✔ ${f.yes[this._lang] || f.yes.en}</span><br/><span style="color:#c0392b">✘ ${f.no[this._lang] || f.no.en}</span>
          </div>
        </div>`;
      div.querySelector('.factor-cb').onchange = () => this.updateFutureChart(code, futData);
      container.appendChild(div);
    });

    let svg = this.$('#futChart');
    if(!svg || svg.tagName !== 'svg') {
      this.$('#viewFuture .chart-container').innerHTML = '<svg class="chart-svg" id="futChart"></svg>';
      svg = this.$('#futChart');
    }
    
    svg.innerHTML = `<defs><linearGradient id="futGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8395a7"/><stop offset="100%" stop-color="#34d399"/></linearGradient></defs>
                     <path class="chart-line" id="futLine" style="stroke: url(#futGrad); stroke-dasharray: 4 4;" />
                     <text x="12" y="118" class="fut-axis-label" text-anchor="start">2024</text>
                     <text x="268" y="118" class="fut-axis-label" text-anchor="end">2029</text>`;
    
    this.updateFutureChart(code, futData, true);
  }

  updateFutureChart(code, futData, isInitial = false) {
    const baseVal = window.HISTORY_DATA[this.currentDataType][code][2024];
    let currentRates = [...futData.base_growth], minRates = [...futData.base_growth], maxRates = [...futData.base_growth];
    
    this.$$('.factor-cb').forEach(cb => {
      const factor = futData.factors.find(f => f.id === cb.dataset.id);
      if(!factor) return;
      for(let i=0; i<5; i++) {
        if (cb.checked) currentRates[i] += factor.impact[i];
        if (factor.impact[i] > 0) maxRates[i] += factor.impact[i]; else minRates[i] += factor.impact[i];
      }
    });

    const years = [2024, 2025, 2026, 2027, 2028, 2029];
    const calcValues = (rates) => { const v = [baseVal]; for(let i=0; i<5; i++) v.push(v[i] * (1 + rates[i])); return v; };
    const minValues = calcValues(minRates), maxValues = calcValues(maxRates), currentValues = calcValues(currentRates);
    const minBound = Math.min(...minValues, ...maxValues, baseVal), maxBound = Math.max(...minValues, ...maxValues, baseVal);
    const range = maxBound === minBound ? 1 : maxBound - minBound;

    const svg = this.$('#futChart'); if (!svg) return;
    const w = 280, h = 120, pad = 12;
    if(isInitial) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    
    let pathD = "";
    const dt = this.DATA[this.currentDataType];

    years.forEach((y, i) => {
      const cx = pad + (i / (years.length - 1)) * (w - pad * 2);
      const cy = h - pad - ((currentValues[i] - minBound) / range) * (h - pad * 2);
      pathD += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
      
      let pt = svg.querySelector(`#fp${i}`); let lbl = svg.querySelector(`#fl${i}`);
      if (!pt) {
        pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); pt.setAttribute('id', `fp${i}`); pt.setAttribute('r', '4'); pt.setAttribute('class', 'chart-point fut-point'); svg.appendChild(pt);
        lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text'); lbl.setAttribute('id', `fl${i}`); lbl.setAttribute('class', 'fut-label'); svg.appendChild(lbl);
      }
      pt.style.transform = `translate(${cx}px, ${cy}px)`; lbl.style.transform = `translate(${cx}px, ${cy - 10}px)`;

      if (i === 0) { lbl.textContent = fmt(currentValues[i], dt.unit, k=>this.t(k)); lbl.setAttribute('text-anchor', 'start'); } 
      else if (i === 5) {
        lbl.setAttribute('text-anchor', 'end');
        if (this._lastFutVal !== undefined && !isNaN(this._lastFutVal) && !isNaN(currentValues[i])) animateValue(lbl, this._lastFutVal, currentValues[i], dt.unit, 300, k=>this.t(k));
        else lbl.textContent = fmt(currentValues[i], dt.unit, k=>this.t(k));
      } else lbl.textContent = '';
    });
    
    const line = svg.querySelector('#futLine');
    if (line) {
      const newD = pathD; const oldD = line.getAttribute('d');
      if (this._lineAnimFrame) cancelAnimationFrame(this._lineAnimFrame);
      if (oldD && oldD !== newD && oldD.includes('M')) {
        const parseD = (dStr) => dStr.trim().split(/[ML\s]+/).filter(Boolean).map(s => s.split(',').map(Number));
        const oldPts = parseD(oldD); const newPts = parseD(newD);
        if (oldPts.length === newPts.length) {
          const startT = performance.now();
          const animD = (now) => {
            const p = Math.min((now - startT) / 300, 1); const ease = 1 - Math.pow(1 - p, 3); 
            let curD = "";
            for(let j = 0; j < oldPts.length; j++) {
              const curX = oldPts[j][0] + (newPts[j][0] - oldPts[j][0]) * ease; const curY = oldPts[j][1] + (newPts[j][1] - oldPts[j][1]) * ease;
              curD += `${j === 0 ? 'M' : 'L'}${curX},${curY} `;
            }
            line.setAttribute('d', curD);
            if (p < 1) this._lineAnimFrame = requestAnimationFrame(animD);
          };
          this._lineAnimFrame = requestAnimationFrame(animD);
        } else line.setAttribute('d', newD);
      } else line.setAttribute('d', newD);
    }

    const targetVal = currentValues[5];
    let resultContainer = this.$('#futResultVal');
    if (!resultContainer) {
      this.$('#futResult').innerHTML = `${this.t('projected')}<strong id="futResultVal">${fmt(targetVal, dt.unit, k=>this.t(k))}</strong>`;
      resultContainer = this.$('#futResultVal');
      this._lastFutVal = targetVal;
    }

    if (this._lastFutVal !== undefined && !isNaN(this._lastFutVal) && !isNaN(targetVal)) animateValue(resultContainer, this._lastFutVal, targetVal, dt.unit, 300, k=>this.t(k));
    else resultContainer.textContent = fmt(targetVal, dt.unit, k=>this.t(k));
    this._lastFutVal = targetVal;
  }

  initZoomPan() {
    const svg = this.$('#mapSvg');
    const wrap = this.$('.map-wrap');
    if (!svg || !wrap) return;
    this._origVB = { ...WORLD_VIEWBOX };
    this._contentBBox = { ...WORLD_CONTENT_BBOX };
    
    if (!this._isDesktop) {
      this._zoom = 1.8; 
      const vw = this._origVB.w / this._zoom;
      const vh = this._origVB.h / this._zoom;
      this._panX = 260; 
      this._panY = -20;
    } else {
      this._zoom = 1; this._panX = 0; this._panY = -10;
    }
    this._applyTransform();

    const getScale = () => {
      const rect = svg.getBoundingClientRect();
      const vb = this._getViewBox();
      const scaleX = rect.width / vb.w;
      const scaleY = rect.height / vb.h;
      return (svg.getAttribute('preserveAspectRatio') === 'xMidYMid slice') 
        ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
    };

    const animLoop = () => {
      let needsRedraw = false;
      if (this._is3D) {
        if (this._autoSpinning && !this._isPanning) {
          this._globeRotation[0] += 0.15; needsRedraw = true;
        } else if (!this._isPanning && Math.abs(this._spinVelocity) > 0.01) {
          this._globeRotation[0] += this._spinVelocity; this._spinVelocity *= 0.95; needsRedraw = true;
        } else if (!this._isPanning && Math.abs(this._spinVelocity) <= 0.01) {
          this._spinVelocity = 0;
        }
      }
      if (needsRedraw) this.drawMap();
      requestAnimationFrame(animLoop);
    };
    requestAnimationFrame(animLoop);

    wrap.addEventListener('wheel', (e) => {
      e.preventDefault(); if (this._is3D) return; 
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
      this._isPanning = true; this._dragged = false; this._autoSpinning = false;
      this._panStartX = e.clientX; this._panStartY = e.clientY;
      this._panStartPanX = this._panX; this._panStartPanY = this._panY;
      this._panStartRotation = [...this._globeRotation];
      this._spinVelocity = 0; this._lastSpinTime = performance.now();
      wrap.style.cursor = 'grabbing'; e.preventDefault();
    });
    
    window.addEventListener('mousemove', (e) => {
      if (!this._isPanning) return;
      if (Math.abs(e.clientX - this._panStartX) > 3 || Math.abs(e.clientY - this._panStartY) > 3) {
        this._dragged = true;
      }
      const dx = (e.clientX - this._panStartX);
      const dy = (e.clientY - this._panStartY);
      if (this._is3D) {
        const sensitivity = 0.25 / this._zoom;
        const now = performance.now();
        const dt = now - this._lastSpinTime;
        if (dt > 0) this._spinVelocity = (dx * sensitivity - (this._globeRotation[0] - this._panStartRotation[0])) * 0.5;
        this._globeRotation[0] = this._panStartRotation[0] + dx * sensitivity;
        this._lastSpinTime = now;
        this.drawMap();
      } else {
        const rect = svg.getBoundingClientRect(); const vb = this._getViewBox();
        this._panX = this._panStartPanX - dx * (vb.w / rect.width);
        this._panY = this._panStartPanY - dy * (vb.h / rect.height);
        this._applyTransform();
      }
    });
    window.addEventListener('mouseup', () => {
      if (!this._isPanning) return;
      this._isPanning = false; wrap.style.cursor = ''; 
      if (!this._is3D) this._snapBack();
    });
    wrap.addEventListener('dblclick', (e) => { 
      e.preventDefault(); if (this._is3D) return; 
      this._animateTo(1, 0, 0); 
    });

    let initialDist = 0, initialMidX = 0, initialMidY = 0, startZoom = 1;

    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this._isPanning = true; this._dragged = false; this._autoSpinning = false;
        this._panStartX = e.touches[0].clientX; this._panStartY = e.touches[0].clientY;
        this._panStartPanX = this._panX; this._panStartPanY = this._panY;
        this._panStartRotation = [...this._globeRotation];
        this._spinVelocity = 0; this._lastSpinTime = performance.now();
      } else if (e.touches.length === 2) {
        this._isPanning = false;
        const t1 = e.touches[0], t2 = e.touches[1];
        initialDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialMidX = (t1.clientX + t2.clientX) / 2; initialMidY = (t1.clientY + t2.clientY) / 2;
        startZoom = this._zoom; this._panStartPanX = this._panX; this._panStartPanY = this._panY;
      }
    }, { passive: true });

    wrap.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this._isPanning) {
        e.preventDefault();
        const dx = e.touches[0].clientX - this._panStartX;
        const dy = e.touches[0].clientY - this._panStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this._dragged = true;
        if (this._is3D) {
          const sensitivity = 0.35 / this._zoom;
          const now = performance.now();
          const dt = now - this._lastSpinTime;
          if (dt > 0) this._spinVelocity = (dx * sensitivity - (this._globeRotation[0] - this._panStartRotation[0])) * 0.5;
          this._globeRotation[0] = this._panStartRotation[0] + dx * sensitivity;
          this._lastSpinTime = now;
          this.drawMap();
        } else {
          const scale = getScale();
          this._panX = this._panStartPanX - dx / scale;
          this._panY = this._panStartPanY - dy / scale;
          this._applyTransform();
        }
      } else if (e.touches.length === 2) {
        this._dragged = true; e.preventDefault();
        if (this._is3D) return; 
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const newZoom = Math.max(this._minZoom, Math.min(this._maxZoom, startZoom * (dist / initialDist)));
        const rect = svg.getBoundingClientRect();
        const mx = (initialMidX - rect.left) / rect.width;
        const my = (initialMidY - rect.top) / rect.height;
        const oldW = this._origVB.w / startZoom, newW = this._origVB.w / newZoom;
        const oldH = this._origVB.h / startZoom, newH = this._origVB.h / newZoom;
        this._panX = this._panStartPanX + (oldW - newW) * mx; 
        this._panY = this._panStartPanY + (oldH - newH) * my;
        this._zoom = newZoom; this._clampAndApply();
      }
    }, { passive: false });

    wrap.addEventListener('touchend', () => { 
      this._isPanning = false; 
      if (!this._is3D) this._snapBack(); 
    });

    const zoomIn = this.$('#zoomIn'), zoomOut = this.$('#zoomOut'), zoomReset = this.$('#zoomReset');
    if (zoomIn) zoomIn.addEventListener('click', () => {
      if (this._is3D) return;
      const nz = Math.min(this._maxZoom, this._zoom + 0.3);
      const oW = this._origVB.w / this._zoom, nW = this._origVB.w / nz;
      const oH = this._origVB.h / this._zoom, nH = this._origVB.h / nz;
      this._animateTo(nz, this._panX + (oW - nW) * 0.5, this._panY + (oH - nH) * 0.5);
    });
    if (zoomOut) zoomOut.addEventListener('click', () => {
      if (this._is3D) return; 
      const nz = Math.max(this._minZoom, this._zoom - 0.3);
      const oW = this._origVB.w / this._zoom, nW = this._origVB.w / nz;
      const oH = this._origVB.h / this._zoom, nH = this._origVB.h / nz;
      this._animateTo(nz, this._panX + (oW - nW) * 0.5, this._panY + (oH - nH) * 0.5);
    });
    if (zoomReset) zoomReset.addEventListener('click', () => { 
      if (this._is3D) return;
      this._animateTo(1, 0, 0); 
    });

    const toggle3D = this.$('#toggle3D');
    if (toggle3D) {
      toggle3D.addEventListener('click', () => {
        const wrap = this.$('.map-wrap'); 
        wrap.style.transition = 'opacity 0.15s ease-out';
        wrap.style.opacity = '0';
        
        setTimeout(() => {
          this._is3D = !this._is3D;
          toggle3D.classList.toggle('active-3d', this._is3D);
          
          if (this._is3D) {
            this._zoom = 1; this._panX = 0; this._panY = 0;
            this._applyTransform();
            if (zoomIn) zoomIn.style.opacity = '0.4';
            if (zoomOut) zoomOut.style.opacity = '0.4';
            if (zoomReset) zoomReset.style.opacity = '0.4';
            wrap.style.transform = 'scale(0.85)';
          } else {
            if (zoomIn) zoomIn.style.opacity = '1';
            if (zoomOut) zoomOut.style.opacity = '1';
            if (zoomReset) zoomReset.style.opacity = '1';
            wrap.style.transform = 'scale(1.15)';
          }
          this.drawMap();
          void wrap.offsetHeight; 
          
          wrap.style.transition = 'opacity 0.3s ease-in, transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)';
          wrap.style.opacity = '1';
          wrap.style.transform = 'scale(1)';
          
          setTimeout(() => { wrap.style.transition = ''; wrap.style.transform = ''; }, 450);
        }, 150);
      });
    }
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
    const svg = this.$('#mapSvg');
    let vw = this._origVB.w / this._zoom;
    let vh = this._origVB.h / this._zoom;
    let isMobile = false;
    
    if (svg && svg.getAttribute('preserveAspectRatio') === 'xMidYMid slice') {
      isMobile = true;
      const rect = svg.getBoundingClientRect();
      const vb = this._getViewBox();
      const scaleX = rect.width / vb.w;
      const scaleY = rect.height / vb.h;
      const scale = Math.max(scaleX, scaleY);
      if (scale > 0) {
        vw = rect.width / scale;
        vh = rect.height / scale;
      }
    }
    const cb = this._contentBBox;
    const overX = isMobile ? (this._origVB.w * 0.7) : (vw * 0.05); 
    const overY = vh * 0.05; 
    
    return {
      minX: Math.min(cb.x - this._origVB.x - overX, 0),
      maxX: Math.max((cb.x + cb.w) - this._origVB.x - vw + overX, 0),
      minY: Math.min(cb.y - this._origVB.y - overY, 0),
      maxY: Math.max((cb.y + cb.h) - this._origVB.y - vh + overY, 0)
    };
  }
  _clampPan() {
    if(this._is3D) return; 
    const b = this._getPanBounds();
    this._panX = Math.max(b.minX, Math.min(b.maxX, this._panX));
    this._panY = Math.max(b.minY, Math.min(b.maxY, this._panY));
  }
  _clampAndApply() { this._clampPan(); this._applyTransform(); this._syncDetailLayerVisibility(); }
  _snapBack() {
    if(this._is3D) return; 
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
    if (!this._is3D) {
      targetPanX = Math.max(Math.min(cb.x - this._origVB.x - overX, 0), Math.min(Math.max((cb.x + cb.w) - this._origVB.x - tvw + overX, 0), targetPanX));
      targetPanY = Math.max(Math.min(cb.y - this._origVB.y - overY, 0), Math.min(Math.max((cb.y + cb.h) - this._origVB.y - tvh + overY, 0), targetPanY));
    }
    
    const st = performance.now();
    const tick = (now) => {
      const p = Math.min((now - st) / duration, 1);
      const c1 = 1.70158, c3 = c1 + 1;
      const ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
      this._zoom = sz + (targetZoom - sz) * ease;
      this._panX = sx + (targetPanX - sx) * ease;
      this._panY = sy + (targetPanY - sy) * ease;
      this._applyTransform();
      if(this._is3D) this.drawMap();
      if (p < 1) this._animFrame = requestAnimationFrame(tick);
      else { this._zoom = targetZoom; this._panX = targetPanX; this._panY = targetPanY; this._applyTransform(); this._syncDetailLayerVisibility(); this._animFrame = null; }
    };
    this._animFrame = requestAnimationFrame(tick);
  }

  _appendPathPoint(path, command, point, precision) { path.push(`${command}${point[0].toFixed(precision)},${point[1].toFixed(precision)}`); }

  _ringToPath(ring, proj, precision) {
    if (!ring.length) return '';
    const path = [];
    let currentLon = ring[0][0];
    const firstPoint = proj([currentLon, ring[0][1]]);
    this._appendPathPoint(path, 'M', firstPoint, precision);

    for (let i = 1; i < ring.length; i += 1) {
      let lon = ring[i][0];
      let lat = ring[i][1];
      if (lon - currentLon > 180) lon -= 360;
      else if (currentLon - lon > 180) lon += 360;
      currentLon = lon;
      this._appendPathPoint(path, 'L', proj([lon, lat]), precision);
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
      const meta = CATEGORY_META[catKey] || { icon: '', labelKey: catKey };
      const b = document.createElement('button'); b.className = 'cat-btn'; b.dataset.key = catKey;
      b.innerHTML = '<span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' + meta.icon + '</svg></span><span class="cat-label">' + this.t(meta.labelKey) + '</span>';
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
      // Filter out WHO entirely from the count and UI calculation
      const validSources = Object.entries(dt.sources).filter(([sk, s]) => sk !== 'who');
      const srcCount = validSources.length;
      const okCount = validSources.filter(([, s]) => Object.keys(s.countries).length > 0).length;
      
      b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + this.t(dt.label) + '</span></span><span class="badge">' + okCount + '/' + srcCount + '</span>';
      b.onclick = () => this.selectDataType(key); c.appendChild(b);
    });
  }

  buildSourceButtons(dtKey) {
    const c = this.$('#srcBtns'); c.innerHTML = '';
    const slider = document.createElement('div'); slider.className = 'slider'; c.appendChild(slider);
    const dt = this.DATA[dtKey]; if (!dt) return;
    Object.entries(dt.sources).forEach(([key, src]) => {
      if (key === 'who') return; // Hide WHO
      const count = Object.keys(src.countries).length; const isEmpty = count === 0;
      const b = document.createElement('button'); b.className = 'btn' + (isEmpty ? ' disabled' : ''); b.dataset.key = key;
      if (isEmpty) b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + src.label + '</span></span><span class="badge badge-empty">' + this.t('noData') + '</span>';
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
    // Do not select WHO as the default fallback
    const firstOk = Object.entries(dt.sources).find(([sk, s]) => sk !== 'who' && Object.keys(s.countries).length > 0);
    if (firstOk) {
      this.selectSource(firstOk[0]);
    } else {
      this.currentSource = null; this.$('#mapTitle').textContent = this.t(dt.label);
      this.$('#mapSub').textContent = this.t('noDataSrc');
      this.$('#legMin').textContent = '\u2014'; this.$('#legMax').textContent = '\u2014';
      this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
    }
    
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
    this.$('#mapTitle').textContent = this.t(dt.label);
    this.$('#mapSub').textContent = src.label + ' \u00B7 ' + src.year + ' \u00B7 ' + this.t(dt.unit);
    const vals = Object.values(src.countries).filter(v => v != null);
    if (!vals.length) { this.$('#legMin').textContent = '\u2014'; this.$('#legMax').textContent = '\u2014'; this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); }); return; }
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    this.$('#legMin').textContent = fmt(min, dt.unit, key => this.t(key)); this.$('#legMax').textContent = fmt(max, dt.unit, key => this.t(key));
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
    this.$('#ttUnit').textContent = newVal != null ? this.t(dt.unit) : '';
    this.$('#ttSrc').textContent = (src.label || '\u2014') + ' \u00B7 ' + (src.year || '\u2014');
    const valEl = this.$('#ttVal');
    if (this._lastTtDataType === this.currentDataType && newVal != null && this._lastTtVal != null && !isNaN(this._lastTtVal) && !isNaN(newVal))
      animateValue(valEl, this._lastTtVal, newVal, dt.unit, 300, key => this.t(key));
    else valEl.textContent = fmt(newVal, dt.unit, key => this.t(key));
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
    Object.entries(dt.sources).forEach(([sk, s]) => {
      if (sk === 'who') return; // Do not include WHO in the variance calculation
      if (s.countries[code] != null) vals.push(s.countries[code]);
    });
    if (vals.length >= 2) {
      const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const diff = avg ? ((mx - mn) / Math.abs(avg)) * 100 : 0;
      if (diff > 10) {
        el.style.display = 'block'; 
        el.textContent = '\u26A0\uFE0F ' + diff.toFixed(0) + (this._lang === 'cs' ? '% rozptyl mezi ' : '% variance across ') + vals.length + (this._lang === 'cs' ? ' zdroji' : ' sources'); 
        return;
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
      <button class="nav-link" id="aboutBtn" data-i18n="about">About</button>
      
      <div class="lang-switcher-wrap" id="langSwitcherWrap">
        <button class="lang-switch-btn" id="langSwitchBtn">
          <span id="currentLangLabel">EN</span>
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
        </button>
        <div class="lang-dropdown glass" id="langDropdown">
          <button class="lang-option active" data-lang="en">EN</button>
          <button class="lang-option" data-lang="cs">CS</button>
        </div>
      </div>

      <!-- NEW: Points & Upgrade Actions -->
      <div class="nav-actions">
        <div class="points-badge" id="btnPoints" title="Earn Points">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.1-.96-2.17-1.92H8c.07 1.8 1.15 3.03 2.9 3.42V20h2.25v-1.64c1.78-.34 2.85-1.43 2.85-3.04 0-2.16-1.75-2.82-3.69-3.32z"/></svg>
          <span id="pointsCount">0 Pts</span>
        </div>
        <button class="btn-upgrade" id="btnUpgrade">
          <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
          <span>Upgrade</span>
        </button>
      </div>
      
    </div>
  </nav>

  <div id="initLoader" class="init-loader"><div class="orbit"></div><span data-i18n="loading">Loading map & data\u2026</span></div>
  <div class="main" id="mainContent" style="opacity:0">
    <div class="map-panel">
      <div class="title-row">
        <div><div class="map-title" id="mapTitle">\u2014</div><div class="map-sub" id="mapSub">\u2014</div></div>
        <div class="zoom-controls" id="zoomControls">
          <button class="zoom-btn" id="toggle3D" title="Toggle 3D Globe"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></button>
          <button class="zoom-btn" id="zoomIn" title="Zoom in"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
          <button class="zoom-btn" id="zoomReset" title="Reset view"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></button>
          <button class="zoom-btn" id="zoomOut" title="Zoom out"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg></button>
        </div>
      </div>
      <div class="legend"><span id="legMin">\u2014</span><div class="legend-bar"><div class="legend-marker" id="legMarker"></div></div><span id="legMax">\u2014</span></div>
      <div class="map-wrap"><svg id="mapSvg" viewBox="${WORLD_VIEWBOX.x} ${WORLD_VIEWBOX.y} ${WORLD_VIEWBOX.w} ${WORLD_VIEWBOX.h}" preserveAspectRatio="xMidYMid meet"></svg></div>
      
      <!-- MODE BAR & LEFT PANEL -->
      <div class="panel-wrapper" id="panelWrapper">
        
        <div class="mode-bar" id="modeBar">
          <button class="mode-btn" data-mode="history" data-i18n="history" disabled>HISTORY</button>
          <button class="mode-btn" data-mode="future" data-i18n="future" disabled>FUTURE</button>
        </div>

        <div class="side-panel left glass" id="leftPanel">
          <button class="close-btn" id="closeLeftBtn">✕</button>
          <div>
            <div class="history-header" id="panelCountry" data-i18n="country">Country</div>
            <div class="history-sub" id="panelMetric" data-i18n="metric">Metric</div>
          </div>
          
          <!-- HISTORY VIEW -->
          <div id="viewHistory" class="panel-view">
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
            <div class="future-desc" id="futDesc" data-i18n="desc">Description</div>
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
      <div><div class="sec-title" data-i18n="category">Category</div><div class="cat-tabs" id="catBtns"></div></div>
      <div><div class="sec-title" data-i18n="dataType">Data Type</div><div class="btn-group" id="dtBtns"></div></div>
      <div><div class="sec-title" data-i18n="source">Source</div><div class="btn-group" id="srcBtns"></div></div>
    </div>
  </div>
  <div class="footer" id="lastUpdated" data-i18n="updated">Data updated via Eurostat & World Bank APIs</div>
</div>
<div class="tooltip" id="tt">
  <div class="tt-name" id="ttName">\u2014</div>
  <div><span class="tt-val" id="ttVal">\u2014</span><span class="tt-unit" id="ttUnit"></span></div>
  <div class="tt-src" id="ttSrc"></div>
  <div class="tt-disc" id="ttDisc"></div>
</div>

<!-- PRO UPGRADE MODAL -->
<div class="modal-overlay" id="proModal">
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <span class="pro-badge">Coming Soon</span>
    <h2 class="modal-title">DataMap Pro</h2>
    <p class="modal-desc">Get ready for institutional-grade intelligence. Our Pro tier bypasses standard government data lag by integrating real-time alternative data to power our predictive algorithms.</p>
    <ul class="pro-features">
      <li><span class="pro-icon">🛰️</span> <span><strong>Satellite Imagery Analytics:</strong> Tracking factory outputs and shipping lane congestion in real-time.</span></li>
      <li><span class="pro-icon">🌐</span> <span><strong>Social Sentiment & Scraping:</strong> Advanced web-scraping of corporate hiring trends and global announcements.</span></li>
      <li><span class="pro-icon">🤖</span> <span><strong>Algorithmic Predictive Modeling:</strong> See exactly how macro-events alter GDP trajectories 5 years before they happen.</span></li>
    </ul>
    <p style="font-size: 0.85rem; color: #8395a7; font-style: italic;">*Use your earned Points to unlock early access when we launch.</p>
  </div>
</div>

<!-- QUESTIONNAIRE MODAL -->
<div class="modal-overlay" id="questionnaireModal">
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <h2 class="modal-title">Help Predict the Future</h2>
    <p class="modal-desc">Answer these expert polls. We use the "Wisdom of the Crowds" to fine-tune our future projection engine. Earn points for premium access.</p>
    <div id="qList">
      <!-- Topics injected via JS -->
    </div>
  </div>
</div>

<!-- AUTH MODAL -->
<div class="modal-overlay" id="authModal">
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <h2 class="modal-title">Save Your Points!</h2>
    <p class="modal-desc">Create a free account to secure the points you just earned and track your prediction accuracy.</p>
    <form id="authForm">
      <input type="email" id="authEmail" class="auth-input" placeholder="Email Address" required>
      <input type="password" id="authPass" class="auth-input" placeholder="Create a Password" required>
      <button type="submit" id="authSubmitBtn" class="btn-submit">Sign Up & Save Points</button>
    </form>
  </div>
</div>`;
  }
}

customElements.define('data-comparison-map', DataComparisonMap);
