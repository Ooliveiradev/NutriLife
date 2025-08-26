// Calculadora de Calorias - NutriLife

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('cal-form');
  const overlay = document.getElementById('cal-modal-overlay');
  const modal = document.getElementById('cal-modal');
  const modalBody = document.getElementById('cal-modal-body');
  const closeBtn = document.getElementById('cal-modal-close');

  function calcularCalorias({ sexo, idade, peso, altura, atividade, objetivo }) {
    // Fórmula de Harris-Benedict (BMR)
    let bmr;
    if (sexo === 'masculino') {
      bmr = 88.36 + (13.4 * peso) + (4.8 * altura) - (5.7 * idade);
    } else {
      bmr = 447.6 + (9.2 * peso) + (3.1 * altura) - (4.3 * idade);
    }
    const tdee = bmr * atividade;
    let objetivoKcal = tdee;
    let objetivoLabel = 'Manutenção';
    if (objetivo === 'emagrecer') {
      objetivoKcal = tdee - 400;
      objetivoLabel = 'Emagrecimento';
    } else if (objetivo === 'ganhar') {
      objetivoKcal = tdee + 350;
      objetivoLabel = 'Ganho de Massa';
    }
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      objetivoKcal: Math.round(objetivoKcal),
      objetivoLabel
    };
  }

  function showModal(resultado) {
    modalBody.innerHTML = `
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:2.2em;font-weight:700;color:#50A055">${resultado.objetivoKcal} kcal</div>
        <div style="font-size:1.1em;color:#888;margin-bottom:8px">Calorias‑alvo (${resultado.objetivoLabel})</div>
      </div>
      <div style="display:flex;justify-content:center;gap:18px;margin-bottom:18px;flex-wrap:wrap">
        <div>
          <div style="font-size:1.1em;font-weight:600;color:#555">BMR</div>
          <div style="font-size:1.2em">${resultado.bmr} kcal</div>
        </div>
        <div>
          <div style="font-size:1.1em;font-weight:600;color:#555">TDEE</div>
          <div style="font-size:1.2em">${resultado.tdee} kcal</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:18px">
        <button id="cal-modal-ok" class="btn-calculate" style="width:80%;max-width:260px">OK</button>
      </div>
    `;
    overlay.classList.add('show');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const okBtn = document.getElementById('cal-modal-ok');
      if (okBtn) okBtn.onclick = closeModal;
    }, 100);
  }

  function closeModal() {
    overlay.classList.remove('show');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  closeBtn.onclick = closeModal;
  overlay.onclick = closeModal;

  form.onsubmit = function (e) {
    e.preventDefault();
    const sexo = form.sexo.value;
    const idade = parseInt(form.idade.value);
    const peso = parseFloat(form.peso.value);
    const altura = parseFloat(form.altura.value);
    const atividade = parseFloat(form.atividade.value);
    const objetivo = form.objetivo.value;
    if (!sexo || !idade || !peso || !altura || !atividade || !objetivo) return;
    const resultado = calcularCalorias({ sexo, idade, peso, altura, atividade, objetivo });
    showModal(resultado);
  };
});
