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