// ============================================================
// DATA COMPARISON MAP — Wix Custom Element
// Loads pre-fetched data.json + world-atlas TopoJSON from CDN
// ============================================================

const MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';

// ============================================================
// COUNTRY CODE MAPPINGS
// ============================================================
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

// ============================================================
// UTILITIES
// ============================================================
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function getColor(t) {
  const c = [[224,242,241],[128,203,196],[38,166,154],[0,121,107],[0,77,64]];
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

// ============================================================
// WEB COMPONENT
// ============================================================
class DataComparisonMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.DATA = {};
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

  // ============================================================
  // INIT
  // ============================================================
  async init() {
    // Resolve data.json relative to this script's location
    const scripts = document.querySelectorAll('script[src*="data-comparison-map"]');
    let baseUrl = '';
    if (scripts.length) {
      const src = scripts[scripts.length - 1].src;
      baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
    }

    // Load topojson library + data.json + world-atlas in parallel
    const [, dataRaw, topoRaw] = await Promise.all([
      loadScript(TOPOJSON_CLIENT_URL),
      fetch(baseUrl + 'data.json').then(r => r.json()),
      fetch(MAP_TOPO_URL).then(r => r.json())
    ]);

    // Store data (skip _meta key)
    Object.entries(dataRaw).forEach(([k, v]) => {
      if (k !== '_meta') this.DATA[k] = v;
    });

    // Show last-updated
    if (dataRaw._meta?.lastUpdated) {
      const d = new Date(dataRaw._meta.lastUpdated);
      this.$('#lastUpdated').textContent = `Data updated: ${d.toLocaleDateString()}`;
    }

    // Parse map
    const all = topojson.feature(topoRaw, topoRaw.objects.countries);
    this.geoFeatures = all.features.filter(f =>
      EUROPE_NUMERIC.has(String(f.id).padStart(3, '0'))
    );

    this.drawMap();
    this.buildDataTypeButtons();
    this.selectDataType(Object.keys(this.DATA)[0]);

    // Hide loader
    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';
  }

  // ============================================================
  // MAP DRAWING
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
  // BUTTONS
  // ============================================================
  buildDataTypeButtons() {
    const c = this.$('#dtBtns');
    c.innerHTML = '';
    Object.entries(this.DATA).forEach(([k, dt]) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.dataset.key = k;
      b.innerHTML = `<span>${dt.label}</span><span class="badge">${Object.keys(dt.sources).length}</span>`;
      b.onclick = () => this.selectDataType(k);
      c.appendChild(b);
    });
  }

  buildSourceButtons(dtKey) {
    const c = this.$('#srcBtns');
    c.innerHTML = '';
    Object.entries(this.DATA[dtKey].sources).forEach(([k, src]) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.dataset.key = k;
      const count = Object.keys(src.countries).length;
      b.innerHTML = `<span>${src.label}</span><span class="badge">${count} 🌍</span>`;
      b.onclick = () => this.selectSource(k);
      c.appendChild(b);
    });
  }

  selectDataType(k) {
    this.currentDataType = k;
    this.$$('#dtBtns .btn').forEach(b => b.classList.toggle('active', b.dataset.key === k));
    this.buildSourceButtons(k);
    this.selectSource(Object.keys(this.DATA[k].sources)[0]);
  }

  selectSource(k) {
    this.currentSource = k;
    this.$$('#srcBtns .btn').forEach(b => b.classList.toggle('active', b.dataset.key === k));
    this.paint();
  }

  // ============================================================
  // PAINT MAP
  // ============================================================
  paint() {
    const dt = this.DATA[this.currentDataType];
    const src = dt.sources[this.currentSource];
    this.$('#mapTitle').textContent = `${dt.label}`;
    this.$('#mapSub').textContent = `${src.label} · ${src.year} · ${dt.unit}`;

    const vals = Object.values(src.countries).filter(v => v != null);
    if (!vals.length) {
      this.$('#legMin').textContent = '—';
      this.$('#legMax').textContent = '—';
      this.$$('.cp').forEach(p => { p.classList.add('no-data'); p.setAttribute('fill', '#e8e8e8'); });
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
        p.setAttribute('fill', '#e8e8e8');
      }
    });
  }

  // ============================================================
  // TOOLTIP
  // ============================================================
  ttShow(e) {
    const dt = this.DATA[this.currentDataType];
    const src = dt.sources[this.currentSource];
    const code = e.target.dataset.code;
    const val = src.countries[code];
    this.$('#ttName').textContent = e.target.dataset.name;
    this.$('#ttVal').textContent = fmt(val, dt.unit);
    this.$('#ttUnit').textContent = val != null ? dt.unit : '';
    this.$('#ttSrc').textContent = `${src.label} · ${src.year}`;

    // Discrepancy check (future-ready, enabled)
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
  // TEMPLATE
  // ============================================================
  html() {
    return `
<style>
  :host { display:block; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; color:#1a1a2e; }

  .app {
    max-width:1440px; margin:0 auto; padding:20px 24px;
    display:flex; flex-direction:column; gap:16px;
    background:linear-gradient(135deg,#dbeafe 0%,#f3e8ff 40%,#d1fae5 100%);
    min-height:100vh;
    position:relative;
    overflow:hidden;
  }
  /* Decorative blurred blobs behind everything for glass to refract */
  .app::before, .app::after {
    content:''; position:absolute; border-radius:50%; pointer-events:none; z-index:0;
    filter:blur(80px); opacity:0.5;
  }
  .app::before {
    width:500px; height:500px;
    background:radial-gradient(circle,#a78bfa,transparent 70%);
    top:-80px; left:-100px;
  }
  .app::after {
    width:600px; height:600px;
    background:radial-gradient(circle,#34d399,transparent 70%);
    bottom:-120px; right:-150px;
  }

  .header { text-align:center; padding:8px 0 0; position:relative; z-index:1; }
  .header h1 {
    font-size:1.45rem; font-weight:700; margin:0;
    background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .header p { font-size:0.8rem; color:#666; margin:3px 0 0; }

  .main { display:grid; grid-template-columns:1fr 290px; gap:20px; align-items:start; position:relative; z-index:1; }

  /* ===== LIQUID GLASS ===== */
  .glass {
    position:relative;
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.18) 0%,
      rgba(255,255,255,0.06) 100%
    );
    backdrop-filter: blur(24px) saturate(180%) brightness(1.08);
    -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.08);
    border-radius: 24px;
    border: 1.5px solid rgba(255,255,255,0.35);
    box-shadow:
      0 8px 40px rgba(0,0,0,0.06),
      0 1.5px 0 rgba(255,255,255,0.5) inset;
    overflow: hidden;
  }
  /* Specular highlight — bright arc at the top */
  .glass::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:50%;
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.45) 0%,
      rgba(255,255,255,0.08) 40%,
      transparent 100%
    );
    border-radius: 24px 24px 0 0;
    pointer-events:none;
    z-index:1;
  }
  /* Inner refraction glow */
  .glass::after {
    content:'';
    position:absolute; inset:0;
    border-radius:24px;
    box-shadow:
      inset 0 0 30px 4px rgba(120,200,255,0.06),
      inset 0 -2px 12px 0 rgba(255,255,255,0.15);
    pointer-events:none;
    z-index:1;
  }

  .glass > * { position:relative; z-index:2; }

  /* ===== MAP PANEL ===== */
  .map-panel { padding:24px 24px 16px; }

  .title-row { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; }
  .map-title { font-size:1.05rem; font-weight:600; margin:0; }
  .map-sub { font-size:0.75rem; color:#777; margin:2px 0 0; }

  .legend { display:flex; align-items:center; gap:8px; margin:10px 0 6px; font-size:0.7rem; color:#666; }
  .legend-bar {
    flex:1; max-width:220px; height:10px; border-radius:5px;
    background:linear-gradient(90deg,#e0f2f1,#80cbc4,#26a69a,#00796b,#004d40);
    border:1px solid rgba(0,0,0,0.04);
  }

  .map-wrap { width:100%; display:flex; justify-content:center; }
  .map-wrap svg { width:100%; max-width:820px; height:auto; }

  .cp {
    stroke:rgba(255,255,255,0.65); stroke-width:0.4;
    cursor:pointer; transition:fill 0.3s,opacity 0.15s;
    opacity:0.82; paint-order:stroke;
  }
  .cp:hover { opacity:1; stroke:#555; stroke-width:0.8; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.15)); }
  .cp.no-data { fill:#e8e8e8!important; opacity:0.35; cursor:default; }

  /* ===== TOOLTIP (Liquid Glass) ===== */
  .tooltip {
    position:fixed; pointer-events:none; z-index:9999;
    padding:14px 18px;
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.50) 0%,
      rgba(255,255,255,0.20) 100%
    );
    backdrop-filter: blur(32px) saturate(200%) brightness(1.1);
    -webkit-backdrop-filter: blur(32px) saturate(200%) brightness(1.1);
    border: 1.5px solid rgba(255,255,255,0.5);
    border-radius:18px;
    box-shadow:
      0 12px 48px rgba(0,0,0,0.10),
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 4px rgba(0,0,0,0.02);
    opacity:0; transition:opacity 0.12s;
    max-width:280px;
  }
  .tooltip.visible { opacity:1; }
  .tt-name { font-weight:700; font-size:0.9rem; margin-bottom:3px; }
  .tt-val { font-size:1.15rem; font-weight:600; color:#00796b; }
  .tt-unit { font-size:0.7rem; color:#888; margin-left:3px; }
  .tt-src { font-size:0.65rem; color:#aaa; margin-top:5px; }
  .tt-disc {
    display:none; margin-top:6px; padding:3px 10px;
    background:rgba(255,152,0,0.1); border-radius:10px;
    font-size:0.68rem; color:#e65100;
  }

  /* ===== CONTROLS ===== */
  .controls {
    padding:20px;
    display:flex; flex-direction:column; gap:18px;
    position:sticky; top:20px;
    max-height:calc(100vh - 40px); overflow-y:auto;
  }
  .controls::-webkit-scrollbar { width:3px; }
  .controls::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.1); border-radius:3px; }

  .sec-title {
    font-size:0.68rem; text-transform:uppercase; letter-spacing:0.1em;
    color:#999; margin:0 0 8px; font-weight:600;
  }
  .btn-group { display:flex; flex-direction:column; gap:4px; }

  .btn {
    padding:9px 12px; border:1px solid rgba(255,255,255,0.3);
    border-radius:12px;
    background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04));
    backdrop-filter:blur(6px);
    -webkit-backdrop-filter:blur(6px);
    cursor:pointer; font-size:0.76rem; font-weight:500; color:#444;
    transition:all 0.2s; text-align:left;
    display:flex; justify-content:space-between; align-items:center;
    font-family:inherit; line-height:1.3;
  }
  .btn:hover {
    background:rgba(255,255,255,0.35);
    transform:translateX(3px);
    box-shadow:0 3px 12px rgba(0,0,0,0.05);
  }
  .btn.active {
    background:linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.10));
    border-color:rgba(99,102,241,0.3);
    color:#4338ca; font-weight:600;
    box-shadow:0 4px 16px rgba(99,102,241,0.10);
  }
  .badge {
    font-size:0.6rem; color:#bbb; flex-shrink:0;
    background:rgba(0,0,0,0.03); padding:2px 6px; border-radius:6px;
  }
  .btn.active .badge { color:#7c3aed; background:rgba(99,102,241,0.08); }

  .footer { font-size:0.65rem; color:#bbb; text-align:center; padding:4px 0 12px; position:relative; z-index:1; }

  /* Init loader */
  .init-loader {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:120px 0; gap:16px; position:relative; z-index:1;
  }
  .init-loader .orbit { width:40px;height:40px;border:3px solid rgba(99,102,241,0.15);border-top-color:#6366f1;border-radius:50%;animation:spin 0.9s linear infinite; }
  .init-loader span { font-size:0.82rem; color:#888; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .main { transition:opacity 0.4s; }

  @media(max-width:960px) {
    .main { grid-template-columns:1fr; }
    .controls { position:static; max-height:none; flex-direction:row; flex-wrap:wrap; }
    .controls > div { flex:1; min-width:200px; }
  }

  /* Future alert dots */
  .alert-dot {
    display:none; position:absolute; width:8px;height:8px;
    background:#ff5722; border-radius:50%; border:1.5px solid #fff;
    box-shadow:0 0 8px rgba(255,87,34,0.5); animation:pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
</style>

<div class="app">
  <div class="header">
    <h1>Interactive Data Comparison Map</h1>
    <p>Select a data type and source — hover over countries for details</p>
  </div>

  <!-- Loading state -->
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
        <div class="sec-title">📊 Data Type</div>
        <div class="btn-group" id="dtBtns"></div>
      </div>
      <div>
        <div class="sec-title">🏛️ Source</div>
        <div class="btn-group" id="srcBtns"></div>
      </div>
    </div>
  </div>

  <div class="footer" id="lastUpdated">Data auto-updated weekly via Eurostat & World Bank APIs</div>
</div>

<div class="tooltip" id="tt">
  <div class="tt-name" id="ttName">—</div>
  <div><span class="tt-val" id="ttVal">—</span><span class="tt-unit" id="ttUnit"></span></div>
  <div class="tt-src" id="ttSrc"></div>
  <div class="tt-disc" id="ttDisc">⚠️ Sources differ</div>
</div>`;
  }
}

customElements.define('data-comparison-map', DataComparisonMap);
