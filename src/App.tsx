import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  signOut,
  collection,
  onSnapshot,
  query,
  where,
  User
} from './lib/firebase';
import { UserProfile, AdmissionApplication, Quiz, QuizQuestion } from './types';
import { OFFICIAL_SCHOOL_INFO } from './lib/knowledgeBase';
import { AuthModal } from './components/auth/AuthModal';
import { AdmissionWizard } from './components/admission/AdmissionWizard';
import { AdmissionPrintView } from './components/admission/AdmissionPrintView';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import {
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Send,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

// Indian Special Days dictionary for "Aaj Ka Vishesh Din"
const SPECIAL_DAYS: Record<string, [string, string]> = {
  '01-12': ['National Youth Day', 'Celebrated on the birth anniversary of Swami Vivekananda (born 1863).'],
  '01-24': ['National Girl Child Day', 'Observed to raise awareness about rights, education and health of girls.'],
  '01-26': ['Republic Day', 'The Constitution of India came into effect on 26 January 1950.'],
  '01-30': ["Martyrs' Day", 'Remembers Mahatma Gandhi, who passed away on 30 January 1948.'],
  '02-28': ['National Science Day', 'Marks the discovery of the Raman Effect by Sir C. V. Raman in 1928.'],
  '03-08': ["International Women's Day", 'Celebrates the social, economic and cultural achievements of women.'],
  '03-14': ['Pi Day', 'Pi (π) is approximately 3.14 — ratio of circle circumference to diameter.'],
  '03-22': ['World Water Day', 'A reminder to save and protect fresh water resources.'],
  '04-07': ['World Health Day', 'Marks the founding of the World Health Organization (WHO) in 1948.'],
  '04-22': ['Earth Day', 'A day to protect the environment and our planet.'],
  '05-01': ['International Labour Day', 'Honours workers and their contribution to society.'],
  '05-11': ['National Technology Day', "Celebrates India's achievements in science and technology."],
  '06-05': ['World Environment Day', 'The main UN day for encouraging action to protect nature.'],
  '06-21': ['International Yoga Day', 'Yoga, born in India, promotes holistic health of body and mind.'],
  '07-01': ["National Doctors' Day", 'Honours doctors on the birth anniversary of Dr. B. C. Roy.'],
  '08-15': ['Independence Day', 'India became an independent nation on 15 August 1947.'],
  '08-29': ['National Sports Day', 'Birth anniversary of hockey legend Major Dhyan Chand.'],
  '09-05': ["Teachers' Day", 'Birth anniversary of Dr. Sarvepalli Radhakrishnan, honouring all teachers.'],
  '09-08': ['International Literacy Day', 'Highlights the importance of reading and literacy for all.'],
  '09-14': ['Hindi Diwas', 'Hindi was adopted as the official language of the Union on 14 September 1949.'],
  '09-15': ["Engineers' Day", 'Birth anniversary of Bharat Ratna Sir M. Visvesvaraya.'],
  '09-29': ['World Heart Day', 'Promotes awareness about cardiovascular health and healthy living.'],
  '10-02': ['Gandhi Jayanti', 'Birth anniversary of Mahatma Gandhi, Father of the Nation.'],
  '10-15': ["World Students' Day", 'Birth anniversary of Dr. A. P. J. Abdul Kalam.'],
  '10-31': ['National Unity Day', 'Birth anniversary of Sardar Vallabhbhai Patel.'],
  '11-14': ["Children's Day", 'Birth anniversary of Pandit Jawaharlal Nehru.'],
  '11-26': ['Constitution Day', 'The Constitution of India was adopted on 26 November 1949.'],
  '12-10': ['Human Rights Day', 'Universal Declaration of Human Rights adopted in 1948.'],
};

// Fallback Quiz Bank for standard practice
const FALLBACK_QUIZZES: Record<string, QuizQuestion[]> = {
  Mathematics: [
    { questionText: 'What is (a + b)² equal to?', options: ['a² + b²', 'a² + 2ab + b²', 'a² − 2ab + b²', '2a + 2b'], correctIndex: 1 },
    { questionText: 'The sum of angles of a triangle is:', options: ['90°', '180°', '270°', '360°'], correctIndex: 1 },
    { questionText: '√144 = ?', options: ['10', '11', '12', '14'], correctIndex: 2 },
    { questionText: 'Area of a circle of radius r is:', options: ['2πr', 'πr²', 'πr', '2πr²'], correctIndex: 1 },
  ],
  Science: [
    { questionText: 'SI unit of force is:', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 1 },
    { questionText: 'Chemical symbol of sodium is:', options: ['So', 'Na', 'S', 'N'], correctIndex: 1 },
    { questionText: 'The powerhouse of the cell is:', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], correctIndex: 2 },
    { questionText: 'Speed of light is approximately:', options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁵ m/s'], correctIndex: 1 },
  ],
  English: [
    { questionText: 'Plural of "child" is:', options: ['childs', 'children', 'childrens', 'childes'], correctIndex: 1 },
    { questionText: 'Synonym of "happy":', options: ['sad', 'joyful', 'angry', 'tired'], correctIndex: 1 },
    { questionText: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correctIndex: 1 },
  ],
  'General Knowledge': [
    { questionText: 'Capital of India is:', options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], correctIndex: 1 },
    { questionText: 'National animal of India is:', options: ['Lion', 'Tiger', 'Elephant', 'Peacock'], correctIndex: 1 },
    { questionText: 'Capital of Madhya Pradesh is:', options: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'], correctIndex: 1 },
  ],
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('ghss_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Current view: 'home' | 'learn' | 'community' | 'faculty' | 'profile'
  const [currentView, setCurrentView] = useState<'home' | 'learn' | 'community' | 'faculty' | 'profile'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'student' | 'teacher'>('student');

  // Admission Modal State
  const [admissionWizardOpen, setAdmissionWizardOpen] = useState(false);
  const [admissionClass, setAdmissionClass] = useState<'9' | '10' | '11' | '12'>('9');
  const [activeDraft, setActiveDraft] = useState<AdmissionApplication | null>(null);

  // Printable View
  const [printApp, setPrintApp] = useState<AdmissionApplication | null>(null);

  // Campus Facility Modal
  const [campusModal, setCampusModal] = useState<{ title: string; desc: string } | null>(null);

  // AI Chatbot State
  const [aiOpen, setAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'नमस्ते! मैं शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव का अधिकृत AI सहायक हूँ। आप मुझसे प्रवेश, कक्षा, शिक्षक, समय अथवा शाला संबंधी कोई भी प्रश्न पूछ सकते हैं।',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Learn / Quiz Engine State
  const [quizClass, setQuizClass] = useState<'9' | '10' | '11' | '12'>('9');
  const [quizSubject, setQuizSubject] = useState('Mathematics');
  const [activeQuiz, setActiveQuiz] = useState<{ questions: QuizQuestion[]; index: number; score: number } | null>(null);
  const [timer, setTimer] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  // Apply Theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ghss_theme', theme);
    } catch {}
  }, [theme]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserProfile);
          } else {
            const fallback: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Student',
              email: user.email || '',
              role: 'student',
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(fallback);
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  // Scroll to bottom in chat
  useEffect(() => {
    if (aiOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, aiOpen]);

  // Quiz Timer
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !quizFinished && selectedAnswer === null) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleAnswer(-1); // Time out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizFinished, selectedAnswer]);

  const handleStartQuiz = () => {
    // Check if there are published quizzes for this class & subject in Firestore, else use fallback
    const qList = FALLBACK_QUIZZES[quizSubject] || FALLBACK_QUIZZES['Mathematics'];
    setActiveQuiz({
      questions: qList,
      index: 0,
      score: 0,
    });
    setTimer(20);
    setSelectedAnswer(null);
    setQuizFinished(false);
  };

  const handleAnswer = (optionIdx: number) => {
    if (!activeQuiz || selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);

    const currentQ = activeQuiz.questions[activeQuiz.index];
    const isCorrect = optionIdx === currentQ.correctIndex;
    const newScore = isCorrect ? activeQuiz.score + 1 : activeQuiz.score;

    setTimeout(() => {
      if (activeQuiz.index + 1 < activeQuiz.questions.length) {
        setActiveQuiz({
          ...activeQuiz,
          index: activeQuiz.index + 1,
          score: newScore,
        });
        setSelectedAnswer(null);
        setTimer(20);
      } else {
        // Finish
        const xpGained = newScore * 20;
        setEarnedXP(xpGained);
        setActiveQuiz({ ...activeQuiz, score: newScore });
        setQuizFinished(true);
      }
    }, 1200);
  };

  // AI Chat message sender
  const handleSendChat = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput.trim();
    if (!textToSend || chatLoading) return;

    const newHistory = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: newHistory,
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply || 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।',
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Aaj Ka Vishesh Din calculation
  const today = new Date();
  const dayKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const specialDay = SPECIAL_DAYS[dayKey] || ['आज का विशेष दिन', 'आज नया ज्ञान अर्जित करने एवं स्वाध्याय के लिए एक उत्तम दिवस है!'];

  return (
    <div className="min-h-screen text-slate-100 selection:bg-pink-500 selection:text-white">
      {/* Background Ambience Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="blob blob1 w-[400px] h-[400px] rounded-full bg-purple-600/15 blur-[120px] absolute -top-24 -right-24" />
        <div className="blob blob2 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px] absolute -bottom-24 -left-24" />
      </div>

      {/* Floating Animated Logo */}
      <div
        onClick={() => setCurrentView('home')}
        className="fixed top-3 left-4 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 shadow-xl cursor-pointer hover:scale-105 transition"
      >
        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-center p-1 text-[9px] font-bold text-cyan-300">
          GHSS
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="wrap flex items-center justify-between h-[68px]">
          <div
            onClick={() => setCurrentView('home')}
            className="brand font-bold text-sm sm:text-base ml-16 sm:ml-20 cursor-pointer grad-text"
          >
            GHSS Ahamdpur, Khaigaon
          </div>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium list-none m-0 p-0">
            <li>
              <button
                onClick={() => setCurrentView('home')}
                className={`hover:text-white transition ${currentView === 'home' ? 'text-cyan-400 font-bold' : ''}`}
              >
                Home
              </button>
            </li>
            <li>
              <a href="#about" onClick={() => setCurrentView('home')} className="hover:text-white transition">
                About
              </a>
            </li>
            <li>
              <a href="#academics" onClick={() => setCurrentView('home')} className="hover:text-white transition">
                Academics
              </a>
            </li>
            <li>
              <a href="#campus" onClick={() => setCurrentView('home')} className="hover:text-white transition">
                Campus
              </a>
            </li>
            <li>
              <a href="#admission" onClick={() => setCurrentView('home')} className="hover:text-white transition">
                Admission
              </a>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('faculty')}
                className={`hover:text-white transition ${currentView === 'faculty' ? 'text-cyan-400 font-bold' : ''}`}
              >
                Teachers
              </button>
            </li>
            <li>
              <a href="#contact" onClick={() => setCurrentView('home')} className="hover:text-white transition">
                Contact
              </a>
            </li>
          </ul>

          {/* Actions: Theme Toggle & Portal Login */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {currentUser ? (
              <button
                onClick={() => setCurrentView('profile')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-semibold shadow-md transition ${
                  currentUser.role === 'teacher'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-white'
                }`}
              >
                {currentUser.role === 'teacher' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Faculty Portal</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Dashboard</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthInitialRole('student');
                  setAuthModalOpen(true);
                }}
                className="py-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 bg-slate-950/95 border-b border-slate-800 space-y-3 text-sm">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-slate-300"
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentView('learn');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-slate-300"
            >
              Daily Quiz (Learn)
            </button>
            <button
              onClick={() => {
                setCurrentView('faculty');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-slate-300"
            >
              Teachers Directory
            </button>
            <button
              onClick={() => {
                setAdmissionClass('9');
                setAdmissionWizardOpen(true);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-cyan-400 font-semibold"
            >
              Apply for Admission 2026-27
            </button>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* VIEW: HOME VIEW                                           */}
      {/* ========================================================= */}
      {currentView === 'home' && (
        <main className="space-y-16 sm:space-y-24">
          {/* HERO SECTION */}
          <section id="home" className="pt-28 pb-12 sm:pt-36 sm:pb-20">
            <div className="wrap grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  स्थापना 1984 • उच्चतर माध्यमिक उन्नयन 2006
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  शासकीय उच्चतर माध्यमिक विद्यालय
                  <span className="block text-xl sm:text-3xl text-cyan-400 font-bold mt-2">
                    अहमदपुर खैगांव, जिला-खण्डवा (म.प्र.)
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                  A modern digital campus dedicated to educational excellence, character building, and community empowerment. सत्र 2026-2027 में कक्षा 9वीं से 12वीं तक के प्रवेश हेतु ऑनलाइन आवेदन आमंत्रित हैं।
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthModalOpen(true);
                      } else {
                        setAdmissionClass('9');
                        setAdmissionWizardOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-900/40 transition"
                  >
                    <span>Apply for Admission (प्रवेश आवेदन)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#about"
                    className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs sm:text-sm transition"
                  >
                    Learn More
                  </a>
                </div>
              </div>

              {/* Hero Banner Card */}
              <div className="lg:col-span-5">
                <div className="glass p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-4 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      UDISE: 23290300210
                    </span>
                    <span className="text-xs text-slate-400">Code: 561033</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="text-xs font-bold text-cyan-400">प्राचार्य संदेश (Principal's Desk)</div>
                    <div className="text-xs text-white font-semibold">
                      {OFFICIAL_SCHOOL_INFO.principal.name}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      "हमारा संकल्प है कि प्रत्येक छात्र को संस्कारयुक्त व गुणवत्तापूर्ण शिक्षा प्रदान कर उनके सर्वांगीण विकास का मार्ग प्रशस्त किया जाए।"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="text-base font-bold text-white">10:30 AM</div>
                      <div className="text-[10px] text-slate-500">शाला प्रारंभ</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="text-base font-bold text-white">04:30 PM</div>
                      <div className="text-[10px] text-slate-500">शाला समापन</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AAJ KA VISHESH DIN */}
          <section className="wrap">
            <div className="glass p-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-purple-950/20 via-slate-900 to-cyan-950/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 text-2xl shrink-0">
                📅
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Aaj Ka Vishesh Din (आज का विशेष दिन) • {today.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {specialDay[0]}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {specialDay[1]}
                </p>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section id="about" className="wrap space-y-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">About Our School</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                संस्कार, शिक्षा एवं अनुशासन की समृद्ध परंपरा
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Who We Are (परिचय)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (खण्डवा) क्षेत्र का एक प्रमुख शासकीय शिक्षण संस्थान है जहाँ कक्षा 9वीं से 12वीं तक आधुनिक एवं मूल्यपरक शिक्षा प्रदान की जाती है।
                </p>
              </div>
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Our History (इतिहास)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  वर्ष 1984 में हाईस्कूल के रूप में स्थापित होकर वर्ष 2006 में उच्चतर माध्यमिक विद्यालय के रूप में उन्नत हुआ। विद्यालय ने हजारों विद्यार्थियों को उच्च शिक्षा एवं रोजगार के योग्य बनाया है।
                </p>
              </div>
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Our Mission (ध्येय)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "A Commitment to Success" - प्रत्येक विद्यार्थी में वैज्ञानिक दृष्टिकोण, तार्किक क्षमता, और सामाजिक उत्तरदायित्व की भावना का विकास करना।
                </p>
              </div>
            </div>

            {/* Official Stat Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { count: '4', label: 'Classes (9th to 12th)' },
                { count: '18+', label: 'Qualified Teachers' },
                { count: '450+', label: 'Enrolled Students' },
                { count: '6', label: 'Labs & Facilities' },
              ].map((st, i) => (
                <div key={i} className="glass p-5 rounded-2xl text-center border border-slate-800">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{st.count}</div>
                  <div className="text-xs text-slate-400 mt-1">{st.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CAMPUS FACILITIES */}
          <section id="campus" className="wrap space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Campus & Infrastructure</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Explore Our Campus & Labs (सुविधाएं)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {OFFICIAL_SCHOOL_INFO.facilities.map((fac, i) => (
                <div
                  key={i}
                  onClick={() => setCampusModal(fac)}
                  className="glass p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition">
                    {fac.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{fac.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* COURSES & ACADEMICS */}
          <section id="academics" className="wrap space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Academics & Streams</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                पाठ्यक्रम एवं उपलब्ध संकाय
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Classes 9th & 10th
                </span>
                <h3 className="text-lg font-bold text-white">माध्यमिक पाठ्यक्रम (Secondary Education)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  हिन्दी, अंग्रेजी, संस्कृत, गणित, विज्ञान एवं सामाजिक विज्ञान। कक्षा 9वीं में छात्रों एवं छात्राओं के लिए अलग-अलग सेक्शन्स (Boys & Girls Sections) की व्यवस्था है।
                </p>
                <div className="text-xs text-slate-300 font-semibold">
                  व्यवसायिक पाठ्यक्रम (Vocational): Beauty & Wellness, Healthcare
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  Classes 11th & 12th
                </span>
                <h3 className="text-lg font-bold text-white">उच्चतर माध्यमिक संकाय (Higher Secondary Streams)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  विज्ञान संकाय (गणित व जीव विज्ञान - Physics, Chemistry, Maths/Biology) तथा कला संकाय (इतिहास, भूगोल, राजनीति विज्ञान, अर्थशास्त्र) व वाणिज्य संकाय।
                </p>
                <div className="text-xs text-slate-300 font-semibold">
                  बोर्ड: माध्यमिक शिक्षा मण्डल, मध्य प्रदेश (MP Board Bhopal)
                </div>
              </div>
            </div>
          </section>

          {/* DIGITAL ADMISSION SECTION */}
          <section id="admission" className="wrap space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Admission Open 2026-27</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                कक्षा 9वीं से 12वीं में प्रवेश हेतु आवेदन करें
              </h2>
              <p className="text-xs text-slate-400">
                विद्यालय के 4-पृष्ठीय मूल प्रवेश फॉर्म के अनुसार डिजिटल आवेदन पत्र भरें तथा अपना यूनिक आवेदन क्रमांक प्राप्त करें।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(['9', '10', '11', '12'] as const).map((cls) => (
                <div
                  key={cls}
                  className="glass p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-cyan-400">SESSION 2026-27</div>
                    <h3 className="text-xl font-bold text-white mt-1">कक्षा {cls}वीं</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      {cls === '9' && 'Girls Section एवं Boys Section उपलब्ध। व्यवसायिक शिक्षा शामिल।'}
                      {cls === '10' && 'बोर्ड परीक्षा तैयारी, रेमेडियल क्लास एवं सतत मूल्यांकन।'}
                      {cls === '11' && 'Science (Maths/Bio), Arts एवं Commerce संकाय।'}
                      {cls === '12' && 'MP Board बोर्ड परीक्षा, प्रैक्टिकल लैब्स एवं करियर मार्गदर्शन।'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthModalOpen(true);
                      } else {
                        setAdmissionClass(cls);
                        setAdmissionWizardOpen(true);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md shadow-cyan-900/30 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Apply Class {cls}th</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* FEES POLICY STATEMENT */}
          <section className="wrap">
            <div className="glass p-6 rounded-3xl border border-slate-800 text-xs space-y-2 text-slate-400">
              <span className="font-bold text-white uppercase text-[11px]">शासकीय शुल्क नीति (Fee Policy):</span>
              <p>
                मध्य प्रदेश शासन के नियमानुसार शासकीय उच्चतर माध्यमिक विद्यालय में शिक्षण निःशुल्क/न्यूनतम शासकीय दिशा-निर्देशानुसार प्रदान किया जाता है। प्रवेश शुल्क व योजनाओं की सटीक जानकारी हेतु विद्यालय कार्यालय से संपर्क करें।
              </p>
            </div>
          </section>

          {/* CONTACT SECTION */}
          <section id="contact" className="wrap space-y-8 pb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Contact Details</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                संपर्क एवं कार्यालय समय
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">कार्यालय पता (Address)</div>
                <p className="text-slate-400 leading-relaxed">
                  शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव,<br />
                  जिला-खण्डवा, मध्य प्रदेश - 450001
                </p>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">प्राचार्य संपर्क (Principal)</div>
                <p className="text-slate-400">
                  <b>{OFFICIAL_SCHOOL_INFO.principal.name}</b><br />
                  मोबाइल: <a href="tel:9977359533" className="text-cyan-400 font-mono">9977359533</a><br />
                  ईमेल: <a href="mailto:hss.ahmedpur.khd.mp@gmail.com" className="text-cyan-400">hss.ahmedpur.khd.mp@gmail.com</a>
                </p>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">विद्यालय समय (Timings)</div>
                <p className="text-slate-400 leading-relaxed">
                  सोमवार से शनिवार: <b>सुबह 10:30 बजे से शाम 4:30 बजे तक</b><br />
                  रविवार व शासकीय अवकाश: बंद
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: LEARN VIEW (DAILY QUIZ & XP)                         */}
      {/* ========================================================= */}
      {currentView === 'learn' && (
        <main className="wrap pt-28 pb-16 space-y-8 animate-fadeIn">
          {/* XP & Level Progress Card */}
          <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-extrabold flex items-center justify-center text-lg shadow-lg">
                  Lv 1
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Beginner Scholar</h3>
                  <div className="text-xs text-slate-400">{earnedXP} XP total earned</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Daily Learning Mode
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500" style={{ width: `${Math.min(100, earnedXP + 25)}%` }} />
            </div>
          </div>

          {/* Quiz Player Section */}
          {!activeQuiz || quizFinished ? (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-white">Start Today's Quiz (दैनिक क्विज)</h2>
                <p className="text-xs text-slate-400">अपनी कक्षा व विषय चुनें और 20-सेकंड प्रति प्रश्न में उत्तर दें</p>
              </div>

              {quizFinished && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-2">
                  <div className="text-3xl">🏆</div>
                  <div className="text-base font-bold text-white">
                    You scored {activeQuiz?.score} / {activeQuiz?.questions.length}!
                  </div>
                  <div className="text-xs text-emerald-300 font-semibold">
                    +{earnedXP} XP Added to your profile!
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Class (कक्षा)</label>
                  <select
                    value={quizClass}
                    onChange={(e) => setQuizClass(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    <option value="9">Class 9th</option>
                    <option value="10">Class 10th</option>
                    <option value="11">Class 11th</option>
                    <option value="12">Class 12th</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Subject (विषय)</label>
                  <select
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    <option value="Mathematics">Mathematics (गणित)</option>
                    <option value="Science">Science (विज्ञान)</option>
                    <option value="English">English (अंग्रेजी)</option>
                    <option value="General Knowledge">General Knowledge (सामान्य ज्ञान)</option>
                  </select>
                </div>

                <button
                  onClick={handleStartQuiz}
                  className="w-full py-3 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-900/30 transition"
                >
                  Start Quiz Now
                </button>
              </div>
            </div>
          ) : (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Question {activeQuiz.index + 1} of {activeQuiz.questions.length}
                </span>
                <span className="font-mono font-bold text-amber-400">⏱ {timer}s</span>
              </div>

              {/* Progress countdown bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-1000"
                  style={{ width: `${(timer / 20) * 100}%` }}
                />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white">
                {activeQuiz.questions[activeQuiz.index].questionText}
              </h3>

              <div className="space-y-3">
                {activeQuiz.questions[activeQuiz.index].options.map((opt, i) => {
                  const isChosen = selectedAnswer === i;
                  const isCorrect = i === activeQuiz.questions[activeQuiz.index].correctIndex;

                  let optClass = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600';
                  if (selectedAnswer !== null) {
                    if (isCorrect) {
                      optClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isChosen) {
                      optClass = 'bg-rose-950/60 border-rose-500 text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswer(i)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition text-xs sm:text-sm flex items-center gap-3 ${optClass}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center font-mono text-xs font-bold text-slate-400 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: FACULTY DIRECTORY VIEW                              */}
      {/* ========================================================= */}
      {currentView === 'faculty' && (
        <main className="wrap pt-28 pb-16 space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Faculty & Staff</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              अहमदपुर खैगांव शिक्षक संकाय (Faculty Directory)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Official list of subject and class teachers as per school records.
            </p>
          </div>

          {/* Principal Card */}
          <div className="glass p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900 to-cyan-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-extrabold text-xl">
                AB
              </div>
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">प्राचार्य (Principal)</span>
                <h3 className="text-lg font-bold text-white">{OFFICIAL_SCHOOL_INFO.principal.name}</h3>
                <p className="text-xs text-slate-400">Contact: 9977359533</p>
              </div>
            </div>
            <a
              href="tel:9977359533"
              className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs shadow-md transition"
            >
              Call Office
            </a>
          </div>

          {/* Subject Teachers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_SCHOOL_INFO.subjectTeachers.map((item, idx) => (
              <div key={idx} className="glass p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-400">{item.subject}</div>
                <div className="space-y-1">
                  {item.teachers.map((t, tIdx) => (
                    <div key={tIdx} className="text-sm font-semibold text-white">
                      • {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: COMMUNITY VIEW (DOUBTS & HOMEWORK)                   */}
      {/* ========================================================= */}
      {currentView === 'community' && (
        <main className="wrap pt-28 pb-16 space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">School Community</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              विद्यार्थी विचार-मंच एवं गृहकार्य (Doubts & Homework)
            </h2>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
            <h3 className="text-base font-bold text-white">Ask a Doubt (अपना प्रश्न पूछें)</h3>
            <textarea
              rows={3}
              placeholder="Type your academic doubt here..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Photos can be attached for homework questions</span>
              <button
                onClick={() => alert('Doubt submitted to peer & teacher forum!')}
                className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs transition"
              >
                Post Doubt
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: PROFILE / DASHBOARD VIEW                            */}
      {/* ========================================================= */}
      {currentView === 'profile' && (
        <main className="wrap pt-28 pb-16 animate-fadeIn">
          {currentUser ? (
            currentUser.role === 'teacher' ? (
              <TeacherDashboard
                user={currentUser}
                onLogout={async () => {
                  await signOut(auth);
                  setCurrentUser(null);
                  setCurrentView('home');
                }}
                onOpenPrint={(app) => setPrintApp(app)}
              />
            ) : (
              <StudentDashboard
                user={currentUser}
                onLogout={async () => {
                  await signOut(auth);
                  setCurrentUser(null);
                  setCurrentView('home');
                }}
                onStartAdmission={(cls, draft) => {
                  setAdmissionClass(cls || '9');
                  setActiveDraft(draft || null);
                  setAdmissionWizardOpen(true);
                }}
                onOpenPrint={(app) => setPrintApp(app)}
                onGoToLearn={() => setCurrentView('learn')}
              />
            )
          ) : (
            <div className="max-w-md mx-auto p-8 rounded-3xl glass text-center space-y-4 border border-slate-800">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-3xl font-bold">
                👤
              </div>
              <h3 className="text-xl font-bold text-white">Student & Teacher Portal</h3>
              <p className="text-xs text-slate-400">
                Please login to access your admission application, daily learning stats, or teacher review hub.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setAuthInitialRole('student');
                    setAuthModalOpen(true);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs shadow-md transition"
                >
                  Student Login
                </button>
                <button
                  onClick={() => {
                    setAuthInitialRole('teacher');
                    setAuthModalOpen(true);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Teacher Login
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================= */}
      {/* FLOATING SCHOOL AI ASSISTANT (CHATBOT)                     */}
      {/* ========================================================= */}
      <button
        onClick={() => setAiOpen(!aiOpen)}
        className="fixed bottom-20 sm:bottom-6 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-500 text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-105 transition"
        aria-label="Open School AI Assistant"
      >
        💬
      </button>

      {/* AI Chat Drawer */}
      {aiOpen && (
        <div className="fixed bottom-36 sm:bottom-24 right-4 z-50 w-80 sm:w-96 max-w-[calc(100vw-32px)] max-h-[70vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-xs text-slate-100 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <b className="text-white text-xs block">School AI Assistant</b>
                <span className="text-[10px] text-cyan-300">शासकीय उच्चतर माध्यमिक विद्यालय</span>
              </div>
            </div>
            <button
              onClick={() => setAiOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap gap-1.5 shrink-0">
            {[
              'School timing?',
              'What classes are available?',
              'Who is the principal?',
              'Required documents?',
              'Subject teachers?',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(chip)}
                className="py-1 px-2.5 rounded-full text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-purple-600/40 border border-purple-500/40 text-purple-100 rounded-br-sm'
                    : 'mr-auto bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="mr-auto p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] animate-pulse">
                Thinking with official school records...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about school, admission, teachers..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR                              */}
      {/* ========================================================= */}
      <nav className="bnav md:hidden" aria-label="Mobile Navigation">
        <button
          onClick={() => setCurrentView('home')}
          className={currentView === 'home' ? 'on' : ''}
        >
          <i>🏠</i>Home
        </button>
        <button
          onClick={() => setCurrentView('learn')}
          className={currentView === 'learn' ? 'on' : ''}
        >
          <i>🎯</i>Learn
        </button>
        <button
          onClick={() => setCurrentView('community')}
          className={currentView === 'community' ? 'on' : ''}
        >
          <i>💬</i>Community
        </button>
        <button
          onClick={() => setCurrentView('faculty')}
          className={currentView === 'faculty' ? 'on' : ''}
        >
          <i>👩‍🏫</i>Faculty
        </button>
        <button
          onClick={() => setCurrentView('profile')}
          className={currentView === 'profile' ? 'on' : ''}
        >
          <i>👤</i>Profile
        </button>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 space-y-1">
        <div>Government Higher Secondary School, Ahamdpur, Khaigaon (Khandwa, M.P.)</div>
        <div>© {new Date().getFullYear()} GHSS Khaigaon. All rights reserved.</div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialRole={authInitialRole}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(profile) => {
          setCurrentUser(profile);
          setCurrentView('profile');
        }}
      />

      {admissionWizardOpen && currentUser && (
        <AdmissionWizard
          user={currentUser}
          initialClass={admissionClass}
          existingDraft={activeDraft}
          onSuccess={() => {
            setAdmissionWizardOpen(false);
            setCurrentView('profile');
          }}
          onClose={() => setAdmissionWizardOpen(false)}
          onOpenPrint={(app) => {
            setAdmissionWizardOpen(false);
            setPrintApp(app);
          }}
        />
      )}

      {printApp && (
        <AdmissionPrintView application={printApp} onClose={() => setPrintApp(null)} />
      )}

      {campusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-700 max-w-sm w-full space-y-3 text-xs">
            <h3 className="text-base font-bold text-white">{campusModal.title}</h3>
            <p className="text-slate-300 leading-relaxed">{campusModal.desc}</p>
            <button
              onClick={() => setCampusModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
