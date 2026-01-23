import { AppData, UserProfile } from '../types';
import { DEFAULT_DATA, STORAGE_KEY, USERS_KEY } from '../constants';

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
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

export const saveUser = (user: UserProfile): boolean => {
  const users = getUsers();
  if (users.some(u => u.email === user.email)) {
    return false; // User exists
  }
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