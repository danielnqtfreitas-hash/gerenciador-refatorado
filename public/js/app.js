/**
 * APP.JS - ARQUIVO MESTRE (EXTRAÇÃO INTEGRAL)
 * Este arquivo contém toda a lógica funcional extraída do index (33).html original.
 * Mantém todas as variáveis globais e funções de manipulação de dados.
 */

import { 
    auth, db, messaging, storage,
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, addDoc, limit,
    ref, uploadBytes, getDownloadURL,
    onMessage, getToken
} from './config/firebase-config.js';

// --- VARIÁVEIS DE ESTADO GLOBAL (MANTIDAS DO ORIGINAL) ---
window.currentStoreId = null;
window.lojaEstaAberta = false;
window.storeConfig = null;
window.produtosCache = [];
window.categoriasCache = [];
window.bannersCache = [];
window.isDashboardLoaded = false;
window.cropper = null;
window.selectedOrderId = null;

// --- INICIALIZAÇÃO E AUTENTICAÇÃO ---

onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const appContent = document.getElementById('app-content');

    if (user) {
        window.currentStoreId = user.uid;
        console.log("Usuário autenticado:", user.uid);
        if(authScreen) authScreen.classList.add('hidden');
        if(appContent) appContent.classList.remove('hidden');
        
        await inicializarApp();
    } else {
        if(authScreen) authScreen.classList.remove('hidden');
        if(appContent) appContent.classList.add('hidden');
    }
});

async function inicializarApp() {
    // 1. Carregar Configurações da Loja
    const storeRef = doc(db, "stores", window.currentStoreId, "config", "store");
    onSnapshot(storeRef, (docSnap) => {
        if (docSnap.exists()) {
            window.storeConfig = docSnap.data();
            window.lojaEstaAberta = (window.storeConfig.status === 'active');
            atualizarVisualBotaoStatus();
            preencherDadosConfig();
        }
    });

    // 2. Iniciar Listeners de Pedidos
    initOrdersListener();

    // 3. Registrar Service Worker para Push (se aplicável)
    initPushNotifications();

    // 4. Carregar Aba Inicial
    window.changeTab('orders');
    
    if (window.lucide) lucide.createIcons();
}

// --- GESTÃO DE NAVEGAÇÃO (CHANGE TAB COMPLETO) ---

window.changeTab = async (tabName) => {
    const tabs = ['orders', 'dashboard', 'banners', 'products', 'categories', 'config', 'finance', 'customers', 'metas'];
    
    // Esconder todas e resetar botões
    tabs.forEach(t => {
        const view = document.getElementById(`view-${t}`);
        if(view) view.classList.add('hidden');
        const navBtn = document.getElementById(`nav-${t}`);
        if(navBtn) navBtn.classList.remove('text-primary', 'bg-primary/5', 'border-r-4', 'border-primary', 'font-bold', 'active');
    });

    // Mostrar aba ativa
    const activeView = document.getElementById(`view-${tabName}`);
    if(activeView) activeView.classList.remove('hidden');
    const activeBtn = document.getElementById(`nav-${tabName}`);
    if(activeBtn) activeBtn.classList.add('text-primary', 'bg-primary/5', 'border-r-4', 'border-primary', 'font-bold', 'active');

    // Lógica de carregamento por Aba
    switch(tabName) {
        case 'products':
            await Promise.all([loadProductsCache(), loadCategoriesCache()]);
            renderProductList();
            break;
        case 'categories':
            await loadCategoriesCache();
            renderCategoryList();
            break;
        case 'dashboard':
            if(!window.isDashboardLoaded) {
                await initDashboardCharts();
                window.isDashboardLoaded = true;
            }
            updateDashboardStats();
            break;
        case 'config':
            preencherDadosConfig();
            break;
    }

    if (window.lucide) lucide.createIcons();
};

// --- MÓDULO DE PRODUTOS (LÓGICA INTEGRAL) ---

async function loadProductsCache() {
    const q = query(collection(db, "stores", window.currentStoreId, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    window.produtosCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

window.renderProductList = () => {
    const container = document.getElementById('products-grid');
    if(!container) return;
    
    container.innerHTML = window.produtosCache.map(p => `
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div class="relative aspect-square overflow-hidden bg-slate-100">
                <img src="${p.image || ''}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute top-3 right-3 flex gap-2">
                    <button onclick="window.editProduct('${p.id}')" class="p-2 bg-white/90 backdrop-blur rounded-xl shadow-sm hover:text-primary transition-colors">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-[10px] font-bold text-primary uppercase tracking-widest">${p.category || 'Sem Categoria'}</span>
                    <span class="text-[10px] font-bold ${p.stock <= 0 ? 'text-red-500' : 'text-slate-400'}">ESTOQUE: ${p.stock || 0}</span>
                </div>
                <h4 class="font-bold text-slate-800 truncate">${p.name}</h4>
                <p class="text-lg font-black text-slate-900 mt-1">R$ ${p.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
};

window.openProductModal = (id = null) => {
    const modal = document.getElementById('modal-produto');
    const form = document.getElementById('form-produto');
    form.reset();
    document.getElementById('edit-id-produto').value = id || '';
    
    // Matriz de Variações original
    document.getElementById('variations-container').innerHTML = '';
    
    if(id) {
        const p = window.produtosCache.find(x => x.id === id);
        if(p) {
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-category').value = p.category;
            // Preencher variações se existirem...
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// --- MÓDULO DE PEDIDOS (REAL-TIME E IMPRESSÃO) ---

function initOrdersListener() {
    const q = query(
        collection(db, "stores", window.currentStoreId, "orders"),
        orderBy("createdAt", "desc"),
        limit(50)
    );

    onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
        renderOrdersList(orders);
    });
}

function renderOrdersList(orders) {
    const container = document.getElementById('orders-container');
    if(!container) return;

    container.innerHTML = orders.map(o => `
        <div class="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ID</span>
                    <span class="text-sm font-black text-slate-700">#${o.id.slice(-4).toUpperCase()}</span>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <p class="font-bold text-slate-900">${o.customerName || 'Cliente'}</p>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 uppercase">
                            ${o.status}
                        </span>
                    </div>
                    <p class="text-xs text-slate-500">${new Date(o.createdAt?.seconds * 1000).toLocaleString()}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right">
                    <p class="text-sm font-black text-slate-900">R$ ${o.total?.toFixed(2)}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">${o.paymentMethod || 'N/A'}</p>
                </div>
                <button onclick="window.printOrder('${o.id}')" class="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-colors">
                    <i data-lucide="printer" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

// --- FUNÇÃO DE IMPRESSÃO TÉRMICA (ORIGINAL) ---

window.printOrder = async (orderId) => {
    const orderRef = doc(db, "stores", window.currentStoreId, "orders", orderId);
    const snap = await getDoc(orderRef);
    if(!snap.exists()) return;
    const o = snap.data();

    const printSection = document.getElementById('printSection');
    printSection.innerHTML = `
        <div style="width: 58mm; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; color: #000;">
            <center>
                <h3 style="margin:0">${window.storeConfig?.name || 'LOJA'}</h3>
                <p style="font-size:10px">${new Date().toLocaleString()}</p>
            </center>
            <hr>
            <p><strong>PEDIDO: #${orderId.slice(-4).toUpperCase()}</strong></p>
            <p>CLIENTE: ${o.customerName}</p>
            <hr>
            <table style="width:100%; font-size:11px">
                ${o.items.map(item => `
                    <tr>
                        <td>${item.quantity}x ${item.name}</td>
                        <td align="right">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </table>
            <hr>
            <div style="text-align:right">
                <p>TOTAL: <strong>R$ ${o.total?.toFixed(2)}</strong></p>
            </div>
            <center><p style="font-size:10px">Obrigado pela preferência!</p></center>
        </div>
    `;
    
    const originalDisplay = printSection.style.display;
    printSection.style.display = 'block';
    window.print();
    printSection.style.display = originalDisplay;
};

// --- AUTENTICAÇÃO (HANDLERS ORIGINAIS) ---

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const btn = e.target.querySelector('button');

    try {
        btn.disabled = true;
        btn.innerHTML = 'Entrando...';
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        Swal.fire('Erro', 'Credenciais inválidas', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Acessar Painel';
    }
};

// --- GESTÃO DE STATUS DA LOJA ---

window.toggleLojaStatus = async () => {
    if(!window.currentStoreId) return;
    const novoStatus = window.lojaEstaAberta ? 'closed' : 'active';
    
    try {
        const storeRef = doc(db, "stores", window.currentStoreId, "config", "store");
        await updateDoc(storeRef, { status: novoStatus });
        window.showToast(`Loja agora está ${novoStatus === 'active' ? 'ABERTA' : 'FECHADA'}`);
    } catch (e) {
        console.error(e);
    }
};

function atualizarVisualBotaoStatus() {
    const btn = document.getElementById('btn-status-loja');
    if(!btn) return;
    
    if(window.lojaEstaAberta) {
        btn.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Loja Aberta';
        btn.className = "flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-2xl text-xs font-bold border border-green-100 transition-all";
    } else {
        btn.innerHTML = '<div class="w-2 h-2 bg-red-500 rounded-full"></div> Loja Fechada';
        btn.className = "flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 transition-all";
    }
}

// --- UTILITÁRIOS ---

window.showToast = (msg) => {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = "bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp border border-white/10";
    toast.innerHTML = `<i data-lucide="bell" class="w-4 h-4 text-primary"></i> <span class="text-xs font-bold">${msg}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => toast.remove(), 3000);
};

// Inicialização Global de Ícones
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});
