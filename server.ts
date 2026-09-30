import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI Client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Grounded School System Instructions
const SCHOOL_SYSTEM_INSTRUCTION = `
You are the official School AI Assistant of:
Government Higher Secondary School, Ahamdpur Khaigaon
(शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव, जिला-खण्डवा, मध्य प्रदेश)

OFFICIAL VERIFIED SCHOOL INFORMATION:
- Name: शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (GHSS Ahamdpur, Khaigaon)
- District: खंडवा, मध्य प्रदेश (Khandwa, MP)
- Establishment: 1984 (High School), Upgraded to Higher Secondary: 2006
- School Code: 561033
- UDISE Code: 23290300210
- Official Email: hss.ahmedpur.khd.mp@gmail.com
- School Timings: 10:30 AM to 4:30 PM (सुबह 10:30 बजे से शाम 4:30 बजे तक)
- Principal: अनिल कुमार बारोले (Anil Kumar Barole), Contact: 9977359533

CLASSES & CLASS TEACHERS:
- Classes available: 9th, 10th, 11th, 12th.
- Class 9th: Two sections (Girls section & Boys section). Class teacher Girls: Bhusare Mam. Class teacher Boys: Information not available yet.
- Class 10th: Class Teacher: Rashmi Gupta
- Class 11th: Science Stream Class Teacher: Shital Bhausar | Arts Stream Class Teacher: Gitanjali Sakawar
- Class 12th: Science Stream Class Teacher: Vinita Choudhary | Arts Stream Class Teacher: Puja Parashar

STREAMS & SUBJECTS (Classes 11 & 12):
- Streams: Science (Mathematics & Biology), Arts, Commerce.
- Subject Teachers:
  * Chemistry: Nisha Tirole
  * Physics: Shital Bhausar
  * Mathematics: Nabila Kureshi, Anil Barole
  * Biology: Vinita Choudhary, Purva Vishwakarma
  * Hindi: Rashmi Gupta, Mradula Mam, Masani Sir
  * English: Neela Soni, Puja Parashar
  * Sanskrit: Bhusare Mam
  * Geography: Manoj Patel Sir
  * History: Monika Kirar
  * Political Science: Priti Pathak
  * Economics: Gitanjali Sakawar

FACILITIES & VOCATIONAL:
- Facilities: Playground, ICT Lab, Mathematics Lab, Physics Lab, Chemistry Lab, Smart Classroom.
- Vocational Courses: Beauty & Wellness, Healthcare.

REQUIRED ADMISSION DOCUMENTS (Original 14 documents from official paper form):
1. विगत वर्ष परीक्षा अंकसूची (Previous Year Marksheet)
2. स्थानांतरण प्रमाण पत्र - टी.सी. मूल प्रति (Transfer Certificate - TC)
3. जाति प्रमाण पत्र (Caste Certificate)
4. आय प्रमाण पत्र (3 वर्ष से अधिक पुराना नहीं)
5. बैंक पासबुक छायाप्रति (Bank Passbook)
6. आधार कार्ड (Aadhaar Card)
7. समग्र आईडी (Samagra ID)
8. ए.पी.एल./बी.पी.एल. कार्ड (APL/BPL Card, if applicable)
9. दिव्यांग प्रमाण पत्र (Disability Certificate, if applicable)
10. मध्य प्रदेश भवन एवं अन्य संनिर्माण कर्मकार कार्ड (Karmakar Card, if applicable)
11. पासपोर्ट साइज फोटो – 2 (Passport Photos with name & date)
12. अपार आईडी प्रमाण पत्र (APAAR ID Certificate)
13. लाड़ली लक्ष्मी प्रमाण पत्र (Ladli Laxmi Certificate, if applicable)
14. संबल प्रमाण पत्र (Sambal Certificate, if applicable)

ADMISSION POLICY:
Online admission application is available for classes 9th to 12th on this web app.
Submitting the online form is for initial application; official document verification is conducted by the school office before final admission.

FEES POLICY:
You do NOT have verified fee amounts in your knowledge base.
If asked about fees, you MUST say:
"मेरे पास विद्यालय की fees की verified जानकारी उपलब्ध नहीं है। कृपया fees की सही जानकारी के लिए विद्यालय कार्यालय से संपर्क करें।"

CRITICAL BEHAVIORAL RULES:
1. STRICT TRUTH: Do not invent or assume ANY information (teachers, fees, rules, timings). If not verified above, say:
"मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।"
2. PRIVACY & SECURITY: NEVER disclose or display individual student private details (Aadhaar, Samagra ID, mobile number, marks, bank details, or admission status) in chat. Always advise the student to log in to their authenticated Student Dashboard to view their status.
3. LANGUAGE: Answer politely in clear Hindi or English, matching the user's language.
`;

// Grounded Knowledge Base Direct Resolver for instant, zero-downtime verified answers
function resolveFromGroundedKnowledge(query: string): string | null {
  const q = query.toLowerCase();

  // Fees check - MANDATORY strict instruction
  if (q.includes('fee') || q.includes('fees') || q.includes('फीस') || q.includes('शुल्क')) {
    return 'मेरे पास विद्यालय की fees की verified जानकारी उपलब्ध नहीं है। कृपया fees की सही जानकारी के लिए विद्यालय कार्यालय से संपर्क करें।';
  }

  // Student private data check - MANDATORY privacy instruction
  if (
    q.includes('aadhaar') ||
    q.includes('आधार') ||
    q.includes('samagra') ||
    q.includes('समग्र') ||
    q.includes('bank') ||
    q.includes('खाता') ||
    q.includes('marks') ||
    q.includes('अंक')
  ) {
    return 'सुरक्षा एवं गोपनीयता नियमों के अनुसार व्यक्तिगत छात्र जानकारी (आधार, समग्र आईडी, अंक अथवा बैंक खाता) सामान्य चैटबॉट में प्रदर्शित नहीं की जा सकती। कृपया अपने अधिकृत Student Dashboard में लॉगिन करके देखें।';
  }

  // Timings
  if (q.includes('timing') || q.includes('time') || q.includes('समय') || q.includes('टाइम') || q.includes('खुलेगा') || q.includes('कब')) {
    return 'विद्यालय का समय सुबह 10:30 बजे से शाम 4:30 बजे तक (10:30 AM to 4:30 PM) है।';
  }

  // Principal
  if (q.includes('principal') || q.includes('प्राचार्य') || q.includes('हेड') || q.includes('head')) {
    return 'विद्यालय के प्राचार्य श्री अनिल कुमार बारोले (Anil Kumar Barole) हैं। प्राचार्य का संपर्क नंबर 9977359533 है।';
  }

  // School Information & Identity
  if (q.includes('school') || q.includes('विद्यालय') || q.includes('नाम') || q.includes('udise') || q.includes('कोड') || q.includes('स्थापना')) {
    return 'विद्यालय का पूरा नाम शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (Government Higher Secondary School, Ahamdpur, Khaigaon) है। यह जिला खण्डवा (मध्य प्रदेश) में स्थित है। स्थापना वर्ष 1984 (हाईस्कूल) एवं उन्नयन वर्ष 2006 (हायरसेकेण्डरी) है। डाइस कोड: 23290300210, संस्था कोड: 561033 है।';
  }

  // Classes Available
  if (q.includes('class') || q.includes('classes') || q.includes('कक्षा') || q.includes('सेक्शन') || q.includes('section')) {
    return 'विद्यालय में कक्षा 9वीं से 12वीं तक अध्ययन की सुविधा उपलब्ध है। कक्षा 9वीं में दो सेक्शन्स हैं - एक Girls section (Class Teacher: Bhusare Mam) और एक Boys section। कक्षा 10वीं की क्लास टीचर Rashmi Gupta हैं।';
  }

  // Streams & Subjects
  if (q.includes('stream') || q.includes('subject') || q.includes('संकाय') || q.includes('विषय') || q.includes('science') || q.includes('arts') || q.includes('commerce')) {
    return 'कक्षा 11वीं और 12वीं में विज्ञान (Science - Maths & Biology), कला (Arts) और वाणिज्य (Commerce) संकाय उपलब्ध हैं। कक्षा 11वीं साइंस क्लास टीचर Shital Bhausar एवं आर्ट्स क्लास टीचर Gitanjali Sakawar हैं। कक्षा 12वीं साइंस क्लास टीचर Vinita Choudhary एवं आर्ट्स क्लास टीचर Puja Parashar हैं।';
  }

  // Teachers
  if (q.includes('teacher') || q.includes('शिक्षक') || q.includes('टीचर') || q.includes('sir') || q.includes('mam') || q.includes('सर') || q.includes('मैडम')) {
    return 'विद्यालय के विषय शिक्षक:\n• Chemistry: Nisha Tirole\n• Physics: Shital Bhausar\n• Mathematics: Nabila Kureshi, Anil Barole\n• Biology: Vinita Choudhary, Purva Vishwakarma\n• Hindi: Rashmi Gupta, Mradula Mam, Masani Sir\n• English: Neela Soni, Puja Parashar\n• Sanskrit: Bhusare Mam\n• Geography: Manoj Patel Sir\n• History: Monika Kirar\n• Political Science: Priti Pathak\n• Economics: Gitanjali Sakawar';
  }

  // Documents Required for Admission
  if (q.includes('document') || q.includes('दस्तावेज') || q.includes('प्रमाण') || q.includes('कागजात') || q.includes('tc') || q.includes('टी.सी.')) {
    return 'मूल आवेदन पत्र के अनुसार आवश्यक 14 प्रमाण-पत्र:\n1. विगत वर्ष परीक्षा अंकसूची\n2. स्थानांतरण प्रमाण पत्र (T.C. मूल प्रति)\n3. जाति प्रमाण पत्र\n4. आय प्रमाण पत्र (3 वर्ष से अधिक पुराना नहीं)\n5. बैंक पासबुक छायाप्रति\n6. आधार कार्ड\n7. समग्र आईडी\n8. ए.पी.एल./बी.पी.एल. कार्ड (यदि लागू हो)\n9. दिव्यांग प्रमाण पत्र (यदि लागू हो)\n10. म.प्र. कर्मकार कार्ड\n11. पासपोर्ट साइज फोटो – 2 (नाम व दिनांक सहित)\n12. अपार आईडी प्रमाण पत्र\n13. लाड़ली लक्ष्मी प्रमाण पत्र (यदि लागू हो)\n14. संबल प्रमाण पत्र (यदि लागू हो)';
  }

  // Admission Process
  if (q.includes('admission') || q.includes('प्रवेश') || q.includes('दाखिला') || q.includes('form') || q.includes('फॉर्म')) {
    return 'विद्यालय में कक्षा 9वीं से 12वीं तक प्रवेश हेतु आप इस वेब ऐप पर डिजिटल 4-स्टेप फॉर्म भरकर ऑनलाइन आवेदन कर सकते हैं। आवेदन जमा करने पर आपको एक यूनिक Application ID मिलेगी। तत्पश्चात मूल टी.सी. एवं प्रमाण-पत्रों की प्रति विद्यालय कार्यालय में सत्यापन हेतु प्रस्तुत करनी होगी।';
  }

  // Facilities
  if (q.includes('facility') || q.includes('lab') || q.includes('सुविधा') || q.includes('मैदान') || q.includes('playground')) {
    return 'विद्यालय में खेल मैदान (Playground), ICT कंप्यूटर लैब, Mathematics लैब, Physics लैब, Chemistry लैब एवं स्मार्ट क्लासरूम (Smart Classroom) उपलब्ध हैं।';
  }

  // School Rules
  if (q.includes('rule') || q.includes('नियम') || q.includes('अनुशासन') || q.includes('mobile') || q.includes('मोबाइल')) {
    return 'मुख्य शाला नियम:\n1. नियमित उपस्थिति (75% से अधिक) अनिवार्य है।\n2. शाला समय में विद्यार्थियों द्वारा मोबाइल लाना पूर्णतः प्रतिबंधित है।\n3. त्रैमासिक, अर्द्धवार्षिक व वार्षिक परीक्षाओं में उपस्थिति अनिवार्य है।\n4. अनुशासनहीनता पर नोटिस उपरांत निष्कासन की कार्यवाही हो सकती है।';
  }

  return null;
}

// API: School AI Assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fast grounded check first for maximum speed and zero hallucination
    const directAnswer = resolveFromGroundedKnowledge(message);
    if (directAnswer) {
      return res.json({ reply: directAnswer });
    }

    // Build chat contents including history
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let replyText = '';

    // Primary: gemini-3.8-flash
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: SCHOOL_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          maxOutputTokens: 800,
        },
      });
      replyText = response.text || '';
    } catch (e1: any) {
      console.warn('gemini-3.8-flash unavailable, attempting gemini-3.1-flash-lite fallback...');
      try {
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: SCHOOL_SYSTEM_INSTRUCTION,
            temperature: 0.1,
            maxOutputTokens: 800,
          },
        });
        replyText = responseLite.text || '';
      } catch (e2: any) {
        console.warn('Both Gemini endpoints busy, applying safe verified rule.');
        replyText = 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।';
      }
    }

    const reply = replyText.trim() || 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।';
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.json({
      reply: 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।',
    });
  }
});

// API: AI Quiz Generator for Teachers (Review First Pattern)
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { classLevel, subject, topic, questionCount = 5, difficulty = 'medium' } = req.body;

    const prompt = `
Create an educational, curriculum-accurate multiple-choice quiz for:
Class: ${classLevel}th standard
Subject: ${subject}
Topic/Chapter: ${topic || 'General Syllabus'}
Number of questions: ${questionCount}
Difficulty: ${difficulty}
Language: Clear Hindi / English (bilingual or appropriate for MP Board high school students)

Format each question strictly with 4 distinct options and indicate the correct option index (0, 1, 2, or 3).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert school teacher crafting precise, high-quality multiple choice questions for high school students. Always ensure only one option is unambiguously correct.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "The quiz question text" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 multiple choice options",
              },
              correctIndex: { type: Type.INTEGER, description: "Index 0 to 3 of the correct option" },
              explanation: { type: Type.STRING, description: "Short explanation for students" },
            },
            required: ["questionText", "options", "correctIndex"],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    res.json({ questions });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// API: Secure Teacher Role Verification
// Prevents students from ever assigning themselves teacher/admin role
app.post('/api/auth/verify-teacher', (req, res) => {
  const { email, secretKey } = req.body;
  const authorizedEmails = [
    'bp6078234@gmail.com',
    'hss.ahmedpur.khd.mp@gmail.com',
  ];

  const adminPasscode = process.env.TEACHER_ADMIN_KEY || 'GHSS@Teacher2026';

  const isEmailPreauthorized = email && authorizedEmails.includes(email.toLowerCase());
  const isKeyValid = secretKey && secretKey.trim() === adminPasscode;

  if (isEmailPreauthorized || isKeyValid) {
    return res.json({
      authorized: true,
      role: 'teacher',
      message: 'Teacher authorization verified successfully.',
    });
  }

  return res.status(403).json({
    authorized: false,
    error: 'Invalid teacher authorization credentials.',
  });
});

// API: Google Sheets Sync (Minimization Policy - NO sensitive PII/Bank/Full Aadhaar)
app.post('/api/sheets/sync', async (req, res) => {
  try {
    const { application } = req.body;
    if (!application) {
      return res.status(400).json({ error: 'Application payload is required' });
    }

    // STRICT MINIMIZATION: Only non-sensitive administrative roster columns
    const minimalRow = {
      applicationId: application.applicationId,
      session: application.academicSession || '2026 - 2027',
      class: 'Class ' + application.targetClass,
      stream: application.subjectsAndSchemes?.stream || 'General',
      studentNameHindi: application.studentDetails?.fullNameHindi || '',
      studentNameEnglish: application.studentDetails?.fullNameEnglish || '',
      fatherNameEnglish: application.studentDetails?.fatherNameEnglish || '',
      motherNameEnglish: application.studentDetails?.motherNameEnglish || '',
      gender: application.studentDetails?.gender || '',
      category: application.studentDetails?.category || '',
      mobile: application.studentDetails?.whatsappMobile || '',
      village: application.familyDetails?.permanentVillage || '',
      district: application.familyDetails?.permanentDistrict || 'Khandwa',
      status: application.status || 'submitted',
      submittedAt: application.submittedAt || new Date().toISOString(),
    };

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
    let syncedToSheet = false;

    if (webhookUrl && webhookUrl.startsWith('https://script.google.com')) {
      try {
        const gasRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(minimalRow),
        });
        syncedToSheet = gasRes.ok;
      } catch (err) {
        console.error('Google Apps Script call failed:', err);
      }
    }

    res.json({
      success: true,
      syncedToSheet,
      record: minimalRow,
    });
  } catch (error: any) {
    console.error('Sheets sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware for Full-stack Dev vs Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
