import { 
    db, auth, 
    doc, getDoc, updateDoc, onSnapshot, serverTimestamp 
} from '../config/firebase-config.js';
import { showToast } from '../utils/ui-helpers.js';

// Variáveis de Estado Internas
let currentStoreId = null;
let lojaEstaAberta = false;
let storeListener = null;

/**
 * Inicializa os dados da loja e escuta mudanças de configuração
 */
export const initStoreSettings = () => {
    currentStoreId = auth.currentUser.uid;
    const storeRef = doc(db, "stores", currentStoreId);

    if (storeListener) storeListener();

    storeListener = onSnapshot(storeRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            lojaEstaAberta = data.status === 'active';
            updateStoreUI(data);
        }
    });
};

/**
 * Função Cirúrgica: Abrir/Fechar Loja
 * Extraída exatamente da sua lógica de inversão de status
 */
export const toggleLojaStatus = async () => {
    if (!currentStoreId) currentStoreId = auth.currentUser.uid;
    
    // Inverte o status: se está aberta (active), vira fechada (closed)
    const novoStatus = lojaEstaAberta ? 'closed' : 'active';

    try {
        const storeRef = doc(db, "stores", currentStoreId);
        await updateDoc(storeRef, {
            status: novoStatus,
            updatedAt: serverTimestamp()
        });
        
        const mensagem = novoStatus === 'active' ? "Loja Aberta!" : "Loja Fechada!";
        const icon = novoStatus === 'active' ? 'success' : 'warning';
        showToast(mensagem, icon);
        
        console.log("Comando enviado ao Firebase:", novoStatus);
    } catch (error) {
        console.error("Erro ao mudar status:", error);
        showToast("Erro ao alterar status", "error");
    }
};

/**
 * Atualiza os elementos da Interface com os dados da loja
 */
function updateStoreUI(data) {
    const statusDot = document.getElementById('store-status-dot');
    const statusText = document.getElementById('store-status-text');
    const btnToggle = document.getElementById('btn-toggle-store');

    if (statusDot && statusText) {
        if (data.status === 'active') {
            statusDot.className = 'w-3 h-3 rounded-full bg-green-500 animate-pulse';
            statusText.innerText = 'Loja Aberta';
            if(btnToggle) btnToggle.innerText = 'Fechar Loja';
        } else {
            statusDot.className = 'w-3 h-3 rounded-full bg-red-500';
            statusText.innerText = 'Loja Fechada';
            if(btnToggle) btnToggle.innerText = 'Abrir Loja';
        }
    }

    // Preenche os campos de configuração se estiverem visíveis
    const inputName = document.getElementById('conf-store-name');
    if (inputName) inputName.value = data.name || '';
}

/**
 * Salva as configurações gerais da loja
 */
export const saveStoreConfigs = async (e) => {
    if(e) e.preventDefault();
    const storeId = auth.currentUser.uid;
    
    const configData = {
        name: document.getElementById('conf-store-name').value,
        description: document.getElementById('conf-store-desc').value,
        deliveryFee: parseFloat(document.getElementById('conf-delivery-fee').value || 0),
        minOrder: parseFloat(document.getElementById('conf-min-order').value || 0),
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(doc(db, "stores", storeId), configData);
        showToast("Configurações salvas!");
    } catch (error) {
        showToast("Erro ao salvar", "error");
    }
};

// Exposição Global para os botões do HTML
window.toggleLojaStatus = toggleLojaStatus;
window.saveStoreConfigs = saveStoreConfigs;
window.initStoreSettings = initStoreSettings;
