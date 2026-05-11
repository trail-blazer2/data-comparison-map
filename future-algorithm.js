// ============================================================
// FUTURE ALGORITHM — Logic & Factors for Projections
// ============================================================

window.FutureAlgorithm = {
  FACTORS: {
    gdp_per_capita: {
      description: "Projected economic growth over the next 5 years depends heavily on technological adoption, trade policies, and energy cost stability.",
      factors: [
        { id: "f1", label: "Tech Sector Boom", desc: "Accelerated AI and automation adoption across industries.", impact: 0.05 }, // +5% total
        { id: "f2", label: "Trade Integration", desc: "Favorable new international trade agreements and reduced tariffs.", impact: 0.03 }, // +3% total
        { id: "f3", label: "Energy Stability", desc: "Consistent and cheap renewable energy driving down manufacturing costs.", impact: 0.02 } // +2% total
      ],
      baselineGrowth: 0.08 // 8% normal growth over 5 years
    },
    population: {
      description: "Demographic trajectories are shaped by immigration policies, healthcare advancements, and family incentives.",
      factors: [
        { id: "f1", label: "Pro-Immigration", desc: "Relaxed visa policies encouraging skilled workers to migrate.", impact: 0.02 }, // +2% total
        { id: "f2", label: "Healthcare Extension", desc: "Medical breakthroughs increasing life expectancy and reducing mortality.", impact: 0.005 }, // +0.5% total
        { id: "f3", label: "Family Incentives", desc: "Tax breaks and subsidies encouraging higher birth rates.", impact: 0.01 } // +1% total
      ],
      baselineGrowth: 0.01 // 1% normal growth over 5 years
    },
    rd_spending: {
      description: "Research and Development spending as a % of GDP relies on government grants and private sector commitments.",
      factors: [
        { id: "f1", label: "Gov AI Grants", desc: "Massive state-sponsored funding for AI and quantum computing.", impact: 0.2 }, // +0.2 absolute %
        { id: "f2", label: "Private Tax Credits", desc: "Corporate tax write-offs for experimental development.", impact: 0.15 }, // +0.15 absolute %
        { id: "f3", label: "University Subsidies", desc: "Direct funding to higher education research institutions.", impact: 0.05 } // +0.05 absolute %
      ],
      baselineGrowth: 0.05 // +0.05 absolute % normal growth over 5 years
    },
    life_expectancy: {
      description: "Longevity projections factor in universal healthcare access, lifestyle programs, and environmental controls.",
      factors: [
        { id: "f1", label: "Universal Health", desc: "Expanded access to preventative care and diagnostics.", impact: 1.0 }, // +1 year
        { id: "f2", label: "Diet Programs", desc: "National initiatives reducing obesity and heart disease.", impact: 0.6 }, // +0.6 years
        { id: "f3", label: "Pollution Controls", desc: "Strict emissions regulations reducing respiratory illnesses.", impact: 0.4 } // +0.4 years
      ],
      baselineGrowth: 0.5 // +0.5 years normal growth over 5 years
    }
  },

  // Returns array of 5 projected values (Year 1 to Year 5)
  calculateFutureData: function(metric, currentVal, activeFactorIds) {
    const config = this.FACTORS[metric];
    if (!config || currentVal == null) return [currentVal, currentVal, currentVal, currentVal, currentVal];

    let totalImpact = config.baselineGrowth;
    config.factors.forEach(f => {
      if (activeFactorIds.includes(f.id)) {
        totalImpact += f.impact;
      }
    });

    const isMultiplier = metric === 'gdp_per_capita' || metric === 'population';
    const finalVal = isMultiplier ? currentVal * (1 + totalImpact) : currentVal + totalImpact;
    
    // Interpolate smoothly over 5 years
    const projection = [];
    for (let i = 1; i <= 5; i++) {
      const step = currentVal + ((finalVal - currentVal) * (i / 5));
      projection.push(step);
    }
    return projection;
  },

  // Ensure the chart's Y-Axis doesn't jump around when toggling. 
  // We calculate the absolute lowest and highest possible bounds.
  getChartRange: function(metric, currentVal) {
    const config = this.FACTORS[metric];
    if (!config) return { min: currentVal * 0.9, max: currentVal * 1.1 };

    const isMultiplier = metric === 'gdp_per_capita' || metric === 'population';
    
    let maxImpact = config.baselineGrowth;
    config.factors.forEach(f => maxImpact += f.impact);

    const minVal = currentVal; // Minimum is usually just the starting point
    const maxVal = isMultiplier ? currentVal * (1 + maxImpact) : currentVal + maxImpact;
    
    // Add a small 5% visual padding to the top and bottom bounds
    const padding = (maxVal - minVal) * 0.15;
    return {
      min: minVal - (padding || currentVal * 0.05),
      max: maxVal + (padding || currentVal * 0.05)
    };
  }
};