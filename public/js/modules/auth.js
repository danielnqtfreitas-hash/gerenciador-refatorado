import { 
    auth, db, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    doc, setDoc, serverTimestamp 
} from '../config/firebase-config.js';
import { showToast } from '../utils/ui-helpers.js';

// Variáveis de estado do Registro
let currentRegStep = 1;

/**
 * Alterna entre a vista de Login e a vista de Registo
 */
export const toggleAuthView = () => {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    if (loginView.classList.contains('hidden')) {
        loginView.classList.remove('hidden');
        registerView.classList.add('hidden');
    } else {
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    }
};

/**
 * Controla a visibilidade da password
 */
export const togglePasswordVisibility = (inputId) => {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
};

/**
 * Lógica de Login Original
 */
export const handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (!email || !pass) {
        showToast("Preencha todos os campos", "error");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast("Bem-vindo de volta!", "success");
    } catch (error) {
        console.error("Erro no login:", error);
        showToast("E-mail ou password incorretos", "error");
    }
};

/**
 * Navegação entre passos do Registo
 */
export const goToRegStep = (step) => {
    const steps = [1, 2, 3];
    steps.forEach(s => {
        const el = document.getElementById(`reg-step-${s}`);
        if (el) s === step ? el.classList.remove('hidden') : el.classList.add('hidden');
    });
    currentRegStep = step;
};

/**
 * Lógica de Pré-registo / Criação de Conta
 */
export const handlePreRegister = async () => {
    const storeName = document.getElementById('reg-store-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;

    if (!storeName || !email || !pass) {
        showToast("Preencha todos os dados", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Criação do documento da loja original
        await setDoc(doc(db, "stores", user.uid), {
            name: storeName,
            email: email,
            createdAt: serverTimestamp(),
            status: 'closed',
            config: {
                theme: 'violet',
                currency: 'BRL'
            }
        });

        showToast("Conta criada com sucesso!", "success");
    } catch (error) {
        console.error("Erro no registo:", error);
        showToast("Erro ao criar conta: " + error.message, "error");
    }
};

/**
 * Logout
 */
export const handleLogout = async () => {
    try {
        await signOut(auth);
        location.reload(); // Recarrega para limpar todos os estados
    } catch (error) {
        showToast("Erro ao sair", "error");
    }
};

// Expor para o escopo global (para os onclicks do HTML)
window.toggleAuthView = toggleAuthView;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.togglePasswordVisibility = togglePasswordVisibility;
window.goToRegStep = goToRegStep;
window.handlePreRegister = handlePreRegister;

