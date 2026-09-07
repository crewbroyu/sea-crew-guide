const simulationKnowledge = {
  bar_sim_basic_order: {
    role: 'Guest',
    openingLine: "Hi. Could I have one mojito, but not too sweet? And my wife would like something non-alcoholic.",
    followUpFocus: 'Ask for a non-alcoholic preference and verify whether the server restates the full order.',
    serviceGoal: 'Clarify, repeat back the order, and set a realistic next step.',
    salesGoal: 'Do not force an upsell; make the basic order accurate first.',
    knowledge: ['Ask one concise preference question before choosing the non-alcoholic drink.', 'Repeat the drink, quantity, and relevant modification.', 'Do not invent wait times, prices, or package coverage.'],
  },
  bar_sim_premium_recommendation: {
    role: 'Guest',
    openingLine: "I'd like something light, citrusy, and not too sweet. What do you recommend?",
    followUpFocus: 'Test whether the server can clarify base spirit, adjust sweetness, and offer a suitable premium alternative.',
    serviceGoal: 'Give a reliable drink recommendation based on the stated preference.',
    salesGoal: 'Offer a premium alternative only when it genuinely improves the guest choice.',
    knowledge: ['Vodka soda with fresh lime is light and low sweetness, but confirm the guest accepts vodka.', 'Tom Collins can fit when gin is acceptable; syrup level matters.', 'Package coverage and prices must be checked, never promised.'],
  },
  bar_sim_wrong_drink_recovery: {
    role: 'Complaining Guest',
    openingLine: "This isn't what I ordered. I've already waited twenty minutes, and now it's far too sweet.",
    followUpFocus: 'Test order verification, authorization awareness, and a clear service-recovery follow-up.',
    serviceGoal: 'Acknowledge, verify, remake or replace within policy, and close the loop.',
    salesGoal: 'No upsell. Restore trust first.',
    knowledge: ['Never blame the bartender, system, or guest in front of the guest.', 'Free drinks, refunds, and compensation may require supervisor authorization.', 'Follow up after the replacement arrives.'],
  },
  bar_sim_responsible_service: {
    role: 'Drunk Guest',
    openingLine: "I've got the package. Just give me another whisky. Don't make this difficult.",
    followUpFocus: 'Challenge package entitlement while testing calm refusal and escalation.',
    serviceGoal: 'Stop alcohol service calmly, offer a safe alternative, and escalate appropriately.',
    salesGoal: 'Not applicable. Safety overrides sales.',
    knowledge: ['A beverage package never overrides responsible-service policy.', 'Use neutral language rather than calling a guest drunk to their face.', 'Notify a supervisor early and request security or medical support if needed.'],
  },
}

export const getBarServerSimulationKnowledge = (scenarioId) => simulationKnowledge[scenarioId] || null
