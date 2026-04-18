import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    signInWithCustomToken,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configurações e Inicialização ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Estado Global ---
let currentUser = null;
let storeData = null;
let chartInstance = null;

/**
 * Inicialização de Autenticação (Regra 3)
 */
const initAuth = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Erro na autenticação inicial:", error);
    }
};

// --- Listeners de Autenticação ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        setupAppData(user.uid);
    } else {
        showAuthScreen();
    }
});

/**
 * Configura os dados baseados no utilizador
 */
async function setupAppData(userId) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    // Escutas em tempo real (Regra 1: Caminhos Estritos)
    listenToStoreConfig(userId);
    listenToOrders(userId);
    listenToProducts(userId);
    listenToCategories(userId);
    listenToBanners(userId);
    
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Escuta Configuração da Loja
 */
function listenToStoreConfig(userId) {
    const storeRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'store');
    onSnapshot(storeRef, (docSnap) => {
        if (docSnap.exists()) {
            storeData = docSnap.data();
            updateStoreUI(storeData);
        } else {
            setDoc(storeRef, { 
                name: "Minha Loja", 
                status: "closed", 
                revenue: 0, 
                visits: 0, 
                whatsapp: "",
                address: ""
            });
        }
    }, (err) => console.error("Erro store config:", err));
}

function updateStoreUI(data) {
    const statusBtn = document.getElementById('btn-status-loja');
    const displayTitle = document.getElementById('display-store-name');
    
    if (displayTitle) displayTitle.innerText = data.name || "Minha Loja";
    
    if (statusBtn) {
        const isOpen = data.status === 'active';
        statusBtn.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-800 uppercase tracking-tighter ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
                <span class="w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}"></span>
                ${isOpen ? 'Loja Aberta' : 'Loja Fechada'}
            </div>
        `;
    }

    if (document.getElementById('dash-total-visits')) {
        document.getElementById('dash-total-visits').innerText = data.visits || 0;
        document.getElementById('dash-month-revenue').innerText = `R$ ${parseFloat(data.revenue || 0).toFixed(2)}`;
    }

    if (document.getElementById('config-store-name')) {
        document.getElementById('config-store-name').value = data.name || "";
        document.getElementById('config-whatsapp').value = data.whatsapp || "";
    }
}

/**
 * Escuta de Categorias
 */
function listenToCategories(userId) {
    const catRef = collection(db, 'artifacts', appId, 'users', userId, 'categories');
    onSnapshot(catRef, (snapshot) => {
        const categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderCategoriesInSelect(categories);
        renderCategoriesList(categories);
    }, (err) => console.error("Erro categorias:", err));
}

function renderCategoriesInSelect(categories) {
    const select = document.getElementById('prod-category');
    if (!select) return;
    select.innerHTML = '<option value="">Sem Categoria</option>' + 
        categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function renderCategoriesList(categories) {
    const container = document.getElementById('categories-container');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = `<div class="p-10 text-center text-slate-400 font-600">Nenhuma categoria criada.</div>`;
    } else {
        container.innerHTML = categories.map(cat => `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span class="font-800 text-slate-900">${cat.name}</span>
                <button onclick="window.deleteCategory('${cat.id}')" class="text-red-400 hover:text-red-600 p-2">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    }
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Escuta de Banners
 */
function listenToBanners(userId) {
    const bannerRef = collection(db, 'artifacts', appId, 'users', userId, 'banners');
    onSnapshot(bannerRef, (snapshot) => {
        const banners = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderBanners(banners);
    }, (err) => console.error("Erro banners:", err));
}

function renderBanners(banners) {
    const container = document.getElementById('banners-container');
    if (!container) return;

    if (banners.length === 0) {
        container.innerHTML = `<div class="p-10 text-center text-slate-400 font-600">Nenhum banner ativo.</div>`;
    } else {
        container.innerHTML = banners.map(b => `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                        <i data-lucide="image" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <p class="font-800 text-slate-900">${b.title || 'Banner'}</p>
                        <p class="text-[10px] text-slate-400 uppercase font-700">${b.link || 'Sem link'}</p>
                    </div>
                </div>
                <button onclick="window.deleteBanner('${b.id}')" class="text-red-400 hover:text-red-600 p-2">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    }
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Escuta de Pedidos
 */
function listenToOrders(userId) {
    const ordersRef = collection(db, 'artifacts', appId, 'users', userId, 'orders');
    onSnapshot(ordersRef, (snapshot) => {
        const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderOrders(orders);
        updateDashboardStats(orders);
    }, (err) => console.error("Erro pedidos:", err));
}

function updateDashboardStats(orders) {
    const completedOrders = orders.filter(o => o.status === 'Entregue' || o.status === 'Concluído');
    if (document.getElementById('dash-total-orders')) {
        document.getElementById('dash-total-orders').innerText = completedOrders.length;
    }
    renderChart(orders);
}

/**
 * Escuta de Produtos
 */
function listenToProducts(userId) {
    const productsRef = collection(db, 'artifacts', appId, 'users', userId, 'products');
    onSnapshot(productsRef, (snapshot) => {
        const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderProducts(products);
    }, (err) => console.error("Erro produtos:", err));
}

// --- Ações de Pedidos (Nesta Versão Adicionamos Visualização e Status) ---

window.updateOrderStatus = async (orderId, newStatus) => {
    if (!currentUser) return;
    try {
        const orderRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        Swal.fire({ icon: 'success', title: 'Status Atualizado', timer: 1000, showConfirmButton: false });
    } catch (err) {
        console.error("Erro status pedido:", err);
    }
};

window.viewOrderDetails = async (orderId) => {
    if (!currentUser) return;
    const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const order = snap.data();
    const itemsHtml = order.items.map(item => `
        <div class="flex justify-between py-2 border-b border-slate-50 text-sm">
            <span class="font-600">${item.quantity}x ${item.name}</span>
            <span class="font-800">R$ ${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    Swal.fire({
        title: `Detalhes do Pedido #${orderId.slice(-4).toUpperCase()}`,
        html: `
            <div class="text-left mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <p class="text-xs text-slate-400 font-700 uppercase">Cliente</p>
                <p class="font-800 text-slate-900 mb-4">${order.customerName}</p>
                
                <p class="text-xs text-slate-400 font-700 uppercase">Itens</p>
                <div class="mb-4">${itemsHtml}</div>
                
                <div class="flex justify-between font-900 text-lg py-2">
                    <span>Total</span>
                    <span class="text-primary">R$ ${parseFloat(order.total).toFixed(2)}</span>
                </div>

                <div class="mt-6 flex flex-col gap-2">
                    <button onclick="window.updateOrderStatus('${orderId}', 'Em Preparação')" class="w-full py-3 bg-blue-500 text-white rounded-xl font-800 text-xs uppercase">Confirmar Pedido</button>
                    <button onclick="window.updateOrderStatus('${orderId}', 'Saiu para Entrega')" class="w-full py-3 bg-amber-500 text-white rounded-xl font-800 text-xs uppercase">Sair para Entrega</button>
                    <button onclick="window.updateOrderStatus('${orderId}', 'Entregue')" class="w-full py-3 bg-emerald-500 text-white rounded-xl font-800 text-xs uppercase">Marcar como Entregue</button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'rounded-[2.5rem]' }
    });
};

window.printOrder = async (orderId) => {
    if (!currentUser) return;
    const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const order = snap.data();
    const storeName = storeData?.name || "Minha Loja";
    
    let printHtml = `
        <div style="font-family: monospace; width: 100%; max-width: 300px; margin: 0 auto; padding: 10px;">
            <center>
                <h2 style="margin-bottom: 5px;">${storeName}</h2>
                <p style="font-size: 12px;">Pedido #${orderId.slice(-4).toUpperCase()}</p>
                <hr>
            </center>
            <p><b>Cliente:</b> ${order.customerName}</p>
            <p><b>Data:</b> ${new Date(order.createdAt?.seconds * 1000).toLocaleString()}</p>
            <hr>
            <table style="width: 100%; font-size: 12px;">
                ${order.items.map(i => `<tr><td>${i.quantity}x ${i.name}</td><td align="right">R$ ${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
            </table>
            <hr>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
                <span>TOTAL:</span>
                <span>R$ ${parseFloat(order.total).toFixed(2)}</span>
            </div>
            <center><p style="margin-top: 20px; font-size: 10px;">Obrigado pela preferência!</p></center>
        </div>
    `;

    const win = window.open('', '_blank');
    win.document.write(`<html><body onload="window.print(); window.close();">${printHtml}</body></html>`);
    win.document.close();
};

// --- Ações de Loja e Configuração ---

window.saveStoreConfig = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    const name = document.getElementById('config-store-name').value;
    const whatsapp = document.getElementById('config-whatsapp').value;

    try {
        const storeRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'store');
        await updateDoc(storeRef, { name, whatsapp });
        Swal.fire({ icon: 'success', title: 'Guardado!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        console.error("Erro config:", err);
    }
};

window.addCategory = async () => {
    const { value: name } = await Swal.fire({
        title: 'Nova Categoria',
        input: 'text',
        inputPlaceholder: 'Ex: Pizzas, Bebidas...',
        showCancelButton: true,
        confirmButtonColor: '#8b5cf6',
        customClass: { popup: 'rounded-[2rem]' }
    });

    if (name && currentUser) {
        await addDoc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'categories'), {
            name,
            createdAt: serverTimestamp()
        });
    }
};

window.deleteCategory = async (id) => {
    const result = await Swal.fire({
        title: 'Eliminar Categoria?',
        text: "Produtos desta categoria ficarão sem categoria associada.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed && currentUser) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'categories', id));
    }
};

window.addBanner = async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Novo Banner',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Título do Banner">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Link (opcional)">',
        focusConfirm: false,
        customClass: { popup: 'rounded-[2rem]' },
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
            ]
        }
    });

    if (formValues && currentUser) {
        await addDoc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'banners'), {
            title: formValues[0],
            link: formValues[1],
            createdAt: serverTimestamp()
        });
    }
};

window.deleteBanner = async (id) => {
    if (currentUser) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'banners', id));
    }
};

window.toggleLojaStatus = async () => {
    if (!currentUser) return;
    const newStatus = storeData?.status === 'active' ? 'closed' : 'active';
    const storeRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'store');
    try {
        await updateDoc(storeRef, { status: newStatus });
    } catch (err) {
        console.error("Erro ao mudar status:", err);
    }
};

// --- Gestão de Produtos ---

window.openProductModal = (productId = null) => {
    const modal = document.getElementById('modal-produto');
    const form = document.getElementById('form-produto');
    const title = document.getElementById('modal-title');
    
    form.reset();
    document.getElementById('edit-id-produto').value = productId || '';
    document.getElementById('variations-container').innerHTML = '';
    title.innerText = productId ? 'Editar Produto' : 'Novo Produto';
    
    if (productId) {
        loadProductData(productId);
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

async function loadProductData(id) {
    const prodRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'products', id);
    const snap = await getDoc(prodRef);
    if (snap.exists()) {
        const data = snap.data();
        document.getElementById('prod-name').value = data.name;
        document.getElementById('prod-price').value = data.price;
        document.getElementById('prod-category').value = data.category || '';
        if (data.variations) {
            data.variations.forEach(v => window.addNewVariation(v.name, v.price));
        }
    }
}

window.addNewVariation = (name = '', price = '') => {
    const container = document.getElementById('variations-container');
    const div = document.createElement('div');
    div.className = "flex gap-2 animate-fadeIn mb-2";
    div.innerHTML = `
        <input type="text" placeholder="Ex: Tamanho P" value="${name}" class="flex-1 px-4 py-3 bg-white border rounded-xl text-sm font-600 outline-none focus:border-primary">
        <input type="number" step="0.01" placeholder="Preço" value="${price}" class="w-24 px-4 py-3 bg-white border rounded-xl text-sm font-600 outline-none focus:border-primary">
        <button type="button" onclick="this.parentElement.remove()" class="p-3 text-red-400 hover:text-red-600">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    container.appendChild(div);
    if (window.lucide) window.lucide.createIcons();
};

window.handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const id = document.getElementById('edit-id-produto').value;
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    
    const varRows = document.getElementById('variations-container').children;
    const currentVars = Array.from(varRows).map(row => ({
        name: row.querySelectorAll('input')[0].value,
        price: parseFloat(row.querySelectorAll('input')[1].value) || 0
    })).filter(v => v.name.trim() !== '');

    const productData = {
        name,
        price,
        category,
        variations: currentVars,
        updatedAt: serverTimestamp()
    };

    try {
        const colRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'products');
        if (id) {
            await updateDoc(doc(colRef, id), productData);
        } else {
            productData.createdAt = serverTimestamp();
            await addDoc(colRef, productData);
        }
        document.getElementById('modal-produto').classList.add('hidden');
        Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Produto guardado!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        console.error("Erro ao salvar produto:", err);
    }
};

window.deleteProduct = async (id) => {
    const result = await Swal.fire({
        title: 'Eliminar Produto?',
        text: "Esta ação não pode ser revertida.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, eliminar'
    });

    if (result.isConfirmed && currentUser) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'products', id));
    }
};

window.editProduct = (id) => {
    window.openProductModal(id);
};

// --- Dashboard & Gráficos ---

function renderChart(orders) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    // Gerar labels para os últimos 7 dias
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    }).reverse();

    // Calcular somatórios diários
    const dataPoints = last7Days.map(day => {
        return orders
            .filter(o => {
                if (!o.createdAt) return false;
                const orderDate = new Date(o.createdAt?.seconds * 1000).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
                return orderDate === day;
            })
            .reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
    });

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Vendas (R$)',
                data: dataPoints,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: '#8b5cf6',
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { weight: '600' } }
                },
                x: { 
                    grid: { display: false },
                    ticks: { font: { weight: '600' } }
                }
            }
        }
    });
}

// --- Funções de UI Auxiliares ---

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Credenciais inválidas.' });
    }
};

window.handleLogout = async () => {
    const result = await Swal.fire({
        title: 'Sair?',
        text: "Deseja encerrar a sessão?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#8b5cf6',
        confirmButtonText: 'Sair'
    });
    if (result.isConfirmed) {
        await signOut(auth);
        location.reload();
    }
};

window.changeTab = (tabName) => {
    const views = ['orders', 'dashboard', 'products', 'categories', 'banners', 'config'];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        const nav = document.getElementById(`nav-${v}`);
        if (el) el.classList.toggle('hidden', v !== tabName);
        if (nav) {
            const isActive = v === tabName;
            nav.className = `w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`;
        }
    });
};

function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
}

// --- Renderização de Listas ---

function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `<div class="p-20 text-center border-2 border-dashed rounded-[3rem] border-slate-100"><h3 class="text-slate-400 font-700">Sem pedidos recentes</h3></div>`;
    } else {
        container.innerHTML = orders.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(order => {
            const statusColors = {
                'Novo': 'bg-primary/10 text-primary',
                'Em Preparação': 'bg-blue-100 text-blue-600',
                'Saiu para Entrega': 'bg-amber-100 text-amber-600',
                'Entregue': 'bg-emerald-100 text-emerald-600'
            };
            
            return `
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-primary/20 transition-all">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><i data-lucide="package" class="w-5 h-5"></i></div>
                        <div>
                            <h4 class="font-800 text-slate-900 leading-tight">Pedido #${order.id.slice(-4).toUpperCase()}</h4>
                            <p class="text-xs font-600 text-slate-400">${order.customerName || 'Cliente'}</p>
                        </div>
                    </div>
                    <div class="px-4 py-2 ${statusColors[order.status] || 'bg-slate-100 text-slate-500'} rounded-full text-[10px] font-800 uppercase">${order.status || 'Novo'}</div>
                    <div class="font-900 text-slate-900 text-lg">R$ ${parseFloat(order.total || 0).toFixed(2)}</div>
                    <div class="flex gap-2">
                        <button onclick="window.viewOrderDetails('${order.id}')" class="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"><i data-lucide="eye" class="w-5 h-5"></i></button>
                        <button onclick="window.printOrder('${order.id}')" class="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"><i data-lucide="printer" class="w-5 h-5"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }
    if (window.lucide) window.lucide.createIcons();
}

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-slate-400 font-700">Nenhum produto cadastrado.</div>`;
        return;
    }

    grid.innerHTML = products.map(prod => `
        <div class="bg-white group rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all">
            <div class="aspect-square bg-slate-50 relative">
                <div class="absolute inset-0 flex items-center justify-center text-slate-200"><i data-lucide="image" class="w-12 h-12"></i></div>
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onclick="window.editProduct('${prod.id}')" class="p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:text-primary">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="window.deleteProduct('${prod.id}')" class="p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:text-red-500">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <span class="text-[10px] font-800 text-slate-400 uppercase tracking-widest">${prod.category || 'Geral'}</span>
                <h4 class="font-800 text-slate-900 mt-1 truncate">${prod.name}</h4>
                <div class="flex justify-between items-center mt-4">
                    <span class="font-900 text-primary text-lg">R$ ${parseFloat(prod.price || 0).toFixed(2)}</span>
                    <span class="text-xs font-700 text-slate-300">${prod.variations?.length || 0} Opções</span>
                </div>
            </div>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

// Inicializar aplicação
window.onload = () => {
    initAuth();
    window.changeTab('dashboard');
};
