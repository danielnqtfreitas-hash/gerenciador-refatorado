import { auth, db } from './app.js';

export function renderDashboard() {
    const container = document.getElementById('dashboard-screen');
    
    container.innerHTML = `
    <div class="flex h-screen overflow-hidden">
        <aside class="sidebar-mobile md:relative md:flex md:flex-col md:w-64 bg-white border-r border-slate-100 h-full transition-all">
            <div class="p-6 hidden md:block">
                <h2 class="text-xl font-black text-indigo-600 tracking-tighter">ShopWave</h2>
            </div>
            
            <nav class="flex-1 px-4 space-y-2 py-4">
                <button onclick="switchTab('inicio')" class="nav-item-active w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all">
                    <i data-lucide="layout-grid" class="w-5 h-5"></i> <span class="md:block">Início</span>
                </button>
                <button onclick="switchTab('produtos')" class="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 rounded-2xl text-sm font-bold transition-all">
                    <i data-lucide="package" class="w-5 h-5"></i> <span class="md:block">Produtos</span>
                </button>
                <button onclick="switchTab('vendas')" class="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 rounded-2xl text-sm font-bold transition-all">
                    <i data-lucide="shopping-cart" class="w-5 h-5"></i> <span class="md:block">Vendas</span>
                </button>
            </nav>

            <div class="p-4 border-t border-slate-50">
                <button onclick="window.logoutSystem()" class="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl text-sm font-bold transition-all">
                    <i data-lucide="log-out" class="w-5 h-5"></i> <span>Sair</span>
                </button>
            </div>
        </aside>

        <main class="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
            <header class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-2xl font-black text-slate-800 tracking-tight">Painel de Controlo</h1>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Bem-vindo à sua vitrine</p>
                </div>
                <div class="flex items-center gap-3">
                    <div id="status-loja-indicador"></div>
                </div>
            </header>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendas Hoje</p>
                    <h3 class="text-2xl font-black text-slate-800">0</h3>
                </div>
                <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visitas</p>
                    <h3 class="text-2xl font-black text-slate-800">0</h3>
                </div>
            </div>

            <div id="tutorial-card" class="bg-indigo-600 rounded-[32px] p-8 mb-8 relative overflow-hidden shadow-xl shadow-indigo-100">
                <div class="relative z-10">
                    <span class="bg-indigo-400/30 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Novo Recurso</span>
                    <h2 class="text-white text-2xl font-black mt-4 mb-2">Turbine seus produtos com IA</h2>
                    <p class="text-indigo-100 text-sm font-medium max-w-md">Agora você pode gerar descrições profissionais automaticamente usando nossa Inteligência Artificial.</p>
                </div>
                <i data-lucide="sparkles" class="absolute right-[-20px] top-[-20px] w-48 h-48 text-indigo-500/20 rotate-12"></i>
            </div>

            <div id="main-content-area">
                </div>
        </main>
    </div>
    `;
    
    lucide.createIcons();
    initCharts(); // Inicializa os gráficos
}

function initCharts() {
    // Aqui vai a lógica do Chart.js que estava no seu original
}
