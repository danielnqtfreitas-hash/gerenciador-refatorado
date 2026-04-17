// Importação dos módulos do Firebase (v10)
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

// 1. CONFIGURAÇÃO DO FIREBASE (Extraída do seu código original)
const firebaseConfig = {
    apiKey: "AIzaSyAs-vC7O_N4F2-hS2x3p2f4W1g5H6j7L8k",
    authDomain: "vitrine-online-ba030.firebaseapp.com",
    projectId: "vitrine-online-ba030",
    storageBucket: "vitrine-online-ba030.appspot.com",
    messagingSenderId: "518334861257",
    appId: "1:518334861257:web:865615d5e305e608064972"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. ELEMENTOS DA INTERFACE
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('loginForm');

// 3. LÓGICA DE LOGIN
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const btn = e.target.querySelector('button');

        // Feedback de carregamento
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="animate-pulse">A verificar acesso...</span>';

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // O observador onAuthStateChanged cuidará da transição
        } catch (error) {
            console.error("Erro no login:", error);
            Swal.fire({
                icon: 'error',
                title: 'Falha na Autenticação',
                text: 'E-mail ou senha incorretos. Tente novamente.',
                confirmButtonColor: '#6366f1',
                customClass: { popup: 'rounded-3xl' }
            });
            btn.disabled = false;
            btn.innerHTML = originalText;
            lucide.createIcons(); // Recarrega o ícone da seta
        }
    });
}

// 4. MONITOR DE ESTADO (LOGIN/LOGOUT)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário logado: Esconde login, mostra painel
        authScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        
        // Dispara o alerta de sucesso
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Sessão iniciada',
            showConfirmButton: false,
            timer: 2000
        });

        console.log("Painel Ativo:", user.email);
    } else {
        // Usuário deslogado: Mostra login, esconde painel
        authScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
});

// 5. FUNÇÃO GLOBAL DE LOGOUT
window.logoutSystem = async () => {
    const result = await Swal.fire({
        title: 'Sair do Painel?',
        text: "Terá de fazer login novamente para gerir a loja.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#f1f5f9',
        confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'rounded-3xl' }
    });

    if (result.isConfirmed) {
        await signOut(auth);
    }
};

// Exportar instâncias para os próximos ficheiros (products.js, store.js)
export { auth, db };
