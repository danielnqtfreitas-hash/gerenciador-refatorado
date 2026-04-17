import { db, auth } from './app.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentStoreId = null;

// 1. Função principal de renderização da aba de produtos
export async function renderProdutos() {
    currentStoreId = auth.currentUser.uid;
    const content = document.getElementById('content-area');
    
    content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-black text-slate-800">Gerir Inventário</h2>
            <button onclick="openProductModal()" class="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-100 flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i> Novo Produto
            </button>
        </div>

        <div id="products-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="col-span-full py-20 text-center text-slate-400">
                <span class="animate-pulse">A carregar produtos...</span>
            </div>
        </div>

        <div id="productModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 id="modalTitle" class="text-xl font-black text-slate-800">Novo Produto</h3>
                    <button onclick="closeProductModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x"></i></button>
                </div>

                <form id="productForm" class="space-y-4">
                    <input type="hidden" id="prodId">
                    
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                        <input type="text" id="prodName" required class="input-pro" placeholder="Ex: Hambúrguer Artesanal">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                            <input type="text" id="prodPrice" required class="input-pro" placeholder="0,00">
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                            <select id="prodCategory" class="input-pro">
                                <option value="Geral">Geral</option>
                                <option value="Promoção">Promoção</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                            <button type="button" onclick="gerarDescricaoIA()" class="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-100 transition-all">
                                <i data-lucide="sparkles" class="w-3 h-3"></i> Gerar com IA
                            </button>
                        </div>
                        <textarea id="prodDescription" rows="3" class="input-pro h-24 resize-none" placeholder="Detalhes do produto..."></textarea>
                    </div>

                    <button type="submit" class="w-full btn-primary mt-4">Guardar Produto</button>
                </form>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    aplicarMascaras();
    loadProducts();
}

// 2. Carregar produtos do Firestore (Extraído do seu código original)
async function loadProducts() {
    const list = document.getElementById('products-list');
    try {
        const q = query(collection(db, "stores", currentStoreId, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            list.innerHTML = `<div class="col-span-full py-10 text-center text-slate-400 font-medium">Nenhum produto cadastrado.</div>`;
            return;
        }

        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const prod = docSnap.data();
            const id = docSnap.id;
            list.innerHTML += `
                <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-400">
                        <i data-lucide="image" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 text-sm">${prod.name}</h4>
                        <p class="text-indigo-600 font-black text-xs">R$ ${prod.price}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editProduct('${id}')" class="p-2 text-slate-400 hover:text-indigo-600"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="deleteProduct('${id}')" class="p-2 text-slate-400 hover:text-rose-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } catch (e) {
        console.error("Erro ao carregar:", e);
    }
}

// 3. FUNÇÃO DE IA (Conexão com o seu futuro Backend no Render)
window.gerarDescricaoIA = async () => {
    const nome = document.getElementById('prodName').value;
    const categoria = document.getElementById('prodCategory').value;
    const descField = document.getElementById('prodDescription');

    if (!nome) {
        return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Digite o nome do produto primeiro!' });
    }

    descField.placeholder = "A IA está a pensar...";
    descField.value = "";

    try {
        // Quando o seu Render estiver pronto, mudaremos esta URL
        const response = await fetch('https://seu-backend-no-render.com/api/descrever', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, categoria })
        });
        const data = await response.json();
        descField.value = data.description;
    } catch (error) {
        // Simulação enquanto o backend não está pronto
        descField.value = `Este é um excelente ${nome} da categoria ${categoria}. Alta qualidade e o melhor preço da região!`;
        console.log("Backend ainda não configurado.");
    }
};

// 4. Utilitários (Máscaras e Modais)
function aplicarMascaras() {
    const priceInput = document.getElementById('prodPrice');
    if (priceInput) {
        IMask(priceInput, {
            mask: 'num',
            blocks: {
                num: {
                    mask: Number,
                    thousandsSeparator: '.',
                    padFractionalZeros: true,
                    radix: ','
                }
            }
        });
    }
}

window.openProductModal = () => {
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalTitle').innerText = 'Novo Produto';
    document.getElementById('productModal').classList.remove('hidden');
};

window.closeProductModal = () => {
    document.getElementById('productModal').classList.add('hidden');
};

// Vincula a função de renderização ao escopo global para o dashboard.js a encontrar
window.renderProdutos = renderProdutos;
