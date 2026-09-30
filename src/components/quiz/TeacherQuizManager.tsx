import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Quiz, QuizQuestion, UserProfile } from '../../types';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  BookOpen,
  Send,
  AlertCircle
} from 'lucide-react';

interface TeacherQuizManagerProps {
  user: UserProfile;
}

const SUBJECT_LIST = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Hindi',
  'English',
  'Sanskrit',
  'Geography',
  'History',
  'Political Science',
  'Economics',
  'General Knowledge',
];

export const TeacherQuizManager: React.FC<TeacherQuizManagerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'ai' | 'list'>('create');
  const [publishedQuizzes, setPublishedQuizzes] = useState<Quiz[]>([]);

  // Manual & Review Quiz State
  const [targetClass, setTargetClass] = useState<'9' | '10' | '11' | '12'>('9');
  const [subject, setSubject] = useState('Mathematics');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDate, setQuizDate] = useState(new Date().toISOString().split('T')[0]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      marks: 1,
      explanation: '',
    },
  ]);

  // AI Generator Parameters
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing published quizzes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'quizzes'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quiz));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPublishedQuizzes(list);
    });
    return () => unsub();
  }, []);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        marks: 1,
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx].questionText = text;
      return copy;
    });
  };

  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx] = val;
      return copy;
    });
  };

  const updateCorrectIndex = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].correctIndex = optIdx;
      return copy;
    });
  };

  const updateExplanation = (qIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].explanation = val;
      return copy;
    });
  };

  // AI Quiz Generation (Review First Flow)
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevel: targetClass,
          subject,
          topic: aiTopic.trim(),
          questionCount: aiCount,
          difficulty: aiDifficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.questions) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setQuestions(data.questions);
      setQuizTitle(`${subject}: ${aiTopic || 'Daily Class Quiz'}`);
      setActiveTab('create'); // Transition to review & edit screen
      setFeedbackMsg({
        type: 'success',
        text: 'AI Quiz generated! Please review, edit as needed, and click Publish below.',
      });
    } catch (err: any) {
      console.error('AI Gen error:', err);
      setAiError(err.message || 'Error communicating with AI service');
    } finally {
      setAiLoading(false);
    }
  };

  // Publish to Firestore
  const handlePublishQuiz = async () => {
    // Validate
    if (!quizTitle.trim()) {
      alert('Please enter a Quiz Title');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} text is empty`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          alert(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} is empty`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      const newQuiz: Omit<Quiz, 'id'> = {
        title: quizTitle.trim(),
        class: targetClass,
        subject,
        status: 'published',
        date: quizDate,
        createdBy: user.uid,
        authorName: user.name,
        questions,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'quizzes'), newQuiz);

      // Trigger student notification for new quiz
      await addDoc(collection(db, 'notifications'), {
        recipientUid: 'all_students',
        title: `New Quiz Published: Class ${targetClass} ${subject}`,
        message: `Today's quiz "${quizTitle}" is now live in the Learn section. Earn XP now!`,
        type: 'new_quiz',
        read: false,
        createdAt: new Date().toISOString(),
      });

      setFeedbackMsg({ type: 'success', text: 'Quiz published successfully to student portal!' });
      // Reset
      setQuizTitle('');
      setQuestions([
        { questionText: '', options: ['', '', '', ''], correctIndex: 0, marks: 1, explanation: '' },
      ]);
      setActiveTab('list');
    } catch (err: any) {
      console.error('Save quiz error:', err);
      setFeedbackMsg({ type: 'error', text: 'Failed to publish quiz' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await deleteDoc(doc(db, 'quizzes', id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            ✏️ Quiz Editor
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold transition ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generator
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition ${
              activeTab === 'list'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            📚 Published Quizzes ({publishedQuizzes.length})
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ================= TAB 1: QUIZ EDITOR ================= */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Quiz Details & Target Class
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Class</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold"
                >
                  <option value="9">कक्षा 9वीं (Class 9th)</option>
                  <option value="10">कक्षा 10वीं (Class 10th)</option>
                  <option value="11">कक्षा 11वीं (Class 11th)</option>
                  <option value="12">कक्षा 12वीं (Class 12th)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject (विषय)</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold"
                >
                  {SUBJECT_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Quiz Title (शीर्षक)</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Chapter 1: Real Numbers Practice Quiz"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Questions Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300">
                Questions List ({questions.length})
              </h4>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">
                    Question #{qIdx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  placeholder="Type the question text here..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-600/70'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={isCorrect}
                          onChange={() => updateCorrectIndex(qIdx, optIdx)}
                          className="w-4 h-4 text-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => updateExplanation(qIdx, e.target.value)}
                    placeholder="Explanation for students (optional)"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={handlePublishQuiz}
              className="flex items-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xl shadow-emerald-900/30 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Publishing...' : 'Publish Quiz to Class (प्रकाशित करें)'}
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 2: AI QUIZ GENERATOR ================= */}
      {activeTab === 'ai' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI-Powered Quiz Generator</h3>
              <p className="text-xs text-slate-400">
                Generate questions with Gemini 2.5 Flash, review them in the editor, and publish.
              </p>
            </div>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{aiError}</span>
            </div>
          )}

          <form onSubmit={handleAIGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Target Class</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold"
                >
                  <option value="9">Class 9th</option>
                  <option value="10">Class 10th</option>
                  <option value="11">Class 11th</option>
                  <option value="12">Class 12th</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold"
                >
                  {SUBJECT_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Chapter / Topic (अध्याय या विषय)
              </label>
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Gravity and Motion / प्रकाश का परावर्तन"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Number of Questions</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="easy">Easy (सरल)</option>
                  <option value="medium">Medium (मध्यम)</option>
                  <option value="hard">Hard (कठिन)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
              🛡️ <b>Review-First Assurance:</b> Generated questions will not be visible to students until you review, edit, and click "Publish".
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'Generating Questions with AI...' : 'Generate Questions for Review'}
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: PUBLISHED LIST ================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {publishedQuizzes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
              No published quizzes found. Create one manually or with AI above!
            </div>
          ) : (
            publishedQuizzes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 font-bold text-xs">
                      Class {q.class}th
                    </span>
                    <span className="font-semibold text-white text-xs">{q.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Subject: <b>{q.subject}</b> • Questions: {q.questions?.length || 0} • Published by: {q.authorName}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
                    Live in Student App ✓
                  </span>
                  <button
                    onClick={() => handleDeleteQuiz(q.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
