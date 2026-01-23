
export interface InstituteDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null; // Base64
  seal: string | null; // Base64
  badge: string | null; // Base64
  signature: string | null; // Base64
}

export interface Course {
  id: string;
  name: string;
}

export interface Duration {
  id: string;
  label: string;
}

export interface CertificateType {
  id: string;
  label: string;
  templateTitle: string; // e.g., "Certificate of Completion"
  description: string; // Dynamic description text
}

export interface StudentCertificateData {
  id: string;
  certificateNo: string; // Manual Certificate Number
  studentName: string;
  fatherName: string;
  courseId: string;
  durationId: string;
  typeId: string;
  orientation: 'landscape' | 'portrait';
  dateOfJoining: string;
  dateOfCompletion: string;
  issueDate: string;
}

export interface LicenseInfo {
  status: 'trial' | 'active' | 'expired';
  plan: 'free' | 'pro' | 'enterprise';
  expiryDate: string; // ISO Date
  deviceId: string;
  activationKey?: string;
}

export interface PaymentRequest {
  id: string;
  userEmail: string;
  method: 'easypaisa' | 'sadapay' | 'nayapay';
  senderName: string;
  transactionId: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface ActivationKey {
  key: string;
  generatedDate: string;
  isUsed: boolean;
  usedBy?: string;
  durationDays: number;
}

export interface UserProfile {
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  isAdmin?: boolean;       // Super Admin Flag
  isApproved: boolean;     // Approval Flag
  isBlocked?: boolean;
  license: LicenseInfo;
}

export interface AppData {
  institute: InstituteDetails;
  courses: Course[];
  durations: Duration[];
  types: CertificateType[];
  activeTemplate: 'classic' | 'modern' | 'corporate' | 'elegant' | 'artistic';
  appTheme: 'light' | 'dark' | 'midnight';
}
