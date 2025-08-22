// ===== FORMULÁRIO DE CONTATO - Otimizado =====

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  
  if (!contactForm) return;
  
  // Função para validar email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Função para mostrar mensagem de erro
  function showError(message) {
    alert(message);
  }
  
  // Função para mostrar mensagem de sucesso
  function showSuccess() {
    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
  }
  
  // Função para validar formulário
  function validateForm(formData) {
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const subject = formData.get('subject')?.trim();
    const message = formData.get('message')?.trim();
    
    if (!name) {
      showError('Por favor, informe seu nome.');
      return false;
    }
    
    if (!email) {
      showError('Por favor, informe seu e-mail.');
      return false;
    }
    
    if (!isValidEmail(email)) {
      showError('Por favor, informe um e-mail válido.');
      return false;
    }
    
    if (!subject) {
      showError('Por favor, selecione um assunto.');
      return false;
    }
    
    if (!message) {
      showError('Por favor, informe sua mensagem.');
      return false;
    }
    
    if (message.length < 10) {
      showError('A mensagem deve ter pelo menos 10 caracteres.');
      return false;
    }
    
    return true;
  }
  
  // Função para gerenciar estado do botão
  function setButtonState(button, isLoading, text) {
    button.innerHTML = text;
    button.disabled = isLoading;
  }
  
  // Event listener do formulário
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    
    // Validar formulário
    if (!validateForm(formData)) {
      return;
    }
    
    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Mostrar loading
    setButtonState(submitBtn, true, '<i class="fas fa-spinner fa-spin"></i> Enviando...');
    
    // Simular envio (aqui você pode integrar com um backend real)
    setTimeout(() => {
      // Resetar botão
      setButtonState(submitBtn, false, originalText);
      
      // Mostrar mensagem de sucesso
      showSuccess();
      
      // Limpar formulário
      contactForm.reset();
    }, 2000);
  });
  
  // Efeito de foco nos campos (otimizado)
  const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea, .contact-form select');
  
  formInputs.forEach(input => {
    const parentElement = input.parentElement;
    
    input.addEventListener('focus', function() {
      parentElement.style.transform = 'translateY(-2px)';
      parentElement.style.transition = 'transform 0.2s ease';
    });
    
    input.addEventListener('blur', function() {
      parentElement.style.transform = 'translateY(0)';
    });
  });
}); 