// ===== DEBUG DO BLOG =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DEBUG DO BLOG ===');
    
    // Verificar elementos
    const elements = {
        listEl: document.getElementById('post-list'),
        searchEl: document.getElementById('filter-search'),
        catFilterEl: document.getElementById('filter-category'),
        sortEl: document.getElementById('filter-sort'),
        blogSection: document.getElementById('blog')
    };
    
    console.log('Elementos encontrados:', elements);
    
    // Verificar se a seção blog existe
    if (elements.blogSection) {
        console.log('✅ Seção blog encontrada');
    } else {
        console.error('❌ Seção blog não encontrada');
    }
    
    // Verificar filtros
    if (elements.searchEl) {
        console.log('✅ Campo de busca encontrado');
        elements.searchEl.addEventListener('input', function() {
            console.log('Busca:', this.value);
        });
    }
    
    if (elements.catFilterEl) {
        console.log('✅ Filtro de categoria encontrado');
        elements.catFilterEl.addEventListener('change', function() {
            console.log('Categoria selecionada:', this.value);
        });
    }
    
    if (elements.sortEl) {
        console.log('✅ Filtro de ordenação encontrado');
        elements.sortEl.addEventListener('change', function() {
            console.log('Ordenação selecionada:', this.value);
        });
    }
    
    // Verificar Firebase
    if (window.FIREBASE_CONFIG) {
        console.log('✅ Configuração Firebase encontrada');
    } else {
        console.error('❌ Configuração Firebase não encontrada');
    }
    
    if (window.NUTRILIFE_ADMIN_UIDS) {
        console.log('✅ UIDs de admin encontrados:', window.NUTRILIFE_ADMIN_UIDS);
    } else {
        console.error('❌ UIDs de admin não encontrados');
    }
    
    console.log('=== FIM DO DEBUG ===');
}); 