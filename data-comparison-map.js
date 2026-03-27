// ============================================================
// DATA COMPARISON MAP — Wix Custom Element
// Styles in styles.css · Data in data.json
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

const NEARBY_NUMERIC = new Set([
  '012','788','434','818','504','729','148','562','466',
  '792','268','051','031','364','368','400','760','422',
  '682','887','512','634',
  '643',
  '398','795','860','417','762',
]);

const LON_MIN = -35;
const LON_MAX = 90;  // ← CHANGED from 70 — geometry extends further east so the mask can fade it smoothly
const NEARBY_CLIP_BOX = { x: -200, y: -150, w: 1100, h: 900 };

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
// GEOGRAPHIC CLIPPING
// ============================================================

function clipRingToLonRange(ring, lonMin, lonMax) {
  const edges = [
    { inside: p => p[0] >= lonMin, intersect: (a, b) => { const t = (lonMin - a[0]) / (b[0] - a[0]); return [lonMin, a[1] + t * (b[1] - a[1])]; } },
    { inside: p => p[0] <= lonMax, intersect: (a, b) => { const t = (lonMax - a[0]) / (b[0] - a[0]); return [lonMax, a[1] + t * (b[1] - a[1])]; } }
  ];
  let pts = ring.slice();
  for (let e = 0; e < edges.length; e++) {
    const { inside, intersect } = edges[e];
    const input = pts; pts = [];
    if (input.length === 0) return [];
    let prev = input[input.length - 1];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      if (inside(cur)) {
        if (!inside(prev)) pts.push(intersect(prev, cur));
        pts.push(cur);
      } else if (inside(prev)) { pts.push(intersect(prev, cur)); }
      prev = cur;
    }
  }
  return pts;
}

function splitRingAtAntimeridian(ring) {
  if (ring.length < 2) return [ring];
  const segments = []; let current = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 90) {
      if (current.length >= 3) segments.push(current);
      current = [ring[i]];
    } else { current.push(ring[i]); }
  }
  if (current.length >= 3) segments.push(current);
  return segments;
}

function clipRingToBox(ring, box) {
  const minX = box.x, minY = box.y, maxX = box.x + box.w, maxY = box.y + box.h;
  const edges = [
    (p) => p[0] >= minX, (a, b) => { const t = (minX - a[0]) / (b[0] - a[0]); return [minX, a[1] + t * (b[1] - a[1])]; },
    (p) => p[0] <= maxX, (a, b) => { const t = (maxX - a[0]) / (b[0] - a[0]); return [maxX, a[1] + t * (b[1] - a[1])]; },
    (p) => p[1] >= minY, (a, b) => { const t = (minY - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), minY]; },
    (p) => p[1] <= maxY, (a, b) => { const t = (maxY - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), maxY]; },
  ];
  let pts = ring.slice();
  for (let e = 0; e < edges.length; e += 2) {
    const inside = edges[e], intersect = edges[e + 1];
    const input = pts; pts = [];
    if (input.length === 0) return [];
    let prev = input[input.length - 1];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      if (inside(cur)) {
        if (!inside(prev)) pts.push(intersect(prev, cur));
        pts.push(cur);
      } else if (inside(prev)) { pts.push(intersect(prev, cur)); }
      prev = cur;
    }
  }
  return pts;
}

function clipAndProjectNearbyGeometry(geom, proj) {
  const MAX_RING_WIDTH = 500; // ← slightly wider to allow more of Russia's European portion
  function processRing(ring) {
    const segments = splitRingAtAntimeridian(ring);
    const results = [];
    for (const seg of segments) {
      const lonClipped = clipRingToLonRange(seg, LON_MIN, LON_MAX);
      if (lonClipped.length < 3) continue;
      const projected = lonClipped.map(c => proj(c));
      let minPX = Infinity, maxPX = -Infinity;
      for (const p of projected) { if (p[0] < minPX) minPX = p[0]; if (p[0] > maxPX) maxPX = p[0]; }
      if ((maxPX - minPX) > MAX_RING_WIDTH) continue;
      const svgClipped = clipRingToBox(projected, NEARBY_CLIP_BOX);
      if (svgClipped.length < 3) continue;
      results.push(svgClipped);
    }
    return results;
  }
  function ringsToPath(clippedRings) {
    return clippedRings.map(ring =>
      ring.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'
    ).join(' ');
  }
  if (geom.type === 'Polygon') {
    const allRings = [];
    for (const ring of geom.coordinates) allRings.push(...processRing(ring));
    const d = ringsToPath(allRings); return d ? [d] : [];
  }
  if (geom.type === 'MultiPolygon') {
    const paths = [];
    for (const poly of geom.coordinates) {
      const allRings = [];
      for (const ring of poly) allRings.push(...processRing(ring));
      const d = ringsToPath(allRings); if (d) paths.push(d);
    }
    return paths;
  }
  return [];
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
    this.geoFeatures = [];
    this.nearbyFeatures = [];
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

    const [, dataRaw, topoRaw] = await Promise.all([
      loadScript(TOPOJSON_CLIENT_URL),
      fetch(baseUrl + 'data.json').then(r => r.json()),
      fetch(MAP_TOPO_URL).then(r => r.json())
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

    // ← CHANGED: Support Us button → postMessage to Wix parent
    const supportBtn = this.$('#supportBtn');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => {
        window.parent.postMessage(
          { action: 'openLightbox', lightboxName: 'Support Us' },
          '*'
        );
      });
    }

    if (this._isDesktop) {
      const filterDiv = document.createElement('div');
      filterDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" role="presentation" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence"/><feComponentTransfer in="turbulence" result="mapped"><feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/><feFuncG type="gamma" amplitude="0" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5"/></feComponentTransfer><feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"/><feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lighting-color="white" result="specLight"><fePointLight x="-200" y="-200" z="300"/></feSpecularLighting><feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage"/><feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
      this.shadowRoot.appendChild(filterDiv.firstChild);
    }

    const all = topojson.feature(topoRaw, topoRaw.objects.countries);
    this.geoFeatures = all.features.filter(f => EUROPE_NUMERIC.has(String(f.id).padStart(3, '0')));
    this.nearbyFeatures = all.features.filter(f => NEARBY_NUMERIC.has(String(f.id).padStart(3, '0')));

    this.drawMap();
    this.buildCategoryButtons();
    const firstCat = Object.keys(this.categories)[0];
    if (firstCat) this.selectCategory(firstCat);
    if (this._isDesktop) this.initZoomPan();

    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';
  }

  _lonToX(lon) { return (lon + 25) * (540 / 75); }
  _latToY(lat) {
    const r = lat * Math.PI / 180;
    const y = Math.log(Math.tan(Math.PI / 4 + r / 2));
    const mn = Math.log(Math.tan(Math.PI / 4 + (34 * Math.PI / 180) / 2));
    const mx = Math.log(Math.tan(Math.PI / 4 + (72 * Math.PI / 180) / 2));
    return 470 - ((y - mn) / (mx - mn)) * 470;
  }
  _proj(c) { return [this._lonToX(c[0]), this._latToY(c[1])]; }

  drawMap() {
    const svg = this.$('#mapSvg');
    svg.innerHTML = '';
    const proj = c => this._proj(c);
    const self = this;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Fade mask: the key insight is that every edge must fade from fully opaque
    // to fully transparent BEFORE the geometry ends. So we use a radial approach:
    // a large white ellipse in the center that gradually fades to black at the edges.
    // This guarantees a single smooth fade with no hard edges anywhere.
    defs.innerHTML = `
      <pattern id="comingSoonPattern" patternUnits="userSpaceOnUse" width="180" height="100" patternTransform="rotate(-30)">
        <text x="10" y="55" font-family="'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="700" fill="rgba(30,58,95,0.13)" letter-spacing="3">COMING SOON</text>
      </pattern>
      <radialGradient id="fadeRadial" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0.45" stop-color="white"/>
        <stop offset="0.85" stop-color="white" stop-opacity="0.5"/>
        <stop offset="1.0" stop-color="black"/>
      </radialGradient>
      <mask id="nearbyFade" maskUnits="userSpaceOnUse" x="-300" y="-250" width="1300" height="1100">
        <ellipse cx="265" cy="235" rx="500" ry="400" fill="url(#fadeRadial)"/>
      </mask>
    `;
    svg.appendChild(defs);

    // -- Nearby countries with soft radial fade mask --
    const nearbyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nearbyGroup.setAttribute('class', 'nearby-group');
    nearbyGroup.setAttribute('mask', 'url(#nearbyFade)');
    this.nearbyFeatures.forEach(f => {
      const clippedPaths = clipAndProjectNearbyGeometry(f.geometry, proj);
      clippedPaths.forEach(d => {
        const pBase = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pBase.setAttribute('d', d); pBase.classList.add('cp-nearby');
        nearbyGroup.appendChild(pBase);
        const pPattern = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pPattern.setAttribute('d', d); pPattern.classList.add('cp-nearby-pattern');
        nearbyGroup.appendChild(pPattern);
      });
    });
    svg.appendChild(nearbyGroup);

    // -- European countries on top (no mask) --
    const euroGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    euroGroup.setAttribute('class', 'euro-group');
    this.geoFeatures.forEach(f => {
      const a2 = NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')];
      if (!a2) return;
      this.geoPaths(f.geometry, proj).forEach(d => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d); p.dataset.code = a2;
        p.dataset.name = ALPHA2_TO_NAME[a2] || a2;
        p.classList.add('cp', 'no-data');
        p.addEventListener('mouseenter', function(e) { self.ttShow(e); });
        p.addEventListener('mousemove', function(e) { self.ttMove(e); });
        p.addEventListener('mouseleave', function() { self.ttHide(); });
        p.addEventListener('touchstart', function(e) {
          e.preventDefault();
          self.$$('.cp.touched').forEach(function(el) { el.classList.remove('touched'); });
          p.classList.add('touched');
          var touch = e.touches[0];
          var fakeEvent = { target: p, clientX: touch.clientX, clientY: touch.clientY };
          self.ttShow(fakeEvent); self.ttMove(fakeEvent);
        }, { passive: false });
        euroGroup.appendChild(p);
      });
    });
    svg.appendChild(euroGroup);

    svg.addEventListener('touchstart', function(e) {
      if (!e.target.classList.contains('cp')) {
        self.$$('.cp.touched').forEach(function(el) { el.classList.remove('touched'); });
        self.ttHide();
      }
    });
  }

  initZoomPan() {
    const svg = this.$('#mapSvg');
    const wrap = this.$('.map-wrap');
    if (!svg || !wrap) return;
    this._origVB = { x: -30, y: -5, w: 590, h: 490 };
    this._contentBBox = { x: -80, y: -60, w: 750, h: 620 };
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
  _clampAndApply() { this._clampPan(); this._applyTransform(); }
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
      else { this._zoom = targetZoom; this._panX = targetPanX; this._panY = targetPanY; this._applyTransform(); this._animFrame = null; }
    };
    this._animFrame = requestAnimationFrame(tick);
  }

  geoPaths(geom, proj) {
    const ring = r => r.map((c, i) => { const [x, y] = proj(c); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + 'Z';
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
  checkDiscrepancy(code) { this.$('#ttDisc').style.display = 'none'; }

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
      <button class="nav-link" onclick="window.parent.postMessage('go-to-landing', '*');">About</button>
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
      <div class="map-wrap"><svg id="mapSvg" viewBox="-30 -5 590 490" preserveAspectRatio="xMidYMid meet"></svg></div>
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
