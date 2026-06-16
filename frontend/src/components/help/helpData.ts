export interface HelpStep   { title: string; desc: string }
export interface HelpField  { name: string; desc: string }
export interface HelpModule {
  module:   string;
  subtitle: string;
  purpose:  string;
  steps:    HelpStep[];
  fields:   HelpField[];
  tips:     string[];
  mistakes: string[];
}

export const HELP_LANGS = [
  { code: 'en', label: 'English'    },
  { code: 'hi', label: 'हिंदी'       },
  { code: 'mr', label: 'मराठी'       },
  { code: 'gu', label: 'ગુજરાતી'     },
  { code: 'ta', label: 'தமிழ்'       },
  { code: 'te', label: 'తెలుగు'      },
  { code: 'bn', label: 'বাংলা'       },
  { code: 'kn', label: 'ಕನ್ನಡ'       },
  { code: 'ml', label: 'മലയാളം'      },
  { code: 'pa', label: 'ਪੰਜਾਬੀ'      },
] as const;

export type LangCode = typeof HELP_LANGS[number]['code'];

// ─── Dashboard SOP ──────────────────────────────────────────────────────────
export const dashboardHelp: Record<LangCode, HelpModule> = {
  en: {
    module:   'Module 1 – Dashboard',
    subtitle: 'Your daily control centre for the entire business',
    purpose:  'The Dashboard gives you a quick overview of your entire real estate business – properties, clients, appointments, and recent activity – all in one place.',
    steps: [
      { title: 'Log in to ENFOR DATA',               desc: 'Open enfordata.com and enter your registered email and password. Click the Login button. You will land directly on the Dashboard.' },
      { title: 'Read the summary cards at the top',  desc: 'You will see 3 cards: Active Properties (total listings), Your Clients (clients added by you), Appointments Today (scheduled meetings for today).' },
      { title: 'Check Clients by Type',              desc: 'Scroll down to see a breakdown of your clients – Buyers, Sellers, Tenants, Owners – with count next to each.' },
      { title: 'Check Properties by Status',         desc: 'On the right side you will see property counts by status – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: "View Today's Appointments",          desc: 'Below the charts, see all appointments scheduled for today with client name, meeting type, and time.' },
      { title: 'Check Recent Activity',              desc: 'On the right side, the Recent Activity feed shows the latest actions – new inquiries, appointments, client additions.' },
      { title: 'Quick Actions',                      desc: 'Use the + Add Client button to add a new client directly from Dashboard. Use + Add Property to add a new property listing quickly.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'Total number of property listings currently active on the platform across all brokers.' },
      { name: 'Your Clients',         desc: 'Total clients that you (the logged-in broker) have personally added.' },
      { name: 'Appointments Today',   desc: "Number of meetings or site visits scheduled for today's date." },
      { name: 'Clients by Type',      desc: 'Breakdown of clients into 4 types: Buyers, Sellers, Tenants, Owners.' },
      { name: 'Properties by Status', desc: '6 status categories showing how many properties are in each stage.' },
      { name: "Today's Appointments", desc: "List of today's appointments with client name, purpose, and time." },
      { name: 'Recent Activity',      desc: 'Live feed of latest actions done in the system – inquiries, additions, appointments.' },
    ],
    tips: [
      'Check the Dashboard every morning before starting work to get a quick business overview.',
      'The +12% and +8% green indicators show growth compared to last month – a healthy sign.',
      'Click on any summary card number to go directly to that module\'s full list.',
      "Today's Appointments section helps you prepare for the day – review it before client calls.",
    ],
    mistakes: [
      'Do not ignore the Recent Activity section – it may show a new inquiry that needs urgent follow-up.',
      'Do not confuse Active Properties count with your personal listings – it shows all brokers\' listings.',
      'If Appointments Today shows 0, verify in the Appointments module that visits are properly scheduled.',
    ],
  },

  hi: {
    module:   'मॉड्यूल 1 – डैशबोर्ड',
    subtitle: 'आपके पूरे व्यवसाय का दैनिक नियंत्रण केंद्र',
    purpose:  'डैशबोर्ड आपको आपके पूरे रियल एस्टेट व्यवसाय का त्वरित अवलोकन देता है – प्रॉपर्टीज़, क्लाइंट्स, अपॉइंटमेंट्स और हाल की गतिविधि – सब एक जगह।',
    steps: [
      { title: 'ENFOR DATA में लॉग इन करें',          desc: 'enfordata.com खोलें और अपना रजिस्टर्ड ईमेल और पासवर्ड डालें। Login बटन पर क्लिक करें। आप सीधे डैशबोर्ड पर पहुँचेंगे।' },
      { title: 'ऊपर के सारांश कार्ड पढ़ें',           desc: 'आपको 3 कार्ड दिखेंगे: Active Properties (कुल लिस्टिंग), Your Clients (आपके द्वारा जोड़े गए क्लाइंट), Appointments Today (आज की मीटिंग)।' },
      { title: 'Clients by Type जांचें',              desc: 'नीचे स्क्रॉल करें – Buyers, Sellers, Tenants, Owners की संख्या देखें।' },
      { title: 'Properties by Status जांचें',         desc: 'दाईं तरफ प्रॉपर्टी की स्थिति देखें – Available, Sold, Rented, Hold, Closed, Under Discussion।' },
      { title: 'आज के अपॉइंटमेंट देखें',             desc: 'चार्ट के नीचे आज के सभी अपॉइंटमेंट की सूची देखें – क्लाइंट नाम, मीटिंग का उद्देश्य और समय।' },
      { title: 'Recent Activity जांचें',              desc: 'दाईं तरफ Recent Activity में नए इन्क्वायरी, अपॉइंटमेंट, क्लाइंट जोड़ने की जानकारी दिखेगी।' },
      { title: 'त्वरित कार्य करें',                   desc: '+ Add Client बटन से सीधे डैशबोर्ड से नया क्लाइंट जोड़ें। + Add Property से नई प्रॉपर्टी लिस्टिंग जोड़ें।' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'प्लेटफॉर्म पर सभी ब्रोकर्स की कुल सक्रिय प्रॉपर्टी लिस्टिंग।' },
      { name: 'Your Clients',         desc: 'अपने व्यक्तिगत रूप से जोड़े गए क्लाइंट की संख्या।' },
      { name: 'Appointments Today',   desc: 'आज की तारीख के लिए शेड्यूल की गई मीटिंग या साइट विज़िट की संख्या।' },
      { name: 'Clients by Type',      desc: '4 प्रकार में क्लाइंट का विभाजन: Buyers, Sellers, Tenants, Owners।' },
      { name: 'Properties by Status', desc: '6 स्थिति श्रेणियाँ दिखाती हैं कि कितनी प्रॉपर्टी किस चरण में हैं।' },
      { name: "Today's Appointments", desc: 'आज के अपॉइंटमेंट की सूची – क्लाइंट नाम, उद्देश्य और समय।' },
      { name: 'Recent Activity',      desc: 'सिस्टम में हुई नवीनतम गतिविधियों का लाइव फ़ीड।' },
    ],
    tips: [
      'काम शुरू करने से पहले हर सुबह डैशबोर्ड जांचें।',
      '+12% और +8% हरे संकेत पिछले महीने की तुलना में वृद्धि दिखाते हैं।',
      'किसी भी सारांश कार्ड नंबर पर क्लिक करके उस मॉड्यूल की पूरी सूची देखें।',
      "Today's Appointments से दिन की तैयारी करें – क्लाइंट कॉल से पहले इसे देखें।",
    ],
    mistakes: [
      'Recent Activity को नजरअंदाज न करें – इसमें जरूरी नई इन्क्वायरी हो सकती है।',
      'Active Properties की संख्या को अपनी व्यक्तिगत लिस्टिंग न समझें – यह सभी ब्रोकर्स की है।',
      'अगर Appointments Today 0 दिखे तो Appointments मॉड्यूल में जाकर जांचें।',
    ],
  },

  mr: {
    module:   'मॉड्यूल 1 – डॅशबोर्ड',
    subtitle: 'आपल्या संपूर्ण व्यवसायाचे दैनंदिन नियंत्रण केंद्र',
    purpose:  'डॅशबोर्ड आपल्याला आपल्या संपूर्ण रिअल एस्टेट व्यवसायाचा जलद आढावा देतो – प्रॉपर्टीज, क्लायंट, अपॉइंटमेंट आणि अलीकडील क्रियाकलाप – सर्व एका ठिकाणी।',
    steps: [
      { title: 'ENFOR DATA मध्ये लॉग इन करा',         desc: 'enfordata.com उघडा आणि नोंदणीकृत ईमेल व पासवर्ड टाका. Login बटणावर क्लिक करा. आपण थेट डॅशबोर्डवर पोहोचाल.' },
      { title: 'वरच्या सारांश कार्ड वाचा',            desc: '3 कार्ड दिसतील: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type तपासा',               desc: 'खाली स्क्रोल करा – Buyers, Sellers, Tenants, Owners ची संख्या पाहा.' },
      { title: 'Properties by Status तपासा',          desc: 'उजव्या बाजूला प्रॉपर्टीची स्थिती पाहा – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'आजच्या अपॉइंटमेंट पाहा',             desc: 'चार्टच्या खाली आजच्या सर्व अपॉइंटमेंटची यादी पाहा – क्लायंटचे नाव, बैठकीचा उद्देश आणि वेळ.' },
      { title: 'Recent Activity तपासा',               desc: 'उजव्या बाजूला नवीन चौकशी, अपॉइंटमेंट, क्लायंट जोडण्याची माहिती दिसेल.' },
      { title: 'जलद क्रिया करा',                      desc: '+ Add Client बटणाने थेट डॅशबोर्डवरून नवीन क्लायंट जोडा. + Add Property ने नवीन प्रॉपर्टी लिस्टिंग जोडा.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'प्लॅटफॉर्मवर सर्व ब्रोकरांच्या एकूण सक्रिय प्रॉपर्टी लिस्टिंग.' },
      { name: 'Your Clients',         desc: 'आपण वैयक्तिकरित्या जोडलेल्या क्लायंटची संख्या.' },
      { name: 'Appointments Today',   desc: 'आजसाठी निर्धारित बैठका किंवा साइट व्हिजिटची संख्या.' },
      { name: 'Clients by Type',      desc: '4 प्रकारांमध्ये क्लायंटचे वर्गीकरण.' },
      { name: 'Properties by Status', desc: '6 स्थिती श्रेण्या.' },
      { name: "Today's Appointments", desc: 'आजच्या अपॉइंटमेंटची यादी.' },
      { name: 'Recent Activity',      desc: 'प्रणालीतील नवीनतम क्रियाकलापांचे थेट फीड.' },
    ],
    tips: [
      'काम सुरू करण्यापूर्वी दररोज सकाळी डॅशबोर्ड तपासा.',
      '+12% हिरवे निर्देशक मागील महिन्याच्या तुलनेत वाढ दर्शवतात.',
      'कोणत्याही सारांश कार्ड नंबरवर क्लिक करून त्या मॉड्यूलची संपूर्ण यादी पाहा.',
      "Today's Appointments मधून दिवसाची तयारी करा.",
    ],
    mistakes: [
      'Recent Activity दुर्लक्ष करू नका – महत्त्वाची नवीन चौकशी असू शकते.',
      'Active Properties ची संख्या वैयक्तिक लिस्टिंग समजू नका – ते सर्व ब्रोकरांचे आहे.',
      'Appointments Today 0 दिसल्यास Appointments मॉड्यूलमध्ये जाऊन तपासा.',
    ],
  },

  gu: {
    module:   'મૉડ્યૂલ 1 – ડૅશબૉર્ડ',
    subtitle: 'તમારા સમગ્ર વ્યવસાયનું દૈનિક નિયંત્રણ કેન્દ્ર',
    purpose:  'ડૅશબૉર્ડ તમને તમારા સમગ્ર રિયલ એસ્ટેટ વ્યવસાયનો ઝડપી અવલોકન આપે છે – પ્રૉપર્ટીઝ, ક્લાઇન્ટ્સ, અપૉઇન્ટમેન્ટ્સ અને તાજેતરની પ્રવૃત્તિ – બધું એક જ જગ્યાએ।',
    steps: [
      { title: 'ENFOR DATA માં લૉગ ઇન કરો',           desc: 'enfordata.com ખોલો અને નોંધાયેલ ઇમેઇલ અને પાસવર્ડ દાખલ કરો. Login બટન પર ક્લિક કરો.' },
      { title: 'ઉપરનાં સારાંશ કાર્ડ વાંચો',          desc: '3 કાર્ડ દેખાશે: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type તપાસો',               desc: 'નીચે સ્ક્રૉલ કરો – Buyers, Sellers, Tenants, Owners ની સંખ્યા જુઓ.' },
      { title: 'Properties by Status તપાસો',          desc: 'જમણી બાજુ પ્રૉપર્ટીની સ્થિતિ જુઓ – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'આજનાં અપૉઇન્ટમેન્ટ જુઓ',            desc: 'ચાર્ટ નીચે આજના તમામ અપૉઇન્ટમેન્ટની સૂચિ – ક્લાઇન્ટ નામ, હેતુ અને સમય.' },
      { title: 'Recent Activity તપાસો',               desc: 'જમણી બાજુ નવી ઇન્ક્વાયરી, અપૉઇન્ટમેન્ટ, ક્લાઇન્ટ ઉમેરવાની માહિતી.' },
      { title: 'ઝડપી ક્રિયા કરો',                    desc: '+ Add Client બટનથી સીધા ડૅશબૉર્ડ પરથી ક્લાઇન્ટ ઉમેરો. + Add Property થી નવી પ્રૉપર્ટી ઉમેરો.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'પ્લૅટફૉર્મ પર તમામ બ્રૉકર્સની કુલ સક્રિય પ્રૉપર્ટી લિસ્ટિંગ.' },
      { name: 'Your Clients',         desc: 'તમે વ્યક્તિગત રૂપે ઉમેર્યા ક્લાઇન્ટ્સ.' },
      { name: 'Appointments Today',   desc: 'આજ માટે નિર્ધારિત મિટિંગ અથવા સાઇટ વિઝિટ.' },
      { name: 'Clients by Type',      desc: '4 પ્રકારમાં ક્લાઇન્ટ વર્ગીકરણ.' },
      { name: 'Properties by Status', desc: '6 સ્ટૅટ્સ કૅટૅગૉરી.' },
      { name: "Today's Appointments", desc: 'આજની અપૉઇન્ટમેન્ટ સૂચિ.' },
      { name: 'Recent Activity',      desc: 'સિસ્ટમમાં તાજેતરની ક્રિયાઓ.' },
    ],
    tips: [
      'કામ શરૂ કરતા પહેલા દરરોજ સવારે ડૅશબૉર્ડ તપાસો.',
      '+12% લીલા સંકેત ગયા મહિના કરતા વૃદ્ધિ દર્શાવે છે.',
      'કોઈ પણ સારાંશ કાર્ડ નંબર પર ક્લિક કરી તે મૉડ્યૂલ સૂચિ જુઓ.',
      "Today's Appointments થી દિવસની તૈયારી કરો.",
    ],
    mistakes: [
      'Recent Activity અવગણશો નહીં – જરૂરી ઇન્ક્વાયરી હોઈ શકે.',
      'Active Properties ને વ્યક્તિગત લિસ્ટિંગ ન સમજો.',
      'Appointments Today 0 દેખાય તો Appointments મૉડ્યૂલ તપાસો.',
    ],
  },

  ta: {
    module:   'தொகுதி 1 – டாஷ்போர்டு',
    subtitle: 'உங்கள் வணிகத்தின் தினசரி கட்டுப்பாட்டு மையம்',
    purpose:  'டாஷ்போர்டு உங்கள் முழு ரியல் எஸ்டேட் வணிகத்தின் விரைவான கண்ணோட்டத்தை வழங்குகிறது – சொத்துகள், வாடிக்கையாளர்கள், நியமனங்கள் மற்றும் சமீபத்திய செயல்பாடு – அனைத்தும் ஒரே இடத்தில்.',
    steps: [
      { title: 'ENFOR DATA இல் உள்நுழையவும்',        desc: 'enfordata.com திறந்து பதிவுசெய்த மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும். Login பொத்தானைக் கிளிக் செய்யவும்.' },
      { title: 'மேலே உள்ள சுருக்கக் கார்டுகளை படிக்கவும்', desc: '3 கார்டுகள் தெரியும்: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type சரிபார்க்கவும்',     desc: 'கீழே ஸ்க்ரோல் செய்யுங்கள் – Buyers, Sellers, Tenants, Owners எண்ணிக்கை பார்க்கவும்.' },
      { title: 'Properties by Status சரிபார்க்கவும்', desc: 'வலது பக்கம் சொத்தின் நிலை பார்க்கவும் – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'இன்றைய நியமனங்கள் பார்க்கவும்',     desc: 'வரைபடங்களுக்கு கீழ் இன்றைய அனைத்து நியமனங்களும் – வாடிக்கையாளர் பெயர், நோக்கம், நேரம்.' },
      { title: 'Recent Activity சரிபார்க்கவும்',      desc: 'வலது பக்கம் புதிய விசாரணைகள், நியமனங்கள், வாடிக்கையாளர் சேர்க்கை தகவல்.' },
      { title: 'விரைவு செயல்கள் செய்யவும்',          desc: '+ Add Client மூலம் நேரடியாக வாடிக்கையாளர் சேர்க்கவும். + Add Property மூலம் புதிய பட்டியல் சேர்க்கவும்.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'அனைத்து தரகர்களின் மொத்த சுறுசுறுப்பான சொத்து பட்டியல்கள்.' },
      { name: 'Your Clients',         desc: 'நீங்கள் சேர்த்த வாடிக்கையாளர்கள்.' },
      { name: 'Appointments Today',   desc: 'இன்று நிர்ணயிக்கப்பட்ட சந்திப்புகள்.' },
      { name: 'Clients by Type',      desc: '4 வகைகளில் வாடிக்கையாளர் பிரிவு.' },
      { name: 'Properties by Status', desc: '6 நில வகைகள்.' },
      { name: "Today's Appointments", desc: 'இன்றைய நியமன பட்டியல்.' },
      { name: 'Recent Activity',      desc: 'சமீபத்திய செயல்பாடுகளின் நேரடி ஊட்டம்.' },
    ],
    tips: [
      'வேலை தொடங்குவதற்கு முன் தினமும் காலையில் டாஷ்போர்டு சரிபார்க்கவும்.',
      '+12% பச்சை சூள்காட்டி கடந்த மாதத்தை விட வளர்ச்சியைக் காட்டுகிறது.',
      'எந்த சுருக்க கார்டு எண்ணையும் கிளிக் செய்து அந்த தொகுதியின் முழு பட்டியல் பார்க்கவும்.',
      "Today's Appointments மூலம் நாளை திட்டமிடுங்கள்.",
    ],
    mistakes: [
      'Recent Activity ஐ புறக்கணிக்காதீர்கள் – முக்கியமான விசாரணை இருக்கலாம்.',
      'Active Properties ஐ தனிப்பட்ட பட்டியல்கள் என தவறாக புரிந்துகொள்ளாதீர்கள்.',
      'Appointments Today 0 காட்டினால் Appointments தொகுதியில் சரிபார்க்கவும்.',
    ],
  },

  te: {
    module:   'మాడ్యూల్ 1 – డాష్‌బోర్డ్',
    subtitle: 'మీ వ్యాపారం యొక్క రోజువారీ నియంత్రణ కేంద్రం',
    purpose:  'డాష్‌బోర్డ్ మీ మొత్తం రియల్ ఎస్టేట్ వ్యాపారానికి సంబంధించిన సత్వర అవలోకనాన్ని అందిస్తుంది – ప్రాపర్టీలు, క్లయింట్లు, అపాయింట్‌మెంట్లు మరియు ఇటీవలి కార్యకలాపాలు – అన్నీ ఒకే చోట.',
    steps: [
      { title: 'ENFOR DATA లో లాగిన్ అవ్వండి',       desc: 'enfordata.com తెరిచి నమోదిత ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి. Login బటన్ నొక్కండి.' },
      { title: 'పై సారాంశ కార్డులు చదవండి',          desc: '3 కార్డులు కనిపిస్తాయి: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type తనిఖీ చేయండి',       desc: 'కిందికి స్క్రోల్ చేయండి – Buyers, Sellers, Tenants, Owners సంఖ్య చూడండి.' },
      { title: 'Properties by Status తనిఖీ చేయండి',  desc: 'కుడి వైపు ప్రాపర్టీ స్థితి చూడండి – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'నేటి అపాయింట్‌మెంట్లు చూడండి',      desc: 'చార్ట్‌ల కింద నేటి అన్ని అపాయింట్‌మెంట్లు – క్లయింట్ పేరు, ఉద్దేశ్యం మరియు సమయం.' },
      { title: 'Recent Activity తనిఖీ చేయండి',       desc: 'కుడి వైపు కొత్త విచారణలు, అపాయింట్‌మెంట్లు, క్లయింట్ చేరిక సమాచారం.' },
      { title: 'త్వరిత చర్యలు',                       desc: '+ Add Client బటన్‌తో నేరుగా డాష్‌బోర్డ్ నుండి క్లయింట్ చేర్చండి. + Add Property తో కొత్త లిస్టింగ్ చేర్చండి.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'అన్ని బ్రోకర్ల మొత్తం క్రియాశీల ప్రాపర్టీ లిస్టింగ్‌లు.' },
      { name: 'Your Clients',         desc: 'మీరు వ్యక్తిగతంగా చేర్చిన క్లయింట్లు.' },
      { name: 'Appointments Today',   desc: 'నేడు నిర్ణయించిన మీటింగ్‌లు.' },
      { name: 'Clients by Type',      desc: '4 రకాలలో క్లయింట్ విభజన.' },
      { name: 'Properties by Status', desc: '6 స్థితి వర్గాలు.' },
      { name: "Today's Appointments", desc: 'నేటి అపాయింట్‌మెంట్ జాబితా.' },
      { name: 'Recent Activity',      desc: 'తాజా కార్యకలాపాల లైవ్ ఫీడ్.' },
    ],
    tips: [
      'పని ప్రారంభించే ముందు ప్రతి ఉదయం డాష్‌బోర్డ్ తనిఖీ చేయండి.',
      '+12% ఆకుపచ్చ సంకేత గత నెలతో పోలిస్తే వృద్ధిని చూపిస్తుంది.',
      'ఏదైనా సారాంశ కార్డ్ నంబర్ నొక్కి ఆ మాడ్యూల్ జాబితా చూడండి.',
      "Today's Appointments ద్వారా రోజు ప్రణాళిక వేయండి.",
    ],
    mistakes: [
      'Recent Activity ని నిర్లక్ష్యం చేయకండి – ముఖ్యమైన విచారణ ఉండవచ్చు.',
      'Active Properties సంఖ్యని మీ వ్యక్తిగత లిస్టింగ్‌లుగా పరిగణించకండి.',
      'Appointments Today 0 కనిపిస్తే Appointments మాడ్యూల్‌లో తనిఖీ చేయండి.',
    ],
  },

  bn: {
    module:   'মডিউল 1 – ড্যাশবোর্ড',
    subtitle: 'আপনার সমগ্র ব্যবসার দৈনিক নিয়ন্ত্রণ কেন্দ্র',
    purpose:  'ড্যাশবোর্ড আপনাকে আপনার পূর্ণ রিয়েল এস্টেট ব্যবসার একটি দ্রুত ওভারভিউ দেয় – সম্পত্তি, ক্লায়েন্ট, অ্যাপয়েন্টমেন্ট এবং সাম্প্রতিক কার্যকলাপ – সব একটি জায়গায়।',
    steps: [
      { title: 'ENFOR DATA তে লগ ইন করুন',           desc: 'enfordata.com খুলুন এবং নিবন্ধিত ইমেল ও পাসওয়ার্ড দিন। Login বোতামে ক্লিক করুন।' },
      { title: 'উপরের সারসংক্ষেপ কার্ড পড়ুন',       desc: '3টি কার্ড দেখতে পাবেন: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type পরীক্ষা করুন',       desc: 'নীচে স্ক্রোল করুন – Buyers, Sellers, Tenants, Owners সংখ্যা দেখুন।' },
      { title: 'Properties by Status পরীক্ষা করুন',  desc: 'ডানদিকে সম্পত্তির অবস্থা দেখুন – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'আজকের অ্যাপয়েন্টমেন্ট দেখুন',       desc: 'চার্টের নিচে আজকের সব অ্যাপয়েন্টমেন্ট – ক্লায়েন্টের নাম, উদ্দেশ্য এবং সময়।' },
      { title: 'Recent Activity পরীক্ষা করুন',       desc: 'ডানদিকে নতুন অনুসন্ধান, অ্যাপয়েন্টমেন্ট, ক্লায়েন্ট যোগের তথ্য।' },
      { title: 'দ্রুত কার্যক্রম করুন',               desc: '+ Add Client বোতাম দিয়ে সরাসরি ড্যাশবোর্ড থেকে ক্লায়েন্ট যোগ করুন। + Add Property দিয়ে নতুন তালিকা যোগ করুন।' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'সব ব্রোকারের মোট সক্রিয় সম্পত্তি তালিকা।' },
      { name: 'Your Clients',         desc: 'আপনি ব্যক্তিগতভাবে যোগ করা ক্লায়েন্ট।' },
      { name: 'Appointments Today',   desc: 'আজকের নির্ধারিত মিটিং বা সাইট ভিজিট।' },
      { name: 'Clients by Type',      desc: '4 ধরনে ক্লায়েন্ট বিভাজন।' },
      { name: 'Properties by Status', desc: '6টি স্ট্যাটাস বিভাগ।' },
      { name: "Today's Appointments", desc: 'আজকের অ্যাপয়েন্টমেন্ট তালিকা।' },
      { name: 'Recent Activity',      desc: 'সাম্প্রতিক কার্যকলাপের লাইভ ফিড।' },
    ],
    tips: [
      'কাজ শুরু করার আগে প্রতিদিন সকালে ড্যাশবোর্ড চেক করুন।',
      '+12% সবুজ সংকেত গত মাসের তুলনায় বৃদ্ধি দেখায়।',
      'যেকোনো সারসংক্ষেপ কার্ড নম্বরে ক্লিক করে সেই মডিউলের তালিকা দেখুন।',
      "Today's Appointments দিয়ে দিনের পরিকল্পনা করুন।",
    ],
    mistakes: [
      'Recent Activity উপেক্ষা করবেন না – গুরুত্বপূর্ণ অনুসন্ধান থাকতে পারে।',
      'Active Properties কে নিজের ব্যক্তিগত তালিকা ভাববেন না।',
      'Appointments Today 0 দেখালে Appointments মডিউলে যান।',
    ],
  },

  kn: {
    module:   'ಮಾಡ್ಯೂಲ್ 1 – ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    subtitle: 'ನಿಮ್ಮ ಸಂಪೂರ್ಣ ವ್ಯವಹಾರದ ದೈನಂದಿನ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
    purpose:  'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನಿಮ್ಮ ಸಂಪೂರ್ಣ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ವ್ಯವಹಾರದ ತ್ವರಿತ ಅವಲೋಕನವನ್ನು ನೀಡುತ್ತದೆ – ಆಸ್ತಿಗಳು, ಗ್ರಾಹಕರು, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ಮತ್ತು ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ – ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.',
    steps: [
      { title: 'ENFOR DATA ಗೆ ಲಾಗಿನ್ ಆಗಿ',          desc: 'enfordata.com ತೆರೆದು ನೋಂದಾಯಿತ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ. Login ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.' },
      { title: 'ಮೇಲಿನ ಸಾರಾಂಶ ಕಾರ್ಡ್‌ಗಳನ್ನು ಓದಿ',    desc: '3 ಕಾರ್ಡ್‌ಗಳು ಕಾಣಿಸುತ್ತವೆ: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type ಪರಿಶೀಲಿಸಿ',          desc: 'ಕೆಳಗೆ ಸ್ಕ್ರೋಲ್ ಮಾಡಿ – Buyers, Sellers, Tenants, Owners ಸಂಖ್ಯೆ ನೋಡಿ.' },
      { title: 'Properties by Status ಪರಿಶೀಲಿಸಿ',     desc: 'ಬಲ ಬದಿಯಲ್ಲಿ ಆಸ್ತಿ ಸ್ಥಿತಿ ನೋಡಿ – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'ಇಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ನೋಡಿ',     desc: 'ಚಾರ್ಟ್‌ಗಳ ಕೆಳಗೆ ಇಂದಿನ ಎಲ್ಲ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು – ಗ್ರಾಹಕ ಹೆಸರು, ಉದ್ದೇಶ ಮತ್ತು ಸಮಯ.' },
      { title: 'Recent Activity ಪರಿಶೀಲಿಸಿ',          desc: 'ಬಲ ಬದಿಯಲ್ಲಿ ಹೊಸ ಚೌಕಾಶಿಗಳು, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು, ಗ್ರಾಹಕ ಸೇರಿಕೆ ಮಾಹಿತಿ.' },
      { title: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',                   desc: '+ Add Client ಬಟನ್‌ನಿಂದ ನೇರವಾಗಿ ಗ್ರಾಹಕ ಸೇರಿಸಿ. + Add Property ನಿಂದ ಹೊಸ ಲಿಸ್ಟಿಂಗ್ ಸೇರಿಸಿ.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'ಎಲ್ಲ ಬ್ರೋಕರ್‌ಗಳ ಒಟ್ಟು ಸಕ್ರಿಯ ಆಸ್ತಿ ಪಟ್ಟಿಗಳು.' },
      { name: 'Your Clients',         desc: 'ನೀವು ವ್ಯಕ್ತಿಗತವಾಗಿ ಸೇರಿಸಿದ ಗ್ರಾಹಕರು.' },
      { name: 'Appointments Today',   desc: 'ಇಂದು ನಿರ್ಧರಿಸಿದ ಸಭೆಗಳು.' },
      { name: 'Clients by Type',      desc: '4 ವಿಧಗಳಲ್ಲಿ ಗ್ರಾಹಕ ವಿಭಜನ.' },
      { name: 'Properties by Status', desc: '6 ಸ್ಥಿತಿ ವರ್ಗಗಳು.' },
      { name: "Today's Appointments", desc: 'ಇಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಪಟ್ಟಿ.' },
      { name: 'Recent Activity',      desc: 'ತಾಜಾ ಚಟುವಟಿಕೆಗಳ ಲೈವ್ ಫೀಡ್.' },
    ],
    tips: [
      'ಕೆಲಸ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ಪ್ರತಿ ಬೆಳಿಗ್ಗೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪರಿಶೀಲಿಸಿ.',
      '+12% ಹಸಿರು ಸಂಕೇತ ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ಬೆಳವಣಿಗೆ ತೋರಿಸುತ್ತದೆ.',
      'ಯಾವುದೇ ಸಾರಾಂಶ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಆ ಮಾಡ್ಯೂಲ್ ಪಟ್ಟಿ ನೋಡಿ.',
      "Today's Appointments ಮೂಲಕ ದಿನ ಯೋಜಿಸಿ.",
    ],
    mistakes: [
      'Recent Activity ನಿರ್ಲಕ್ಷಿಸಬೇಡಿ – ಮುಖ್ಯ ಚೌಕಾಶಿ ಇರಬಹುದು.',
      'Active Properties ಅನ್ನು ನಿಮ್ಮ ವ್ಯಕ್ತಿಗತ ಪಟ್ಟಿಗಳು ಎಂದು ತಪ್ಪಾಗಿ ಅರ್ಥೈಸಬೇಡಿ.',
      'Appointments Today 0 ತೋರಿದರೆ Appointments ಮಾಡ್ಯೂಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    ],
  },

  ml: {
    module:   'മൊഡ്യൂൾ 1 – ഡാഷ്‌ബോർഡ്',
    subtitle: 'നിങ്ങളുടെ മൊത്തം ബിസിനസ്സിന്റെ ദൈനംദിന നിയന്ത്രണ കേന്ദ്രം',
    purpose:  'ഡാഷ്‌ബോർഡ് നിങ്ങളുടെ മൊത്തം റിയൽ എസ്‌റ്റേറ്റ് ബിസിനസ്സിന്റെ ദ്രുത അവലോകനം നൽകുന്നു – പ്രോപ്പർട്ടികൾ, ക്ലൈന്റുകൾ, അപ്പോയ്ന്റ്‌മെന്റുകൾ, സമ്പദ്‌കാല പ്രവർത്തനങ്ങൾ – എല്ലാം ഒരിടത്ത്.',
    steps: [
      { title: 'ENFOR DATA ൽ ലോഗിൻ ചെയ്യുക',        desc: 'enfordata.com തുറന്ന് രജിസ്‌റ്റർ ചെയ്ത ഇമെയിലും പാസ്‌വേഡും നൽകുക. Login ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.' },
      { title: 'മേലിലെ സംഗ്രഹ കാർഡുകൾ വായിക്കുക',  desc: '3 കാർഡുകൾ കാണാം: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type പരിശോധിക്കുക',       desc: 'താഴേക്ക് സ്ക്രോൾ ചെയ്യുക – Buyers, Sellers, Tenants, Owners എണ്ണം കാണുക.' },
      { title: 'Properties by Status പരിശോധിക്കുക',  desc: 'വലതുഭാഗത്ത് പ്രോപ്പർട്ടി നില കാണുക – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'ഇന്നത്തെ അപ്പോയ്ന്റ്‌മെന്റുകൾ കാണുക', desc: 'ചാർട്ടുകൾക്ക് താഴെ ഇന്നത്തെ എല്ലാ അപ്പോയ്ന്റ്‌മെന്റുകളും – ക്ലൈന്റ് പേര്, ഉദ്ദേശ്യം, സമയം.' },
      { title: 'Recent Activity പരിശോധിക്കുക',       desc: 'വലതുഭാഗത്ത് പുതിയ അന്വേഷണങ്ങൾ, അപ്പോയ്ന്റ്‌മെന്റുകൾ, ക്ലൈന്റ് ചേർക്കൽ വിവരങ്ങൾ.' },
      { title: 'ദ്രുത പ്രവർത്തനങ്ങൾ',               desc: '+ Add Client ഉപയോഗിച്ച് നേരിട്ട് ക്ലൈന്റ് ചേർക്കുക. + Add Property ഉപയോഗിച്ച് പ്രോപ്പർട്ടി ലിസ്‌റ്റ് ചേർക്കുക.' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'എല്ലാ ബ്രോക്കർമാരുടേയും ആകെ സക്രിയ പ്രോപ്പർട്ടി ലിസ്‌റ്റിങ്ങുകൾ.' },
      { name: 'Your Clients',         desc: 'നിങ്ങൾ വ്യക്തിഗതമായി ചേർത്ത ക്ലൈന്റുകൾ.' },
      { name: 'Appointments Today',   desc: 'ഇന്ന് നിശ്ചയിച്ച മീറ്റിങ്ങുകൾ.' },
      { name: 'Clients by Type',      desc: '4 തരത്തിൽ ക്ലൈന്റ് വിഭജനം.' },
      { name: 'Properties by Status', desc: '6 സ്‌റ്റാറ്റസ് വിഭാഗങ്ങൾ.' },
      { name: "Today's Appointments", desc: 'ഇന്നത്തെ അപ്പോയ്ന്റ്‌മെന്റ് ലിസ്‌റ്റ്.' },
      { name: 'Recent Activity',      desc: 'ഏറ്റവും പുതിയ പ്രവർത്തനങ്ങളുടെ ലൈവ് ഫീഡ്.' },
    ],
    tips: [
      'ജോലി ആരംഭിക്കുന്നതിന് മുമ്പ് എല്ലാ ദിവസവും രാവിലെ ഡാഷ്‌ബോർഡ് പരിശോധിക്കുക.',
      '+12% പച്ച സൂചിക കഴിഞ്ഞ മാസത്തെ അപേക്ഷിച്ച് വളർച്ച കാണിക്കുന്നു.',
      'ഏതെങ്കിലും സംഗ്രഹ കാർഡ് നമ്പർ ക്ലിക്ക് ചെയ്ത് ആ മൊഡ്യൂളിന്റെ ലിസ്‌റ്റ് കാണുക.',
      "Today's Appointments ഉപയോഗിച്ച് ദിവസ ആസൂത്രണം ചെയ്യുക.",
    ],
    mistakes: [
      'Recent Activity അവഗണിക്കരുത് – പ്രധാനപ്പെട്ട അന്വേഷണം ഉണ്ടാകാം.',
      'Active Properties നിങ്ങളുടെ വ്യക്തിഗത ലിസ്‌റ്റിങ്ങ് ആണ് എന്ന് തെറ്റിദ്ധരിക്കരുത്.',
      'Appointments Today 0 കാണിക്കിൽ Appointments മൊഡ്യൂളിൽ പരിശോധിക്കുക.',
    ],
  },

  pa: {
    module:   'ਮੌਡਿਊਲ 1 – ਡੈਸ਼ਬੋਰਡ',
    subtitle: 'ਤੁਹਾਡੇ ਸਾਰੇ ਕਾਰੋਬਾਰ ਦਾ ਰੋਜ਼ਾਨਾ ਨਿਯੰਤਰਣ ਕੇਂਦਰ',
    purpose:  'ਡੈਸ਼ਬੋਰਡ ਤੁਹਾਨੂੰ ਤੁਹਾਡੇ ਪੂਰੇ ਰਿਯਲ ਅਸਟੇਟ ਕਾਰੋਬਾਰ ਦੀ ਤੇਜ਼ ਜਾਣਕਾਰੀ ਦਿੰਦਾ ਹੈ – ਜਾਇਦਾਦਾਂ, ਗਾਹਕ, ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਤਾਜ਼ਾ ਗਤੀਵਿਧੀਆਂ – ਸਭ ਇੱਕੇ ਥਾਂ।',
    steps: [
      { title: 'ENFOR DATA ਵਿੱਚ ਲੌਗਿਨ ਕਰੋ',         desc: 'enfordata.com ਖੋਲ੍ਹੋ ਅਤੇ ਰਜਿਸਟਰਡ ਈਮੇਲ ਅਤੇ ਪਾਸਵਰਡ ਦਾਖਲ ਕਰੋ। Login ਬਟਨ ਦਬਾਓ।' },
      { title: 'ਉੱਪਰ ਦੇ ਸੰਖੇਪ ਕਾਰਡ ਪੜ੍ਹੋ',           desc: '3 ਕਾਰਡ ਦਿਖਣਗੇ: Active Properties, Your Clients, Appointments Today.' },
      { title: 'Clients by Type ਜਾਂਚੋ',              desc: 'ਹੇਠਾਂ ਸਕ੍ਰੋਲ ਕਰੋ – Buyers, Sellers, Tenants, Owners ਦੀ ਗਿਣਤੀ ਵੇਖੋ।' },
      { title: 'Properties by Status ਜਾਂਚੋ',         desc: 'ਸੱਜੇ ਪਾਸੇ ਜਾਇਦਾਦ ਦੀ ਸਥਿਤੀ ਵੇਖੋ – Available, Sold, Rented, Hold, Closed, Under Discussion.' },
      { title: 'ਅੱਜ ਦੇ ਮੁਲਾਕਾਤਾਂ ਵੇਖੋ',              desc: 'ਚਾਰਟਾਂ ਤੋਂ ਹੇਠਾਂ ਅੱਜ ਦੇ ਸਾਰੇ ਮੁਲਾਕਾਤਾਂ – ਗਾਹਕ ਨਾਮ, ਮਕਸਦ ਅਤੇ ਸਮਾਂ।' },
      { title: 'Recent Activity ਜਾਂਚੋ',              desc: 'ਸੱਜੇ ਪਾਸੇ ਨਵੀਂ ਪੁੱਛਗਿੱਛਾਂ, ਮੁਲਾਕਾਤਾਂ, ਗਾਹਕ ਜੋੜਨ ਦੀ ਜਾਣਕਾਰੀ।' },
      { title: 'ਤੇਜ਼ ਕਾਰਵਾਈਆਂ',                      desc: '+ Add Client ਬਟਨ ਨਾਲ ਸਿੱਧੇ ਡੈਸ਼ਬੋਰਡ ਤੋਂ ਗਾਹਕ ਜੋੜੋ। + Add Property ਨਾਲ ਨਵੀਂ ਲਿਸਟਿੰਗ ਜੋੜੋ।' },
    ],
    fields: [
      { name: 'Active Properties',    desc: 'ਸਾਰੇ ਬ੍ਰੋਕਰਾਂ ਦੀ ਕੁੱਲ ਸਰਗਰਮ ਜਾਇਦਾਦ ਸੂਚੀ।' },
      { name: 'Your Clients',         desc: 'ਤੁਸੀਂ ਖੁਦ ਜੋੜੇ ਗਾਹਕ।' },
      { name: 'Appointments Today',   desc: 'ਅੱਜ ਲਈ ਤਹਿ ਕੀਤੀਆਂ ਮੀਟਿੰਗਾਂ।' },
      { name: 'Clients by Type',      desc: '4 ਕਿਸਮਾਂ ਵਿੱਚ ਗਾਹਕ ਵੰਡ।' },
      { name: 'Properties by Status', desc: '6 ਸਥਿਤੀ ਸ਼੍ਰੇਣੀਆਂ।' },
      { name: "Today's Appointments", desc: 'ਅੱਜ ਦੀਆਂ ਮੁਲਾਕਾਤਾਂ ਦੀ ਸੂਚੀ।' },
      { name: 'Recent Activity',      desc: 'ਤਾਜ਼ਾ ਗਤੀਵਿਧੀਆਂ ਦਾ ਲਾਈਵ ਫੀਡ।' },
    ],
    tips: [
      'ਕੰਮ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਹਰ ਸਵੇਰੇ ਡੈਸ਼ਬੋਰਡ ਜਾਂਚੋ।',
      '+12% ਹਰਾ ਸੰਕੇਤ ਪਿਛਲੇ ਮਹੀਨੇ ਨਾਲੋਂ ਵਾਧਾ ਦਿਖਾਉਂਦਾ ਹੈ।',
      'ਕਿਸੇ ਵੀ ਸੰਖੇਪ ਕਾਰਡ ਉੱਤੇ ਕਲਿੱਕ ਕਰਕੇ ਉਸ ਮੌਡਿਊਲ ਦੀ ਸੂਚੀ ਵੇਖੋ।',
      "Today's Appointments ਨਾਲ ਦਿਨ ਦੀ ਯੋਜਨਾ ਬਣਾਓ।",
    ],
    mistakes: [
      'Recent Activity ਨੂੰ ਨਜ਼ਰਅੰਦਾਜ਼ ਨਾ ਕਰੋ – ਜ਼ਰੂਰੀ ਪੁੱਛਗਿੱਛ ਹੋ ਸਕਦੀ ਹੈ।',
      'Active Properties ਨੂੰ ਆਪਣੀ ਨਿੱਜੀ ਸੂਚੀ ਨਾ ਸਮਝੋ।',
      'Appointments Today 0 ਦਿਖੇ ਤਾਂ Appointments ਮੌਡਿਊਲ ਵਿੱਚ ਜਾਂਚੋ।',
    ],
  },
};
