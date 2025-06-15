
# إعداد Firebase لتطبيق المعلمين

## الخطوات المطلوبة لإعداد Firebase:

### 1. إنشاء مشروع Firebase
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "إضافة مشروع" أو "Add project"
3. أدخل اسم المشروع (مثل: teacher-performance-app)
4. اختر إعدادات Google Analytics حسب رغبتك
5. انقر على "إنشاء مشروع"

### 2. إعداد تطبيق الويب
1. في لوحة تحكم Firebase، انقر على أيقونة الويب `</>`
2. أدخل اسم التطبيق
3. انسخ تكوين Firebase المعروض

### 3. تحديث ملف التكوين
1. افتح ملف `config/firebase.ts`
2. استبدل القيم في `firebaseConfig` بالقيم من مشروعك:
```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};
```

### 4. إعداد Firestore Database
1. في لوحة Firebase، اذهب إلى "Firestore Database"
2. انقر على "إنشاء قاعدة بيانات"
3. اختر وضع الاختبار (Test mode) للبداية
4. اختر الموقع الجغرافي الأقرب

### 5. إعداد قواعد الأمان (اختياري للبداية)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالقراءة والكتابة لجميع المستخدمين (مؤقتاً للتطوير)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 6. هيكل قاعدة البيانات
سيتم إنشاء المجموعات التالية تلقائياً:

- **userProfiles**: ملفات المستخدمين الشخصية
- **performanceData**: بيانات الأداء المهني
- **alerts**: التنبيهات والمذكرات
- **comments**: التعليقات والملاحظات

### 7. الاستخدام في التطبيق
```typescript
import { useDatabase } from '@/contexts/DatabaseContext';

// في أي مكون:
const { 
  saveUserProfile, 
  performanceData, 
  saveAlert, 
  isLoading 
} = useDatabase();
```

### ملاحظات مهمة:
- تأكد من حفظ مفاتيح Firebase في مكان آمن
- لا تشارك مفاتيح API في ملفات عامة
- في الإنتاج، قم بتحديث قواعد الأمان لتكون أكثر تقييداً
- يمكنك استخدام Firebase Authentication لاحقاً لتأمين أفضل
