// ============================================================
// DATA COMPARISON MAP — Wix Custom Element
// Styles are loaded from styles.css — edit that file for theming!
// ============================================================

const MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';

const NUMERIC_TO_ALPHA2 = {
  '040':'AT','056':'BE','100':'BG','191':'HR','196':'CY','203':'CZ',
  '208':'DK','233':'EE','246':'FI','250':'FR','276':'DE','300':'GR',
  '348':'HU','352':'IS','372':'IE','380':'IT','428':'LV','440':'LT',
  '442':'LU','470':'MT','528':'NL','578':'NO','616':'PL','620':'PT',
  '642':'RO','703':'SK','705':'SI','724':'ES','752':'SE','756':'CH',
  '826':'GB','008':'AL','070':'BA','499':'ME','807':'MK','688':'RS',
  '112':'BY','804':'UA','498':'MD'
};
const ALPHA2_TO_NAME = {
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
const EUROPE_NUMERIC = new Set(Object.keys(NUMERIC_TO_ALPHA2));

const CATEGORY_META = {
  economy:         { icon: '💰', label: 'Economy' },
  demographics:    { icon: '👥', label: 'Demographics' },
  society:         { icon: '🏛️', label: 'Society' },
  public_services: { icon: '📋', label: 'Public Services' }
};

// ===== Navy Blue color scale =====
function getColor(t) {
  // Light grey-blue → medium slate → deep navy → near-black navy
  const c = [
    [200, 214, 229],  // #c8d6e5
    [131, 149, 167],  // #8395a7
    [87, 101, 116],   // #576574
    [34, 47, 62],     // #222f3e
    [10, 22, 40]      // #0a1628
  ];
  const n = c.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = (t * n) - i;
  return `rgb(${Math.round(c[i][0]+(c[i+1][0]-c[i][0])*f)},${Math.round(c[i][1]+(c[i+1][1]-c[i][1])*f)},${Math.round(c[i][2]+(c[i+1][2]-c[i][2])*f)})`;
}

function fmt(val, unit) {
  if (val == null) return 'No data';
  if (unit === 'persons' && Math.abs(val) >= 1e6) return (val/1e6).toFixed(1) + 'M';
  if (unit === 'persons') return val.toLocaleString();
  if (unit === 'net persons' && Math.abs(val) >= 1e6) return (val/1e6).toFixed(1) + 'M';
  if (unit === 'net persons') return val.toLocaleString();
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

// ============================================================
// WEB COMPONENT
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
    this.geoFeatures = [];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.html();
    this.init();
  }

  $(s) { return this.shadowRoot.querySelector(s); }
  $$(s) { return this.shadowRoot.querySelectorAll(s); }

  async init() {
    // Resolve base URL for co-located files
    const scripts = document.querySelectorAll('script[src*="data-comparison-map"]');
    let baseUrl = '';
    if (scripts.length) {
      const src = scripts[scripts.length - 1].src;
      baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
    }

    // Load external stylesheet into shadow DOM
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = baseUrl + 'styles.css';
    this.shadowRoot.prepend(link);

    // Wait for CSS to load before showing content
    await new Promise(resolve => { link.onload = resolve; link.onerror = resolve; });

    // Load topojson + data + map geometry in parallel
    const [, dataRaw, topoRaw] = await Promise.all([
      loadScript(TOPOJSON_CLIENT_URL),
      fetch(baseUrl + 'data.json').then(r => r.json()),
      fetch(MAP_TOPO_URL).then(r => r.json())
    ]);

    // Parse data
    Object.entries(dataRaw).forEach(([k, v]) => {
      if (k !== '_meta') this.DATA[k] = v;
    });

    // Build categories
    this.categories = {};
    Object.entries(this.DATA).forEach(([key, dt]) => {
      const cat = dt.category || 'other';
      if (!this.categories[cat]) this.categories[cat] = [];
      this.categories[cat].push(key);
    });

    if (dataRaw._meta?.lastUpdated) {
      const d = new Date(dataRaw._meta.lastUpdated);
      this.$('#lastUpdated').textContent = `Data updated: ${d.toLocaleDateString()}`;
    }

    const all = topojson.feature(topoRaw, topoRaw.objects.countries);
    this.geoFeatures = all.features.filter(f =>
      EUROPE_NUMERIC.has(String(f.id).padStart(3, '0'))
    );

    this.drawMap();
    this.buildCategoryButtons();
    this.selectCategory(Object.keys(this.categories)[0]);

    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';
  }

  // ============================================================
  // MAP
  // ============================================================
  drawMap() {
    const svg = this.$('#mapSvg');
    svg.innerHTML = '';
    const lonToX = lon => (lon + 25) * (540 / 75);
    const latToY = lat => {
      const r = lat * Math.PI / 180;
      const y = Math.log(Math.tan(Math.PI / 4 + r / 2));
      const mn = Math.log(Math.tan(Math.PI / 4 + (34 * Math.PI / 180) / 2));
      const mx = Math.log(Math.tan(Math.PI / 4 + (72 * Math.PI / 180) / 2));
      return 470 - ((y - mn) / (mx - mn)) * 470;
    };
    const proj = ([lon, lat]) => [lonToX(lon), latToY(lat)];

    this.geoFeatures.forEach(f => {
      const a2 = NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')];
      if (!a2) return;
      this.geoPaths(f.geometry, proj).forEach(d => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        p.dataset.code = a2;
        p.dataset.name = ALPHA2_TO_NAME[a2] || a2;
        p.classList.add('cp', 'no-data');
        p.addEventListener('mouseenter', e => this.ttShow(e));
        p.addEventListener('mousemove', e => this.ttMove(e));
        p.addEventListener('mouseleave', () => this.ttHide());
        svg.appendChild(p);
      });
    });
  }

  geoPaths(geom, proj) {
    const ring = r => r.map((c, i) => {
      const [x, y] = proj(c);
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ') + 'Z';
    if (geom.type === 'Polygon') return [geom.coordinates.map(ring).join(' ')];
    if (geom.type === 'MultiPolygon') return geom.coordinates.map(p => p.map(ring).join(' '));
    return [];
  }

  // ============================================================
  // CATEGORY BUTTONS
  // ============================================================
  buildCategoryButtons() {
    const c = this.$('#catBtns');
    c.innerHTML = '';
    Object.entries(this.categories).forEach(([catKey]) => {
      const meta = CATEGORY_META[catKey] || { icon: '📊', label: catKey };
      const b = document.createElement('button');
      b.className = 'cat-btn';
      b.dataset.key = catKey;
      b.innerHTML = `<span class="cat-icon">${meta.icon}</span><span class="cat-label">${meta.label}</span>`;
      b.onclick = () => this.selectCategory(catKey);
      c.appendChild(b);
    });
  }

  selectCategory(catKey) {
    this.currentCategory = catKey;
    this.$$('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.key === catKey));
    this.buildDataTypeButtons(catKey);
    const first = this.categories[catKey]?.[0];
    if (first) this.selectDataType(first);
  }

  // ============================================================
  // DATA TYPE BUTTONS
  // ============================================================
  buildDataTypeButtons(catKey) {
    const c = this.$('#dtBtns');
    c.innerHTML = '';
    (this.categories[catKey] || []).forEach(key => {
      const dt = this.DATA[key];
      const b = document.createElement('button');
      b.className = 'btn';
      b.dataset.key = key;
      const srcCount = Object.keys(dt.sources).length;
      const okCount = Object.values(dt.sources).filter(s => Object.keys(s.countries).length > 0).length;
      b.innerHTML = `<span>${dt.label}</span><span class="badge">${okCount}/${srcCount}</span>`;
      b.onclick = () => this.selectDataType(key);
      c.appendChild(b);
    });
  }

  // ============================================================
  // SOURCE BUTTONS (greyed out when empty)
  // ============================================================
  buildSourceButtons(dtKey) {
    const c = this.$('#srcBtns');
    c.innerHTML = '';
    const dt = this.DATA[dtKey];
    Object.entries(dt.sources).forEach(([key, src]) => {
      const count = Object.keys(src.countries).length;
      const isEmpty = count === 0;
      const b = document.createElement('button');
      b.className = 'btn' + (isEmpty ? ' disabled' : '');
      b.dataset.key = key;
      if (isEmpty) {
        b.innerHTML = `<span>${src.label}</span><span class="badge badge-empty">No data</span>`;
      } else {
        b.innerHTML = `<span>${src.label}</span><span class="badge">${count} 🌍 · ${src.year}</span>`;
        b.onclick = () => this.selectSource(key);
      }
      c.appendChild(b);
    });
  }

  selectDataType(k) {
    this.currentDataType = k;
    this.$$('#dtBtns .btn').forEach(b => b.classList.toggle('active', b.dataset.key === k));
    this.buildSourceButtons(k);
    const dt = this.DATA[k];
    const firstOk = Object.entries(dt.sources).find(([, s]) => Object.keys(s.countries).length > 0);
    if (firstOk) {
      this.selectSource(firstOk[0]);
    } else {
      this.currentSource = null;
      this.$('#mapTitle').textContent = dt.label;
      this.$('#mapSub').textContent = 'No data available for any source';
      this.$('#legMin').textContent = '—';
      this.$('#legMax').textContent = '—';
      this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
    }
  }

  selectSource(k) {
    this.currentSource = k;
    this.$$('#srcBtns .btn').forEach(b => {
      if (!b.classList.contains('disabled')) b.classList.toggle('active', b.dataset.key === k);
    });
    this.paint();
  }

  // ============================================================
  // PAINT MAP
  // ============================================================
  paint() {
    const dt = this.DATA[this.currentDataType];
    const src = dt.sources[this.currentSource];
    if (!src) return;

    this.$('#mapTitle').textContent = dt.label;
    this.$('#mapSub').textContent = `${src.label} · ${src.year} · ${dt.unit}`;

    const vals = Object.values(src.countries).filter(v => v != null);
    if (!vals.length) {
      this.$('#legMin').textContent = '—';
      this.$('#legMax').textContent = '—';
      this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
      return;
    }

    const min = Math.min(...vals), max = Math.max(...vals);
    this.$('#legMin').textContent = fmt(min, dt.unit);
    this.$('#legMax').textContent = fmt(max, dt.unit);

    this.$$('.cp').forEach(p => {
      const v = src.countries[p.dataset.code];
      if (v != null) {
        p.classList.remove('no-data');
        p.setAttribute('fill', getColor(max !== min ? (v - min) / (max - min) : 0.5));
      } else {
        p.classList.add('no-data');
        p.setAttribute('fill', '#dfe6e9');
      }
    });
  }

  // ============================================================
  // TOOLTIP
  // ============================================================
  ttShow(e) {
    const dt = this.DATA[this.currentDataType];
    if (!dt || !this.currentSource) return;
    const src = dt.sources[this.currentSource];
    const code = e.target.dataset.code;
    const val = src?.countries?.[code];
    this.$('#ttName').textContent = e.target.dataset.name;
    this.$('#ttVal').textContent = fmt(val, dt.unit);
    this.$('#ttUnit').textContent = val != null ? dt.unit : '';
    this.$('#ttSrc').textContent = `${src?.label || '—'} · ${src?.year || '—'}`;
    this.checkDiscrepancy(code);
    this.$('#tt').classList.add('visible');
  }
  ttMove(e) {
    const tt = this.$('#tt');
    tt.style.left = (e.clientX + 18) + 'px';
    tt.style.top = (e.clientY - 12) + 'px';
  }
  ttHide() { this.$('#tt').classList.remove('visible'); }

  checkDiscrepancy(code) {
    const dt = this.DATA[this.currentDataType];
    const vals = [];
    Object.values(dt.sources).forEach(s => {
      if (s.countries[code] != null) vals.push(s.countries[code]);
    });
    const el = this.$('#ttDisc');
    if (vals.length >= 2) {
      const mn = Math.min(...vals), mx = Math.max(...vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const diff = avg ? ((mx - mn) / Math.abs(avg)) * 100 : 0;
      if (diff > 10) {
        el.style.display = 'block';
        el.textContent = `⚠️ ${diff.toFixed(0)}% variance across ${vals.length} sources`;
        return;
      }
    }
    el.style.display = 'none';
  }

  // ============================================================
  // HTML TEMPLATE (includes SVG filter for liquid glass)
  // ============================================================
  html() {
    return `
<!-- SVG Filter for Liquid Glass (Apple-style) -->
<svg xmlns="http://www.w3.org/2000/svg" role="presentation" style="position:absolute;width:0;height:0;overflow:hidden">
  <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
    <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence"/>
    <feComponentTransfer in="turbulence" result="mapped">
      <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/>
      <feFuncG type="gamma" amplitude="0" exponent="1" offset="0"/>
      <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5"/>
    </feComponentTransfer>
    <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"/>
    <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lighting-color="white" result="specLight">
      <fePointLight x="-200" y="-200" z="300"/>
    </feSpecularLighting>
    <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage"/>
    <feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>

<div class="app">
  <div class="header">
    <h1>Interactive Data Comparison Map</h1>
    <p>Compare data across sources — hover over countries for details</p>
  </div>

  <div id="initLoader" class="init-loader">
    <div class="orbit"></div>
    <span>Loading map & data…</span>
  </div>

  <div class="main" id="mainContent" style="opacity:0">
    <div class="map-panel glass">
      <div class="title-row">
        <div>
          <div class="map-title" id="mapTitle">—</div>
          <div class="map-sub" id="mapSub">—</div>
        </div>
      </div>
      <div class="legend">
        <span id="legMin">—</span>
        <div class="legend-bar"></div>
        <span id="legMax">—</span>
      </div>
      <div class="map-wrap">
        <svg id="mapSvg" viewBox="-30 -5 590 490" preserveAspectRatio="xMidYMid meet"></svg>
      </div>
    </div>

    <div class="controls glass">
      <div>
        <div class="sec-title">Category</div>
        <div class="cat-tabs" id="catBtns"></div>
      </div>
      <div>
        <div class="sec-title">📊 Data Type</div>
        <div class="btn-group" id="dtBtns"></div>
      </div>
      <div>
        <div class="sec-title">🏛️ Source</div>
        <div class="btn-group" id="srcBtns"></div>
      </div>
    </div>
  </div>

  <div class="footer" id="lastUpdated">Data auto-updated via Eurostat & World Bank APIs</div>
</div>

<div class="tooltip" id="tt">
  <div class="tt-name" id="ttName">—</div>
  <div><span class="tt-val" id="ttVal">—</span><span class="tt-unit" id="ttUnit"></span></div>
  <div class="tt-src" id="ttSrc"></div>
  <div class="tt-disc" id="ttDisc"></div>
</div>`;
  }
}

customElements.define('data-comparison-map', DataComparisonMap);
