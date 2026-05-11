// Hardcoded Historical Data (2020-2024)
window.HISTORY_DATA = {
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
window.FUTURE_DATA = {
  gdp_per_capita: {
    CZ: {
      desc: "The Czech Republic's growth isn't really decided in Prague; it’s decided by consumer demand in Germany, trade policy in Washington, and the global price of gas/electricity.",
      base_growth: [0.005, 0.008, 0.010, 0.005, 0.002], // Peak mid-term, slowing down
      factors: [
        { id: "cz_auto", title: "Does the German Auto Industry Recover?", info: "Since the Czech Republic is essentially an industrial sub-supplier for Germany, our GDP is tied to their success.", yes: "If German car brands successfully pivot to EVs, Czech factories will boom.", no: "If Germany stays in a recession, the Czech Republic's industrial core will shrink.", impact: [0.005, 0.010, 0.020, 0.030, 0.035] },
        { id: "cz_trade", title: "Do Global Trade Tariffs Stay Low?", info: "The Czech Republic is one of the most export-dependent countries in the world.", yes: "If global trade remains open, Czech products will continue to drive growth.", no: "If the US imposes heavy tariffs, it will devastate Czech exports.", impact: [0.010, 0.015, 0.015, 0.015, 0.015] },
        { id: "cz_energy", title: "Will Energy Prices Stabilize?", info: "Czech industry is 'energy-heavy' (steel, glass, chemicals, automotive).", yes: "If the Czech Republic builds out new nuclear blocks, factories will stay.", no: "If electricity stays expensive, manufacturers will move.", impact: [-0.005, 0.00, 0.01, 0.02, 0.02] }
      ]
    },
    DE: {
      desc: "Germany is transitioning from an export-led industrial powerhouse to a more service-oriented economy amidst severe demographic and energy challenges.",
      base_growth: [-0.005, 0.00, 0.005, 0.008, 0.01], // J-Curve recovery
      factors: [
        { id: "de_energy", title: "Successful Green Energy Transition?", info: "Germany's 'Energiewende' must provide cheap, reliable power for heavy industry.", yes: "Abundant renewables lower industrial costs, keeping manufacturing domestic.", no: "High energy costs cause deindustrialization and capital flight.", impact: [0.00, 0.005, 0.015, 0.025, 0.03] },
        { id: "de_tech", title: "Can Germany Catch Up in AI & Software?", info: "Germany dominates hardware but lags in global software and AI sectors.", yes: "Massive EU/state investment creates a booming European tech hub.", no: "Continued reliance on legacy mechanics limits productivity growth.", impact: [0.005, 0.010, 0.015, 0.015, 0.015] },
        { id: "de_labor", title: "Integration of Skilled Migrants?", info: "With a rapidly aging workforce, Germany needs millions of skilled workers.", yes: "Successful integration fills labor shortages and boosts consumption.", no: "Labor shortages cripple mid-sized 'Mittelstand' companies.", impact: [0.01, 0.01, 0.01, 0.01, 0.01] }
      ]
    },
    US: {
      desc: "The US economy relies on massive consumer spending, global dollar dominance, and undisputed leadership in the technology and financial sectors.",
      base_growth: [0.015, 0.012, 0.010, 0.015, 0.020], // Mild dip then boom
      factors: [
        { id: "us_ai", title: "Does AI Drive the Next Productivity Boom?", info: "The US leads the global AI race, which promises massive efficiency gains.", yes: "AI adoption creates a 'Roaring 2020s' productivity miracle.", no: "AI proves to be a bubble with minimal real-world economic translation.", impact: [0.005, 0.015, 0.030, 0.040, 0.045] },
        { id: "us_debt", title: "Can the US Manage its National Debt?", info: "Rising interest rates make the massive US deficit more expensive to maintain.", yes: "Fiscal discipline and high growth naturally shrink the debt burden.", no: "Debt servicing crowds out infrastructure and research investments.", impact: [0.005, 0.010, 0.010, 0.015, 0.015] },
        { id: "us_reshoring", title: "Does 'Made in America' Reshoring Succeed?", info: "Trillions are being spent to bring chip and battery manufacturing back to the US.", yes: "New domestic factories create high-paying jobs and secure supply chains.", no: "High domestic labor costs make reshored products uncompetitive globally.", impact: [0.00, 0.005, 0.010, 0.020, 0.025] }
      ]
    },
    CN: {
      desc: "China is shifting from real-estate and infrastructure-led growth to high-tech manufacturing, while battling deflation and a shrinking population.",
      base_growth: [0.04, 0.035, 0.03, 0.025, 0.02], // Gradual slowdown curve
      factors: [
        { id: "cn_export", title: "Do Chinese EVs Dominate Global Markets?", info: "China has massively subsidized its EV and solar panel industries.", yes: "Chinese brands become the global standard, driving massive export wealth.", no: "Western tariffs block Chinese cars, stalling the manufacturing engine.", impact: [0.01, 0.02, 0.025, 0.03, 0.03] },
        { id: "cn_property", title: "Does the Real Estate Market Stabilize?", info: "Property once drove 25% of China's GDP, but is now in a managed decline.", yes: "The government safely absorbs bad debts, restoring consumer confidence.", no: "A prolonged property slump causes a 'Japanese-style' lost decade.", impact: [0.005, 0.01, 0.015, 0.02, 0.025] },
        { id: "cn_consumer", title: "Will the Chinese Consumer Spend?", info: "China needs its middle class to spend more to offset falling exports.", yes: "Social safety nets improve, unleashing trillions in domestic spending.", no: "Deflationary mindset takes hold; citizens save instead of spend.", impact: [0.01, 0.015, 0.015, 0.02, 0.02] }
      ]
    },
    SK: {
      desc: "Slovakia is the world's largest car producer per capita, making it highly vulnerable to automotive trends and automation.",
      base_growth: [0.005, 0.008, 0.012, 0.015, 0.015],
      factors: [
        { id: "sk_ev", title: "Successful Pivot to EV Manufacturing?", info: "Slovak plants assemble traditional cars; they must retool for electric vehicles.", yes: "Major battery plants are built, and factories successfully retool.", no: "Automakers shift EV production to cheaper or more subsidized countries.", impact: [-0.01, 0.00, 0.02, 0.03, 0.04] }, // Dip during retooling, boom after
        { id: "sk_brain", title: "Reversing the 'Brain Drain'?", info: "Hundreds of thousands of young Slovaks leave for Czechia and Austria.", yes: "Economic reforms and tech investments lure young professionals back.", no: "The loss of educated youth stifles innovation and tax revenues.", impact: [0.005, 0.01, 0.015, 0.02, 0.025] },
        { id: "sk_infra", title: "Completion of Key Infrastructure?", info: "Slovakia's east-west highway and rail networks have been delayed for decades.", yes: "EU funds are fully utilized to connect the poorer East to European markets.", no: "Corruption and bureaucracy leave EU funds unspent and infrastructure broken.", impact: [0.00, 0.00, 0.01, 0.02, 0.02] }
      ]
    }
  },

  population: {
    US: {
      desc: "The US relies on immigration to offset declining birth rates. Future growth depends heavily on border policies and millennial family formations.",
      base_growth: [0.003, 0.003, 0.003, 0.004, 0.004], 
      factors: [
        { id: "us_imm", title: "Expansive Immigration Policy?", info: "Net migration accounts for the vast majority of US population growth today.", yes: "High H-1B visas and open policies lead to steady population growth.", no: "Strict border closures and visa limits cause population stagnation.", impact: [0.002, 0.003, 0.004, 0.005, 0.005] },
        { id: "us_housing", title: "Resolution of the Housing Crisis?", info: "High housing costs delay marriages and childbearing for younger generations.", yes: "Zoning reforms and construction booms encourage larger families.", no: "Unaffordable housing drives the fertility rate down further.", impact: [0.00, 0.001, 0.002, 0.003, 0.004] },
        { id: "us_healthcare", title: "Maternal Healthcare Reforms?", info: "The US has the highest maternal mortality and childbirth costs among wealthy nations.", yes: "Subsidized childcare and maternal care lift the fertility rate.", no: "Financial burdens of raising children cause a demographic slump.", impact: [0.00, 0.00, 0.001, 0.002, 0.003] }
      ]
    },
    CN: {
      desc: "China officially entered population decline in 2022. Reversing this trend is a massive structural challenge amid high youth unemployment.",
      base_growth: [-0.002, -0.003, -0.003, -0.004, -0.005], // Accelerating decline
      factors: [
        { id: "cn_pronatal", title: "Success of Pro-Natal State Policies?", info: "The government is trying to incentivize having 2-3 children with subsidies and tax breaks.", yes: "Cash handouts and housing perks slightly cushion the demographic crash.", no: "Financial incentives fail to change the urban single-child mindset.", impact: [0.00, 0.001, 0.001, 0.002, 0.002] },
        { id: "cn_youth", title: "End of the 'Lying Flat' Movement?", info: "Youth unemployment and burnout ('tang ping') have suppressed family formations.", yes: "Economic recovery gives youth confidence to marry and start families.", no: "Pessimism regarding the future continues to suppress the birth rate.", impact: [0.001, 0.001, 0.002, 0.002, 0.003] },
        { id: "cn_retirement", title: "Delayed Retirement Ages?", info: "China's retirement age (60 for men, 50-55 for women) is among the world's lowest.", yes: "Raising the retirement age keeps the active population larger for longer.", no: "An unchecked retirement wave heavily shrinks the active labor pool.", impact: [0.001, 0.001, 0.001, 0.001, 0.001] }
      ]
    },
    DE: {
      desc: "Germany's natural birth rate is heavily negative. Its population only remains stable or grows due to foreign migration.",
      base_growth: [0.001, 0.000, -0.001, -0.001, -0.002], // Peaking then dropping
      factors: [
        { id: "de_migration", title: "Continued High Immigration?", info: "Germany absorbed millions of refugees and workers to feed its industrial machine.", yes: "A steady influx of skilled labor keeps the total population growing.", no: "A political rightward shift drastically cuts net migration.", impact: [0.002, 0.003, 0.004, 0.005, 0.005] },
        { id: "de_integration", title: "Successful Social Integration?", info: "Immigrant populations tend to have higher initial birth rates if successfully settled.", yes: "Second-generation families establish themselves and sustain the birth rate.", no: "Social friction and ghettoization lead to emigration out of Germany.", impact: [0.00, 0.001, 0.001, 0.002, 0.002] },
        { id: "de_boomers", title: "The 'Baby Boomer' Cliff?", info: "Germany's largest demographic cohort is moving into high-mortality age brackets.", yes: "Improved longevity slightly delays the sharp drop in total population.", no: "A steep wave of mortality permanently shrinks the population size.", impact: [0.00, -0.001, -0.002, -0.003, -0.004] }
      ]
    },
    CZ: {
      desc: "The Czech Republic saw a population bump from Ukrainian refugees in 2022, but fundamentally faces an aging core demographic.",
      base_growth: [0.002, 0.001, 0.000, -0.001, -0.001], 
      factors: [
        { id: "cz_ukraine", title: "Refugees Granting Permanent Residency?", info: "Over 350,000 Ukrainians arrived in CZ; their permanent status alters the demographic curve.", yes: "They stay, integrate, and permanently boost the working-age population.", no: "They return home after the war, causing a sudden population dip.", impact: [0.001, 0.002, 0.003, 0.004, 0.004] },
        { id: "cz_housing", title: "Prague/Brno Housing Affordability?", info: "Czech housing is among the least affordable in Europe compared to local wages.", yes: "New construction allows young families to move out of small apartments.", no: "Families cap at one child due to extreme space limitations.", impact: [0.00, 0.001, 0.001, 0.002, 0.002] },
        { id: "cz_fertility", title: "Maintenance of High Regional Fertility?", info: "CZ has surprisingly maintained one of the highest fertility rates in the EU (~1.7).", yes: "Generous 3-year maternal leave policies keep the birth rate resilient.", no: "Economic uncertainty drops CZ to Southern European fertility levels (~1.2).", impact: [0.00, 0.001, 0.002, 0.002, 0.002] }
      ]
    },
    SK: {
      desc: "Slovakia struggles with a slowly declining population, exacerbated by a massive 'brain drain' of youth to the Czech Republic and Austria.",
      base_growth: [-0.001, -0.002, -0.002, -0.003, -0.003],
      factors: [
        { id: "sk_braindrain", title: "Reversing the Youth Exodus?", info: "Up to 20% of Slovak university students study abroad and never return.", yes: "Tech investments and modern universities lure the youth back home.", no: "The brightest continue to leave, hollowing out the demographic pyramid.", impact: [0.001, 0.002, 0.003, 0.004, 0.005] },
        { id: "sk_roma", title: "Integration of Roma Communities?", info: "The Roma minority has a significantly higher birth rate but faces extreme marginalization.", yes: "Educational integration unlocks a massive, young domestic workforce.", no: "Continued segregation leaves demographic potential entirely untapped.", impact: [0.001, 0.001, 0.002, 0.002, 0.003] },
        { id: "sk_family", title: "Impact of Family Subsidies?", info: "Recent governments introduced heavy tax bonuses for families with children.", yes: "Financial security prompts middle-class families to have a second or third child.", no: "Inflation completely eats away the value of the family subsidies.", impact: [0.00, 0.001, 0.001, 0.001, 0.002] }
      ]
    }
  },

  rd_spending: {
    US: {
      desc: "The US leads global R&D, driven heavily by private tech giants, the AI boom, and massive federal programs like the CHIPS Act.",
      base_growth: [0.01, 0.015, 0.02, 0.015, 0.01], // Peak tech spending
      factors: [
        { id: "us_ai_rd", title: "Sustained AI Hyper-Investment?", info: "Tech giants are spending billions on AI models and data centers.", yes: "The AI arms race pushes private R&D spending to unprecedented levels.", no: "The AI bubble pops, causing Silicon Valley to slash research budgets.", impact: [0.01, 0.02, 0.03, 0.04, 0.03] },
        { id: "us_federal", title: "Expansion of Federal Science Budgets?", info: "Government grants (NSF, DARPA) fund long-term fundamental research.", yes: "Bipartisan support for tech dominance massively boosts federal funding.", no: "A focus on cutting the national deficit slashes government science grants.", impact: [0.005, 0.01, 0.01, 0.015, 0.015] },
        { id: "us_chips", title: "CHIPS Act Follow-Through?", info: "The US is subsidizing semiconductor manufacturing and R&D on domestic soil.", yes: "Hardware research fully reshorest, creating massive tech hubs.", no: "Bureaucracy and labor costs stall the localized hardware research push.", impact: [0.005, 0.01, 0.015, 0.015, 0.015] }
      ]
    },
    CN: {
      desc: "China uses state-directed R&D to achieve tech self-sufficiency, heavily focused on bypassing Western semiconductor sanctions and leading in green tech.",
      base_growth: [0.02, 0.025, 0.025, 0.03, 0.03], // Aggressive upward curve
      factors: [
        { id: "cn_selfreliance", title: "Total Tech Decoupling?", info: "Cut off from Western chips, China must invent its own photolithography.", yes: "Desperation breeds innovation; state funds flood local semiconductor R&D.", no: "Sanctions stifle the industry so much that research yields diminishing returns.", impact: [0.01, 0.02, 0.03, 0.035, 0.04] },
        { id: "cn_private", title: "Freedom for Private Tech Firms?", info: "Past regulatory crackdowns hampered giants like Alibaba and Tencent.", yes: "The state eases restrictions, unleashing private sector software research.", no: "State-owned enterprises dominate, which are notoriously less innovative.", impact: [0.005, 0.01, 0.015, 0.02, 0.02] },
        { id: "cn_green", title: "Dominance in Green Tech R&D?", info: "China already leads in battery chemistry and solar efficiency research.", yes: "Continued massive R&D spending solidifies a global monopoly on EVs.", no: "Overcapacity and Western tariffs cause a collapse in green tech investments.", impact: [0.01, 0.015, 0.015, 0.02, 0.02] }
      ]
    },
    DE: {
      desc: "German R&D is dominated by the automotive and heavy engineering sectors, but it urgently needs to shift focus toward software and digitalization.",
      base_growth: [0.005, 0.005, 0.008, 0.01, 0.01],
      factors: [
        { id: "de_auto_sw", title: "Automakers Pivoting to Software?", info: "VW and BMW spend billions on mechanical R&D, but lag in autonomous driving code.", yes: "German auto giants successfully restructure as tech/software companies.", no: "Failure to write good software causes a massive drop in overall R&D efficiency.", impact: [0.00, 0.01, 0.02, 0.03, 0.035] },
        { id: "de_energiewende", title: "Green Hydrogen & Energy R&D?", info: "Germany aims to lead the world in industrial decarbonization.", yes: "Billions in state subsidies create a world-leading hydrogen research sector.", no: "High local energy prices force chemical companies to move R&D to the US.", impact: [0.005, 0.01, 0.015, 0.02, 0.02] },
        { id: "de_bureaucracy", title: "Reduction of Red Tape?", info: "German researchers frequently complain about slow approvals and rigid data laws.", yes: "Streamlined EU regulations unleash AI and biotech research.", no: "Strict GDPR and local laws strangle data-heavy AI and medical research.", impact: [0.00, 0.005, 0.01, 0.015, 0.02] }
      ]
    },
    CZ: {
      desc: "Czech R&D has grown significantly via EU funds, transitioning the country from a mere 'assembly line' to a regional hub for cybersecurity and tech.",
      base_growth: [0.01, 0.012, 0.015, 0.015, 0.015],
      factors: [
        { id: "cz_eu_funds", title: "Efficient Use of EU Tech Grants?", info: "Much of Czech R&D is subsidized by Brussels' structural funds.", yes: "Funds are efficiently allocated to high-yield AI and quantum research hubs.", no: "Grants are wasted on bureaucratic projects with zero market application.", impact: [0.01, 0.015, 0.02, 0.025, 0.03] },
        { id: "cz_gaming_sec", title: "Boom in Cyber & Software?", info: "CZ is home to global software hits (Avast, Beat Saber, JetBrains).", yes: "The local software ecosystem balloons, drawing heavy VC investment.", no: "Successful startups are immediately bought out and moved to Silicon Valley.", impact: [0.005, 0.01, 0.015, 0.02, 0.02] },
        { id: "cz_university", title: "University-Industry Spin-offs?", info: "Historically, Czech universities struggled to commercialize their patents.", yes: "New laws allow rapid patent spin-offs, boosting private-academic R&D.", no: "Academia remains siloed, preventing lab research from reaching the market.", impact: [0.00, 0.005, 0.01, 0.015, 0.015] }
      ]
    },
    SK: {
      desc: "Slovakia has one of the lowest R&D rates in the OECD, heavily relying on foreign parent companies bringing pre-developed tech to local factories.",
      base_growth: [0.01, 0.01, 0.015, 0.015, 0.02],
      factors: [
        { id: "sk_foreign_hq", title: "Parent Companies Moving R&D Locally?", info: "Most car factories in SK only assemble; the R&D stays in Germany or Korea.", yes: "Incentives convince automakers to build battery testing labs in Slovakia.", no: "Slovakia remains strictly a low-cost assembly zone with zero local research.", impact: [0.01, 0.015, 0.025, 0.035, 0.04] }, // Spikes late if approved
        { id: "sk_it_valley", title: "Growth of the Kosice IT Valley?", info: "The east of Slovakia has a growing IT outsourcing sector.", yes: "Outsourcing transitions into original product development and deep tech.", no: "IT remains focused purely on low-level maintenance and customer support.", impact: [0.005, 0.01, 0.015, 0.02, 0.02] },
        { id: "sk_state_funding", title: "State Support for Innovation?", info: "Government spending on science is historically abysmal.", yes: "A new strategic push floods universities with modern lab equipment.", no: "Political instability prevents any long-term scientific funding strategies.", impact: [0.00, 0.005, 0.01, 0.015, 0.02] }
      ]
    }
  },

  life_expectancy: {
    US: {
      desc: "US life expectancy uniquely declined prior to 2024 due to structural health crises, but biotech breakthroughs offer a path to rapid recovery.",
      base_growth: [0.001, 0.001, 0.0015, 0.002, 0.002],
      factors: [
        { id: "us_glp1", title: "The 'Ozempic' / GLP-1 Effect?", info: "New weight-loss drugs severely reduce cardiovascular risks associated with obesity.", yes: "Mass adoption drastically cuts heart disease and diabetes mortality rates.", no: "High drug costs and insurance blocks limit access strictly to the wealthy.", impact: [0.001, 0.002, 0.003, 0.004, 0.005] }, // Exponential curve as drugs hit market
        { id: "us_opioid", title: "Control of the Fentanyl Crisis?", info: "Overdoses are the leading cause of death for Americans under 50.", yes: "New border tech and addiction treatments finally plateau the overdose curve.", no: "Synthetic opioids continue to ravage young and middle-aged demographics.", impact: [0.001, 0.002, 0.002, 0.003, 0.003] },
        { id: "us_healthcare", title: "Healthcare Affordability?", info: "Preventative care is often skipped due to high out-of-pocket deductibles.", yes: "Telehealth and cost-caps improve early cancer and disease detection.", no: "Medical inflation leaves millions avoiding doctors until emergencies strike.", impact: [0.001, 0.001, 0.002, 0.002, 0.003] }
      ]
    },
    CN: {
      desc: "China's life expectancy has soared past the US, driven by rapid urbanization, but it now faces the dual threats of an aging population and high smoking rates.",
      base_growth: [0.0015, 0.0015, 0.001, 0.001, 0.0005], // Plateaus over time
      factors: [
        { id: "cn_pollution", title: "Continued Air Quality Improvements?", info: "China's 'War on Pollution' drastically reduced smog in major cities since 2014.", yes: "Green energy adoption continues to slash respiratory disease mortality.", no: "A return to coal-heavy industry causes a resurgence in lung issues.", impact: [0.001, 0.0015, 0.002, 0.002, 0.002] },
        { id: "cn_hospitals", title: "Rural Healthcare Infrastructure?", info: "Tier 1 cities have world-class hospitals, but rural clinics are severely underfunded.", yes: "Massive state investment equalizes health outcomes across the provinces.", no: "A rapidly aging rural population overwhelms local medical capabilities.", impact: [0.00, 0.001, 0.0015, 0.002, 0.0025] },
        { id: "cn_lifestyle", title: "Managing Diet & Smoking?", info: "China has a high male smoking rate and rapidly rising childhood obesity.", yes: "Aggressive public health campaigns curb smoking and sugar intake.", no: "Westernized fast-food diets cause a massive spike in cardiovascular diseases.", impact: [0.001, 0.001, 0.0015, 0.002, 0.002] }
      ]
    },
    DE: {
      desc: "Germany boasts excellent universal healthcare, but struggles with an acute shortage of nursing staff and a rapidly aging society.",
      base_growth: [0.001, 0.001, 0.001, 0.001, 0.001],
      factors: [
        { id: "de_nursing", title: "Solving the Care Worker Shortage?", info: "An aging boomer generation is overwhelming the senior care system.", yes: "Robotics and skilled migrant visas completely stabilize the nursing sector.", no: "Severe understaffing leads to declining quality of care for the elderly.", impact: [0.00, 0.001, 0.002, 0.003, 0.004] },
        { id: "de_preventative", title: "Digitalization of Health Records?", info: "German healthcare is notoriously reliant on paper and fax machines.", yes: "E-prescriptions and AI diagnostics vastly improve preventative care speeds.", no: "Privacy laws block digital health, causing inefficiencies and medical errors.", impact: [0.001, 0.001, 0.002, 0.002, 0.002] },
        { id: "de_diet", title: "Shift to Plant-Based Diets?", info: "Meat consumption in Germany has been dropping sharply in recent years.", yes: "A cultural shift towards veganism/vegetarianism lowers heart disease.", no: "Traditional diets remain entrenched, keeping cardiovascular issues high.", impact: [0.001, 0.001, 0.0015, 0.0015, 0.002] }
      ]
    },
    CZ: {
      desc: "The Czech Republic has excellent hospital accessibility, but life expectancy is held back by high alcohol consumption and preventable lifestyle diseases.",
      base_growth: [0.0015, 0.0015, 0.0015, 0.0015, 0.0015],
      factors: [
        { id: "cz_alcohol", title: "Reduction in Alcohol Consumption?", info: "Czechs consume the most beer per capita in the world, impacting liver health.", yes: "Younger 'sober-curious' generations drastically reduce national liver disease.", no: "Heavy drinking culture remains, keeping male life expectancy artificially low.", impact: [0.001, 0.002, 0.002, 0.003, 0.003] },
        { id: "cz_screening", title: "Success of Preventative Screenings?", info: "The state heavily subsidizes free cancer screening programs.", yes: "High participation rates catch colon and breast cancers in early, curable stages.", no: "Public apathy leads to late-stage diagnoses and higher mortality.", impact: [0.001, 0.0015, 0.002, 0.002, 0.002] },
        { id: "cz_funding", title: "Sustained Health Insurance Funding?", info: "The universal system relies on heavy state budget contributions.", yes: "Economic growth ensures hospitals remain modern and fully staffed.", no: "Deficit cuts lead to longer wait times for critical surgeries.", impact: [0.00, 0.001, 0.0015, 0.002, 0.002] }
      ]
    },
    SK: {
      desc: "Slovakia's life expectancy lags behind Western Europe, heavily impacted by poor rural healthcare access and an exodus of doctors.",
      base_growth: [0.001, 0.001, 0.0015, 0.0015, 0.0015],
      factors: [
        { id: "sk_doctor_drain", title: "Retaining Medical Professionals?", info: "Slovak doctors and nurses frequently commute to Austria or CZ for triple the pay.", yes: "Wage hikes and hospital modernizations keep medical talent at home.", no: "Hospitals literally close departments due to a lack of staff, hiking mortality.", impact: [0.001, 0.002, 0.003, 0.004, 0.005] }, // Snowballs positively over time
        { id: "sk_roma_health", title: "Health Outcomes in Marginalized Areas?", info: "Life expectancy in Roma settlements is up to 10 years lower than the national average.", yes: "Targeted public health interventions vastly improve marginalized outcomes.", no: "Ignored rural poverty continues to drag down the national demographic average.", impact: [0.00, 0.001, 0.002, 0.003, 0.003] },
        { id: "sk_heart", title: "Tackling Cardiovascular Disease?", info: "Heart disease is the absolute leading cause of death in Slovakia.", yes: "Modern surgical centers and dietary education lower the heart attack rate.", no: "High-stress lifestyles and poor diets keep cardiovascular mortality elevated.", impact: [0.001, 0.0015, 0.002, 0.0025, 0.003] }
      ]
    }
  }
};
