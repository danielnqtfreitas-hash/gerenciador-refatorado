import { 
    db, auth,
    collection, query, where, onSnapshot, orderBy, 
    updateDoc, doc, addDoc, serverTimestamp, getDoc 
} from '../config/firebase-config.js';
import { showToast, formatCurrency } from '../utils/ui-helpers.js';

// Variáveis de Estado do Módulo
let ordersListener = null;

/**
 * Inicia a escuta de pedidos em tempo real
 */
export const initOrdersListener = () => {
    const storeId = auth.currentUser.uid;
    const q = query(
        collection(db, "stores", storeId, "orders"),
        orderBy("createdAt", "desc")
    );

    if (ordersListener) ordersListener(); // Remove listener anterior se existir

    ordersListener = onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
        renderOrders(orders);
        updateOrdersCount(orders);
    }, (error) => {
        console.error("Erro ao escutar pedidos:", error);
    });
};

/**
 * Renderiza a lista de pedidos no Dashboard
 */
export const renderOrders = (orders) => {
    const container = document.getElementById('recent-orders-list');
    if (!container) return;

    container.innerHTML = orders.length ? '' : '<p class="text-slate-500 text-center py-8">Nenhum pedido encontrado.</p>';

    orders.forEach(order => {
        const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Recent';
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors animate-fadeIn';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-700">
                    #${order.id.slice(-4).toUpperCase()}
                </div>
                <div>
                    <p class="font-700 text-slate-900">${order.customerName || 'Cliente Particular'}</p>
                    <p class="text-xs text-slate-500">${date} • ${order.items?.length || 0} itens</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-800 text-slate-900">${formatCurrency(order.total)}</p>
                <select onchange="updateOrderStatus('${order.id}', this.value)" class="text-xs border-none bg-transparent font-600 text-violet-600 focus:ring-0 cursor-pointer">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendente</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparando</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregue</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
            <button onclick="printOrder('${order.id}')" class="p-2 text-slate-400 hover:text-violet-600 transition-colors">
                <i data-lucide="printer" class="w-5 h-5"></i>
            </button>
        `;
        container.appendChild(div);
    });
    lucide.createIcons();
};

/**
 * Atualiza o Status do Pedido
 */
export const updateOrderStatus = async (orderId, newStatus) => {
    const storeId = auth.currentUser.uid;
    try {
        await updateDoc(doc(db, "stores", storeId, "orders", orderId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        showToast("Status atualizado!");
    } catch (error) {
        showToast("Erro ao atualizar status", "error");
    }
};

/**
 * Lógica de Impressão (Cupão Não Fiscal 58mm)
 * Extraído integralmente da sua lógica de impressão térmica
 */
export const printOrder = async (orderId) => {
    const storeId = auth.currentUser.uid;
    const orderDoc = await getDoc(doc(db, "stores", storeId, "orders", orderId));
    const storeDoc = await getDoc(doc(db, "stores", storeId));
    
    if (!orderDoc.exists()) return;
    const order = orderDoc.data();
    const store = storeDoc.data();

    const printSection = document.getElementById('printSection');
    printSection.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0;">${store.name}</h2>
            <p style="font-size: 10px;">${new Date().toLocaleString()}</p>
        </div>
        <hr style="border-top: 1px dashed #000;">
        <p><strong>PEDIDO: #${orderId.slice(-4).toUpperCase()}</strong></p>
        <p>Cliente: ${order.customerName}</p>
        <hr style="border-top: 1px dashed #000;">
        <table style="width: 100%; font-size: 11px;">
            ${order.items.map(item => `
                <tr>
                    <td>${item.quantity}x ${item.name}</td>
                    <td style="text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
                </tr>
            `).join('')}
        </table>
        <hr style="border-top: 1px dashed #000;">
        <div style="text-align: right;">
            <p><strong>TOTAL: ${formatCurrency(order.total)}</strong></p>
        </div>
        <div style="text-align: center; margin-top: 10px; font-size: 10px;">
            <p>Obrigado pela preferência!</p>
        </div>
    `;

    window.print();
};

// Exposição global para o HTML
window.updateOrderStatus = updateOrderStatus;
window.printOrder = printOrder;
window.initOrdersListener = initOrdersListener;
