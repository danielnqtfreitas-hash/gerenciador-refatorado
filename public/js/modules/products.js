import { 
    db, storage, auth,
    collection, addDoc, updateDoc, doc, deleteDoc, getDoc, getDocs, query, where, orderBy,
    ref, uploadBytes, getDownloadURL, serverTimestamp 
} from '../config/firebase-config.js';
import { showToast, generateSKU } from '../utils/ui-helpers.js';

let cropper = null;

// --- GESTÃO DE MODAL ---
export const openProductModal = async (productId = null) => {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    form.reset();
    
    document.getElementById('product-id').value = productId || '';
    document.getElementById('variation-matrix').innerHTML = '';
    document.getElementById('image-preview-container').classList.add('hidden');

    if (productId) {
        document.getElementById('modal-title').innerText = 'Editar Produto';
        const storeId = auth.currentUser.uid;
        const docRef = doc(db, "stores", storeId, "products", productId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            const data = snap.data();
            // Preenchimento de todos os campos originais
            document.getElementById('prod-name').value = data.name || '';
            document.getElementById('prod-desc').value = data.description || '';
            document.getElementById('prod-price').value = data.price || 0;
            document.getElementById('prod-cost').value = data.costPrice || 0;
            document.getElementById('prod-category').value = data.category || '';
            document.getElementById('prod-sku').value = data.sku || '';
            document.getElementById('prod-stock').value = data.stock || 0;
            document.getElementById('prod-unit').value = data.unit || 'un';
            document.getElementById('prod-manage-stock').checked = data.manageStock || false;
            
            if (data.image) {
                const preview = document.getElementById('image-preview');
                preview.src = data.image;
                document.getElementById('image-preview-container').classList.remove('hidden');
                document.getElementById('prod-image-url').value = data.image;
            }

            // Reconstrução da Matriz de Variações original
            if (data.variations && data.variations.length > 0) {
                renderVariations(data.variations);
            }
        }
    } else {
        document.getElementById('modal-title').innerText = 'Novo Produto';
        document.getElementById('prod-sku').value = generateSKU();
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// --- LÓGICA DE VARIAÇÕES COMPLETA ---
export const generateVariationMatrix = () => {
    const sizes = document.getElementById('prod-sizes').value.split(',').map(s => s.trim()).filter(s => s !== "");
    const colors = document.getElementById('prod-colors').value.split(',').map(c => c.trim()).filter(c => c !== "");
    const container = document.getElementById('variation-matrix');
    
    container.innerHTML = '';
    let combinations = [];

    if (sizes.length > 0 && colors.length > 0) {
        sizes.forEach(s => colors.forEach(c => combinations.push(`${s} / ${c}`)));
    } else if (sizes.length > 0) {
        combinations = sizes;
    } else if (colors.length > 0) {
        combinations = colors;
    }

    combinations.forEach(name => {
        const div = document.createElement('div');
        div.className = "grid grid-cols-3 gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-100 animate-fadeIn";
        div.innerHTML = `
            <span class="text-sm font-700 text-slate-700">${name}</span>
            <input type="number" placeholder="Estoque" data-variant="${name}" class="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
            <input type="number" step="0.01" placeholder="Preço" data-price-variant="${name}" class="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
        `;
        container.appendChild(div);
    });
};

function renderVariations(variations) {
    const container = document.getElementById('variation-matrix');
    variations.forEach(v => {
        const div = document.createElement('div');
        div.className = "grid grid-cols-3 gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-100";
        div.innerHTML = `
            <span class="text-sm font-700 text-slate-700">${v.name}</span>
            <input type="number" value="${v.stock}" data-variant="${v.name}" class="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <input type="number" step="0.01" value="${v.price}" data-price-variant="${v.name}" class="px-3 py-2 rounded-lg border border-slate-200 text-sm">
        `;
        container.appendChild(div);
    });
}

// --- SUBMIT COMPLETO COM UPLOAD ---
export const handleProductSubmit = async (e) => {
    if(e) e.preventDefault();
    const btn = document.getElementById('btn-save-product');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin">🌀</span> Salvando...';

        const storeId = auth.currentUser.uid;
        const productId = document.getElementById('product-id').value;
        
        const variations = [];
        document.querySelectorAll('#variation-matrix > div').forEach(div => {
            const name = div.querySelector('[data-variant]').dataset.variant;
            const stock = parseInt(div.querySelector('[data-variant]').value) || 0;
            const price = parseFloat(div.querySelector('[data-price-variant]').value) || 0;
            variations.push({ name, stock, price });
        });

        const productData = {
            name: document.getElementById('prod-name').value,
            description: document.getElementById('prod-desc').value,
            price: parseFloat(document.getElementById('prod-price').value) || 0,
            costPrice: parseFloat(document.getElementById('prod-cost').value) || 0,
            category: document.getElementById('prod-category').value,
            sku: document.getElementById('prod-sku').value,
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            unit: document.getElementById('prod-unit').value,
            manageStock: document.getElementById('prod-manage-stock').checked,
            variations: variations,
            updatedAt: serverTimestamp()
        };

        // Lógica de Imagem (Cropper)
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({ width: 600, height: 600 });
            const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.8));
            const path = `stores/${storeId}/products/${Date.now()}.jpg`;
            const sRef = ref(storage, path);
            await uploadBytes(sRef, blob);
            productData.image = await getDownloadURL(sRef);
        } else {
            productData.image = document.getElementById('prod-image-url').value;
        }

        if (productId) {
            await updateDoc(doc(db, "stores", storeId, "products", productId), productData);
            showToast("Alterações salvas!");
        } else {
            productData.createdAt = serverTimestamp();
            await addDoc(collection(db, "stores", storeId, "products"), productData);
            showToast("Produto criado!");
        }
        
        closeProductModal();
    } catch (err) {
        showToast("Erro ao salvar: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

// Exposição Global
window.openProductModal = openProductModal;
window.handleProductSubmit = handleProductSubmit;
window.generateVariationMatrix = generateVariationMatrix;
window.closeProductModal = () => document.getElementById('product-modal').classList.add('hidden');
