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
  { code: 'en', label: 'English'  },
  { code: 'hi', label: 'हिंदी'     },
  { code: 'mr', label: 'मराठी'     },
  { code: 'gu', label: 'ગુજરાતી'   },
  { code: 'ta', label: 'தமிழ்'     },
  { code: 'te', label: 'తెలుగు'    },
  { code: 'bn', label: 'বাংলা'     },
  { code: 'kn', label: 'ಕನ್ನಡ'     },
  { code: 'ml', label: 'മലയാളം'    },
  { code: 'pa', label: 'ਪੰਜਾਬੀ'    },
] as const;
export type LangCode = typeof HELP_LANGS[number]['code'];

// ─── Helpers ────────────────────────────────────────────────────────────────
// helpContent maps route segment → { en: HelpModule, hi?: ..., ... }
// Dashboard has all 10 langs; other pages are English-only for now.
export type PageHelpEntry = { en: HelpModule } & Partial<Record<LangCode, HelpModule>>;
export const helpContent: Record<string, PageHelpEntry> = {

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    en: {
      module:   'Dashboard',
      subtitle: 'Your daily control centre for the entire business',
      purpose:  'The Dashboard gives you a quick overview of your entire real estate business – properties, clients, appointments, and recent activity – all in one place.',
      steps: [
        { title: 'Log in to ENFOR DATA',                desc: 'Open the app and enter your registered email and password. You will land directly on the Dashboard.' },
        { title: 'Read the summary cards at the top',   desc: '3 cards show: Active Properties (total listings), Your Clients (clients you added), Appointments Today (today\'s meetings).' },
        { title: 'Check Clients by Type',               desc: 'Scroll down to see a breakdown – Buyers, Sellers, Tenants, Owners – with count next to each.' },
        { title: 'Check Properties by Status',          desc: 'On the right you will see property counts by status: Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: "View Today's Appointments",           desc: 'Below the charts, see all appointments for today with client name, meeting type, and time.' },
        { title: 'Check Recent Activity',               desc: 'The Recent Activity feed shows the latest actions – new inquiries, appointments, client additions.' },
        { title: 'Quick Actions',                       desc: 'Use + Add Client to add a new client directly from the Dashboard. Use + Add Property to add a new listing quickly.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'Total active property listings across all brokers on the platform.' },
        { name: 'Your Clients',         desc: 'Total clients you personally added.' },
        { name: 'Appointments Today',   desc: 'Meetings or site visits scheduled for today.' },
        { name: 'Clients by Type',      desc: 'Breakdown into 4 types: Buyers, Sellers, Tenants, Owners.' },
        { name: 'Properties by Status', desc: '6 status categories showing how many properties are in each stage.' },
        { name: "Today's Appointments", desc: "List of today's appointments with client name, purpose, and time." },
        { name: 'Recent Activity',      desc: 'Live feed of the latest actions in the system.' },
      ],
      tips: [
        'Check the Dashboard every morning before starting work for a quick business overview.',
        'Green indicators (+12%, +8%) show growth compared to last month.',
        'Click any summary card number to go directly to that module\'s full list.',
        "Review Today's Appointments before making client calls.",
      ],
      mistakes: [
        'Do not ignore the Recent Activity section – it may show a new inquiry that needs urgent follow-up.',
        'Do not confuse Active Properties count with your personal listings – it shows all brokers.',
        'If Appointments Today shows 0, verify in the Appointments module that visits are properly scheduled.',
      ],
    },
    hi: {
      module: 'डैशबोर्ड', subtitle: 'आपके पूरे व्यवसाय का दैनिक नियंत्रण केंद्र',
      purpose: 'डैशबोर्ड आपको आपके पूरे रियल एस्टेट व्यवसाय का त्वरित अवलोकन देता है – प्रॉपर्टीज़, क्लाइंट्स, अपॉइंटमेंट्स और हाल की गतिविधि – सब एक जगह।',
      steps: [
        { title: 'ENFOR DATA में लॉग इन करें',         desc: 'enfordata.com खोलें और अपना रजिस्टर्ड ईमेल और पासवर्ड डालें। Login बटन पर क्लिक करें।' },
        { title: 'ऊपर के सारांश कार्ड पढ़ें',          desc: '3 कार्ड दिखेंगे: Active Properties, Your Clients, Appointments Today।' },
        { title: 'Clients by Type जांचें',             desc: 'नीचे स्क्रॉल करें – Buyers, Sellers, Tenants, Owners की संख्या देखें।' },
        { title: 'Properties by Status जांचें',        desc: 'दाईं तरफ प्रॉपर्टी की स्थिति देखें – Available, Sold, Rented, Hold, Closed, Under Discussion।' },
        { title: 'आज के अपॉइंटमेंट देखें',            desc: 'चार्ट के नीचे आज के सभी अपॉइंटमेंट की सूची देखें।' },
        { title: 'Recent Activity जांचें',             desc: 'दाईं तरफ Recent Activity में नए इन्क्वायरी, अपॉइंटमेंट, क्लाइंट जोड़ने की जानकारी दिखेगी।' },
        { title: 'त्वरित कार्य करें',                  desc: '+ Add Client बटन से नया क्लाइंट जोड़ें। + Add Property से नई प्रॉपर्टी जोड़ें।' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'प्लेटफॉर्म पर सभी ब्रोकर्स की कुल सक्रिय प्रॉपर्टी लिस्टिंग।' },
        { name: 'Your Clients',         desc: 'आपके व्यक्तिगत रूप से जोड़े गए क्लाइंट की संख्या।' },
        { name: 'Appointments Today',   desc: 'आज की तारीख के लिए शेड्यूल की गई मीटिंग या साइट विज़िट।' },
        { name: 'Clients by Type',      desc: '4 प्रकार में क्लाइंट का विभाजन।' },
        { name: 'Properties by Status', desc: '6 स्थिति श्रेणियाँ।' },
        { name: "Today's Appointments", desc: 'आज के अपॉइंटमेंट की सूची।' },
        { name: 'Recent Activity',      desc: 'सिस्टम में हुई नवीनतम गतिविधियों का लाइव फ़ीड।' },
      ],
      tips: [
        'काम शुरू करने से पहले हर सुबह डैशबोर्ड जांचें।',
        '+12% हरे संकेत पिछले महीने की तुलना में वृद्धि दिखाते हैं।',
        'किसी भी सारांश कार्ड नंबर पर क्लिक करके उस मॉड्यूल की पूरी सूची देखें।',
        "Today's Appointments से दिन की तैयारी करें।",
      ],
      mistakes: [
        'Recent Activity को नजरअंदाज न करें – इसमें जरूरी नई इन्क्वायरी हो सकती है।',
        'Active Properties की संख्या को अपनी व्यक्तिगत लिस्टिंग न समझें।',
        'अगर Appointments Today 0 दिखे तो Appointments मॉड्यूल में जाकर जांचें।',
      ],
    },
    mr: {
      module: 'डॅशबोर्ड', subtitle: 'आपल्या संपूर्ण व्यवसायाचे दैनंदिन नियंत्रण केंद्र',
      purpose: 'डॅशबोर्ड आपल्याला संपूर्ण रिअल एस्टेट व्यवसायाचा जलद आढावा देतो – प्रॉपर्टीज, क्लायंट, अपॉइंटमेंट आणि अलीकडील क्रियाकलाप – सर्व एका ठिकाणी।',
      steps: [
        { title: 'ENFOR DATA मध्ये लॉग इन करा',        desc: 'enfordata.com उघडा आणि नोंदणीकृत ईमेल व पासवर्ड टाका.' },
        { title: 'वरच्या सारांश कार्ड वाचा',           desc: '3 कार्ड दिसतील: Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type तपासा',              desc: 'खाली स्क्रोल करा – Buyers, Sellers, Tenants, Owners ची संख्या पाहा.' },
        { title: 'Properties by Status तपासा',         desc: 'उजव्या बाजूला प्रॉपर्टीची स्थिती पाहा.' },
        { title: 'आजच्या अपॉइंटमेंट पाहा',            desc: 'चार्टच्या खाली आजच्या सर्व अपॉइंटमेंटची यादी पाहा.' },
        { title: 'Recent Activity तपासा',              desc: 'उजव्या बाजूला नवीन चौकशी, अपॉइंटमेंट, क्लायंट जोडण्याची माहिती दिसेल.' },
        { title: 'जलद क्रिया करा',                     desc: '+ Add Client बटणाने नवीन क्लायंट जोडा. + Add Property ने नवीन लिस्टिंग जोडा.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'सर्व ब्रोकरांच्या एकूण सक्रिय प्रॉपर्टी लिस्टिंग.' },
        { name: 'Your Clients',         desc: 'आपण वैयक्तिकरित्या जोडलेल्या क्लायंटची संख्या.' },
        { name: 'Appointments Today',   desc: 'आजसाठी निर्धारित बैठका किंवा साइट व्हिजिट.' },
        { name: 'Clients by Type',      desc: '4 प्रकारांमध्ये क्लायंटचे वर्गीकरण.' },
        { name: 'Properties by Status', desc: '6 स्थिती श्रेण्या.' },
        { name: "Today's Appointments", desc: 'आजच्या अपॉइंटमेंटची यादी.' },
        { name: 'Recent Activity',      desc: 'नवीनतम क्रियाकलापांचे थेट फीड.' },
      ],
      tips: [
        'काम सुरू करण्यापूर्वी दररोज सकाळी डॅशबोर्ड तपासा.',
        '+12% हिरवे निर्देशक मागील महिन्याच्या तुलनेत वाढ दर्शवतात.',
        'कोणत्याही कार्ड नंबरवर क्लिक करून त्या मॉड्यूलची यादी पाहा.',
        "Today's Appointments मधून दिवसाची तयारी करा.",
      ],
      mistakes: [
        'Recent Activity दुर्लक्ष करू नका – महत्त्वाची चौकशी असू शकते.',
        'Active Properties ची संख्या वैयक्तिक लिस्टिंग समजू नका.',
        'Appointments Today 0 दिसल्यास Appointments मॉड्यूलमध्ये जाऊन तपासा.',
      ],
    },
    gu: {
      module: 'ડૅશબૉર્ડ', subtitle: 'તમારા સમગ્ર વ્યવસાયનું દૈનિક નિયંત્રણ કેન્દ્ર',
      purpose: 'ડૅશબૉર્ડ તમને સમગ્ર રિયલ એસ્ટેટ વ્યવસાયનો ઝડપી અવલોકન આપે છે – પ્રૉપર્ટીઝ, ક્લાઇન્ટ્સ, અપૉઇન્ટમેન્ટ્સ અને તાજેતરની પ્રવૃત્તિ – બધું એક જ જગ્યાએ।',
      steps: [
        { title: 'ENFOR DATA માં લૉગ ઇન કરો',          desc: 'enfordata.com ખોલો અને ઇમેઇલ-પાસવર્ડ દાખલ કરો.' },
        { title: 'ઉપરનાં સારાંશ કાર્ડ વાંચો',         desc: '3 કાર્ડ: Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type તપાસો',              desc: 'Buyers, Sellers, Tenants, Owners ની સંખ્યા જુઓ.' },
        { title: 'Properties by Status તપાસો',         desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'આજનાં અપૉઇન્ટમેન્ટ જુઓ',           desc: 'ચાર્ટ નીચે આજના અપૉઇન્ટમેન્ટ – ક્લાઇન્ટ, હેતુ, સમય.' },
        { title: 'Recent Activity તપાસો',              desc: 'નવી ઇન્ક્વાયરી, અપૉઇન્ટમેન્ટ, ક્લાઇન્ટ ઉમેરવાની માહિતી.' },
        { title: 'ઝડપી ક્રિયા કરો',                   desc: '+ Add Client / + Add Property .' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'તમામ બ્રૉકર્સની સક્રિય પ્રૉપર્ટી લિસ્ટિંગ.' },
        { name: 'Your Clients',         desc: 'તમે ઉમેર્યા ક્લાઇન્ટ.' },
        { name: 'Appointments Today',   desc: 'આજ માટે નિર્ધારિત મિટિંગ/સાઇટ વિઝિટ.' },
        { name: 'Clients by Type',      desc: '4 પ્રકારોમાં ક્લાઇન્ટ.' },
        { name: 'Properties by Status', desc: '6 સ્ટૅટ્સ.' },
        { name: "Today's Appointments", desc: 'આજની અપૉઇન્ટમેન્ટ.' },
        { name: 'Recent Activity',      desc: 'તાજેતરની ક્રિયાઓ.' },
      ],
      tips: [
        'દરરોજ સવારે ડૅશબૉર્ડ તપાસો.',
        '+12% લીલા સંકેત વૃદ્ધિ દર્શાવે.',
        'કાર્ડ ક્લિક = તે મૉડ્યૂલ.',
        "Today's Appointments = દિવસ તૈયારી.",
      ],
      mistakes: [
        'Recent Activity અવગણશો નહીં.',
        'Active Properties = બધા બ્રૉકરની, ફક્ત તમારી નહીં.',
        'Appointments 0 = Appointments module ચેક.',
      ],
    },
    ta: {
      module: 'டாஷ்போர்டு', subtitle: 'உங்கள் வணிகத்தின் தினசரி கட்டுப்பாட்டு மையம்',
      purpose: 'டாஷ்போர்டு உங்கள் முழு ரியல் எஸ்டேட் வணிகத்தின் விரைவான கண்ணோட்டத்தை வழங்குகிறது.',
      steps: [
        { title: 'உள்நுழையவும்',              desc: 'enfordata.com திறந்து மின்னஞ்சல், கடவுச்சொல் உள்ளிடவும்.' },
        { title: 'சுருக்கக் கார்டுகள் படிக்கவும்', desc: 'Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type',           desc: 'Buyers, Sellers, Tenants, Owners எண்ணிக்கை.' },
        { title: 'Properties by Status',      desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'இன்றைய நியமனங்கள்',        desc: 'வாடிக்கையாளர் பெயர், நோக்கம், நேரம்.' },
        { title: 'Recent Activity',           desc: 'புதிய விசாரணைகள், நியமனங்கள், வாடிக்கையாளர் சேர்க்கை.' },
        { title: 'விரைவு செயல்கள்',           desc: '+ Add Client / + Add Property.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'அனைத்து தரகர்களின் சுறுசுறுப்பான பட்டியல்கள்.' },
        { name: 'Your Clients',         desc: 'நீங்கள் சேர்த்த வாடிக்கையாளர்கள்.' },
        { name: 'Appointments Today',   desc: 'இன்றைய சந்திப்புகள்.' },
        { name: 'Clients by Type',      desc: '4 வகைகள்.' },
        { name: 'Properties by Status', desc: '6 நில வகைகள்.' },
        { name: "Today's Appointments", desc: 'இன்றைய நியமன பட்டியல்.' },
        { name: 'Recent Activity',      desc: 'நேரடி ஊட்டம்.' },
      ],
      tips: [
        'தினமும் காலையில் டாஷ்போர்டு பார்க்கவும்.',
        '+12% வளர்ச்சி குறிகாட்டி.',
        'கார்டு எண்ணை கிளிக் = மொத்த பட்டியல்.',
        "Today's Appointments = தினசரி திட்டமிடல்.",
      ],
      mistakes: [
        'Recent Activity புறக்கணிக்காதீர்கள்.',
        'Active Properties = அனைத்து தரகர்களுடையது.',
        'Appointments 0 = Appointments module சரிபார்க்கவும்.',
      ],
    },
    te: {
      module: 'డాష్‌బోర్డ్', subtitle: 'మీ వ్యాపారం యొక్క రోజువారీ నియంత్రణ కేంద్రం',
      purpose: 'డాష్‌బోర్డ్ మీ మొత్తం రియల్ ఎస్టేట్ వ్యాపారానికి సంబంధించిన సత్వర అవలోకనాన్ని అందిస్తుంది.',
      steps: [
        { title: 'లాగిన్ అవ్వండి',                desc: 'enfordata.com తెరిచి ఇమెయిల్, పాస్‌వర్డ్ నమోదు చేయండి.' },
        { title: 'సారాంశ కార్డులు చదవండి',        desc: 'Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type తనిఖీ చేయండి',  desc: 'Buyers, Sellers, Tenants, Owners సంఖ్య.' },
        { title: 'Properties by Status తనిఖీ',    desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'నేటి అపాయింట్‌మెంట్లు',         desc: 'క్లయింట్ పేరు, ఉద్దేశ్యం, సమయం.' },
        { title: 'Recent Activity తనిఖీ',          desc: 'కొత్త విచారణలు, అపాయింట్‌మెంట్లు, క్లయింట్ చేరిక.' },
        { title: 'త్వరిత చర్యలు',                  desc: '+ Add Client / + Add Property.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'అన్ని బ్రోకర్ల క్రియాశీల లిస్టింగ్‌లు.' },
        { name: 'Your Clients',         desc: 'మీరు చేర్చిన క్లయింట్లు.' },
        { name: 'Appointments Today',   desc: 'నేటి మీటింగ్‌లు.' },
        { name: 'Clients by Type',      desc: '4 రకాల విభజన.' },
        { name: 'Properties by Status', desc: '6 స్థితి వర్గాలు.' },
        { name: "Today's Appointments", desc: 'నేటి జాబితా.' },
        { name: 'Recent Activity',      desc: 'లైవ్ ఫీడ్.' },
      ],
      tips: [
        'ప్రతి ఉదయం డాష్‌బోర్డ్ తనిఖీ చేయండి.',
        '+12% వృద్ధి సూచిక.',
        'కార్డ్ నొక్కి పూర్తి జాబితా చూడండి.',
        "Today's Appointments = రోజు ప్రణాళిక.",
      ],
      mistakes: [
        'Recent Activity నిర్లక్ష్యం చేయకండి.',
        'Active Properties = అన్ని బ్రోకర్లవి.',
        'Appointments 0 = Appointments module తనిఖీ.',
      ],
    },
    bn: {
      module: 'ড্যাশবোর্ড', subtitle: 'আপনার সমগ্র ব্যবসার দৈনিক নিয়ন্ত্রণ কেন্দ্র',
      purpose: 'ড্যাশবোর্ড আপনাকে আপনার পূর্ণ রিয়েল এস্টেট ব্যবসার একটি দ্রুত ওভারভিউ দেয়।',
      steps: [
        { title: 'লগ ইন করুন',                    desc: 'enfordata.com খুলুন এবং ইমেল ও পাসওয়ার্ড দিন।' },
        { title: 'সারসংক্ষেপ কার্ড পড়ুন',         desc: 'Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type পরীক্ষা করুন',  desc: 'Buyers, Sellers, Tenants, Owners সংখ্যা দেখুন।' },
        { title: 'Properties by Status',           desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'আজকের অ্যাপয়েন্টমেন্ট দেখুন',  desc: 'ক্লায়েন্টের নাম, উদ্দেশ্য এবং সময়।' },
        { title: 'Recent Activity পরীক্ষা করুন',  desc: 'নতুন অনুসন্ধান, অ্যাপয়েন্টমেন্ট, ক্লায়েন্ট যোগের তথ্য।' },
        { title: 'দ্রুত কার্যক্রম',               desc: '+ Add Client / + Add Property.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'সব ব্রোকারের সক্রিয় তালিকা।' },
        { name: 'Your Clients',         desc: 'আপনি যোগ করা ক্লায়েন্ট।' },
        { name: 'Appointments Today',   desc: 'আজকের নির্ধারিত মিটিং।' },
        { name: 'Clients by Type',      desc: '4 ধরনে বিভাজন।' },
        { name: 'Properties by Status', desc: '6টি স্ট্যাটাস বিভাগ।' },
        { name: "Today's Appointments", desc: 'আজকের তালিকা।' },
        { name: 'Recent Activity',      desc: 'লাইভ ফিড।' },
      ],
      tips: [
        'প্রতিদিন সকালে ড্যাশবোর্ড চেক করুন।',
        '+12% বৃদ্ধি সংকেত।',
        'কার্ড নম্বরে ক্লিক = সেই মডিউল।',
        "Today's Appointments = দিনের পরিকল্পনা।",
      ],
      mistakes: [
        'Recent Activity উপেক্ষা করবেন না।',
        'Active Properties = সব ব্রোকারের, শুধু আপনার নয়।',
        'Appointments 0 = Appointments module যান।',
      ],
    },
    kn: {
      module: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', subtitle: 'ನಿಮ್ಮ ಸಂಪೂರ್ಣ ವ್ಯವಹಾರದ ದೈನಂದಿನ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
      purpose: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನಿಮ್ಮ ಸಂಪೂರ್ಣ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ವ್ಯವಹಾರದ ತ್ವರಿತ ಅವಲೋಕನ ನೀಡುತ್ತದೆ.',
      steps: [
        { title: 'ಲಾಗಿನ್ ಆಗಿ',                    desc: 'enfordata.com ತೆರೆದು ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.' },
        { title: 'ಸಾರಾಂಶ ಕಾರ್ಡ್‌ಗಳು',              desc: 'Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type',               desc: 'Buyers, Sellers, Tenants, Owners ಸಂಖ್ಯೆ.' },
        { title: 'Properties by Status',          desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'ಇಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',     desc: 'ಗ್ರಾಹಕ ಹೆಸರು, ಉದ್ದೇಶ, ಸಮಯ.' },
        { title: 'Recent Activity',               desc: 'ಹೊಸ ಚೌಕಾಶಿ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್, ಗ್ರಾಹಕ ಸೇರಿಕೆ.' },
        { title: 'ತ್ವರಿತ ಕ್ರಿಯೆ',                 desc: '+ Add Client / + Add Property.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'ಎಲ್ಲ ಬ್ರೋಕರ್ ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು.' },
        { name: 'Your Clients',         desc: 'ನೀವು ಸೇರಿಸಿದ ಗ್ರಾಹಕರು.' },
        { name: 'Appointments Today',   desc: 'ಇಂದಿನ ನಿರ್ಧರಿತ ಸಭೆಗಳು.' },
        { name: 'Clients by Type',      desc: '4 ವಿಧ.' },
        { name: 'Properties by Status', desc: '6 ಸ್ಥಿತಿ ವರ್ಗ.' },
        { name: "Today's Appointments", desc: 'ಇಂದಿನ ಪಟ್ಟಿ.' },
        { name: 'Recent Activity',      desc: 'ಲೈವ್ ಫೀಡ್.' },
      ],
      tips: [
        'ಪ್ರತಿ ಬೆಳಿಗ್ಗೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪರಿಶೀಲಿಸಿ.',
        '+12% ವೃದ್ಧಿ ಸಂಕೇತ.',
        'ಕಾರ್ಡ್ ಕ್ಲಿಕ್ = ಮಾಡ್ಯೂಲ್ ಪಟ್ಟಿ.',
        "Today's Appointments = ದಿನ ಯೋಜನೆ.",
      ],
      mistakes: [
        'Recent Activity ನಿರ್ಲಕ್ಷಿಸಬೇಡಿ.',
        'Active Properties = ಎಲ್ಲ ಬ್ರೋಕರ್ ಪಟ್ಟಿ.',
        'Appointments 0 = Appointments module ಪರಿಶೀಲಿಸಿ.',
      ],
    },
    ml: {
      module: 'ഡാഷ്‌ബോർഡ്', subtitle: 'നിങ്ങളുടെ മൊത്തം ബിസിനസ്സിന്റെ ദൈനംദിന നിയന്ത്രണ കേന്ദ്രം',
      purpose: 'ഡാഷ്‌ബോർഡ് നിങ്ങളുടെ മൊത്തം റിയൽ എസ്‌റ്റേറ്റ് ബിസിനസ്സിന്റെ ദ്രുത അവലോകനം നൽകുന്നു.',
      steps: [
        { title: 'ലോഗിൻ ചെയ്യുക',               desc: 'enfordata.com തുറന്ന് ഇമെയിൽ, പാസ്‌വേഡ് നൽകുക.' },
        { title: 'സംഗ്രഹ കാർഡുകൾ',              desc: 'Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type',              desc: 'Buyers, Sellers, Tenants, Owners എണ്ണം.' },
        { title: 'Properties by Status',         desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'ഇന്നത്തെ അപ്പോയ്ന്റ്‌മെന്റുകൾ', desc: 'ക്ലൈന്റ് പേര്, ഉദ്ദേശ്യം, സമയം.' },
        { title: 'Recent Activity',              desc: 'പുതിയ അന്വേഷണങ്ങൾ, അപ്പോയ്ന്റ്‌മെന്റുകൾ.' },
        { title: 'ദ്രുത പ്രവർത്തനങ്ങൾ',          desc: '+ Add Client / + Add Property.' },
      ],
      fields: [
        { name: 'Active Properties',    desc: 'എല്ലാ ബ്രോക്കർമാരുടേയും ആകെ ലിസ്‌റ്റിങ്ങുകൾ.' },
        { name: 'Your Clients',         desc: 'നിങ്ങൾ ചേർത്ത ക്ലൈന്റുകൾ.' },
        { name: 'Appointments Today',   desc: 'ഇന്ന് നിശ്ചയിച്ച മീറ്റിങ്ങുകൾ.' },
        { name: 'Clients by Type',      desc: '4 തരം.' },
        { name: 'Properties by Status', desc: '6 സ്‌റ്റാറ്റസ്.' },
        { name: "Today's Appointments", desc: 'ഇന്നത്തെ ലിസ്‌റ്റ്.' },
        { name: 'Recent Activity',      desc: 'ലൈവ് ഫീഡ്.' },
      ],
      tips: [
        'ദിവസവും രാവിലെ ഡാഷ്‌ബോർഡ് പരിശോധിക്കുക.',
        '+12% വളർച്ച സൂചിക.',
        'കാർഡ് ക്ലിക്ക് = ആ മൊഡ്യൂൾ.',
        "Today's Appointments = ദിവസ ആസൂത്രണം.",
      ],
      mistakes: [
        'Recent Activity അവഗണിക്കരുത്.',
        'Active Properties = എല്ലാ ബ്രോക്കർമാരുടേതും.',
        'Appointments 0 = Appointments module പരിശോധിക്കുക.',
      ],
    },
    pa: {
      module: 'ਡੈਸ਼ਬੋਰਡ', subtitle: 'ਤੁਹਾਡੇ ਸਾਰੇ ਕਾਰੋਬਾਰ ਦਾ ਰੋਜ਼ਾਨਾ ਨਿਯੰਤਰਣ ਕੇਂਦਰ',
      purpose: 'ਡੈਸ਼ਬੋਰਡ ਤੁਹਾਨੂੰ ਤੁਹਾਡੇ ਪੂਰੇ ਰਿਯਲ ਅਸਟੇਟ ਕਾਰੋਬਾਰ ਦੀ ਤੇਜ਼ ਜਾਣਕਾਰੀ ਦਿੰਦਾ ਹੈ।',
      steps: [
        { title: 'ਲੌਗਿਨ ਕਰੋ',                   desc: 'enfordata.com ਖੋਲ੍ਹੋ ਅਤੇ ਈਮੇਲ ਅਤੇ ਪਾਸਵਰਡ ਦਾਖਲ ਕਰੋ।' },
        { title: 'ਸੰਖੇਪ ਕਾਰਡ ਪੜ੍ਹੋ',              desc: 'Active Properties, Your Clients, Appointments Today.' },
        { title: 'Clients by Type ਜਾਂਚੋ',        desc: 'Buyers, Sellers, Tenants, Owners ਦੀ ਗਿਣਤੀ।' },
        { title: 'Properties by Status ਜਾਂਚੋ',   desc: 'Available, Sold, Rented, Hold, Closed, Under Discussion.' },
        { title: 'ਅੱਜ ਦੀਆਂ ਮੁਲਾਕਾਤਾਂ',            desc: 'ਗਾਹਕ ਨਾਮ, ਮਕਸਦ ਅਤੇ ਸਮਾਂ।' },
        { title: 'Recent Activity ਜਾਂਚੋ',         desc: 'ਨਵੀਆਂ ਪੁੱਛਗਿੱਛਾਂ, ਮੁਲਾਕਾਤਾਂ, ਗਾਹਕ ਜੋੜਨ ਦੀ ਜਾਣਕਾਰੀ।' },
        { title: 'ਤੇਜ਼ ਕਾਰਵਾਈਆਂ',                  desc: '+ Add Client / + Add Property.' },
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
        'Recent Activity ਨੂੰ ਨਜ਼ਰਅੰਦਾਜ਼ ਨਾ ਕਰੋ।',
        'Active Properties ਨੂੰ ਆਪਣੀ ਨਿੱਜੀ ਸੂਚੀ ਨਾ ਸਮਝੋ।',
        'Appointments Today 0 ਦਿਖੇ ਤਾਂ Appointments ਮੌਡਿਊਲ ਵਿੱਚ ਜਾਂਚੋ।',
      ],
    },
  },

  // ── Properties ────────────────────────────────────────────────────────────
  properties: { en: {
    module: 'Properties',
    subtitle: 'List, manage and track all your property inventory',
    purpose: 'The Properties page is where you add and manage all your real estate listings – apartments, houses, plots, commercial spaces and more. You can track the status of each property, link it to a client, upload photos, and filter your inventory by type or status.',
    steps: [
      { title: 'Click "+ Add Property"',           desc: 'Click the blue "+ Add Property" button at the top right to open the property form.' },
      { title: 'Fill in the basic details',        desc: 'Enter the property title, select the type (Apartment, House, Plot, Commercial, etc.) and listing type (Sale or Rent). Enter the price and area.' },
      { title: 'Add location details',             desc: 'Fill in the full address, city, state, and a short location description (e.g. "Baner, Pune").' },
      { title: 'Write a description',              desc: 'Add a clear description of the property – key features, floor, facing direction, nearby landmarks.' },
      { title: 'Select amenities',                 desc: 'Tick all applicable amenities – parking, gym, lift, pool, security, etc.' },
      { title: 'Upload photos',                    desc: 'Upload clear, well-lit photos of the property. At least 3–5 photos help clients make faster decisions.' },
      { title: 'Link to a client (optional)',      desc: 'If this property belongs to an owner-client, select the client from the dropdown.' },
      { title: 'Save and manage status',           desc: 'After saving, you can update the property status to Available, Hold, Under Discussion, Sold, or Rented from the property card.' },
    ],
    fields: [
      { name: 'Title',          desc: 'Short identifying name for the property (e.g. "3BHK Flat in Wakad").' },
      { name: 'Type',           desc: 'Property category: Apartment, House, Commercial, Plot, Row House, Shop, PG, Bungalow.' },
      { name: 'Listing Type',   desc: 'Whether the property is for Sale or for Rent.' },
      { name: 'Price',          desc: 'Asking price (for sale) or monthly rent (for rent) in INR.' },
      { name: 'Area',           desc: 'Total area in sq ft or sq mt.' },
      { name: 'Bedrooms',       desc: 'Number of bedrooms (leave blank for commercial/plot).' },
      { name: 'Location',       desc: 'Short area name used in search and display (e.g. "Baner, Pune").' },
      { name: 'Status',         desc: 'Current stage: Available, Hold, Under Discussion, Sold, Rented, Closed.' },
      { name: 'Linked Client',  desc: 'The property owner or buyer client this property is associated with.' },
    ],
    tips: [
      'Always add at least 3 clear photos – listings with photos get far more enquiries.',
      'Use specific location names (colony/society name) so clients can find the property easily.',
      'Update the status immediately when a deal progresses – this keeps your pipeline accurate.',
      'Link properties to clients so you can track who owns or is interested in each property.',
    ],
    mistakes: [
      'Do not leave the description blank – a good description saves time on client calls.',
      'Do not forget to update status from "Available" once a deal is closed or on hold.',
      'Avoid duplicate listings for the same property – search before adding.',
    ],
  }},

  // ── Clients ───────────────────────────────────────────────────────────────
  clients: { en: {
    module: 'Clients',
    subtitle: 'Manage all your buyers, sellers, tenants and property owners',
    purpose: 'The Clients page lets you add and track every type of client in your real estate business – Buyers looking for properties, Sellers with properties to sell, Tenants looking to rent, and Property Owners listing for rent. Each client type has specific fields relevant to their needs.',
    steps: [
      { title: 'Click "+ Add Client"',             desc: 'Click the "+ Add Client" button to open the client form.' },
      { title: 'Select the client type',           desc: 'Choose Buyer, Seller, Tenant, or Property Owner. The form will show the relevant fields for that type.' },
      { title: 'Enter basic contact details',      desc: 'Fill in first name, last name, phone number. Email and location are optional but helpful for follow-up.' },
      { title: 'Fill in type-specific details',    desc: 'Buyers: enter budget range and preferred location. Sellers: property address and expected price. Tenants: deposit budget and preferred area. Owners: property address, rent amount, area.' },
      { title: 'Add notes (optional)',             desc: 'Use the Notes field to record any specific requirements, timeline, or follow-up reminders.' },
      { title: 'Save the client',                  desc: 'Click Save. The client appears in your list and can be linked to properties and appointments.' },
      { title: 'Edit or update status',            desc: 'Open any client card to edit details or change the status to Active, Converted (deal done), or Inactive.' },
    ],
    fields: [
      { name: 'Client Type',        desc: 'Buyer, Seller, Tenant, or Property Owner – determines which fields appear.' },
      { name: 'Name',               desc: 'First and last name of the client.' },
      { name: 'Phone',              desc: '10-digit mobile number. Digits only.' },
      { name: 'Email',              desc: 'Optional email address for sending property details.' },
      { name: 'Preferred Location', desc: 'Area or locality the client prefers (Buyers and Tenants).' },
      { name: 'Budget / Price',     desc: 'Buying budget range, expected sale price, or rent amount depending on client type.' },
      { name: 'Requirements',       desc: 'Free-text notes on what the client specifically needs.' },
      { name: 'Status',             desc: 'Active (pursuing), Converted (deal closed), or Inactive (not responding).' },
      { name: 'Notes',              desc: 'Internal notes visible only to you – follow-up dates, preferences, etc.' },
    ],
    tips: [
      'Always record the client type accurately – it affects which fields are shown and how they appear in appointment forms.',
      'Mark clients as "Converted" once a deal is done to keep your active list clean.',
      'Use the Notes field to record follow-up reminders like "Call back after 15 days".',
      'Filter clients by type to quickly see all buyers or all tenants at once.',
    ],
    mistakes: [
      'Do not add a client without their phone number – it is the primary contact identifier.',
      'Do not leave all optional fields blank for buyers – preferred location and budget help you match properties faster.',
      'Do not leave converted clients as "Active" – it clutters your active pipeline.',
    ],
  }},

  // ── Appointments ──────────────────────────────────────────────────────────
  appointments: { en: {
    module: 'Appointments',
    subtitle: 'Schedule and track all site visits, meetings and calls',
    purpose: 'The Appointments page lets you create, manage and track all scheduled interactions with clients – site visits to properties, in-person meetings, or phone calls. You can view appointments by date, filter by status, and update or reschedule from here.',
    steps: [
      { title: 'Click "+ Add Appointment"',        desc: 'Click the button at the top right to open the appointment form.' },
      { title: 'Select appointment type',          desc: 'Choose Site Visit (visit to a property), Meeting (in-person discussion), or Call (phone conversation).' },
      { title: 'Enter a title',                    desc: 'Write a clear title that describes the appointment (e.g. "Site Visit for 3BHK in Baner"). Minimum 5 characters.' },
      { title: 'Set date and time',                desc: 'Select the appointment date and time. For new appointments, past dates are not allowed.' },
      { title: 'Select the client',                desc: 'Choose the client from the dropdown. Their type (Buyer, Seller etc.) is shown for reference.' },
      { title: 'Link a property (optional)',       desc: 'For site visits, link the property from the dropdown so it is recorded on the appointment.' },
      { title: 'Save and track',                   desc: 'Save the appointment. It will appear on the Dashboard and in the List and Calendar views.' },
      { title: 'Edit or reschedule',               desc: 'Click "View" on any appointment card, then click "Edit / Reschedule" to change the date, time, or status (Scheduled, Completed, Cancelled).' },
    ],
    fields: [
      { name: 'Type',        desc: 'Site Visit, Meeting, or Call – categorises the appointment.' },
      { name: 'Title',       desc: 'Short description of the appointment purpose.' },
      { name: 'Date',        desc: 'Date of the appointment in YYYY-MM-DD format.' },
      { name: 'Time',        desc: 'Time of the appointment (24-hour format).' },
      { name: 'Client',      desc: 'The client this appointment is with. Required.' },
      { name: 'Property',    desc: 'Optional property linked to this appointment (for site visits).' },
      { name: 'Status',      desc: 'Scheduled (upcoming), Completed (done), or Cancelled.' },
      { name: 'Description', desc: 'Optional notes about the appointment – directions, agenda, etc.' },
    ],
    tips: [
      'Use the Calendar view to get a visual overview of your week and spot scheduling conflicts.',
      'Mark appointments as "Completed" after the visit so your completed count stays accurate.',
      'Link the property to site visits – it helps you remember which property the appointment was for.',
      'Use the Dashboard view to see today\'s appointments at a glance each morning.',
    ],
    mistakes: [
      'Do not create appointments without a client – every appointment must be linked to someone.',
      'Do not forget to update the status after the appointment – leaving it as "Scheduled" distorts your stats.',
      'Do not book appointments in the past when creating – use reschedule instead.',
    ],
  }},

  // ── Building Data ─────────────────────────────────────────────────────────
  'building-data': { en: {
    module: 'Building Data',
    subtitle: 'Maintain detailed profiles of buildings and societies',
    purpose: 'Building Data lets you store comprehensive information about residential and commercial buildings – society or complex name, contact persons, floors, total units, amenities, and photos. This helps you quickly share accurate building-level details with potential buyers or tenants without needing to call the builder every time.',
    steps: [
      { title: 'Click "+ Add Building"',           desc: 'Open the Building Data page and click the button to add a new building entry.' },
      { title: 'Enter the building name',          desc: 'Enter the full name of the building or society (e.g. "Prestige Park Grove").' },
      { title: 'Fill location details',            desc: 'Enter the address, city, and state of the building.' },
      { title: 'Add building specifications',      desc: 'Enter total floors, total units, year of construction, possession status, and building type (Residential, Commercial, Mixed).' },
      { title: 'Add contact information',          desc: 'Add the developer/builder name, contact person name, mobile number, and email. This is your go-to contact for this building.' },
      { title: 'Select amenities',                 desc: 'Tick all amenities available in the building – parking, gym, pool, clubhouse, etc.' },
      { title: 'Upload building photos',           desc: 'Upload exterior and amenity photos. Good photos help you showcase the building to clients without visiting every time.' },
      { title: 'Save and use in Properties',       desc: 'Once saved, you can reference this building when adding property listings.' },
    ],
    fields: [
      { name: 'Building Name',      desc: 'Full official name of the building or society.' },
      { name: 'Type',               desc: 'Residential, Commercial, or Mixed-use.' },
      { name: 'Total Floors',       desc: 'Number of floors in the building.' },
      { name: 'Total Units',        desc: 'Total number of apartments or units.' },
      { name: 'Year Built',         desc: 'Year of construction or completion.' },
      { name: 'Contact Person',     desc: 'Name and mobile of the builder or society manager to contact for details.' },
      { name: 'Amenities',          desc: 'All available facilities in the building complex.' },
      { name: 'Status',             desc: 'Under Construction, Ready to Move, or Completed.' },
    ],
    tips: [
      'Add buildings as soon as you start working in a new area – it saves time on every future listing.',
      'Keep the contact person\'s number updated – this is the person you call when a buyer needs details.',
      'Upload photos once and reuse across multiple property listings from the same building.',
      'Use the notes or description field to record important details like "parking is paid" or "society maintenance is Rs 3000/month".',
    ],
    mistakes: [
      'Do not create duplicate building entries – search first before adding a new one.',
      'Do not leave the contact number blank – it defeats the purpose of the building record.',
      'Do not confuse Building Data with Properties – a building is the complex, properties are the individual units inside it.',
    ],
  }},

  // ── SMS Marketing ─────────────────────────────────────────────────────────
  'sms-marketing': { en: {
    module: 'SMS Marketing',
    subtitle: 'Send targeted SMS messages to your clients and leads',
    purpose: 'The SMS Marketing page lets you send bulk or individual SMS messages to your clients directly from ENFOR DATA. Use it to share new property listings, appointment reminders, festive greetings, or any important updates – without switching to a separate SMS tool.',
    steps: [
      { title: 'Go to SMS Marketing',              desc: 'Click "SMS Marketing" in the left sidebar to open this page.' },
      { title: 'Check your SMS balance',           desc: 'Your remaining SMS credits are shown at the top. Make sure you have sufficient credits before sending.' },
      { title: 'Choose recipients',                desc: 'Select individual clients from your list or use filters (by client type, city, etc.) to bulk-select a group.' },
      { title: 'Compose the message',              desc: 'Type your message in the text box. Keep it under 160 characters for a single SMS. Use templates for faster sending.' },
      { title: 'Use a template (optional)',        desc: 'Click "Templates" to use a pre-saved message template – useful for recurring messages like new listing alerts.' },
      { title: 'Preview and send',                 desc: 'Review the recipient count and the message text. Click "Send" to dispatch the SMS.' },
      { title: 'Check delivery analytics',         desc: 'After sending, view the Analytics tab to see how many messages were delivered, failed, or pending.' },
    ],
    fields: [
      { name: 'Recipients',      desc: 'Selected clients who will receive the SMS.' },
      { name: 'Message',         desc: 'The text of your SMS – plain text, max 160 characters per SMS.' },
      { name: 'Template',        desc: 'Pre-saved message formats for common use cases.' },
      { name: 'SMS Balance',     desc: 'Number of SMS messages remaining in your account.' },
      { name: 'Delivery Status', desc: 'Sent, Delivered, Failed – tracked per campaign.' },
    ],
    tips: [
      'Send property alerts to Buyers filtered by their preferred location for better response rates.',
      'Use templates for consistent, professional messaging – create templates for new listings, appointments, and greetings.',
      'Keep messages short and clear – include the property type, location, price, and your name/number.',
      'Recharge SMS credits before a bulk campaign so it is not interrupted.',
    ],
    mistakes: [
      'Do not send bulk SMS without filtering by client type – irrelevant messages lead to opt-outs.',
      'Do not exceed 160 characters without checking – longer messages count as 2 SMS and use double credits.',
      'Do not send messages without checking your SMS balance first.',
    ],
  }},

  // ── Broker Network ────────────────────────────────────────────────────────
  network: { en: {
    module: 'Broker Network',
    subtitle: 'Connect with other brokers to co-broke and share leads',
    purpose: 'The Broker Network page lets you discover and connect with other real estate brokers on the ENFOR DATA platform. Building a network helps you share listings, co-broke deals (split commissions), refer clients you cannot serve, and get referrals from brokers in other cities.',
    steps: [
      { title: 'Open Broker Network',              desc: 'Click "Broker Network" in the sidebar to see all brokers on the platform.' },
      { title: 'Browse or search brokers',         desc: 'Browse the list of brokers or use the search bar to find brokers by name or city.' },
      { title: 'View broker profile',              desc: 'Click on any broker card to see their area of specialisation, city, experience, and contact details.' },
      { title: 'Send a connection request',        desc: 'Click "Connect" on a broker\'s profile to send them a connection request.' },
      { title: 'Manage requests',                  desc: 'Switch to the "Requests" tab to see pending incoming and outgoing connection requests. Accept or decline.' },
      { title: 'Add an external broker',           desc: 'Use the "+ Add External Broker" option to manually add a broker who is not on the platform – store their name, phone, and area.' },
      { title: 'Use the network for co-broking',  desc: 'Once connected, you can mention the broker when closing a deal and split the commission details in the agreement.' },
    ],
    fields: [
      { name: 'Broker Name',         desc: 'Full name of the broker.' },
      { name: 'City / State',        desc: 'Where the broker operates.' },
      { name: 'Specialisation',      desc: 'Property types or areas the broker focuses on.' },
      { name: 'Connection Status',   desc: 'Connected, Pending (request sent), or Not Connected.' },
      { name: 'Mobile Number',       desc: 'Contact number for the broker (external brokers).' },
    ],
    tips: [
      'Connect with brokers in areas where you get enquiries but do not have inventory – they can share listings with you.',
      'Co-broking deals expand your reach – share a client lead with a specialist broker for a commission split.',
      'Use "Add External Broker" to keep track of brokers you work with who are not yet on the platform.',
      'Keep your own profile updated – other brokers will see your city and specialisation.',
    ],
    mistakes: [
      'Do not connect with every broker indiscriminately – focus on brokers in your target areas.',
      'Do not share confidential client details before a co-broke agreement is in place.',
      'Do not ignore incoming connection requests – review them regularly to grow your network.',
    ],
  }},

  // ── Channel Partners ──────────────────────────────────────────────────────
  'channel-partners': { en: {
    module: 'Channel Partners',
    subtitle: 'Manage relationships with your channel partner network',
    purpose: 'The Channel Partners page lets you view and manage all channel partners (CPs) connected to you. As a broker, CPs bring you buyers and tenants in exchange for a referral commission. This page shows which CPs are following you and what projects or leads they are associated with.',
    steps: [
      { title: 'Open Channel Partners',            desc: 'Click "Channel Partners" in the sidebar to see your connected CPs.' },
      { title: 'View your CP list',                desc: 'See all channel partners who follow you or are connected to you, with their contact details and status.' },
      { title: 'Click on a CP to see details',     desc: 'View the CP\'s name, city, firm, and which leads or projects they are associated with.' },
      { title: 'Track referral activity',          desc: 'See how many leads or buyers the CP has referred and what their current status is.' },
      { title: 'Contact the CP',                   desc: 'Use the contact number or WhatsApp shown on the CP card to reach them directly.' },
    ],
    fields: [
      { name: 'CP Name',          desc: 'Full name of the channel partner.' },
      { name: 'Firm Name',        desc: 'The company or firm the CP operates under.' },
      { name: 'City',             desc: 'City where the CP is based.' },
      { name: 'Phone',            desc: 'Mobile number of the channel partner.' },
      { name: 'Status',           desc: 'Active or Inactive – whether the CP is currently referring business.' },
    ],
    tips: [
      'Share new project listings and availability with active CPs so they can bring buyers.',
      'Keep in regular contact with your top CPs – a quick weekly update call goes a long way.',
      'When a CP refers a buyer who closes a deal, update the agreement to credit the referral properly.',
    ],
    mistakes: [
      'Do not ignore CP follow-ups – slow response makes CPs work with other brokers.',
      'Do not confuse the Channel Partners list with your Broker Network – CPs bring clients; brokers share listings.',
    ],
  }},

  // ── New Projects ──────────────────────────────────────────────────────────
  projects: { en: {
    module: 'New Projects',
    subtitle: 'Showcase and track new residential and commercial projects',
    purpose: 'The New Projects page is used to list and manage new developer projects – upcoming or under-construction residential complexes, commercial parks, plotted developments, etc. As a broker or channel partner, you can add projects you are associated with, upload brochures, track unit availability, and share project details with interested buyers.',
    steps: [
      { title: 'Click "+ Add Project"',            desc: 'Click the button to open the project creation form.' },
      { title: 'Enter project details',            desc: 'Fill in the project name, builder name, project type (Residential / Commercial / Mixed), and a description.' },
      { title: 'Set location',                     desc: 'Add the project address, city, and state.' },
      { title: 'Enter unit and pricing info',      desc: 'Set total units, available units, price range minimum, and price range maximum.' },
      { title: 'Set launch and possession dates',  desc: 'Enter the launch date (when the project was launched) and the possession date (when buyers can move in).' },
      { title: 'Add amenities',                    desc: 'Select all amenities offered by the project – gym, pool, clubhouse, security, etc.' },
      { title: 'Upload a brochure',                desc: 'Add a brochure URL or PDF link so interested buyers can download it directly.' },
      { title: 'Set project status',               desc: 'Mark as Upcoming, Launched, Under Construction, Ready, or Sold Out.' },
    ],
    fields: [
      { name: 'Project Name',      desc: 'Official name of the project (e.g. "Lodha Palava City").' },
      { name: 'Builder Name',      desc: 'Developer or builder who is constructing the project.' },
      { name: 'Project Type',      desc: 'Residential, Commercial, or Mixed use.' },
      { name: 'Total Units',       desc: 'Total number of units in the project.' },
      { name: 'Available Units',   desc: 'Units still available for sale at the time of listing.' },
      { name: 'Price Range',       desc: 'Minimum and maximum price of units in the project.' },
      { name: 'Launch Date',       desc: 'When the project was officially launched.' },
      { name: 'Possession Date',   desc: 'Expected date when buyers receive possession of their units.' },
      { name: 'Status',            desc: 'Upcoming, Launched, Under Construction, Ready, or Sold Out.' },
      { name: 'Brochure URL',      desc: 'Link to the project brochure or floor plan PDF.' },
    ],
    tips: [
      'Keep the available units count updated – buyers rely on this to know if the project still has inventory.',
      'Upload the brochure PDF link so CPs and buyers can access it directly from the project card.',
      'Use the description field to highlight the project\'s USPs – location advantages, floor plans, nearby infrastructure.',
      'Change status to "Sold Out" when all units are booked so CPs stop referring buyers for it.',
    ],
    mistakes: [
      'Do not add a project without the possession date – this is often the first question buyers ask.',
      'Do not leave available units at the original count after selling – update it regularly.',
      'Do not confuse Projects with Properties – Projects are new builder inventory; Properties are individual resale or rental units.',
    ],
  }},

  // ── Agreements ────────────────────────────────────────────────────────────
  agreements: { en: {
    module: 'Agreements',
    subtitle: 'Track and manage all your rental and sale agreements',
    purpose: 'The Agreements page is used to record and monitor all property agreements you manage – rental agreements (leave and license), sale agreements, or any other formal property transaction document. You can track start dates, end dates, and get alerts when an agreement is about to expire.',
    steps: [
      { title: 'Click "+ Add Agreement"',          desc: 'Click the button to open the agreement form.' },
      { title: 'Link to a property',               desc: 'Select the property this agreement is for from the dropdown. The property must already be added in the Properties section.' },
      { title: 'Link to a client (optional)',      desc: 'Select the tenant or buyer this agreement is with from the Clients list.' },
      { title: 'Set start and end dates',          desc: 'Enter when the agreement starts and when it ends. For an 11-month rental agreement, set accordingly.' },
      { title: 'Save the agreement',               desc: 'Click Save. The agreement will appear in your list with its status (Active, Expired, or Terminated).' },
      { title: 'Track renewals',                   desc: 'When an agreement is about to expire, the status changes and you receive a reminder. Renew by editing the end date.' },
    ],
    fields: [
      { name: 'Property',      desc: 'The property this agreement covers.' },
      { name: 'Client',        desc: 'The tenant or buyer party to this agreement.' },
      { name: 'Start Date',    desc: 'Date when the agreement comes into effect.' },
      { name: 'End Date',      desc: 'Date when the agreement expires or the lease term ends.' },
      { name: 'Status',        desc: 'Active (currently valid), Expired (past end date), or Terminated (ended early).' },
    ],
    tips: [
      'Add rental agreements as soon as they are signed so you always have the expiry date tracked.',
      'Check the Agreements list one month before the end date to start renewal conversations with tenants.',
      'Use the client link to quickly pull up the tenant\'s contact when an agreement expires.',
      'Mark agreements as "Terminated" if the tenant vacates early – do not wait for the expiry date.',
    ],
    mistakes: [
      'Do not add an agreement without an end date – it cannot be tracked for renewal without one.',
      'Do not leave expired agreements as "Active" – update them regularly to keep your list accurate.',
      'Do not forget to link the correct client – the agreement is meaningless without knowing who it is with.',
    ],
  }},

  // ── Business Posts ────────────────────────────────────────────────────────
  'business-posts': { en: {
    module: 'Business Posts',
    subtitle: 'Marketplace for office furniture, vendors, and staff listings',
    purpose: 'Business Posts is a marketplace within ENFOR DATA for real estate professionals to buy, sell, or find services related to the property business – office furniture, house furniture, vendors (interior designers, packers and movers, contractors), and staff requirements. Post what you have to offer or what you are looking for.',
    steps: [
      { title: 'Click "+ Create Post"',            desc: 'Click the button to open the post creation wizard.' },
      { title: 'Select a category',                desc: 'Choose from: Office Furniture, House Furniture, Vendor Services, or Staff. Each category has sub-types.' },
      { title: 'Choose the sub-type',              desc: 'For furniture: Sale, Rent, or Requirement. For vendors: select the service type (Interior, Movers, etc.). For staff: vacancy or available.' },
      { title: 'Enter post details',               desc: 'Add a title, detailed description, price (if applicable), and your location.' },
      { title: 'Add contact information',          desc: 'Enter your name, phone, email, and WhatsApp number so interested people can reach you.' },
      { title: 'Upload photos',                    desc: 'Upload clear photos of the item or service being offered. More photos = faster response.' },
      { title: 'Publish the post',                 desc: 'Review and publish. Your post will be visible to all brokers and CPs on the platform.' },
      { title: 'Manage your posts',                desc: 'Go to "My Posts" to edit, close, or delete your existing posts.' },
    ],
    fields: [
      { name: 'Category',      desc: 'Office Furniture, House Furniture, Vendor, or Staff.' },
      { name: 'Sub-category',  desc: 'More specific classification within the category.' },
      { name: 'Title',         desc: 'Clear headline for your post (e.g. "4-Seater Office Sofa Set for Sale").' },
      { name: 'Description',   desc: 'Detailed information about the item/service – condition, specs, dimensions, etc.' },
      { name: 'Price',         desc: 'Asking price. Leave blank or mark as "Negotiable" if flexible.' },
      { name: 'Location',      desc: 'City or area where the item/service is available.' },
      { name: 'Contact Info',  desc: 'Your phone, email, and WhatsApp for interested parties to reach you.' },
      { name: 'Status',        desc: 'Active (still available), Sold/Closed (no longer available).' },
    ],
    tips: [
      'Upload at least 3–5 photos for furniture posts – buyers want to see the condition before contacting.',
      'Set a realistic price – posts with prices get more genuine enquiries than "price on request" listings.',
      'Close your post as soon as the item is sold or the position is filled – avoids time-wasting contacts.',
      'For vendor posts, mention your area of service coverage and typical turnaround time.',
    ],
    mistakes: [
      'Do not post without contact information – buyers cannot reach you without it.',
      'Do not leave old, sold or closed posts as "Active" – keep the marketplace clean.',
      'Do not post in the wrong category – a staff requirement in furniture confuses viewers.',
    ],
  }},

  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: { en: {
    module: 'Staff',
    subtitle: 'Manage your office staff and their contact details',
    purpose: 'The Staff page lets you add and manage your team members – assistants, telecallers, site coordinators, or any other office staff. You can store their contact details, designation, and relevant notes. This keeps your team directory organised in one place.',
    steps: [
      { title: 'Click "+ Add Staff"',              desc: 'Click the button to open the staff form.' },
      { title: 'Enter name and designation',       desc: 'Add the staff member\'s first name, last name, and their role or designation (e.g. "Telecaller", "Field Agent", "Admin").' },
      { title: 'Add contact details',             desc: 'Enter the phone number (digits only) and email address. WhatsApp number can be added if different from phone.' },
      { title: 'Set the join date',               desc: 'Enter when this person joined your team.' },
      { title: 'Add notes (optional)',             desc: 'Use notes to record responsibilities, areas handled, or any relevant internal information.' },
      { title: 'Save the staff record',           desc: 'Click Save. The staff member appears in your team list and can be contacted from here.' },
      { title: 'Edit or deactivate',              desc: 'Click the edit button on a staff card to update details, or mark a staff member as inactive when they leave.' },
    ],
    fields: [
      { name: 'First / Last Name', desc: 'Full name of the staff member.' },
      { name: 'Designation',       desc: 'Role or job title (e.g. Telecaller, Field Agent, Coordinator).' },
      { name: 'Phone',             desc: '10-digit phone number – digits only.' },
      { name: 'Email',             desc: 'Email address for communication.' },
      { name: 'WhatsApp',          desc: 'WhatsApp number if different from the main phone.' },
      { name: 'Join Date',         desc: 'Date when this person joined your team.' },
      { name: 'Notes',             desc: 'Internal notes about responsibilities or area coverage.' },
    ],
    tips: [
      'Keep all team contacts in Staff so you have a central directory – no need to search your phone.',
      'Use the designation field consistently ("Telecaller", "Field Agent") so you can quickly identify roles.',
      'Add notes about which areas or property types each staff member handles.',
      'Mark staff as inactive when they leave instead of deleting – this preserves historical records.',
    ],
    mistakes: [
      'Do not skip the designation – it helps you identify roles at a glance.',
      'Do not add staff members as "clients" – use the Staff section for internal team members.',
      'Do not forget to update records when a staff member changes their phone number.',
    ],
  }},

  // ── Profile ───────────────────────────────────────────────────────────────
  profile: { en: {
    module: 'My Profile',
    subtitle: 'Manage your professional identity on ENFOR DATA',
    purpose: 'Your Profile is how other brokers, channel partners, and clients on the platform see you. It contains your professional details – name, firm, city, experience, specialisations, and a profile photo. Keeping it complete and updated builds trust and makes it easier for others to connect with you.',
    steps: [
      { title: 'Go to Profile',                    desc: 'Click your name or avatar in the top right, then click "View Profile".' },
      { title: 'Click "Edit Profile"',             desc: 'Click the Edit button to enter editing mode.' },
      { title: 'Update basic information',         desc: 'Review and update your first name, last name, firm name, phone number, and WhatsApp number.' },
      { title: 'Add your photo',                   desc: 'Upload a clear, professional profile photo. This builds trust with clients and other brokers.' },
      { title: 'Update your location',             desc: 'Keep your city and state accurate – this is how brokers in your area find you.' },
      { title: 'Add bio and specialisations',      desc: 'Write a short professional bio (2–3 sentences). Add the property types or localities you specialise in.' },
      { title: 'Set years of experience',          desc: 'Enter how many years you have been in real estate.' },
      { title: 'Save changes',                     desc: 'Click Save to update your profile. Changes are reflected immediately.' },
    ],
    fields: [
      { name: 'Name',            desc: 'Your first and last name as shown to other users.' },
      { name: 'Firm Name',       desc: 'Your real estate firm or company name.' },
      { name: 'Phone',           desc: 'Your primary contact number.' },
      { name: 'WhatsApp',        desc: 'WhatsApp number (if different from phone).' },
      { name: 'City / State',    desc: 'Your operating location – used in broker searches.' },
      { name: 'Bio',             desc: 'A short description of your expertise and background.' },
      { name: 'Specialisations', desc: 'Property types or areas you focus on (e.g. "Luxury Residential, Pune West").' },
      { name: 'Experience',      desc: 'Years of experience in real estate.' },
      { name: 'Profile Photo',   desc: 'Your professional photo shown on your profile and broker card.' },
    ],
    tips: [
      'A complete profile with a photo gets significantly more connection requests from other brokers.',
      'Keep your phone and WhatsApp numbers updated – these are used for direct contact.',
      'Mention specific localities in specialisations (e.g. "Baner, Balewadi, Wakad") rather than just "Pune".',
      'Update your deals completed count regularly – it signals credibility to new connections.',
    ],
    mistakes: [
      'Do not leave your bio blank – even 2 sentences about your experience make a difference.',
      'Do not use a group photo as your profile picture – use a clear individual photo.',
      'Do not leave your specialisations empty – other brokers use this to decide whether to connect with you.',
    ],
  }},

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: { en: {
    module: 'Settings',
    subtitle: 'Configure your account preferences and security',
    purpose: 'The Settings page lets you manage your account security and notification preferences. You can change your password, manage how you receive alerts, and configure other account-level options.',
    steps: [
      { title: 'Open Settings',                    desc: 'Click the Settings option from your profile menu or the sidebar.' },
      { title: 'Change your password',             desc: 'Enter your current password, then your new password (twice to confirm). Click Save to update.' },
      { title: 'Notification preferences',         desc: 'Turn on or off email and in-app notifications for appointments, new inquiries, agreement renewals, etc.' },
      { title: 'Review account details',           desc: 'Check your registered email and other account details. Contact support if your email needs to be changed.' },
      { title: 'Subscription details',             desc: 'View your current plan from Settings or from the "My Subscription" section in the sidebar.' },
    ],
    fields: [
      { name: 'Current Password',    desc: 'Your existing account password – required to set a new one.' },
      { name: 'New Password',        desc: 'Your new password. Must meet minimum security requirements.' },
      { name: 'Confirm Password',    desc: 'Re-enter new password to confirm it matches.' },
      { name: 'Notifications',       desc: 'Toggle on/off specific notification types – appointments, alerts, reminders.' },
    ],
    tips: [
      'Change your password every 3–6 months for better account security.',
      'Enable appointment notifications so you never miss a scheduled meeting alert.',
      'Use a strong password with a mix of letters, numbers, and symbols.',
    ],
    mistakes: [
      'Do not share your password with staff – each user should have their own login credentials.',
      'Do not turn off all notifications – at minimum keep appointment reminders enabled.',
      'Do not use the same password as your email or banking accounts.',
    ],
  }},

  // ── Subscription ──────────────────────────────────────────────────────────
  subscription: { en: {
    module: 'My Subscription',
    subtitle: 'View your plan, usage, and billing details',
    purpose: 'The Subscription page shows your current ENFOR DATA plan, its validity period, included features, and usage limits (such as SMS credits). You can upgrade your plan, view billing history, or renew from this page.',
    steps: [
      { title: 'Open My Subscription',             desc: 'Click "My Subscription" in the sidebar.' },
      { title: 'Check your plan',                  desc: 'See your current plan name, validity start and end dates, and included features.' },
      { title: 'Check SMS credits',                desc: 'View remaining SMS credits. Top up from the SMS tab if running low.' },
      { title: 'Upgrade or renew',                 desc: 'Click "Upgrade Plan" or "Renew" to extend or switch to a higher plan with more features.' },
      { title: 'View billing history',             desc: 'See a list of past payments and invoices for your records.' },
    ],
    fields: [
      { name: 'Plan Name',       desc: 'Your current subscription tier (e.g. Starter, Professional, Enterprise).' },
      { name: 'Valid Until',     desc: 'The date your current plan expires.' },
      { name: 'SMS Credits',     desc: 'Remaining SMS messages you can send this billing period.' },
      { name: 'Features',        desc: 'List of features included in your current plan.' },
    ],
    tips: [
      'Renew at least a week before expiry so you do not lose access to your data.',
      'Monitor SMS credit usage mid-month and top up before running out to avoid campaign interruptions.',
      'Upgrade to a higher plan if you consistently hit feature or usage limits.',
    ],
    mistakes: [
      'Do not wait until your plan expires to renew – you may lose access to the platform.',
      'Do not ignore the subscription expiry date – set a reminder a week before.',
    ],
  }},
};
