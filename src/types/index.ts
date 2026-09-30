export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  mobile?: string;
  studentClass?: '9' | '10' | '11' | '12' | '';
  section?: string;
  rollNumber?: string;
  avatar?: string;
  createdAt: string;
}

export type AdmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'action_required';

export interface StudentPersonalDetails {
  fullNameHindi: string;
  surnameHindi: string;
  fullNameEnglish: string;
  fatherNameHindi: string;
  fatherNameEnglish: string;
  motherNameHindi: string;
  motherNameEnglish: string;
  gender: 'boy' | 'girl' | 'other';
  category: 'GEN' | 'OBC' | 'SC' | 'ST';
  casteName: string;
  sssmid: string; // 9 digits
  udisePen: string; // 11 digits
  familyId: string; // 8 digits
  apaarId: string; // 12 digits
  aadhaarNumber: string; // 12 digits
  dobDigits: string; // YYYY-MM-DD
  dobWords: string; // in Hindi words
  whatsappMobile: string; // 10 digits
  alternateMobile: string; // 10 digits
  bloodGroup: string;
  height: string;
  bankAccount: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  photoUrl?: string;
}

export interface FamilyAndDemographics {
  fatherOccupation: string;
  motherOccupation: string;
  annualIncomeDigits: string;
  annualIncomeWords: string;
  govtJobDetails?: string;
  brothersCount: number;
  sistersCount: number;
  siblingsStudyingInSchool: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianMobile?: string;
  religion: string;
  isMinority: boolean;
  minorityCategory?: string;
  minorityPercentage?: string;
  nationality: string;
  motherTongue: string;
  isDivyang: boolean;
  disabilityType?: string;
  disabilityPercentage?: string;
  udidCardNumber?: string;
  permanentVillage: string;
  permanentPost: string;
  permanentMohalla: string;
  permanentDistrict: string;
  permanentPincode: string;
  permanentMobile: string;
  localGuardianName?: string;
  localGuardianRelation?: string;
  localGuardianAddress?: string;
  localGuardianMobile?: string;
}

export interface PreviousAcademicRecord {
  previousSchoolName: string;
  previousSchoolUdise: string;
  passedClass: string;
  passedYear: string;
  maxMarks: string;
  obtainedMarks: string;
  percentage: string;
  grade: string;
}

export interface SubjectsAndSchemes {
  targetClass: '9' | '10' | '11' | '12';
  stream?: 'Science - Mathematics' | 'Science - Biology' | 'Arts' | 'Commerce' | 'General';
  chosenSubjects: string[];
  isBplOrApl: boolean;
  bplCardNumber?: string;
  hasMeansMeritScholarship: boolean;
  hasSambalCard: boolean;
  sambalCardNumber?: string;
  hasKarmakarCard: boolean;
  karmakarCardNumberAndYear?: string;
  hasHomeToilet: boolean;
  usesHomeToilet: boolean;
  hasLadliLaxmi: boolean;
  ladliLaxmiRegNumber?: string;
  isApaarGenerated: boolean;
  apaarNumber?: string;
  hasMptaasReg: boolean; // SC/ST
  mptaasOtrNumber?: string;
  nameConsistencyConfirmed: boolean;
}

export interface DocumentUploads {
  previousMarksheet?: string;
  transferCertificate?: string;
  casteCertificate?: string;
  incomeCertificate?: string;
  bankPassbook?: string;
  aadhaarCard?: string;
  samagraIdCard?: string;
  passportPhoto?: string;
  bplCard?: string;
  disabilityCertificate?: string;
  karmakarCard?: string;
  apaarCertificate?: string;
  ladliLaxmiCertificate?: string;
  sambalCertificate?: string;
}

export interface AdmissionApplication {
  id: string; // Firestore document ID
  applicationId: string; // e.g. GHSS-2026-9-0142
  userId: string;
  academicSession: string; // e.g. "2026 - 2027"
  targetClass: '9' | '10' | '11' | '12';
  status: AdmissionStatus;
  teacherRemarks?: string;
  verifiedByTeacher?: string;
  verifiedAt?: string;
  submittedAt: string;
  updatedAt: string;
  studentDetails: StudentPersonalDetails;
  familyDetails: FamilyAndDemographics;
  academicRecord: PreviousAcademicRecord;
  subjectsAndSchemes: SubjectsAndSchemes;
  documents: DocumentUploads;
  declarations: {
    studentDeclarationAccepted: boolean;
    studentDeclarationDate: string;
    parentDeclarationAccepted: boolean;
    parentName: string;
    parentDeclarationPlace: string;
    parentDeclarationDate: string;
  };
}

export interface QuizQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  marks?: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  class: '9' | '10' | '11' | '12';
  subject: string;
  status: 'draft' | 'published';
  date: string;
  createdBy: string;
  authorName: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientUid: string; // User UID or 'teachers'
  title: string;
  message: string;
  type: 'admission_submitted' | 'status_update' | 'new_quiz';
  read: boolean;
  createdAt: string;
  link?: string;
}
