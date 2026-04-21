// 岗位场景训练数据
const scenarioData = {
  bar_server: {
    jobTitle: '酒吧服务员',
    jobTitleEn: 'Bar Server',
    scenarios: [
      {
        id: 'S001',
        day: 1,
        title: 'First Guest at the Bar',
        titleEn: 'First Guest at the Bar',
        dialogue: [
          { role: 'Guest', text: 'Hi, what do you recommend?' },
          { role: 'You', text: 'Good evening! I recommend our signature mojito. It\'s fresh and refreshing.' },
          { role: 'Guest', text: 'That sounds good. What\'s in it?' },
          { role: 'You', text: 'It has white rum, lime juice, mint leaves, sugar, and soda water.' },
          { role: 'Guest', text: 'Perfect, I\'ll have one.' },
          { role: 'You', text: 'Great choice! I\'ll make it for you right away.' }
        ],
        keywords: ['recommend', 'signature', 'fresh', 'ingredients'],
        patterns: ['I recommend...', 'That sounds good.'],
        interview_questions: [
          { id: 'bs_01', text: 'How would you recommend a cocktail to a guest?' },
          { id: 'bs_03', text: 'How do you greet a guest at the bar?' }
        ]
      },
      {
        id: 'S002',
        day: 2,
        title: 'Guest with Dietary Restrictions',
        titleEn: 'Guest with Dietary Restrictions',
        dialogue: [
          { role: 'Guest', text: 'Do you have any non-alcoholic options?' },
          { role: 'You', text: 'Absolutely! We have several mocktails. Would you like something fruity or refreshing?' },
          { role: 'Guest', text: 'I prefer something with mint, but I\'m allergic to strawberries.' },
          { role: 'You', text: 'No problem. Our virgin mojito is perfect - it has mint, lime, and soda water, no strawberries.' },
          { role: 'Guest', text: 'That sounds great. I\'ll have that.' },
          { role: 'You', text: 'Coming right up! I\'ll make sure to avoid any strawberry products.' }
        ],
        keywords: ['non-alcoholic', 'allergic', 'options', 'virgin'],
        patterns: ['Do you have any... options?', 'I\'m allergic to...'],
        interview_questions: [
          { id: 'bs_08', text: 'How do you keep track of multiple drink orders?' },
          { id: 'bs_10', text: 'How do you ensure responsible alcohol service?' }
        ]
      },
      {
        id: 'S003',
        day: 3,
        title: 'Busy Evening Rush',
        titleEn: 'Busy Evening Rush',
        dialogue: [
          { role: 'Guest 1', text: 'Hey, can I get a beer?' },
          { role: 'You', text: 'Sure! What kind would you like?' },
          { role: 'Guest 2', text: 'Excuse me, I need another margarita.' },
          { role: 'You', text: 'I\'ll be right with you after I help this guest.' },
          { role: 'Guest 1', text: 'Just a Bud Light please.' },
          { role: 'You', text: 'Coming up. And for you, another margarita?' },
          { role: 'Guest 2', text: 'Yes, thanks.' },
          { role: 'You', text: 'No problem, I\'ll make it fresh for you.' }
        ],
        keywords: ['busy', 'rush', 'multiple', 'prioritize'],
        patterns: ['I\'ll be right with you.', 'Coming up.'],
        interview_questions: [
          { id: 'bs_08', text: 'How do you keep track of multiple drink orders?' },
          { id: 'bs_19', text: 'How do you manage stress during peak hours?' }
        ]
      },
      {
        id: 'S004',
        day: 4,
        title: 'Complaint About Drink',
        titleEn: 'Complaint About Drink',
        dialogue: [
          { role: 'Guest', text: 'Excuse me, this cocktail is too strong.' },
          { role: 'You', text: 'I\'m sorry to hear that. Let me fix it for you right away. Would you like less alcohol or more mixer?' },
          { role: 'Guest', text: 'More mixer, please. It\'s almost all rum.' },
          { role: 'You', text: 'Of course. I\'ll remake it with more soda water and lime.' },
          { role: 'Guest', text: 'Thank you, I appreciate that.' },
          { role: 'You', text: 'No problem at all. Your satisfaction is important to us.' }
        ],
        keywords: ['complaint', 'fix', 'remake', 'satisfaction'],
        patterns: ['I\'m sorry to hear that.', 'Let me fix it for you.'],
        interview_questions: [
          { id: 'bs_09', text: 'What would you do if a guest complains about a drink?' },
          { id: 'bs_22', text: 'How do you handle constructive criticism from a supervisor?' }
        ]
      },
      {
        id: 'S005',
        day: 5,
        title: 'VIP Guest Service',
        titleEn: 'VIP Guest Service',
        dialogue: [
          { role: 'Guest', text: 'Hello, I\'m staying in the penthouse suite.' },
          { role: 'You', text: 'Welcome! It\'s a pleasure to have you with us. Would you like your usual drink?' },
          { role: 'Guest', text: 'Yes, my usual please. And can you make it extra strong?' },
          { role: 'You', text: 'Absolutely, sir. I\'ll make it exactly as you like it.' },
          { role: 'Guest', text: 'Great, and could you bring some nuts as well?' },
          { role: 'You', text: 'Of course, right away. Is there anything else I can get for you?' }
        ],
        keywords: ['VIP', 'usual', 'preference', 'service'],
        patterns: ['It\'s a pleasure to have you.', 'Would you like your usual?'],
        interview_questions: [
          { id: 'bs_19', text: 'A guest is celebrating a birthday. How would you make it special?' },
          { id: 'bs_23', text: 'Describe your ideal bar team.' }
        ]
      },
      {
        id: 'S006',
        day: 6,
        title: 'Last Call',
        titleEn: 'Last Call',
        dialogue: [
          { role: 'You', text: 'Excuse me everyone, last call for alcohol in 10 minutes.' },
          { role: 'Guest', text: 'Can I get one more whiskey neat?' },
          { role: 'You', text: 'Sure, coming right up.' },
          { role: 'Guest', text: 'Make it two, actually.' },
          { role: 'You', text: 'Two whiskeys neat, got it. That will be your last drinks for tonight.' },
          { role: 'Guest', text: 'Perfect, thanks.' },
          { role: 'You', text: 'You\'re welcome. Enjoy the rest of your evening.' }
        ],
        keywords: ['last call', 'alcohol', 'final', 'evening'],
        patterns: ['Last call for alcohol.', 'That will be your last drink.'],
        interview_questions: [
          { id: 'bs_07', text: 'How would you handle a guest who has had too much to drink?' },
          { id: 'bs_10', text: 'How do you ensure responsible alcohol service?' }
        ]
      },
      {
        id: 'S007',
        day: 7,
        title: 'New Menu Introduction',
        titleEn: 'New Menu Introduction',
        dialogue: [
          { role: 'Guest', text: 'What\'s new on the menu?' },
          { role: 'You', text: 'We just added a new tropical cocktail called the Paradise Breeze. It\'s made with coconut rum, pineapple juice, and a splash of blue curacao.' },
          { role: 'Guest', text: 'That sounds interesting. What does it taste like?' },
          { role: 'You', text: 'It\'s sweet, fruity, and has a nice coconut flavor. Perfect for a tropical vibe.' },
          { role: 'Guest', text: 'I\'ll try one.' },
          { role: 'You', text: 'Great choice! I\'ll make it for you with a pineapple garnish.' }
        ],
        keywords: ['new', 'menu', 'introduce', 'recommend'],
        patterns: ['We just added...', 'It\'s made with...'],
        interview_questions: [
          { id: 'bs_01', text: 'How would you recommend a cocktail to a guest?' },
          { id: 'bs_20', text: 'How would you upsell premium drinks without being pushy?' }
        ]
      },
      {
        id: 'S008',
        day: 8,
        title: 'Team Collaboration',
        titleEn: 'Team Collaboration',
        dialogue: [
          { role: 'You', text: 'Hey, can you cover the bar for a minute? I need to restock limes.' },
          { role: 'Coworker', text: 'Sure, go ahead. I\'ll handle the guests.' },
          { role: 'Guest', text: 'Excuse me, can I get a vodka soda?' },
          { role: 'Coworker', text: 'Yes, coming right up.' },
          { role: 'You', text: 'Thanks for covering. I\'ve restocked all the garnishes.' },
          { role: 'Coworker', text: 'No problem, we\'re a team.' },
          { role: 'You', text: 'Absolutely. Let me help with the orders now.' }
        ],
        keywords: ['team', 'cover', 'restock', 'collaboration'],
        patterns: ['Can you cover...?', 'We\'re a team.'],
        interview_questions: [
          { id: 'bs_14', text: 'How do you handle a disagreement with a coworker?' },
          { id: 'bs_23', text: 'Describe your ideal bar team.' }
        ]
      },
      {
        id: 'S009',
        day: 9,
        title: 'Payment Handling',
        titleEn: 'Payment Handling',
        dialogue: [
          { role: 'Guest', text: 'Can I get the check, please?' },
          { role: 'You', text: 'Sure, let me bring that right over.' },
          { role: 'Guest', text: 'Here\'s my card.' },
          { role: 'You', text: 'Thank you. Would you like to add a tip?' },
          { role: 'Guest', text: 'Yes, 20% please.' },
          { role: 'You', text: 'Perfect. I\'ll process this for you.' },
          { role: 'Guest', text: 'Thanks for the great service.' },
          { role: 'You', text: 'You\'re very welcome! Have a wonderful night.' }
        ],
        keywords: ['payment', 'check', 'tip', 'process'],
        patterns: ['Can I get the check?', 'Would you like to add a tip?'],
        interview_questions: [
          { id: 'bs_16', text: 'How would you handle a guest who refuses to pay?' },
          { id: 'bs_11', text: 'Tell me about a time you went above and beyond for a guest.' }
        ]
      },
      {
        id: 'S010',
        day: 10,
        title: 'Closing Procedures',
        titleEn: 'Closing Procedures',
        dialogue: [
          { role: 'Manager', text: 'Time to start closing up. Make sure all guests are served.' },
          { role: 'You', text: 'Got it. I\'ll finish up with the last guests.' },
          { role: 'Guest', text: 'One more round please!' },
          { role: 'You', text: 'I\'m sorry, we\'re closing now. Can I get you anything non-alcoholic?' },
          { role: 'Guest', text: 'Alright, just a water then.' },
          { role: 'You', text: 'Coming right up. Thanks for understanding.' },
          { role: 'Manager', text: 'Good job. Now let\'s clean the bar area.' },
          { role: 'You', text: 'Let\'s get it done quickly so we can go home.' }
        ],
        keywords: ['closing', 'procedures', 'clean', 'finish'],
        patterns: ['We\'re closing now.', 'Let\'s clean the area.'],
        interview_questions: [
          { id: 'bs_19', text: 'How do you manage stress during peak hours?' },
          { id: 'bs_24', text: 'How would you train a new bar colleague?' }
        ]
      }
    ]
  }
};

export default scenarioData;