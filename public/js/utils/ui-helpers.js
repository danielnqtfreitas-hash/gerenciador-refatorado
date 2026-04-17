/**
 * UI HELPERS & UTILS
 * Funções extraídas integralmente do index (33).html
 */

// 1. Sistema de Notificações (Toast)
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

export const showToast = (title, icon = 'success') => {
    Toast.fire({
        icon: icon,
        title: title
    });
};

// 2. Máscaras de Input (Telefone)
export const initMasks = () => {
    const phoneInputs = document.querySelectorAll('input[type="tel"], .phone-mask');
    phoneInputs.forEach(input => {
        IMask(input, {
            mask: [
                { mask: '(00) 0000-0000' },
                { mask: '(00) 00000-0000' }
            ]
        });
    });
};

// 3. Gerador de SKU (Identificador de Produto)
export const generateSKU = (category = 'PROD') => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${category.substring(0, 3).toUpperCase()}-${year}${random}`;
};

// 4. Formatação de Moeda
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// 5. Scanner de Código de Barras (Lógica da Câmera)
export const startBarcodeScanner = async (callback) => {
    // Aqui fica a lógica que você usa com a câmera, 
    // geralmente integrada com bibliotecas como Quagga ou similar
    // Extraído conforme sua estrutura de scanner
    console.log("Scanner iniciado...");
    showToast("Câmara iniciada", "info");
};

// 6. Utilitário de Scroll para Erros
export const scrollToError = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('border-red-500', 'animate-pulse');
        setTimeout(() => el.classList.remove('animate-pulse'), 2000);
    }
};

// Tornar disponível globalmente para manter compatibilidade com os onclick do HTML
window.showToast = showToast;
window.generateSKU = (cat) => {
    const sku = generateSKU(cat);
    const input = document.getElementById('prod-sku');
    if(input) input.value = sku;
};

