
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// تكوين Firebase - استبدل هذه القيم بقيم مشروعك الحقيقية من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCqftPH71ENlQ3zHhWKSBGH50wuely3yi0", 
  authDomain: "tdp2-demo-718fe.firebaseapp.com", // استبدل your-project-id باسم مشروعك
  projectId: "tdp2-demo-718fe", // استبدل your-project-id باسم مشروعك
  storageBucket: "tdp2-demo-718fe.firebasestorage.app", // استبدل your-project-id باسم مشروعك
  messagingSenderId: "801606306636", // ضع هنا Messaging Sender ID
  appId: "1:801606306636:web:76ebc29b13e261d7379de9" // ضع هنا App ID
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
