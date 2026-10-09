# Desafio PGE - Automação de testes do Inventário CTI

Projeto de testes end-to-end com Cypress para o ambiente de homologação do Inventário CTI da Procuradoria-Geral do Estado do Ceará.

## Escopo desta publicação

Esta publicação reúne as suítes abaixo, com os limites de validação registrados:

| Módulo | Arquivo |
| --- | --- |
| Cadastro de Ativos | `cypress/e2e/ativos/cadastro_ativos.cy.js` |
| Edição de Ativos e histórico | `cypress/e2e/ativos/edicao_ativos.cy.js` |
| HU01 - Cadastro de Atribuições | `cypress/e2e/atribuicoes/cadastro_atribuicoes.cy.js` |
| HU02 - Edição de Atribuições | `cypress/e2e/atribuicoes/edicao_atribuicao.cy.js` |
| HU03 - Geração de Termos | `cypress/e2e/termos/geracao_termos.cy.js` |
| HU04 - Movimentação de Ativos | `cypress/e2e/Relatorios/movimentacao_de_ativos.cy.js` |
| HU05 - Atribuições por Área | `cypress/e2e/Relatorios/atribuicoes_por_area.cy.js` |

A documentação descreve o escopo completo do desafio; um cenário planejado não equivale a um cenário executado ou aprovado.

## Pré-requisitos

- Node.js 24.x e npm. As validações locais utilizaram Node.js 24.19.0 e Cypress 16.1.1.
- Google Chrome instalado, para os comandos de execução abaixo.
- Acesso ao ambiente `http://testeqa.pge.ce.gov.br` e uma conta com permissão para os fluxos testados.

A aplicação é externa. Não é necessário iniciar um servidor de aplicação neste repositório.

## Instalação

```bash
git clone https://github.com/vitoriaMdeA/Desafio-PGE-QA.git
cd Desafio-PGE-QA
npm ci
```

Copie `cypress.env.json.example` para `cypress.env.json` e preencha `USER_EMAIL` e `USER_PASSWORD` com as credenciais fornecidas para homologação.

No PowerShell:

```powershell
Copy-Item cypress.env.json.example cypress.env.json
```

No Linux/macOS:

```bash
cp cypress.env.json.example cypress.env.json
```

O arquivo com credenciais é local e está excluído do versionamento.

## Executar os testes

Para abrir a interface do Cypress:

```bash
npx cypress open
```

Para executar todas as suítes disponíveis nesta publicação:

```bash
npx cypress run --browser chrome
```

Para executar somente a HU02:

```bash
npx cypress run --browser chrome --spec "cypress/e2e/atribuicoes/edicao_atribuicao.cy.js"
```

Para executar somente a HU03:

```bash
npx cypress run --browser chrome --spec "cypress/e2e/termos/geracao_termos.cy.js"
```

Para executar somente a HU04:

```bash
npx cypress run --browser chrome --spec "cypress/e2e/Relatorios/movimentacao_de_ativos.cy.js"
```

Para executar somente a HU05, com o mesmo navegador da validação registrada:

```bash
npx cypress run --spec "cypress/e2e/Relatorios/atribuicoes_por_area.cy.js"
```

Para registrar vídeo da execução:

```bash
npx cypress run --browser chrome --config video=true
```

As capturas de falha ficam em `cypress/screenshots`, os vídeos em `cypress/videos` e os arquivos gerados em `cypress/downloads`. Esses diretórios de execução ficam fora do Git.

## Organização e abordagem

- `cypress/e2e`: cenários por módulo e história de usuário.
- `cypress/support/commands`: autenticação, operações de interface e preparação de dados por API.
- `cypress/fixtures`: dados de entrada dos cenários.
- `cypress.config.js`: configuração do ambiente e tarefas Node.
- `docs`: plano de testes, manual, reports e evidências documentais.

Os cenários utilizam dados próprios com identificadores únicos, sessão de autenticação reutilizável, verificações de requisições e validações pela interface. A preparação por API mantém a interface como caminho de execução das ações avaliadas nos testes. As verificações de edição incluem persistência, vínculos dos ativos, cancelamento e histórico.

## Documentação

| Documento | Markdown | Word |
| --- | --- | --- |
| Plano de testes e execução | [Plano](docs/PLANO_DE_TESTES.md) | [Plano em Word](<Plano de teste e execucao InventarioCTI.docx>) |
| Manual de qualidade e usuário | [Manual](docs/MANUAL_USUARIO_QA.md) | [Manual em Word](<Manual do usuario InventarioCTI.docx>) |
| Bugs e melhorias | [Reports](docs/BUG_REPORTS.md) | [Reports em Word](<Bugs e melhorias InventarioCTI.docx>) |

As imagens e os registros referenciados pelos documentos ficam em `docs/assets` e fazem parte da documentação versionada.
