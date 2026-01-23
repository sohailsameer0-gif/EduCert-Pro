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

export interface UserProfile {
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

export interface AppData {
  institute: InstituteDetails;
  courses: Course[];
  durations: Duration[];
  types: CertificateType[];
  activeTemplate: 'classic' | 'modern' | 'corporate' | 'elegant' | 'artistic';
  appTheme: 'light' | 'dark' | 'midnight';
}