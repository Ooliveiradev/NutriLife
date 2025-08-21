// ===== NAVEGAÇÃO AUTOMÁTICA =====

document.addEventListener('DOMContentLoaded', function() {
    // Obter o caminho atual da página
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Encontrar todos os links de navegação
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Remover classe active de todos os links
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Adicionar classe active ao link correspondente à página atual
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Verificar se o link corresponde à página atual
        if (href === currentPage || 
            (currentPage === 'index.html' && href === 'index.html') ||
            (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}); 