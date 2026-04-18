import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Carrega a configuração do Firebase de forma segura.
 * Tenta ler da variável global injetada pelo ambiente (Canvas/Render/GitHub).
 */
const getFirebaseConfig = () => {
    try {
        if (typeof __firebase_config !== 'undefined') {
            return typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
        }
    } catch (e) {
        console.error("Erro ao parsear __firebase_config:", e);
    }
    
    // Fallback: Substitua pelos seus dados reais se estiver a testar localmente sem variáveis de ambiente
    return {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Identificador único da aplicação/loja
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-store-id';

/**
 * Inicializa a sessão do utilizador.
 * Prioriza tokens de sessão existentes ou entra como anónimo para persistência.
 */
export async function initFirebaseStoreAuth() {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            return await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            return await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Erro crítico de Autenticação:", error);
        throw error;
    }
}
