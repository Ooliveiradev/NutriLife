// ===== NAVEGAÇÃO AUTOMÁTICA - Otimizado =====

document.addEventListener('DOMContentLoaded', function() {
    // Obter o caminho atual da página
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Encontrar todos os links de navegação
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Processar cada link uma única vez
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Verificar se o link corresponde à página atual
        const isCurrentPage = href === currentPage || 
            (currentPage === 'index.html' && href === 'index.html') ||
            (currentPage === '' && href === 'index.html');
        
        // Aplicar classe active se necessário
        if (isCurrentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}); 