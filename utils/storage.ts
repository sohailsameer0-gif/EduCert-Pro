import { AppData } from '../types';
import { DEFAULT_DATA, STORAGE_KEY } from '../constants';

// We use LocalStorage for simplicity as it covers text data well. 
// Modern browsers support 5-10MB in LocalStorage which is enough for a few optimized base64 images.
// For a production heavy app, IndexedDB is preferred, but this meets the "offline" requirement perfectly.

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
