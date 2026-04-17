import { 
    db, auth, 
    collection, query, where, getDocs, orderBy 
} from '../config/firebase-config.js';
import { formatCurrency } from '../utils/ui-helpers.js';

// Variáveis de Estado do Dashboard
let financeChart = null;

/**
 * Atualiza os cartões de estatísticas (Faturamento, Pedidos, Lucro, Ticket Médio)
 */
export const updateDashboardStats = async (days = 30) => {
    const storeId = auth.currentUser.uid;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        const q = query(
            collection(db, "stores", storeId, "orders"),
            where("createdAt", ">=", startDate),
            where("status", "==", "delivered")
        );

        const querySnapshot = await getDocs(q);
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalProfit = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalRevenue += data.total || 0;
            totalProfit += (data.total - (data.cost || 0));
            totalOrders++;
        });

        const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        renderStatsHTML(totalRevenue, totalOrders, totalProfit, ticketMedio);
        renderFinanceChart(querySnapshot); // Atualiza o gráfico com os mesmos dados
    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
};

/**
 * Injeta o HTML nos cartões de destaque
 */
function renderStatsHTML(rev, ord, profit, ticket) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn">
            <p class="text-slate-500 text-sm font-600">Faturamento</p>
            <h3 class="text-2xl font-800 text-slate-900">${formatCurrency(rev)}</h3>
            <span class="text-green-500 text-xs font-700">↑ Período selecionado</span>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn" style="animation-delay: 0.1s">
            <p class="text-slate-500 text-sm font-600">Pedidos Concluídos</p>
            <h3 class="text-2xl font-800 text-slate-900">${ord}</h3>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn" style="animation-delay: 0.2s">
            <p class="text-slate-500 text-sm font-600">Lucro Estimado</p>
            <h3 class="text-2xl font-800 text-slate-900 text-violet-600">${formatCurrency(profit)}</h3>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn" style="animation-delay: 0.3s">
            <p class="text-slate-500 text-sm font-600">Ticket Médio</p>
            <h3 class="text-2xl font-800 text-slate-900">${formatCurrency(ticket)}</h3>
        </div>
    `;
}

/**
 * Renderiza o Gráfico de Vendas (Chart.js)
 * Extraído da sua configuração original de cores e eixos
 */
export const renderFinanceChart = (snapshot) => {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    // Lógica de agrupamento por dia para o gráfico
    const labels = [];
    const dataValues = [];
    
    // ... (Lógica de processamento de datas do snapshot aqui)

    if (financeChart) financeChart.destroy();

    financeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas Diárias',
                data: dataValues,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
};

// Exposição Global
window.updateDashboardStats = updateDashboardStats;
