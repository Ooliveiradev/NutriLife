// ===== CALCULADORA DE IMC =====

document.addEventListener('DOMContentLoaded', function() {
    const imcForm = document.getElementById('imcForm');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
    const pesoError = document.getElementById('pesoError');
    const alturaError = document.getElementById('alturaError');
    const resultDiv = document.getElementById('imcResult');
    const imcValue = document.getElementById('imcValue');
    const classification = document.getElementById('classification');
    const description = document.getElementById('description');

    // Validação em tempo real
    pesoInput.addEventListener('input', function() {
        validatePeso(this.value);
    });

    alturaInput.addEventListener('input', function() {
        validateAltura(this.value);
    });

    // Submissão do formulário
    imcForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value);
        
        // Validação final
        if (!validatePeso(peso) || !validateAltura(altura)) {
            return;
        }
        
        // Cálculo do IMC
        const imc = calculateIMC(peso, altura);
        
        // Classificação e exibição do resultado
        const result = classifyIMC(imc);
        displayResult(imc, result);
    });

    // Função para validar peso
    function validatePeso(peso) {
        const pesoNum = parseFloat(peso);
        
        if (isNaN(pesoNum) || pesoNum < 20 || pesoNum > 300) {
            pesoError.classList.add('show');
            return false;
        } else {
            pesoError.classList.remove('show');
            return true;
        }
    }

    // Função para validar altura
    function validateAltura(altura) {
        const alturaNum = parseFloat(altura);
        
        if (isNaN(alturaNum) || alturaNum < 50 || alturaNum > 250) {
            alturaError.classList.add('show');
            return false;
        } else {
            alturaError.classList.remove('show');
            return true;
        }
    }

    // Função para calcular IMC
    function calculateIMC(peso, altura) {
        // Converter centímetros para metros
        const alturaMetros = altura / 100;
        return peso / (alturaMetros * alturaMetros);
    }

    // Função para classificar IMC
    function classifyIMC(imc) {
        if (imc < 18.5) {
            return {
                classification: "Abaixo do peso",
                description: "Seu IMC indica que você está abaixo do peso ideal. Considere consultar um nutricionista para uma dieta balanceada e adequada às suas necessidades.",
                class: "underweight"
            };
        } else if (imc >= 18.5 && imc < 25) {
            return {
                classification: "Peso normal",
                description: "Parabéns! Seu IMC está na faixa considerada saudável. Mantenha hábitos saudáveis de alimentação e exercícios físicos regulares.",
                class: "normal"
            };
        } else if (imc >= 25 && imc < 30) {
            return {
                classification: "Sobrepeso",
                description: "Seu IMC indica sobrepeso. Considere adotar uma dieta mais equilibrada e aumentar a atividade física. Consulte um profissional de saúde.",
                class: "overweight"
            };
        } else {
            return {
                classification: "Obesidade",
                description: "Seu IMC indica obesidade. É altamente recomendável consultar um médico e um nutricionista para um plano de saúde personalizado e seguro.",
                class: "obese"
            };
        }
    }

    // Função para exibir resultado
    function displayResult(imc, result) {
        // Atualizar valores
        imcValue.textContent = imc.toFixed(1);
        classification.textContent = result.classification;
        description.textContent = result.description;
        
        // Remover classes anteriores
        resultDiv.classList.remove('underweight', 'normal', 'overweight', 'obese');
        
        // Adicionar nova classe e mostrar resultado
        resultDiv.classList.add(result.class, 'show');
        
        // Scroll suave para o resultado
        resultDiv.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    // Limpar formulário quando necessário
    function clearForm() {
        imcForm.reset();
        resultDiv.classList.remove('show', 'underweight', 'normal', 'overweight', 'obese');
        pesoError.classList.remove('show');
        alturaError.classList.remove('show');
    }

    // Adicionar botão de limpar (opcional)
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = 'Limpar';
    clearButton.className = 'btn-clear';
    clearButton.style.cssText = `
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s ease;
    `;
    
    clearButton.addEventListener('mouseenter', function() {
        this.style.background = '#5a6268';
    });
    
    clearButton.addEventListener('mouseleave', function() {
        this.style.background = '#6c757d';
    });
    
    clearButton.addEventListener('click', clearForm);
    
    // Adicionar botão após o formulário
    imcForm.appendChild(clearButton);

    // Adicionar dicas de uso
    const tips = document.createElement('div');
    tips.className = 'imc-tips';
    tips.innerHTML = `
        <h4>💡 Dicas para um cálculo preciso:</h4>
        <ul>
            <li>Use uma balança confiável para medir seu peso</li>
            <li>Meça sua altura em centímetros, sem sapatos</li>
            <li>Faça as medições pela manhã, em jejum</li>
            <li>O IMC é uma ferramenta de triagem, não um diagnóstico médico</li>
        </ul>
    `;
    tips.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 10px;
        padding: 20px;
        margin-top: 20px;
        font-size: 14px;
    `;
    
    tips.querySelector('h4').style.cssText = `
        color: #495057;
        margin-bottom: 10px;
        font-size: 16px;
    `;
    
    tips.querySelector('ul').style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
    `;
    
    tips.querySelectorAll('li').forEach(li => {
        li.style.cssText = `
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        `;
        li.style.setProperty('--before-content', '"•"');
        li.style.setProperty('--before-color', '#28a745');
    });
    
    // Adicionar dicas após o formulário
    imcForm.parentNode.insertBefore(tips, imcForm.nextSibling);
}); 