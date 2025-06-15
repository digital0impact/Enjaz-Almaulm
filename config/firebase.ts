
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// تكوين Firebase - يجب استبدال هذه القيم بقيم مشروعك
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
