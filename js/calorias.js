// ===== CALCULADORA DE CALORIAS - VERSÃO OTIMIZADA =====

class CalorieCalculator {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupAnimations();
        this.loadFromLocalStorage();
    }

    init() {
        // Cache de elementos DOM
        this.elements = {
            form: document.getElementById('calForm'),
            inputs: {
                peso: document.getElementById('peso'),
                altura: document.getElementById('altura'),
                idade: document.getElementById('idade'),
                genero: document.querySelectorAll('input[name="genero"]'),
                atividade: document.getElementById('atividade'),
                objetivo: document.getElementById('objetivo')
            },
            results: {
                bmr: document.getElementById('bmrValue'),
                tdee: document.getElementById('tdeeValue'),
                alvo: document.getElementById('alvoValue'),
                alvoLabel: document.getElementById('alvoLabel')
            },
            macros: {
                pCarb: document.getElementById('pCarb'),
                kCarb: document.getElementById('kCarb'),
                gCarb: document.getElementById('gCarb'),
                pProt: document.getElementById('pProt'),
                kProt: document.getElementById('kProt'),
                gProt: document.getElementById('gProt'),
                pFat: document.getElementById('pFat'),
                kFat: document.getElementById('kFat'),
                gFat: document.getElementById('gFat')
            },
            presets: document.getElementById('presets'),
            resultDiv: document.getElementById('calResult'),
            tips: document.getElementById('tips')
        };

        // Configurações
        this.config = {
            macroPresets: {
                '50-25-25': { carb: 50, prot: 25, fat: 25, name: 'Equilíbrio' },
                '40-30-30': { carb: 40, prot: 30, fat: 30, name: 'Alta Proteína' },
                '25-35-40': { carb: 25, prot: 35, fat: 40, name: 'Low-carb' },
                '55-20-25': { carb: 55, prot: 20, fat: 25, name: 'Ativo' }
            },
            activityMultipliers: {
                'sedentario': { value: 1.2, name: 'Sedentário' },
                'leve': { value: 1.375, name: 'Levemente Ativo' },
                'moderado': { value: 1.55, name: 'Moderadamente Ativo' },
                'ativo': { value: 1.725, name: 'Muito Ativo' },
                'muito-ativo': { value: 1.9, name: 'Extremamente Ativo' }
            },
            objectiveMultipliers: {
                'manutencao': { value: 1.0, name: 'Manutenção' },
                'perda': { value: 0.85, name: 'Perda de Peso' },
                'ganho': { value: 1.15, name: 'Ganho de Peso' }
            }
        };

        this.currentPreset = '50-25-25';
        this.lastCalculation = null;
        this.debounceTimer = null;
        this.isCalculating = false;
    }

    setupEventListeners() {
        // Event listeners com debounce para otimização
        const debouncedCalculate = this.debounce(() => {
            if (this.isFormValid()) {
                this.calculateCalories();
            }
        }, 300);

        // Inputs numéricos
        Object.values(this.elements.inputs).forEach(input => {
            if (input && input.type !== 'radio') {
                input.addEventListener('input', debouncedCalculate);
                input.addEventListener('blur', this.validateField.bind(this));
            }
        });

        // Radio buttons
        this.elements.inputs.genero.forEach(radio => {
            radio.addEventListener('change', debouncedCalculate);
        });

        // Form submit
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateCalories();
        });

        // Presets de macros
        const presetButtons = this.elements.presets.querySelectorAll('.pill');
        presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setPreset(button.dataset.preset);
            });
        });

        // Adicionar botão de limpar
        this.addClearButton();

        // Adicionar funcionalidade de compartilhamento
        this.addShareButton();

        // Adicionar tooltips informativos
        this.addTooltips();
    }

    setupAnimations() {
        // Animações de entrada
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        // Observar elementos para animação
        const animatedElements = document.querySelectorAll('.form-group, .kpi-item, .pill');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    debounce(func, wait) {
        return (...args) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => func.apply(this, args), wait);
        };
    }

    validateField(event) {
        const field = event.target;
        const value = parseFloat(field.value);
        const fieldName = field.name;
        
        let isValid = true;
        let message = '';

        switch (fieldName) {
            case 'peso':
                if (isNaN(value) || value < 20 || value > 300) {
                    isValid = false;
                    message = 'Peso deve estar entre 20 e 300 kg';
                }
                break;
            case 'altura':
                if (isNaN(value) || value < 50 || value > 250) {
                    isValid = false;
                    message = 'Altura deve estar entre 50 e 250 cm';
                }
                break;
            case 'idade':
                if (isNaN(value) || value < 1 || value > 120) {
                    isValid = false;
                    message = 'Idade deve estar entre 1 e 120 anos';
                }
                break;
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    showFieldValidation(field, isValid, message) {
        // Remover validações anteriores
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        field.classList.remove('error', 'success');

        if (!isValid && message) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                color: #dc3545;
                font-size: 0.85em;
                margin-top: 5px;
                padding: 5px 10px;
                background: #f8d7da;
                border-radius: 5px;
                border-left: 3px solid #dc3545;
            `;
            field.parentNode.appendChild(errorDiv);
        } else if (isValid && field.value) {
            field.classList.add('success');
        }
    }

    isFormValid() {
        const peso = parseFloat(this.elements.inputs.peso.value);
        const altura = parseFloat(this.elements.inputs.altura.value);
        const idade = parseInt(this.elements.inputs.idade.value);
        const genero = document.querySelector('input[name="genero"]:checked');
        const atividade = this.elements.inputs.atividade.value;
        const objetivo = this.elements.inputs.objetivo.value;

        return !isNaN(peso) && peso > 0 && peso <= 300 &&
               !isNaN(altura) && altura > 0 && altura <= 250 &&
               !isNaN(idade) && idade > 0 && idade <= 120 &&
               genero && atividade && objetivo;
    }

    calculateBMR(peso, altura, idade, genero) {
        // Fórmula Mifflin-St Jeor otimizada
        const baseBMR = (10 * peso) + (6.25 * altura) - (5 * idade);
        return genero === 'masculino' ? baseBMR + 5 : baseBMR - 161;
    }

    calculateTDEE(bmr, atividade) {
        const multiplier = this.config.activityMultipliers[atividade]?.value || 1.2;
        return bmr * multiplier;
    }

    calculateTargetCalories(tdee, objetivo) {
        const multiplier = this.config.objectiveMultipliers[objetivo]?.value || 1.0;
        return Math.round(tdee * multiplier);
    }

    calculateMacros(targetCalories, preset) {
        const { carb, prot, fat } = this.config.macroPresets[preset];
        
        const carbCalories = Math.round((targetCalories * carb) / 100);
        const protCalories = Math.round((targetCalories * prot) / 100);
        const fatCalories = Math.round((targetCalories * fat) / 100);

        return {
            carb: { calories: carbCalories, grams: Math.round(carbCalories / 4), percent: carb },
            prot: { calories: protCalories, grams: Math.round(protCalories / 4), percent: prot },
            fat: { calories: fatCalories, grams: Math.round(fatCalories / 9), percent: fat }
        };
    }

    async calculateCalories() {
        if (this.isCalculating) return;
        
        this.isCalculating = true;
        this.showLoadingState();

        // Simular pequeno delay para melhor UX
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const peso = parseFloat(this.elements.inputs.peso.value);
            const altura = parseFloat(this.elements.inputs.altura.value);
            const idade = parseInt(this.elements.inputs.idade.value);
            const genero = document.querySelector('input[name="genero"]:checked').value;
            const atividade = this.elements.inputs.atividade.value;
            const objetivo = this.elements.inputs.objetivo.value;

            const bmr = this.calculateBMR(peso, altura, idade, genero);
            const tdee = this.calculateTDEE(bmr, atividade);
            const targetCalories = this.calculateTargetCalories(tdee, objetivo);
            const macros = this.calculateMacros(targetCalories, this.currentPreset);

            this.displayResults(bmr, tdee, targetCalories, objetivo, macros);
            this.saveToLocalStorage();
            this.showSuccessMessage();

        } catch (error) {
            console.error('Erro no cálculo:', error);
            this.showErrorMessage();
        } finally {
            this.isCalculating = false;
            this.hideLoadingState();
        }
    }

    displayResults(bmr, tdee, targetCalories, objetivo, macros) {
        // Animar valores com contador
        this.animateValue(this.elements.results.bmr, Math.round(bmr), ' kcal');
        this.animateValue(this.elements.results.tdee, Math.round(tdee), ' kcal');
        this.animateValue(this.elements.results.alvo, targetCalories, ' kcal');

        // Atualizar label do objetivo
        const objectiveName = this.config.objectiveMultipliers[objetivo]?.name || 'Manutenção';
        this.elements.results.alvoLabel.textContent = `Calorias-alvo (${objectiveName})`;

        // Atualizar macros
        this.updateMacrosDisplay(macros);

        // Mostrar resultado com animação
        this.elements.resultDiv.classList.add('show');
        this.elements.resultDiv.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

        // Salvar último cálculo
        this.lastCalculation = { bmr, tdee, targetCalories, objetivo, macros };
    }

    animateValue(element, targetValue, suffix = '') {
        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateMacrosDisplay(macros) {
        // Animar macros
        this.animateValue(this.elements.macros.kCarb, macros.carb.calories, ' kcal');
        this.animateValue(this.elements.macros.kProt, macros.prot.calories, ' kcal');
        this.animateValue(this.elements.macros.kFat, macros.fat.calories, ' kcal');

        this.elements.macros.gCarb.textContent = macros.carb.grams + 'g';
        this.elements.macros.gProt.textContent = macros.prot.grams + 'g';
        this.elements.macros.gFat.textContent = macros.fat.grams + 'g';

        this.elements.macros.pCarb.textContent = macros.carb.percent + '%';
        this.elements.macros.pProt.textContent = macros.prot.percent + '%';
        this.elements.macros.pFat.textContent = macros.fat.percent + '%';
    }

    setPreset(preset) {
        // Remover classe active de todos os botões
        const presetButtons = this.elements.presets.querySelectorAll('.pill');
        presetButtons.forEach(btn => btn.classList.remove('active'));
        
        // Adicionar classe active ao botão clicado
        const activeButton = this.elements.presets.querySelector(`[data-preset="${preset}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        this.currentPreset = preset;
        
        // Recalcular macros se já temos um resultado
        if (this.lastCalculation) {
            const macros = this.calculateMacros(this.lastCalculation.targetCalories, preset);
            this.updateMacrosDisplay(macros);
        }
    }

    showLoadingState() {
        const button = this.elements.form.querySelector('.btn-calculate');
        if (button) {
            button.innerHTML = '<span class="loading"></span> Calculando...';
            button.disabled = true;
        }
    }

    hideLoadingState() {
        const button = this.elements.form.querySelector('.btn-calculate');
        if (button) {
            button.innerHTML = '<i class="fas fa-calculator"></i> Calcular Calorias';
            button.disabled = false;
        }
    }

    showSuccessMessage() {
        this.showNotification('Cálculo realizado com sucesso! 🎉', 'success');
    }

    showErrorMessage() {
        this.showNotification('Erro no cálculo. Verifique os dados inseridos.', 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%);' : 
              type === 'error' ? 'background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);' :
              'background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);'}
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    addClearButton() {
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.textContent = 'Limpar Formulário';
        clearButton.className = 'btn-clear';
        clearButton.innerHTML = '<i class="fas fa-eraser"></i> Limpar Formulário';
        
        clearButton.addEventListener('click', () => {
            this.clearForm();
        });

        this.elements.form.appendChild(clearButton);
    }

    addShareButton() {
        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'btn-share';
        shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Compartilhar';
        shareButton.style.cssText = `
            width: 100%;
            padding: 15px;
            margin-top: 10px;
            background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
            color: white;
            border: none;
            border-radius: 15px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(23, 162, 184, 0.3);
        `;

        shareButton.addEventListener('click', () => {
            this.shareResults();
        });

        this.elements.form.appendChild(shareButton);
    }

    addTooltips() {
        const tooltipData = {
            'peso': 'Peso atual em quilogramas. Meça pela manhã, após ir ao banheiro.',
            'altura': 'Altura em centímetros. Meça sem sapatos, em pé contra a parede.',
            'idade': 'Idade atual em anos completos.',
            'atividade': 'Nível de atividade física semanal. Seja honesto para resultados precisos.',
            'objetivo': 'Seu objetivo principal: manter, perder ou ganhar peso.'
        };

        Object.entries(tooltipData).forEach(([fieldName, tooltipText]) => {
            const field = this.elements.inputs[fieldName];
            if (field) {
                field.title = tooltipText;
                field.setAttribute('data-tooltip', tooltipText);
            }
        });
    }

    shareResults() {
        if (!this.lastCalculation) {
            this.showNotification('Calcule primeiro para compartilhar os resultados!', 'error');
            return;
        }

        const { bmr, tdee, targetCalories, objetivo, macros } = this.lastCalculation;
        const objectiveName = this.config.objectiveMultipliers[objetivo]?.name;
        const presetName = this.config.macroPresets[this.currentPreset]?.name;

        const shareText = `🔥 Meus resultados da Calculadora NutriLife:

📊 BMR: ${Math.round(bmr)} kcal
⚡ TDEE: ${Math.round(tdee)} kcal  
🎯 Calorias-alvo (${objectiveName}): ${targetCalories} kcal

🥗 Distribuição ${presetName}:
• Carboidratos: ${macros.carb.grams}g (${macros.carb.calories} kcal)
• Proteínas: ${macros.prot.grams}g (${macros.prot.calories} kcal)
• Gorduras: ${macros.fat.grams}g (${macros.fat.calories} kcal)

💪 Calculado com NutriLife - Sua jornada para uma vida mais saudável!`;

        if (navigator.share) {
            navigator.share({
                title: 'Meus Resultados - Calculadora NutriLife',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback para copiar para clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Resultados copiados para a área de transferência! 📋', 'success');
            });
        }
    }

    clearForm() {
        this.elements.form.reset();
        
        // Esconder resultado
        this.elements.resultDiv.classList.remove('show');
        
        // Resetar valores
        Object.values(this.elements.results).forEach(el => {
            if (el !== this.elements.results.alvoLabel) {
                el.textContent = '–';
            }
        });
        
        this.elements.results.alvoLabel.textContent = 'Calorias-alvo (Manutenção)';
        
        // Resetar macros
        Object.values(this.elements.macros).forEach(el => {
            if (el.textContent.includes('%')) {
                el.textContent = el.textContent.replace(/\d+%/, '50%');
            } else {
                el.textContent = '–';
            }
        });
        
        // Resetar preset
        this.setPreset('50-25-25');
        
        // Limpar validações
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.error, .success').forEach(el => {
            el.classList.remove('error', 'success');
        });

        this.lastCalculation = null;
        this.showNotification('Formulário limpo! ✨', 'info');
    }

    saveToLocalStorage() {
        const data = {
            peso: this.elements.inputs.peso.value,
            altura: this.elements.inputs.altura.value,
            idade: this.elements.inputs.idade.value,
            genero: document.querySelector('input[name="genero"]:checked')?.value,
            atividade: this.elements.inputs.atividade.value,
            objetivo: this.elements.inputs.objetivo.value,
            preset: this.currentPreset,
            timestamp: Date.now()
        };

        localStorage.setItem('nutrilife_calorie_calculator', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('nutrilife_calorie_calculator');
            if (saved) {
                const data = JSON.parse(saved);
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                
                // Carregar apenas se os dados têm menos de 24 horas
                if (data.timestamp > oneDayAgo) {
                    this.elements.inputs.peso.value = data.peso || '';
                    this.elements.inputs.altura.value = data.altura || '';
                    this.elements.inputs.idade.value = data.idade || '';
                    
                    if (data.genero) {
                        document.querySelector(`input[name="genero"][value="${data.genero}"]`).checked = true;
                    }
                    
                    this.elements.inputs.atividade.value = data.atividade || '';
                    this.elements.inputs.objetivo.value = data.objetivo || '';
                    
                    if (data.preset) {
                        this.setPreset(data.preset);
                    }
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar dados salvos:', error);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new CalorieCalculator();
}); 