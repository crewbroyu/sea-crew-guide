// English copy of the learner-facing text in barServerTrial.js, keyed by scenario id.
// Arrays of objects merge item by item, so each array must keep the Chinese array's order and length.
// Fields sent to the AI (interviewerQuestion, focus, keywords) are not overridden, so scoring is the
// same in both languages. Dialogue translations are empty: English learners read the English line itself.
export const barServerTrialScenariosEn = {
  bar_server_drink_recommendation_01: {
    shortTitle: 'Drink recommendation',
    title: 'Busy Night: Recommend the right drink for a guest',
    imageAlt: 'A busy evening at a cruise ship pool bar. A Bar Server listens to a guest who wants a drink recommendation.',
    setting: 'It is 8:30 p.m. on a sea day and the Pool Bar is in its rush hour. Several guests are waiting, and one guest comes to the bar to ask you for advice.',
    task: 'Reply to the guest in English as the Bar Server. Aim for 30–60 seconds.',
    checkpoints: [
      'First check one key preference: alcohol or not, the base spirit, or something else important',
      'Recommend one specific drink and describe the taste in words the guest understands',
      'Check the beverage package or price naturally, without pushing a sale',
      'End by confirming the choice and moving the order forward',
    ],
    watchOuts: [
      'Do not list many drink names and leave the guest to guess',
      'Do not invent the cruise line’s packages, prices or alcohol rules',
      'Even during a rush, stay short, accurate and polite',
    ],
    lesson: {
      objective: 'Learn to check one key preference first, use basic drinks knowledge to recommend one drink that really fits, and close the service.',
      dialogue: [
        { translation: '' },
        { translation: '' },
        { translation: '' },
        { translation: '' },
      ],
      knowledge: [
        {
          title: 'A Bar Server does more than name drinks',
          body: 'Your job is to understand the request, narrow the choice, describe the flavour accurately, check the price or package, and then pass a clear order to the Bartender. The Bartender makes complex cocktails, but the guest’s experience starts with how you communicate.',
        },
        {
          title: 'Ask one question that changes your recommendation',
          body: 'A rush is no time for five or six questions. Usually one key question — alcohol or not, the preferred base spirit, or less sugar — is enough to avoid a random recommendation.',
        },
        {
          title: 'Always explain why your recommendation fits',
          body: 'Do not just say “I recommend…”. Add at least the flavour, sweetness or texture, so the guest can hear how the drink matches “light”, “citrusy” and “not too sweet”.',
        },
        {
          title: 'Check packages and changes before you promise',
          body: 'Rules differ between cruise lines, itineraries and packages. You can offer to check for the guest, but never promise that a drink is free, included in the package, or that the recipe can be changed.',
        },
      ],
      drinkComparison: [
        {
          profile: 'Citrusy, but the orange juice can make it sweeter and heavier',
          fit: 'Not the safest first choice here',
        },
        {
          profile: 'Fresh with lemon flavour; sweetness depends on the syrup',
          fit: 'Check that the guest likes gin, and whether less syrup is possible',
        },
        {
          profile: 'Light, refreshing and low in sweetness',
          fit: 'A safe choice if the guest likes vodka',
        },
      ],
      serviceSequence: [
        'Check one key preference: alcohol, base spirit or sweetness',
        'Recommend one specific drink and explain why the flavour fits',
        'If needed, give one truly different alternative — do not read out the menu',
        'Check the package, price or special request; do not promise on your own',
        'Confirm the guest’s choice and place the order accurately',
      ],
      vocabulary: [
        { meaning: 'with a strong citrus taste' },
        { meaning: 'fresh and cooling' },
        { meaning: 'with less sugar syrup' },
        { meaning: 'a prepaid drinks plan on board' },
      ],
      decisionCheck: {
        question: 'The guest wants something light, citrusy and not too sweet, and says vodka is fine. During the rush, what is the best next step?',
        options: [
          {
            text: 'Recommend a Screwdriver right away, because it has orange juice',
            explanation: 'A Screwdriver is citrusy, but orange juice can be sweet and heavy. “It has orange juice” is not enough to say it fully matches.',
          },
          {
            text: 'Recommend a Vodka Soda with Lime, explain that it is light and not sweet, and offer to check the package',
            explanation: 'This answer covers the base spirit, the texture, the citrus flavour and the sweetness, and it closes the service within your authority.',
          },
          {
            text: 'Describe five cocktails at once and let the guest choose',
            explanation: 'Listing many options during a rush makes the guest do the work, and it does not show that you understood what they want.',
          },
        ],
      },
      interviewTransfer: {
        tip: 'Turn this scenario into a method: check the preference → recommend and explain → check the rules → confirm the order.',
      },
    },
  },
  bar_server_complaint_recovery_02: {
    shortTitle: 'Complaint recovery',
    title: 'Wrong Drink: The guest waited a long time, and the drink is too sweet',
    imageAlt: 'In a busy cruise ship bar, a guest complains that a cocktail is too sweet while a Bar Server listens.',
    setting: 'The evening show has just finished and the bar is busy. A guest pushes back the cocktail they just received and is clearly unhappy. Other guests are waiting nearby.',
    task: 'In English, take the complaint, confirm the problem, offer a solution and close the service.',
    checkpoints: [
      'First acknowledge the wait and the taste problem — do not argue or blame anyone',
      'Confirm the original order and the flavour the guest really wanted',
      'Offer a workable fix: remake, replace, or ask your supervisor for help',
      'Explain the next step and follow up after the new drink arrives',
    ],
    watchOuts: [
      'Do not blame the bartender, the system, or the guest for ordering wrong',
      'Do not promise a free drink, refund or extra compensation without approval',
      'Do not just say “sorry” and walk away',
    ],
    lesson: {
      objective: 'Learn to turn an apology into full service recovery: confirm the problem, offer a workable fix, keep the guest updated and check the result.',
      dialogue: [
        { translation: '' },
        { translation: '' },
        { translation: '' },
        { translation: '' },
      ],
      knowledge: [
        { title: 'Acknowledge the impact before you explain', body: 'Acknowledge both the waiting time and the drink that missed expectations. Right now the guest needs to feel understood, not to hear why the bar is busy.' },
        { title: 'Confirm the facts and the real need', body: 'Check the original order, any special request and the flavour the guest expected, so you do not remake the drink at random before you understand the problem.' },
        { title: 'Only promise what you are allowed to do', body: 'You can promise to check right away, speak to the Bartender and give updates. Free drinks, refunds or compensation usually need a supervisor’s approval.' },
        { title: 'Delivery is not the end — the follow-up closes the loop', body: 'After the replacement arrives, check the taste and whether the guest is happy. This shows you own the result instead of passing the problem on and leaving.' },
      ],
      drinkComparison: [
        { build: 'Make the original recipe again and fix the mistake', profile: 'Best when the drink was made or delivered wrong', fit: 'Check the order and special requests first' },
        { build: 'Suggest a different drink that suits the guest’s taste', profile: 'Best when the original drink is the wrong style', fit: 'Confirm the base spirit and flavour again' },
        { build: 'For refunds, compensation or an escalated complaint', profile: 'Someone with authority decides how to make it right', fit: 'Do not promise compensation yourself' },
      ],
      serviceSequence: [
        'Acknowledge the wait and the drink problem, and apologise sincerely',
        'Check the order and the flavour the guest expected',
        'Offer a remake, a replacement or supervisor support',
        'Tell the guest what will happen next and keep them updated',
        'Follow up after the new drink arrives',
      ],
      vocabulary: [
        { meaning: 'did not match what you hoped for' },
        { meaning: 'check the details of the order' },
        { meaning: 'a suitable new drink or solution' },
        { meaning: 'tell you how things are going' },
      ],
      decisionCheck: {
        question: 'The guest complains about a long wait and a drink that is too sweet. What is the most professional first set of actions?',
        options: [
          { text: 'Explain that tonight is very busy and that the recipe is sweet anyway', explanation: 'This focuses on defending yourself and does nothing for the guest’s experience or needs.' },
          { text: 'Acknowledge the wait and the taste problem, confirm the order and what they expected, then arrange an approved remake or replacement', explanation: 'These actions combine empathy, checking the facts and a solution you can actually deliver.' },
          { text: 'Immediately promise a more expensive drink for free', explanation: 'Promising compensation without approval may break policy, and you still have not checked what the guest really wants.' },
        ],
      },
      interviewTransfer: { tip: 'Organise a real example as: acknowledge the impact → check the problem → fix it → follow up on the result.' },
    },
  },
  bar_server_responsible_service_03: {
    shortTitle: 'Responsible service',
    title: 'Last Drink: A guest who may be drunk insists on a double whisky',
    imageAlt: 'Near closing time at a cruise ship bar, a Bar Server calmly handles a guest who keeps ordering strong drinks.',
    setting: 'It is almost Last Call. A guest is slurring their words and is unsteady on their feet, but insists on a double whisky and starts asking why you are not serving them right away.',
    task: 'In English, show how you would safely and respectfully stop serving alcohol, and explain what you would do next.',
    checkpoints: [
      'Stay calm and do not argue with the guest about whether they are drunk',
      'Say clearly but respectfully that you cannot serve more alcohol now',
      'Offer water, a non-alcoholic drink or another safe alternative',
      'Inform your supervisor, and call security or medical support if needed',
    ],
    watchOuts: [
      'Do not say things like “You are drunk” — it can make the conflict worse',
      'A beverage package never overrides the responsible-service policy',
      'Do not handle an escalating or possibly unsafe situation alone',
    ],
    lesson: {
      objective: 'Learn to stop serving alcohol without embarrassing the guest or arguing, offer a safe alternative, and escalate on time by following the procedure.',
      dialogue: [
        { translation: '' },
        { translation: '' },
        { translation: '' },
        { translation: '' },
      ],
      knowledge: [
        { title: 'Describe your decision, do not label the guest', body: 'Do not say “You are drunk”. Use short, neutral words to say you cannot serve more alcohol at the moment, and keep the focus on safety and policy.' },
        { title: 'A package does not mean unlimited drinks', body: 'A beverage package is always subject to the responsible-service policy. Safety rules come before package benefits.' },
        { title: 'After saying no, always offer a next step', body: 'Offer water, a non-alcoholic drink or another safe option, so the conflict does not hang in the air after a simple “no”.' },
        { title: 'Escalate early — do not handle it alone', body: 'Inform your supervisor. If the guest keeps escalating or may hurt themselves or others, follow the cruise line’s procedure to call security or medical support.' },
      ],
      drinkComparison: [
        { build: 'A double measure of spirits', profile: 'Higher alcohol content and a bigger single serving', fit: 'Should not be served in this safety situation' },
        { build: 'Water and some rest', profile: 'A clear, low-risk first alternative', fit: 'Offer it right away' },
        { build: 'A drink without alcohol', profile: 'Keeps the service going without adding more alcohol', fit: 'Serve it once the guest accepts' },
      ],
      serviceSequence: [
        'Keep a safe distance and a calm voice',
        'Say clearly that you cannot serve more alcohol right now',
        'Offer water or a non-alcoholic alternative',
        'Ask your supervisor to come and help',
        'Record it according to policy and call security or medical help if needed',
      ],
      vocabulary: [
        { meaning: 'the rules for serving alcohol safely' },
        { meaning: 'not able to serve' },
        { meaning: 'a drink without alcohol' },
        { meaning: 'help us handle this' },
      ],
      decisionCheck: {
        question: 'The guest is unsteady but uses the beverage package to ask for a double whisky. What should you do?',
        options: [
          { text: 'Tell the guest “You are drunk”, so they cannot drink', explanation: 'Labelling the guest can escalate the conflict, and it is not the most professional way to talk about safety.' },
          { text: 'Stop serving alcohol based on the safety policy, offer an alternative and inform your supervisor', explanation: 'This is a clear, respectful and complete set of actions that follows responsible service.' },
          { text: 'Because the guest has a package, serve a single whisky instead', explanation: 'Changing a double to a single is still serving alcohol. A package cannot override your safety judgement.' },
        ],
      },
      interviewTransfer: { tip: 'Your answer must include stopping service, offering an alternative, involving your supervisor and escalating for safety when needed.' },
    },
  },
}
