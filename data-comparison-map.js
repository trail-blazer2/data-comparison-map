import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDX1ESWqv-k2ogI8h0hVDvtWdJ3HoL35pE",
  authDomain: "real-world-view.firebaseapp.com",
  projectId: "real-world-view",
  storageBucket: "real-world-view.firebasestorage.app",
  messagingSenderId: "1054980434911",
  appId: "1:1054980434911:web:4bab53b5d7303f95f7b26a",
  measurementId: "G-S77KP79EWL"
};

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
  '004':'AF','008':'AL','012':'DZ','024':'AO','031':'AZ','032':'AR','036':'AU','040':'AT','050':'BD','051':'AM','056':'BE','064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','096':'BN','100':'BG','104':'MM','108':'BI','112':'BY','116':'KH','120':'CM','124':'CA','140':'CF','144':'LK','148':'TD','152':'CL','156':'CN','170':'CO','174':'KM','178':'CG','180':'CD','188':'CR','191':'HR','192':'CU','196':'CY','203':'CZ','204':'BJ','208':'DK','214':'DO','218':'EC','222':'SV','226':'GQ','231':'ET','232':'ER','233':'EE','242':'FJ','246':'FI','250':'FR','262':'DJ','266':'GA','268':'GE','270':'GM','276':'DE','288':'GH','300':'GR','320':'GT','324':'GN','328':'GY','332':'HT','340':'HN','348':'HU','352':'IS','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','384':'CI','388':'JM','392':'JP','398':'KZ','400':'JO','404':'KE','408':'KP','410':'KR','414':'KW','417':'KG','418':'LA','422':'LB','426':'LS','428':'LV','430':'LR','434':'LY','440':'LT','442':'LU','450':'MG','454':'MW','458':'MY','466':'ML','470':'MT','478':'MR','480':'MU','484':'MX','496':'MN','498':'MD','499':'ME','504':'MA','508':'MZ','516':'NA','524':'NP','528':'NL','540':'NC','554':'NZ','558':'NI','562':'NE','566':'NG','578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','646':'RW','678':'ST','682':'SA','686':'SN','688':'RS','694':'SL','703':'SK','704':'VN','705':'SI','706':'SO','710':'ZA','716':'ZW','724':'ES','728':'SS','729':'SD','740':'SR','748':'SZ','752':'SE','756':'CH','760':'SY','762':'TJ','764':'TH','768':'TG','784':'AE','788':'TN','792':'TR','795':'TM','800':'UG','804':'UA','807':'MK','818':'EG','826':'GB','834':'TZ','840':'US','858':'UY','860':'UZ','862':'VE','887':'YE','894':'ZM'
};

const ALPHA2_TO_NAME = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AO:'Angola',AM:'Armenia',AR:'Argentina',AU:'Australia',AT:'Austria',AZ:'Azerbaijan',BD:'Bangladesh',BE:'Belgium',BJ:'Benin',BT:'Bhutan',BO:'Bolivia',BA:'Bosnia & Herzegovina',BW:'Botswana',BR:'Brazil',BN:'Brunei',BG:'Bulgaria',BI:'Burundi',BY:'Belarus',KH:'Cambodia',CM:'Cameroon',CA:'Canada',CF:'Central African Republic',TD:'Chad',CL:'Chile',CN:'China',CO:'Colombia',CG:'Congo',CD:'DR Congo',KM:'Comoros',CR:'Costa Rica',CI:"Côte d'Ivoire",HR:'Croatia',CU:'Cuba',CY:'Cyprus',CZ:'Czechia',DK:'Denmark',DJ:'Djibouti',DO:'Dominican Republic',EC:'Ecuador',EG:'Egypt',SV:'El Salvador',GQ:'Equatorial Guinea',ER:'Eritrea',EE:'Estonia',ET:'Ethiopia',FJ:'Fiji',FI:'Finland',FR:'France',GA:'Gabon',GM:'Gambia',GE:'Georgia',DE:'Germany',GH:'Ghana',GR:'Greece',GT:'Guatemala',GN:'Guinea',GY:'Guyana',HT:'Haiti',HN:'Honduras',HU:'Hungary',IS:'Iceland',IN:'India',ID:'Indonesia',IR:'Iran',IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',KZ:'Kazakhstan',KE:'Kenya',KP:'North Korea',KR:'South Korea',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',LB:'Lebanon',LS:'Lesotho',LR:'Liberia',LY:'Libya',LT:'Lithuania',LU:'Luxembourg',LV:'Latvia',MG:'Madagascar',MW:'Malawi',MY:'Malaysia',ML:'Mali',MT:'Malta',MR:'Mauritania',MU:'Mauritius',MX:'Mexico',MD:'Moldova',ME:'Montenegro',MN:'Mongolia',MA:'Morocco',MZ:'Mozambique',MM:'Myanmar',NA:'Namibia',NP:'Nepal',NL:'Netherlands',NC:'New Caledonia',NZ:'New Zealand',NI:'Nicaragua',NE:'Niger',NG:'Nigeria',MK:'North Macedonia',NO:'Norway',PK:'Pakistan',PA:'Panama',PG:'Papua New Guinea',PY:'Paraguay',PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',QA:'Qatar',RO:'Romania',RU:'Russia',RW:'Rwanda',ST:'São Tomé & Príncipe',SA:'Saudi Arabia',SN:'Senegal',RS:'Serbia',SL:'Sierra Leone',SK:'Slovakia',SI:'Slovenia',SO:'Somalia',ZA:'South Africa',SS:'South Sudan',ES:'Spain',LK:'Sri Lanka',SD:'Sudan',SR:'Suriname',SZ:'Eswatini',SE:'Sweden',CH:'Switzerland',SY:'Syria',TJ:'Tajikistan',TZ:'Tanzania',TH:'Thailand',TG:'Togo',TN:'Tunisia',TR:'Türkiye',TM:'Turkmenistan',UG:'Uganda',UA:'Ukraine',AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',UY:'Uruguay',UZ:'Uzbekistan',VE:'Venezuela',VN:'Vietnam',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe'
};

const CS_COUNTRIES = {
  AF:'Afghánistán',AL:'Albánie',DZ:'Alžírsko',AO:'Angola',AM:'Arménie',AR:'Argentina',AU:'Austrálie',AT:'Rakousko',AZ:'Ázerbájdžán',BD:'Bangladéš',BE:'Belgie',BJ:'Benin',BT:'Bhútán',BO:'Bolívie',BA:'Bosna a Hercegovina',BW:'Botswana',BR:'Brazílie',BN:'Brunej',BG:'Bulharsko',BI:'Burundi',BY:'Bělorusko',KH:'Kambodža',CM:'Kamerun',CA:'Kanada',CF:'Středoafrická republika',TD:'Čad',CL:'Chile',CN:'Čína',CO:'Kolumbie',CG:'Kongo',CD:'DR Kongo',KM:'Komory',CR:'Kostarika',CI:"Pobřeží slonoviny",HR:'Chorvatsko',CU:'Kuba',CY:'Kypr',CZ:'Česko',DK:'Dánsko',DJ:'Džibutsko',DO:'Dominikánská republika',EC:'Ekvádor',EG:'Egypt',SV:'Salvador',GQ:'Rovníková Guinea',ER:'Eritrea',EE:'Estonsko',ET:'Etiopie',FJ:'Fidži',FI:'Finsko',FR:'Francie',GA:'Gabon',GM:'Gambie',GE:'Gruzie',DE:'Německo',GH:'Ghana',GR:'Řecko',GT:'Guatemala',GN:'Guinea',GY:'Guyana',HT:'Haiti',HN:'Honduras',HU:'Maďarsko',IS:'Island',IN:'Indie',ID:'Indonésie',IR:'Írán',IQ:'Irák',IE:'Irsko',IL:'Izrael',IT:'Itálie',JM:'Jamajka',JP:'Japonsko',JO:'Jordánsko',KZ:'Kazachstán',KE:'Keňa',KP:'Severní Korea',KR:'Jižní Korea',KW:'Kuvajt',KG:'Kyrgyzstán',LA:'Laos',LB:'Libanon',LS:'Lesotho',LR:'Libérie',LY:'Libye',LT:'Litva',LU:'Lucembursko',LV:'Lotyšsko',MG:'Madagaskar',MW:'Malawi',MY:'Malajsie',ML:'Mali',MT:'Malta',MR:'Mauritánie',MU:'Mauricius',MX:'Mexiko',MD:'Moldavsko',ME:'Černá Hora',MN:'Mongolsko',MA:'Maroko',MZ:'Mosambik',MM:'Myanmar',NA:'Namibie',NP:'Nepál',NL:'Nizozemsko',NC:'Nová Kaledonie',NZ:'Nový Zéland',NI:'Nikaragua',NE:'Niger',NG:'Nigérie',MK:'Severní Makedonie',NO:'Norsko',PK:'Pákistán',PA:'Panama',PG:'Papua Nová Guinea',PY:'Paraguay',PE:'Peru',PH:'Filipíny',PL:'Polsko',PT:'Portugalsko',QA:'Katar',RO:'Rumunsko',RU:'Rusko',RW:'Rwanda',ST:'Svatý Tomáš a Princův ostrov',SA:'Saúdská Arábie',SN:'Senegal',RS:'Srbsko',SL:'Sierra Leone',SK:'Slovensko',SI:'Slovinsko',SO:'Somálsko',ZA:'Jižní Afrika',SS:'Jižní Súdán',ES:'Španělsko',LK:'Srí Lanka',SD:'Súdán',SR:'Surinam',SZ:'Eswatini',SE:'Švédsko',CH:'Švýcarsko',SY:'Sýrie',TJ:'Tádžikistán',TZ:'Tanzanie',TH:'Thajsko',TG:'Togo',TN:'Tunisko',TR:'Turecko',TM:'Turkmenistán',UG:'Uganda',UA:'Ukrajina',AE:'Spojené arabské emiráty',GB:'Velká Británie',US:'USA',UY:'Uruguay',UZ:'Uzbekistán',VE:'Venezuela',VN:'Vietnam',YE:'Jemen',ZM:'Zambie',ZW:'Zimbabwe'
};

const I18N = {
  en: {
    about: "About", loading: "Loading map & data…", category: "Category", dataType: "Data Type", source: "Source",
    history: "HISTORY", future: "FUTURE", country: "Country", metric: "Metric", desc: "Description",
    updatedDate: "Data updated: ", projected: "Projected 2029: ", context: "Context:",
    noProj: "Future projections not yet available for this metric/country combination.",
    normProg: "Normal yearly progression. No major outliers recorded.", noData: "No data", noDataSrc: "No data available",
    "Economy": "Economy", "Demographics": "Demographics", "Society": "Society", "Public Services": "Services", "other": "Other",
    yes: "Yes", no: "No", done: "Done",
    wizTitle: "Help Predict the Future",
    wizDesc: "Share your prediction and get points to unlock our upcoming Pro version. You are contributing to the best investment prediction tool in the world.",
    wizBtnStart: "Start Predicting",
    wizBtnClaim: "Claim Points",
    accTitle: "Your Account",
    accMenuDash: "Dashboard",
    accMenuPred: "Your Predictions",
    accPredEmpty: "You haven't made any predictions yet.",
    tierFree: "Free User",
    tierPro: "Pro Membership (Coming Soon)",
    btnSignOut: "Sign Out",
    btnAccount: "Account",
    btnLogReg: "Log in / Register",
    btnPredict: "Predict & Earn",
    btnUpgrade: "Upgrade",
    topicChoose: "Choose a topic to predict",
    claimInfoMore: "Answer the others to get more points",
    claimInfoAll: "Amazing! You completed all topics.",
    proModalTitle: "DataMap Pro",
    proModalDesc: "Get ready for institutional-grade intelligence. Our Pro tier bypasses standard government data lag by integrating real-time alternative data to power our predictive algorithms.",
    proSat: "Satellite Imagery Analytics: Tracking factory outputs and shipping lane congestion in real-time.",
    proSoc: "Social Sentiment & Scraping: Advanced web-scraping of corporate hiring trends and global announcements.",
    proAlgo: "Algorithmic Predictive Modeling: See exactly how macro-events alter GDP trajectories 5 years before they happen.",
    proNote: "*Use your earned Points to unlock early access when we launch.",
    authTitleSave: "Save Your Points!",
    authDescSave: "Create a free account to secure your points. You can use them later to unlock RealWorldView Pro for free!",
    authTitleLog: "Welcome Back",
    authDescLog: "Log in to view your points and predictions.",
    btnSignUp: "Sign Up & Save Points",
    btnLogin: "Log In",
    btnSwitchToLogin: "Already have an account? Log in",
    btnSwitchToSignUp: "Need an account? Sign up",
    emailPlaceholder: "Email Address",
    passPlaceholder: "Password",
    authGdpr: `I agree to the <a href="terms.html" target="_blank" class="legal-link">Terms of Service</a> and <a href="privacy.html" target="_blank" class="legal-link">Privacy Policy</a>.`,
    askAI: "Why this number? Ask our AI",
    aiThinking: "AI is thinking...",
    aiAgain: "Ask AI again",
    aiAnalysis: "AI Analysis",
    aiError: "AI service is currently unavailable. Please try again.",
    "persons": "persons", "net persons": "net persons", "USD/capita": "USD/capita", "int. $": "int. $",
    "% of GDP": "% of GDP", "%": "%", "births/woman": "births/woman", "years": "years",
    "per 100k inh.": "per 100k inh.", "per 1,000 births": "per 1,000 births",
    "% gross enrollment": "% gross enrollment", "index (0-100)": "index (0-100)",
    "Commodities": "Commodity Prices",
    "proofTitle": "Proof of Concept: Historical Accuracy",
    "proofActual": "Actual Event",
    "simulatedPrice": "Simulated Price:",
    "userSent": "User Sentiment Premium: "
  },
  cs: {
    about: "O nás", loading: "Načítání mapy a dat…", category: "Kategorie", dataType: "Typ dat", source: "Zdroj",
    history: "HISTORIE", future: "BUDOUCNOST", country: "Země", metric: "Metrika", desc: "Popis",
    updatedDate: "Data aktualizována: ", projected: "Projekce 2029: ", context: "Kontext:",
    noProj: "Pro tuto kombinaci metriky a země zatím nejsou k dispozici budoucí projekce.",
    normProg: "Normální roční vývoj. Nezaznamenány žádné významné odchylky.", noData: "Žádná data", noDataSrc: "Žádná data",
    "Economy": "Ekonomika", "Demographics": "Demografie", "Society": "Společnost", "Public Services": "Služby", "other": "Ostatní",
    yes: "Ano", no: "Ne", done: "Hotovo",
    wizTitle: "Pomozte předpovědět budoucnost",
    wizDesc: "Sdílejte svou předpověď a získejte body k odemčení chystané Pro verze. Přispíváte k nejlepšímu investičnímu predikčnímu nástroji na světě.",
    wizBtnStart: "Začít předpovídat",
    wizBtnClaim: "Získat body",
    accTitle: "Váš účet",
    accMenuDash: "Nástěnka",
    accMenuPred: "Vaše předpovědi",
    accPredEmpty: "Zatím jste neprovedli žádné předpovědi.",
    tierFree: "Bezplatný tarif",
    tierPro: "Pro Tarif (Brzy dostupné)",
    btnSignOut: "Odhlásit se",
    btnAccount: "Účet",
    btnLogReg: "Přihlásit / Registrovat",
    btnPredict: "Získejte body zdarma",
    btnUpgrade: "Vylepšit",
    topicChoose: "Vyberte téma k předpovědi",
    claimInfoMore: "Odpovězte i na ostatní a získejte více bodů",
    claimInfoAll: "Skvělé! Dokončili jste všechna témata.",
    proModalTitle: "RealWorldView Pro",
    proModalDesc: "Připravte se na profesionální analytiku. Náš Pro tarif obchází zpoždění vládních dat tím, že integruje alternativní data v reálném čase pro naše prediktivní algoritmy.",
    proSat: "Satelitní snímky: Sledování výkonu továren a vytížení lodních tras v reálném čase.",
    proSoc: "Analýza sentimentu a dat: Pokročilé vytěžování trendů náboru firem a globálních oznámení.",
    proAlgo: "Algoritmické prediktivní modelování: Podívejte se přesně, jak makro události změní trajektorie HDP 5 let dopředu.",
    proNote: "*Využijte získané body k odemknutí předběžného přístupu při našem spuštění.",
    authTitleSave: "Uložte si své body!",
    authDescSave: "Vytvořte si bezplatný účet pro zabezpečení svých bodů. Později je využijete k bezplatnému odemčení RealWorldView Pro!",
    authTitleLog: "Vítejte zpět",
    authDescLog: "Přihlaste se pro zobrazení svých bodů a předpovědí.",
    btnSignUp: "Registrovat se a uložit body",
    btnLogin: "Přihlásit se",
    btnSwitchToLogin: "Už máte účet? Přihlaste se",
    btnSwitchToSignUp: "Nemáte účet? Registrujte se",
    emailPlaceholder: "E-mailová adresa",
    passPlaceholder: "Heslo",
    authGdpr: `Souhlasím s <a href="terms.html" target="_blank" class="legal-link">Podmínkami služby</a> a <a href="privacy.html" target="_blank" class="legal-link">Zásadami ochrany osobních údajů</a>.`,
    askAI: "Proč toto číslo? Zeptejte se naší AI",
    aiThinking: "AI přemýšlí...",
    aiAgain: "Zeptat se AI znovu",
    aiAnalysis: "AI Analýza",
    aiError: "Služba AI je momentálně nedostupná. Zkuste to prosím znovu.",
    "Unemployment rate - Total": "Míra nezaměstnanosti - Celkem", "Unemployment rate - Youth": "Míra nezaměstnanosti - Mládež",
    "Earnings": "Příjmy", "Intentional homicide": "Úmyslné zabití", "Immigration": "Imigrace", "Net migration": "Čistá migrace",
    "Inflation": "Inflace", "Population": "Populace", "Life expectancy": "Naděje dožití", "Fertility": "Plodnost",
    "Government Debt": "Vládní dluh", "Healthcare spending": "Výdaje na zdravotnictví", "Education spending": "Výdaje na vzdělávání", "Military spending": "Vojenské výdaje",
    "R&D spending": "Výdaje na výzkum a vývoj", "Poverty rate": "Míra chudoby", "Infant mortality": "Kojenecká úmrtnost", "Tertiary education": "Terciární vzdělávání",
    "Foreign Direct Investment": "Přímé zahraniční investice", "GDP growth": "Růst HDP", "GDP per capita (PPP)": "HDP na obyvatele (PPP)", "Gini coefficient": "Giniho koeficient",
    "persons": "osob", "net persons": "osob (čisté)", "USD/capita": "USD/obyvatele", "int. $": "int. $",
    "% of GDP": "% HDP", "%": "%", "births/woman": "dětí/ženu", "years": "let", "per 100k inh.": "na 100k obyv.", "per 1,000 births": "na 1 000 naroz.",
    "% gross enrollment": "% hrubé zápisy", "index (0-100)": "index (0-100)",
    "Commodities": "Ceny komodit",
    "proofTitle": "Důkaz Konceptu: Historická Přesnost",
    "proofActual": "Skutečná událost",
    "simulatedPrice": "Simulovaná cena:",
    "userSent": "Prémie uživatelského sentimentu: "
  }
};

const CATEGORY_META = {
  economy: { labelKey: 'Economy', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/><path d="M4 12a8 8 0 018-8v2a6 6 0 100 12v2a8 8 0 01-8-8z"/>' },
  demographics: { labelKey: 'Demographics', icon: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>' },
  society: { labelKey: 'Society', icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>' },
  public_services: { labelKey: 'Public Services', icon: '<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>' },
  commodities: { labelKey: 'Commodities', isWide: true, icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>' }
};

const QUESTIONNAIRE = [
  {
    id: '1',
    title: { en: 'Global Health & Demographic Shocks', cs: 'Globální zdravotní a demografické šoky' },
    questions: [
      { id: 'q1_1', text: { en: 'Will you reduce your meat and livestock food consumption in the next 6 months due to rising global health warnings?', cs: 'Omezíte v následujících 6 měsících spotřebu masa a živočišných produktů kvůli rostoucím globálním zdravotním varováním?' }, info: { en: 'WHO data shows a global shift toward plant-based diets and stricter food regulations. Your answer helps predict future demand for agricultural commodities like soy, corn, and livestock.', cs: 'Data WHO ukazují globální posun k rostlinné stravě a přísnějším potravinovým regulacím. Vaše odpověď pomáhá předpovídat budoucí poptávku po zemědělských komoditách, jako je sója, kukuřice a dobytek.' } },
      { id: 'q1_2', text: { en: 'Do you consider buying physical gold safer than holding cash due to aging populations and strained pension systems?', cs: 'Považujete nákup fyzického zlata za bezpečnější než držení hotovosti kvůli stárnutí populace a přetíženým důchodovým systémům?' }, info: { en: 'Demographic data tracks rapidly aging societies in Europe and Asia. This question measures if capital is structurally shifting from cash and bonds into safe-haven precious metals.', cs: 'Demografická data sledují rychle stárnoucí společnost v Evropě a Asii. Tato otázka měří, zda se kapitál strukturálně přesouvá z hotovosti a dluhopisů do bezpečných drahých kovů.' } },
      { id: 'q1_3', text: { en: 'Do you expect new global health or environmental risks to disrupt mining operations in developing countries this year?', cs: 'Očekáváte, že nová globální zdravotní nebo ekologická rizika letos přeruší těžební operace v rozvojových zemích?' }, info: { en: 'WHO health maps monitor regional disease outbreaks and pollution. Investors use this to predict sudden supply shocks for industrial metals like copper, lithium, and cobalt.', cs: 'Zdravotní mapy WHO monitorují regionální ohniska nemocí a znečištění. Investoři tyto informace využívají k předpovídání náhlých nabídkových šoků u průmyslových kovů, jako je měď, lithium a kobalt.' } }
    ]
  },
  {
    id: '2',
    title: { en: 'Regional Regulations & Economic Policies', cs: 'Regionální regulace a ekonomické politiky' },
    questions: [
      { id: 'q2_1', text: { en: 'Will you move your investments out of European assets if official data confirms a continuous drop in industrial production?', cs: 'Přesunete své investice z evropských aktiv, pokud oficiální data potvrdí trvalý pokles průmyslové produkce?' }, info: { en: 'Eurostat tracks monthly industrial output across the EU. This question provides a leading indicator of capital flight and geographical reallocation before markets react.', cs: 'Eurostat sleduje měsíční průmyslovou produkci v celé EU. Tato otázka poskytuje předstihový indikátor odlivu kapitálu a geografické rotace peněz dříve, než trhy zareagují.' } },
      { id: 'q2_2', text: { en: 'Do you believe heavy industry will shut down production if regional energy prices stay above the historical average?', cs: 'Věříte, že těžký průmysl ukončí výrobu, pokud regionální ceny energií zůstanou nad historickým průměrem?' }, info: { en: 'Eurostat energy metrics show the real cost burden on factories. Your response helps predict "demand destruction" – a key factor that can crash the prices of aluminum, steel, and gas.', cs: 'Energetické metriky Eurostatu ukazují reálné nákladové zatížení továren. Vaše odpověď pomáhá předpovídat „destrukci poptávky“ – klíčový faktor, který může srazit ceny hliníku, oceli a plynu.' } },
      { id: 'q2_3', text: { en: 'Is the current inflation rate forcing you to allocate more money into commodities instead of traditional stocks?', cs: 'Nutí vás současná míra inflace investovat více peněz do komodit namísto tradičních akcií?' }, info: { en: 'Eurostat Consumer Price Index (CPI) tracks inflation strength. This data helps algorithms measure how strongly market participants are using commodities as an inflation hedge.', cs: 'Index spotřebitelských cen (CPI) Eurostatu sleduje sílu inflace. Tato data pomáhají algoritmům měřit, jak silně účastníci trhu využívají komodity jako zajištění proti inflaci.' } }
    ]
  },
  {
    id: '3',
    title: { en: 'Global Supply Chains & Geopolitical Substitution', cs: 'Globální dodavatelské řetězce a geopolitická substituce' },
    questions: [
      { id: 'q3_1', text: { en: 'Will the global market successfully replace eastern commodity exports with supplies from South America and India this year?', cs: 'Nahradí globální trh v tomto roce úspěšně export komodit z Východu dodávkami z Jižní Ameriky a Indie?' }, info: { en: 'This question cross-references Eurostat trade flow data to determine if deglobalization is succeeding, allowing investors to price in new logistics and shipping costs.', cs: 'Tato otázka porovnává data Eurostatu o obchodních tocích a zjišťuje, zda deglobalizace úspěšně pokračuje, což investorům umožňuje započítat nové náklady na logistiku a přepravu.' } },
      { id: 'q3_2', text: { en: 'Do you expect disruptions in critical maritime trade routes to trigger a major oil and gas price spike this quarter?', cs: 'Očekáváte, že narušení kritických námořních obchodních tras způsobí v tomto čtvrtletí výrazný nárůst cen ropy a plynu?' }, info: { en: 'Global supply chain stability directly impacts energy prices. Measuring market fear of transit blockages helps calculate the "geopolitical risk premium" added to oil prices.', cs: 'Stabilita globálních dodavatelských řetězců přímo ovlivňuje ceny energií. Měření obav trhu z blokád tranzitu pomáhá vypočítat „geopolitickou rizikovou prémii“ započítanou do cen ropy.' } },
      { id: 'q3_3', text: { en: 'Do you think western government sanctions on strategic raw materials will cause a severe shortage in domestic tech industries?', cs: 'Myslíte si, že vládní sankce Západu na strategické suroviny způsobí vážný nedostatek v domácím technologickém průmyslu?' }, info: { en: 'Combining industrial demand data with geopolitical sentiment helps predict retaliatory trade bans. A high "Yes" rate indicates upcoming extreme volatility in rare earth metals and uranium.', cs: 'Spojení dat o průmyslové poptávce s geopolitickým sentimentem pomáhá předvídat odvetná obchodní embarga. Vysoký podíl odpovědí „Ano“ značí blížící se extrémní volatilitu u kovů vzácných zemin a uranu.' } }
    ]
  }
];

function getColor(t) {
  const c = [ [190, 215, 250], [115, 160, 220], [65, 115, 185], [25, 65, 125], [10, 30, 70] ];
  const n = c.length - 1; const i = Math.min(Math.floor(t * n), n - 1); const f = (t * n) - i;
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
  if (unit === '$/lb' || unit === '$/kg' || unit === '$/barrel' || unit === '$/oz' || unit === '$/ton') return '$' + val.toFixed(2);
  if (unit === '€/MWh') return '€' + val.toFixed(2);
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

class DataComparisonMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const browserLang = navigator.language || navigator.userLanguage;
    if (urlLang === 'cs' || urlLang === 'cz') {
      this._lang = 'cs';
    } else if (urlLang === 'en') {
      this._lang = 'en';
    } else if (browserLang.toLowerCase().includes('cs') || browserLang.toLowerCase().includes('sk')) {
      this._lang = 'cs';
    } else {
      this._lang = 'en';
    }
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

    this._points = 0;
    this._completedTopics = [];
    this._answers = {};
    this._user = null;
    this._wizardStep = 1;
    this._isLoginMode = false;
    this._guestId = null;
    
    this._typingInterval = null;
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

    this._guestId = localStorage.getItem('datamap_guest_id');
    if (!this._guestId) {
      this._guestId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('datamap_guest_id', this._guestId);
    }

    const savedPoints = localStorage.getItem('datamap_points');
    const savedTopics = localStorage.getItem('datamap_topics');
    const savedAnswers = localStorage.getItem('datamap_answers');
    if (savedPoints) this._points = parseInt(savedPoints);
    if (savedTopics) this._completedTopics = JSON.parse(savedTopics);
    if (savedAnswers) this._answers = JSON.parse(savedAnswers);

    onAuthStateChanged(auth, async (user) => {
      this._user = user;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const dbTopics = data.completedTopics || [];
          const dbAnswers = data.answers || {};

          let mergedTopics = Array.from(new Set([...dbTopics, ...this._completedTopics]));
          let mergedAnswers = { ...dbAnswers, ...this._answers };
          let mergedPoints = mergedTopics.length * 50; 

          this._points = mergedPoints;
          this._completedTopics = mergedTopics;
          this._answers = mergedAnswers;

          setDoc(docRef, {
            points: this._points, completedTopics: this._completedTopics, answers: this._answers
          }, { merge: true });

          localStorage.removeItem('datamap_points');
          localStorage.removeItem('datamap_topics');
          localStorage.removeItem('datamap_answers');
        }
      }
      this.updateUserUI();
    });

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
    
    // Inject the special Commodities category manually
    this.categories['commodities'] = []; 

    this.setupModalsAndNav();

    if (this.DATA._meta.lastUpdated) {
      const d = new Date(this.DATA._meta.lastUpdated);
      this.$('#lastUpdated').textContent = this.t('updatedDate') + d.toLocaleDateString(this._lang === 'cs' ? 'cs-CZ' : 'en-US');
    }

    const logoEl = this.$('#navLogo'); if (logoEl) logoEl.src = baseUrl + 'logo.png';
    const logoMob = this.$('#navLogoMobile'); if (logoMob) logoMob.src = baseUrl + 'logo-mobile.png';
    const aboutBtn = this.$('#aboutBtn');
    if (aboutBtn) aboutBtn.addEventListener('click', () => { window.open('/about', '_blank'); });

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

    const mapWrap = this.$('.map-wrap');
    if (mapWrap) {
        mapWrap.style.opacity = '0';
        mapWrap.style.transform = 'scale(1.15)';
    }

    this.$('#initLoader').style.display = 'none';
    this.$('#mainContent').style.opacity = '1';

    if (mapWrap) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mapWrap.style.transition = 'opacity 0.4s ease-in, transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1)';
                mapWrap.style.opacity = '1';
                mapWrap.style.transform = 'scale(1)';
                
                setTimeout(() => { 
                    mapWrap.style.transition = ''; 
                    mapWrap.style.transform = ''; 
                }, 600);
            });
        });
    }

    const promoParams = new URLSearchParams(window.location.search);
    if (promoParams.get('promo') === 'true') {
      setTimeout(() => this.openWizard(1), 500);
    }
  }

  setupModalsAndNav() {
    const langSwitchBtn = this.$('#langSwitchBtn');
    const langDropdown = this.$('#langDropdown');
    const currentLangLabel = this.$('#currentLangLabel');
    const langOptions = this.$$('.lang-option');

    if (langSwitchBtn && langDropdown) {
      langSwitchBtn.addEventListener('click', (e) => {
        e.stopPropagation(); langDropdown.classList.toggle('open'); langSwitchBtn.classList.toggle('open');
      });
      langOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation(); this._lang = opt.dataset.lang; currentLangLabel.textContent = opt.textContent;
          langOptions.forEach(o => o.classList.remove('active')); opt.classList.add('active');
          langDropdown.classList.remove('open'); langSwitchBtn.classList.remove('open');
          this.applyLanguage();
        });
      });
      this.shadowRoot.addEventListener('click', (e) => {
        if (!langSwitchBtn.contains(e.target) && !langDropdown.contains(e.target)) {
          langDropdown.classList.remove('open'); langSwitchBtn.classList.remove('open');
        }
      });
    }

    this.updateUserUI();
    
    this.$('#btnPredict').addEventListener('click', () => this.openWizard(this._completedTopics.length > 0 ? 2 : 1));
    this.$('#btnUpgradeAcc').addEventListener('click', () => this.openModal('proModal'));
    
    this.$('#btnAccount').addEventListener('click', () => {
      if (this._user) {
        this.openAccountTab('Dashboard');
        this.openModal('accountModal');
      } else {
        this._isLoginMode = true;
        this.updateAuthUI();
        this.openModal('authModal');
      }
    });

    this.$$('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => e.target.closest('.modal-overlay').classList.remove('active'));
    });

    this.$('#btnStartWizard').addEventListener('click', () => this.renderWizardStep(2));

    this.$$('.switch-auth-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        this._isLoginMode = !this._isLoginMode;
        this.updateAuthUI();
      });
    });

    const handleAuthSubmit = async (e, emailId, passId, btnId, checkId, modalIdToClose) => {
      e.preventDefault();
      
      const email = this.$('#' + emailId).value;
      const pass = this.$('#' + passId).value;
      const btn = this.$('#' + btnId);
      
      btn.textContent = "..."; btn.disabled = true;

      try {
        if (this._isLoginMode) {
          await signInWithEmailAndPassword(auth, email, pass);
        } else {
          const checkEl = this.$('#' + checkId);
          if (checkEl && !checkEl.checked) {
            alert("You must agree to the Terms and Privacy Policy.");
            btn.disabled = false;
            this.updateAuthUI();
            return;
          }

          const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
          const user = userCredential.user;
          await setDoc(doc(db, "users", user.uid), {
            email: user.email, points: this._points, completedTopics: this._completedTopics,
            answers: this._answers, createdAt: new Date().toISOString()
          });
        }
        this.$('#' + modalIdToClose).classList.remove('active');
        this.openAccountTab('Dashboard');
        this.openModal('accountModal');
      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        this.updateAuthUI(); btn.disabled = false;
      }
    };

    const authForm = this.$('#authForm');
    if (authForm) authForm.addEventListener('submit', (e) => handleAuthSubmit(e, 'authEmail', 'authPass', 'authSubmitBtn', 'wizGdprCheck', 'wizardModal'));

    const standaloneAuthForm = this.$('#standaloneAuthForm');
    if (standaloneAuthForm) standaloneAuthForm.addEventListener('submit', (e) => handleAuthSubmit(e, 'standaloneAuthEmail', 'standaloneAuthPass', 'standaloneAuthSubmitBtn', 'stdGdprCheck', 'authModal'));

    this.$('#btnSignOut').addEventListener('click', () => {
      signOut(auth).then(() => {
        this._points = 0; this._completedTopics = []; this._answers = {};
        localStorage.removeItem('datamap_points'); localStorage.removeItem('datamap_topics'); localStorage.removeItem('datamap_answers');
        this.$('#accountModal').classList.remove('active');
        this.updateUserUI();
      });
    });
    
    this.$$('.acc-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openAccountTab(btn.dataset.tab));
    });
  }
  
  openAccountTab(tabName) {
    this.$$('.acc-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    this.$$('.acc-tab-view').forEach(view => view.classList.toggle('active', view.id === 'accTab' + tabName));
    if (tabName === 'Predictions') this.renderAccountPredictions();
  }
  
  renderAccountPredictions() {
    const container = this.$('#accPredList');
    container.innerHTML = '';
    
    if (Object.keys(this._answers).length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 40px 0; color: #8395a7;" data-i18n="accPredEmpty">${this.t('accPredEmpty')}</div>`;
      return;
    }
    
    QUESTIONNAIRE.forEach(topic => {
      topic.questions.forEach(q => {
        const userAns = this._answers[q.id];
        if (userAns) {
          const item = document.createElement('div');
          item.className = 'pred-list-item';
          const isYes = userAns === 'yes';
          item.innerHTML = `
            <div class="pred-q">${q.text[this._lang] || q.text.en}</div>
            <div class="pred-ans ${isYes ? 'yes' : 'no'}">${isYes ? this.t('yes') : this.t('no')}</div>
          `;
          container.appendChild(item);
        }
      });
    });
  }

  updateAuthUI() {
    const setTitle = (id, key) => { const el = this.$('#' + id); if (el) el.textContent = this.t(key); };
    
    const wizImg = this.$('#wizAuthImg');
    const stdImg = this.$('#stdAuthImg');
    
    const loginImgSrc = "https://raw.githubusercontent.com/trail-blazer2/data-comparison-map/refs/heads/main/p2.png"; 
    const signupImgSrc = "https://raw.githubusercontent.com/trail-blazer2/data-comparison-map/refs/heads/main/p3.png";

    const wCheck = this.$('#wizAuthLegal');
    const sCheck = this.$('#stdAuthLegal');

    if (this._isLoginMode) {
      setTitle('wizAuthTitle', 'authTitleLog'); setTitle('wizAuthDesc', 'authDescLog');
      setTitle('authSubmitBtn', 'btnLogin'); setTitle('switchAuthBtn', 'btnSwitchToSignUp');
      setTitle('standaloneAuthTitle', 'authTitleLog'); setTitle('standaloneAuthDesc', 'authDescLog');
      setTitle('standaloneAuthSubmitBtn', 'btnLogin'); setTitle('standaloneSwitchAuthBtn', 'btnSwitchToSignUp');
      if (wizImg) wizImg.src = loginImgSrc; if (stdImg) stdImg.src = loginImgSrc;
      if (wCheck) wCheck.style.display = 'none';
      if (sCheck) sCheck.style.display = 'none';
    } else {
      setTitle('wizAuthTitle', 'authTitleSave'); setTitle('wizAuthDesc', 'authDescSave');
      setTitle('authSubmitBtn', 'btnSignUp'); setTitle('switchAuthBtn', 'btnSwitchToLogin');
      setTitle('standaloneAuthTitle', 'authTitleSave'); setTitle('standaloneAuthDesc', 'authDescSave');
      setTitle('standaloneAuthSubmitBtn', 'btnSignUp'); setTitle('standaloneSwitchAuthBtn', 'btnSwitchToLogin');
      if (wizImg) wizImg.src = signupImgSrc; if (stdImg) stdImg.src = signupImgSrc;
      if (wCheck) wCheck.style.display = 'flex';
      if (sCheck) sCheck.style.display = 'flex';
    }
  }

  updateUserUI() {
    const elPoints = this.$('#accPoints');
    const elPointsModal = this.$('#accPointsModal');
    const elLabel = this.$('#accLabel');
    const elEmail = this.$('#accEmail');

    if (elPoints) elPoints.textContent = this._points + ' Pts';
    if (elPointsModal) elPointsModal.textContent = this._points + ' Pts';
    
    if (this._user) {
      if (elLabel) elLabel.textContent = this.t('btnAccount');
      if (elEmail) elEmail.textContent = this._user.email;
    } else {
      if (elLabel) elLabel.textContent = this.t('btnLogReg');
      if (elEmail) elEmail.textContent = "Not logged in";
    }
  }

  openModal(id) {
    this.$$('.modal-overlay').forEach(m => m.classList.remove('active'));
    this.$('#' + id).classList.add('active');
    if (id === 'authModal') this.updateAuthUI();
  }

  openWizard(step) {
    this.renderWizardStep(step);
    this.openModal('wizardModal');
  }

  renderWizardStep(step) {
    this._wizardStep = step;
    
    this.$$('.step').forEach(s => {
      s.classList.remove('active', 'completed');
      if (parseInt(s.dataset.step) < step) s.classList.add('completed');
      if (parseInt(s.dataset.step) === step) s.classList.add('active');
    });
    this.$$('.step-line').forEach(l => {
      l.classList.remove('active');
      if (parseInt(l.dataset.line) < step) l.classList.add('active');
    });

    this.$$('.wiz-view').forEach(v => v.classList.remove('active'));
    this.$(`#wizStep${step}`).classList.add('active');

    if (step === 2) {
      this.renderQuestionnaireAccordion();
      const firstIncomplete = this.$('#qList').querySelector('.q-topic-wrap:not(.completed)');
      if (firstIncomplete) firstIncomplete.classList.add('expanded');
    }
    if (step === 3) {
      this._isLoginMode = false;
      this.updateAuthUI();
    }
  }

  renderQuestionnaireAccordion() {
    const container = this.$('#qList');
    container.innerHTML = `<h3 class="modal-title" style="font-size:1.1rem; margin-bottom:12px;" data-i18n="topicChoose">${this.t('topicChoose')}</h3>`;
    
    const tempAnswers = {};

    QUESTIONNAIRE.forEach(topic => {
      tempAnswers[topic.id] = {};
      const isCompleted = this._completedTopics.includes(topic.id);
      
      const wrap = document.createElement('div');
      wrap.className = `q-topic-wrap ${isCompleted ? 'completed' : ''}`;
      
      const header = document.createElement('button');
      header.className = 'q-topic-btn';
      header.innerHTML = `
        <span class="q-topic-title">${topic.title[this._lang] || topic.title.en}</span>
        <span class="q-topic-reward">${isCompleted ? '✔ ' + this.t('done') : '+50 Pts'}</span>
      `;
      
      const body = document.createElement('div');
      body.className = 'q-topic-body';
      
      const topicImgSrc = `https://raw.githubusercontent.com/trail-blazer2/data-comparison-map/refs/heads/main/m${topic.id}.jpg`;
      
      if (!isCompleted) {
        body.innerHTML = `<img src="${topicImgSrc}" class="wiz-topic-img" alt="">`;
        
        topic.questions.forEach((q, index) => {
          const card = document.createElement('div');
          card.className = 'q-question-card';
          card.innerHTML = `
            <div class="q-text-wrap">
              <div class="q-text">${index + 1}. ${q.text[this._lang] || q.text.en}</div>
              <div class="factor-info-btn" style="position:relative; z-index:10;">i
                <div class="factor-tooltip" style="bottom:auto; top:100%; margin-top:8px;">
                  <strong>${this.t('context')}</strong> ${q.info[this._lang] || q.info.en}
                </div>
              </div>
            </div>
            <div class="q-actions">
              <button class="btn-vote yes" data-q="${q.id}" data-val="yes">${this.t('yes')}</button>
              <button class="btn-vote no" data-q="${q.id}" data-val="no">${this.t('no')}</button>
            </div>
          `;
          body.appendChild(card);

          const btns = card.querySelectorAll('.btn-vote');
          btns.forEach(btn => {
            btn.onclick = () => {
              btns.forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
              tempAnswers[topic.id][q.id] = btn.dataset.val;

              if (Object.keys(tempAnswers[topic.id]).length === topic.questions.length) {
                this.completeTopic(topic.id, tempAnswers[topic.id], wrap);
              }
            };
          });
        });

        header.onclick = () => {
          const isExpanded = wrap.classList.contains('expanded');
          this.$$('.q-topic-wrap').forEach(w => w.classList.remove('expanded')); 
          if (!isExpanded) wrap.classList.add('expanded');
        };
      }

      wrap.appendChild(header);
      wrap.appendChild(body);
      container.appendChild(wrap);
    });

    const claimWrap = document.createElement('div');
    claimWrap.className = 'claim-wrap';
    const claimBtn = document.createElement('button');
    claimBtn.className = 'btn-primary-large';
    claimBtn.id = 'btnClaimPoints';
    claimBtn.setAttribute('data-i18n', 'wizBtnClaim');
    claimBtn.textContent = this.t('wizBtnClaim');
    claimBtn.onclick = () => {
      if (this._user) {
        this.$('#wizardModal').classList.remove('active');
        this.openAccountTab('Dashboard');
        this.openModal('accountModal');
      } else {
        this.renderWizardStep(3); 
      }
    };
    
    const claimInfo = document.createElement('span');
    claimInfo.className = 'claim-info';
    
    claimWrap.appendChild(claimBtn);
    claimWrap.appendChild(claimInfo);
    container.appendChild(claimWrap);

    this.updateClaimUI();
  }

  updateClaimUI() {
    const claimWrap = this.$('.claim-wrap');
    if (!claimWrap) return;
    const claimInfo = claimWrap.querySelector('.claim-info');
    
    if (this._completedTopics.length === 0) {
      claimWrap.style.display = 'none';
    } else {
      claimWrap.style.display = 'flex';
      if (this._completedTopics.length < 3) {
        claimInfo.textContent = this.t('claimInfoMore');
        claimInfo.style.color = '#d97706';
      } else {
        claimInfo.textContent = this.t('claimInfoAll');
        claimInfo.style.color = '#059669';
      }
    }
  }

  async completeTopic(topicId, newAnswers, wrapperEl) {
    wrapperEl.classList.remove('expanded');
    wrapperEl.classList.add('completed');
    const rewardEl = wrapperEl.querySelector('.q-topic-reward');
    if(rewardEl) {
      rewardEl.innerHTML = '✔ ' + this.t('done');
      rewardEl.style.color = '#059669';
      rewardEl.style.background = 'rgba(52,211,153,0.15)';
    }

    setTimeout(async () => {
      if (!this._completedTopics.includes(topicId)) {
        this._completedTopics.push(topicId);
        this._points += 50;
        this._answers = { ...this._answers, ...newAnswers };
        
        localStorage.setItem('datamap_topics', JSON.stringify(this._completedTopics));
        localStorage.setItem('datamap_points', this._points);
        localStorage.setItem('datamap_answers', JSON.stringify(this._answers));
        
        this.updateUserUI();
        this.updateClaimUI();
        
        if (this._user) {
          try {
            await setDoc(doc(db, "users", this._user.uid), {
              points: this._points,
              completedTopics: this._completedTopics,
              answers: this._answers
            }, { merge: true });
          } catch (e) { console.error("Error saving to db", e); }
        } else {
          try {
            await setDoc(doc(db, "guest_predictions", this._guestId), {
              points: this._points,
              completedTopics: this._completedTopics,
              answers: this._answers,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) { console.error("Error saving guest data", e); }
        }
      }
    }, 400); 
  }

  applyLanguage() {
    const langLbl = this.$('#currentLangLabel');
    if (langLbl) langLbl.textContent = this._lang.toUpperCase();
    this.$$('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === this._lang);
    });

    this.$$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[this._lang] && I18N[this._lang][key]) {
        if(el.tagName === 'INPUT' && el.type === 'button') el.value = I18N[this._lang][key];
        else el.textContent = I18N[this._lang][key];
      }
    });

    this.$$('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (I18N[this._lang] && I18N[this._lang][key]) {
        el.placeholder = I18N[this._lang][key];
      }
    });

    this.$$('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (I18N[this._lang] && I18N[this._lang][key]) {
        el.innerHTML = I18N[this._lang][key];
      }
    });

    if (this.DATA && this.DATA._meta && this.DATA._meta.lastUpdated) {
       const d = new Date(this.DATA._meta.lastUpdated);
       this.$('#lastUpdated').textContent = this.t('updatedDate') + d.toLocaleDateString(this._lang === 'cs' ? 'cs-CZ' : 'en-US');
    }

    this.buildCategoryButtons();
    if (this.currentCategory) {
      this.$$('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.key === this.currentCategory));
      if (this.currentCategory !== 'commodities') {
         this.buildDataTypeButtons(this.currentCategory);
      }
    }
    if (this.currentDataType && this.currentCategory !== 'commodities') {
      this.$$('#dtBtns .btn').forEach(b => b.classList.toggle('active', b.dataset.key === this.currentDataType));
      this.buildSourceButtons(this.currentDataType);
    }
    if (this.currentSource && this.currentCategory !== 'commodities') {
      this.$$('#srcBtns .btn').forEach(b => { if (!b.classList.contains('disabled')) b.classList.toggle('active', b.dataset.key === this.currentSource); });
    }
    this.paint();

    this.$$('.cp').forEach(p => {
      p.dataset.name = this._lang === 'cs' ? (CS_COUNTRIES[p.dataset.code] || ALPHA2_TO_NAME[p.dataset.code]) : ALPHA2_TO_NAME[p.dataset.code];
    });

    if (this._selectedCountryCode) {
      this.$('#panelCountry').textContent = this._lang === 'cs' ? (CS_COUNTRIES[this._selectedCountryCode] || ALPHA2_TO_NAME[this._selectedCountryCode]) : ALPHA2_TO_NAME[this._selectedCountryCode];
      if(this.currentCategory === 'commodities') {
        const cData = window.COMMODITY_DATA[this._selectedCountryCode];
        this.$('#panelMetric').textContent = cData ? (cData.commodity[this._lang] || cData.commodity.en) : '';
      } else {
        this.$('#panelMetric').textContent = this.DATA[this.currentDataType] ? this.t(this.DATA[this.currentDataType].label) : '';
      }
      
      const activeBtn = this.$('.mode-btn.active');
      if (activeBtn) {
          if (activeBtn.dataset.mode === 'history') this.updateHistoryView(this.$('#histSlider').value);
          else if (activeBtn.dataset.mode === 'commodity') this.buildCommodityView(this._selectedCountryCode);
          else this.buildFutureView(this._selectedCountryCode);
      }
    }
    
    this.updateUserUI();
    if (this.$('#authModal').classList.contains('active') || this.$('#wizardModal').classList.contains('active')) {
      this.updateAuthUI();
    }
    if (this.$('#wizardModal').classList.contains('active') && this._wizardStep === 2) {
      this.renderQuestionnaireAccordion(); 
    }
    if (this.$('#accountModal').classList.contains('active') && this.$('#accTabPredictions').classList.contains('active')) {
      this.renderAccountPredictions();
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
    let cx = WORLD_VIEWBOX.w / 2;
    let cy = WORLD_VIEWBOX.h / 2;
    let scale;

    if (this._is3D) {
      scale = Math.min(WORLD_VIEWBOX.w, WORLD_VIEWBOX.h) / 2.2;
      const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ocean.setAttribute('cx', cx); ocean.setAttribute('cy', cy);
      ocean.setAttribute('r', scale); ocean.setAttribute('class', 'globe-ocean');
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
      fog.setAttribute('r', scale); fog.setAttribute('fill', 'url(#globeFog)');
      fog.setAttribute('pointer-events', 'none'); 
      svg.appendChild(fog);
    }

    this._isHighResVisible = null;
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

    if (this._selectedCountryCode) {
      const allPaths = this.$$(`.cp[data-code="${this._selectedCountryCode}"]`);
      allPaths.forEach(p => p.classList.add('selected'));
      const sOverlay = this.$('#selectOverlay');
      if (sOverlay && allPaths.length > 0) {
        let combinedD = '';
        allPaths.forEach(p => combinedD += p.getAttribute('d') + ' ');
        sOverlay.setAttribute('d', combinedD.trim());
        sOverlay.style.transition = 'none';
        sOverlay.style.clipPath = `circle(150% at 50% 50%)`;
      }
    }

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
        
        const mode = btn.dataset.mode;
        let viewId = '#viewHistory';
        if (mode === 'future') viewId = '#viewFuture';
        else if (mode === 'commodity') viewId = '#viewCommodity';
        
        let viewEl = this.$(viewId);
        viewEl.classList.add('active');
        this.$('#leftPanel').classList.add('open');
        
        if (mode === 'history') {
            const slider = this.$('#histSlider');
            slider.oninput = (ev) => this.updateHistoryView(ev.target.value);
            this.updateHistoryView(slider.value);
        } else if (mode === 'future') {
            this.buildFutureView(this._selectedCountryCode);
        } else if (mode === 'commodity') {
            this.buildCommodityView(this._selectedCountryCode);
        }
      };
    });
    this.$('#closeLeftBtn').onclick = () => this.closeLeftPanelOnly();
    this.paint();
  }

  _buildResolutionGroup(features, className, proj, precision) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    let pathGenerator;
    if (this._is3D) {
      const scale = Math.min(WORLD_VIEWBOX.w, WORLD_VIEWBOX.h) / 2.2;
      const projection = d3.geoOrthographic()
        .scale(scale)
        .translate([WORLD_VIEWBOX.w / 2, WORLD_VIEWBOX.h / 2])
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
      if (self.currentCategory === 'commodities' && !window.COMMODITY_DATA[pathEl.dataset.code]) return;
      
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
      if (self.currentCategory === 'commodities' && !window.COMMODITY_DATA[pathEl.dataset.code]) return;
      self.openSidePanel(pathEl.dataset.code, pathEl.dataset.name, pathEl, e); 
    });
    pathEl.addEventListener('touchstart', function(e) {
      if (self.currentCategory === 'commodities' && !window.COMMODITY_DATA[pathEl.dataset.code]) return;
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

    if (this.currentCategory === 'commodities') {
        const cData = window.COMMODITY_DATA[code];
        this.$('#panelMetric').textContent = cData ? (cData.commodity[this._lang] || cData.commodity.en) : '';
        this.$$('.mode-btn').forEach(b => { b.disabled = true; b.style.display = 'none'; });
        
        let cBtn = this.$('.mode-btn[data-mode="commodity"]');
        cBtn.style.display = 'block';
        cBtn.disabled = false;
        
        if (!this.$('#leftPanel').classList.contains('open')) {
            this.$('#leftPanel').classList.add('open');
            cBtn.click();
        } else {
            this.buildCommodityView(code);
        }
        return;
    }

    // Normal History/Future Flow
    this.$$('.mode-btn[data-mode="commodity"]').forEach(b => b.style.display = 'none');
    this.$$('.mode-btn:not([data-mode="commodity"])').forEach(b => b.style.display = 'block');
    this.$('#panelMetric').textContent = this.DATA[this.currentDataType] ? this.t(this.DATA[this.currentDataType].label) : '';

    const hasData = window.HISTORY_DATA && window.HISTORY_DATA[this.currentDataType] && window.HISTORY_DATA[this.currentDataType][code];
    if (!hasData) {
      this.$$('.mode-btn').forEach(b => { b.disabled = true; b.classList.remove('active'); });
      this.closeLeftPanelOnly();
      return;
    }
    this.$$('.mode-btn:not([data-mode="commodity"])').forEach(b => b.disabled = false);
    
    if (this.$('#leftPanel').classList.contains('open')) {
        const activeBtn = this.$('.mode-btn.active');
        if (activeBtn) {
            if (activeBtn.dataset.mode === 'history') this.updateHistoryView(this.$('#histSlider').value);
            else if (activeBtn.dataset.mode === 'future') this.buildFutureView(code);
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

  _typeText(el, text, speed = 15) {
    if (this._typingInterval) clearInterval(this._typingInterval);
    el.innerHTML = '<span class="text-content"></span><span class="ai-cursor"></span>';
    const contentEl = el.querySelector('.text-content');
    const cursorEl = el.querySelector('.ai-cursor');
    let i = 0;
    this._typingInterval = setInterval(() => {
      if (i < text.length) {
        contentEl.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(this._typingInterval);
        if (cursorEl) cursorEl.remove();
      }
    }, speed);
  }

  updateHistoryView(year) {
    const metricData = window.HISTORY_DATA[this.currentDataType][this._activeHistoryCode];
    if (!metricData) return;

    this.$('#yearLabels').querySelectorAll('span').forEach(span => {
      if (span.dataset.val === String(year)) span.classList.add('active');
      else span.classList.remove('active');
    });
    
    let svg = this.$('#histChart');
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
    
    this.$('#histInfoTxt').innerHTML = `<strong>${year} ${this.t('context')}</strong><br/><div class="typing-container"></div>`;
    this._typeText(this.$('#histInfoTxt').querySelector('.typing-container'), txt, 20);
  }

  buildFutureView(code) {
    const futData = window.FUTURE_DATA[this.currentDataType] && window.FUTURE_DATA[this.currentDataType][code];
    const container = this.$('#futFactors');
    container.innerHTML = '';
    
    const existingAiWrap = this.$('#futAiWrap');
    if (existingAiWrap) existingAiWrap.style.display = 'none';
    
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
    svg.innerHTML = `<defs><linearGradient id="futGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8395a7"/><stop offset="100%" stop-color="#34d399"/></linearGradient></defs>
                     <path class="chart-line" id="futLine" style="stroke: url(#futGrad); stroke-dasharray: 4 4;" />
                     <text x="12" y="118" class="fut-axis-label" text-anchor="start">2024</text>
                     <text x="268" y="118" class="fut-axis-label" text-anchor="end">2029</text>`;
    
    let aiWrap = this.$('#futAiWrap');
    if (!aiWrap) {
        aiWrap = document.createElement('div');
        aiWrap.className = 'ai-wrap';
        aiWrap.id = 'futAiWrap';
        aiWrap.innerHTML = `
            <button class="btn-ai" id="futAiBtn">
                <span class="btn-text">${this.t('askAI')}</span>
            </button>
            <div class="ai-explanation-box" id="futAiBox" style="display:none;">
                <div class="ai-header">${this.t('aiAnalysis')}</div>
                <div class="ai-content"></div>
            </div>
        `;
        this.$('#viewFuture').appendChild(aiWrap);
    }
    
    aiWrap.style.display = 'block';
    this.$('#futAiBox').style.display = 'none';
    const aiBtn = this.$('#futAiBtn');
    aiBtn.disabled = false;
    aiBtn.querySelector('.btn-text').textContent = this.t('askAI');
    
    aiBtn.onclick = async () => {
        aiBtn.disabled = true;
        aiBtn.querySelector('.btn-text').textContent = this.t('aiThinking');
        
        const checked = [];
        this.$$('.factor-cb:checked').forEach(cb => {
             const factor = futData.factors.find(f => f.id === cb.dataset.id);
             if(factor) checked.push(factor.yes.en); 
        });
        const unchecked = [];
        this.$$('.factor-cb:not(:checked)').forEach(cb => {
             const factor = futData.factors.find(f => f.id === cb.dataset.id);
             if(factor) unchecked.push(factor.no.en);
        });
        
        let factorsText = "Factors happening: " + (checked.join(', ') || "None") + ". Factors NOT happening: " + (unchecked.join(', ') || "None");
        const metricName = this.DATA[this.currentDataType] ? this.DATA[this.currentDataType].label : this.currentDataType;
        const targetValFmt = this.$('#futResultVal').textContent;
        const countryName = this._selectedCountryName;
        
        const langInstruction = this._lang === 'cs' ? "Reply completely in Czech language." : "Reply completely in English language.";
        const prompt = `Act as an expert financial/macro-economic analyst. Explain briefly (max 3 short sentences) why ${metricName} in ${countryName} is projected to reach ${targetValFmt} by 2029. Take into account these specific driving factors that the user selected: ${factorsText}. Be professional, analytical, and concise. ${langInstruction}`;
        
        try {
            const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
            if(!res.ok) throw new Error('API Error');
            const aiText = await res.text();
            
            this.$('#futAiBox').style.display = 'block';
            this._typeText(this.$('#futAiBox').querySelector('.ai-content'), aiText, 30);
            
            aiBtn.querySelector('.btn-text').textContent = this.t('aiAgain');
            aiBtn.disabled = false;
        } catch(e) {
            this.$('#futAiBox').style.display = 'block';
            this.$('#futAiBox').querySelector('.ai-content').textContent = this.t('aiError');
            aiBtn.disabled = false;
            aiBtn.querySelector('.btn-text').textContent = this.t('askAI');
        }
    };

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
    
    let minBound = Math.min(...minValues, ...maxValues, baseVal);
    let maxBound = Math.max(...minValues, ...maxValues, baseVal);
    if (minBound === maxBound) {
        minBound = baseVal * 0.9;
        maxBound = baseVal * 1.1;
    }
    const range = maxBound - minBound;

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
    
    const aiBox = this.$('#futAiBox');
    if (aiBox) aiBox.style.display = 'none';
    const aiBtn = this.$('#futAiBtn');
    if (aiBtn) {
       aiBtn.querySelector('.btn-text').textContent = this.t('askAI');
       aiBtn.disabled = false;
    }
  }
  
  /* ============================================================
     COMMODITY VIEW (NEW STEP 2)
     ============================================================ */
  buildCommodityView(code) {
      let viewEl = this.$('#viewCommodity');
      if(!viewEl) return;
      viewEl.innerHTML = '';
      
      const cData = window.COMMODITY_DATA[code];
      if(!cData) {
          viewEl.innerHTML = `<div style="text-align:center; padding: 20px; color:#8395a7;">${this.t('noProj')}</div>`;
          return;
      }
      
      let opinionMod = 0;
      if (this._answers['q2_3'] === 'yes') opinionMod += 0.05; 
      if (this._answers['q3_3'] === 'yes') opinionMod += 0.05; 
      if (this._answers['q3_1'] === 'no')  opinionMod += 0.05; 
      if (this._answers['q1_2'] === 'yes') opinionMod += 0.03; 
      
      const hasOpinion = opinionMod > 0;
      const basePrice = cData.base_price;
      
      const headerHtml = `
        <div class="future-desc" id="commDesc">${cData.desc[this._lang] || cData.desc.en}</div>
        <div class="user-sentiment-badge ${hasOpinion ? 'active' : ''}" id="userSentBadge">
            ${this.t('userSent')}+${Math.round(opinionMod * 100)}%
        </div>
        <div class="chart-container"><svg class="chart-svg" id="commChart"></svg></div>
        <div class="future-factors" id="commFactors"></div>
        <div class="future-result" id="commResult"></div>
      `;
      viewEl.innerHTML = headerHtml;
      
      const factorContainer = this.$('#commFactors');
      cData.factors.forEach((f) => {
          const div = document.createElement('div'); div.className = 'factor-row';
          div.innerHTML = `
            <label class="factor-label">
              <input type="checkbox" class="factor-cb comm-cb" data-id="${f.id}">
              <span class="cb-custom"></span><span class="factor-title">${f.title[this._lang] || f.title.en}</span>
            </label>
            <div class="factor-info-btn">i
              <div class="factor-tooltip">
                <strong>${this.t('context')}</strong> ${f.info[this._lang] || f.info.en}<br/><br/>
                <span style="color:#27ae60">✔ ${f.yes[this._lang] || f.yes.en}</span><br/><span style="color:#c0392b">✘ ${f.no[this._lang] || f.no.en}</span>
              </div>
            </div>`;
          div.querySelector('.comm-cb').onchange = () => this.updateCommodityChart(code, cData, opinionMod);
          factorContainer.appendChild(div);
      });
      
      const svg = this.$('#commChart');
      svg.innerHTML = `<defs><linearGradient id="commGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#b45309"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>
                       <path class="chart-line" id="commLine" style="stroke: url(#commGrad); stroke-dasharray: 4 4;" />
                       <text x="12" y="118" class="fut-axis-label" text-anchor="start">2024</text>
                       <text x="268" y="118" class="fut-axis-label" text-anchor="end">2029</text>`;
                       
      let aiWrap = document.createElement('div');
      aiWrap.className = 'ai-wrap';
      aiWrap.id = 'commAiWrap';
      aiWrap.innerHTML = `
          <button class="btn-ai" id="commAiBtn">
              <span class="btn-text">${this.t('askAI')}</span>
          </button>
          <div class="ai-explanation-box" id="commAiBox" style="display:none;">
              <div class="ai-header">${this.t('aiAnalysis')}</div>
              <div class="ai-content"></div>
          </div>
      `;
      viewEl.appendChild(aiWrap);
      
      const aiBtn = this.$('#commAiBtn');
      aiBtn.onclick = async () => {
          aiBtn.disabled = true;
          aiBtn.querySelector('.btn-text').textContent = this.t('aiThinking');
          
          const checked = [];
          this.$$('.comm-cb:checked').forEach(cb => {
               const factor = cData.factors.find(f => f.id === cb.dataset.id);
               if(factor) checked.push(factor.yes.en); 
          });
          const unchecked = [];
          this.$$('.comm-cb:not(:checked)').forEach(cb => {
               const factor = cData.factors.find(f => f.id === cb.dataset.id);
               if(factor) unchecked.push(factor.no.en);
          });
          
          let factorsText = "Factors happening: " + (checked.join(', ') || "None") + ". Factors NOT happening: " + (unchecked.join(', ') || "None");
          const metricName = cData.commodity.en;
          const targetValFmt = this.$('#commResultVal').textContent;
          const countryName = this._selectedCountryName;
          
          const langInstruction = this._lang === 'cs' ? "Reply completely in Czech language." : "Reply completely in English language.";
          const prompt = `Act as an expert commodities analyst. Explain briefly (max 3 short sentences) why the price of ${metricName} is projected to reach ${targetValFmt} by 2029 due to developments in ${countryName}. Take into account these specific driving factors that the user selected: ${factorsText}. Also mention the market sentiment premium if it is impacting prices. Be professional, analytical, and concise. ${langInstruction}`;
          
          try {
              const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
              if(!res.ok) throw new Error('API Error');
              const aiText = await res.text();
              
              this.$('#commAiBox').style.display = 'block';
              this._typeText(this.$('#commAiBox').querySelector('.ai-content'), aiText, 30);
              
              aiBtn.querySelector('.btn-text').textContent = this.t('aiAgain');
              aiBtn.disabled = false;
          } catch(e) {
              this.$('#commAiBox').style.display = 'block';
              this.$('#commAiBox').querySelector('.ai-content').textContent = this.t('aiError');
              aiBtn.disabled = false;
              aiBtn.querySelector('.btn-text').textContent = this.t('askAI');
          }
      };

      // PROOF SECTION (Country Specific)
      if (cData.proof) {
          const proofDiv = document.createElement('div');
          proofDiv.className = 'proof-section';
          proofDiv.innerHTML = `
            <div class="sec-title">${this.t('proofTitle')} - ${cData.proof.scenario[this._lang] || cData.proof.scenario.en}</div>
            <div style="font-size:0.75rem; color:#8395a7; margin-bottom:8px;">${cData.proof.commodity[this._lang] || cData.proof.commodity.en} (${cData.proof.unit})</div>
            <div class="future-factors" id="countryProofFactors" style="margin-bottom:12px;"></div>
            <div class="chart-container" style="height:90px;"><svg class="chart-svg" id="countryProofChart"></svg></div>
            <div style="text-align:center; font-size:0.8rem; font-weight:bold; color:#1e3a5f; margin-top:8px;" id="countryProofResult"></div>
          `;
          viewEl.appendChild(proofDiv);
          
          const pFactorCont = this.$('#countryProofFactors');
          cData.proof.factors.forEach((f) => {
              const fDiv = document.createElement('div'); fDiv.className = 'factor-row';
              fDiv.innerHTML = `
                <label class="factor-label" style="font-size:0.75rem;">
                  <input type="radio" name="cProofGroup" class="factor-cb cproof-cb" data-id="${f.id}" ${f.isTrue ? 'checked' : ''}>
                  <span class="cb-custom" style="width:14px; height:14px; border-radius:50%;"></span>
                  <span class="factor-title" style="font-size:0.75rem;">
                    ${f.title[this._lang] || f.title.en} ${f.isTrue ? `<strong style="color:#d97706">(${this.t('proofActual')})</strong>` : ''}
                  </span>
                </label>
              `;
              fDiv.querySelector('.cproof-cb').onchange = () => this.updateCountryProofChart(code, cData.proof);
              pFactorCont.appendChild(fDiv);
          });
          
          const pSvg = this.$('#countryProofChart');
          pSvg.innerHTML = `<path class="chart-line" id="countryProofLine" style="stroke: #d97706; stroke-width: 2;" />
                           <text x="12" y="85" class="fut-axis-label" text-anchor="start">T1</text>
                           <text x="268" y="85" class="fut-axis-label" text-anchor="end">T4</text>`;
          this.updateCountryProofChart(code, cData.proof);
      }

      this.updateCommodityChart(code, cData, opinionMod, true);
  }
  
  updateCommodityChart(code, cData, opinionMod, isInitial = false) {
      const baseVal = cData.base_price;
      let impacts = [0, 0, 0, 0, 0];
      let minImpacts = [0, 0, 0, 0, 0];
      let maxImpacts = [0, 0, 0, 0, 0];
      
      this.$$('.comm-cb').forEach(cb => {
          const factor = cData.factors.find(f => f.id === cb.dataset.id);
          if(!factor) return;
          for(let i=0; i<5; i++) {
              if (cb.checked) impacts[i] += factor.impact[i];
              if (factor.impact[i] > 0) maxImpacts[i] += factor.impact[i]; else minImpacts[i] += factor.impact[i];
          }
      });
      
      for(let i=0; i<5; i++) {
          impacts[i] += (baseVal * opinionMod);
          maxImpacts[i] += (baseVal * opinionMod);
          minImpacts[i] += (baseVal * opinionMod);
      }

      const years = [2024, 2025, 2026, 2027, 2028, 2029];
      const calcValues = (impArr) => { const v = [baseVal]; for(let i=0; i<5; i++) v.push(v[i] + impArr[i]); return v; };
      
      const minValues = calcValues(minImpacts), maxValues = calcValues(maxImpacts), currentValues = calcValues(impacts);
      let minBound = Math.min(...minValues, ...maxValues, baseVal);
      let maxBound = Math.max(...minValues, ...maxValues, baseVal);
      if (minBound === maxBound) {
          minBound = baseVal * 0.9;
          maxBound = baseVal * 1.1;
      }
      const range = maxBound - minBound;

      const svg = this.$('#commChart'); if (!svg) return;
      const w = 280, h = 120, pad = 12;
      if(isInitial) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      
      let pathD = "";
      years.forEach((y, i) => {
          const cx = pad + (i / (years.length - 1)) * (w - pad * 2);
          const cy = h - pad - ((currentValues[i] - minBound) / range) * (h - pad * 2);
          pathD += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
          
          let pt = svg.querySelector(`#cp${i}`); let lbl = svg.querySelector(`#cl${i}`);
          if (!pt) {
            pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); pt.setAttribute('id', `cp${i}`); pt.setAttribute('r', '4'); pt.setAttribute('class', 'chart-point fut-point'); pt.style.fill = '#f59e0b'; svg.appendChild(pt);
            lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text'); lbl.setAttribute('id', `cl${i}`); lbl.setAttribute('class', 'fut-label'); svg.appendChild(lbl);
          }
          pt.style.transform = `translate(${cx}px, ${cy}px)`; lbl.style.transform = `translate(${cx}px, ${cy - 10}px)`;

          if (i === 0) { lbl.textContent = fmt(currentValues[i], cData.unit, k=>this.t(k)); lbl.setAttribute('text-anchor', 'start'); } 
          else if (i === 5) {
            lbl.setAttribute('text-anchor', 'end');
            if (this._lastCommVal !== undefined && !isNaN(this._lastCommVal) && !isNaN(currentValues[i])) animateValue(lbl, this._lastCommVal, currentValues[i], cData.unit, 300, k=>this.t(k));
            else lbl.textContent = fmt(currentValues[i], cData.unit, k=>this.t(k));
          } else lbl.textContent = '';
      });
      
      const line = svg.querySelector('#commLine');
      if (line) line.setAttribute('d', pathD);

      const targetVal = currentValues[5];
      let resultContainer = this.$('#commResultVal');
      if (!resultContainer) {
        this.$('#commResult').innerHTML = `${this.t('projected')}<strong id="commResultVal" style="color:#d97706">${fmt(targetVal, cData.unit, k=>this.t(k))}</strong>`;
        resultContainer = this.$('#commResultVal');
        this._lastCommVal = targetVal;
      }
      if (this._lastCommVal !== undefined && !isNaN(this._lastCommVal) && !isNaN(targetVal)) animateValue(resultContainer, this._lastCommVal, targetVal, cData.unit, 300, k=>this.t(k));
      else resultContainer.textContent = fmt(targetVal, cData.unit, k=>this.t(k));
      this._lastCommVal = targetVal;
      
      const aiBox = this.$('#commAiBox');
      if (aiBox) aiBox.style.display = 'none';
      const aiBtn = this.$('#commAiBtn');
      if (aiBtn) {
         aiBtn.querySelector('.btn-text').textContent = this.t('askAI');
         aiBtn.disabled = false;
      }
  }

  updateCountryProofChart(code, proofData) {
      if(!proofData) return;
      const baseVal = proofData.base_price;
      const years = [0, 1, 2, 3]; 
      
      let impacts = [0, 0, 0, 0];
      const activeCb = this.$('.cproof-cb:checked');
      if (activeCb) {
          const factor = proofData.factors.find(f => f.id === activeCb.dataset.id);
          if (factor) impacts = factor.impact;
      }
      
      const currentValues = [baseVal, baseVal + impacts[0], baseVal + impacts[1], baseVal + impacts[2], baseVal + impacts[3]];
      
      let minB = baseVal, maxB = baseVal;
      proofData.factors.forEach(f => {
          f.impact.forEach(v => {
              if (baseVal + v < minB) minB = baseVal + v;
              if (baseVal + v > maxB) maxB = baseVal + v;
          });
      });
      if (minB === maxB) { minB = baseVal * 0.9; maxB = baseVal * 1.1; }
      const range = maxB - minB;

      const svg = this.$('#countryProofChart'); if (!svg) return;
      const w = 250, h = 70, pad = 8;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      
      let pathD = "";
      [0,1,2,3,4].forEach((y, i) => {
          const cx = pad + (i / 4) * (w - pad * 2);
          const cy = h - pad - ((currentValues[i] - minB) / range) * (h - pad * 2);
          pathD += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
          
          let pt = svg.querySelector(`#cprp${i}`); 
          if (!pt) {
            pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); pt.setAttribute('id', `cprp${i}`); pt.setAttribute('r', '3'); pt.setAttribute('class', 'chart-point'); pt.style.fill = '#b45309'; svg.appendChild(pt);
          }
          pt.style.transform = `translate(${cx}px, ${cy}px)`;
      });
      
      const line = svg.querySelector('#countryProofLine');
      if (line) line.setAttribute('d', pathD);
      
      this.$('#countryProofResult').innerHTML = `${this.t('simulatedPrice')} <span style="color:#d97706">${fmt(currentValues[3], proofData.unit)}</span>`;
  }

  // General Proof in the right panel
  buildGeneralProof() {
      let dtWrapper = this.$('#dtWrapper');
      if (!dtWrapper) {
          const dtDiv = this.$('#dtBtns').parentElement;
          const srcDiv = this.$('#srcBtns').parentElement;
          
          dtWrapper = document.createElement('div'); dtWrapper.id = 'dtWrapper';
          dtDiv.parentNode.insertBefore(dtWrapper, dtDiv);
          dtWrapper.appendChild(dtDiv);

          const srcWrapper = document.createElement('div'); srcWrapper.id = 'srcWrapper';
          srcDiv.parentNode.insertBefore(srcWrapper, srcDiv);
          srcWrapper.appendChild(srcDiv);
      }

      let genProofAcc = this.$('#generalProofAcc');
      if (!genProofAcc) {
          const pData = window.PROOF_DATA;
          genProofAcc = document.createElement('div');
          genProofAcc.id = 'generalProofAcc';
          genProofAcc.className = 'proof-accordion open';
          genProofAcc.style.display = 'none'; 
          
          genProofAcc.innerHTML = `
              <button class="proof-acc-btn">
                  <span style="font-weight:700; color:#b45309; font-size:0.8rem;">${this.t('proofTitle')}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#b45309" style="transition: transform 0.3s;"><path d="M7 10l5 5 5-5z"/></svg>
              </button>
              <div class="proof-acc-body">
                  <div style="font-size:0.75rem; color:#8395a7; margin-bottom:8px;" id="genProofDesc">...</div>
                  <div class="future-factors" id="genProofFactors" style="margin-bottom:12px;"></div>
                  <div class="chart-container" style="height:90px;"><svg class="chart-svg" id="genProofChart"></svg></div>
                  <div style="text-align:center; font-size:0.8rem; font-weight:bold; color:#1e3a5f; margin-top:8px;" id="genProofResult"></div>
              </div>
          `;
          this.$('.controls').appendChild(genProofAcc);
          
          genProofAcc.querySelector('.proof-acc-btn').onclick = () => {
              genProofAcc.classList.toggle('open');
          };
          
          const pFactorCont = genProofAcc.querySelector('#genProofFactors');
          pData.factors.forEach((f) => {
              const fDiv = document.createElement('div'); fDiv.className = 'factor-row';
              fDiv.innerHTML = `
                <label class="factor-label" style="font-size:0.75rem;">
                  <input type="radio" name="genProofGroup" class="factor-cb gproof-cb" data-id="${f.id}" ${f.isTrue ? 'checked' : ''}>
                  <span class="cb-custom" style="width:14px; height:14px; border-radius:50%;"></span>
                  <span class="factor-title" style="font-size:0.75rem;">
                    ${f.title[this._lang] || f.title.en} ${f.isTrue ? `<strong style="color:#d97706">(${this.t('proofActual')})</strong>` : ''}
                  </span>
                </label>
              `;
              fDiv.querySelector('.gproof-cb').onchange = () => this.updateGeneralProofChart();
              pFactorCont.appendChild(fDiv);
          });
          
          const pSvg = genProofAcc.querySelector('#genProofChart');
          pSvg.innerHTML = `<path class="chart-line" id="genProofLine" style="stroke: #d97706; stroke-width: 2;" />
                           <text x="12" y="85" class="fut-axis-label" text-anchor="start">1989</text>
                           <text x="268" y="85" class="fut-axis-label" text-anchor="end">1992</text>`;
      }
      
      const pData = window.PROOF_DATA;
      this.$('#genProofDesc').textContent = `${pData.scenario[this._lang] || pData.scenario.en} - ${pData.commodity[this._lang] || pData.commodity.en} (${pData.unit})`;
      this.updateGeneralProofChart();

      if (this.currentCategory === 'commodities') {
          this.$('#dtWrapper').style.display = 'none';
          this.$('#srcWrapper').style.display = 'none';
          genProofAcc.style.display = 'block';
      } else {
          this.$('#dtWrapper').style.display = 'block';
          this.$('#srcWrapper').style.display = 'block';
          genProofAcc.style.display = 'none';
      }
  }

  updateGeneralProofChart() {
      const pData = window.PROOF_DATA;
      if(!pData) return;
      const baseVal = pData.base_price;
      const years = [0, 1, 2, 3];
      
      let impacts = [0, 0, 0, 0];
      const activeCb = this.$('.gproof-cb:checked');
      if (activeCb) {
          const factor = pData.factors.find(f => f.id === activeCb.dataset.id);
          if (factor) impacts = [0, factor.impact[0], factor.impact[1], factor.impact[2]];
      }
      
      const currentValues = years.map((y, i) => baseVal + impacts[i]);
      let minBound = 5; 
      let maxBound = 40; 
      if (minBound === maxBound) { minBound = baseVal * 0.9; maxBound = baseVal * 1.1; }
      const range = maxBound - minBound;

      const svg = this.$('#genProofChart'); if (!svg) return;
      const w = 250, h = 70, pad = 8;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      
      let pathD = "";
      years.forEach((y, i) => {
          const cx = pad + (i / (years.length - 1)) * (w - pad * 2);
          const cy = h - pad - ((currentValues[i] - minBound) / range) * (h - pad * 2);
          pathD += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
          
          let pt = svg.querySelector(`#gprp${i}`); 
          if (!pt) {
            pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); pt.setAttribute('id', `gprp${i}`); pt.setAttribute('r', '3'); pt.setAttribute('class', 'chart-point'); pt.style.fill = '#b45309'; svg.appendChild(pt);
          }
          pt.style.transform = `translate(${cx}px, ${cy}px)`;
      });
      
      const line = svg.querySelector('#genProofLine');
      if (line) line.setAttribute('d', pathD);
      
      this.$('#genProofResult').innerHTML = `${this.t('simulatedPrice')} <span style="color:#d97706">$${currentValues[2].toFixed(2)}</span> (1991)`;
  }
  
  // ============================================================

  html() {
    return `<style>
  /* Prevents FOUC (Flash of Unstyled Content) while external CSS loads */
  .modal-overlay { opacity: 0; pointer-events: none; visibility: hidden; }
  .modal-overlay.active { opacity: 1; pointer-events: auto; visibility: visible; }
  </style>
  <div class="app">
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

      <div class="nav-actions">
        <button class="btn-action btn-predict" id="btnPredict">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.1-.96-2.17-1.92H8c.07 1.8 1.15 3.03 2.9 3.42V20h2.25v-1.64c1.78-.34 2.85-1.43 2.85-3.04 0-2.16-1.75-2.82-3.69-3.32z"/></svg>
          <span data-i18n="btnPredict">Predict & Earn</span>
        </button>
        <button class="btn-action btn-account" id="btnAccount">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span id="accLabel" data-i18n="btnLogReg">Log in</span>
          <span id="accPoints" style="background: rgba(52,211,153,0.2); padding: 2px 6px; border-radius: 6px; font-size: 0.75rem; margin-left: 4px; color: #059669;">0 Pts</span>
        </button>
      </div>
      
    </div>
  </nav>

  <div id="initLoader" class="init-loader"><div class="orbit"></div><span data-i18n="loading">Loading map & data…</span></div>
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
      
      <div class="panel-wrapper" id="panelWrapper">
        <div class="mode-bar" id="modeBar">
          <button class="mode-btn" data-mode="history" data-i18n="history" disabled>HISTORY</button>
          <button class="mode-btn" data-mode="future" data-i18n="future" disabled>FUTURE</button>
          <button class="mode-btn" data-mode="commodity" data-i18n="Commodities" style="display:none;" disabled>COMMODITIES</button>
        </div>
        <div class="side-panel left glass" id="leftPanel">
          <button class="close-btn" id="closeLeftBtn">✕</button>
          <div><div class="history-header" id="panelCountry" data-i18n="country">Country</div><div class="history-sub" id="panelMetric" data-i18n="metric">Metric</div></div>
          
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

          <div id="viewFuture" class="panel-view">
            <div class="future-desc" id="futDesc" data-i18n="desc">Description</div>
            <div class="chart-container"><svg class="chart-svg" id="futChart"></svg></div>
            <div class="future-factors" id="futFactors"></div>
            <div class="future-result" id="futResult"></div>
          </div>

          <div id="viewCommodity" class="panel-view"></div>
        </div>
      </div>
    </div>
    
    <div class="controls glass">
      <div><div class="sec-title" data-i18n="category">Category</div><div class="cat-tabs" id="catBtns"></div></div>
      <div id="dtWrapper"><div><div class="sec-title" data-i18n="dataType">Data Type</div><div class="btn-group" id="dtBtns"></div></div></div>
      <div id="srcWrapper"><div><div class="sec-title" data-i18n="source">Source</div><div class="btn-group" id="srcBtns"></div></div></div>
      
      <!-- Right Panel Accordion (General Proof) -->
      <div id="generalProofAcc" class="proof-accordion open" style="display:none;">
        <button class="proof-acc-btn">
          <span style="font-weight:700; color:#b45309; font-size:0.8rem;" data-i18n="proofTitle">Proof of Concept</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#b45309" style="transition: transform 0.3s;"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <div class="proof-acc-body">
          <div style="font-size:0.75rem; color:#8395a7; margin-bottom:8px;" id="genProofDesc"></div>
          <div class="future-factors" id="genProofFactors" style="margin-bottom:12px;"></div>
          <div class="chart-container" style="height:90px;"><svg class="chart-svg" id="genProofChart"></svg></div>
          <div style="text-align:center; font-size:0.8rem; font-weight:bold; color:#1e3a5f; margin-top:8px;" id="genProofResult"></div>
        </div>
      </div>

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

<!-- WIZARD MODAL (Predict & Earn) -->
<div class="modal-overlay" id="wizardModal">
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <div class="stepper">
      <div class="step" data-step="1">1</div><div class="step-line" data-line="1"></div>
      <div class="step" data-step="2">2</div><div class="step-line" data-line="2"></div>
      <div class="step" data-step="3">3</div>
    </div>
    
    <div class="wiz-view" id="wizStep1">
      <img src="https://raw.githubusercontent.com/trail-blazer2/data-comparison-map/refs/heads/main/p1.png" class="wiz-img" alt="">
      <h2 class="modal-title" data-i18n="wizTitle">Help Predict the Future</h2>
      <p class="modal-desc" data-i18n="wizDesc">Share your prediction and get points. You are contributing to the best investment prediction tool in the world.</p>
      <button class="btn-primary-large" id="btnStartWizard" data-i18n="wizBtnStart">Start Predicting</button>
    </div>

    <div class="wiz-view" id="wizStep2">
      <div id="qList"></div>
    </div>

    <div class="wiz-view" id="wizStep3">
      <img id="wizAuthImg" src="https://raw.githubusercontent.com/trail-blazer2/data-comparison-map/refs/heads/main/p3.png" class="wiz-img" alt="">
      <h2 class="modal-title" id="wizAuthTitle" data-i18n="authTitleSave">Save Your Points!</h2>
      <p class="modal-desc" id="wizAuthDesc" data-i18n="authDescSave">Create a free account to secure the points you just earned and track your prediction accuracy.</p>
      <form id="authForm" style="margin-bottom:12px;">
        <input type="email" id="authEmail" class="auth-input" data-i18n-placeholder="emailPlaceholder" placeholder="Email Address" required>
        <input type="password" id="authPass" class="auth-input" data-i18n-placeholder="passPlaceholder" placeholder="Create a Password" required>
        <div class="auth-legal" id="wizAuthLegal">
          <input type="checkbox" required id="wizGdprCheck">
          <span data-i18n-html="authGdpr">I agree to the <a href="terms.html" target="_blank" class="legal-link">Terms of Service</a> and <a href="privacy.html" target="_blank" class="legal-link">Privacy Policy</a>.</span>
        </div>
        <button type="submit" id="authSubmitBtn" class="btn-primary-large" data-i18n="btnSignUp">Sign Up & Save Points</button>
      </form>
      <button class="switch-auth-mode" id="switchAuthBtn" data-i18n="btnSwitchToLogin">Already have an account? Log in</button>
    </div>
  </div>
</div>

<!-- STANDALONE AUTH MODAL -->
<div class="modal-overlay" id="authModal">
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <img id="stdAuthImg" src="https://raw.githubusercontent.com/trail-blazer2/data-comparison-map/refs/heads/main/p3.png" class="wiz-img" alt="">
    <h2 class="modal-title" id="standaloneAuthTitle" data-i18n="authTitleSave">Save Your Points!</h2>
    <p class="modal-desc" id="standaloneAuthDesc" data-i18n="authDescSave">Create a free account to secure the points you just earned and track your prediction accuracy.</p>
    <form id="standaloneAuthForm" style="margin-bottom:12px;">
      <input type="email" id="standaloneAuthEmail" class="auth-input" data-i18n-placeholder="emailPlaceholder" placeholder="Email Address" required>
      <input type="password" id="standaloneAuthPass" class="auth-input" data-i18n-placeholder="passPlaceholder" placeholder="Password" required>
      <div class="auth-legal" id="stdAuthLegal">
        <input type="checkbox" required id="stdGdprCheck">
        <span data-i18n-html="authGdpr">I agree to the <a href="terms.html" target="_blank" class="legal-link">Terms of Service</a> and <a href="privacy.html" target="_blank" class="legal-link">Privacy Policy</a>.</span>
      </div>
      <button type="submit" id="standaloneAuthSubmitBtn" class="btn-primary-large" data-i18n="btnSignUp">Sign Up & Save Points</button>
    </form>
    <button class="switch-auth-mode" id="standaloneSwitchAuthBtn" data-i18n="btnSwitchToLogin">Already have an account? Log in</button>
  </div>
</div>

<!-- ACCOUNT MODAL (Wider Dashboard Style) -->
<div class="modal-overlay" id="accountModal">
  <div class="modal-content wide">
    <button class="modal-close">✕</button>
    
    <div class="acc-layout">
      <!-- Sidebar -->
      <div class="acc-sidebar">
        <h2 class="modal-title" style="margin-bottom: 24px; padding: 0 10px;" data-i18n="accTitle">Your Account</h2>
        <button class="acc-tab-btn active" data-tab="Dashboard" data-i18n="accMenuDash">Dashboard</button>
        <button class="acc-tab-btn" data-tab="Predictions" data-i18n="accMenuPred">Your Predictions</button>
        <div style="flex:1"></div>
        <div style="margin-top: 16px; margin-bottom: 8px;">
          <button class="btn-action btn-upgrade" id="btnUpgradeAcc" style="width: 100%; justify-content: center;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span data-i18n="btnUpgrade">Upgrade</span>
          </button>
        </div>
        <button class="btn-text" id="btnSignOut" data-i18n="btnSignOut" style="text-align:left; padding: 12px 16px;">Sign Out</button>
      </div>
      
      <!-- Content Area -->
      <div class="acc-content">
        <!-- Dashboard Tab -->
        <div class="acc-tab-view active" id="accTabDashboard">
          <div class="acc-box">
            <div class="acc-email" id="accEmail">loading...</div>
            <div class="acc-pts" id="accPointsModal">0 Pts</div>
          </div>
          <div class="tier-box active">
            <span class="tier-name" data-i18n="tierFree">Free User</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1e3a5f"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <div class="tier-box locked">
            <span class="tier-name" data-i18n="tierPro">Pro Membership (Coming Soon)</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#8395a7"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
          </div>
        </div>
        
        <!-- Predictions Tab -->
        <div class="acc-tab-view" id="accTabPredictions">
          <h3 style="margin-top:0; color:#1e3a5f;" data-i18n="accMenuPred">Your Predictions</h3>
          <div id="accPredList"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PRO UPGRADE MODAL -->
<div class="modal-overlay" id="proModal">
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <span class="pro-badge">Coming Soon</span>
    <h2 class="modal-title" data-i18n="proModalTitle">DataMap Pro</h2>
    <p class="modal-desc" data-i18n="proModalDesc">Get ready for institutional-grade intelligence. Our Pro tier bypasses standard government data lag by integrating real-time alternative data to power our predictive algorithms.</p>
    <ul class="pro-features">
      <li><span class="pro-icon">🛰️</span> <span data-i18n="proSat"><strong>Satellite Imagery Analytics:</strong> Tracking factory outputs and shipping lane congestion in real-time.</span></li>
      <li><span class="pro-icon">🌐</span> <span data-i18n="proSoc"><strong>Social Sentiment & Scraping:</strong> Advanced web-scraping of corporate hiring trends and global announcements.</span></li>
      <li><span class="pro-icon">🤖</span> <span data-i18n="proAlgo"><strong>Algorithmic Predictive Modeling:</strong> See exactly how macro-events alter GDP trajectories 5 years before they happen.</span></li>
    </ul>
    <p style="font-size: 0.85rem; color: #8395a7; font-style: italic;" data-i18n="proNote">*Use your earned Points to unlock early access when we launch.</p>
  </div>
</div>`;
  }
}

customElements.define('data-comparison-map', DataComparisonMap);
