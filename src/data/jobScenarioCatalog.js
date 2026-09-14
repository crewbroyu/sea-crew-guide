export const JOB_SIMULATOR_CATALOG = {
  bar_server: {
    jobKey: 'bar_server', position: 'Bar Server', productCode: 'bar_server_pack', label: 'BAR SERVER', title: 'Bar Server Job Simulation', backRoute: '/programs/bar-server',
    skills: [
      { key: 'communication', label: 'Communication' }, { key: 'barKnowledge', label: 'Bar Knowledge' },
      { key: 'service', label: 'Service' }, { key: 'upselling', label: 'Upselling' },
      { key: 'problemSolving', label: 'Problem Solving' }, { key: 'english', label: 'English' },
    ],
  },
  retail: {
    jobKey: 'retail', position: 'Retail Sales Associate', productCode: 'retail_sales_pack', label: 'RETAIL SALES ASSOCIATE', title: 'Onboard Retail Job Simulation', backRoute: '/programs/retail',
    skills: [
      { key: 'communication', label: 'Communication' }, { key: 'productKnowledge', label: 'Product Knowledge' },
      { key: 'guestExperience', label: 'Guest Experience' }, { key: 'selling', label: 'Selling Skills' },
      { key: 'operations', label: 'Retail Operations' }, { key: 'english', label: 'English' },
    ],
  },
}

export const BAR_SERVER_SKILLS = JOB_SIMULATOR_CATALOG.bar_server.skills
export const RETAIL_SKILLS = JOB_SIMULATOR_CATALOG.retail.skills

export const barServerSimulationScenarios = [
  {
    id: 'bar_sim_basic_order', jobKey: 'bar_server', title: 'Confirm a Clear Drink Order', episode: 'Level 1 · Basic Service', difficulty: 1,
    location: 'Atrium Bar · Embarkation Evening', guestType: 'A family on their first cruise', guestAccent: 'Clear American English', workload: 'Normal', noiseLevel: 'Low',
    serviceGoal: 'Clarify preferences, repeat the order, and set a realistic expectation.', salesGoal: 'Do not force an upsell. Get the basic service right first.',
    knowledgeRequired: ['Ask one question to clarify an alcohol or flavour preference.', 'Repeat the drinks, quantities, and key modifications.', 'Do not invent wait times or package rules.'],
    aiRole: 'Guest', openingLine: "Hi. Could I have one mojito, but not too sweet? And my wife would like something non-alcoholic.",
    followUpFocus: 'Clarify the non-alcoholic preference and test whether the full order is repeated accurately.', evaluationFocus: ['communication', 'service', 'english'],
  },
  {
    id: 'bar_sim_premium_recommendation', jobKey: 'bar_server', title: 'Make a Refreshing Recommendation and a Natural Upsell', episode: 'Level 2 · Recommendation & Sales', difficulty: 2,
    location: 'Pool Bar · Sea Day · 14:00', guestType: 'An American guest who wants to try something new', guestAccent: 'American English', workload: 'High', noiseLevel: 'Medium',
    serviceGoal: 'Make a reliable recommendation for a light, citrusy, not-too-sweet drink.', salesGoal: 'Offer a premium alternative only when it serves the guest need.',
    knowledgeRequired: ['Know why vodka soda with lime is light and low in sweetness.', 'Know how syrup affects a Tom Collins.', 'Check package coverage or price before promising anything.'],
    aiRole: 'Guest', openingLine: "I'd like something light, citrusy, and not too sweet. What do you recommend?",
    followUpFocus: 'Ask about the base spirit, sweetness adjustment, or a premium alternative to test whether the recommendation truly fits the guest.', evaluationFocus: ['barKnowledge', 'service', 'upselling', 'english'],
  },
  {
    id: 'bar_sim_wrong_drink_recovery', jobKey: 'bar_server', title: 'Recover a Wrong Drink Service Failure', episode: 'Level 3 · Problem Handling', difficulty: 3,
    location: 'Lounge Bar · Before the Show', guestType: 'A guest who has waited too long and is clearly disappointed', guestAccent: 'British English', workload: 'High', noiseLevel: 'Medium',
    serviceGoal: 'Apologise, verify the order, offer an authorised recovery, and follow up.', salesGoal: 'Do not upsell. Restore trust first.',
    knowledgeRequired: ['Never blame the bartender or system in front of the guest.', 'A remake, replacement, or compensation must follow ship policy.', 'Follow up after the replacement is delivered.'],
    aiRole: 'Complaining Guest', openingLine: "This isn't what I ordered. I've already waited twenty minutes, and now it's far too sweet.",
    followUpFocus: 'Ask how the order will be verified, when a supervisor is involved, and how the server will follow up.', evaluationFocus: ['communication', 'service', 'problemSolving', 'english'],
  },
  {
    id: 'bar_sim_responsible_service', jobKey: 'bar_server', title: 'Handle a Guest Demanding Another Drink', episode: 'Level 4 · High Pressure', difficulty: 4,
    location: 'Casino Bar · Evening Rush', guestType: 'A guest who has been drinking and is becoming agitated', guestAccent: 'Fast Australian English', workload: 'High', noiseLevel: 'High',
    serviceGoal: 'Stop alcohol service calmly, offer a safe alternative, and escalate early.', salesGoal: 'Not applicable. Safety comes first.',
    knowledgeRequired: ['A beverage package never overrides responsible-service policy.', 'Do not call a guest drunk to their face.', 'Notify a supervisor, security, or medical support when needed.'],
    aiRole: 'Drunk Guest', openingLine: "I've got the package. Just give me another whisky. Don't make this difficult.",
    followUpFocus: 'Challenge the package entitlement and test a calm refusal with appropriate escalation.', evaluationFocus: ['communication', 'service', 'problemSolving', 'english'],
  },
]

export const retailSimulationScenarios = [
  {
    id: 'retail_sim_guest_approach', jobKey: 'retail', title: 'Approach a Guest Without Pressure', episode: 'Level 1 · Guest Connection', difficulty: 1,
    location: 'Beauty & Fragrance Boutique · Embarkation Evening', guestType: 'A guest who says they are only browsing', guestAccent: 'Clear American English', workload: 'Normal', noiseLevel: 'Low',
    serviceGoal: 'Welcome the guest, respect their space, and create a natural reason to continue the conversation.', salesGoal: 'Discover one useful preference without starting a product pitch.',
    knowledgeRequired: ['Avoid repeating “Can I help you?” after the guest declines.', 'Offer specific help and remain available.', 'Use one open question connected to the guest or the voyage.'],
    aiRole: 'Guest', openingLine: "Thanks, I'm just looking. I don't really need anything today.",
    followUpFocus: 'Test whether the associate can discover a purpose, recipient, category, or preference without becoming pushy.', evaluationFocus: ['communication', 'guestExperience', 'selling', 'english'],
  },
  {
    id: 'retail_sim_fragrance_discovery', jobKey: 'retail', title: 'Recommend a Fragrance Through Discovery', episode: 'Level 2 · Product Recommendation', difficulty: 2,
    location: 'Fragrance Boutique · Sea Day Morning', guestType: 'A guest choosing a gift for their partner', guestAccent: 'British English', workload: 'Normal', noiseLevel: 'Low',
    serviceGoal: 'Ask focused questions and present one suitable option with honest feature-to-benefit language.', salesGoal: 'Offer a relevant comparison or gift addition after establishing fit.',
    knowledgeRequired: ['Ask about scent family, occasion, current favourites, and budget.', 'Describe notes as an experience, not a guaranteed reaction.', 'Never invent longevity, ingredients, stock, or duty-free savings.'],
    aiRole: 'Gift Shopper', openingLine: "I need a fragrance for my partner, but I have no idea what to choose. They usually like something fresh.",
    followUpFocus: 'Ask about budget, scent family, current fragrance, or occasion before testing a comparison and close.', evaluationFocus: ['productKnowledge', 'guestExperience', 'selling', 'english'],
  },
  {
    id: 'retail_sim_price_objection', jobKey: 'retail', title: 'Handle a Price Objection Honestly', episode: 'Level 3 · Objection Handling', difficulty: 3,
    location: 'Watches & Jewellery · Port Evening', guestType: 'A careful guest comparing prices with a website', guestAccent: 'Indian English', workload: 'Medium', noiseLevel: 'Low',
    serviceGoal: 'Acknowledge the comparison, verify facts, and protect trust without criticising another seller.', salesGoal: 'Clarify value and buying conditions, then ask for the sale only when the concern is resolved.',
    knowledgeRequired: ['Do not guarantee the lowest price or customs outcome.', 'Compare like for like: model, warranty, currency, tax, and authorised seller status.', 'Use approved price and promotion information only.'],
    aiRole: 'Price-conscious Guest', openingLine: "I found what looks like the same watch online for less. Why should I buy it here?",
    followUpFocus: 'Challenge the associate on price matching, warranty, authenticity, or customs allowance.', evaluationFocus: ['communication', 'productKnowledge', 'selling', 'operations', 'english'],
  },
  {
    id: 'retail_sim_return_policy', jobKey: 'retail', title: 'Resolve a Return or Product Concern', episode: 'Level 4 · Service Recovery', difficulty: 4,
    location: 'Main Retail Store · Guest Services Counter', guestType: 'An upset guest returning a previously opened product', guestAccent: 'Fast Australian English', workload: 'High', noiseLevel: 'Medium',
    serviceGoal: 'Listen, inspect facts, explain only verified policy, and involve the correct authority.', salesGoal: 'Restore trust. Do not turn the complaint into an upsell.',
    knowledgeRequired: ['Check receipt, condition, purchase details, and current policy.', 'Never promise a refund or exchange before authorisation.', 'Document the concern and keep the guest updated.'],
    aiRole: 'Complaining Guest', openingLine: "This skincare set irritated my skin. I opened it yesterday and I want a full refund now.",
    followUpFocus: 'Test empathy, policy boundaries, escalation, and whether the associate avoids medical claims.', evaluationFocus: ['communication', 'guestExperience', 'operations', 'english'],
  },
  {
    id: 'retail_sim_sea_day', jobKey: 'retail', title: 'Run a Busy Sea-day Sales Interaction', episode: 'Level 5 · Job Simulation', difficulty: 5,
    location: 'Promotional Event · Sea Day · 19:30', guestType: 'Two guests asking about a promotion while another guest waits', guestAccent: 'Mixed international English', workload: 'Very High', noiseLevel: 'High',
    serviceGoal: 'Prioritise guests, explain the promotion accurately, keep the floor controlled, and close the interaction.', salesGoal: 'Use needs-based cross-selling while protecting service quality and transaction accuracy.',
    knowledgeRequired: ['Acknowledge waiting guests and set expectations.', 'Confirm promotion eligibility, quantities, and exclusions in the approved material.', 'Protect merchandise, payment accuracy, and team communication during rush periods.'],
    aiRole: 'Event Guest', openingLine: "The sign says buy two and save twenty percent. Does that include this brand, and can I mix the products?",
    followUpFocus: 'Add a waiting guest, an uncertain exclusion, or a stock issue and test prioritisation plus an accurate close.', evaluationFocus: ['communication', 'productKnowledge', 'guestExperience', 'selling', 'operations', 'english'],
  },
]

export const JOB_SIMULATION_SCENARIOS = [...barServerSimulationScenarios, ...retailSimulationScenarios]
export const getJobSimulator = (jobKey = 'bar_server') => JOB_SIMULATOR_CATALOG[jobKey] || JOB_SIMULATOR_CATALOG.bar_server
export const getJobSkills = (jobKey = 'bar_server') => getJobSimulator(jobKey).skills
export const getJobScenarios = (jobKey = 'bar_server') => JOB_SIMULATION_SCENARIOS.filter((scenario) => scenario.jobKey === jobKey)
export const getScenarioById = (scenarioId) => JOB_SIMULATION_SCENARIOS.find((scenario) => scenario.id === scenarioId) || null
export const getScenarioForWeakSkill = (skillKey, completedScenarioIds = [], jobKey = 'bar_server') => {
  const scenarios = getJobScenarios(jobKey)
  const uncompleted = scenarios.filter((scenario) => !completedScenarioIds.includes(scenario.id))
  const candidates = uncompleted.length ? uncompleted : scenarios
  return candidates.find((scenario) => scenario.evaluationFocus.includes(skillKey)) || candidates[0]
}
