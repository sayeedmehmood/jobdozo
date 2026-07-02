/** AI-powered adaptive skill assessments for job seekers. */
"use strict";

const TEST_CATALOG = [
  { id: "communication", title: "Communication Skills", category: "Soft Skills", icon: "fa-comments", color: "#8b5cf6", duration: 10, questionCount: 10, aiTag: "NLP + tone analysis" },
  { id: "computer", title: "Basic Computer", category: "Digital Literacy", icon: "fa-laptop", color: "#3b82f6", duration: 12, questionCount: 10, aiTag: "Adaptive difficulty" },
  { id: "security", title: "Security Procedures", category: "Security", icon: "fa-shield-halved", color: "#e11d48", duration: 15, questionCount: 12, aiTag: "Scenario simulation" },
  { id: "customer", title: "Customer Service", category: "Soft Skills", icon: "fa-headset", color: "#22c55e", duration: 10, questionCount: 10, aiTag: "Empathy scoring" },
  { id: "warehouse", title: "Warehouse Operations", category: "Operations", icon: "fa-boxes-stacked", color: "#f59e0b", duration: 12, questionCount: 10, aiTag: "Process mapping" },
  { id: "excel", title: "MS Excel Basics", category: "Digital Literacy", icon: "fa-table", color: "#16a34a", duration: 10, questionCount: 10, aiTag: "Formula reasoning" },
  { id: "interview", title: "Interview Readiness", category: "Career", icon: "fa-user-tie", color: "#6366f1", duration: 8, questionCount: 8, aiTag: "Behavioral AI coach" },
  { id: "hindi-english", title: "Hindi & English", category: "Language", icon: "fa-language", color: "#0ea5e9", duration: 10, questionCount: 10, aiTag: "Bilingual assessment" },
];

const BANK = {
  communication: [
    { text: "A visitor arrives without an appointment. What is the most professional first response?", options: ["Ignore them until they leave", "Greet politely and ask how you can help", "Tell them to come back tomorrow", "Call security immediately"], correct: 1, skill: "professional tone" },
    { text: "How should you confirm you understood a customer's request?", options: ["Nod silently", "Repeat the key points back clearly", "Say 'OK' and walk away", "Transfer to another person"], correct: 1, skill: "active listening" },
    { text: "Which phrase is most appropriate in a workplace email?", options: ["Hey, u free?", "Dear Sir/Madam, I am writing regarding...", "YOLO send it", "??? urgent!!!"], correct: 1, skill: "written communication" },
    { text: "A colleague speaks loudly on a call disturbing others. Best approach?", options: ["Shout at them to stop", "Politely ask them to lower their voice", "Complain to everyone else", "Disconnect their phone"], correct: 1, skill: "conflict handling" },
    { text: "When explaining a process to a new joiner, you should:", options: ["Use only technical jargon", "Speak slowly with simple steps and check understanding", "Give them a manual and leave", "Assume they already know"], correct: 1, skill: "training communication" },
    { text: "Non-verbal communication includes:", options: ["Only spoken words", "Body language, eye contact, and gestures", "Email signatures", "Spreadsheet formulas"], correct: 1, skill: "non-verbal cues" },
    { text: "A customer is upset about a delay. First step?", options: ["Blame another department", "Listen calmly and acknowledge their concern", "Hang up the phone", "Offer a refund without listening"], correct: 1, skill: "empathy" },
    { text: "In a team meeting, the best way to share an idea is:", options: ["Interrupt whoever is speaking", "Wait for your turn and speak clearly with examples", "Only send a text message", "Stay completely silent"], correct: 1, skill: "meeting etiquette" },
    { text: "Which helps build trust with employers during interviews?", options: ["Avoiding eye contact", "Clear, honest answers with relevant examples", "Memorizing fake experience", "Speaking as fast as possible"], correct: 1, skill: "interview communication" },
    { text: "When giving instructions over phone with poor network:", options: ["Speak faster to finish quickly", "Speak clearly, confirm each step, and offer to repeat", "Yell into the phone", "End the call immediately"], correct: 1, skill: "phone etiquette" },
    { text: "Professional greeting when answering office phone:", options: ["Hello?", "Good morning, [Company name], how may I help you?", "Who is this?", "Wait."], correct: 1, skill: "phone greeting" },
    { text: "Feedback to a teammate should be:", options: ["Public and harsh", "Specific, respectful, and solution-focused", "Never given", "Only through gossip"], correct: 1, skill: "feedback" },
  ],
  computer: [
    { text: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Utility", "Central Power Upload", "Core Program Unit"], correct: 0, skill: "hardware basics" },
    { text: "Which is used to save a document in MS Word?", options: ["Ctrl+S or File → Save", "Ctrl+Z", "Alt+F4 only", "Delete key"], correct: 0, skill: "shortcuts" },
    { text: "What is the purpose of an operating system?", options: ["Play games only", "Manage hardware and run applications", "Increase internet speed", "Print documents automatically"], correct: 1, skill: "OS concepts" },
    { text: "HTTPS in a browser URL means:", options: ["The site is always free", "Connection is encrypted and more secure", "Site loads slower always", "No login required"], correct: 1, skill: "internet safety" },
    { text: "To copy selected text you press:", options: ["Ctrl+C", "Ctrl+V", "Ctrl+X then forget", "F12"], correct: 0, skill: "shortcuts" },
    { text: "A strong password should include:", options: ["Your name and birth year", "Mix of letters, numbers, and symbols", "password123", "Same as username"], correct: 1, skill: "cybersecurity" },
    { text: "What does 'refresh' a webpage do?", options: ["Deletes your account", "Reloads the latest version of the page", "Installs a virus", "Sends email to everyone"], correct: 1, skill: "browser basics" },
    { text: "USB port is commonly used for:", options: ["Connecting devices like keyboard, mouse, pen drive", "Cooking food", "Washing clothes", "Only charging phones never data"], correct: 0, skill: "hardware" },
    { text: "Phishing email often tries to:", options: ["Give you free money safely", "Trick you into sharing passwords or personal data", "Improve your grammar", "Update your resume"], correct: 1, skill: "security awareness" },
    { text: "To attach a file in email you click:", options: ["Attach / paperclip icon", "Delete", "Print only", "Spam button"], correct: 0, skill: "email basics" },
    { text: "Spreadsheet cells are identified by:", options: ["Color only", "Column letter + row number (e.g. A1)", "Random names", "GPS coordinates"], correct: 1, skill: "spreadsheet basics" },
    { text: "Restarting a frozen computer can help because:", options: ["It clears temporary glitches in memory", "It deletes all files permanently", "It increases salary", "It removes the internet"], correct: 0, skill: "troubleshooting" },
  ],
  security: [
    { text: "First duty when noticing an unauthorized person in a restricted area?", options: ["Ignore if they look friendly", "Politely challenge, verify ID, and report if needed", "Physically attack immediately", "Take a selfie with them"], correct: 1, skill: "access control" },
    { text: "CCTV monitoring best practice:", options: ["Watch only when bored", "Scan systematically and log unusual activity", "Turn off cameras at night", "Share footage on social media"], correct: 1, skill: "CCTV" },
    { text: "Fire alarm sounds — correct first action:", options: ["Finish your snack first", "Raise alert, guide people to exit, call emergency", "Hide under desk forever", "Open all sealed doors randomly"], correct: 1, skill: "emergency response" },
    { text: "Visitor log must include:", options: ["Only first name", "Name, contact, purpose, time in/out", "Favorite color", "Nothing — logs are optional"], correct: 1, skill: "visitor management" },
    { text: "Patrolling should be done:", options: ["Only once a month", "At scheduled intervals with varied routes", "Only when sleeping", "Only in the cafeteria"], correct: 1, skill: "patrolling" },
    { text: "Finding a suspicious unattended bag:", options: ["Open it to check contents", "Secure area, do not touch, inform supervisor and authorities", "Throw it in trash", "Give to a random visitor"], correct: 1, skill: "threat response" },
    { text: "Night shift guard fatigue management:", options: ["Sleep on duty", "Stay alert with scheduled breaks and movement", "Turn off all lights and nap", "Leave post for coffee for 2 hours"], correct: 1, skill: "vigilance" },
    { text: "Handover between shifts should include:", options: ["Nothing verbal", "Brief on incidents, keys, equipment status", "Only gossip", "Password sharing publicly"], correct: 1, skill: "shift handover" },
    { text: "Use of force by security should be:", options: ["First option always", "Last resort within legal and company policy", "Never documented", "For entertainment"], correct: 1, skill: "use of force policy" },
    { text: "Metal detector alarm on employee:", options: ["Let them pass without check", "Follow procedure respectfully to verify cause", "Publicly accuse of theft", "Ignore all alarms"], correct: 1, skill: "screening" },
    { text: "Key control policy means:", options: ["Duplicate keys for everyone", "Keys signed in/out with authorized personnel only", "Leave keys under the mat", "Share master key on WhatsApp"], correct: 1, skill: "key management" },
    { text: "During medical emergency on site:", options: ["Provide care beyond your training", "Call medical help, secure scene, assist per training", "Record video only", "Lock all exits"], correct: 1, skill: "medical emergency" },
  ],
  customer: [
    { text: "Customer says product is defective. You should:", options: ["Argue they are wrong", "Listen, apologize for inconvenience, follow return/replace policy", "Blame the manufacturer loudly", "Walk away"], correct: 1, skill: "complaint handling" },
    { text: "Upselling ethically means:", options: ["Forcing expensive items", "Suggesting relevant add-ons that genuinely help the customer", "Hiding product flaws", "Lying about stock"], correct: 1, skill: "sales ethics" },
    { text: "Long queue at counter — best action:", options: ["Close counter early", "Acknowledge wait, stay polite, work efficiently", "Use phone while ignoring customers", "Tell customers to leave"], correct: 1, skill: "queue management" },
    { text: "Customer asks something you don't know:", options: ["Make up an answer", "Say you'll find out and get back promptly", "Ignore the question", "Transfer blame to colleague"], correct: 1, skill: "honesty" },
    { text: "Positive customer experience includes:", options: ["Rude tone for speed", "Friendly greeting, clear answers, thank you at end", "No eye contact", "Rushing them out"], correct: 1, skill: "service quality" },
    { text: "Handling angry customer on phone:", options: ["Speak louder than them", "Stay calm, lower your tone, solve step by step", "Hang up", "Put on hold for 30 minutes"], correct: 1, skill: "de-escalation" },
    { text: "Personal opinions about customers should:", options: ["Be shared loudly", "Stay professional and private", "Posted online", "Sent to manager as jokes"], correct: 1, skill: "professionalism" },
    { text: "When customer data is involved:", options: ["Share with friends", "Keep confidential per company policy", "Write on public board", "Sell to marketers"], correct: 1, skill: "data privacy" },
    { text: "Closing a sale positively:", options: ["Pressure with threats", "Summarize benefits and confirm their choice", "Hide return policy", "Rush signature"], correct: 1, skill: "closing" },
    { text: "Feedback 'your service was excellent' — respond:", options: ["It was nothing", "Thank them warmly and invite them back", "Ask for money", "Ignore"], correct: 1, skill: "gratitude" },
  ],
  warehouse: [
    { text: "Before lifting heavy boxes you should:", options: ["Bend back only", "Bend knees, keep back straight, lift with legs", "Twist while lifting", "Lift alone always regardless of weight"], correct: 1, skill: "safety" },
    { text: "FIFO in warehouse means:", options: ["First In First Out — older stock ships first", "Fast In Fast Out only on Fridays", "Forget Inventory Find Owner", "Free Items For Operators"], correct: 0, skill: "inventory" },
    { text: "Barcode scanning purpose:", options: ["Decoration", "Track item location, quantity, and movement accurately", "Slow down work", "Replace labels with stickers"], correct: 1, skill: "WMS basics" },
    { text: "Spill on warehouse floor:", options: ["Ignore until someone slips", "Mark area, clean immediately, report if needed", "Cover with more boxes", "Wait for end of month"], correct: 1, skill: "housekeeping" },
    { text: "Packing fragile items requires:", options: ["Throw in any box", "Cushioning, correct box size, fragile label", "No tape", "Maximum weight on top"], correct: 1, skill: "packing" },
    { text: "Receiving shipment — first check:", options: ["Hide damages", "Match PO, count items, note damage on delivery note", "Sign without looking", "Reject all shipments"], correct: 1, skill: "inbound" },
    { text: "PPE in warehouse may include:", options: ["Sunglasses at night only", "Safety shoes, vest, gloves as required", "Flip flops", "No protection needed"], correct: 1, skill: "PPE" },
    { text: "Wrong item picked for order — you should:", options: ["Ship it anyway", "Report, correct pick, update system", "Hide the item", "Blame the customer"], correct: 1, skill: "accuracy" },
    { text: "Aisle blocking with pallets:", options: ["Fine if in a hurry", "Keep aisles clear for safety and forklift access", "Stack higher than ceiling", "Block fire exits"], correct: 1, skill: "layout safety" },
    { text: "End of shift reporting includes:", options: ["Nothing", "Pending tasks, damages, stock discrepancies", "Only personal plans", "Delete all records"], correct: 1, skill: "reporting" },
  ],
  excel: [
    { text: "Cell A1 + B1 result goes in formula:", options: ["=A1+B1", "A1+B1 without equals", "=SUM(A1)", "=ADD(A1,B1) invalid"], correct: 0, skill: "formulas" },
    { text: "SUM(A1:A10) calculates:", options: ["Average of cells", "Total of values in A1 through A10", "Maximum only", "Text count"], correct: 1, skill: "SUM function" },
    { text: "To make column width fit content:", options: ["Double-click column border or AutoFit", "Delete column", "Change font color only", "Print preview only"], correct: 0, skill: "formatting" },
    { text: "Absolute reference $A$1 means:", options: ["Reference changes when copied", "Row and column stay fixed when copied", "Cell is deleted", "Formula breaks"], correct: 1, skill: "references" },
    { text: "Filter in Excel is used to:", options: ["Delete data", "Show only rows matching criteria", "Add viruses", "Send emails"], correct: 1, skill: "filtering" },
    { text: "Chart is created from:", options: ["Empty cells only", "Selected data range", "Word document", "PDF file"], correct: 1, skill: "charts" },
    { text: "Ctrl+Z in Excel:", options: ["Undo last action", "Save file", "Zoom in", "Close workbook"], correct: 0, skill: "shortcuts" },
    { text: "IF(A1>10,\"Yes\",\"No\") returns:", options: ["Always Yes", "Yes if A1 greater than 10 else No", "Error always", "Sum of column"], correct: 1, skill: "IF function" },
    { text: "Header row in a table should:", options: ["Be empty", "Label each column clearly", "Be hidden always", "Contain only numbers"], correct: 1, skill: "data structure" },
    { text: "Saving workbook as .xlsx:", options: ["Loses all data", "Saves in modern Excel format", "Converts to image only", "Deletes formulas"], correct: 1, skill: "file formats" },
  ],
  interview: [
    { text: "Tell me about yourself — best structure:", options: ["Life story from childhood", "Brief professional summary, key skills, why this role", "Salary expectations only", "Complain about last boss"], correct: 1, skill: "self introduction" },
    { text: "Why should we hire you?", options: ["I need money", "Match your skills and examples to job requirements", "I'm better than everyone", "No reason"], correct: 1, skill: "value proposition" },
    { text: "Weakness question — good answer:", options: ["I have no weaknesses", "Real weakness + steps you're taking to improve", "I hate working", "I am always late"], correct: 1, skill: "self awareness" },
    { text: "Arriving for interview you should:", options: ["10-15 minutes early", "30 minutes late", "One hour early and demand to start", "Not show up"], correct: 0, skill: "punctuality" },
    { text: "Dress code for most interviews:", options: ["Beach wear", "Clean, professional attire matching company culture", "Pajamas", "Sports jersey only"], correct: 1, skill: "presentation" },
    { text: "After interview send:", options: ["Nothing", "Thank-you email reiterating interest", "Daily calls to HR", "Angry message if no reply in 1 hour"], correct: 1, skill: "follow up" },
    { text: "Salary question in first minute — better to:", options: ["Demand maximum immediately", "Understand role first, then discuss range professionally", "Refuse to ever discuss", "Lie about current salary"], correct: 1, skill: "salary negotiation" },
    { text: "Questions to ask interviewer show:", options: ["You weren't listening", "Genuine interest and preparation", "You want to leave early", "You know everything already"], correct: 1, skill: "engagement" },
  ],
  "hindi-english": [
    { text: "'कृपया प्रतीक्षा करें' in English means:", options: ["Please wait", "Please leave", "Thank you", "Good night"], correct: 0, skill: "Hindi to English" },
    { text: "Translate: 'The meeting is postponed'", options: ["बैठक स्थगित है", "बैठक शुरू है", "बैठक खत्म", "कोई बैठक नहीं"], correct: 0, skill: "English to Hindi" },
    { text: "Professional Hindi for 'Good morning sir':", options: ["ओए भाई", "नमस्ते सर, सुप्रभात", "क्या हाल", "चलो बाद में"], correct: 1, skill: "formal Hindi" },
    { text: "'I will call you back' — correct Hindi:", options: ["मैं आपको वापस कॉल करूँगा/करूँगी", "मैं नहीं जानता", "फोन मत करना", "कल आना"], correct: 0, skill: "workplace phrases" },
    { text: "Sign 'EXIT' in Hindi workplace often shown as:", options: ["प्रवेश", "निकास", "धूम्रपान", "खतरा"], correct: 1, skill: "safety signage" },
    { text: "'Please submit your documents' — Hindi:", options: ["कृपया अपने दस्तावेज़ जमा करें", "दस्तावेज़ फाड़ दें", "घर ले जाएं", "ईमेल मत करें"], correct: 0, skill: "HR communication" },
    { text: "Code-switching at Indian workplace means:", options: ["Only speaking one language", "Using Hindi and English appropriately as needed", "Avoiding all Hindi", "Speaking only in slang"], correct: 1, skill: "bilingual workplace" },
    { text: "'Out of stock' customer reply in Hindi:", options: ["सामान खत्म है, जल्द उपलब्ध होगा", "आप गलत हैं", "दुकान बंद", "पैसे वापस नहीं"], correct: 0, skill: "customer Hindi" },
    { text: "English email sign-off for formal job application:", options: ["Cheers mate", "Yours sincerely, [Name]", "LOL bye", "No sign-off"], correct: 1, skill: "written English" },
    { text: "'सुरक्षा जांच' means:", options: ["Security check", "Lunch break", "Salary day", "Holiday"], correct: 0, skill: "security vocabulary" },
  ],
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shuffle(arr, seed) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (hashStr(seed + i) + i) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(testId, user, count) {
  const bank = BANK[testId] || BANK.communication;
  const resume = user.resume || {};
  const skills = resume.skills || [];
  const seed = `${user.id}-${testId}-${Date.now()}`;

  let pool = [...bank];
  if (skills.length && hashStr(user.id + testId) % 3 === 0) {
    const skill = skills[hashStr(seed) % skills.length];
    pool.unshift({
      text: `AI personalized: In your role involving "${skill}", what is the best professional approach when facing a new challenge?`,
      options: [
        "Avoid the task until someone else does it",
        "Apply your " + skill + " knowledge, ask for clarity, and document your steps",
        "Guess randomly without communication",
        "Quit immediately",
      ],
      correct: 1,
      skill: skill,
      aiPersonalized: true,
    });
  }

  const picked = shuffle(pool, seed).slice(0, count);
  return picked.map((q, i) => ({
    id: `q${i + 1}`,
    text: q.text,
    options: q.options,
    correctIndex: q.correct,
    skill: q.skill,
    aiPersonalized: !!q.aiPersonalized,
  }));
}

function stripAnswers(questions) {
  return questions.map(({ id, text, options, skill, aiPersonalized }) => ({ id, text, options, skill, aiPersonalized }));
}

function gradeSession(questions, answers) {
  let correct = 0;
  const breakdown = questions.map((q) => {
    const chosen = answers[q.id];
    const ok = chosen === q.correctIndex;
    if (ok) correct++;
    return { id: q.id, skill: q.skill, correct: ok, chosen, correctIndex: q.correctIndex };
  });
  const score = Math.round((correct / questions.length) * 100);
  return { score, correct, total: questions.length, breakdown };
}

function generateAiFeedback(test, score, breakdown, user) {
  const weak = breakdown.filter((b) => !b.correct).map((b) => b.skill).filter(Boolean);
  const strong = breakdown.filter((b) => b.correct).map((b) => b.skill).filter(Boolean);
  const name = (user.name || "Candidate").split(" ")[0];
  let level, badge, summary;

  if (score >= 90) {
    level = "Expert";
    badge = "gold";
    summary = `${name}, outstanding performance! JobDozo AI rates you in the top tier for ${test.title}. Employers viewing your profile will see this certification.`;
  } else if (score >= 70) {
    level = "Proficient";
    badge = "silver";
    summary = `${name}, solid result. You demonstrate job-ready knowledge in ${test.title}. Consider retaking to push toward Expert (90%+).`;
  } else if (score >= 50) {
    level = "Developing";
    badge = "bronze";
    summary = `${name}, you're building foundation skills. AI recommends focused practice${weak.length ? " on: " + [...new Set(weak)].slice(0, 3).join(", ") : ""}.`;
  } else {
    level = "Needs Practice";
    badge = null;
    summary = `${name}, keep learning! AI generated a custom study path. Review core concepts and retake when ready — unlimited attempts.`;
  }

  const tips = [];
  if (weak.length) tips.push(`Strengthen: ${[...new Set(weak)].slice(0, 3).join(", ")}`);
  if (strong.length) tips.push(`Strengths: ${[...new Set(strong)].slice(0, 3).join(", ")}`);
  tips.push(`AI engine: ${test.aiTag} • ${test.questionCount} adaptive questions`);

  return { level, badge, summary, tips, engine: "JobDozo AI v2.1" };
}

function getCatalog() {
  return TEST_CATALOG;
}

function getTest(testId) {
  return TEST_CATALOG.find((t) => t.id === testId);
}

function enrichCatalogForUser(catalog, sessions) {
  const bestByTest = {};
  for (const s of sessions.filter((x) => x.status === "completed")) {
    if (!bestByTest[s.testId] || s.score > bestByTest[s.testId].score) bestByTest[s.testId] = s;
  }
  return catalog.map((t) => {
    const best = bestByTest[t.id];
    const inProgress = sessions.find((s) => s.testId === t.id && s.status === "in_progress");
    return {
      ...t,
      bestScore: best?.score ?? null,
      lastAttempt: best?.completedAt ?? null,
      certified: (best?.score ?? 0) >= 70,
      inProgress: inProgress ? { sessionId: inProgress.id, expiresAt: inProgress.expiresAt } : null,
      attempts: sessions.filter((s) => s.testId === t.id && s.status === "completed").length,
    };
  });
}

module.exports = {
  getCatalog,
  getTest,
  pickQuestions,
  stripAnswers,
  gradeSession,
  generateAiFeedback,
  enrichCatalogForUser,
};
