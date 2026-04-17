// public/js/app.js - O Cérebro do Sistema
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Importamos a função que constrói o visual do dashboard
import { renderDashboard } from './dashboard.js';

// 1. Configuração extraída do seu index (33).html
const firebaseConfig = {
    apiKey: "AIzaSyAs-vC7O_N4F2-hS2x3p2f4W1g5H6j7L8k",
    authDomain: "vitrine-online-ba030.firebaseapp.com",
    projectId: "vitrine-online-ba030",
    storageBucket: "vitrine-online-ba030.appspot.com",
    messagingSenderId: "518334861257",
    appId: "1:518334861257:web:865615d5e305e608064972"
};

// Inicialização das instâncias
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Elementos Globais
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('loginForm');

// 2. Lógica de Login Profissional
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const btn = e.target.querySelector('button');

        btn.disabled = true;
        btn.innerHTML = '<span class="animate-pulse">A validar acesso...</span>';

        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Erro:", error);
            Swal.fire({
                icon: 'error',
                title: 'Acesso Negado',
                text: 'E-mail ou senha incorretos.',
                confirmButtonColor: '#6366f1'
            });
            btn.disabled = false;
            btn.innerHTML = 'Entrar no Painel <i data-lucide="arrow-right" class="w-4 h-4"></i>';
            lucide.createIcons();
        }
    });
}

// 3. O "Watchdog" de Estado (Garante que o tutorial apareça após login)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Esconde login e monta o painel
        authScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        
        // Constrói toda a interface (Tutorial, Menu, etc)
        renderDashboard(); 
        
        console.log("Sessão ativa:", user.email);
    } else {
        // Volta para o login
        authScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
});

// 4. Funções Globais (Acessíveis pelo HTML)
window.logoutSystem = async () => {
    const confirm = await Swal.fire({
        title: 'Deseja sair?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sair agora',
        cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
        await signOut(auth);
    }
};

// Exportamos as instâncias para serem usadas no products.js e store.js
export { auth, db };
