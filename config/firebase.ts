
import { initializeApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// إعدادات Firebase - ستحتاج لاستبدالها بإعداداتك الخاصة
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير الخدمات
export { firestore, auth };
export default app;
