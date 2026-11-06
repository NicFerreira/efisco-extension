// Função auxiliar para enviar a ordem para a aba ativa
function iniciarProcesso(actionMsg, modo, diaria) {
  const empenho = document.getElementById('numEmpenho').value;
  chrome.storage.local.set({ 
    diariaEmAndamento: diaria, 
    modoExecucao: modo, 
    empenhoAtual: empenho 
  }, () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: actionMsg });
    });
  });
}

function renderizarDiarias(diarias) {
  const container = document.getElementById('listaDiarias');
  container.innerHTML = '';
  
  diarias.forEach((diaria, index) => {
    const div = document.createElement('div');
    div.className = 'diaria-item';
    
    let htmlExtra = '';
    
    // Status visual
    if (diaria.dhGerado) {
      div.style.borderLeft = "5px solid #2e7d32"; 
      div.style.backgroundColor = "#e8f5e9"; 
      htmlExtra += `<br><strong style="color: #2e7d32; font-size: 12px; display: block; margin-top: 8px;">✅ DH: ${diaria.dhGerado}</strong>`;
    }
    if (diaria.leGerado) {
      htmlExtra += `<strong style="color: #1565c0; font-size: 12px; display: block; margin-top: 2px;">✅ Liq: ${diaria.leGerado}</strong>`;
    }
    
    // Constrói os botões lado a lado
    let botoesHTML = '';
    if (!diaria.leGerado) {
      botoesHTML = `<div class="botoes-acao">`;
      
      if (!diaria.dhGerado) {
        botoesHTML += `<button id="btn-dh-${index}" class="btn-acao" title="Lançar Apenas DH">Lançar DH</button>`;
      }
      
      botoesHTML += `<button id="btn-liq-${index}" class="btn-acao" title="Lançar Apenas Liquidação">Lançar Liq.</button>`;
      
      if (!diaria.dhGerado) {
        botoesHTML += `<button id="btn-completo-${index}" class="btn-acao btn-destaque" title="Lançar Fluxo Completo">Completo</button>`;
      }
      botoesHTML += `</div>`;
      
      // A Caixinha do DH oculta por padrão
      if (!diaria.dhGerado) {
        botoesHTML += `
          <div id="dh-manual-${index}" class="dh-manual-container" style="display: none;">
            <input type="text" id="input-dh-${index}" placeholder="Digite o nº do DH...">
            <button id="btn-salvar-dh-${index}" class="btn-salvar-dh">Salvar</button>
          </div>
        `;
      }
    }
    
    // Insere o card inteiro (Note o botão ❌ no início)
    div.innerHTML = `
      <button class="btn-excluir" id="btn-excluir-${index}" title="Remover este servidor">❌</button>
      <div class="info">
        <strong>${diaria.nome}</strong><br>
        <div class="badges">
          <span class="badge">CPF: ${diaria.cpf}</span>
          <span class="badge">R$ ${diaria.valor}</span>
        </div>
        PLR: ${diaria.plr} | SEI: ${diaria.sei}
        ${htmlExtra}
      </div>
      ${botoesHTML}
    `;
    
    container.appendChild(div);
    
    // --- EVENTOS DE CLIQUE ---

    // 1. Botão de Excluir Individual
    document.getElementById(`btn-excluir-${index}`).addEventListener('click', () => {
      if (confirm(`Remover os dados de ${diaria.nome} da lista?`)) {
        chrome.storage.local.get(['diariasSalvas'], (res) => {
          let arrayAtualizado = res.diariasSalvas || [];
          arrayAtualizado.splice(index, 1); // Remove 1 item na posição atual
          chrome.storage.local.set({ diariasSalvas: arrayAtualizado });
        });
      }
    });

    // 2. Botão de Salvar DH Manual
    if (!diaria.dhGerado && !diaria.leGerado) {
      document.getElementById(`btn-salvar-dh-${index}`).addEventListener('click', () => {
        const dhManual = document.getElementById(`input-dh-${index}`).value.trim();
        if (dhManual) {
          chrome.storage.local.get(['diariasSalvas'], (res) => {
            let diariasAtualizadas = res.diariasSalvas || [];
            diariasAtualizadas[index].dhGerado = dhManual;
            chrome.storage.local.set({ diariasSalvas: diariasAtualizadas });
          });
        } else {
          alert("Por favor, digite o número primeiro.");
        }
      });
    }

    // 3. Botões de Lançamento
    if (!diaria.leGerado) {
      if (!diaria.dhGerado) {
        document.getElementById(`btn-dh-${index}`).addEventListener('click', () => {
          iniciarProcesso('iniciar_dh', 'dh_apenas', diaria);
        });
        document.getElementById(`btn-completo-${index}`).addEventListener('click', () => {
          iniciarProcesso('iniciar_completo', 'completo', diaria);
        });
      }
      
      document.getElementById(`btn-liq-${index}`).addEventListener('click', () => {
        // Se o usuário clicar em "Só Liq." mas não tiver DH, nós expandimos a caixinha!
        if(!diaria.dhGerado) {
          const divManual = document.getElementById(`dh-manual-${index}`);
          if (divManual.style.display === 'none') {
            divManual.style.display = 'flex';
            document.getElementById(`input-dh-${index}`).focus();
          } else {
            divManual.style.display = 'none'; // Fecha se clicar de novo
          }
          return; // Trava a execução e impede o erro
        }
        
        iniciarProcesso('iniciar_liq', 'liq_apenas', diaria);
      });
    }
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.diariasSalvas) {
    renderizarDiarias(changes.diariasSalvas.newValue);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['diariasSalvas'], function(resultado) {
    if (resultado.diariasSalvas && resultado.diariasSalvas.length > 0) {
      renderizarDiarias(resultado.diariasSalvas);
    }
  });
});

document.getElementById('btnCarregar').addEventListener('click', () => {
  const input = document.getElementById('jsonInput').value;
  if (!input) return; 
  try {
    const diarias = JSON.parse(input);
    chrome.storage.local.set({ diariasSalvas: diarias }, () => { document.getElementById('jsonInput').value = ''; });
  } catch (e) { alert('Erro ao ler os dados. Verifique a cópia da planilha.'); }
});

document.getElementById('btnLimpar').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todos os dados da extensão?')) {
    chrome.storage.local.remove(['diariasSalvas'], () => { document.getElementById('listaDiarias').innerHTML = ''; });
  }
});