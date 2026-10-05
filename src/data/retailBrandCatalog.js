// Curated historical evidence, never a live inventory feed. Brand facts and assortment sources are separate.
export const RETAIL_BRAND_SOURCES = {
  "starboard": {
    "label": "Starboard · Spectrum of the Seas",
    "published": "2024-06-21",
    "url": "https://www.starboardretailgroup.com/starboard-unveils-curated-luxury-brand-assortment-aboard-spectrum-of-the-seas/"
  },
  "harding": {
    "label": "Harding+ · Queen Anne",
    "published": "2024-05-02",
    "url": "https://www.hardingretail.com/2024/05/02/harding-retail-launches-game-changing-retail-experience-cunard-queen-anne-cruise/"
  },
  "heinemann": {
    "label": "Heinemann Americas · Utopia 官方公告",
    "published": null,
    "url": "https://www.linkedin.com/posts/heinemann-americas-inc._delighted-to-continue-our-partnership-with-activity-7224752158120812546-6Zl1"
  }
}
export const RETAIL_CONCESSIONS = [
  {
    "id": "spectrum-beauty",
    "operator": "Starboard",
    "cruiseLine": "Royal Caribbean International",
    "ship": "Spectrum of the Seas",
    "store": "Beauty Avenue",
    "category": "美妆香水",
    "brands": [
      "chanel",
      "dior"
    ],
    "sourceId": "starboard",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  },
  {
    "id": "spectrum-omega",
    "operator": "Starboard",
    "cruiseLine": "Royal Caribbean International",
    "ship": "Spectrum of the Seas",
    "store": "Omega boutique",
    "category": "腕表",
    "brands": [
      "omega"
    ],
    "sourceId": "starboard",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  },
  {
    "id": "spectrum-regalia",
    "operator": "Starboard",
    "cruiseLine": "Royal Caribbean International",
    "ship": "Spectrum of the Seas",
    "store": "Regalia",
    "category": "腕表",
    "brands": [
      "longines"
    ],
    "sourceId": "starboard",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  },
  {
    "id": "queen-cabinet",
    "operator": "Harding+",
    "cruiseLine": "Cunard",
    "ship": "Queen Anne",
    "store": "Cabinet of Curiosities",
    "category": "可售藏品（公告未细分）",
    "brands": [
      "garrard",
      "launer",
      "chanel"
    ],
    "sourceId": "harding",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  },
  {
    "id": "queen-fragrance",
    "operator": "Harding+",
    "cruiseLine": "Cunard",
    "ship": "Queen Anne",
    "store": null,
    "category": "美妆香水",
    "brands": [
      "atkinsons"
    ],
    "sourceId": "harding",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  },
  {
    "id": "queen-wine",
    "operator": "Harding+",
    "cruiseLine": "Cunard",
    "ship": "Queen Anne",
    "store": null,
    "category": "酒类",
    "brands": [
      "chapel-down"
    ],
    "sourceId": "harding",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  },
  {
    "id": "utopia-preowned",
    "operator": "Heinemann Americas",
    "cruiseLine": "Royal Caribbean International",
    "ship": "Utopia of the Seas",
    "store": "Accessory Place",
    "category": "二手奢侈品",
    "brands": [
      "rolex",
      "louis-vuitton",
      "hermes",
      "chanel"
    ],
    "sourceId": "heinemann",
    "availability": "historical_unconfirmed",
    "verifiedAt": "2026-10-05"
  }
]
export const RETAIL_BRANDS = [
  {
    "id": "chanel",
    "name": "CHANEL",
    "moduleId": "beauty-fragrance",
    "url": "https://www.chanel.com/us/fragrance/women/c/7x1x1/",
    "intro": "入门认识 N°5、COCO MADEMOISELLE 与 CHANCE 香水系列；浓度和容量需逐件核对。此处香水基础不等于二手包袋鉴定能力。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:chanel",
      "revision": 1,
      "options": [
        "N°5、COCO MADEMOISELLE、CHANCE",
        "Seamaster、Speedmaster、De Ville",
        "Conquest、DolceVita、HydroConquest"
      ],
      "correct": 0,
      "prompt": "A guest asks for a CHANEL item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "以下哪组属于本课介绍的 CHANEL 香水系列？"
    }
  },
  {
    "id": "dior",
    "name": "Dior",
    "moduleId": "beauty-fragrance",
    "url": "https://www.dior.com/en_int/beauty/fragrance/womens-fragrance/j%E2%80%99adore/fragrances",
    "intro": "从 J’adore、Miss Dior 和 Sauvage 的系列名称开始辨识；先问使用场景与香调偏好，再按标签比较具体版本。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:dior",
      "revision": 1,
      "options": [
        "所有品牌通用的浓度名称",
        "一项全店折扣活动",
        "Dior 香水系列，仍需核对具体版本"
      ],
      "correct": 2,
      "prompt": "A guest asks for a Dior item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "客人提到 J’adore，你应先识别为什么？"
    }
  },
  {
    "id": "omega",
    "name": "OMEGA",
    "moduleId": "watch-basics",
    "url": "https://www.omegawatches.com/en-us/watches",
    "intro": "认识 Seamaster、Speedmaster、Constellation 和 De Ville 四个系列；系列名称不能代替具体型号的机芯、防水与保修说明。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:omega",
      "revision": 1,
      "options": [
        "所有型号机芯完全相同",
        "仍需查具体型号，不能概括所有技术参数",
        "任何型号都适合深潜"
      ],
      "correct": 1,
      "prompt": "A guest asks for a OMEGA item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "仅知道 Seamaster 系列名称，可以直接保证什么？"
    }
  },
  {
    "id": "longines",
    "name": "Longines",
    "moduleId": "watch-basics",
    "url": "https://www.longines.com/en-us/watches",
    "intro": "认识 HydroConquest、Conquest 与 DolceVita；用风格、尺寸和使用需求做初步比较，技术参数以型号为准。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:longines",
      "revision": 1,
      "options": [
        "HydroConquest、Conquest、DolceVita",
        "N°5、CHANCE、J’adore",
        "Wings、Fanfare、Traviata"
      ],
      "correct": 0,
      "prompt": "A guest asks for a Longines item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "哪组名称可用于 Longines 的系列入门？"
    }
  },
  {
    "id": "garrard",
    "name": "Garrard",
    "moduleId": "fashion-jewellery",
    "url": "https://www.garrard.com/",
    "intro": "从珠宝与高级珠宝定位入门，认识 Wings 与 Fanfare 系列名称；材质、宝石及证书按具体商品核对。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:garrard",
      "revision": 1,
      "options": [
        "金色外观和品牌名称",
        "其他系列的材质描述",
        "具体商品资料及随附证书"
      ],
      "correct": 2,
      "prompt": "A guest asks for a Garrard item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "介绍 Garrard 珠宝时，材质和宝石依据什么？"
    }
  },
  {
    "id": "launer",
    "name": "Launer",
    "moduleId": "bags-leather-goods",
    "url": "https://launer.com/",
    "intro": "认识英国皮具品牌与 Traviata 等包款名称；演示开合、容量及携带方式，压纹外观不能证明皮革物种。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:launer",
      "revision": 1,
      "options": [
        "只要是皮包就保证防水",
        "核对标签，压纹外观不能证明皮革物种",
        "直接保证是真鳄鱼皮"
      ],
      "correct": 1,
      "prompt": "A guest asks for a Launer item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "看到 Launer 包上的鳄鱼纹，怎样描述材质？"
    }
  },
  {
    "id": "atkinsons",
    "name": "Atkinsons",
    "moduleId": "beauty-fragrance",
    "url": "https://www.atkinsons1799.com/products/24-old-bond-street",
    "intro": "24 Old Bond Street 官方标为 Eau de Cologne、木质辛香调；相近名字或 Triple Extract 版本需要另核标签。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:atkinsons",
      "revision": 1,
      "options": [
        "Eau de Cologne",
        "所有版本都是 Parfum",
        "没有必要区分版本"
      ],
      "correct": 0,
      "prompt": "A guest asks for a Atkinsons item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "本课的 24 Old Bond Street 原版官方浓度标示是什么？"
    }
  },
  {
    "id": "chapel-down",
    "name": "Chapel Down",
    "moduleId": "liquor-confectionery-travel",
    "url": "https://chapeldown.com/",
    "intro": "从英国葡萄酒和英格兰起泡酒入门；不要把起泡酒统一称为 Champagne，产地、年份及酒精度按瓶身说明。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:chapel-down",
      "revision": 1,
      "options": [
        "所有带气泡的酒都叫 Champagne",
        "品牌名足以保证每瓶年份相同",
        "按瓶身说明产地，不把所有起泡酒叫 Champagne"
      ],
      "correct": 2,
      "prompt": "A guest asks for a Chapel Down item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "介绍 Chapel Down 的英格兰起泡酒，哪种说法合适？"
    }
  },
  {
    "id": "rolex",
    "name": "Rolex",
    "moduleId": "watch-basics",
    "url": "https://www.rolex.com/watches",
    "intro": "学习按型号、表况及随附文件介绍腕表。运营商公告中的二手商品，不自动代表参加品牌官方认证二手计划。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:rolex",
      "revision": 1,
      "options": [
        "能，任何运营商公告都代表品牌授权",
        "不能，需另查认证及具体文件",
        "能，二手与官方认证二手完全相同"
      ],
      "correct": 1,
      "prompt": "A guest asks for a Rolex item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "船店公告说有二手 Rolex，就能认定品牌官方 CPO 吗？"
    }
  },
  {
    "id": "louis-vuitton",
    "name": "Louis Vuitton",
    "moduleId": "bags-leather-goods",
    "url": "https://us.louisvuitton.com/eng-us/women/handbags/all-handbags/_/N-tfr7qdp",
    "intro": "包袋介绍先区分具体款式、尺寸与材质。二手销售另需核实表况、配件、来源和门店政策，不能仅凭外观保证真伪。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:louis-vuitton",
      "revision": 1,
      "options": [
        "表况、配件、来源及门店政策",
        "只看图案就保证真伪",
        "保证与新品售后条件一样"
      ],
      "correct": 0,
      "prompt": "A guest asks for a Louis Vuitton item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "二手 Louis Vuitton 包袋介绍应额外核对什么？"
    }
  },
  {
    "id": "hermes",
    "name": "Hermès",
    "moduleId": "bags-leather-goods",
    "url": "https://www.hermes.com/us/en/faq/products/availability/",
    "intro": "认识包袋品牌时区分官方新品销售与第三方二手商品。不能用品牌名承诺稀缺款库存、官方授权或相同保修。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:hermes",
      "revision": 1,
      "options": [
        "整支船队都能预订所有新品",
        "与官方新品店有相同库存",
        "仅说明该历史经营样本，不代表新品授权或现货"
      ],
      "correct": 2,
      "prompt": "A guest asks for a Hermès item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "第三方二手 Hermès 船店样本意味着什么？"
    }
  },
  {
    "id": "citizen",
    "name": "CITIZEN",
    "moduleId": "watch-basics",
    "url": "https://www.citizenwatch.com/us/en/technology-eco-drive",
    "intro": "Eco-Drive 使用自然光或人造光获取能量；充电、储能和操作说明按型号确认。本批资料尚未建立船舶售卖关联。",
    "verifiedAt": "2026-10-05",
    "lesson": {
      "id": "brand:citizen",
      "revision": 1,
      "options": [
        "所有型号都依靠上弦",
        "自然光或人造光",
        "只能依靠自然光"
      ],
      "correct": 1,
      "prompt": "A guest asks for a CITIZEN item. Write a short response using one fact from this lesson, a discovery question, and one detail you must verify locally.",
      "question": "Eco-Drive 的基础能量来源是什么？"
    }
  }
]
export function matchingConcessions(brandId, {operator='',ship='',category=''} = {}) {
 return RETAIL_CONCESSIONS.filter(record=>record.brands.includes(brandId) && (!operator || record.operator===operator) && (!ship || record.ship===ship) && (!category || record.category===category))
}
export function filterRetailBrands({query='',operator='',ship='',category='',evidence=''} = {}) {
 return RETAIL_BRANDS.filter(brand=>{
  const records=matchingConcessions(brand.id,{operator,ship,category})
  const any=matchingConcessions(brand.id).length>0
  return (!query || (brand.name+' '+brand.intro).toLowerCase().includes(query.trim().toLowerCase())) && (!(operator || ship || category) || records.length>0) && (!evidence || (evidence==='documented'?any:!any))
 })
}
