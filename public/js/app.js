/**
 * APP.JS - O MAESTRO DO SISTEMA
 * Este ficheiro orquestra a inicialização de todos os módulos.
 */

// 1. Importações do Firebase Config
import { auth, onAuthStateChanged } from './config/firebase-config.js';

// 2. Importações dos Módulos Funcionais
import { initStoreSettings } from './modules/store.js';
import { initOrdersListener } from './modules/orders.js';
import { updateDashboardStats } from './modules/dashboard.js';
import { initMasks } from './utils/ui-helpers.js';

// Importamos os outros ficheiros para garantir que os 'window.funcao' sejam registados
import './modules/auth.js';
import './modules/products.js';

/**
 * Gestor de Secções (Navegação do Painel)
 * Mantém a lógica original de alternar entre Dashboard, Produtos, etc.
 */
window.showSection = (sectionId) => {
    // Esconde todas as secções
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });

    // Mostra a secção desejada
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Atualiza o estado visual do menu (Sidebar)
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-section') === sectionId) {
            nav.classList.add('active');
        }
    });

    // Se for mobile, podes adicionar lógica para fechar a sidebar aqui
};

/**
 * OBSERVADOR DE AUTENTICAÇÃO
 * O ponto de partida real da aplicação
 */
onAuthStateChanged(auth, (user) => {
    const appContainer = document.getElementById('app');
    const authContainer = document.getElementById('auth-container');

    if (user) {
        console.log("Sistema: Utilizador Autenticado", user.uid);
        
        // 1. Alterna a Interface
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');

        // 2. Inicializa os Módulos de Dados
        initStoreSettings();    // Carrega nome da loja, status (aberta/fechada)
        initOrdersListener();   // Começa a ouvir pedidos em tempo real
        updateDashboardStats(); // Carrega o financeiro inicial (30 dias)
        initMasks();            // Aplica as máscaras de telemóvel nos inputs

        // 3. Inicializa os ícones (Lucide)
        if (window.lucide) {
            window.lucide.createIcons();
        }

    } else {
        console.log("Sistema: Nenhum utilizador ativo.");
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
    }
});

/**
 * Inicialização de bibliotecas de terceiros quando o DOM carregar
 */
document.addEventListener('DOMContentLoaded', () => {
    // Garante que os ícones funcionem mesmo na tela de login
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

