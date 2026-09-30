import React, { useState, useEffect } from 'react';
import { db, doc, setDoc, collection, addDoc, handleFirestoreError, OperationType } from '../../lib/firebase';
import { AdmissionApplication, UserProfile } from '../../types';
import {
  FileText,
  User,
  Home,
  GraduationCap,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  AlertCircle,
  Printer,
  Sparkles,
  Camera
} from 'lucide-react';

interface AdmissionWizardProps {
  user: UserProfile;
  initialClass?: '9' | '10' | '11' | '12';
  existingDraft?: AdmissionApplication | null;
  onSuccess: (application: AdmissionApplication) => void;
  onClose: () => void;
  onOpenPrint: (app: AdmissionApplication) => void;
}

export const AdmissionWizard: React.FC<AdmissionWizardProps> = ({
  user,
  initialClass = '9',
  existingDraft,
  onSuccess,
  onClose,
  onOpenPrint,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);

  // Form State initialized from existingDraft or default
  const [formData, setFormData] = useState<Partial<AdmissionApplication>>(() => {
    if (existingDraft) return existingDraft;

    return {
      userId: user.uid,
      academicSession: '2026 - 2027',
      targetClass: initialClass,
      status: 'draft',
      studentDetails: {
        fullNameHindi: '',
        surnameHindi: '',
        fullNameEnglish: user.name.toUpperCase(),
        fatherNameHindi: '',
        fatherNameEnglish: '',
        motherNameHindi: '',
        motherNameEnglish: '',
        gender: 'boy',
        category: 'GEN',
        casteName: '',
        sssmid: '',
        udisePen: '',
        familyId: '',
        apaarId: '',
        aadhaarNumber: '',
        dobDigits: '',
        dobWords: '',
        whatsappMobile: user.mobile || '',
        alternateMobile: '',
        bloodGroup: '',
        height: '',
        bankAccount: '',
        bankName: '',
        branchName: '',
        ifscCode: '',
        photoUrl: '',
      },
      familyDetails: {
        fatherOccupation: 'कृषि',
        motherOccupation: 'गृहणी',
        annualIncomeDigits: '',
        annualIncomeWords: '',
        govtJobDetails: '',
        brothersCount: 0,
        sistersCount: 0,
        siblingsStudyingInSchool: '',
        guardianName: '',
        guardianRelation: '',
        guardianMobile: '',
        religion: 'हिन्दू',
        isMinority: false,
        minorityCategory: '',
        minorityPercentage: '',
        nationality: 'भारतीय',
        motherTongue: 'हिन्दी',
        isDivyang: false,
        disabilityType: '',
        disabilityPercentage: '',
        udidCardNumber: '',
        permanentVillage: 'अहमदपुर',
        permanentPost: 'खैगांव',
        permanentMohalla: '',
        permanentDistrict: 'खंडवा (Khandwa)',
        permanentPincode: '450001',
        permanentMobile: user.mobile || '',
        localGuardianName: '',
        localGuardianRelation: '',
        localGuardianAddress: '',
        localGuardianMobile: '',
      },
      academicRecord: {
        previousSchoolName: '',
        previousSchoolUdise: '',
        passedClass: String(Number(initialClass) - 1) + 'th',
        passedYear: '2025 - 2026',
        maxMarks: '600',
        obtainedMarks: '',
        percentage: '',
        grade: '',
      },
      subjectsAndSchemes: {
        targetClass: initialClass,
        stream: initialClass === '11' || initialClass === '12' ? 'Science - Mathematics' : 'General',
        chosenSubjects: ['हिन्दी', 'अंग्रेजी'],
        isBplOrApl: false,
        bplCardNumber: '',
        hasMeansMeritScholarship: false,
        hasSambalCard: false,
        sambalCardNumber: '',
        hasKarmakarCard: false,
        karmakarCardNumberAndYear: '',
        hasHomeToilet: true,
        usesHomeToilet: true,
        hasLadliLaxmi: false,
        ladliLaxmiRegNumber: '',
        isApaarGenerated: true,
        apaarNumber: '',
        hasMptaasReg: false,
        mptaasOtrNumber: '',
        nameConsistencyConfirmed: true,
      },
      documents: {},
      declarations: {
        studentDeclarationAccepted: false,
        studentDeclarationDate: new Date().toISOString().split('T')[0],
        parentDeclarationAccepted: false,
        parentName: '',
        parentDeclarationPlace: 'अहमदपुर खैगांव',
        parentDeclarationDate: new Date().toISOString().split('T')[0],
      },
    };
  });

  // Calculate percentage and grade automatically
  useEffect(() => {
    const max = parseFloat(formData.academicRecord?.maxMarks || '0');
    const obt = parseFloat(formData.academicRecord?.obtainedMarks || '0');
    if (max > 0 && obt > 0 && obt <= max) {
      const pct = ((obt / max) * 100).toFixed(2);
      let grd = 'A';
      if (+pct < 33) grd = 'F';
      else if (+pct < 45) grd = 'C';
      else if (+pct < 60) grd = 'B';
      else if (+pct < 75) grd = 'A';
      else grd = 'A+';

      setFormData((prev) => ({
        ...prev,
        academicRecord: {
          ...prev.academicRecord!,
          percentage: `${pct}%`,
          grade: grd,
        },
      }));
    }
  }, [formData.academicRecord?.obtainedMarks, formData.academicRecord?.maxMarks]);

  const updateStudentDetails = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      studentDetails: { ...prev.studentDetails!, [field]: val },
    }));
  };

  const updateFamilyDetails = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      familyDetails: { ...prev.familyDetails!, [field]: val },
    }));
  };

  const updateAcademicRecord = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      academicRecord: { ...prev.academicRecord!, [field]: val },
    }));
  };

  const updateSubjectsAndSchemes = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      subjectsAndSchemes: { ...prev.subjectsAndSchemes!, [field]: val },
    }));
  };

  const updateDocuments = (docKey: string, fileDataUri: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [docKey]: fileDataUri },
    }));
  };

  const updateDeclarations = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      declarations: { ...prev.declarations!, [field]: val },
    }));
  };

  // Compress photo / file to lightweight data URI
  const handleFileUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedUri = canvas.toDataURL('image/jpeg', 0.7);
        updateDocuments(docKey, compressedUri);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Client-side validation per step
  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      const s = formData.studentDetails;
      if (!s?.fullNameHindi?.trim() || !s?.fullNameEnglish?.trim()) {
        setErrorMsg('कृपया विद्यार्थी का पूरा नाम (हिन्दी व अंग्रेजी में) दर्ज करें।');
        return false;
      }
      if (!s?.fatherNameEnglish?.trim() || !s?.motherNameEnglish?.trim()) {
        setErrorMsg('कृपया माता एवं पिता का नाम दर्ज करें।');
        return false;
      }
      if (!s?.dobDigits) {
        setErrorMsg('कृपया विद्यार्थी की जन्म दिनांक दर्ज करें।');
        return false;
      }
      if (!s?.whatsappMobile || s.whatsappMobile.length < 10) {
        setErrorMsg('कृपया 10 अंकों का वैध व्हाट्सएप मोबाइल नंबर दर्ज करें।');
        return false;
      }
      if (!s?.sssmid || s.sssmid.length < 9) {
        setErrorMsg('कृपया 9 अंकों की समग्र आईडी (SSSMID) दर्ज करें।');
        return false;
      }
      if (!s?.familyId || s.familyId.length < 8) {
        setErrorMsg('कृपया 8 अंकों की परिवार आईडी दर्ज करें।');
        return false;
      }
      if (!s?.aadhaarNumber || s.aadhaarNumber.length < 12) {
        setErrorMsg('कृपया 12 अंकों का आधार नंबर दर्ज करें।');
        return false;
      }
      if (!s?.bankAccount || !s?.ifscCode) {
        setErrorMsg('कृपया राष्ट्रीयकृत बैंक का खाता नंबर एवं IFSC कोड दर्ज करें।');
        return false;
      }
    } else if (currentStep === 2) {
      const f = formData.familyDetails;
      if (!f?.annualIncomeDigits) {
        setErrorMsg('कृपया परिवार की वार्षिक आय दर्ज करें।');
        return false;
      }
      if (!f?.permanentVillage || !f?.permanentPincode) {
        setErrorMsg('कृपया निवास का स्थायी पता एवं पिनकोड दर्ज करें।');
        return false;
      }
    } else if (currentStep === 3) {
      const a = formData.academicRecord;
      if (!a?.previousSchoolName || !a?.obtainedMarks) {
        setErrorMsg('कृपया पिछले विद्यालय का नाम एवं प्राप्तांक दर्ज करें।');
        return false;
      }
    } else if (currentStep === 4) {
      const d = formData.declarations;
      if (!d?.studentDeclarationAccepted) {
        setErrorMsg('कृपया विद्यार्थी घोषणा पत्र (Student Declaration) स्वीकार करें।');
        return false;
      }
      if (!d?.parentDeclarationAccepted) {
        setErrorMsg('कृपया पिता/पालक का घोषणा पत्र (Parent Declaration) स्वीकार करें।');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Progress as Draft
  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSaveSuccessMsg(null);

      const appId = formData.id || `draft_${user.uid}_${formData.targetClass}`;
      const payload: AdmissionApplication = {
        ...(formData as AdmissionApplication),
        id: appId,
        userId: user.uid,
        status: 'draft',
        applicationId: formData.applicationId || `DRAFT-${formData.targetClass}-${Date.now().toString().slice(-4)}`,
        updatedAt: new Date().toISOString(),
        submittedAt: formData.submittedAt || new Date().toISOString(),
      };

      await setDoc(doc(db, 'admissions', appId), payload);
      setFormData(payload);
      setSaveSuccessMsg('ड्राफ्ट सफलतापूर्वक सुरक्षित किया गया (Draft saved)!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'admissions');
    } finally {
      setLoading(false);
    }
  };

  // Final Form Submission
  const handleSubmitApplication = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      // Unique Application ID: e.g. GHSS-2026-9-0142
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedAppId = `GHSS-2026-${formData.targetClass}-${randomSuffix}`;
      const docId = `app_${user.uid}_${Date.now()}`;

      const finalApplication: AdmissionApplication = {
        ...(formData as AdmissionApplication),
        id: docId,
        applicationId: generatedAppId,
        userId: user.uid,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to Cloud Firestore
      await setDoc(doc(db, 'admissions', docId), finalApplication);

      // 2. Sync to Google Sheets via secure server endpoint (Non-sensitive minimal info)
      try {
        await fetch('/api/sheets/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: finalApplication }),
        });
      } catch (sheetsErr) {
        console.error('Sheets auto-sync logged in background');
      }

      // 3. Trigger Teacher Notification in Firestore
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientUid: 'teachers',
          title: `New Admission Application: ${finalApplication.studentDetails.fullNameEnglish}`,
          message: `Class ${finalApplication.targetClass} admission form submitted. App ID: ${generatedAppId}.`,
          type: 'admission_submitted',
          read: false,
          createdAt: new Date().toISOString(),
          link: docId,
        });
      } catch (notifErr) {
        console.error('Notification log error:', notifErr);
      }

      setSubmittedApp(finalApplication);
      onSuccess(finalApplication);
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg('आवेदन पत्र जमा करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  if (submittedApp) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
        <div className="w-full max-w-xl p-8 text-center bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl text-slate-100">
          <div className="inline-flex p-4 mb-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            प्रवेश आवेदन सफलतापूर्वक जमा हुआ!
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            Government Higher Secondary School, Ahamdpur Khaigaon
          </p>

          <div className="p-4 mb-6 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
              Your Application ID (आवेदन क्रमांक)
            </div>
            <div className="text-2xl font-mono font-bold text-cyan-400">
              {submittedApp.applicationId}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Class: {submittedApp.targetClass}th | Session: {submittedApp.academicSession}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            कृपया इस आवेदन पत्र को प्रिंट या डाउनलोड करके रखें तथा मूल टी.सी. एवं आवश्यक प्रमाण-पत्रों की छायाप्रति के साथ विद्यालय कार्यालय में सत्यापन हेतु प्रस्तुत करें।
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onOpenPrint(submittedApp)}
              className="flex items-center justify-center gap-2 py-3 px-6 font-semibold text-sm rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-900/40 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Download Form (प्रिंट निकालें)
            </button>
            <button
              onClick={onClose}
              className="py-3 px-6 font-semibold text-sm rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              सत्र 2026 - 2027 • प्रवेश आवेदन पत्र
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (खण्डवा)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'विद्यार्थी विवरण', icon: User },
              { num: 2, label: 'पारिवारिक व पता', icon: Home },
              { num: 3, label: 'शैक्षणिक व विषय', icon: GraduationCap },
              { num: 4, label: 'दस्तावेज व घोषणा', icon: Upload },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < step || validateStep(step)) setStep(s.num);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                      : isDone
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">Step {s.num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error / Save Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 flex items-center gap-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-xl shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {saveSuccessMsg && (
          <div className="mx-6 mt-4 p-3 flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl shrink-0">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* ================= STEP 1: STUDENT INFORMATION ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
                📌 <b>कार्यालयीन निर्देश (Page 1):</b> आवेदन पत्र को हिन्दी में साफ-स्वच्छ अक्षरों में भरें तथा अंग्रेजी में Capital अक्षरों में लिखें। छात्र व माता-पिता के नाम से पहले Mr., Shri, Ku., Smt. न लिखें।
              </div>

              {/* Target Class Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    प्रवेश कक्षा (Select Admission Class) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.targetClass}
                    onChange={(e) => {
                      const c = e.target.value as any;
                      setFormData((p) => ({
                        ...p,
                        targetClass: c,
                        subjectsAndSchemes: { ...p.subjectsAndSchemes!, targetClass: c },
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="9">कक्षा 9वीं (Class 9th)</option>
                    <option value="10">कक्षा 10वीं (Class 10th)</option>
                    <option value="11">कक्षा 11वीं (Class 11th)</option>
                    <option value="12">कक्षा 12वीं (Class 12th)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    शैक्षणिक सत्र (Academic Session)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.academicSession}
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400"
                  />
                </div>
              </div>

              {/* 1. Student Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    1. विद्यार्थी का पूरा नाम (हिन्दी में) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentDetails?.fullNameHindi}
                    onChange={(e) => updateStudentDetails('fullNameHindi', e.target.value)}
                    placeholder="जैसे: राहुल"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    सरनेम (हिन्दी में) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentDetails?.surnameHindi}
                    onChange={(e) => updateStudentDetails('surnameHindi', e.target.value)}
                    placeholder="जैसे: सूर्यवंशी"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name of Student (IN CAPITAL ENGLISH LETTERS) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentDetails?.fullNameEnglish}
                  onChange={(e) => updateStudentDetails('fullNameEnglish', e.target.value.toUpperCase())}
                  placeholder="e.g. RAHUL SURYAVANSHI"
                  className="w-full px-3.5 py-2 font-mono tracking-wider bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 focus:border-cyan-500 uppercase"
                />
              </div>

              {/* 2 & 3: Parents Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    2. पिता का नाम (हिन्दी में) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentDetails?.fatherNameHindi}
                    onChange={(e) => updateStudentDetails('fatherNameHindi', e.target.value)}
                    placeholder="पिता का नाम"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Father's Name (IN CAPITAL LETTERS) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentDetails?.fatherNameEnglish}
                    onChange={(e) => updateStudentDetails('fatherNameEnglish', e.target.value.toUpperCase())}
                    placeholder="FATHER'S NAME"
                    className="w-full px-3 py-2 font-mono tracking-wide bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    3. माता का नाम (हिन्दी में) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentDetails?.motherNameHindi}
                    onChange={(e) => updateStudentDetails('motherNameHindi', e.target.value)}
                    placeholder="माता का नाम"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mother's Name (IN CAPITAL LETTERS) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentDetails?.motherNameEnglish}
                    onChange={(e) => updateStudentDetails('motherNameEnglish', e.target.value.toUpperCase())}
                    placeholder="MOTHER'S NAME"
                    className="w-full px-3 py-2 font-mono tracking-wide bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>

              {/* 4, 5, 6: Gender, Category, Caste */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    4. लिंग (Gender) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={formData.studentDetails?.gender === 'boy'}
                        onChange={() => updateStudentDetails('gender', 'boy')}
                      />
                      <span>बालक (Boy)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={formData.studentDetails?.gender === 'girl'}
                        onChange={() => updateStudentDetails('gender', 'girl')}
                      />
                      <span>बालिका (Girl)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    5. जाति का वर्ग (Category) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.studentDetails?.category}
                    onChange={(e) => updateStudentDetails('category', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  >
                    <option value="GEN">GEN (सामान्य)</option>
                    <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                    <option value="SC">SC (अनुसूचित जाति)</option>
                    <option value="ST">ST (अनुसूचित जनजाति)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    6. जाति का नाम (Subcaste)
                  </label>
                  <input
                    type="text"
                    value={formData.studentDetails?.casteName}
                    onChange={(e) => updateStudentDetails('casteName', e.target.value)}
                    placeholder="जैसे: राजपूत, गुर्जर आदि"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 7, 8, 9, 10, 11: Government IDs Grid */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  पहचान एवं शासन आईडी विवरण (Government IDs & SSSMID)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      7. विद्यार्थी की SSSMID (9 Digits) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={9}
                      value={formData.studentDetails?.sssmid}
                      onChange={(e) => updateStudentDetails('sssmid', e.target.value.replace(/\D/g, ''))}
                      placeholder="9-digit SSSMID"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      8. UDISE PEN Number (11 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.studentDetails?.udisePen}
                      onChange={(e) => updateStudentDetails('udisePen', e.target.value.replace(/\D/g, ''))}
                      placeholder="11-digit PEN"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      9. परिवार आईडी (8 Digits) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={formData.studentDetails?.familyId}
                      onChange={(e) => updateStudentDetails('familyId', e.target.value.replace(/\D/g, ''))}
                      placeholder="8-digit Family ID"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      10. अपार आईडी (APAAR ID, 12 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.studentDetails?.apaarId}
                      onChange={(e) => updateStudentDetails('apaarId', e.target.value.replace(/\D/g, ''))}
                      placeholder="12-digit APAAR ID"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      11. विद्यार्थी आधार नंबर (12 Digits) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.studentDetails?.aadhaarNumber}
                      onChange={(e) => updateStudentDetails('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="12-digit Aadhaar"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      14 & 15. ब्लड ग्रुप एवं ऊँचाई
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.studentDetails?.bloodGroup}
                        onChange={(e) => updateStudentDetails('bloodGroup', e.target.value)}
                        className="w-1/2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="">Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="O+">O+</option>
                        <option value="AB+">AB+</option>
                        <option value="A-">A-</option>
                        <option value="B-">B-</option>
                        <option value="O-">O-</option>
                        <option value="AB-">AB-</option>
                      </select>
                      <input
                        type="text"
                        placeholder="ऊँचाई (cm)"
                        value={formData.studentDetails?.height}
                        onChange={(e) => updateStudentDetails('height', e.target.value)}
                        className="w-1/2 px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 12. DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    12. जन्म दिनांक (अंकों में - Date of Birth) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.studentDetails?.dobDigits}
                    onChange={(e) => updateStudentDetails('dobDigits', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    जन्म दिनांक (शब्दों में)
                  </label>
                  <input
                    type="text"
                    value={formData.studentDetails?.dobWords}
                    onChange={(e) => updateStudentDetails('dobWords', e.target.value)}
                    placeholder="जैसे: नौ सितम्बर दो हजार बारह"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 13. Mobile Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    13. व्हाट्सएप मोबा. नंबर (WhatsApp Mobile) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.studentDetails?.whatsappMobile}
                    onChange={(e) => updateStudentDetails('whatsappMobile', e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit WhatsApp number"
                    className="w-full px-3 py-2 font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    अन्य मोबाइल नंबर (Alternate Mobile)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.studentDetails?.alternateMobile}
                    onChange={(e) => updateStudentDetails('alternateMobile', e.target.value.replace(/\D/g, ''))}
                    placeholder="Optional 10-digit number"
                    className="w-full px-3 py-2 font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 16. Bank Details */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  16. विद्यार्थी का राष्ट्रीयकृत बैंक खाता विवरण (Nationalized Bank Details)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      बैंक खाता नंबर (Account Number) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.studentDetails?.bankAccount}
                      onChange={(e) => updateStudentDetails('bankAccount', e.target.value.replace(/\s/g, ''))}
                      placeholder="Bank account number"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      बैंक का IFSC Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.studentDetails?.ifscCode}
                      onChange={(e) => updateStudentDetails('ifscCode', e.target.value.toUpperCase())}
                      placeholder="e.g. BKID0002516"
                      className="w-full px-3 py-2 font-mono uppercase bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      बैंक का नाम (Bank Name)
                    </label>
                    <input
                      type="text"
                      value={formData.studentDetails?.bankName}
                      onChange={(e) => updateStudentDetails('bankName', e.target.value)}
                      placeholder="जैसे: बैंक ऑफ इंडिया / SBI"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      शाखा का नाम (Branch Name)
                    </label>
                    <input
                      type="text"
                      value={formData.studentDetails?.branchName}
                      onChange={(e) => updateStudentDetails('branchName', e.target.value)}
                      placeholder="जैसे: अहमदपुर खैगांव"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: FAMILY, OCCUPATION & ADDRESS ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
                📌 <b>पारिवारिक एवं निवास विवरण (Page 2):</b> कृपया माता-पिता का व्यवसाय, वार्षिक आय, भाई-बहन तथा स्थायी निवास का पूर्ण पता दर्ज करें।
              </div>

              {/* 17. Occupations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    17. पिता का व्यवसाय
                  </label>
                  <select
                    value={formData.familyDetails?.fatherOccupation}
                    onChange={(e) => updateFamilyDetails('fatherOccupation', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="कृषि">1. कृषि (Agriculture)</option>
                    <option value="मजदूरी">2. मजदूरी (Labour)</option>
                    <option value="शासकीय सेवा">3. शासकीय सेवा (Govt Service)</option>
                    <option value="प्रायवेट">4. प्रायवेट (Private Job)</option>
                    <option value="स्वयं का व्यवसाय">5. स्वयं का व्यवसाय (Business)</option>
                    <option value="अन्य">6. अन्य (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    माता का व्यवसाय
                  </label>
                  <select
                    value={formData.familyDetails?.motherOccupation}
                    onChange={(e) => updateFamilyDetails('motherOccupation', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="गृहणी">1. गृहणी (Housewife)</option>
                    <option value="मजदूरी">2. मजदूरी (Labour)</option>
                    <option value="कृषि">3. कृषि (Agriculture)</option>
                    <option value="शासकीय सेवा">4. शासकीय सेवा (Govt Service)</option>
                    <option value="प्रायवेट">5. प्रायवेट (Private Job)</option>
                    <option value="अन्य">6. अन्य (Other)</option>
                  </select>
                </div>
              </div>

              {/* 18 & 19. Income & Govt Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    18. परिवार की वार्षिक आय (अंकों में ₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.familyDetails?.annualIncomeDigits}
                    onChange={(e) => updateFamilyDetails('annualIncomeDigits', e.target.value)}
                    placeholder="जैसे: 25000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    वार्षिक आय (शब्दों में)
                  </label>
                  <input
                    type="text"
                    value={formData.familyDetails?.annualIncomeWords}
                    onChange={(e) => updateFamilyDetails('annualIncomeWords', e.target.value)}
                    placeholder="जैसे: पच्चीस हजार मात्र"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  19. यदि माता/पिता शासकीय नौकरी में पदस्थ हैं तो पद एवं कार्यालय का नाम
                </label>
                <input
                  type="text"
                  value={formData.familyDetails?.govtJobDetails}
                  onChange={(e) => updateFamilyDetails('govtJobDetails', e.target.value)}
                  placeholder="यदि लागू न हो तो खाली छोड़ें"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* 20. Siblings count */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  20. विद्यार्थी के भाई/बहनों की संख्या (स्वयं को छोड़कर)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">भाई की संख्या</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.familyDetails?.brothersCount}
                      onChange={(e) => updateFamilyDetails('brothersCount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">बहन की संख्या</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.familyDetails?.sistersCount}
                      onChange={(e) => updateFamilyDetails('sistersCount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">कुल संख्या</label>
                    <input
                      type="text"
                      disabled
                      value={(formData.familyDetails?.brothersCount || 0) + (formData.familyDetails?.sistersCount || 0)}
                      className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    विद्यालय में अध्ययनरत भाई/बहनों के नाम
                  </label>
                  <input
                    type="text"
                    value={formData.familyDetails?.siblingsStudyingInSchool}
                    onChange={(e) => updateFamilyDetails('siblingsStudyingInSchool', e.target.value)}
                    placeholder="यदि विद्यालय में कोई भाई/बहन पढ़ रहे हैं तो नाम लिखें"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* 22 & 23: Religion, Nationality, Mother tongue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">22. धर्म (Religion)</label>
                  <input
                    type="text"
                    value={formData.familyDetails?.religion}
                    onChange={(e) => updateFamilyDetails('religion', e.target.value)}
                    placeholder="हिन्दू / अन्य"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">23. राष्ट्रीयता</label>
                  <input
                    type="text"
                    value={formData.familyDetails?.nationality}
                    onChange={(e) => updateFamilyDetails('nationality', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">मातृभाषा</label>
                  <input
                    type="text"
                    value={formData.familyDetails?.motherTongue}
                    onChange={(e) => updateFamilyDetails('motherTongue', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* 24 & 25: Disability */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    24. क्या विद्यार्थी दिव्यांग (विशेष आवश्यकता वाले) हैं?
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="divyang"
                        checked={formData.familyDetails?.isDivyang === true}
                        onChange={() => updateFamilyDetails('isDivyang', true)}
                      />
                      <span>हाँ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="divyang"
                        checked={formData.familyDetails?.isDivyang === false}
                        onChange={() => updateFamilyDetails('isDivyang', false)}
                      />
                      <span>नहीं</span>
                    </label>
                  </div>
                </div>

                {formData.familyDetails?.isDivyang && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="निःशक्तता का प्रकार"
                      value={formData.familyDetails?.disabilityType}
                      onChange={(e) => updateFamilyDetails('disabilityType', e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="प्रतिशत (%)"
                      value={formData.familyDetails?.disabilityPercentage}
                      onChange={(e) => updateFamilyDetails('disabilityPercentage', e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="UDID कार्ड नंबर"
                      value={formData.familyDetails?.udidCardNumber}
                      onChange={(e) => updateFamilyDetails('udidCardNumber', e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 26. Permanent Address */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  26. निवास का स्थायी पता (Permanent Address) <span className="text-rose-400">*</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">ग्राम / शहर <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={formData.familyDetails?.permanentVillage}
                      onChange={(e) => updateFamilyDetails('permanentVillage', e.target.value)}
                      placeholder="ग्राम"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">पोस्ट</label>
                    <input
                      type="text"
                      value={formData.familyDetails?.permanentPost}
                      onChange={(e) => updateFamilyDetails('permanentPost', e.target.value)}
                      placeholder="पोस्ट"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">मोहल्ला / वार्ड</label>
                    <input
                      type="text"
                      value={formData.familyDetails?.permanentMohalla}
                      onChange={(e) => updateFamilyDetails('permanentMohalla', e.target.value)}
                      placeholder="मोहल्ला"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">जिला</label>
                    <input
                      type="text"
                      value={formData.familyDetails?.permanentDistrict}
                      onChange={(e) => updateFamilyDetails('permanentDistrict', e.target.value)}
                      placeholder="जिला (खण्डवा)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">पिनकोड <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.familyDetails?.permanentPincode}
                      onChange={(e) => updateFamilyDetails('permanentPincode', e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit PIN"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">संपर्क मोबाइल नंबर</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.familyDetails?.permanentMobile}
                      onChange={(e) => updateFamilyDetails('permanentMobile', e.target.value.replace(/\D/g, ''))}
                      placeholder="Mobile"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ACADEMICS & SCHEMES ================= */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
                📌 <b>गत वर्ष परीक्षा विवरण एवं शासकीय योजनाएं (Page 2 & 3):</b> पिछले वर्ष की उत्तीर्ण परीक्षा तथा लागू छात्रवृत्ति व संबल/कर्मकार योजनाओं का विवरण दर्ज करें।
              </div>

              {/* 28. Previous Year Exam Details */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  28. गत वर्ष उत्तीर्ण परीक्षा का विवरण (Previous Qualifying Examination)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      जिस संस्था से परीक्षा उत्तीर्ण की उसका नाम <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.academicRecord?.previousSchoolName}
                      onChange={(e) => updateAcademicRecord('previousSchoolName', e.target.value)}
                      placeholder="जैसे: सरस्वती शिशु मंदिर / शासकीय माध्यमिक शाला"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      संस्था का डाईस कोड (UDISE Code)
                    </label>
                    <input
                      type="text"
                      value={formData.academicRecord?.previousSchoolUdise}
                      onChange={(e) => updateAcademicRecord('previousSchoolUdise', e.target.value)}
                      placeholder="11-digit UDISE"
                      className="w-full px-3 py-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">उत्तीर्ण कक्षा</label>
                    <input
                      type="text"
                      value={formData.academicRecord?.passedClass}
                      onChange={(e) => updateAcademicRecord('passedClass', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">उत्तीर्ण वर्ष</label>
                    <input
                      type="text"
                      value={formData.academicRecord?.passedYear}
                      onChange={(e) => updateAcademicRecord('passedYear', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">पूर्णांक (Max Marks)</label>
                    <input
                      type="number"
                      value={formData.academicRecord?.maxMarks}
                      onChange={(e) => updateAcademicRecord('maxMarks', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">प्राप्तांक (Obtained) <span className="text-rose-400">*</span></label>
                    <input
                      type="number"
                      value={formData.academicRecord?.obtainedMarks}
                      onChange={(e) => updateAcademicRecord('obtainedMarks', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-semibold text-cyan-300 pt-1">
                  <span>प्रतिशत: {formData.academicRecord?.percentage || '0%'}</span>
                  <span>ग्रेड: {formData.academicRecord?.grade || '—'}</span>
                </div>
              </div>

              {/* 30. Subject & Stream Choices */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  30. संकाय एवं विषय जो लेना चाहते हैं (Stream & Subject Selection)
                </div>

                {(formData.targetClass === '11' || formData.targetClass === '12') ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        संकाय (Stream for Class 11th/12th) <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.subjectsAndSchemes?.stream}
                        onChange={(e) => updateSubjectsAndSchemes('stream', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="Science - Mathematics">Science - Mathematics (PCM)</option>
                        <option value="Science - Biology">Science - Biology (PCB)</option>
                        <option value="Arts">Arts (कला संकाय - History, Pol Sci, Geo, Economics)</option>
                        <option value="Commerce">Commerce (वाणिज्य संकाय)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300">
                    कक्षा {formData.targetClass}वीं के लिए म.प्र. बोर्ड के अनिवार्य विषय: हिन्दी, अंग्रेजी, संस्कृत, गणित, विज्ञान, सामाजिक विज्ञान।
                  </div>
                )}
              </div>

              {/* 31 to 38. Government Schemes (Page 3) */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  सरकारी योजनाएं व पात्रता (Welfare Schemes Eligibility)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* 31. BPL / APL */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>31. परिवार BPL/APL/अन्त्योदय कार्डधारी हैं?</span>
                      <input
                        type="checkbox"
                        checked={formData.subjectsAndSchemes?.isBplOrApl}
                        onChange={(e) => updateSubjectsAndSchemes('isBplOrApl', e.target.checked)}
                      />
                    </div>
                    {formData.subjectsAndSchemes?.isBplOrApl && (
                      <input
                        type="text"
                        placeholder="पंजीयन क्रमांक"
                        value={formData.subjectsAndSchemes?.bplCardNumber}
                        onChange={(e) => updateSubjectsAndSchemes('bplCardNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                      />
                    )}
                  </div>

                  {/* 33. Sambal */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>33. संबल योजना की पात्रता है?</span>
                      <input
                        type="checkbox"
                        checked={formData.subjectsAndSchemes?.hasSambalCard}
                        onChange={(e) => updateSubjectsAndSchemes('hasSambalCard', e.target.checked)}
                      />
                    </div>
                    {formData.subjectsAndSchemes?.hasSambalCard && (
                      <input
                        type="text"
                        placeholder="संबल कार्ड क्रमांक"
                        value={formData.subjectsAndSchemes?.sambalCardNumber}
                        onChange={(e) => updateSubjectsAndSchemes('sambalCardNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                      />
                    )}
                  </div>

                  {/* 34. Karmakar */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>34. कर्मकार निर्माण कार्डधारी हैं?</span>
                      <input
                        type="checkbox"
                        checked={formData.subjectsAndSchemes?.hasKarmakarCard}
                        onChange={(e) => updateSubjectsAndSchemes('hasKarmakarCard', e.target.checked)}
                      />
                    </div>
                    {formData.subjectsAndSchemes?.hasKarmakarCard && (
                      <input
                        type="text"
                        placeholder="पंजीयन क्रमांक एवं वर्ष"
                        value={formData.subjectsAndSchemes?.karmakarCardNumberAndYear}
                        onChange={(e) => updateSubjectsAndSchemes('karmakarCardNumberAndYear', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                      />
                    )}
                  </div>

                  {/* 36. Ladli Laxmi */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>36. लाड़ली लक्ष्मी पात्रताधारी हैं?</span>
                      <input
                        type="checkbox"
                        checked={formData.subjectsAndSchemes?.hasLadliLaxmi}
                        onChange={(e) => updateSubjectsAndSchemes('hasLadliLaxmi', e.target.checked)}
                      />
                    </div>
                    {formData.subjectsAndSchemes?.hasLadliLaxmi && (
                      <input
                        type="text"
                        placeholder="पंजीयन क्रमांक एवं वर्ष"
                        value={formData.subjectsAndSchemes?.ladliLaxmiRegNumber}
                        onChange={(e) => updateSubjectsAndSchemes('ladliLaxmiRegNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                      />
                    )}
                  </div>
                </div>

                {/* 35. Toilet confirmation */}
                <div className="flex items-center gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                  <span>35. घर में शौचालय निर्मित है तथा उपयोग करते हैं:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subjectsAndSchemes?.hasHomeToilet}
                      onChange={(e) => updateSubjectsAndSchemes('hasHomeToilet', e.target.checked)}
                    />
                    <span>हाँ, निर्मित एवं उपयोगी</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: DOCUMENTS UPLOAD & DECLARATIONS ================= */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
                📌 <b>प्रमाण-पत्र एवं घोषणा पत्र (Page 3 & 4):</b> कृपया आवश्यक दस्तावेज अपलोड करें तथा विद्यार्थी व पालक घोषणा पत्र को स्वीकार करें।
              </div>

              {/* 14 Documents List from Official Paper Form */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-400">
                  आवश्यक प्रमाण-पत्र (Upload Required Documents)
                </div>
                <p className="text-[11px] text-slate-400">
                  नोट: टी.सी. की मूल प्रति एवं अन्य प्रमाण-पत्रों की प्रमाणित छायाप्रति विद्यालय में जमा करनी होगी।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'passportPhoto', label: '11. पासपोर्ट साइज फोटो (2 प्रतियाँ, नाम व दिनांक सहित)' },
                    { key: 'previousMarksheet', label: '1. विगत वर्ष परीक्षा अंकसूची (Marksheet)' },
                    { key: 'transferCertificate', label: '2. स्थानांतरण प्रमाण पत्र (T.C.)' },
                    { key: 'aadhaarCard', label: '6. आधार कार्ड (Aadhaar Card)' },
                    { key: 'samagraIdCard', label: '7. समग्र आईडी (Samagra ID)' },
                    { key: 'bankPassbook', label: '5. बैंक पासबुक (Bank Passbook)' },
                    { key: 'casteCertificate', label: '3. जाति प्रमाण पत्र (Caste Certificate, if SC/ST/OBC)' },
                    { key: 'incomeCertificate', label: '4. आय प्रमाण पत्र (Income Certificate)' },
                    { key: 'apaarCertificate', label: '12. अपार आईडी प्रमाण पत्र (APAAR ID)' },
                    { key: 'bplCard', label: '8. बी.पी.एल./ए.पी.एल. कार्ड (यदि लागू हो)' },
                  ].map((docItem) => {
                    const isUploaded = !!formData.documents?.[docItem.key as keyof typeof formData.documents];
                    return (
                      <div
                        key={docItem.key}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isUploaded
                            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="truncate text-[11px]">{docItem.label}</div>
                        <label className="cursor-pointer shrink-0">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(docItem.key, e)}
                          />
                          <span
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
                              isUploaded
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            <Camera className="w-3 h-3" />
                            {isUploaded ? 'अपलोड हुआ ✓' : 'Upload'}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* School Rules from Page 3 */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <div className="font-bold text-cyan-400">:: विद्यालय के नियम ::</div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li>विद्यार्थियों को नियमित रूप से समय पर विद्यालय आकर अध्यापन कार्य करना होगा।</li>
                  <li>कक्षा में नियमित उपस्थिति 75% से अधिक अनिवार्य है।</li>
                  <li>अनुशासनहीनता करने पर टी.सी. प्रदान कर निष्कासित किया जा सकता है।</li>
                  <li>विद्यार्थियों को त्रैमासिक, अर्द्धवार्षिक, प्री-बोर्ड व वार्षिक परीक्षाओं में बैठना अनिवार्य है।</li>
                  <li>विद्यालय में मोबाइल लाना पूर्णतः प्रतिबंधित है।</li>
                </ul>
              </div>

              {/* Student Declaration (Page 4) */}
              <div className="p-4 bg-cyan-950/20 border border-cyan-800/50 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-cyan-300">:: विद्यार्थी का घोषणा पत्र ::</div>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "मैं सत्यनिष्ठापूर्वक घोषणा करता/करती हूँ कि मेरे अभिज्ञान से आवेदन पत्र में दी गई उपरोक्त समस्त जानकारी पूर्णतः सत्य है एवं मैं शाला के सभी नियमों का पालन करने की प्रतिज्ञा करता/करती हूँ।"
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={formData.declarations?.studentDeclarationAccepted}
                    onChange={(e) => updateDeclarations('studentDeclarationAccepted', e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span>मैं (विद्यार्थी) उपरोक्त घोषणा को स्वीकार करता/करती हूँ।</span>
                </label>
              </div>

              {/* Parent Declaration (Page 4) */}
              <div className="p-4 bg-purple-950/20 border border-purple-800/50 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-purple-300">:: पिता / पालक का घोषणा पत्र ::</div>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "मैं घोषणा करता/करती हूँ कि मेरे पुत्र/पुत्री द्वारा दी गई जानकारी सत्य है। मेरा पुत्र/पुत्री शाला के समस्त नियमों का पालन करेगा/करेगी। यदि नियमों एवं अनुशासन के उल्लंघन के कारण उस पर जो भी उचित कार्यवाही की जाएगी वह मुझे मान्य होगी।"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">पिता/पालक का नाम</label>
                    <input
                      type="text"
                      value={formData.declarations?.parentName || formData.studentDetails?.fatherNameEnglish}
                      onChange={(e) => updateDeclarations('parentName', e.target.value)}
                      placeholder="पिता / पालक का नाम"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">स्थान (Place)</label>
                    <input
                      type="text"
                      value={formData.declarations?.parentDeclarationPlace}
                      onChange={(e) => updateDeclarations('parentDeclarationPlace', e.target.value)}
                      placeholder="अहमदपुर खैगांव"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={formData.declarations?.parentDeclarationAccepted}
                    onChange={(e) => updateDeclarations('parentDeclarationAccepted', e.target.checked)}
                    className="w-4 h-4 rounded text-purple-500"
                  />
                  <span>मैं (पिता/पालक) उपरोक्त घोषणा को स्वीकार करता/करती हूँ।</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 gap-3">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous (पिछला)
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft (ड्राफ्ट सुरक्षित करें)
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition"
              >
                Next (आगे बढ़ें)
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={loading}
                className="flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Final Submit (आवेदन जमा करें)'}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
