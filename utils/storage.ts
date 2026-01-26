
import { AppData, UserProfile, LicenseInfo, PaymentRequest, ActivationKey } from '../types';
import { DEFAULT_DATA, STORAGE_KEY, USERS_KEY } from '../constants';

const PAYMENTS_KEY = 'edc_payments_v1';
const KEYS_KEY = 'edc_keys_v1';

// Helper to generate a mock Device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('edc_device_id');
  if (!deviceId) {
    deviceId = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('edc_device_id', deviceId);
  }
  return deviceId;
};

// Data Management
export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data:", error);
    alert("Storage full! Please try using smaller images.");
  }
};

export const getAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DATA;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load data:", error);
    return DEFAULT_DATA;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// User Management
export const getUsers = (): UserProfile[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    let users: UserProfile[] = stored ? JSON.parse(stored) : [];
    
    // SEED SUPER ADMIN if not exists
    if (!users.find(u => u.email === 'admin@educert.pro')) {
        const superAdmin: UserProfile = {
            email: 'admin@educert.pro',
            password: 'admin123', // In real app, hash this
            securityQuestion: 'Who is the admin?',
            securityAnswer: 'Me',
            isAdmin: true,
            isApproved: true,
            license: {
                status: 'active',
                plan: 'enterprise',
                expiryDate: '2099-12-31',
                deviceId: 'ADMIN-CONSOLE'
            }
        };
        users.push(superAdmin);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  } catch (error) {
    return [];
  }
};

export const saveUser = (user: UserProfile): boolean => {
  const users = getUsers();
  if (users.some(u => u.email === user.email)) {
    return false; // User exists
  }
  
  // Assign Default Trial License (Changed to 3 Days)
  const trialLicense: LicenseInfo = {
    status: 'trial',
    plan: 'free',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 Days
    deviceId: getDeviceId()
  };

  user.license = trialLicense;
  user.isApproved = false; // Default to pending
  user.isAdmin = false;
  
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const findUser = (email: string): UserProfile | undefined => {
  const users = getUsers();
  return users.find(u => u.email === email);
};

export const updateUserPassword = (email: string, newPassword: string): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.email === email);
  if (index !== -1) {
    users[index].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const updateUserLicense = (email: string, license: LicenseInfo): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.email === email);
  if (index !== -1) {
    users[index].license = license;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const updateUserStatus = (email: string, isApproved: boolean, isBlocked: boolean): void => {
    const users = getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
      users[index].isApproved = isApproved;
      users[index].isBlocked = isBlocked;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

export const deleteUser = (email: string): void => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return;
    
    let users: UserProfile[] = JSON.parse(stored);
    const initialLength = users.length;
    
    users = users.filter(u => u.email !== email);
    
    if (users.length !== initialLength) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  } catch (e) {
    console.error("Error deleting user:", e);
  }
};

export const deleteUsers = (emails: string[]): void => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return;
    
    let users: UserProfile[] = JSON.parse(stored);
    
    // Filter keeps users who are NOT in the emails array
    const newUsers = users.filter(u => !emails.includes(u.email));
    
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  } catch (e) {
    console.error("Error deleting users:", e);
  }
};

// Payment Management
export const getPayments = (): PaymentRequest[] => {
    const stored = localStorage.getItem(PAYMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const addPayment = (payment: PaymentRequest): { success: boolean, message: string } => {
    const payments = getPayments();
    
    const existingPending = payments.find(p => p.userEmail === payment.userEmail && p.status === 'pending');
    if (existingPending) {
        return { success: false, message: "You already have a pending request. Please wait for admin approval." };
    }

    const duplicateTID = payments.find(p => p.transactionId.toLowerCase() === payment.transactionId.toLowerCase());
    if (duplicateTID) {
        return { success: false, message: "This Transaction ID has already been used." };
    }

    try {
        payments.push(payment);
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
        return { success: true, message: "Payment proof submitted successfully!" };
    } catch (e) {
        return { success: false, message: "Storage full. Please use a smaller screenshot image." };
    }
};

export const updatePaymentStatus = (id: string, status: 'approved' | 'rejected') => {
    const payments = getPayments();
    const idx = payments.findIndex(p => p.id === id);
    if (idx !== -1) {
        payments[idx].status = status;
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
    }
};

export const deletePayments = (ids: string[]): void => {
    try {
        const stored = localStorage.getItem(PAYMENTS_KEY);
        if (!stored) return;
        
        let payments: PaymentRequest[] = JSON.parse(stored);
        const newPayments = payments.filter(p => !ids.includes(p.id));
        
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(newPayments));
    } catch (e) {
        console.error("Error deleting payments:", e);
    }
};

// Key Management
export const getKeys = (): ActivationKey[] => {
    const stored = localStorage.getItem(KEYS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const generateKey = (durationDays: number): string => {
    const prefix = "EDC";
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `${prefix}-${year}-${random}-${random2}`;
    
    const keys = getKeys();
    keys.push({
        key,
        generatedDate: new Date().toISOString(),
        isUsed: false,
        durationDays
    });
    localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
    return key;
};

export const validateAndUseKey = (keyString: string, userEmail: string): number | null => {
    const keys = getKeys();
    const idx = keys.findIndex(k => k.key === keyString);
    
    if (idx !== -1 && !keys[idx].isUsed) {
        keys[idx].isUsed = true;
        keys[idx].usedBy = userEmail;
        localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
        return keys[idx].durationDays;
    }
    return null;
};

export const deleteKey = (keyString: string): void => {
    let keys = getKeys();
    keys = keys.filter(k => k.key !== keyString);
    localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
};

export const deleteKeys = (keyStrings: string[]): void => {
    try {
        const stored = localStorage.getItem(KEYS_KEY);
        if (!stored) return;
        
        let keys: ActivationKey[] = JSON.parse(stored);
        const newKeys = keys.filter(k => !keyStrings.includes(k.key));
        
        localStorage.setItem(KEYS_KEY, JSON.stringify(newKeys));
    } catch (e) {
        console.error("Error deleting keys:", e);
    }
};
