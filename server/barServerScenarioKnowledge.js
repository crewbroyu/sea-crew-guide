const scenarioKnowledge = {
  bar_server_drink_recommendation_01: {
    roleGoal: 'Match the drink to the guest instead of naming a random cocktail or forcing an upsell.',
    serviceSequence: ['Ask one concise clarifying question about alcohol, base spirit, or another decisive preference.', 'Recommend one specific drink and describe why it matches light, citrusy, and not too sweet.', 'Offer one suitable alternative only when it helps the decision.', 'Check price or beverage-package coverage without inventing policy, then confirm the order.'],
    knowledgeNotes: ['A Screwdriver is vodka and orange juice. It is citrusy, but orange juice may taste sweeter and heavier than the guest requested.', 'A Tom Collins can fit because gin, lemon, and soda create a light citrus profile; syrup level still matters.', 'Vodka soda with fresh lime is a lower-sweetness alternative, but the server should still confirm the guest likes vodka.', 'A Bar Server should confirm package coverage or modification requests rather than promise them without checking.'],
    knowledgeNotesZh: ['Screwdriver 由伏特加和橙汁构成，确实有柑橘风味，但橙汁可能比客人要求的更甜、更厚重。', 'Tom Collins 的金酒、柠檬和苏打水能形成轻盈清爽的柑橘风味，但仍要留意糖浆用量。', 'Vodka soda with fresh lime 是甜度更低的备选，但仍应先确认客人是否喜欢伏特加。', 'Bar Server 应先核实套餐范围和定制要求，不能在没有确认时直接承诺。'],
    usefulPhrases: ['May I ask whether you prefer gin, vodka, or a non-alcoholic option?', 'I would recommend a Tom Collins because it is light, refreshing, and citrus-forward.', 'I can check whether the bartender can make it with less syrup.', 'Shall I check whether it is included in your beverage package?'],
    fallbackStrengthsZh: ['你已经直接回应客人，并给出了一款具体饮品，而不是停留在空泛推荐。'],
    retryChecklistZh: ['先确认客人是否接受酒精及偏好的基酒。', '推荐一款具体饮品，并解释它为什么符合 light、citrusy 和 not too sweet。', '核实套餐或价格，不要直接承诺。', '用一个确认问题完成点单收尾。'],
    referenceAnswer: 'Certainly. May I ask whether you prefer gin, vodka, or a non-alcoholic option? If gin is fine, I would recommend a Tom Collins. It is light and refreshing, with lemon and soda, and I can check whether the bartender can reduce the syrup so it is not too sweet. Shall I also check whether it is included in your beverage package?',
  },
  bar_server_complaint_recovery_02: {
    roleGoal: 'Recover the guest experience quickly while keeping the order accurate and avoiding unauthorized promises.',
    serviceSequence: ['Acknowledge both the long wait and the drink problem, then apologize without arguing.', 'Check what was ordered and clarify the flavor the guest expected.', 'Offer to have the drink checked and remade or replaced according to policy.', 'Keep the guest updated, involve a supervisor when authorization is needed, and follow up after delivery.'],
    knowledgeNotes: ['Do not blame the bartender, POS, or guest in front of the customer.', 'A service recovery answer needs a concrete next action, not only an apology.', 'Free drinks, refunds, and compensation may require supervisor authorization.', 'Closing the loop after replacement demonstrates ownership and service awareness.'],
    knowledgeNotesZh: ['不要在客人面前责怪 bartender、POS 系统或客人本人。', '服务补救必须包含具体下一步，只有道歉并不能解决问题。', '免费饮品、退款和额外补偿可能需要主管授权。', '替换饮品送达后再次跟进，才能体现服务责任感。'],
    usefulPhrases: ['I’m sorry the drink was not what you expected, especially after the wait.', 'May I confirm what you ordered and the flavor you were expecting?', 'I’ll speak with the bartender right away and arrange the appropriate replacement.', 'I’ll keep you updated and check back after the new drink arrives.'],
    fallbackStrengthsZh: ['你已经尝试回应客人的不满，并进入服务补救场景。'],
    retryChecklistZh: ['同时承认等待时间和饮品问题。', '核对原订单并确认客人真正期待的口味。', '提出符合权限的重做或替换方案。', '告知处理进度，并在新饮品送达后跟进。'],
    referenceAnswer: 'I’m sorry the drink was not what you expected, especially after you waited for it. May I confirm what you ordered and whether you would prefer something less sweet? I’ll check the order with the bartender right away and arrange a remake or suitable replacement according to our policy. I’ll keep you updated, and I’ll return after the new drink arrives to make sure it is right.',
  },
  bar_server_responsible_service_03: {
    roleGoal: 'Protect the guest and others by stopping alcohol service calmly and following the cruise line’s responsible-service procedure.',
    serviceSequence: ['Stay calm and avoid arguing about whether the guest is drunk.', 'State respectfully that you cannot serve more alcohol at this time under responsible-service policy.', 'Offer water, a non-alcoholic drink, or another safe alternative.', 'Notify the supervisor early and request security or medical support if the situation escalates or the guest is unwell.'],
    knowledgeNotes: ['Beverage-package entitlement never overrides responsible alcohol-service rules.', 'Neutral language is safer than labeling the guest as drunk or intoxicated to their face.', 'The server should not diagnose a medical condition or physically manage an unsafe guest alone.', 'Documentation and escalation should follow the cruise line’s actual policy.'],
    knowledgeNotesZh: ['Beverage package 的权益永远不能凌驾于 responsible alcohol-service 安全规则之上。', '使用中性语言比当面指责客人 drunk 或 intoxicated 更安全。', 'Bar Server 不应诊断客人的医疗状况，也不应独自处理不安全的客人。', '记录、升级和求助必须遵循船公司的实际政策。'],
    usefulPhrases: ['For your safety, I’m unable to serve another alcoholic drink at this time.', 'I can bring you water or a non-alcoholic option instead.', 'Let me ask my supervisor to assist us.', 'The beverage package remains subject to our responsible-service policy.'],
    fallbackStrengthsZh: ['你已经识别到这是需要安全判断的拒酒场景。'],
    retryChecklistZh: ['保持平静，不与客人争论是否喝醉。', '依据 responsible-service policy 明确停止供酒。', '提供水或无酒精替代。', '尽早通知主管，必要时请求安保或医疗支持。'],
    referenceAnswer: 'I understand that you have a beverage package, but for your safety I’m unable to serve another alcoholic drink at this time. I can bring you water or a non-alcoholic option instead. Let me ask my supervisor to assist us. If you are feeling unwell, we can also arrange the appropriate support. I’ll stay calm and follow our responsible-service procedure.',
  },
}

export const getBarServerScenarioKnowledge = (scenarioId) => scenarioKnowledge[scenarioId] || null
