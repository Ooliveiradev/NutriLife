// Navegação: ativa link atual e ajusta hrefs no GitHub Pages

document.addEventListener('DOMContentLoaded', function () {
  // Detecta GitHub Pages (case-sensitive para arquivos)
  const isGithubPages = /github\.io$/i.test(window.location.host);

  // Mapeia nomes esperados -> nomes realmente publicados
  const caseMap = {
    'imc.html': 'IMC.html',
    'cal.html': 'Cal.html',
    'receitas.html': 'Receitas.html',
    'diario.html': 'Diario.html'
  };

  // Se estiver no GitHub Pages, ajusta os hrefs para casar com os arquivos publicados
  if (isGithubPages) {
    document.querySelectorAll('nav a[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').replace(/^\.\//, '');
      const lower = href.toLowerCase();
      if (caseMap[lower]) a.setAttribute('href', caseMap[lower]);
    });
  }

  // Destacar link ativo (comparação case-insensitive)
  const currentPath = window.location.pathname;
  const currentPage = (currentPath.split('/').pop() || 'index.html').toLowerCase();
  const navLinks = document.querySelectorAll('nav ul li a');

  navLinks.forEach(link => {
    const href = (link.getAttribute('href') || '').replace(/^\.\//, '').toLowerCase();
    const isCurrentPage = href === currentPage ||
      (currentPage === 'index.html' && href === 'index.html') ||
      (currentPage === '' && href === 'index.html');

    if (isCurrentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
});

