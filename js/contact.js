// Formulário de Contato
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Pegar os dados do formulário
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const subject = formData.get('subject');
      const message = formData.get('message');
      
      // Validação básica
      if (!name || !email || !subject || !message) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      // Simular envio (aqui você pode integrar com um backend real)
      const submitBtn = contactForm.querySelector('.submit-btn');
      const originalText = submitBtn.innerHTML;
      
      // Mostrar loading
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      submitBtn.disabled = true;
      
      // Simular delay de envio
      setTimeout(() => {
        // Resetar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar mensagem de sucesso
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        
        // Limpar formulário
        contactForm.reset();
      }, 2000);
    });
  }
  
  // Efeito de foco nos campos
  const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea, .contact-form select');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.style.transform = 'translateY(0)';
    });
  });
}); 