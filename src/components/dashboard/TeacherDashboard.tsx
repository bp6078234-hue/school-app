import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, doc, updateDoc, addDoc, handleFirestoreError, OperationType } from '../../lib/firebase';
import { AdmissionApplication, UserProfile, AdmissionStatus } from '../../types';
import { TeacherQuizManager } from '../quiz/TeacherQuizManager';
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Printer,
  Eye,
  Search,
  Filter,
  LogOut,
  Send,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface TeacherDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenPrint: (app: AdmissionApplication) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onLogout,
  onOpenPrint,
}) => {
  const [activeTab, setActiveTab] = useState<'admissions' | 'quizzes'>('admissions');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);

  // Filters
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status Update state
  const [statusUpdate, setStatusUpdate] = useState<AdmissionStatus>('under_review');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Real-time listener for all admissions (Authorized Teacher Role)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'admissions'),
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as AdmissionApplication))
          .filter((a) => a.status !== 'draft'); // Only show submitted applications
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setApplications(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admissions');
      }
    );
    return () => unsub();
  }, []);

  const filteredApps = applications.filter((app) => {
    if (filterClass !== 'all' && app.targetClass !== filterClass) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        app.studentDetails?.fullNameEnglish?.toLowerCase().includes(q) ||
        app.studentDetails?.fullNameHindi?.includes(q) ||
        app.applicationId?.toLowerCase().includes(q) ||
        app.studentDetails?.whatsappMobile?.includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  const handleOpenInspect = (app: AdmissionApplication) => {
    setSelectedApp(app);
    setStatusUpdate(app.status);
    setRemarks(app.teacherRemarks || '');
    setUpdateMsg(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedApp) return;
    try {
      setUpdating(true);
      setUpdateMsg(null);

      await updateDoc(doc(db, 'admissions', selectedApp.id), {
        status: statusUpdate,
        teacherRemarks: remarks.trim(),
        verifiedByTeacher: user.name,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send in-app notification to student
      await addDoc(collection(db, 'notifications'), {
        recipientUid: selectedApp.userId,
        title: `Admission Status Updated: ${statusUpdate.toUpperCase()}`,
        message: remarks.trim() || `Your admission form has been marked as ${statusUpdate} by ${user.name}.`,
        type: 'status_update',
        read: false,
        createdAt: new Date().toISOString(),
      });

      setUpdateMsg('Status and remarks saved successfully!');
      setSelectedApp((prev) => (prev ? { ...prev, status: statusUpdate, teacherRemarks: remarks } : null));
    } catch (err: any) {
      console.error('Update error:', err);
      setUpdateMsg('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-2xl font-bold">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                Authorized Faculty
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (खण्डवा)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('admissions')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'admissions'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Admissions Verification Hub ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'quizzes'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Quiz Management & AI Generator
        </button>
      </div>

      {/* ================= TAB 1: ADMISSIONS HUB ================= */}
      {activeTab === 'admissions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, App ID, or mobile..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              >
                <option value="all">All Classes (सभी कक्षाएं)</option>
                <option value="9">Class 9th</option>
                <option value="10">Class 10th</option>
                <option value="11">Class 11th</option>
                <option value="12">Class 12th</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              >
                <option value="all">All Statuses (सभी स्थितियां)</option>
                <option value="submitted">Submitted (जमा हुआ)</option>
                <option value="under_review">Under Review (समीक्षाधीन)</option>
                <option value="approved">Approved (स्वीकृत)</option>
                <option value="action_required">Action Required (सुधार अपेक्षित)</option>
                <option value="rejected">Rejected (अस्वीकृत)</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          {filteredApps.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
              No matching applications found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="p-4">App ID</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Class & Stream</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 font-mono font-bold text-cyan-400">
                        {app.applicationId}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {app.studentDetails.fullNameEnglish}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.studentDetails.fullNameHindi}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                          Class {app.targetClass}th
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {app.subjectsAndSchemes?.stream || 'General'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-white">{app.studentDetails.category}</span>
                        <div className="text-[11px] text-slate-400">{app.studentDetails.casteName || '—'}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {app.studentDetails.whatsappMobile}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            app.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : app.status === 'action_required'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenInspect(app)}
                          className="py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect & Verify
                        </button>
                        <button
                          onClick={() => onOpenPrint(app)}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition inline-flex items-center gap-1"
                          title="Print official form"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: QUIZZES HUB ================= */}
      {activeTab === 'quizzes' && <TeacherQuizManager user={user} />}

      {/* ================= DETAIL INSPECTION MODAL ================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl my-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <span className="font-mono text-cyan-400 font-bold">{selectedApp.applicationId}</span>
                <h3 className="text-base font-bold text-white">
                  {selectedApp.studentDetails.fullNameEnglish} ({selectedApp.studentDetails.fullNameHindi})
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-2 space-y-5 flex-1 text-xs">
              {/* Status Update Control Box */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-3">
                <div className="text-xs font-bold text-purple-300">
                  Update Official Status & Remarks (सत्यापन व स्थिति निर्धारण)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1">Set Application Status</label>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
                    >
                      <option value="under_review">Under Review (समीक्षाधीन)</option>
                      <option value="approved">Approved (प्रवेश स्वीकृत)</option>
                      <option value="action_required">Action Required (त्रुटि सुधार हेतु निर्देश)</option>
                      <option value="rejected">Rejected (अस्वीकृत)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1">Official Remarks (टिप्पणी)</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. TC मूल प्रति जमा करें / All documents verified."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {updateMsg && <span className="text-emerald-400 text-xs">{updateMsg}</span>}
                  <button
                    onClick={handleSaveStatus}
                    disabled={updating}
                    className="ml-auto py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Decision (सत्यापित करें)'}
                  </button>
                </div>
              </div>

              {/* Full Details Review */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400">विद्यार्थी एवं पहचान विवरण</div>
                  <div>माता-पिता: <b>{selectedApp.studentDetails.motherNameEnglish}</b> & <b>{selectedApp.studentDetails.fatherNameEnglish}</b></div>
                  <div>जन्म दिनांक: <b>{selectedApp.studentDetails.dobDigits}</b> ({selectedApp.studentDetails.dobWords})</div>
                  <div>लिंग व वर्ग: <b>{selectedApp.studentDetails.gender}</b> • <b>{selectedApp.studentDetails.category}</b> ({selectedApp.studentDetails.casteName})</div>
                  <div>SSSMID: <b className="font-mono">{selectedApp.studentDetails.sssmid}</b> | परिवार ID: <b className="font-mono">{selectedApp.studentDetails.familyId}</b></div>
                  <div>UDISE PEN: <b className="font-mono">{selectedApp.studentDetails.udisePen || '—'}</b></div>
                  <div>आधार नंबर: <b className="font-mono">XXXX-XXXX-{selectedApp.studentDetails.aadhaarNumber?.slice(-4)}</b></div>
                  <div>बैंक खाता: <b className="font-mono">{selectedApp.studentDetails.bankAccount}</b> (IFSC: {selectedApp.studentDetails.ifscCode})</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400">पारिवारिक, पता एवं योजनाएं</div>
                  <div>वार्षिक आय: <b>₹{selectedApp.familyDetails.annualIncomeDigits}</b> ({selectedApp.familyDetails.fatherOccupation})</div>
                  <div>निवास पता: <b>{selectedApp.familyDetails.permanentVillage}, {selectedApp.familyDetails.permanentPost}, {selectedApp.familyDetails.permanentDistrict} ({selectedApp.familyDetails.permanentPincode})</b></div>
                  <div>पूर्व विद्यालय: <b>{selectedApp.academicRecord.previousSchoolName}</b></div>
                  <div>प्राप्तांक: <b>{selectedApp.academicRecord.obtainedMarks} / {selectedApp.academicRecord.maxMarks} ({selectedApp.academicRecord.percentage}) - ग्रेड: {selectedApp.academicRecord.grade}</b></div>
                  <div>BPL / संबल / कर्मकार: <b>{selectedApp.subjectsAndSchemes.isBplOrApl ? 'BPL ' : ''}{selectedApp.subjectsAndSchemes.hasSambalCard ? 'Sambal ' : ''}{selectedApp.subjectsAndSchemes.hasKarmakarCard ? 'Karmakar' : 'लागू नहीं'}</b></div>
                </div>
              </div>

              {/* Uploaded Documents Gallery */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-cyan-400">अपलोड किए गए दस्तावेज (Attached Documents)</div>
                {Object.keys(selectedApp.documents || {}).length === 0 ? (
                  <div className="text-slate-500">कोई डिजिटल दस्तावेज अपलोड नहीं है (No digital copies uploaded).</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedApp.documents).map(([key, dataUri]) => (
                      <div key={key} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-center">
                        <div className="w-full h-24 rounded-lg bg-black overflow-hidden flex items-center justify-center">
                          <img src={dataUri} alt={key} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate text-[10px] text-slate-300 font-semibold">{key}</div>
                        <a
                          href={dataUri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Full View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0">
              <button
                onClick={() => onOpenPrint(selectedApp)}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs"
              >
                <Printer className="w-4 h-4" /> Print Official Form
              </button>
              <button
                onClick={() => setSelectedApp(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
