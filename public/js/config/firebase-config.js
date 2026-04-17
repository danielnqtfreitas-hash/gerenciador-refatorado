
// Importações modulares das bibliotecas Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    onSnapshot, 
    updateDoc, 
    addDoc, 
    deleteDoc, 
    setDoc, 
    orderBy, 
    limit, 
    serverTimestamp,
    increment,
    runTransaction,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { 
    getMessaging, 
    getToken, 
    onMessage 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// SUAS CREDENCIAIS REAIS EXTRAÍDAS DO ORIGINAL
const firebaseConfig = {
    apiKey: "AIzaSyB-vRTzO3e2S0N9_F8o-6Y-VlTRfZVw", // Chave original preservada
    authDomain: "vitrine-online-941f6.firebaseapp.com",
    projectId: "vitrine-online-941f6",
    storageBucket: "vitrine-online-941f6.firebasestorage.app",
    messagingSenderId: "1055536336441",
    appId: "1:1055536336441:web:44754770007204620f5c15"
};

// Inicialização das Instâncias
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

// Exportamos as instâncias e todas as funções necessárias para os módulos
export { 
    db, auth, storage, messaging,
    // Firestore
    doc, getDoc, collection, query, where, onSnapshot, updateDoc, addDoc, deleteDoc, setDoc, orderBy, limit, serverTimestamp, increment, runTransaction, writeBatch,
    // Auth
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    // Storage
    ref, uploadBytes, getDownloadURL, deleteObject,
    // Messaging
    getToken, onMessage
};

// Mantemos as variáveis no objeto window apenas para compatibilidade
// com funções que ainda podem estar a tentar ler do escopo global
window.db = db;
window.auth = auth;
