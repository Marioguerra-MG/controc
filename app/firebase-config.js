import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYLCue5FEPQIhcqfxQEyhP0fSAHRyUe_U",
  authDomain: "bdcontroc.firebaseapp.com",
  projectId: "bdcontroc",
  storageBucket: "bdcontroc.appspot.com",
  messagingSenderId: "503445294806",
  appId: "1:503445294806:web:22873177734bd829870377"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default app;
export { db };
