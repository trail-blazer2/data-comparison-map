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

function animateValue(el, startVal, endVal, unit, duration) {
  duration = duration || 300;
  if (startVal === endVal) { el.textContent = fmt(endVal, unit); return; }
  if (endVal == null || isNaN(endVal)) { el.textContent = fmt(endVal, unit); return; }
  if (startVal == null || isNaN(startVal)) { el.textContent = fmt(endVal, unit); return; }
  var startTime = performance.now();
  function tick(now) {
    var t = Math.min((now - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(startVal + (endVal - startVal) * ease, unit);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(endVal, unit);
  }
  requestAnimationFrame(tick);
}

var IS_DESKTOP = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
    this._lastTtVal = null;
    this._lastTtDataType = null;
    this._vb = { x: -30, y: -5, w: 590, h: 490 };
    this._vbDefault = { x: -30, y: -5, w: 590, h: 490 };
    this._drag = null;
  }

  connectedCallback() {
    // FORCE host element to viewport height — works inside Wix iframe
    var self = this;
    function forceHeight() {
      self.style.display = 'block';
      self.style.width = '100%';
      self.style.height = window.innerHeight + 'px';
    }
    forceHeight();
    window.addEventListener('resize', forceHeight);

    this.shadowRoot.innerHTML = this.html();
    this.init();
  }

  $(s) { return this.shadowRoot.querySelector(s); }
  $$(s) { return this.shadowRoot.querySelectorAll(s); }

  async init() {
    var scripts = document.querySelectorAll('script[src*="data-comparison-map"]');
    var baseUrl = '';
    if (scripts.length) {
      var src = scripts[scripts.length - 1].src;
      baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
    }
    this._baseUrl = baseUrl;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = baseUrl + 'styles.css';
    this.shadowRoot.prepend(link);
    await new Promise(function(resolve) { link.onload = resolve; link.onerror = resolve; });

    var results = await Promise.all([
      loadScript(TOPOJSON_CLIENT_URL),
      fetch(baseUrl + 'data.json').then(function(r) { return r.json(); }),
      fetch(MAP_TOPO_URL).then(function(r) { return r.json(); })
    ]);
    var dataRaw = results[1];
    var topoRaw = results[2];

    var self = this;
    Object.entries(dataRaw).forEach(function(e) {
      if (e[0] !== '_meta') self.DATA[e[0]] = e[1];
    });

    this.categories = {};
    Object.entries(this.DATA).forEach(function(e) {
      var cat = e[1].category || 'other';
      if (!self.categories[cat]) self.categories[cat] = [];
      self.categories[cat].push(e[0]);
    });

    if (dataRaw._meta && dataRaw._meta.lastUpdated) {
      var d = new Date(dataRaw._meta.lastUpdated);
      this.$('#lastUpdated').textContent = 'Data updated: ' + d.toLocaleDateString();
    }

    var logoEl = this.$('#navLogo');
    if (logoEl) logoEl.src = baseUrl + 'logo.png';
    var logoMob = this.$('#navLogoMobile');
    if (logoMob) logoMob.src = baseUrl + 'logo-mobile.png';

    if (IS_DESKTOP) {
      var filterDiv = document.createElement('div');
      filterDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" role="presentation" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence"/><feComponentTransfer in="turbulence" result="mapped"><feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/><feFuncG type="gamma" amplitude="0" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5"/></feComponentTransfer><feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"/><feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lighting-color="white" result="specLight"><fePointLight x="-200" y="-200" z="300"/></feSpecularLighting><feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage"/><feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
      this.shadowRoot.appendChild(filterDiv.firstChild);
    }

    var all = topojson.feature(topoRaw, topoRaw.objects.countries);
    this.geoFeatures = all.features.filter(function(f) {
      return EUROPE_NUMERIC.has(String(f.id).padStart(3, '0'));
    });

    this.drawMap();
    if (IS_DESKTOP) this.initMapPanZoom();
    this.buildCategoryButtons();
    var firstCat = Object.keys(this.categories)[0];
    if (firstCat) this.selectCategory(firstCat);

    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';
  }

  initMapPanZoom() {
    var svg = this.$('#mapSvg');
    var wrap = this.$('.map-wrap');
    var self = this;
    var hint = this.$('#mapHint');
    if (hint) hint.style.display = 'block';
    wrap.classList.add('pannable');

    wrap.addEventListener('wheel', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
      var newW = self._vb.w * factor;
      var newH = self._vb.h * factor;
      if (newW < 120 || newW > 1200) return;
      var rect = svg.getBoundingClientRect();
      var cx = (e.clientX - rect.left) / rect.width;
      var cy = (e.clientY - rect.top) / rect.height;
      self._vb.x += (self._vb.w - newW) * cx;
      self._vb.y += (self._vb.h - newH) * cy;
      self._vb.w = newW;
      self._vb.h = newH;
      self.applyViewBox();
    }, { passive: false });

    wrap.addEventListener('mousedown', function(e) {
      if (e.target.classList && e.target.classList.contains('cp')) return;
      e.preventDefault();
      self._drag = { startX: e.clientX, startY: e.clientY, vb: Object.assign({}, self._vb) };
      wrap.classList.add('dragging');
    });
    window.addEventListener('mousemove', function(e) {
      if (!self._drag) return;
      var rect = svg.getBoundingClientRect();
      self._vb.x = self._drag.vb.x - (e.clientX - self._drag.startX) * (self._vb.w / rect.width);
      self._vb.y = self._drag.vb.y - (e.clientY - self._drag.startY) * (self._vb.h / rect.height);
      self.applyViewBox();
    });
    window.addEventListener('mouseup', function() {
      if (self._drag) { self._drag = null; wrap.classList.remove('dragging'); }
    });
    wrap.addEventListener('dblclick', function(e) {
      e.preventDefault();
      self._vb = Object.assign({}, self._vbDefault);
      self.applyViewBox();
    });
  }

  applyViewBox() {
    this.$('#mapSvg').setAttribute('viewBox',
      this._vb.x.toFixed(1)+' '+this._vb.y.toFixed(1)+' '+
      this._vb.w.toFixed(1)+' '+this._vb.h.toFixed(1));
  }

  drawMap() {
    var svg = this.$('#mapSvg');
    svg.innerHTML = '';
    var lonToX = function(lon) { return (lon + 25) * (540 / 75); };
    var latToY = function(lat) {
      var r = lat * Math.PI / 180;
      var y = Math.log(Math.tan(Math.PI / 4 + r / 2));
      var mn = Math.log(Math.tan(Math.PI / 4 + (34 * Math.PI / 180) / 2));
      var mx = Math.log(Math.tan(Math.PI / 4 + (72 * Math.PI / 180) / 2));
      return 470 - ((y - mn) / (mx - mn)) * 470;
    };
    var proj = function(c) { return [lonToX(c[0]), latToY(c[1])]; };
    var self = this;

    this.geoFeatures.forEach(function(f) {
      var a2 = NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')];
      if (!a2) return;
      self.geoPaths(f.geometry, proj).forEach(function(d) {
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        p.dataset.code = a2;
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
          self.ttShow({ target: p, clientX: touch.clientX, clientY: touch.clientY });
          self.ttMove({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        svg.appendChild(p);
      });
    });
    svg.addEventListener('touchstart', function(e) {
      if (!e.target.classList.contains('cp')) {
        self.$$('.cp.touched').forEach(function(el) { el.classList.remove('touched'); });
        self.ttHide();
      }
    });
  }

  geoPaths(geom, proj) {
    var ring = function(r) {
      return r.map(function(c, i) {
        var p = proj(c);
        return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
      }).join(' ') + 'Z';
    };
    if (geom.type === 'Polygon') return [geom.coordinates.map(ring).join(' ')];
    if (geom.type === 'MultiPolygon') return geom.coordinates.map(function(p) { return p.map(ring).join(' '); });
    return [];
  }

  moveSlider(container, activeBtn) {
    var slider = container.querySelector('.slider');
    if (!slider) { slider = document.createElement('div'); slider.className = 'slider'; container.prepend(slider); }
    if (!activeBtn) { slider.classList.remove('visible'); return; }
    slider.style.top = activeBtn.offsetTop + 'px';
    slider.style.height = activeBtn.offsetHeight + 'px';
    slider.classList.add('visible');
  }

  buildCategoryButtons() {
    var c = this.$('#catBtns');
    c.innerHTML = '';
    var self = this;
    Object.entries(this.categories).forEach(function(e) {
      var catKey = e[0];
      var meta = CATEGORY_META[catKey] || { icon: '', label: catKey };
      var b = document.createElement('button');
      b.className = 'cat-btn';
      b.dataset.key = catKey;
      b.innerHTML = '<span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' + meta.icon + '</svg></span><span class="cat-label">' + meta.label + '</span>';
      b.onclick = function() { self.selectCategory(catKey); };
      c.appendChild(b);
    });
  }

  selectCategory(catKey) {
    this.currentCategory = catKey;
    this.$$('.cat-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.key === catKey); });
    this.buildDataTypeButtons(catKey);
    this._lastTtVal = null;
    this._lastTtDataType = null;
    var keys = this.categories[catKey];
    if (keys && keys[0]) this.selectDataType(keys[0]);
  }

  buildDataTypeButtons(catKey) {
    var c = this.$('#dtBtns');
    c.innerHTML = '';
    var slider = document.createElement('div');
    slider.className = 'slider';
    c.appendChild(slider);
    var keys = this.categories[catKey] || [];
    var self = this;
    keys.forEach(function(key) {
      var dt = self.DATA[key];
      if (!dt) return;
      var b = document.createElement('button');
      b.className = 'btn';
      b.dataset.key = key;
      var srcCount = Object.keys(dt.sources).length;
      var okCount = Object.values(dt.sources).filter(function(s) { return Object.keys(s.countries).length > 0; }).length;
      b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + dt.label + '</span></span><span class="badge">' + okCount + '/' + srcCount + '</span>';
      b.onclick = function() { self.selectDataType(key); };
      c.appendChild(b);
    });
  }

  buildSourceButtons(dtKey) {
    var c = this.$('#srcBtns');
    c.innerHTML = '';
    var slider = document.createElement('div');
    slider.className = 'slider';
    c.appendChild(slider);
    var dt = this.DATA[dtKey];
    if (!dt) return;
    var self = this;
    Object.entries(dt.sources).forEach(function(e) {
      var key = e[0], src = e[1];
      var count = Object.keys(src.countries).length;
      var isEmpty = count === 0;
      var b = document.createElement('button');
      b.className = 'btn' + (isEmpty ? ' disabled' : '');
      b.dataset.key = key;
      if (isEmpty) {
        b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + src.label + '</span></span><span class="badge badge-empty">No data</span>';
      } else {
        b.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><span class="btn-dot"></span><span>' + src.label + '</span></span><span class="badge">' + count + ' · ' + src.year + '</span>';
        b.onclick = function() { self.selectSource(key); };
      }
      c.appendChild(b);
    });
  }

  selectDataType(k) {
    this.currentDataType = k;
    this.$$('#dtBtns .btn').forEach(function(b) { b.classList.toggle('active', b.dataset.key === k); });
    var dtContainer = this.$('#dtBtns');
    var activeBtn = dtContainer.querySelector('.btn[data-key="' + k + '"]');
    var self = this;
    requestAnimationFrame(function() { requestAnimationFrame(function() { self.moveSlider(dtContainer, activeBtn); }); });
    this._lastTtVal = null;
    this._lastTtDataType = k;
    this.buildSourceButtons(k);
    var dt = this.DATA[k];
    if (!dt) return;
    var firstOk = Object.entries(dt.sources).find(function(e) { return Object.keys(e[1].countries).length > 0; });
    if (firstOk) { this.selectSource(firstOk[0]); }
    else {
      this.currentSource = null;
      this.$('#mapTitle').textContent = dt.label;
      this.$('#mapSub').textContent = 'No data available for any source';
      this.$('#legMin').textContent = '\u2014';
      this.$('#legMax').textContent = '\u2014';
      this.$$('.cp').forEach(function(p) { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
    }
  }

  selectSource(k) {
    this.currentSource = k;
    this.$$('#srcBtns .btn').forEach(function(b) {
      if (!b.classList.contains('disabled')) b.classList.toggle('active', b.dataset.key === k);
    });
    var srcContainer = this.$('#srcBtns');
    var activeBtn = srcContainer.querySelector('.btn.active');
    var self = this;
    requestAnimationFrame(function() { requestAnimationFrame(function() { self.moveSlider(srcContainer, activeBtn); }); });
    this.paint();
  }

  paint() {
    var dt = this.DATA[this.currentDataType];
    if (!dt) return;
    var src = dt.sources[this.currentSource];
    if (!src) return;
    this.$('#mapTitle').textContent = dt.label;
    this.$('#mapSub').textContent = src.label + ' \u00B7 ' + src.year + ' \u00B7 ' + dt.unit;
    var vals = Object.values(src.countries).filter(function(v) { return v != null; });
    if (!vals.length) {
      this.$('#legMin').textContent = '\u2014';
      this.$('#legMax').textContent = '\u2014';
      this.$$('.cp').forEach(function(p) { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); });
      return;
    }
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    this.$('#legMin').textContent = fmt(min, dt.unit);
    this.$('#legMax').textContent = fmt(max, dt.unit);
    this.$$('.cp').forEach(function(p) {
      var v = src.countries[p.dataset.code];
      if (v != null) { p.classList.remove('no-data'); p.setAttribute('fill', getColor(max !== min ? (v - min) / (max - min) : 0.5)); }
      else { p.classList.add('no-data'); p.setAttribute('fill', '#dfe6e9'); }
    });
  }

  ttShow(e) {
    var dt = this.DATA[this.currentDataType];
    if (!dt || !this.currentSource) return;
    var src = dt.sources[this.currentSource];
    if (!src) return;
    var code = e.target.dataset.code;
    var newVal = (src.countries && src.countries[code] != null) ? src.countries[code] : null;
    this.$('#ttName').textContent = e.target.dataset.name;
    this.$('#ttUnit').textContent = newVal != null ? dt.unit : '';
    this.$('#ttSrc').textContent = (src.label || '\u2014') + ' \u00B7 ' + (src.year || '\u2014');
    var valEl = this.$('#ttVal');
    if (this._lastTtDataType === this.currentDataType && newVal != null && this._lastTtVal != null && !isNaN(this._lastTtVal) && !isNaN(newVal)) {
      animateValue(valEl, this._lastTtVal, newVal, dt.unit, 300);
    } else { valEl.textContent = fmt(newVal, dt.unit); }
    this._lastTtVal = newVal;
    this._lastTtDataType = this.currentDataType;
    this.$('#ttDisc').style.display = 'none';
    var marker = this.$('#legMarker');
    if (newVal != null) {
      var vs = Object.values(src.countries).filter(function(v) { return v != null; });
      var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
      marker.style.left = (mx !== mn ? ((newVal - mn) / (mx - mn)) * 100 : 50) + '%';
      marker.classList.add('visible');
    } else { marker.classList.remove('visible'); }
    this.$('#tt').classList.add('visible');
  }

  ttMove(e) { var tt = this.$('#tt'); tt.style.left = (e.clientX + 18) + 'px'; tt.style.top = (e.clientY - 12) + 'px'; }
  ttHide() { this.$('#tt').classList.remove('visible'); this.$('#legMarker').classList.remove('visible'); }

  html() {
    return `<div class="app">
  <nav class="top-nav">
    <div class="nav-logo"><div class="nav-logo-icon">
      <img id="navLogo" class="logo-desktop" src="" alt="Logo" />
      <img id="navLogoMobile" class="logo-mobile" src="" alt="Logo" />
    </div></div>
    <div class="nav-links">
      <button class="nav-link">About</button>
      <button class="nav-link primary">Support us</button>
    </div>
  </nav>
  <div id="initLoader" class="init-loader"><div class="orbit"></div><span>Loading map & data\u2026</span></div>
  <div class="main" id="mainContent" style="opacity:0">
    <div class="map-panel">
      <div class="title-row"><div>
        <div class="map-title" id="mapTitle">\u2014</div>
        <div class="map-sub" id="mapSub">\u2014</div>
      </div></div>
      <div class="legend">
        <span id="legMin">\u2014</span>
        <div class="legend-bar"><div class="legend-marker" id="legMarker"></div></div>
        <span id="legMax">\u2014</span>
      </div>
      <div class="map-wrap">
        <svg id="mapSvg" viewBox="-30 -5 590 490" preserveAspectRatio="xMidYMid meet"></svg>
      </div>
      <div class="map-hint" id="mapHint">Scroll to zoom \u00B7 Drag to pan \u00B7 Double-click to reset</div>
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
