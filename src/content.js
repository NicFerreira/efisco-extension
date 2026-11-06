function dispararEvento(elemento, nomeEvento) {
  if (elemento) {
    const evento = new Event(nomeEvento, { bubbles: true, cancelable: true });
    elemento.dispatchEvent(evento);
  }
}

function forcarInteracaoExtrema(elemento, valor) {
  elemento.focus();
  elemento.value = valor;
  dispararEvento(elemento, 'keyup');
  dispararEvento(elemento, 'input');
  dispararEvento(elemento, 'change');
  dispararEvento(elemento, 'blur');
  elemento.blur();
}

function isVisivel(elemento) {
  const estilo = window.getComputedStyle(elemento);
  return elemento.offsetWidth > 0 && elemento.offsetHeight > 0 && estilo.visibility !== 'hidden' && estilo.display !== 'none';
}

// CAÇADOR TURBINADO: Agora espera até 60 SEGUNDOS (120 tentativas de 500ms)
function esperarElemento(seletor, callback) {
  let tentativas = 0;
  const intervalo = setInterval(() => {
    const elemento = document.querySelector(seletor);
    if (elemento && isVisivel(elemento)) {
      clearInterval(intervalo);
      callback(elemento);
    } else {
      tentativas++;
      if (tentativas >= 120) { // 60 segundos
        clearInterval(intervalo);
        console.warn(`Extensão: Tempo limite esgotado (60s). O elemento não ficou visível: ${seletor}`);
      }
    }
  }, 500);
}

// CAÇADOR DE TEXTO TURBINADO: Agora espera até 60 SEGUNDOS
function esperarTexto(regex, callback) {
  let tentativas = 0;
  const intervalo = setInterval(() => {
    const match = document.body.innerText.match(regex);
    if (match) {
      clearInterval(intervalo);
      callback(match[0]); 
    } else {
      tentativas++;
      if (tentativas >= 120) { // 60 segundos
        clearInterval(intervalo);
        console.warn("Extensão: Tempo limite esgotado (60s) aguardando texto na tela.");
      }
    }
  }, 500);
}

// --- BLOCOS DE PREENCHIMENTO ---
function executarPreenchimento(diaria, empenhoAtual) {
  const campoUG = document.getElementById('CdUnidadeGestora');
  if (campoUG) { campoUG.value = "120201"; dispararEvento(campoUG, 'change'); }

  const campoSEI = document.getElementById('NumeroSEI');
  if (campoSEI) { campoSEI.value = diaria.sei; dispararEvento(campoSEI, 'change'); }

  const campoTipoDoc = document.getElementById('CdTipoDocumentoHabil');
  if (campoTipoDoc) { campoTipoDoc.value = "CI"; dispararEvento(campoTipoDoc, 'change'); }

  const campoValor = document.getElementById('vlTotalDocumento');
  if (campoValor) { 
    let valorFormatado = Number(String(diaria.valor).replace(',', '.')).toFixed(2).replace('.', ',');
    campoValor.value = valorFormatado; 
    dispararEvento(campoValor, 'change'); 
  }

  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  const dia = String(hoje.getDate()).padStart(2, '0');

  const campoMes = document.getElementById('DtMesCompetencia');
  if (campoMes) { campoMes.value = `${mes}/${ano}`; dispararEvento(campoMes, 'change'); }

  const campoData = document.getElementById('DtDocumentoHabil');
  if (campoData) { campoData.value = `${ano}-${mes}-${dia}`; dispararEvento(campoData, 'change'); }

  setTimeout(() => {
    const campoCI = document.getElementById('VlCampo1');
    if (campoCI) { campoCI.value = diaria.plr; dispararEvento(campoCI, 'change'); }

    const campoHistorico = document.getElementById('VlCampo4');
    if (campoHistorico) { campoHistorico.value = diaria.historico; dispararEvento(campoHistorico, 'change'); }

    const radioEmpenho = document.getElementById('tpAssociacaoEmpenhoSim');
    if (radioEmpenho) {
      radioEmpenho.click(); 
      setTimeout(() => {
        const campoEmpenho = document.getElementById('sqEmpenho');
        if (campoEmpenho) {
          forcarInteracaoExtrema(campoEmpenho, empenhoAtual || "13");
          
          esperarElemento('input[id="tpDocumentoCredor"][value="C"]', (radioCredor) => {
            radioCredor.checked = true; radioCredor.click(); dispararEvento(radioCredor, 'change');
            
            esperarElemento('#chaveFatoGeradorAtual', (selectFatoGerador) => {
              selectFatoGerador.value = "DIARIAS"; dispararEvento(selectFatoGerador, 'change');
              
              esperarElemento('#radio-contratoNao', (radioContratoNao) => {
                radioContratoNao.checked = true; radioContratoNao.click(); dispararEvento(radioContratoNao, 'change');
                
                esperarElemento('button[onclick^="verificarJanelaAuxiliarEnquadramentos"]', (btnAdicionar) => {
                  chrome.storage.local.set({ etapaAtual: 'janela_enquadramento' }, () => btnAdicionar.click());
                });
              });
            });
          });
        }
      }, 800);
    }
  }, 1500);
}

function continuarLiquidacaoAposDH(diaria) {
  esperarElemento('#dtLiquidacao', (campoData) => {
    if (campoData.value === "") {
      const hoje = new Date();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const dia = String(hoje.getDate()).padStart(2, '0');
      
      campoData.focus();
      campoData.value = `${dia}/${mes}/${ano}`; 
      dispararEvento(campoData, 'keyup');
      dispararEvento(campoData, 'change');
      campoData.blur();
      dispararEvento(campoData, 'blur');
      document.body.click(); 
      
      esperarElemento('#vlItemLiquidacao', (campoValor) => {
        if (campoValor.value === "") {
          campoValor.focus();
          let valorFormatado = Number(String(diaria.valor).replace(',', '.')).toFixed(2).replace('.', ',');
          campoValor.value = valorFormatado;
          dispararEvento(campoValor, 'keyup');
          dispararEvento(campoValor, 'input');
          dispararEvento(campoValor, 'change');
          campoValor.blur();
          dispararEvento(campoValor, 'blur');
          document.body.click();
        }

        setTimeout(() => {
          const btnConfirmarLiq = document.querySelector('input[value="Confirmar (c)"]');
          if (btnConfirmarLiq && isVisivel(btnConfirmarLiq)) {
            chrome.storage.local.set({ etapaAtual: 'liq_etapa_btt_nao' }, () => btnConfirmarLiq.click());
          }
        }, 2000);
      });
    }
  });
}

function executarLiquidacao(diaria, empenhoAtual) {
  const campoUG = document.getElementById('primeiro_campo');
  if (campoUG && campoUG.value === "") { 
    campoUG.value = "120201"; dispararEvento(campoUG, 'change'); return;
  }

  const campoEmpenho = document.getElementById('sqEmpenho');
  if (campoEmpenho && campoEmpenho.value === "") {
    forcarInteracaoExtrema(campoEmpenho, empenhoAtual || "13"); return;
  }

  const selectDH = document.getElementById('sqDHSelectnuDocumentoHabil');
  if (selectDH && selectDH.value === "" && diaria.dhGerado) {
    const ultimos6Digitos = diaria.dhGerado.slice(-6); 
    for (let i = 0; i < selectDH.options.length; i++) {
      if (selectDH.options[i].text.includes(ultimos6Digitos)) {
        selectDH.selectedIndex = i;
        dispararEvento(selectDH, 'click'); dispararEvento(selectDH, 'change'); dispararEvento(selectDH, 'blur'); document.body.click();
        
        setTimeout(() => { continuarLiquidacaoAposDH(diaria); }, 1500);
        return; 
      }
    }
  }

  if (selectDH && selectDH.value !== "") {
    continuarLiquidacaoAposDH(diaria);
  }
}

// === CÉREBRO CENTRAL ===
function rotearEtapas(resultado) {
  const { diariaEmAndamento, etapaAtual, empenhoAtual, modoExecucao } = resultado;
  if (!diariaEmAndamento || !etapaAtual) return;

  if (window.executandoEtapa === etapaAtual) return;
  window.executandoEtapa = etapaAtual;

  if (etapaAtual === 'preencher_dh') {
    executarPreenchimento(diariaEmAndamento, empenhoAtual);
  }
  
  else if (etapaAtual === 'janela_enquadramento') {
    esperarElemento('#cdTpContratacao', (campoContratacao) => {
      campoContratacao.value = "10[[*]]2"; dispararEvento(campoContratacao, 'change');
      esperarElemento('#grupoRendimento', (campoGrupo) => {
        campoGrupo.value = "10[[*]]2"; dispararEvento(campoGrupo, 'change');
        esperarElemento('#naturezaRendimento', (campoNatureza) => {
          campoNatureza.value = "10001[[*]]1"; dispararEvento(campoNatureza, 'change');
          esperarElemento('#tipoIsencao', (campoIsencao) => {
            campoIsencao.value = "2[[*]]2"; dispararEvento(campoIsencao, 'change');
            esperarElemento('#retencaoNao', (radioRetencaoNao) => {
              radioRetencaoNao.click(); 
              setTimeout(() => {
                const btnConfirmar = document.getElementById('btt_confirmar');
                if (btnConfirmar) chrome.storage.local.set({ etapaAtual: 'pronto_para_contabilizar' }, () => btnConfirmar.click());
              }, 800);
            });
          });
        });
      });
    });
  }
  
  else if (etapaAtual === 'pronto_para_contabilizar') {
    esperarElemento('#btt_contabilizar', (btnContabilizar) => {
      setTimeout(() => {
        chrome.storage.local.set({ etapaAtual: 'capturar_sucesso_dh' }, () => btnContabilizar.click());
      }, 2000); 
    });
  }

  else if (etapaAtual === 'capturar_sucesso_dh') {
    esperarTexto(/\d{4}DH\d+/, (numeroDHGerado) => {
      chrome.storage.local.get(['diariasSalvas'], (res) => {
        let diarias = res.diariasSalvas || [];
        let index = diarias.findIndex(d => d.cpf === diariaEmAndamento.cpf && d.sei === diariaEmAndamento.sei);
        if (index !== -1) { diarias[index].dhGerado = numeroDHGerado; }
        
        let diariaAtualizada = diariaEmAndamento;
        diariaAtualizada.dhGerado = numeroDHGerado;

        if (modoExecucao === 'completo') {
          chrome.storage.local.set({ 
            diariasSalvas: diarias, diariaEmAndamento: diariaAtualizada, etapaAtual: 'iniciar_liquidacao'
          }, () => {
            setTimeout(() => {
              window.location.href = "https://efisco.sefaz.pe.gov.br/sfi_fin_gfu/PRManterLiquidacao";
            }, 1000);
          });
        } else {
          chrome.storage.local.set({ diariasSalvas: diarias, diariaEmAndamento: null, etapaAtual: null, modoExecucao: null });
        }
      });
    });
  }

  else if (etapaAtual === 'iniciar_liquidacao') {
    esperarElemento('input[id="btt_incluir"][value*="Individual"]', (btnIncluirLIQ) => {
      chrome.storage.local.set({ etapaAtual: 'preencher_liquidacao' }, () => btnIncluirLIQ.click());
    });
  }
  
  else if (etapaAtual === 'preencher_liquidacao') {
    executarLiquidacao(diariaEmAndamento, empenhoAtual);
  }
  
  else if (etapaAtual === 'liq_etapa_btt_nao') {
    esperarElemento('#btt_nao', (btnNao) => {
      chrome.storage.local.set({ etapaAtual: 'liq_etapa_radio' }, () => btnNao.click());
    });
  }
  
  else if (etapaAtual === 'liq_etapa_radio') {
    esperarElemento('input[id="rdb_consulta"][value="511180"]', (radioConsulta) => {
      radioConsulta.checked = true; radioConsulta.click(); dispararEvento(radioConsulta, 'change');
      
      esperarElemento('#btt_confirmar', (btnConfirmarRadio) => {
        chrome.storage.local.set({ etapaAtual: 'liq_etapa_incluir_cpf' }, () => btnConfirmarRadio.click());
      });
    });
  }
  
  else if (etapaAtual === 'liq_etapa_incluir_cpf') {
    esperarElemento('input[id="btt_incluir"][value="Incluir"]', (btnIncluirCpf) => {
      chrome.storage.local.set({ etapaAtual: 'janela_cpf' }, () => btnIncluirCpf.click());
    });
  }
  
  else if (etapaAtual === 'janela_cpf') {
    esperarElemento('#valor', (campoValor) => {
      let valorFormatado = Number(String(diariaEmAndamento.valor).replace(',', '.')).toFixed(2).replace('.', ',');
      campoValor.value = valorFormatado; dispararEvento(campoValor, 'keyup');
      
      esperarElemento('#valoresAtributosContaCorrente', (campoCPF) => {
        const cpfLimpo = diariaEmAndamento.cpf.replace(/\D/g, '');
        campoCPF.value = cpfLimpo; dispararEvento(campoCPF, 'keyup'); dispararEvento(campoCPF, 'blur');
        
        setTimeout(() => {
          const btnConfirmarCpf = document.getElementById('btt_confirmar') || document.querySelector('input[value*="Confirmar"]');
          if (btnConfirmarCpf) chrome.storage.local.set({ etapaAtual: 'pronto_para_concluir_liq' }, () => btnConfirmarCpf.click());
        }, 1000);
      });
    });
  }

  // --- TRAVA DE SEGURANÇA MÁXIMA ---
  else if (etapaAtual === 'pronto_para_concluir_liq') {
    esperarElemento('input[id="btt_confirmar"][onclick*="processarInclusaoLiqEventoComplementar"]', (btnConfirmarFinal) => {
      // Quando o e-Fisco é lento, a janela do CPF fecha, mas a tabela por trás ainda está carregando.
      // 4000ms = 4 SEGUNDOS inteiros de pausa obrigatória antes de emitir o clique final.
      setTimeout(() => {
        chrome.storage.local.set({ etapaAtual: 'capturar_sucesso_liq' }, () => btnConfirmarFinal.click());
      }, 4000);
    });
  }
  
  else if (etapaAtual === 'capturar_sucesso_liq') {
    esperarTexto(/\d{4}LE\d+/, (numeroLEGerado) => {
      chrome.storage.local.get(['diariasSalvas'], (res) => {
        let diarias = res.diariasSalvas || [];
        let index = diarias.findIndex(d => d.cpf === diariaEmAndamento.cpf && d.sei === diariaEmAndamento.sei);
        if (index !== -1) { diarias[index].leGerado = numeroLEGerado; }
        chrome.storage.local.set({ diariasSalvas: diarias, diariaEmAndamento: null, etapaAtual: null, modoExecucao: null });
      });
    });
  }
}

window.addEventListener('load', () => {
  chrome.storage.local.get(['diariaEmAndamento', 'etapaAtual', 'empenhoAtual', 'modoExecucao'], rotearEtapas);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.etapaAtual && changes.etapaAtual.newValue) {
    chrome.storage.local.get(['diariaEmAndamento', 'etapaAtual', 'empenhoAtual', 'modoExecucao'], rotearEtapas);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const bttIncluirDH = document.querySelector('input[id="btt_incluir"][value*="Incluir"]');
  const bttIncluirLiq = document.querySelector('input[id="btt_incluir"][value*="Individual"]');
  const isTelaFormDH = document.getElementById('CdUnidadeGestora');
  const isTelaFormLiq = document.getElementById('primeiro_campo');

  if (request.action === "iniciar_dh" || request.action === "iniciar_completo") {
    if (bttIncluirDH) chrome.storage.local.set({ etapaAtual: 'preencher_dh' }, () => bttIncluirDH.click());
    else if (isTelaFormDH) chrome.storage.local.get(['diariaEmAndamento', 'empenhoAtual'], (r) => executarPreenchimento(r.diariaEmAndamento, r.empenhoAtual));
  }

  if (request.action === "iniciar_liq") {
    if (bttIncluirLiq) chrome.storage.local.set({ etapaAtual: 'preencher_liquidacao' }, () => bttIncluirLiq.click());
    else if (isTelaFormLiq) chrome.storage.local.get(['diariaEmAndamento', 'empenhoAtual'], (r) => executarLiquidacao(r.diariaEmAndamento, r.empenhoAtual));
  }
});