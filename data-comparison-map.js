// ============================================================
// DATA COMPARISON MAP — Wix Custom Element
// Styles in styles.css · Data in data.json
// ============================================================

const LOW_RES_MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const HIGH_RES_MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';
const WEB_MERCATOR_MAX_LAT = 85.05112878;
const DETAIL_LAYER_ZOOM_THRESHOLD = 2;
const WORLD_VIEWBOX_WIDTH = 1000;
const WORLD_VIEWBOX_ASPECT_RATIO = 5 / 3;
const WORLD_VIEWBOX_HEIGHT = WORLD_VIEWBOX_WIDTH / WORLD_VIEWBOX_ASPECT_RATIO;
const LOW_RES_PATH_PRECISION = 1;
const HIGH_RES_PATH_PRECISION = 0;
const webMercatorLatScale = lat => Math.log(Math.tan((Math.PI / 4) + ((lat * Math.PI) / 360)));
const WEB_MERCATOR_MAX_Y = webMercatorLatScale(WEB_MERCATOR_MAX_LAT);
const WEB_MERCATOR_MIN_Y = webMercatorLatScale(-WEB_MERCATOR_MAX_LAT);
const WORLD_VIEWBOX = {
  x: 0,
  y: 0,
  w: WORLD_VIEWBOX_WIDTH,
  h: WORLD_VIEWBOX_HEIGHT
};
const WEB_MERCATOR_Y_RANGE = WEB_MERCATOR_MAX_Y - WEB_MERCATOR_MIN_Y;
const WORLD_MERCATOR_SCALE = WORLD_VIEWBOX.w / (2 * Math.PI);
const WORLD_MERCATOR_FULL_HEIGHT = WEB_MERCATOR_Y_RANGE * WORLD_MERCATOR_SCALE;
const WORLD_MERCATOR_OFFSET_Y = WORLD_VIEWBOX.y + ((WORLD_VIEWBOX.h - WORLD_MERCATOR_FULL_HEIGHT) / 2);
const WORLD_CONTENT_PADDING_X = 20;
const WORLD_CONTENT_PADDING_Y = 20;
const WORLD_CONTENT_BBOX = {
  x: WORLD_VIEWBOX.x - WORLD_CONTENT_PADDING_X,
  y: WORLD_VIEWBOX.y - WORLD_CONTENT_PADDING_Y,
  w: WORLD_VIEWBOX.w + (WORLD_CONTENT_PADDING_X * 2),
  h: WORLD_VIEWBOX.h + (WORLD_CONTENT_PADDING_Y * 2)
};
// Split suspiciously large longitude jumps so antimeridian polygons do not wrap across the whole SVG.
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
  economy: {
    label: 'Economy',
    icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/><path d="M4 12a8 8 0 018-8v2a6 6 0 100 12v2a8 8 0 01-8-8z"/>'
  },
  demographics: {
    label: 'Demographics',
    icon: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>'
  },
  society: {
    label: 'Society',
    icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>'
  },
  public_services: {
    label: 'Services',
    icon: '<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>'
  }
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
    this._animFrame = null;
    this._isHighResVisible = null;
    this._isDesktop = false;
    this._minZoom = 1;
    this._maxZoom = 4;
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
        window.parent.postMessage(
          { action: 'openLightbox', lightboxName: 'Support Us' },
          '*'
        );
      });
    }

    const aboutBtn = this.$('#aboutBtn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        window.parent.postMessage(
          { action: 'redirect', url: '/landing' }, 
          '*'
        );
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

  _lonToX(lon) {
    return WORLD_VIEWBOX.x + (((lon * Math.PI / 180) + Math.PI) * WORLD_MERCATOR_SCALE);
  }
  _latToY(lat) {
    const clampedLat = Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, lat));
    const mercatorY = webMercatorLatScale(clampedLat);
    return WORLD_MERCATOR_OFFSET_Y + ((WEB_MERCATOR_MAX_Y - mercatorY) * WORLD_MERCATOR_SCALE);
  }
  _proj(c) { return [this._lonToX(c[0]), this._latToY(c[1])]; }

  drawMap() {
    const svg = this.$('#mapSvg');
    svg.innerHTML = '';
    const proj = c => this._proj(c);
    svg.appendChild(this._buildResolutionGroup(this.geoFeaturesLowRes, 'euro-group low-res', proj, LOW_RES_PATH_PRECISION));
    svg.appendChild(this._buildResolutionGroup(this.geoFeaturesHighRes, 'euro-group high-res', proj, HIGH_RES_PATH_PRECISION));
    this._syncDetailLayerVisibility();

    const self = this;
    svg.addEventListener('touchstart', function(e) {
      if (!e.target.classList.contains('cp')) {
        self.$$('.cp.touched').forEach(function(el) { el.classList.remove('touched'); });
        self.ttHide();
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
    pathEl.addEventListener('mouseenter', function(e) { self.ttShow(e); });
    pathEl.addEventListener('mousemove', function(e) { self.ttMove(e); });
    pathEl.addEventListener('mouseleave', function() { self.ttHide(); });
    pathEl.addEventListener('touchstart', function(e) {
      e.preventDefault();
      self.$$('.cp.touched').forEach(function(el) { el.classList.remove('touched'); });
      pathEl.classList.add('touched');
      var touch = e.touches[0];
      var fakeEvent = { target: pathEl, clientX: touch.clientX, clientY: touch.clientY };
      self.ttShow(fakeEvent);
      self.ttMove(fakeEvent);
    }, { passive: false });
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
      this._isPanning = true; this._panStartX = e.clientX; this._panStartY = e.clientY;
      this._panStartPanX = this._panX; this._panStartPanY = this._panY;
      wrap.style.cursor = 'grabbing'; e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!this._isPanning) return;
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
    if (this._isHighResVisible !== null && this._isHighResVisible === showHighRes) return;
    this._isHighResVisible = showHighRes;
    lowResGroup.style.visibility = showHighRes ? 'hidden' : 'visible';
    lowResGroup.style.opacity = showHighRes ? '0' : '1';
    lowResGroup.style.pointerEvents = showHighRes ? 'none' : 'auto';
    highResGroup.style.visibility = showHighRes ? 'visible' : 'hidden';
    highResGroup.style.opacity = showHighRes ? '1' : '0';
    highResGroup.style.pointerEvents = showHighRes ? 'auto' : 'none';
  }
  _getPanBounds() {
    const vw = this._origVB.w / this._zoom, vh = this._origVB.h / this._zoom, cb = this._contentBBox;
    return {
      minX: Math.min(cb.x - this._origVB.x - vw * 0.5, 0),
      maxX: Math.max((cb.x + cb.w) - this._origVB.x - vw * 0.5, 0),
      minY: Math.min(cb.y - this._origVB.y - vh * 0.5, 0),
      maxY: Math.max((cb.y + cb.h) - this._origVB.y - vh * 0.5, 0)
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
    targetPanX = Math.max(Math.min(cb.x - this._origVB.x - tvw * 0.5, 0), Math.min(Math.max((cb.x + cb.w) - this._origVB.x - tvw * 0.5, 0), targetPanX));
    targetPanY = Math.max(Math.min(cb.y - this._origVB.y - tvh * 0.5, 0), Math.min(Math.max((cb.y + cb.h) - this._origVB.y - tvh * 0.5, 0), targetPanY));
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

  _appendPathPoint(path, command, point, precision) {
    path.push(`${command}${point[0].toFixed(precision)},${point[1].toFixed(precision)}`);
  }

  _segmentCrossesAntimeridian(from, to) {
    const lonDelta = Math.abs(to[0] - from[0]);
    const wrapDelta = 360 - lonDelta;
    return lonDelta > ANTIMERIDIAN_SPLIT_THRESHOLD &&
      wrapDelta < lonDelta &&
      Math.abs(from[0]) > ANTIMERIDIAN_SPLIT_THRESHOLD &&
      Math.abs(to[0]) > ANTIMERIDIAN_SPLIT_THRESHOLD;
  }

  _splitAntimeridianSegment(from, to) {
    const wrapsEastward = to[0] < from[0];
    const exitLon = wrapsEastward ? 180 : -180;
    const entryLon = wrapsEastward ? -180 : 180;
    // Normalize the wrapped endpoint into the same continuous longitude space for interpolation.
    const adjustedToLon = wrapsEastward ? to[0] + 360 : to[0] - 360;
    const t = (exitLon - from[0]) / (adjustedToLon - from[0]);
    const interpolatedLat = from[1] + (to[1] - from[1]) * t;
    const exitPoint = this._proj([exitLon, interpolatedLat]);
    const entryPoint = this._proj([entryLon, interpolatedLat]);
    return { exitPoint, entryPoint };
  }

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
    if (firstOk) this.selectSource(firstOk[0]);
    else {
      this.currentSource = null; this.$('#mapTitle').textContent = dt.label;
      this.$('#mapSub').textContent = 'No data available for any source';
      this.$('#legMin').textContent = '\u2014'; this.$('#legMax').textContent = '\u2014';
      this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
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
    //this.checkDiscrepancy(code);
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
    // Data variance feature
  const el = this.$('#ttDisc');  // ← this line was missing
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
  el.style.display = 'block';
  el.textContent = '\u26A0\uFE0F ' + diff.toFixed(0) + '% variance across ' + vals.length + ' sources';
  return;
  }
  }
  el.style.display = 'none';
  }

  // ← CHANGED: button now has id="supportBtn"
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
