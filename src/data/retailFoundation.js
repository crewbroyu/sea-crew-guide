export const RETAIL_FOUNDATION_VERSION = 1
export const RETAIL_FOUNDATION_STORAGE_KEY = 'retail_foundation_v1'

export const retailFoundationSources = [
  { label: 'Harding+ onboard Retail Sales Associate role', url: 'https://careers.hardingretail.com/job/916513' },
  { label: 'NRF Foundation RISE Up retail credentials', url: 'https://web.nrffoundation.com/rise-up/credentials' },
  { label: 'LVMH Client Advisor role standards', url: 'https://www.lvmh.com/en/join-us/our-job-offers/LVM33708' },
  { label: 'NAMM participative retail selling process', url: 'https://www.namm.org/nammu/sales-training/participative-selling-music-retailers' },
]

export const retailFoundationDays = [
  {
    id: 'retail-role-rhythm', day: 1, duration: '25-35 min', title: 'The Job, the Guest and the Cruise Rhythm',
    mission: 'Explain what an onboard Retail Sales Associate actually does and open a guest conversation naturally.',
    shift: { location: 'Main Retail Store', time: 'Embarkation Evening · 6:00 PM', situation: 'Guests are exploring the ship and walking into the store for the first time.' },
    vocabulary: [
      { term: 'retail associate', ipa: '/ˈriːteɪl əˈsoʊsiət/', meaning: '零售销售顾问', example: 'A retail associate combines guest service, selling and store operations.' },
      { term: 'commission', ipa: '/kəˈmɪʃən/', meaning: '销售提成', example: 'Commission may depend on individual or team performance.' },
      { term: 'sea day', ipa: '/siː deɪ/', meaning: '航海日', example: 'Sea days can be the busiest trading days onboard.' },
      { term: 'brand ambassador', ipa: '/brænd æmˈbæsədər/', meaning: '品牌形象代表', example: 'You represent both the retailer and the brands you sell.' },
    ],
    knowledge: ['Daily work includes guest engagement, product recommendation, promotions, POS, stock, presentation and team support.', 'Trading hours change with the itinerary; sea days, events and port regulations affect the rhythm.', 'Travel is a benefit, not the job. Interview answers need evidence of service, sales discipline and adaptability.'],
    serviceLines: [
      { cue: 'Welcome without pressure', line: 'Welcome in. Please take your time, and I will be nearby if you would like help with a particular category.' },
      { cue: 'Create a relevant opening', line: 'Are you shopping for yourself, looking for a gift, or simply exploring what is available onboard?' },
      { cue: 'Acknowledge a waiting guest', line: 'Good evening. I will be with you shortly. Thank you for waiting.' },
    ],
    challenge: { role: 'Guest', prompt: "I'm just looking. I don't need any help right now." },
    quiz: { question: 'What is the best next move when a guest says they are just looking?', options: [{ id: 'a', text: 'Start a detailed product pitch immediately.' }, { id: 'b', text: 'Respect their space, offer specific help and remain available.' }, { id: 'c', text: 'Ignore the guest for the rest of the visit.' }], correctOptionId: 'b', explanation: 'A professional approach protects the guest’s space while leaving a natural path back into conversation.' },
  },
  {
    id: 'retail-discovery', day: 2, duration: '30-40 min', title: 'Needs Discovery Before Recommendation',
    mission: 'Move from a vague request to a useful recommendation by asking a short sequence of open and specific questions.',
    shift: { location: 'Beauty Boutique', time: 'Sea Day · 10:30 AM', situation: 'A guest wants a gift but has not chosen a category or budget.' },
    vocabulary: [
      { term: 'needs discovery', ipa: '/niːdz dɪˈskʌvəri/', meaning: '需求发现', example: 'Good needs discovery comes before product presentation.' },
      { term: 'preference', ipa: '/ˈprefrəns/', meaning: '偏好', example: 'May I ask about their style or fragrance preference?' },
      { term: 'occasion', ipa: '/əˈkeɪʒən/', meaning: '使用场合', example: 'Is it for a birthday or another special occasion?' },
      { term: 'budget range', ipa: '/ˈbʌdʒɪt reɪndʒ/', meaning: '预算范围', example: 'Do you have a comfortable budget range in mind?' },
    ],
    knowledge: ['Start broad, then narrow: purpose, recipient, preferences, occasion, budget and timing.', 'Listen for both functional and emotional needs instead of firing questions like a checklist.', 'Summarise the need before showing products so the guest can correct you.'],
    serviceLines: [
      { cue: 'Find the purpose', line: 'What brings you into the store today?' },
      { cue: 'Narrow the choice', line: 'What do they already enjoy, and is there anything they usually avoid?' },
      { cue: 'Confirm your understanding', line: 'So you are looking for a fresh, everyday gift within this range. Have I understood correctly?' },
    ],
    challenge: { role: 'Gift Shopper', prompt: 'I need a gift for my sister, but I really do not know what she would like.' },
    quiz: { question: 'Which discovery sequence gives the most useful recommendation?', options: [{ id: 'a', text: 'Show the highest-priced item first.' }, { id: 'b', text: 'Ask about recipient, preference, occasion and budget, then summarise.' }, { id: 'c', text: 'Ask only how much the guest can spend.' }], correctOptionId: 'b', explanation: 'Good discovery combines practical and emotional needs before any recommendation.' },
  },
  {
    id: 'retail-product-story', day: 3, duration: '35-45 min', title: 'Product Knowledge and Feature-to-Benefit Storytelling',
    mission: 'Describe a product accurately and connect two relevant features to the guest need.',
    shift: { location: 'Fragrance, Beauty and Watches', time: 'Sea Day · 2:00 PM', situation: 'Guests are comparing products across several premium categories.' },
    vocabulary: [
      { term: 'feature', ipa: '/ˈfiːtʃər/', meaning: '产品特征', example: 'The feature is what the product has or does.' },
      { term: 'benefit', ipa: '/ˈbenɪfɪt/', meaning: '对客人的实际价值', example: 'The benefit explains why that feature matters to this guest.' },
      { term: 'fragrance notes', ipa: '/ˈfreɪɡrəns noʊts/', meaning: '香调', example: 'This fragrance opens with fresh citrus notes.' },
      { term: 'warranty', ipa: '/ˈwɔːrənti/', meaning: '保修', example: 'Let me confirm the authorised warranty terms for this model.' },
    ],
    knowledge: ['Learn category basics for fragrance, beauty, watches, jewellery, liquor, fashion and logo merchandise.', 'Use feature, evidence and benefit; avoid empty words such as amazing or best.', 'Never invent ingredients, performance, authenticity documents, warranty, stock or medical effects.'],
    serviceLines: [
      { cue: 'Connect a feature to a need', line: 'Because you prefer something fresh for daytime, this lighter citrus profile may suit you better.' },
      { cue: 'Compare clearly', line: 'This option is more understated, while the other has a stronger evening character.' },
      { cue: 'Stay inside your knowledge', line: 'I do not want to give you inaccurate information, so let me verify that detail for you.' },
    ],
    challenge: { role: 'Guest', prompt: 'What makes this fragrance different from the one beside it?' },
    quiz: { question: 'What turns a product feature into a useful sales explanation?', options: [{ id: 'a', text: 'Connect the feature to the guest’s stated need.' }, { id: 'b', text: 'Call every item premium and amazing.' }, { id: 'c', text: 'Promise performance that is not in approved information.' }], correctOptionId: 'a', explanation: 'Feature-to-benefit language explains why a verified detail matters to this particular guest.' },
  },
  {
    id: 'retail-demonstration', day: 4, duration: '30-40 min', title: 'Demonstration, Comparison and Buying Signals',
    mission: 'Guide a short product comparison, invite participation and recognise when the guest is ready to decide.',
    shift: { location: 'Watches & Jewellery', time: 'Port Evening · 7:00 PM', situation: 'A couple is comparing two items before dinner.' },
    vocabulary: [
      { term: 'demonstration', ipa: '/ˌdemənˈstreɪʃən/', meaning: '产品演示', example: 'A demonstration should make the comparison easier, not longer.' },
      { term: 'buying signal', ipa: '/ˈbaɪɪŋ ˌsɪɡnəl/', meaning: '购买信号', example: 'Questions about payment, warranty or availability can be buying signals.' },
      { term: 'comparison', ipa: '/kəmˈpærɪsən/', meaning: '对比', example: 'Keep the comparison relevant to the guest priorities.' },
      { term: 'authorised seller', ipa: '/ˈɔːθəraɪzd ˈselər/', meaning: '授权销售方', example: 'Confirm authorised-seller information from approved material.' },
    ],
    knowledge: ['Ask permission before applying, spraying, opening or handling a product.', 'Compare no more than a few meaningful criteria tied to the guest need.', 'A buying signal is an invitation to clarify and close, not permission to pressure.'],
    serviceLines: [
      { cue: 'Invite participation', line: 'Would you like to try both options side by side so you can compare them comfortably?' },
      { cue: 'Check the reaction', line: 'Which of these feels closer to what you had in mind?' },
      { cue: 'Use a choice close', line: 'Would you prefer the classic design or the lighter everyday option?' },
    ],
    challenge: { role: 'Guest', prompt: 'I like both watches. I cannot decide which one is better for daily use.' },
    quiz: { question: 'A guest asks about warranty and availability. What may this indicate?', options: [{ id: 'a', text: 'A buying signal that should be clarified.' }, { id: 'b', text: 'Permission to pressure the guest.' }, { id: 'c', text: 'The guest is no longer interested.' }], correctOptionId: 'a', explanation: 'Buying signals are reasons to clarify and help the guest decide, never permission to apply pressure.' },
  },
  {
    id: 'retail-upsell-kpi', day: 5, duration: '35-45 min', title: 'Upselling, Cross-selling and Retail KPIs',
    mission: 'Add value without becoming pushy and explain the retail numbers a sales associate influences.',
    shift: { location: 'Promotional Table', time: 'Sea Day · 4:30 PM', situation: 'A guest has chosen one product and the store is running a verified multi-buy promotion.' },
    vocabulary: [
      { term: 'upselling', ipa: '/ˈʌpˌselɪŋ/', meaning: '升级到更高价值选择', example: 'Upselling should improve the fit, not simply increase the price.' },
      { term: 'cross-selling', ipa: '/ˈkrɒsˌselɪŋ/', meaning: '推荐相关搭配商品', example: 'Cross-selling connects a useful complementary product.' },
      { term: 'conversion rate', ipa: '/kənˈvɜːrʒən reɪt/', meaning: '成交转化率', example: 'Conversion rate compares transactions with shopping traffic.' },
      { term: 'average transaction value', ipa: '/ˈævərɪdʒ trænˈzækʃən ˈvæljuː/', meaning: '平均客单价', example: 'Relevant additions can improve average transaction value.' },
    ],
    knowledge: ['Common KPIs include target, conversion, units per transaction and average transaction value.', 'Upsell improves the chosen solution; cross-sell adds a related solution.', 'Stop after a clear decline. Ethical selling protects trust and repeat visits.'],
    serviceLines: [
      { cue: 'Offer a relevant upgrade', line: 'If you would like longer wear, I can show you the next option and explain the difference.' },
      { cue: 'Cross-sell with a reason', line: 'Because this is a gift, would a matching presentation set be useful?' },
      { cue: 'Respect a decline', line: 'Of course. We will keep it to the item you selected.' },
    ],
    challenge: { role: 'Guest', prompt: 'I have chosen this fragrance. I do not want the sales pitch, though.' },
    quiz: { question: 'When is cross-selling appropriate?', options: [{ id: 'a', text: 'Every time, even after a clear refusal.' }, { id: 'b', text: 'When the additional item has a clear reason connected to the guest’s purchase.' }, { id: 'c', text: 'Only when it is the most expensive item.' }], correctOptionId: 'b', explanation: 'Relevant additions can create value; repeated pressure damages trust and guest experience.' },
  },
  {
    id: 'retail-objections', day: 6, duration: '35-45 min', title: 'Objections, Promotions and Duty-free Accuracy',
    mission: 'Handle price, timing and comparison objections without inventing savings or customs advice.',
    shift: { location: 'Luxury Boutique', time: 'Port Evening · 8:15 PM', situation: 'A guest is comparing the onboard offer with an online listing.' },
    vocabulary: [
      { term: 'objection', ipa: '/əbˈdʒekʃən/', meaning: '购买异议', example: 'An objection may mean the guest needs clearer information.' },
      { term: 'duty-free', ipa: '/ˌdjuːti ˈfriː/', meaning: '免税销售', example: 'Duty-free does not mean every traveller has unlimited allowance.' },
      { term: 'customs allowance', ipa: '/ˈkʌstəmz əˈlaʊəns/', meaning: '海关免税额度', example: 'Customs allowances depend on the itinerary and destination.' },
      { term: 'promotion exclusion', ipa: '/prəˈmoʊʃən ɪkˈskluːʒən/', meaning: '促销排除条款', example: 'Let me check whether this brand is excluded from the promotion.' },
    ],
    knowledge: ['Acknowledge, clarify the real concern, respond with verified evidence, then check whether it is resolved.', 'Compare the exact model, currency, warranty, tax and seller conditions.', 'Never guarantee the lowest price, a tax saving or what customs will allow. Refer to approved information.'],
    serviceLines: [
      { cue: 'Clarify the objection', line: 'May I ask whether your main concern is the price, the warranty, or making the decision today?' },
      { cue: 'Avoid an unsupported promise', line: 'I cannot confirm your personal customs allowance, but I can show you the approved information for this itinerary.' },
      { cue: 'Check resolution', line: 'Does that answer your concern, or would you like me to verify another detail?' },
    ],
    challenge: { role: 'Price-conscious Guest', prompt: 'The sign says duty-free, so this must be cheaper than everywhere else, right?' },
    quiz: { question: 'Which statement about duty-free selling is safe and accurate?', options: [{ id: 'a', text: 'It is always the lowest price in the world.' }, { id: 'b', text: 'Every traveller has unlimited customs allowance.' }, { id: 'c', text: 'Price, tax and customs conditions must be checked against approved information.' }], correctOptionId: 'c', explanation: 'Retail staff should never guarantee savings or personal customs outcomes without verified information.' },
  },
  {
    id: 'retail-operations', day: 7, duration: '35-45 min', title: 'POS, Stock, Visual Standards and Loss Prevention',
    mission: 'Complete a transaction accurately while protecting merchandise, guest data and store standards.',
    shift: { location: 'Main Store Checkout', time: 'Sea Day · Closing Rush', situation: 'Several guests are waiting while the team prepares for closing checks.' },
    vocabulary: [
      { term: 'point of sale (POS)', ipa: '/pɔɪnt əv seɪl/', meaning: '销售收银系统', example: 'Confirm the item, price and payment before completing the POS transaction.' },
      { term: 'stock count', ipa: '/stɒk kaʊnt/', meaning: '库存盘点', example: 'Report stock differences through the approved process.' },
      { term: 'visual merchandising', ipa: '/ˈvɪʒuəl ˈmɜːrtʃəndaɪzɪŋ/', meaning: '视觉陈列', example: 'Visual merchandising keeps the store clear and easy to shop.' },
      { term: 'loss prevention', ipa: '/lɒs prɪˈvenʃən/', meaning: '商品与资金损失预防', example: 'Loss prevention protects guests, colleagues and merchandise.' },
    ],
    knowledge: ['Follow the approved POS flow for item, quantity, price, promotion, payment and receipt.', 'Never share login credentials, photograph payment details or improvise around a system control.', 'Report discrepancies, suspicious behaviour and damaged stock discreetly through the correct chain.'],
    serviceLines: [
      { cue: 'Confirm the transaction', line: 'Let me confirm the items and the promotion before I process the payment.' },
      { cue: 'Handle a system delay', line: 'The transaction is still processing. I will verify the status before trying it again.' },
      { cue: 'Escalate discreetly', line: 'I need my supervisor to verify this transaction before we continue.' },
    ],
    challenge: { role: 'Guest', prompt: 'The payment looked unsuccessful. Just run my card again quickly because I am late.' },
    quiz: { question: 'What should you do before retrying an uncertain card transaction?', options: [{ id: 'a', text: 'Verify the transaction status through the approved POS process.' }, { id: 'b', text: 'Run it repeatedly until one attempt works.' }, { id: 'c', text: 'Write down the card details for later.' }], correctOptionId: 'a', explanation: 'Verification prevents duplicate charges and protects payment accuracy and guest data.' },
  },
  {
    id: 'retail-service-recovery', day: 8, duration: '40-50 min', title: 'Returns, Complaints and Full Sea-day Handover',
    mission: 'Own a product concern, stay inside policy and complete a clear handover during a high-pressure shift.',
    shift: { location: 'Retail Guest Service Desk', time: 'Sea Day · 7:30 PM', situation: 'An event is running, the store is busy and a guest returns an opened product.' },
    vocabulary: [
      { term: 'return policy', ipa: '/rɪˈtɜːrn ˌpɒləsi/', meaning: '退换货政策', example: 'Check the current return policy before making a promise.' },
      { term: 'proof of purchase', ipa: '/pruːf əv ˈpɜːrtʃəs/', meaning: '购买凭证', example: 'May I see your receipt or another proof of purchase?' },
      { term: 'service recovery', ipa: '/ˈsɜːrvɪs rɪˈkʌvəri/', meaning: '服务补救', example: 'Good service recovery restores clarity and trust.' },
      { term: 'handover', ipa: '/ˈhændoʊvər/', meaning: '工作交接', example: 'The handover should include facts, action taken and next owner.' },
    ],
    knowledge: ['Listen and acknowledge before collecting receipt, condition, time and product facts.', 'Do not diagnose a reaction or promise a refund, exchange or compensation without authority.', 'A useful handover states the guest concern, verified facts, action taken, current status and next owner.'],
    serviceLines: [
      { cue: 'Acknowledge the concern', line: 'I am sorry this has caused concern. Let me check the purchase details and the product condition so I can involve the right person.' },
      { cue: 'Set a policy boundary', line: 'I cannot promise the outcome before the review, but I will stay with the case and keep you updated.' },
      { cue: 'Give a clean handover', line: 'The guest purchased this yesterday, has the receipt, and reports a reaction. I have not made a medical or refund promise.' },
    ],
    challenge: { role: 'Complaining Guest', prompt: 'This opened skincare set irritated my skin. I want a full refund right now.' },
    quiz: { question: 'What is the correct first response to an opened-product complaint?', options: [{ id: 'a', text: 'Promise a full refund immediately.' }, { id: 'b', text: 'Acknowledge the concern, collect verified facts and involve the authorised person.' }, { id: 'c', text: 'Diagnose the cause of the skin reaction.' }], correctOptionId: 'b', explanation: 'Service recovery begins with listening and facts while staying inside policy and authority.' },
  },
]

export const getRetailFoundationProgress = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RETAIL_FOUNDATION_STORAGE_KEY) || '{}')
    return saved?.version === RETAIL_FOUNDATION_VERSION ? saved : { version: RETAIL_FOUNDATION_VERSION, days: {} }
  } catch {
    return { version: RETAIL_FOUNDATION_VERSION, days: {} }
  }
}

export const getCompletedRetailDays = (progress) => retailFoundationDays.filter((day) => progress?.days?.[day.id]?.completedAt).length
