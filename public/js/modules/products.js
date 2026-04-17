import { 
    db, storage, auth,
    collection, addDoc, updateDoc, doc, deleteDoc, getDoc,
    ref, uploadBytes, getDownloadURL, serverTimestamp
} from '../config/firebase-config.js';
import { showToast, generateSKU } from '../utils/ui-helpers.js';

// Variáveis de Estado do Módulo
let cropper = null;
let selectedImageFile = null;

/**
 * Abre o modal de produto (Novo ou Edição)
 */
export const openProductModal = (productId = null) => {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    form.reset();
    document.getElementById('product-id').value = productId || '';
    
    if (productId) {
        document.getElementById('modal-title').innerText = 'Editar Produto';
        loadProductData(productId);
    } else {
        document.getElementById('modal-title').innerText = 'Novo Produto';
        document.getElementById('prod-sku').value = generateSKU();
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

/**
 * Lógica de Variações (Grade de Tamanhos/Cores)
 * Extraída integralmente da sua lógica original
 */
export const generateVariationMatrix = () => {
    const sizes = document.getElementById('prod-sizes').value.split(',').map(s => s.trim()).filter(s => s);
    const colors = document.getElementById('prod-colors').value.split(',').map(c => c.trim()).filter(c => c);
    const matrixContainer = document.getElementById('variation-matrix');
    
    matrixContainer.innerHTML = '';
    
    if (sizes.length > 0 || colors.length > 0) {
        const combinations = [];
        if (sizes.length > 0 && colors.length > 0) {
            sizes.forEach(s => colors.forEach(c => combinations.push(`${s} / ${c}`)));
        } else {
            (sizes.length > 0 ? sizes : colors).forEach(item => combinations.push(item));
        }

        combinations.forEach(comb => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-4 p-3 bg-slate-50 rounded-lg animate-fadeIn';
            div.innerHTML = `
                <span class="flex-1 font-600 text-sm">${comb}</span>
                <input type="number" placeholder="Stock" class="w-24 px-2 py-1 border rounded" data-variant="${comb}">
                <input type="number" placeholder="Preço" class="w-24 px-2 py-1 border rounded" data-price-variant="${comb}">
            `;
            matrixContainer.appendChild(div);
        });
    }
};

/**
 * Manipulação de Imagem (Cropper.js)
 */
export const handleProductImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageElement = document.getElementById('cropper-image');
        imageElement.src = e.target.result;
        
        document.getElementById('cropper-modal').classList.remove('hidden');
        
        if (cropper) cropper.destroy();
        cropper = new Cropper(imageElement, {
            aspectRatio: 1,
            viewMode: 2,
            dragMode: 'move'
        });
    };
    reader.readAsDataURL(file);
};

/**
 * Salvar Produto (Submit)
 */
export const handleProductSubmit = async (e) => {
    e.preventDefault();
    const storeId = auth.currentUser.uid;
    const productId = document.getElementById('product-id').value;
    
    const productData = {
        name: document.getElementById('prod-name').value,
        description: document.getElementById('prod-desc').value,
        price: parseFloat(document.getElementById('prod-price').value),
        category: document.getElementById('prod-category').value,
        sku: document.getElementById('prod-sku').value,
        updatedAt: serverTimestamp()
    };

    try {
        if (productId) {
            await updateDoc(doc(db, "stores", storeId, "products", productId), productData);
            showToast("Produto atualizado!");
        } else {
            productData.createdAt = serverTimestamp();
            await addDoc(collection(db, "stores", storeId, "products"), productData);
            showToast("Produto criado com sucesso!");
        }
        document.getElementById('product-modal').classList.add('hidden');
    } catch (error) {
        showToast("Erro ao salvar produto", "error");
    }
};

/**
 * Duplicar Produto
 */
export const duplicateProduct = async (productId) => {
    const storeId = auth.currentUser.uid;
    try {
        const snap = await getDoc(doc(db, "stores", storeId, "products", productId));
        if (snap.exists()) {
            const data = snap.data();
            delete data.createdAt;
            data.name += " (Cópia)";
            data.sku = generateSKU();
            await addDoc(collection(db, "stores", storeId, "products"), data);
            showToast("Produto duplicado!");
        }
    } catch (error) {
        showToast("Erro ao duplicar", "error");
    }
};

// Exposição global para os onclicks do HTML
window.openProductModal = openProductModal;
window.handleProductSubmit = handleProductSubmit;
window.generateVariationMatrix = generateVariationMatrix;
window.handleProductImageSelect = handleProductImageSelect;
window.duplicateProduct = duplicateProduct;
window.closeProductModal = () => document.getElementById('product-modal').classList.add('hidden');
