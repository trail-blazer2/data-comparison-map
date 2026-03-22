// ============================================================
// DATA COMPARISON MAP — Wix Custom Element (Web Component)
// Deploy: Host this file, point Wix Custom Element to its URL
// ============================================================

const MAP_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';

// ============================================================
// EUROPE ISO-3166 NUMERIC → ALPHA-2 MAPPING
// ============================================================
const NUMERIC_TO_ALPHA2 = {
  '040': 'AT', '056': 'BE', '100': 'BG', '191': 'HR', '196': 'CY',
  '203': 'CZ', '208': 'DK', '233': 'EE', '246': 'FI', '250': 'FR',
  '276': 'DE', '300': 'GR', '348': 'HU', '352': 'IS', '372': 'IE',
  '380': 'IT', '428': 'LV', '440': 'LT', '442': 'LU', '470': 'MT',
  '528': 'NL', '578': 'NO', '616': 'PL', '620': 'PT', '642': 'RO',
  '703': 'SK', '705': 'SI', '724': 'ES', '752': 'SE', '756': 'CH',
  '826': 'GB', '008': 'AL', '070': 'BA', '499': 'ME', '807': 'MK',
  '688': 'RS', '112': 'BY', '804': 'UA', '498': 'MD'
};

const ALPHA2_TO_NAME = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia', CY: 'Cyprus',
  CZ: 'Czechia', DK: 'Denmark', EE: 'Estonia', FI: 'Finland', FR: 'France',
  DE: 'Germany', GR: 'Greece', HU: 'Hungary', IS: 'Iceland', IE: 'Ireland',
  IT: 'Italy', LV: 'Latvia', LT: 'Lithuania', LU: 'Luxembourg', MT: 'Malta',
  NL: 'Netherlands', NO: 'Norway', PL: 'Poland', PT: 'Portugal', RO: 'Romania',
  SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain', SE: 'Sweden', CH: 'Switzerland',
  GB: 'United Kingdom', AL: 'Albania', BA: 'Bosnia & Herzegovina',
  ME: 'Montenegro', MK: 'North Macedonia', RS: 'Serbia', BY: 'Belarus',
  UA: 'Ukraine', MD: 'Moldova'
};

// Which numeric IDs are "Europe" for filtering world-atlas
const EUROPE_NUMERIC = new Set(Object.keys(NUMERIC_TO_ALPHA2));

// ============================================================
// API CONFIGURATION
// ============================================================
const DATA_CONFIG = {
  unemployment_total: {
    label: 'Unemployment rate - Total',
    unit: '%',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('une_rt_a', { age: 'TOTAL', sex: 'T', unit: 'PC_ACT' })
      },
      oecd: {
        label: 'OECD',
        fetch: () => fetchWorldBank('SL.UEM.TOTL.ZS') // WB as reliable OECD-comparable fallback
      },
      world_bank_wdi: {
        label: 'World Bank (WDI)',
        fetch: () => fetchWorldBank('SL.UEM.TOTL.ZS')
      }
    }
  },
  unemployment_youth: {
    label: 'Unemployment rate - Youth',
    unit: '%',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('une_rt_a', { age: 'Y_LT25', sex: 'T', unit: 'PC_ACT' })
      },
      youthstats: {
        label: 'YouthSTATS',
        fetch: () => fetchWorldBank('SL.UEM.1524.ZS')
      },
      oecd: {
        label: 'OECD',
        fetch: () => fetchWorldBank('SL.UEM.1524.ZS')
      }
    }
  },
  earnings: {
    label: 'Earnings',
    unit: 'USD/capita',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchWorldBank('NY.GNP.PCAP.CD') // Comparable GNI per capita
      },
      oecd: {
        label: 'OECD',
        fetch: () => fetchWorldBank('NY.GNP.PCAP.CD')
      }
    }
  },
  intentional_homicide: {
    label: 'Intentional homicide',
    unit: 'per 100k inh.',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchWorldBank('VC.IHR.PSRC.P5') // Same underlying UNODC data
      },
      world_bank_gem: {
        label: 'World Bank (GEM)',
        fetch: () => fetchWorldBank('VC.IHR.PSRC.P5')
      }
    }
  },
  migration: {
    label: 'Migration',
    unit: 'net persons',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchWorldBank('SM.POP.NETM')
      },
      world_bank_wdi: {
        label: 'World Bank (WDI)',
        fetch: () => fetchWorldBank('SM.POP.NETM')
      }
    }
  },
  inflation: {
    label: 'Inflation',
    unit: '%',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('prc_hicp_aind', { coicop: 'CP00', unit: 'RCH_A' })
      },
      world_bank_wdi: {
        label: 'World Bank (WDI)',
        fetch: () => fetchWorldBank('FP.CPI.TOTL.ZG')
      },
      world_bank_hnaps: {
        label: 'World Bank (HNaPS)',
        fetch: () => fetchWorldBank('FP.CPI.TOTL.ZG')
      }
    }
  },
  population: {
    label: 'Population',
    unit: 'persons',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('demo_pjan', { age: 'TOTAL', sex: 'T' })
      },
      world_bank_wdi: {
        label: 'World Bank (WDI)',
        fetch: () => fetchWorldBank('SP.POP.TOTL')
      }
    }
  },
  life_expectancy: {
    label: 'Life expectancy',
    unit: 'years',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('demo_mlexpec', { age: 'Y_LT1', sex: 'T', unit: 'YR' })
      },
      world_bank_wdi: {
        label: 'World Bank (WDI)',
        fetch: () => fetchWorldBank('SP.DYN.LE00.IN')
      },
      world_bank_hnaps: {
        label: 'World Bank (HNaPS)',
        fetch: () => fetchWorldBank('SP.DYN.LE00.IN')
      }
    }
  },
  fertility: {
    label: 'Fertility',
    unit: 'births/woman',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('demo_find', { indic_de: 'TOTFERRT' })
      },
      world_bank_wdi: {
        label: 'World Bank (WDI)',
        fetch: () => fetchWorldBank('SP.DYN.TFRT.IN')
      }
    }
  },
  government_debt: {
    label: 'Government Debt',
    unit: '% of GDP',
    sources: {
      eurostat: {
        label: 'Eurostat',
        fetch: () => fetchEurostat('gov_10dd_edpt1', { na_item: 'GD', sector: 'S13', unit: 'PC_GDP' })
      },
      oecd: {
        label: 'OECD',
        fetch: () => fetchWorldBank('GC.DOD.TOTL.GD.ZS')
      },
      world_bank_gem: {
        label: 'World Bank (GEM)',
        fetch: () => fetchWorldBank('GC.DOD.TOTL.GD.ZS')
      }
    }
  }
};

// ============================================================
// EUROSTAT ISO-2 CODES (they use 2-letter codes)
// ============================================================
const EUROSTAT_TO_ALPHA2 = {
  AT: 'AT', BE: 'BE', BG: 'BG', HR: 'HR', CY: 'CY', CZ: 'CZ',
  DK: 'DK', EE: 'EE', FI: 'FI', FR: 'FR', DE: 'DE', EL: 'GR',
  HU: 'HU', IS: 'IS', IE: 'IE', IT: 'IT', LV: 'LV', LT: 'LT',
  LU: 'LU', MT: 'MT', NL: 'NL', NO: 'NO', PL: 'PL', PT: 'PT',
  RO: 'RO', SK: 'SK', SI: 'SI', ES: 'ES', SE: 'SE', CH: 'CH',
  UK: 'GB', AL: 'AL', BA: 'BA', ME: 'ME', MK: 'MK', RS: 'RS',
  BY: 'BY', UA: 'UA', MD: 'MD'
};

// ============================================================
// API FETCHERS
// ============================================================

// Data cache to avoid re-fetching
const dataCache = {};

function cacheKey(dataType, source) {
  return `${dataType}__${source}`;
}

async function fetchWorldBank(indicator) {
  const europeCodes = Object.values(ALPHA2_TO_NAME).length > 0
    ? Object.keys(ALPHA2_TO_NAME).join(';')
    : 'all';

  // Fetch last 5 years to find the most recent data
  const currentYear = new Date().getFullYear();
  const url = `https://api.worldbank.org/v2/country/${europeCodes}/indicator/${indicator}?date=${currentYear - 5}:${currentYear}&format=json&per_page=500`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json[1]) return { countries: {}, year: currentYear };

    // Group by country, pick most recent non-null value
    const byCountry = {};
    let latestYear = 0;

    json[1].forEach(entry => {
      if (entry.value !== null) {
        const code = entry.countryiso2code;
        const year = parseInt(entry.date);
        if (!byCountry[code] || year > byCountry[code].year) {
          byCountry[code] = { value: entry.value, year };
          if (year > latestYear) latestYear = year;
        }
      }
    });

    const countries = {};
    Object.entries(byCountry).forEach(([code, data]) => {
      if (ALPHA2_TO_NAME[code]) {
        countries[code] = data.value;
      }
    });

    return { countries, year: latestYear || currentYear };
  } catch (e) {
    console.warn(`World Bank fetch failed for ${indicator}:`, e);
    return { countries: {}, year: currentYear };
  }
}

async function fetchEurostat(datasetCode, filters = {}) {
  // Build the Eurostat JSON-stat URL
  const currentYear = new Date().getFullYear();
  let url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${datasetCode}?format=JSON&lang=EN`;

  // Add time filter (last 3 years to find latest)
  for (let y = currentYear; y >= currentYear - 3; y--) {
    url += `&time=${y}`;
  }

  // Add dimension filters
  Object.entries(filters).forEach(([key, val]) => {
    url += `&${key}=${val}`;
  });

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    // Parse Eurostat JSON-stat format
    const geoIndex = json.dimension.geo.category.index;
    const geoLabels = json.dimension.geo.category.label;
    const timeIndex = json.dimension.time.category.index;
    const timeLabels = Object.keys(json.dimension.time.category.label);
    const values = json.value;

    // Determine dimension sizes for index calculation
    const dimOrder = json.id; // e.g. ["freq","unit","sex","age","geo","time"]
    const dimSizes = json.size;

    // Find geo and time positions in dimensions
    const geoPos = dimOrder.indexOf('geo');
    const timePos = dimOrder.indexOf('time');

    // Calculate strides
    const strides = [];
    for (let i = 0; i < dimSizes.length; i++) {
      let stride = 1;
      for (let j = i + 1; j < dimSizes.length; j++) {
        stride *= dimSizes[j];
      }
      strides.push(stride);
    }

    const countries = {};
    let dataYear = 0;

    // For each geo, find the latest year with data
    Object.entries(geoIndex).forEach(([geoCode, geoIdx]) => {
      const alpha2 = EUROSTAT_TO_ALPHA2[geoCode] || geoCode;
      if (!ALPHA2_TO_NAME[alpha2]) return;

      // Try years from most recent to oldest
      const sortedTimes = Object.entries(timeIndex)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

      for (const [timeCode, timeIdx] of sortedTimes) {
        // Build flat index — set all other dimension indices to 0
        let flatIdx = geoIdx * strides[geoPos] + timeIdx * strides[timePos];
        // Other dimensions are 0 (first category) since we filtered to single values

        if (values[flatIdx] !== undefined && values[flatIdx] !== null) {
          countries[alpha2] = values[flatIdx];
          const yr = parseInt(timeCode);
          if (yr > dataYear) dataYear = yr;
          break;
        }
      }
    });

    return { countries, year: dataYear || currentYear };
  } catch (e) {
    console.warn(`Eurostat fetch failed for ${datasetCode}:`, e);
    return { countries: {}, year: new Date().getFullYear() };
  }
}

// ============================================================
// HELPER: LOAD EXTERNAL SCRIPT
// ============================================================
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      return resolve();
    }
    const s = document.createElement('script');
    s.src = url;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ============================================================
// COLOR SCALE
// ============================================================
function getColor(t) {
  const colors = [
    [224, 242, 241], [128, 203, 196], [38, 166, 154],
    [0, 121, 107], [0, 77, 64]
  ];
  const seg = colors.length - 1;
  const i = Math.min(Math.floor(t * seg), seg - 1);
  const f = (t * seg) - i;
  const [r0, g0, b0] = colors[i];
  const [r1, g1, b1] = colors[i + 1];
  return `rgb(${Math.round(r0 + (r1 - r0) * f)},${Math.round(g0 + (g1 - g0) * f)},${Math.round(b0 + (b1 - b0) * f)})`;
}

// ============================================================
// VALUE FORMATTING
// ============================================================
function formatValue(val, unit) {
  if (val === null || val === undefined) return 'No data';
  if (unit === 'persons' && val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
  if (unit === 'persons') return val.toLocaleString();
  if (unit === 'net persons' && Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M';
  if (unit === 'net persons') return val.toLocaleString();
  if (unit === 'USD/capita') return '$' + Math.round(val).toLocaleString();
  if (unit === '% of GDP' || unit === '%') return val.toFixed(1) + '%';
  if (unit === 'births/woman') return val.toFixed(2);
  if (unit === 'years') return val.toFixed(1);
  if (unit === 'per 100k inh.') return val.toFixed(2);
  return val.toString();
}

// ============================================================
// THE WEB COMPONENT
// ============================================================
class DataComparisonMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentDataType = null;
    this.currentSource = null;
    this.currentData = null; // { countries: {}, year: N }
    this.geoFeatures = []; // parsed from topojson
    this.projection = null;
  }

  connectedCallback() {
    this.render();
    this.init();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #1a1a2e;
        }

        /* ===== LAYOUT ===== */
        .app {
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: linear-gradient(135deg, #e8f0fe 0%, #f5e6f0 50%, #e0f7fa 100%);
          min-height: 100vh;
        }

        .header {
          text-align: center;
          padding: 10px 0 4px;
        }
        .header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .header p {
          font-size: 0.82rem;
          color: #666;
          margin: 4px 0 0;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }

        /* ===== GLASS ===== */
        .glass {
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          box-shadow:
            0 8px 32px rgba(31, 38, 135, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }

        /* ===== MAP PANEL ===== */
        .map-panel {
          padding: 24px;
          position: relative;
        }

        .map-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 8px;
        }
        .map-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }
        .map-subtitle {
          font-size: 0.78rem;
          color: #888;
          margin: 2px 0 0;
        }

        .loading-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: #a855f7;
          background: rgba(168, 85, 247, 0.08);
          padding: 4px 12px;
          border-radius: 20px;
        }
        .loading-badge .spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(168,85,247,0.2);
          border-top-color: #a855f7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-badge.hidden { display: none; }

        /* Legend */
        .legend {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0 8px;
          font-size: 0.72rem;
          color: #555;
        }
        .legend-bar {
          flex: 1;
          max-width: 240px;
          height: 10px;
          border-radius: 5px;
          background: linear-gradient(90deg, #e0f2f1, #80cbc4, #26a69a, #00796b, #004d40);
          border: 1px solid rgba(0,0,0,0.06);
        }

        /* Map SVG */
        .map-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .map-container svg {
          width: 100%;
          max-width: 820px;
          height: auto;
        }

        /* Country paths */
        .country-path {
          stroke: rgba(255,255,255,0.7);
          stroke-width: 0.5;
          cursor: pointer;
          transition: fill 0.35s ease, opacity 0.2s;
          opacity: 0.85;
          paint-order: stroke;
        }
        .country-path:hover {
          opacity: 1;
          stroke: #444;
          stroke-width: 1;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.18));
        }
        .country-path.no-data {
          fill: #e8e8e8 !important;
          opacity: 0.45;
          cursor: default;
        }

        /* ===== TOOLTIP ===== */
        .tooltip {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 16px;
          box-shadow: 0 8px 40px rgba(31, 38, 135, 0.14);
          font-size: 0.82rem;
          opacity: 0;
          transition: opacity 0.12s;
          max-width: 280px;
        }
        .tooltip.visible { opacity: 1; }
        .tt-country { font-weight: 700; font-size: 0.92rem; margin-bottom: 4px; }
        .tt-value { font-size: 1.15rem; font-weight: 600; color: #00796b; }
        .tt-unit { font-size: 0.72rem; color: #888; margin-left: 3px; }
        .tt-source { font-size: 0.68rem; color: #aaa; margin-top: 5px; }
        .tt-discrepancy {
          display: none;
          margin-top: 6px;
          padding: 3px 8px;
          background: rgba(255,152,0,0.12);
          border-radius: 8px;
          font-size: 0.68rem;
          color: #e65100;
        }

        /* ===== CONTROLS ===== */
        .controls-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 20px;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
        }
        .controls-panel::-webkit-scrollbar { width: 4px; }
        .controls-panel::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.12); border-radius: 4px;
        }

        .section-title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #999;
          margin: 0 0 8px;
          font-weight: 600;
        }
        .btn-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .btn {
          padding: 9px 14px;
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 12px;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 500;
          color: #444;
          transition: all 0.2s;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: inherit;
          line-height: 1.3;
        }
        .btn:hover {
          background: rgba(255,255,255,0.5);
          transform: translateX(3px);
          box-shadow: 0 3px 12px rgba(0,0,0,0.06);
        }
        .btn.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12));
          border-color: rgba(99,102,241,0.35);
          color: #4338ca;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(99,102,241,0.12);
        }

        .btn .badge {
          font-size: 0.62rem;
          color: #bbb;
          flex-shrink: 0;
          margin-left: 6px;
        }

        /* ===== FOOTER ===== */
        .footer {
          font-size: 0.68rem;
          color: #bbb;
          text-align: center;
          padding: 4px 0 12px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 960px) {
          .main-content {
            grid-template-columns: 1fr;
          }
          .controls-panel {
            position: static;
            max-height: none;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .controls-panel > div { flex: 1; min-width: 220px; }
        }

        /* ===== FUTURE: NOTIFICATION DOTS ===== */
        .alert-dot {
          display: none; /* enable later */
          position: absolute;
          width: 8px; height: 8px;
          background: #ff5722;
          border-radius: 50%;
          border: 1.5px solid #fff;
          box-shadow: 0 0 8px rgba(255,87,34,0.5);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
      </style>

      <div class="app">
        <div class="header">
          <h1>Interactive Data Comparison Map</h1>
          <p>Select a data type and source — hover over countries for details</p>
        </div>

        <div class="main-content">
          <div class="map-panel glass">
            <div class="map-title-bar">
              <div>
                <div class="map-title" id="mapTitle">Select a data type</div>
                <div class="map-subtitle" id="mapSubtitle">Choose from the panel on the right</div>
              </div>
              <div class="loading-badge hidden" id="loadingBadge">
                <div class="spinner"></div>
                Fetching data…
              </div>
            </div>
            <div class="legend">
              <span id="legendMin">—</span>
              <div class="legend-bar"></div>
              <span id="legendMax">—</span>
            </div>
            <div class="map-container" id="mapContainer">
              <svg id="mapSvg" viewBox="-30 -5 590 480" preserveAspectRatio="xMidYMid meet"></svg>
            </div>
          </div>

          <div class="controls-panel glass">
            <div>
              <div class="section-title">📊 Data Type</div>
              <div class="btn-group" id="dataTypeButtons"></div>
            </div>
            <div>
              <div class="section-title">🏛️ Source</div>
              <div class="btn-group" id="sourceButtons"></div>
            </div>
          </div>
        </div>

        <div class="footer">
          Data fetched live from Eurostat & World Bank APIs · Updated automatically
        </div>
      </div>

      <div class="tooltip" id="tooltip">
        <div class="tt-country" id="ttCountry">—</div>
        <div>
          <span class="tt-value" id="ttValue">—</span>
          <span class="tt-unit" id="ttUnit"></span>
        </div>
        <div class="tt-source" id="ttSource"></div>
        <div class="tt-discrepancy" id="ttDiscrepancy">⚠️ Sources differ significantly</div>
      </div>
    `;
  }

  // Shorthand for shadowRoot queries
  $(sel) { return this.shadowRoot.querySelector(sel); }
  $$(sel) { return this.shadowRoot.querySelectorAll(sel); }

  async init() {
    // Load topojson-client library
    await loadScript(TOPOJSON_CLIENT_URL);

    // Fetch world-atlas topojson
    const resp = await fetch(MAP_TOPO_URL);
    const worldTopo = await resp.json();

    // Convert to GeoJSON and filter to Europe
    const allCountries = topojson.feature(worldTopo, worldTopo.objects.countries);
    this.geoFeatures = allCountries.features.filter(f => {
      const numericId = String(f.id).padStart(3, '0');
      return EUROPE_NUMERIC.has(numericId);
    });

    this.drawMap();
    this.buildDataTypeButtons();

    // Auto-select first data type
    const firstKey = Object.keys(DATA_CONFIG)[0];
    this.selectDataType(firstKey);
  }

  // ============================================================
  // MAP DRAWING — D3-less projection (Mercator subset for Europe)
  // ============================================================
  drawMap() {
    const svg = this.$('#mapSvg');
    svg.innerHTML = '';

    // Simple Mercator projection tuned for Europe
    // viewBox is 590×480
    const lonToX = (lon) => (lon + 25) * (540 / 75); // -25 to 50 → 0 to 540
    const latToY = (lat) => {
      // Mercator y
      const latRad = lat * Math.PI / 180;
      const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      // Map ~35°N to ~72°N
      const mercMin = Math.log(Math.tan(Math.PI / 4 + (35 * Math.PI / 180) / 2));
      const mercMax = Math.log(Math.tan(Math.PI / 4 + (72 * Math.PI / 180) / 2));
      return 460 - ((mercY - mercMin) / (mercMax - mercMin)) * 460;
    };

    const projectCoord = ([lon, lat]) => [lonToX(lon), latToY(lat)];

    this.geoFeatures.forEach(feature => {
      const numericId = String(feature.id).padStart(3, '0');
      const alpha2 = NUMERIC_TO_ALPHA2[numericId];
      if (!alpha2) return;

      const paths = this.geometryToPathStrings(feature.geometry, projectCoord);
      paths.forEach(d => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('data-code', alpha2);
        path.setAttribute('data-name', ALPHA2_TO_NAME[alpha2] || alpha2);
        path.classList.add('country-path', 'no-data');

        path.addEventListener('mouseenter', (e) => this.onEnter(e));
        path.addEventListener('mousemove', (e) => this.onMove(e));
        path.addEventListener('mouseleave', () => this.onLeave());

        svg.appendChild(path);
      });
    });
  }

  geometryToPathStrings(geometry, project) {
    const ringToPath = (ring) => {
      return ring.map((coord, i) => {
        const [x, y] = project(coord);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ') + ' Z';
    };

    if (geometry.type === 'Polygon') {
      return [geometry.coordinates.map(ringToPath).join(' ')];
    } else if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.map(polygon =>
        polygon.map(ringToPath).join(' ')
      );
    }
    return [];
  }

  // ============================================================
  // BUTTONS
  // ============================================================
  buildDataTypeButtons() {
    const container = this.$('#dataTypeButtons');
    container.innerHTML = '';
    Object.entries(DATA_CONFIG).forEach(([key, dt]) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.dataset.key = key;
      const srcCount = Object.keys(dt.sources).length;
      btn.innerHTML = `${dt.label}<span class="badge">${srcCount} src</span>`;
      btn.addEventListener('click', () => this.selectDataType(key));
      container.appendChild(btn);
    });
  }

  buildSourceButtons(dataTypeKey) {
    const container = this.$('#sourceButtons');
    container.innerHTML = '';
    const sources = DATA_CONFIG[dataTypeKey].sources;
    Object.entries(sources).forEach(([key, src]) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.dataset.key = key;
      btn.textContent = src.label;
      btn.addEventListener('click', () => this.selectSource(key));
      container.appendChild(btn);
    });
  }

  async selectDataType(key) {
    this.currentDataType = key;
    this.$$('#dataTypeButtons .btn').forEach(b =>
      b.classList.toggle('active', b.dataset.key === key)
    );
    this.buildSourceButtons(key);

    // Auto-select first source
    const firstSource = Object.keys(DATA_CONFIG[key].sources)[0];
    await this.selectSource(firstSource);
  }

  async selectSource(key) {
    this.currentSource = key;
    this.$$('#sourceButtons .btn').forEach(b =>
      b.classList.toggle('active', b.dataset.key === key)
    );

    const ck = cacheKey(this.currentDataType, this.currentSource);
    const loader = this.$('#loadingBadge');

    if (dataCache[ck]) {
      this.currentData = dataCache[ck];
    } else {
      // Show loading
      loader.classList.remove('hidden');

      const config = DATA_CONFIG[this.currentDataType].sources[this.currentSource];
      this.currentData = await config.fetch();
      dataCache[ck] = this.currentData;

      loader.classList.add('hidden');
    }

    this.updateMap();
  }

  // ============================================================
  // UPDATE MAP COLORS
  // ============================================================
  updateMap() {
    const dt = DATA_CONFIG[this.currentDataType];
    const src = dt.sources[this.currentSource];
    const { countries, year } = this.currentData;

    this.$('#mapTitle').textContent =
      `${dt.label} (${src.label} — ${year})`;
    this.$('#mapSubtitle').textContent = `Unit: ${dt.unit}`;

    const vals = Object.values(countries).filter(v => v !== null);
    if (vals.length === 0) {
      this.$('#legendMin').textContent = '—';
      this.$('#legendMax').textContent = '—';
      this.$$('.country-path').forEach(p => {
        p.classList.add('no-data');
        p.setAttribute('fill', '#e8e8e8');
      });
      return;
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    this.$('#legendMin').textContent = formatValue(min, dt.unit);
    this.$('#legendMax').textContent = formatValue(max, dt.unit);

    this.$$('.country-path').forEach(path => {
      const code = path.dataset.code;
      const val = countries[code];
      if (val !== undefined && val !== null) {
        path.classList.remove('no-data');
        const t = max !== min ? (val - min) / (max - min) : 0.5;
        path.setAttribute('fill', getColor(t));
      } else {
        path.classList.add('no-data');
        path.setAttribute('fill', '#e8e8e8');
      }
    });
  }

  // ============================================================
  // TOOLTIP
  // ============================================================
  onEnter(e) {
    const code = e.target.dataset.code;
    const name = e.target.dataset.name;
    const dt = DATA_CONFIG[this.currentDataType];
    const val = this.currentData?.countries?.[code];

    this.$('#ttCountry').textContent = name;
    if (val !== undefined && val !== null) {
      this.$('#ttValue').textContent = formatValue(val, dt.unit);
      this.$('#ttUnit').textContent = dt.unit;
    } else {
      this.$('#ttValue').textContent = 'No data';
      this.$('#ttUnit').textContent = '';
    }
    this.$('#ttSource').textContent =
      `${dt.sources[this.currentSource].label} · ${this.currentData?.year || '—'}`;

    // Future: discrepancy check
    // this.checkDiscrepancy(code);

    this.$('#tooltip').classList.add('visible');
  }

  onMove(e) {
    const tt = this.$('#tooltip');
    tt.style.left = (e.clientX + 16) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  }

  onLeave() {
    this.$('#tooltip').classList.remove('visible');
  }

  // ============================================================
  // FUTURE: Cross-source discrepancy detection
  // ============================================================
  async checkDiscrepancy(countryCode) {
    const dt = DATA_CONFIG[this.currentDataType];
    const allVals = [];
    for (const [srcKey, src] of Object.entries(dt.sources)) {
      const ck = cacheKey(this.currentDataType, srcKey);
      if (dataCache[ck]?.countries?.[countryCode] != null) {
        allVals.push(dataCache[ck].countries[countryCode]);
      }
    }
    if (allVals.length < 2) return;
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;
    const diff = avg !== 0 ? ((max - min) / avg) * 100 : 0;
    const el = this.$('#ttDiscrepancy');
    if (diff > 15) {
      el.style.display = 'block';
      el.textContent = `⚠️ ${diff.toFixed(0)}% variance across ${allVals.length} sources`;
    } else {
      el.style.display = 'none';
    }
  }
}

// ============================================================
// REGISTER THE CUSTOM ELEMENT
// ============================================================
customElements.define('data-comparison-map', DataComparisonMap);