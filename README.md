# 🚀 Automador de Diárias e-Fisco (SEFAZ-PE)

> Extensão do Google Chrome desenvolvida com o auxílio de IA Generativa para automação de processos orçamentários e financeiros complexos no sistema e-Fisco.

---

## 📌 Sobre o Projeto

O lançamento manual de diárias (geração de Documento Hábil - DH e sua respectiva Liquidação - LE) em sistemas governamentais legados envolve etapas repetitivas, preenchimentos manuais de dados tributários e validações de CPF. 

Esta extensão foi desenvolvida para **eliminar gargalos operacionais**, reduzindo o tempo de lançamento em mais de **80%** e minimizando erros humanos de digitação.

## 🛠️ Tecnologias e Metodologia

* **Frontend & Core:** JavaScript (ES6+), Chrome Extensions API (Manifest V3), HTML5, CSS3.
* **Automação & DOM:** Injeção de scripts resilientes com caçadores de elementos visíveis, manipulação de AJAX e simulação de eventos do usuário.
* **Desenvolvimento Guiado por IA:** Engenharia de prompt avançada (Gemini/Claude) para arquitetura de código, tratamento de exceções assíncronas e modularização.

---

## ✨ Principais Funcionalidades

- **Fluxo Modular de Execução:** Permite disparar apenas a criação do DH, apenas a Liquidação ou o fluxo completo ponta a ponta.
- **Resiliência a Carregamentos Assíncronos (AJAX):** Sistema de detecção de visibilidade de elementos para lidar com latência de rede do e-Fisco.
- **Interface Lateral (Sidepanel):** Gerenciamento de filas de tarefas, inserção manual de DHs, status em tempo real e remoção individual de cards.
- **Validação Automática:** Limpeza de máscaras de CPF, cálculo automatizado de competência/datas e enquadramento tributário automático.

---

## 📂 Como Instalar e Testar Localmente

1. Clone este repositório:
   ```bash
   git clone [https://github.com/SEU-USUARIO/efisco-diarias-extension.git](https://github.com/SEU-USUARIO/efisco-diarias-extension.git)
