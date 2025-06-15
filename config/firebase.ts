
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// تكوين Firebase - استبدل هذه القيم بقيم مشروعك الحقيقية من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC...", // ضع هنا API Key الخاص بمشروعك
  authDomain: "your-project-id.firebaseapp.com", // استبدل your-project-id باسم مشروعك
  projectId: "your-project-id", // استبدل your-project-id باسم مشروعك
  storageBucket: "your-project-id.appspot.com", // استبدل your-project-id باسم مشروعك
  messagingSenderId: "123456789", // ضع هنا Messaging Sender ID
  appId: "1:123456789:web:abc123def456" // ضع هنا App ID
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
