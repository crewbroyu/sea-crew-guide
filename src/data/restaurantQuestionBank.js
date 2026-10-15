// Restaurant question bank revision (2026-10-15), following an industry review of the 40-question
// bank: questions that listed the expected answer are shortened to what an interviewer would
// actually ask, every question gets the follow-ups an interviewer is likely to use, overlapping
// questions state their distinct focus in the tip, and practical demonstration and résumé
// questions are added. These are training questions edited from public guides and practitioner
// experience, not verified questions from any cruise line.

export const RESTAURANT_LEVEL_LABELS = {
  assistant_waiter: '助理服务员',
  waiter: '服务员',
  advanced: '进阶',
}

// Applied on top of the base questions and earlier refinements, by question id.
export const restaurantRevisions = {
  rs_01: {
    question: 'A family arrives, but there are no tables free right now. What would you say to them?',
    category: 'communication',
    tip: 'Greet them first, give an honest wait estimate from the host stand, and offer a practical option while they wait.',
    followUps: ["They don't want to wait. What do you do next?", 'They have a small child who is getting restless. Anything else?'],
    level: 'waiter',
  },
  rs_02: { followUps: ['Which POS systems have you used?', 'What do you do if the POS goes down during service?'], level: 'assistant_waiter' },
  rs_03: {
    question: 'How many plates can you carry safely?',
    category: 'safety',
    tip: 'Answer honestly from your experience, and explain when you use a tray or ask for help instead.',
    followUps: ['When would you use a tray instead?', 'The dining room is crowded and someone stops in front of you. What do you do?'],
    level: 'assistant_waiter',
  },
  rs_04: { followUps: ['How is breakfast service different from dinner service?'], level: 'assistant_waiter' },
  rs_05: { followUps: ['Role-play: take a drink order from me now.'], level: 'assistant_waiter' },
  rs_06: {
    question: 'A guest tells you they have a serious allergy as you start taking the order. What do you do?',
    category: 'safety',
    tip: 'Clarify the allergy, never promise a dish is safe yourself, and follow the venue allergy procedure with the galley before confirming.',
    followUps: ['Who do you tell, and how?', 'What would you never say to the guest?'],
    level: 'waiter',
  },
  rs_07: { followUps: ['The guest says the wine tastes wrong. What do you do?'], level: 'advanced' },
  rs_08: {
    question: 'A guest says their main course is cold. What do you do?',
    category: 'scenario',
    tip: 'Focus: fixing a faulty dish quickly. Apologize, remove it, get a fresh plate from the galley, and keep the table informed.',
    followUps: ['The replacement takes a long time. What do you tell the table?', 'The guest is still upset afterwards. What next?'],
    level: 'waiter',
  },
  rs_09: { followUps: ['What do you do first when three tables need you at the same time?'], level: 'waiter' },
  rs_10: { followUps: ['What did you check before taking an order to a room?', 'Tell me about a room service order that went wrong.'], level: 'waiter' },
  rs_11: { followUps: ['What exactly did you say to the guest?', 'At what point would you call your supervisor?'], level: 'waiter' },
  rs_12: { followUps: ['Describe one dish from that cuisine in English.'], level: 'assistant_waiter' },
  rs_13: {
    tip: 'Describe a basic cover clearly; the exact layout follows the venue standard.',
    followUps: ['Show me with the items on the table.', 'What changes when the guest orders fish?'],
    level: 'assistant_waiter',
  },
  rs_14: {
    question: 'Why do you want to work on a cruise ship?',
    category: 'ship_life',
    tip: 'Focus: motivation. Give your own reasons and show you understand the job, not only travel.',
    followUps: ['What do you think will be the hardest part?', 'How have you prepared for that?'],
    level: 'assistant_waiter',
  },
  rs_15: { followUps: ['Role-play: I am a table of four. Take our order without writing it down, then repeat it back.'], level: 'waiter' },
  rs_16: {
    question: "A guest tastes their dish and says they don't like it, but nothing is wrong with it. What do you do?",
    category: 'scenario',
    tip: "Focus: a preference, not a fault. Stay positive, offer an alternative within the venue's policy, and do not argue about taste.",
    followUps: ['The guest asks for something that is not on the menu instead. What do you say?'],
    level: 'waiter',
  },
  rs_17: {
    tip: "Follow the restaurant's procedure for holding and releasing tables, try to reach the guests through the host stand, and check with your supervisor.",
    followUps: ['Other guests are waiting for a table. What do you tell them?', 'The party arrives after the table was given away. What do you do?'],
    level: 'waiter',
  },
  rs_18: { followUps: ['What exactly would you say to the guest?', 'Who else needs to know?'], level: 'waiter' },
  rs_19: { followUps: ['What exactly did you do yourself?', 'What was the result?'], level: 'waiter' },
  rs_20: {
    question: 'How do you keep your energy up on a long shift?',
    tip: 'Focus: getting through one demanding day. Give real habits for food, water, breaks, and staying friendly when tired.',
    followUps: ['What do you do on a day when you feel very tired?'],
    level: 'assistant_waiter',
  },
  rs_21: { followUps: ['The coworker is your friend. Does that change anything?'], level: 'assistant_waiter' },
  rs_22: { followUps: ['They want something that takes a long time to cook. What do you say?'], level: 'waiter' },
  rs_23: { followUps: ['Tell me about a conflict you had with a coworker.'], level: 'assistant_waiter' },
  rs_24: { followUps: ['Recommend a dessert to me now.'], level: 'advanced' },
  rs_25: { followUps: ['What are you doing now to get there?'], level: 'assistant_waiter' },
  rs_26: {
    question: 'Walk me through serving a four-course dinner to a table of four.',
    tip: "Explain your steps and how you keep the table's courses together; course order and serving side follow the venue's service style.",
    followUps: ['The main course is late from the galley. What do you tell the table?'],
    level: 'waiter',
  },
  rs_27: { followUps: ['The guest has a small budget. What do you suggest?'], level: 'advanced' },
  rs_28: { followUps: ['The dish has already been served. What changes?'], level: 'waiter' },
  rs_29: {
    question: 'How many tables did you look after in your last job?',
    category: 'behavioral',
    tip: 'Give a real number and the type of service, then be ready to describe your busiest shift.',
    followUps: ['Tell me about your busiest shift.', 'What did you do to keep orders accurate?'],
    level: 'waiter',
  },
  rs_30: { followUps: ['The wrong dish has already been cooked. What happens next?'], level: 'assistant_waiter' },
  rs_31: { followUps: ['You are not sure whether the sauce contains dairy. What do you say?'], level: 'waiter' },
  rs_32: {
    question: 'The guest is unhappy, but the chef says the dish was made correctly. How do you handle it?',
    tip: 'Focus: standing between the guest and the galley. Do not argue with either side; keep it factual and find a practical solution with your supervisor.',
    followUps: ['What do you say to the chef?', 'What do you say to the guest?'],
    level: 'waiter',
  },
  rs_33: { followUps: ['What do you check last, just before the doors open?'], level: 'assistant_waiter' },
  rs_34: { followUps: ['Glass is on the floor near a child. What is your first action?'], level: 'assistant_waiter' },
  rs_35: { followUps: ['You feel fine again an hour later. Can you go back to work?'], level: 'assistant_waiter' },
  rs_36: {
    question: 'Role-play: I am a guest at a noisy table. Take my order and repeat it back to me.',
    tip: 'Speak to the interviewer as if they were the guest. Use short questions, repeat the key details, and confirm allergies.',
    followUps: ['[As the guest] Sorry, I said no onions. Can you check again?'],
    level: 'assistant_waiter',
  },
  rs_37: { followUps: ['The assistant waiter is new and slow. What do you do?'], level: 'waiter' },
  rs_38: { followUps: ['The guest insists. What do you say?'], level: 'waiter' },
  rs_39: { followUps: ['How do you know when a table wants you?'], level: 'advanced' },
  rs_40: {
    question: 'How will you stay reliable over a contract of several months?',
    tip: 'Focus: the whole contract, not one shift. Talk about routines, health, homesickness, and keeping standards when the work feels repetitive.',
    followUps: ['What will you do if you feel homesick?', 'How will you keep your standards up in month five?'],
    level: 'assistant_waiter',
  },
}

export const restaurantAdditions = [
  {
    id: 'rs_41', question: 'What kind of restaurant did you work in last, and how many seats did it have?', category: 'behavioral', difficulty: 'easy',
    tip: 'Résumé check. Give the real venue type, size, and your role; interviewers compare this with your CV.',
    keywords: ['restaurant', 'seats', 'role', 'service', 'duties'],
    followUps: ['How many tables were you responsible for?', 'What were your main duties?'], level: 'assistant_waiter',
  },
  {
    id: 'rs_42', question: 'What did a normal shift look like in your last job, from start to finish?', category: 'behavioral',
    tip: 'Résumé check. Walk through opening, service, and closing duties you really did.',
    keywords: ['shift', 'opening', 'service', 'closing', 'duties'],
    followUps: ['Which part were you best at?', 'Which part did you find hardest?'], level: 'assistant_waiter',
  },
  {
    id: 'rs_43', question: 'Why did you leave your last job?', category: 'behavioral', difficulty: 'easy',
    tip: 'Be honest and brief, stay positive about your previous employer, and link it to this role.',
    keywords: ['honest', 'positive', 'growth', 'reason', 'role'],
    followUps: ['What would your last supervisor say about you?'], level: 'assistant_waiter',
  },
  {
    id: 'rs_44', question: 'Pick a dish you know well and describe it to me as if I were a guest.', category: 'demonstration',
    tip: 'Demonstration. Name the dish, the main ingredients, how it is cooked, and why a guest might enjoy it, in simple English.',
    keywords: ['ingredients', 'cooked', 'taste', 'guest', 'recommend'],
    followUps: ['Does it contain nuts or dairy?', 'What would you suggest to drink with it?'], level: 'waiter',
  },
  {
    id: 'rs_45', question: 'Here is a menu. Recommend two drinks for a guest who is having fish, and tell me why.', category: 'sales', difficulty: 'hard',
    tip: 'Demonstration with a real menu. Ask one question about taste first, then explain two options simply; do not pretend to expert knowledge.',
    keywords: ['menu', 'recommend', 'taste', 'pairing', 'guest'],
    followUps: ["The guest doesn't drink alcohol. What else?"], level: 'advanced',
  },
  {
    id: 'rs_46', question: 'Name these items and tell me what each one is for.', category: 'demonstration', difficulty: 'easy',
    tip: 'Demonstration with cutlery and glassware, such as fish knife, dessert spoon, water glass, and wine glass.',
    keywords: ['cutlery', 'glassware', 'fish knife', 'dessert spoon', 'glass'],
    followUps: ['Where would you place them for a main course?'], level: 'assistant_waiter',
  },
  {
    id: 'rs_47', question: 'Show me how you would set a dinner cover for one guest.', category: 'demonstration',
    tip: "Demonstration. Set a basic cover neatly and explain it; the exact layout follows the venue's standard.",
    keywords: ['cover', 'cutlery', 'glass', 'napkin', 'standard'],
    followUps: ['What changes if the guest orders soup?'], level: 'assistant_waiter',
  },
  {
    id: 'rs_48', question: 'Role-play: the main course for my table is running late. Come and explain it to me.', category: 'demonstration', difficulty: 'hard',
    tip: 'Speak to the interviewer as the guest. Apologize, give an honest update from the galley, and offer something practical without overpromising.',
    keywords: ['apologize', 'update', 'galley', 'honest', 'offer'],
    followUps: ['[As the guest] We have a show to catch. What can you do?'], level: 'waiter',
  },
  {
    id: 'rs_49', question: 'Role-play: take a drink order from me and repeat it back.', category: 'demonstration', difficulty: 'easy',
    tip: 'Speak to the interviewer as the guest. Greet, ask, listen, and repeat the order back clearly.',
    keywords: ['greet', 'order', 'repeat', 'confirm', 'clear'],
    followUps: ['[As the guest] Actually, make one of those without ice.'], level: 'assistant_waiter',
  },
  {
    id: 'rs_50', question: 'Tell me about a mistake you made at work.', category: 'behavioral', difficulty: 'hard',
    tip: 'Use a real, small mistake. Expect detailed follow-ups, so only describe what really happened.',
    keywords: ['mistake', 'action', 'responsibility', 'result', 'learned'],
    followUps: ['What exactly did you say?', 'Who handled the next step?', 'What was the result?'], level: 'waiter',
  },
].map((question, index) => ({ difficulty: 'medium', ...question, order: 41 + index }))
