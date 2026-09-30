import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../../lib/firebase';
import { AdmissionApplication, UserProfile, AppNotification } from '../../types';
import {
  FileText,
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  LogOut,
  Edit3,
  Award,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

interface StudentDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onStartAdmission: (targetClass?: '9' | '10' | '11' | '12', draft?: AdmissionApplication) => void;
  onOpenPrint: (app: AdmissionApplication) => void;
  onGoToLearn: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onLogout,
  onStartAdmission,
  onOpenPrint,
  onGoToLearn,
}) => {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to student's own admissions
  useEffect(() => {
    const q = query(collection(db, 'admissions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apps = snapshot.docs.map((d) => d.data() as AdmissionApplication);
        setApplications(apps);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admissions');
        setLoading(false);
      }
    );

    // Subscribe to student notifications
    const notifQ = query(collection(db, 'notifications'), where('recipientUid', '==', user.uid));
    const unsubNotif = onSnapshot(
      notifQ,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        setNotifications(notifs);
      },
      (err) => console.log('Notif listen:', err)
    );

    return () => {
      unsubscribe();
      unsubNotif();
    };
  }, [user.uid]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" /> स्वीकृत (Approved)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> अस्वीकृत (Rejected)
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> सुधार अपेक्षित (Action Required)
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" /> समीक्षाधीन (Under Review)
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3.5 h-3.5" /> जमा हुआ (Submitted)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Edit3 className="w-3.5 h-3.5" /> ड्राफ्ट (Draft)
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 animate-fadeIn">
      {/* Top Banner Profile Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Student Account
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToLearn}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-semibold transition"
          >
            <Award className="w-4 h-4" />
            Daily Quizzes
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Notifications if any */}
      {notifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Bell className="w-4 h-4" />
            सूचनाएं (School Updates & Notices)
          </div>
          <div className="space-y-1.5">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="font-semibold text-white">{n.title}</div>
                <div className="text-slate-400 mt-0.5">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admissions Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">प्रवेश आवेदन (My Admission Application)</h3>
            <p className="text-xs text-slate-400">
              शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (सत्र 2026-2027)
            </p>
          </div>

          {applications.length === 0 && (
            <button
              onClick={() => onStartAdmission('9')}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-900/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Apply for Admission
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading application data...</div>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 space-y-4">
            <div className="inline-flex p-4 rounded-full bg-cyan-500/10 text-cyan-400">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">आपने अभी तक प्रवेश आवेदन नहीं भरा है</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                कक्षा 9वीं, 10वीं, 11वीं या 12वीं में प्रवेश हेतु विद्यालय के 4-पृष्ठीय डिजिटल आवेदन पत्र को ऑनलाइन भरें।
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {(['9', '10', '11', '12'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => onStartAdmission(cls)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-white border border-slate-700 text-xs font-semibold transition"
                >
                  Apply Class {cls}th
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-cyan-400">
                        {app.applicationId}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      कक्षा: <b>{app.targetClass}वीं</b> | संकाय: <b>{app.subjectsAndSchemes?.stream || 'सामान्य'}</b> | सत्र: {app.academicSession}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    जमा दिनांक: {new Date(app.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Student summary fields */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[11px]">विद्यार्थी का नाम</span>
                    <span className="font-semibold text-white">{app.studentDetails.fullNameHindi || app.studentDetails.fullNameEnglish}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">पिता का नाम</span>
                    <span className="font-semibold text-white">{app.studentDetails.fatherNameEnglish}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">वर्ग / जाति</span>
                    <span className="font-semibold text-white">{app.studentDetails.category} ({app.studentDetails.casteName || '—'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">मोबाइल नंबर</span>
                    <span className="font-mono font-semibold text-white">{app.studentDetails.whatsappMobile}</span>
                  </div>
                </div>

                {/* Teacher Remarks if available */}
                {app.teacherRemarks && (
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-xs">
                    <span className="font-bold text-amber-300">शिक्षक टिप्पणी (Teacher Remarks):</span>
                    <p className="text-amber-200/90 mt-1">{app.teacherRemarks}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-400">
                    {app.status === 'submitted' && '📌 आवेदन की जाँच विद्यालय के शिक्षकों द्वारा की जा रही है।'}
                    {app.status === 'approved' && '🎉 बधाई! आपका प्रवेश आवेदन विद्यालय द्वारा स्वीकृत कर लिया गया है।'}
                    {app.status === 'draft' && '⚠️ ड्राफ्ट सुरक्षित है। कृपया सभी विवरण भर कर जमा करें।'}
                  </div>

                  <div className="flex items-center gap-2">
                    {app.status === 'draft' ? (
                      <button
                        onClick={() => onStartAdmission(app.targetClass, app)}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Continue Draft
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenPrint(app)}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print / View Form
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
