import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import type { SavedLesson, Subject } from '../types/index';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const saveLessonToFirestore = async (lesson: Omit<SavedLesson, 'id'>) => {
  const docRef = await addDoc(collection(db, 'lessons'), lesson);
  return docRef.id;
};

export const getLessonsFromFirestore = async (subjectFilter?: Subject | 'Tất cả') => {
  let q;
  const lessonsRef = collection(db, 'lessons');
  
  if (subjectFilter && subjectFilter !== 'Tất cả') {
    q = query(lessonsRef, where('subject', '==', subjectFilter), orderBy('createdAt', 'desc'));
  } else {
    q = query(lessonsRef, orderBy('createdAt', 'desc'));
  }

  const querySnapshot = await getDocs(q);
  const lessons: SavedLesson[] = [];
  querySnapshot.forEach((doc) => {
    lessons.push({ id: doc.id, ...doc.data() } as SavedLesson);
  });
  
  return lessons;
};

export const deleteLessonFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, 'lessons', id));
};

export const saveWordToDictionary = async (entry: any) => {
  const docRef = await addDoc(collection(db, 'dictionary'), entry);
  return docRef.id;
};
