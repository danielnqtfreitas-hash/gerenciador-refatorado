import { auth, db } from './app.js';
import { 
    doc, 
    onSnapshot, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Variáveis de estado global do painel
let currentStoreId = null;
let lojaEstaAberta = false;

// Função principal que constrói a casca do painel
export function renderDashboard() {
    const container = document.getElementById('dashboard-screen');
    currentStoreId = auth.currentUser.uid;

    container.innerHTML = `
    <div class="flex h-screen overflow-hidden">
        <aside class="sidebar-mobile md:relative md:flex md:flex-col md:w-64 bg-white border-r border-slate-100 h-full z-50">
            <div class="p-6 hidden md:block">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <i data-lucide="layout-dashboard" class="text-white w-6 h-6"></i>
                    </div>
                    <h2 class="text-xl font-black text-slate-800 tracking-tighter">Vitrine</h2>
                </div>
            </div>
            
            <nav class="flex-1 px-4 space-y-2 py-4 flex md:block justify-around w-full">
                <button onclick="switchTab('inicio')" id="btn-inicio" class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full text-indigo-600 bg-indigo-50">
                    <i data-lucide="home" class="w-5 h-5"></i> <span class="hidden md:block">Início</span>
                </button>
                <button onclick="switchTab('produtos')" id="btn-produtos" class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full text-slate-400 hover:bg-slate-50">
                    <i data-lucide="package" class="w-5 h-5"></i> <span class="hidden md:block">Produtos</span>
                </button>
                <button onclick="switchTab('vendas')" id="btn-vendas" class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full text-slate-400 hover:bg-slate-50">
                    <i data-lucide="shopping-cart" class="w-5 h-5"></i> <span class="hidden md:block">Vendas</span>
                </button>
                <button onclick="switchTab('config')" id="btn-config" class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full text-slate-400 hover:bg-slate-50">
                    <i data-lucide="settings" class="w-5 h-5"></i> <span class="hidden md:block">Loja</span>
                </button>
            </nav>

            <div class="p-4 border-t border-slate-50 hidden md:block">
                <button onclick="window.logoutSystem()" class="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl text-sm font-bold transition-all">
                    <i data-lucide="log-out" class="w-5 h-5"></i> <span>Sair</span>
                </button>
            </div>
        </aside>

        <main class="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
            <header class="flex justify-between items-center mb-8">
                <div>
                    <h1 id="tab-title" class="text-2xl font-black text-slate-800 tracking-tight">Painel Inicial</h1>
                    <div id="store-status-badge" class="mt-1"></div>
                </div>
                
                <button onclick="window.toggleLojaStatus()" id="btn-toggle-loja" class="px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center gap-2">
                    </button>
            </header>

            <div id="content-area" class="animate-fadeIn">
                </div>
        </main>
    </div>
    `;

    lucide.createIcons();
    listenStoreStatus();
    switchTab('inicio'); // Inicia na aba principal
}

// 1. Monitoramento em tempo real do status da loja
function listenStoreStatus() {
    const storeRef = doc(db, "stores", currentStoreId, "config", "store");
    onSnapshot(storeRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            lojaEstaAberta = data.status === 'active';
            updateStatusUI();
        }
    });
}

function updateStatusUI() {
    const badge = document.getElementById('store-status-badge');
    const btn = document.getElementById('btn-toggle-loja');
    
    if (lojaEstaAberta) {
        badge.innerHTML = '<span class="status-badge-active">● Loja Aberta</span>';
        btn.className = "px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100";
        btn.innerHTML = '<i data-lucide="door-closed" class="w-4 h-4"></i> Fechar Loja';
    } else {
        badge.innerHTML = '<span class="status-badge-closed">○ Loja Fechada</span>';
        btn.className = "px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100";
        btn.innerHTML = '<i data-lucide="door-open" class="w-4 h-4"></i> Abrir Loja';
    }
    lucide.createIcons();
}

// 2. Troca de Abas (Navegação Interna)
window.switchTab = (tab) => {
    const content = document.getElementById('content-area');
    const title = document.getElementById('tab-title');
    
    // Reseta botões
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('text-indigo-600', 'bg-indigo-50');
        btn.classList.add('text-slate-400');
    });

    // Ativa botão atual
    document.getElementById(`btn-${tab}`).classList.add('text-indigo-600', 'bg-indigo-50');
    document.getElementById(`btn-${tab}`).classList.remove('text-slate-400');

    if (tab === 'inicio') {
        title.innerText = "Painel Inicial";
        renderInicio();
    } else if (tab === 'produtos') {
        title.innerText = "Meus Produtos";
        // Chamaremos a função do products.js
        if (window.renderProdutos) window.renderProdutos();
    }
    // ... outras abas
    lucide.createIcons();
}

// 3. Conteúdo da Aba Início (Gráficos e Tutorial)
function renderInicio() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendas (Hoje)</p>
                <h3 class="text-3xl font-black text-slate-800">R$ 0,00</h3>
            </div>
            <div id="tutorial-card" class="md:col-span-2 bg-indigo-600 rounded-[32px] p-8 relative overflow-hidden shadow-xl shadow-indigo-100 text-white">
                <div class="relative z-10">
                    <span class="bg-indigo-400/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Dica de IA</span>
                    <h2 class="text-2xl font-black mt-4 mb-2">Novo: Descrições Inteligentes</h2>
                    <p class="text-indigo-100 text-sm font-medium max-w-md">Deixe a nossa IA escrever os detalhes técnicos para você economizar tempo no cadastro.</p>
                </div>
                <i data-lucide="sparkles" class="absolute right-[-20px] top-[-20px] w-48 h-48 text-indigo-500/20 rotate-12"></i>
            </div>
        </div>
        
        <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 class="font-black text-slate-800 mb-6 flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-5 h-5 text-indigo-500"></i> Desempenho Semanal
            </h4>
            <canvas id="mainChart" height="100"></canvas>
        </div>
    `;
    initChart();
}

function initChart() {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Vendas',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#6366f1',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.05)'
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } } }
        }
    });
}

// 4. Lógica de abrir/fechar loja (Migrada do seu original)
window.toggleLojaStatus = async () => {
    if (!currentStoreId) return;
    const novoStatus = lojaEstaAberta ? 'closed' : 'active';
    try {
        const storeRef = doc(db, "stores", currentStoreId, "config", "store");
        await updateDoc(storeRef, { status: novoStatus });
    } catch (error) {
        console.error("Erro ao mudar status:", error);
    }
};
