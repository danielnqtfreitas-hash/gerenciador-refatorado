// public/js/app.js

// 1. Importações do Firebase (Utilizando módulos CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Configuração do seu Projeto (Mantenha as suas chaves originais aqui)
const firebaseConfig = {
    apiKey: "AIzaSy...", // Cole aqui sua API Key original
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};

// 3. Inicialização
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 4. Elementos da Interface
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('loginForm');

/**
 * Observador de Estado: Verifica se o lojista está logado
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.email);
        showDashboard();
    } else {
        console.log("Nenhum usuário logado.");
        showLogin();
    }
});

/**
 * Lógica de Login
 */
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('button');

        // Feedback visual
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Autenticando...";

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            Swal.fire({
                icon: 'success',
                title: 'Bem-vindo!',
                text: 'Acesso autorizado.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Erro no login:", error.code);
            let mensagem = "Erro ao entrar. Verifique os dados.";
            
            if (error.code === 'auth/wrong-password') mensagem = "Palavra-passe incorreta.";
            if (error.code === 'auth/user-not-found') mensagem = "Utilizador não encontrado.";

            Swal.fire('Erro', mensagem, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Entrar no Painel <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
            lucide.createIcons();
        }
    });
}

/**
 * Funções de alternância de telas
 */
function showDashboard() {
    authScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    // Aqui chamaremos a função para carregar os dados da loja (store.js)
    // initDashboard(); 
}

function showLogin() {
    authScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

/**
 * Logout
 */
window.logout = async () => {
    try {
        await signOut(auth);
        location.reload();
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
};
