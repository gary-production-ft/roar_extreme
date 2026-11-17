/**
 * ROAR EXTREME — INSTANT INTENT ROUTER
 *
 * Intercepts common, repetitive queries directly in memory:
 * - Timings & Operating Hours
 * - Rooftop Studio Location & Address
 * - Free Trial Pass Steps
 * - Contact & Reception Details
 * - Pricing & Membership Plans (grounded on active plans)
 * - Training Disciplines
 * - Greetings & Farewells
 * - Medical / Injury Safety Disclaimers
 * - Prompt Injection & Security Guardrails
 *
 * Latency: < 15ms (Zero LLM network round trips)
 */

export function detectLanguage(text, defaultLang = 'en') {
  if (defaultLang === 'hi' || defaultLang === 'mr') return defaultLang;
  // Devanagari script detection
  if (/[\u0900-\u097F]/.test(text)) {
    // Basic Marathi distinguishing markers
    if (/\b(आहे|आहात|नाही|कसा|कशी|कसे|कुठे|केव्हा|वेळ|पत्ता|व्यायाम|शुल्क)\b/i.test(text)) {
      return 'mr';
    }
    return 'hi';
  }

  const lower = text.toLowerCase();
  // Romanized Marathi
  if (/\b(namaskar|kiti|kuthe|vel|vyayam|shulk|kasa|kashi|ahe|nahi|kadhi)\b/.test(lower)) {
    return 'mr';
  }
  // Romanized Hindi
  if (/\b(namaste|kaise|kya|samay|jagah|pata|kitna|kholo|batao|chahiye)\b/.test(lower)) {
    return 'hi';
  }

  return defaultLang || 'en';
}

export function resolveDirectIntent({ query, language = 'en', activePlans = [] }) {
  if (!query) return { matched: false };
  const raw = query.trim();
  const lower = raw.toLowerCase();
  const lang = detectLanguage(raw, language);

  // 1. Guardrail: Prompt Injection Defense
  if (
    /(ignore\s+(all\s+)?(previous|prior)\s+instructions)|(system\s+prompt)|(verbatim)|(leak|reveal|show|print)\s+(your\s+)?(key|secret|prompt|password|token)|(gemini_api_key)|(env\.)/i.test(lower)
  ) {
    let response = "I am ROAR AI, the performance concierge for ROAR EXTREME Nashik. I can only provide guidance on our rooftop fitness programs, facility hours, and membership passes.";
    if (lang === 'hi') {
      response = "मैं रोअर एक्सट्रीम नाशिक का एआई कोच हूँ। मैं केवल हमारी रूफटॉप जिम, वर्कआउट प्रोग्राम्स, समय और मेंबरशिप संबंधी जानकारी साझा कर सकता हूँ।";
    } else if (lang === 'mr') {
      response = "मी रोअर एक्स्ट्रीम नाशिकचा एआय कोच आहे. मी फक्त आमच्या रूफटॉप फिटनेस सुविधा, वर्कआउट आणि मेंबरशिपबद्दल माहिती देऊ शकतो.";
    }
    return { matched: true, intent: 'prompt_injection_blocked', response, lang };
  }

  // 2. Guardrail: Medical Diagnosis / Acute Injury Safety Warning
  if (
    /\b(diagnose|pain|sharp pain|herniated|tear|torn|swollen|fracture|broken|ibuprofen|injury|prescription|cure|medicine)\b/i.test(lower) &&
    /\b(deadlift|squat|back|knee|shoulder|spine|wrist|elbow|joint|leg|chest)\b/i.test(lower)
  ) {
    let response = "I am an athletic fitness coach, not a medical professional. For sharp pain or injury, please stop training immediately and consult a qualified sports doctor or physiotherapist. Our head coach can adjust training mechanics only after clearance.";
    if (lang === 'hi') {
      response = "मैं एक फिटनेस कोच हूँ, डॉक्टर नहीं। किसी भी गंभीर दर्द या चोट के लिए कृपया तुरंत वर्कआउट रोकें और किसी योग्य डॉक्टर या फिजियोथेरेपिस्ट से सलाह लें। मेडिकल क्लीयरेंस के बाद ही हमारे कोच ट्रेनिंग एडजस्ट कर सकते हैं।";
    } else if (lang === 'mr') {
      response = "मी एक फिटनेस कोच आहे, वैद्यकीय तज्ज्ञ नाही. तीव्र वेदना किंवा दुखापतीसाठी कृपया लगेच व्यायाम थांबवा आणि पात्र डॉक्टर किंवा फिजिओथेरपिस्टचा सल्ला घ्या.";
    }
    return { matched: true, intent: 'medical_disclaimer', response, lang };
  }

  // 3. Greetings
  if (/^(hi|hello|hey|yo|namaste|namaskar|good\s*(morning|evening|afternoon)|sup)[\s!.,?]*$/i.test(lower)) {
    let response = "Welcome to ROAR EXTREME Nashik! I'm your AI Coach. How can I help with your training, our rooftop arena, or booking your Free Trial Pass today?";
    if (lang === 'hi') {
      response = "रोअर एक्सट्रीम नाशिक में आपका स्वागत है! मैं आपका एआई कोच हूँ। आज आपकी फिटनेस यात्रा, रूफटॉप जिम या फ्री ट्रायल पास के लिए मैं क्या मदद करूँ?";
    } else if (lang === 'mr') {
      response = "रोअर एक्स्ट्रीम नाशिक मध्ये आपले स्वागत आहे! मी तुमचा एआय कोच आहे. वर्कआउट, रूफटॉप जिम किंवा फ्री ट्रायल पासबद्दल मी काय मदत करू शकतो?";
    }
    return { matched: true, intent: 'greeting', response, lang };
  }

  // 4. Timings & Operating Hours
  if (
    /\b(time|timing|timings|hours|open|close|closing|schedule|sunday|sunday\s*open)\b/i.test(lower) &&
    !/\b(how\s*many\s*times|first\s*time|plan|fee|diet)\b/i.test(lower)
  ) {
    let response = "ROAR EXTREME operates **Monday through Saturday from 6:00 AM to 10:00 PM**. Sundays are dedicated to physical recovery and maintenance (by appointment). We are on the 6th floor rooftop terrace (take elevator to 5th, then stairs). Would you like to schedule a trial workout?";
    if (lang === 'hi') {
      response = "रोअर एक्सट्रीम का समय **सोमवार से शनिवार सुबह ६:०० से रात १०:०० बजे तक** है। रविवार को रिकवरी रहती है। हमारी जिम ६ठी मंजिल टेरेस, रुशिराज रीजेंसी, गंगापुर रोड पर है। क्या आप फ्री ट्रायल सेशन बुक करना चाहते हैं?";
    } else if (lang === 'mr') {
      response = "रोअर एक्स्ट्रीमचे वेळ **सोमवार ते शनिवार सकाळी ६:०० ते रात्री १०:००** पर्यंत आहे. रविवार रिकव्हरीसाठी असतो. आमची जिम ६व्या मजल्यावर (टेरेस), रुशिराज रीजन्सी येथे आहे. तुम्ही फ्री ट्रायल सेशन बुक करू इच्छिता का?";
    }
    return { matched: true, intent: 'timings', response, lang };
  }

  // 5. Location & Directions
  if (
    /\b(where|location|address|directions|reach|place|landmark|axis\s*bank|gangapur|rushiraj)\b/i.test(lower) &&
    !/\b(workout|exercise|diet|split)\b/i.test(lower)
  ) {
    let response = "Our rooftop performance arena is located at:\n**601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik (422005)**.\nTake the elevator to the 5th floor, then take the dedicated staircase up to the 6th floor terrace!";
    if (lang === 'hi') {
      response = "हमारा पता है:\n**६०१/६०२, रुशिराज रीजेंसी, विद्या विकास सर्कल, एक्सिस बैंक के ऊपर, पाटिल कॉलोनी, कनाडा कॉर्नर, नाशिक (४२२००५)**। ५वीं मंजिल तक लिफ्ट लें और फिर सीढ़ियों से ६ठी मंजिल टेरेस पर आएं।";
    } else if (lang === 'mr') {
      response = "आमचा पत्ता:\n**६०१/६०२, रुशिराज रीजन्सी, विद्या विकास सर्कल, ॲक्सिस बँकेच्या वर, पाटील कॉलनी, कॅनडा कॉर्नर, नाशिक (४२२००५)**। ५व्या मजल्यापर्यंत लिफ्ट घ्या आणि मग पायऱ्यांनी ६व्या मजल्यावरील टेरेसवर या.";
    }
    return { matched: true, intent: 'location', response, lang };
  }

  // 6. Free Trial Session / Pass
  if (
    /\b(free\s*(pass|trial|session)|trial\s*pass|how\s*(can|do)\s*i\s*(get|book|claim|join)\s*(a\s*)?(free|trial)|demo|register\s*free|bring\s*for\s*(my\s*)?free)\b/i.test(lower)
  ) {
    let response = "You can claim a complimentary **Free Single Session Pass** right now! It includes a 60-minute guided trial workout, rooftop equipment tour, and a 1-on-1 coach consultation. Please bring clean indoor sports shoes and a workout towel. [Click here to book your pass](/register).";
    if (lang === 'hi') {
      response = "आप हमारे **फ्री सिंगल सेशन पास** के लिए तुरंत आवेदन कर सकते हैं! इसमें ६० मिनट का वर्कआउट, जिम टूर और हेड कोच के साथ १-ऑन-१ कंसल्टेशन शामिल है। कृपया साफ स्पोर्ट्स जूते और तौलिया साथ लाएं। [यहाँ क्लिक करके फ्री पास लें](/register).";
    } else if (lang === 'mr') {
      response = "तुम्ही **फ्री सिंगल सेशन पास** साठी लगेच अर्ज करू शकता! यात ६० मिनिटांचा वर्कआउट आणि हेड कोचसोबत १-ऑन-१ कन्सल्टेशन समाविष्ट आहे. कृपया इनडोअर स्पोर्ट्स शूज आणि टॉवेल सोबत आणा. [फ्री पाससाठी येथे क्लिक करा](/register).";
    }
    return { matched: true, intent: 'free_trial', response, lang };
  }

  // 7. Pricing & Membership Plans (Grounded dynamically on plans)
  if (
    /\b(price|pricing|fees|cost|package|packages|membership\s*(cost|fees|price|plan|charge)|charges|month|annual|discount)\b/i.test(lower) &&
    !/\b(what\s*time|where|exercise)\b/i.test(lower)
  ) {
    let planSummary = '';
    if (activePlans && activePlans.length > 0) {
      planSummary = activePlans.map((p) => `${p.name}: ₹${p.price.toLocaleString('en-IN')}`).join(' | ');
    } else {
      planSummary = 'Monthly Pass: ₹6,500 | Quarterly Pass: ₹8,500 | Annual Pass: ₹12,000';
    }

    let response = `Official studio plans: **${planSummary}**.\nSeasonal offers, personal training bundles, and student discounts are verified in-person at the front desk. We recommend starting with a [Free Session Pass](/register) to inspect the rooftop facility first!`;
    if (lang === 'hi') {
      response = `रोअर एक्सट्रीम के आधिकारिक प्लान्स: **${planSummary}**। विशेष प्रमोशनल ऑफर्स और पर्सनल ट्रेनिंग पैकेज रिसेप्शन डेस्क पर कन्फर्म किए जाते हैं। हम सुझाव देते हैं कि पहले [फ्री सेशन पास](/register) बुक करके जिम का अनुभव लें!`;
    } else if (lang === 'mr') {
      response = `अधिकृत मेंबरशिप प्लॅन्स: **${planSummary}**। विशेष सवलती आणि पर्सनल कोचिंगबद्दल थेट रिसेप्शन डेस्कवर माहिती दिली जाते. आधी [फ्री सेशन पास](/register) बुक करून सुविधा तपासून पाहण्याचा सल्ला आम्ही देतो!`;
    }
    return { matched: true, intent: 'pricing', response, lang };
  }

  // 8. Contact & Front Desk Assistance
  if (
    /\b(contact|phone|call|mobile|number|talk\s*to\s*(someone|coach|trainer|reception)|human|whatsapp)\b/i.test(lower)
  ) {
    let response = "You can connect with our team directly at the studio (6th Floor, Rushiraj Regency, Vidya Vikas Circle, Nashik) or directory contact **+91 93099 06640**. For immediate session scheduling, submitting the [Free Pass Form](/register) sends an alert to our head coach.";
    if (lang === 'hi') {
      response = "आप सीधे हमारी जिम (६ठी मंजिल, रुशिराज रीजेंसी, विद्या विकास सर्कल, नाशिक) पर आ सकते हैं या संपर्क नंबर **+91 93099 06640** पर कॉल कर सकते हैं। तुरंत स्लॉट के लिए [फ्री पास फॉर्म](/register) भरें।";
    } else if (lang === 'mr') {
      response = "तुम्ही थेट आमच्या स्टुडिओला (६वा मजला, रुशिराज रीजन्सी, विद्या विकास सर्कल, नाशिक) भेट देऊ शकता किंवा **+91 93099 06640** वर संपर्क करू शकता. तात्काळ स्लॉटसाठी [फ्री पास फॉर्म](/register) भरा.";
    }
    return { matched: true, intent: 'contact', response, lang };
  }

  // 9. Training Disciplines Overview
  if (
    /\b(disciplines|programs|crossfit|zumba|kickboxing|what\s*(programs|training|classes)|personal\s*trainer\s*available)\b/i.test(lower) &&
    !/\b(diet|food|protein|split)\b/i.test(lower)
  ) {
    let response = "We offer 8 verified performance disciplines:\n1. **Strength Training** (Olympic barbells & power platforms)\n2. **Cardio Fitness** (Treadmills & HIIT rowers)\n3. **CrossFit Conditioning**\n4. **Zumba Dance Fitness**\n5. **Combat Kickboxing**\n6. **Weight Management**\n7. **General Gym**\n8. **1-on-1 Personal Coaching**.\nWhich discipline would you like to try in your free trial?";
    if (lang === 'hi') {
      response = "हम ८ मुख्य ट्रेनिंग प्रोग्राम्स पेश करते हैं: स्ट्रेंथ ट्रेनिंग, कार्डियो फिटनेस, क्रॉसफिट, ज़ुम्बा, किकबॉक्सिंग, वेट मैनेजमेंट, जनरल जिम, और १-ऑन-१ पर्सनल ट्रेनिंग। आप अपने फ्री ट्रायल में कौन सा आज़माना चाहते हैं?";
    } else if (lang === 'mr') {
      response = "आम्ही ८ मुख्य ट्रेनिंग प्रोग्राम्स चालवतो: स्ट्रेंथ ट्रेनिंग, कार्डिओ, क्रॉसफिट, झुम्बा, किकबॉक्सिंग, वजन व्यवस्थापन, जनरल जिम आणि १-ऑन-१ पर्सनल कोचिंग. तुम्ही फ्री ट्रायलमध्ये कोणता व्यायाम प्रकार करून पाहणार?";
    }
    return { matched: true, intent: 'disciplines', response, lang };
  }

  return { matched: false };
}
