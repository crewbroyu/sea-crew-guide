export const RETAIL_KNOWLEDGE_CURRICULUM = {
  "stockroom-inventory": {
    "id": "knowledge:stockroom-inventory",
    "revision": 1,
    "options": [
      "先把破封纸箱分开并报告",
      "直接补到货架",
      "调整系统数量让它一致"
    ],
    "correct": 0,
    "prompt": "Your delivery has a broken seal. Explain your next steps to your supervisor.",
    "dayId": "retail-operations",
    "drillId": "retail-stock-handover"
  },
  "promotions-events": {
    "id": "knowledge:promotions-events",
    "revision": 1,
    "options": [
      "承诺全场叠加优惠",
      "先打折再问主管",
      "核对日期、门槛、排除项和赠品库存"
    ],
    "correct": 2,
    "prompt": "A guest wants to combine two promotions. Explain what you will check before quoting the total.",
    "dayId": "retail-upsell-kpi",
    "drillId": "retail-promotion-terms"
  },
  "watch-basics": {
    "id": "knowledge:watch-basics",
    "revision": 1,
    "options": [
      "所有手表都能潜水",
      "将自然光或人造光转化为能量；充电与续航按型号核对",
      "所有型号充电时间相同"
    ],
    "correct": 1,
    "prompt": "A guest asks how this Eco-Drive watch works. Explain the basic idea and one model-specific detail to check.",
    "dayId": "retail-product-story",
    "drillId": "retail-clarify-model"
  },
  "fashion-materials": {
    "id": "knowledge:fashion-materials",
    "revision": 1,
    "options": [
      "按成分标签说明棉的百分比",
      "摸起来像棉就说纯棉",
      "混纺衣服都是纯棉"
    ],
    "correct": 0,
    "prompt": "A guest asks whether a blended shirt is pure cotton. Explain how you will verify the composition and care instructions.",
    "dayId": "retail-product-story",
    "drillId": "retail-size-colour"
  },
  "bags-leather-goods": {
    "id": "knowledge:bags-leather-goods",
    "revision": 1,
    "options": [
      "只能手提的包",
      "所有皮具都能防水",
      "Crossbody bag：斜跨身体、方便腾出双手"
    ],
    "correct": 2,
    "prompt": "A guest wants a hands-free travel bag. Compare a crossbody with another style and check material and size.",
    "dayId": "retail-demonstration",
    "drillId": "retail-product-comparison"
  },
  "fashion-jewellery": {
    "id": "knowledge:fashion-jewellery",
    "revision": 1,
    "options": [
      "所有金色饰品都有同一纯度",
      "gold tone 描述颜色，不证明含金量",
      "gold tone 就是足金"
    ],
    "correct": 1,
    "prompt": "A guest asks whether a gold-tone necklace is solid gold. Respond using the label and avoid unsupported claims.",
    "dayId": "retail-product-story",
    "drillId": "retail-product-comparison"
  },
  "logo-souvenirs": {
    "id": "knowledge:logo-souvenirs",
    "revision": 1,
    "options": [
      "先问收礼人、预算和便携需求",
      "只推荐最贵的纪念品",
      "承诺所有礼物都可退"
    ],
    "correct": 0,
    "prompt": "Help a guest choose a small souvenir for a family member. Ask two useful questions before recommending.",
    "dayId": "retail-discovery",
    "drillId": "retail-budget-gift"
  },
  "general-store": {
    "id": "knowledge:general-store",
    "revision": 1,
    "options": [
      "直接推荐药品组合",
      "根据自己的经验给出剂量",
      "帮助查看标签并转介医疗团队"
    ],
    "correct": 2,
    "prompt": "A guest asks whether two medicines can be combined. Explain your service boundary and where to seek help.",
    "dayId": "retail-service-recovery",
    "drillId": "retail-return-concern"
  },
  "beauty-fragrance": {
    "id": "knowledge:beauty-fragrance",
    "revision": 1,
    "options": [
      "保证香味适合所有人",
      "标记试香纸，分开比较变化",
      "混喷在同一张试香纸"
    ],
    "correct": 1,
    "prompt": "A guest is comparing two fragrances. Ask about preferences and explain a clear blotter-testing sequence.",
    "dayId": "retail-discovery",
    "drillId": "retail-product-comparison"
  },
  "liquor-confectionery-travel": {
    "id": "knowledge:liquor-confectionery-travel",
    "revision": 1,
    "options": [
      "核对接口、电气规格及标签限制",
      "外形相似就保证可用",
      "保证适合所有国家"
    ],
    "correct": 0,
    "prompt": "A guest asks whether a travel adapter will work. Clarify the device and destination, then explain what you need to verify.",
    "dayId": "retail-operations",
    "drillId": "retail-event-exclusions"
  }
}
