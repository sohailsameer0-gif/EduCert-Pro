import { AppData } from './types';

export const DEFAULT_DATA: AppData = {
  activeTemplate: 'classic', // Default template
  appTheme: 'light', // Default theme
  institute: {
    name: "Pakistan Institute of Technical Skills",
    address: "Office 104, 1st Floor, Arfa Software Technology Park, Ferozepur Road, Lahore, Pakistan",
    phone: "+92 321 1234567",
    email: "info@pits.edu.pk",
    website: "www.pits.edu.pk",
    logo: null,
    seal: null,
    badge: null,
    signature: null,
  },
  courses: [
    { id: 'c1', name: 'Certified Web Development (MERN Stack)' },
    { id: 'c2', name: 'Graphic Design & Freelancing' },
    { id: 'c3', name: 'Digital Marketing & SEO' },
    { id: 'c4', name: 'Amazon Virtual Assistant (VA)' },
    { id: 'c5', name: 'CIT (Certificate in Information Technology)' },
  ],
  durations: [
    { id: 'd1', label: '3 Months' },
    { id: 'd2', label: '6 Months' },
    { id: 'd3', label: '1 Year Diploma' },
    { id: 'd4', label: '2 Months Short Course' },
  ],
  types: [
    { 
      id: 't1', 
      label: 'Course Completion', 
      templateTitle: 'CERTIFICATE OF ACHIEVEMENT',
      description: 'This is to certify that Mr./Ms. {{student}}, Son/Daughter of {{father}}, has successfully completed the professional training course in "{{course}}". The training duration was {{duration}}, commencing from {{startDate}} to {{endDate}}. The student has demonstrated excellent performance, dedication, and technical proficiency throughout the program. We wish them success in their future endeavors.'
    },
    { 
      id: 't2', 
      label: 'Experience Certificate', 
      templateTitle: 'EXPERIENCE CERTIFICATE',
      description: 'To Whom It May Concern: This is to certify that {{student}} (S/O {{father}}) has worked with us as a professional in the field of "{{course}}". During the tenure from {{startDate}} to {{endDate}}, they showed great enthusiasm and a professional attitude towards their responsibilities. We appreciate their contribution and wish them the best of luck.'
    },
    { 
      id: 't3', 
      label: 'Training Certificate', 
      templateTitle: 'TRAINING CERTIFICATE',
      description: 'We are pleased to certify that {{student}}, S/O {{father}}, has successfully participated in and completed the intensive training program for "{{course}}". Held from {{startDate}} to {{endDate}}, this {{duration}} program covered all essential modules. The candidate met all the required standards of the institute.'
    },
    { 
      id: 't4', 
      label: 'Appreciation', 
      templateTitle: 'CERTIFICATE OF APPRECIATION',
      description: 'This certificate is proudly awarded to {{student}} for their outstanding performance and dedication shown during the "{{course}}" ({{duration}}). Your hard work from {{startDate}} to {{endDate}} has been exemplary and is highly appreciated by the management.'
    },
    { 
      id: 't5', 
      label: 'Diploma', 
      templateTitle: 'PROFESSIONAL DIPLOMA',
      description: 'This is to certify that {{student}}, bearing Certificate No. {{certNo}}, has fulfilled all the academic and practical requirements for the {{duration}} Diploma in "{{course}}". The session was conducted from {{startDate}} to {{endDate}}. The candidate has passed with distinction.'
    },
  ]
};

export const STORAGE_KEY = 'certigen_data_v2';
export const USERS_KEY = 'certigen_users_v1';

export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite food?",
  "What city were you born in?"
];