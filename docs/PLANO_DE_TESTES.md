# Plano de teste e execução InventárioCTI

*Desafio prático de Analista de Testes da PGE CE*

Versão 1.1 | 06 de outubro de 2026 | Situação dos cenários: planejados

Validar se o gestor consegue cadastrar e atualizar atribuições, manter o vínculo correto dos ativos e emitir termos e relatórios coerentes com os dados consultados. O plano orienta a execução manual e a automação em Cypress, com critérios claros para iniciar, interromper e concluir a validação.

### Escopo principal

As Histórias 01 a 04 do desafio definem o núcleo de aceitação. A História 05 será tratada com uma pendência de requisito, pois o fluxo aponta Atribuições por Área e os critérios repetem Movimentação de Ativos. Seus cenários de consulta sintética e analítica são provisórios até a confirmação do escopo.

O manual orienta os caminhos de navegação. As 14 tasks do documento de bugs orientam o reteste e a regressão. Cadastro de ativos, autenticação, depósito e demais telas entram como suporte ou cobertura complementar, sem ampliar as histórias oficiais por interpretação.

### Documentos de referência

- Teste Prático - Analista de Testes - Procuradoria Geral do Estado do Ceará - v2.pdf: requisitos e critérios de aceitação; Histórias 01 a 05 nas páginas 2 a 6.

- [MANUAL_USUARIO_QA.md](MANUAL_USUARIO_QA.md): procedimentos, capturas e índice atualizado do item 7.

- [BUG_REPORTS.md](BUG_REPORTS.md): BUG 1 a BUG 14, comportamento registrado, impacto e critérios de reteste.

- Projeto desafio-pge-cypress: specs, fixtures, comandos, package-lock.json, cypress.config.js e workflow de CI.

### Como usar este plano

Prepare ambiente e massa, aplique os critérios de entrada e execute na ordem indicada. Para cada cenário, registre a variante, o resultado observado e a evidência. Testes existentes no código ainda precisam de execução válida; os reports anteriores são referências para o reteste.

O catálogo contém 53 cenários lógicos, preservados nesta revisão, e 140 variantes identificadas no registro da seção 17. Cada ID CTxx.yy recebe resultado e evidência próprios. Nenhum cenário está marcado como aprovado neste plano.

## 1 Estratégia e limites da validação

### Abordagens

- Teste funcional pela interface: executar os fluxos completos e verificar os dados após reabrir o registro. Redirecionamento ou mensagem de sucesso, isoladamente, não comprovam persistência.

- Positivos e negativos: usar cadastros válidos, campos obrigatórios ausentes, ausência de seleção, consulta sem resultado e credenciais inválidas. Validar a mensagem e a ausência de gravação indevida.

- Partições e limites: variar colaborador presente/ausente, Presencial/Home Office, Office marcado/desmarcado e um/vários ativos. Para datas, usar início e fim do período, dias adjacentes, data impossível e intervalo invertido; regras ainda não definidas precisam ser confirmadas.

- Transição de estado: conferir o ativo antes e depois do vínculo, da substituição e da remoção por defeito. Verificar localização, responsabilidade e histórico nas telas disponíveis.

- Regressão por risco: priorizar integridade do tombo, vínculos, cancelamento e PDFs. Após uma correção, repetir a falha original e pelo menos um fluxo vizinho válido e um inválido.

- Exploração orientada: inspecionar navegação, zoom de 100%, legibilidade, filtros e mensagens de processamento. A exploração complementa os casos com resultado esperado definido.

### Oráculos de teste

O requisito do desafio define o resultado esperado das histórias confirmadas. Para as extensões, usar a regra validada com o responsável pelo produto. Comparar a interface e o PDF com a massa conhecida; HTTP 200 ou 302 não comprova autenticação, gravação nem conteúdo correto do arquivo.

### Prioridades de execução

P1: bloqueio do fluxo principal, perda de integridade ou documento inválido. P2: validação, clareza e comportamento de apoio com menor impacto. P3: melhoria de conforto ou tela complementar. Esta prioridade organiza a execução; a prioridade e a severidade das tasks permanecem no documento de bugs.

### Limites

O ciclo cobre E2E, verificação de requisições dos fluxos e inspeção de PDF. Carga, concorrência em escala, auditoria de segurança, banco de dados e licenças fora dos campos das histórias exigem outro escopo. Medir o tempo observado da geração como diagnóstico; não reprovar por um limite de desempenho que ainda não foi acordado.

## 2 Ambiente ferramentas e preparação

Ambiente alvo: http://testeqa.pge.ce.gov.br. Usar a conta de gestor fornecida no desafio, sem reproduzir a senha nas evidências ou nos documentos publicados. Registrar data, horário, versão do sistema quando disponível, commit da suíte, navegador, sistema operacional, resolução e zoom.

| **Ferramenta** | **Uso no ciclo** | **Condição de uso** |
| --- | --- | --- |
| Cypress 16.1.1 | Automação E2E, interceptação de requisições e evidências. | Versão registrada no package-lock.json. Executar com as dependências travadas. |
| JavaScript e Node.js | Execução da suíte e tarefas de leitura de arquivos. | Escolher uma versão de Node aceita pelo Cypress instalado e registrar a versão usada. |
| Chrome e Electron | Chrome para validação manual e execução principal; Electron para conferência automatizada adicional. | Registrar as versões reais. Firefox/Edge entram apenas se fizerem parte da matriz acordada. |
| DevTools e leitor de PDF | Inspecionar rede, formulário, abertura e conteúdo visual dos documentos. | Correlacionar a requisição com o arquivo gerado no mesmo cenário. |
| pdf-parse 2.4.5 | Extrair texto de termos e relatórios por tarefa Node. | Validar a task lerPdf com um PDF conhecido antes do ciclo. A extração não substitui a inspeção visual. |
| Mochawesome 8.1.1 e utilitários | Relatório de resultado em JSON/HTML. | Dependências presentes; o reporter ainda precisa ser configurado e validado. |
| Git e GitHub Actions | Versionar suíte e anexar evidências de execução. | Workflow existente exige ajustes de runtime, comandos, credenciais e artefatos. |

### Preparação operacional

Instalar pelo lockfile com npm ci. Copiar cypress.env.json.example para cypress.env.json e preencher USER_EMAIL e USER_PASSWORD localmente, mantendo o arquivo fora do versionamento. Em CI, fornecer os valores por secrets. Abrir a suíte com npx cypress open e executar com npx cypress run --browser chrome --config video=true,screenshotOnRunFailure=true.

O script npm test atual é um placeholder. O workflow solicita npm run build e npm start, que não estão definidos, embora a aplicação seja externa. Corrigir essas condições e validar o reporter e a coleta de artefatos antes de usar a execução de CI como evidência.

## 3 Critérios de entrada saída e interrupção

### Entrada para cada rodada

- Ambiente acessível e login válido com o perfil necessário. Identificação da versão ou, quando indisponível, registro da URL e horário da rodada.

- Massa reservada: áreas, subáreas, colaborador, ativos disponíveis, atribuições próprias e resultados de consulta conhecidos. Os registros devem ser identificáveis pelo runId.

- Dependências instaladas e Cypress iniciado sem erro de configuração. Task de PDF validada e diretórios de evidência disponíveis.

- Manifesto com os cenários e suas variantes, prioridades, responsáveis e resultado esperado. Confirmar os campos obrigatórios e as regras pendentes antes de julgar esses casos.

- Baseline das tasks BUG 1 a BUG 14 registrada. A existência de um bug conhecido permite iniciar o reteste, mas não transforma o resultado em aprovado.

- HU05 identificada como pendente. Executar o núcleo confirmado enquanto a definição dessa história é esclarecida; sua aceitação formal fica bloqueada.

### Saída para concluir a execução

- 100% das variantes do manifesto possuem estado final: aprovado, reprovado ou bloqueado, com motivo. Casos não executados precisam constar como pendência; não concluir o ciclo como cobertura completa.

- Falhas registradas ou vinculadas a uma task existente, com dados para reprodução. PDFs, capturas, vídeos e logs associados ao cenário e à rodada.

- Resumo apresenta cobertura por história, total aprovado/reprovado/bloqueado/não executado, skips, riscos remanescentes e conclusão sobre a continuidade da validação.

### Saída para recomendar aceitação

- 100% dos critérios das histórias confirmadas cobertos por evidência; todas as variantes P1 aprovadas e nenhum defeito impeditivo de integridade, vínculo ou geração de documento aberto.

- Correções retestadas e regressão relevante aprovada. Pendências P2/P3 podem permanecer apenas com decisão explícita, impacto e responsável registrados.

- HU05 saneada e validada antes de afirmar aceitação de todas as cinco histórias. Um cenário com .skip, bloqueado ou sem evidência não atende ao critério.

### Suspensão e retomada

Interromper o cenário afetado quando houver indisponibilidade, perda da massa, falha de autenticação, versão alterada durante o ciclo ou risco de modificar registros de outra execução. Continuar apenas os casos independentes. Retomar após restabelecer a condição, repetir o smoke e registrar a nova rodada, preservando a evidência anterior.

## 4 Sequência de execução e responsabilidades

| **Etapa** | **Execução e responsável** | **Condição para avançar** |
| --- | --- | --- |
| 1 Preparação | Analista de testes: ambiente, dependências, manifesto e massa. | Critérios de entrada cumpridos; pendências identificadas. |
| 2 Smoke | Analista: CT42, CT44, CT01, CT11, CT21 e CT28, usando registros próprios. | Acesso, cadastro, edição, termo e consulta viáveis. Falha gera triagem antes da bateria dependente. |
| 3 Aceitação | Analista: CT01 a CT35, em lotes por história e variante. | Resultado e evidência registrados para cada execução. |
| 4 História 05 | Analista e responsável pelo requisito: revisar a divergência e executar CT36 a CT41. | Resultado exploratório separado da aceitação até confirmação dos critérios. |
| 5 Apoio | Analista: CT43 a CT53 e variantes dos 14 reports. | Escopo complementar identificado; regra de melhoria confirmada quando necessária. |
| 6 Reteste e regressão | Desenvolvimento informa a correção; analista repete o caso original e fluxos vizinhos. | Correção comprovada na versão atual, sem novo defeito no fluxo relacionado. |
| 7 Encerramento | Analista consolida; responsável pelo requisito avalia riscos e decisão. | Critérios de saída avaliados e pacote de evidências completo. |

### Dependências e isolamento

Cadastro de ativo prepara um item disponível; cadastro de atribuição cria um registro com esse item; termos e edição usam esse conjunto controlado. Relatórios precisam de movimentações com área, destino e datas conhecidos. Cada teste de edição prepara sua própria atribuição; não selecionar a primeira linha de uma lista compartilhada.

As etapas podem usar a mesma fábrica de massa, mas o resultado de um teste não deve ser a única pré-condição do seguinte. Se não houver API de preparação autorizada, criar os registros pela interface e identificar os IDs. Executar testes que alteram os mesmos recursos de forma sequencial.

### Reteste

Reexecutar a variante que falhou na versão corrigida e comparar com a evidência anterior. Acrescentar uma variante válida, uma inválida e os fluxos afetados pela mudança. Não encerrar a task apenas por desaparecimento da mensagem de erro: conferir persistência, vínculo ou conteúdo do PDF.

## 5 Massa e controle dos dados

Usar dados sintéticos e um identificador como QA_&lt;runId&gt;_&lt;caso&gt;_&lt;variante&gt;. Guardar IDs de ativos e atribuições, tombos, áreas, modalidades e valores esperados em um manifesto. Tombos únicos devem respeitar o formato aceito pela plataforma; reaproveitar o mesmo tombo somente no cenário de duplicidade.

| **Conjunto** | **Dados necessários** | **Finalidade** |
| --- | --- | --- |
| M01 Organização | Duas áreas válidas, uma com duas subáreas, colaboradores vinculados e um atendente válido. | Dependência Área/Subárea, mudança de lotação e atribuição sem colaborador. |
| M02 Ativos | Dois ou mais ativos disponíveis com tombos únicos; um item separado para cada teste de troca. | Vínculo simples/múltiplo, substituição e conferência de histórico. |
| M03 Atribuições | Registros próprios Presencial e Home Office; um com colaborador e outro sem; valores conhecidos de SO, Office e observação. | Cadastro, edição, cancelamento e comparação com termos. |
| M04 Movimentações | Duas áreas e datas conhecidas: início/fim do período e dias imediatamente anterior/posterior. | Inclusão/exclusão pelos filtros, agrupamento e contagem. A inclusão dos limites precisa de regra confirmada. |
| M05 Consulta vazia | Combinação válida de filtros sem registros, previamente conferida. | Mensagem de ausência de dados, evitando depender de um ano arbitrário. |
| M06 PDFs | PDF válido de termo, segundo PDF distinto e arquivo inadequado controlado. | Primeira anexação, novo anexo, rejeição e leitura do documento gerado. |
| M07 Depósito | Item elegível para devolução e item bloqueado por regra, caso existam nesse ambiente. | Seleção, operação em lote e motivo do bloqueio. |
| M08 Credenciais | Conta de testes válida e combinações inválidas sintéticas; conta isolada para alteração de senha. | Login, logout e gestão de conta sem alterar a credencial compartilhada. |

### Matriz de variantes

As variantes CTxx.yy estão individualizadas na seção 17 por campo, tipo de termo, filtro, resolução, módulo e resultado independente. Antes do ciclo, confirmar os campos e opções na versão testada; acrescentar somente variantes ausentes, com novos sufixos e registro da mudança de escopo.

### Pós-condição e limpeza

Registrar a localização, o status e os vínculos ao terminar. Restaurar apenas registros criados pelo ciclo, quando houver função e permissão de limpeza. Se a exclusão não estiver disponível, manter o inventário dos IDs e excluir essas massas das próximas consultas. Não alterar registros de terceiros nem depender de tombos fixos das fixtures como únicos dados de execução.

## 6 Rastreabilidade das histórias de atribuição

Os códigos HUxx.yy identificam os critérios na ordem do PDF; foram criados para rastrear este plano. A numeração não altera o texto do desafio. As evidências de cada variante devem referenciar o cenário CT correspondente.

| **Critério** | **Resultado a comprovar** | **Cenários** |
| --- | --- | --- |
| HU01.01 | Selecionar Área e Subárea da localização. | CT01, CT02, CT08 |
| HU01.02 | Atribuir a colaborador ou subárea sem colaborador. | CT01, CT02, CT04 |
| HU01.03 | Validar todos os campos com asterisco. | CT01, CT05 |
| HU01.04 | Permitir Presencial e Home Office. | CT03 |
| HU01.05 | Permitir selecionar Sistema Operacional. | CT02, CT09 |
| HU01.06 | Condicionar Pacote Office à checkbox. | CT06 |
| HU01.07 | Aceitar observações opcionais. | CT01, CT02, CT09 |
| HU01.08 | Vincular um ou vários ativos. | CT02, CT07 |
| HU01.09 | Salvar e descartar dados ao cancelar. | CT01, CT02, CT10 |
| HU01.10 | Confirmar cadastro e refletir os ativos atribuídos. | CT01, CT02, CT07 |
| HU02.01 | Abrir atribuição existente para edição. | CT11 |
| HU02.02 | Carregar todos os campos anteriores. | CT11 |
| HU02.03 | Modificar cada campo editável. | CT12, CT13, CT20 |
| HU02.04 | Mostrar tombo, descrição e status de todos os ativos. | CT11, CT14 |
| HU02.05 | Remover ativo pelo controle da linha. | CT15, CT16 |
| HU02.06 | Adicionar novo ativo após remoção. | CT15, CT16, CT17 |
| HU02.07 | Manter validação dos obrigatórios. | CT18 |
| HU02.08 | Registrar COM DEFEITO e motivo antes de remover. | CT16 |
| HU02.09 | Registrar DISPONÍVEL antes da substituição. | CT15 |
| HU02.10 | Disponibilizar Salvar e Cancelar. | CT12, CT19 |
| HU02.11 | Persistir alterações mantendo integridade. | CT12 a CT17, CT20 |
| HU02.12 | Descartar todas as alterações ao cancelar. | CT19 |
| HU02.13 | Confirmar a atualização. | CT12, CT15, CT16 |

## 6 Rastreabilidade de termos e relatórios

| **Critério** | **Resultado a comprovar** | **Cenários** |
| --- | --- | --- |
| HU03.01 | Oferecer Responsabilidade e Empréstimo. | CT21, CT22 |
| HU03.02 | Selecionar um único tipo de termo. | CT23 |
| HU03.03 | Disponibilizar Gerar. | CT21, CT22, CT23 |
| HU03.04 | Fechar o modal pelo X. | CT25 |
| HU03.05 | PDF com título, texto legal, nome, campo CPF, área, todos os ativos, local, data e assinatura. | CT21, CT22, CT26, CT27 |
| HU04.01 | Tela com filtros e visualização. | CT28 |
| HU04.02 | Filtros por todas as áreas cadastradas e período dd/mm/aaaa. | CT28, CT29, CT32 |
| HU04.03 | Pesquisar aplica filtros e atualiza a listagem. | CT29, CT31 |
| HU04.04 | Agrupar resultados pelo nome da área. | CT30 |
| HU04.05 | Mostrar data e quantidade por área. | CT30 |
| HU04.06 | Mostrar tombo, série, descrição, origem, destino e colaborador. | CT30 |
| HU04.07 | PDF em nova aba com agrupamento de área e data da consulta. | CT34, CT35 |
| HU04.08 | Informar ausência de movimentações. | CT31 |

### Pendência Q05 da História 05

A página 6 repete título, filtros de período, agrupamento e detalhes de movimentação da História 04, mas indica o caminho Atribuições por Área. O manual mostra filtros de Tipo, Área e Subárea e consultas Sintético/Analítico. Não há base suficiente para impor o critério de período à tela de atribuições.

Solicitar ao responsável pelo requisito a confirmação do módulo, filtros, agrupamentos, campos e conteúdo do PDF da HU05. Registrar a decisão e revisar a matriz antes da aceitação. Os oito critérios repetidos da HU05 permanecem pendentes; a cobertura semelhante de HU04 não comprova essa história.

CT36 a CT41 exercitam provisoriamente o comportamento do manual: tipo obrigatório, filtros opcionais, consulta sintética/analítica, PDF, ausência de dados e legibilidade. Seus resultados são exploratórios até o requisito ser confirmado. CT24, CT33 e as demais extensões também precisam de regra acordada quando o PDF não define o comportamento negativo.

## 7 Reteste das tasks de bugs

Reutilizar os números e títulos das tasks. Os registros anteriores não indicam o estado da versão atual. Confirmar a reprodução antes de encerrar ou atualizar um report; quando o comportamento depender de decisão de produto, registrar essa decisão junto do reteste.

| **Task** | **Falha ou melhoria a validar** | **Cenário e foco** |
| --- | --- | --- |
| BUG 1 | Cadastro aceita ativos com tombo duplicado | CT43: recusa, mensagem e unicidade persistida. |
| BUG 2 | Layout esconde conteúdo e ações | CT46: telas afetadas em zoom de 100%, sem clique forçado. |
| BUG 3 | Calendário abre somente pelo ícone | CT32: abertura do campo conforme regra de UX confirmada. |
| BUG 4 | Resposta HTTP na falha de autenticação | CT42: acesso negado e retorno verificável pelo contrato do login. |
| BUG 5 | Anexar outro termo provoca HTTP 500 | CT47: segundo anexo sem erro 500 e preservação do documento. |
| BUG 6 | Exportação sem recorte e sem feedback | CT50 e CT39: recorte definido e estado da geração. CT39 é provisório da HU05. |
| BUG 7 | Seleção bloqueada no Depósito CTI | CT48: elegibilidade, seleção e devolução do conjunto correto. |
| BUG 8 | Campo de senha sem opção de exibição | CT49: alternância mantém valor e não envia o formulário. |
| BUG 9 | Botões e ações com espaçamento insuficiente | CT51: alvos distinguíveis e ação no registro correto. |
| BUG 10 | PDF sintético não abre após a geração | CT38: arquivo válido, conteúdo correto e abertura no navegador. |
| BUG 11 | Acionamento dos filtros pouco evidente | CT29: Pesquisar aplica filtros e informa o resultado da consulta. |
| BUG 12 | Gráfico analítico com informações pouco legíveis | CT41: rótulos legíveis e coerência com a tabela. |
| BUG 13 | Grafia incorreta no alerta de geração de termos | CT24.01: conferir “Atribuições” no alerta sem seleção; preservar a validação e verificar a geração válida em CT21/CT22. |
| BUG 14 | Geração individual de termos retorna HTTP 502 | CT21 e CT22: gerar uma atribuição válida sem erro 502, conferir resposta e conteúdo do PDF; CT27: regressão do lote. |
| BUG 15 | Movimentação sem resultados exibe datas erradas na interface | CT46: validar consulta vazia com diferentes períodos e conferir as datas exibidas na mensagem de erro. |
| BUG 16 | Relatório PDF de movimentação abre na mesma aba | CT46: gerar relatório PDF e conferir abertura em nova aba (target="_blank" ou equivalente), preservando a consulta original. |

### Decisões de produto que afetam o esperado

As decisões Q01 a Q09 estão registradas na seção 16, com os casos afetados e a condição de validação. Todas permanecem pendentes. Para login, observar o contrato do formulário: não exigir HTTP 401/422 apenas por convenção de API.

## 8 Automação disponível e ajustes antes do ciclo

A leitura do repositório confirma a existência dos testes abaixo. A cobertura indicada é temática; não representa execução aprovada nem equivalência completa com os cenários deste plano.

| **Arquivo em cypress/e2e** | **Base existente** | **Ajuste ou conferência necessária** |
| --- | --- | --- |
| atribuicoes/cadastro_atribuicoes.cy.js | Obrigatórios, completo, alternativa de área, formulário vazio e cancelar. | Reabrir e comparar dados, vínculos e ausência de cadastro no cancelamento. |
| atribuicoes/edicao_atribuicao.cy.js | Alteração, substituição, defeito, validação e cancelar. | Preparar registro próprio. Hoje abre a primeira edição disponível; validar todos os campos e pós-condições. |
| termos/geracao_termos.cy.js | Massa própria de seis atribuições; exclusividade, tipos e modalidades; nos quatro lotes, dois IDs selecionados e uma terceira atribuição excluída, tipo enviado, HTTP 200, application/pdf e assinatura %PDF-. Etapa validada em 08/10/2026: 9/9 em 2min29s. | BUG 14 confirmado também com massa própria nas duas modalidades em 08/10/2026. Os quatro cenários individuais ainda não conferem a resposta do PDF. Validar a resposta individual após a correção, o conteúdo completo, a aparência e a nova aba real; os testes aprovados e a verificação do lote não comprovam correção do BUG 14. |
| relatorios/movimentacao_de_ativos.cy.js | Visibilidade, consulta vazia, agrupamento e filtros. | Caso de PDF com .skip. Comparar dados conhecidos, mensagem vazia e PDF completo. |
| relatorios/atribuicoes_por_area.cy.js | Consulta, vazio, obrigatórios e visibilidade. | Caso de PDF com .skip. Ratificar HU05 e separar Sintético/Analítico. |
| ativos/cadastro_ativos.cy.js | Tipos, obrigatórios, persistência e cancelar. | Duplicidade de tombo com .skip; manter reprovação conhecida visível no relatório. |
| ativos/edicao_ativos.cy.js | Histórico, dados carregados, editar, cancelar e erro de validação. | Correlacionar registros próprios com a massa do ciclo e o histórico esperado. |

### Padrão de implementação

Incluir o ID CT no nome do teste e guardar a variante da fixture. Usar seletores estáveis e localizar a linha pelo ID ou tombo. Esperar a requisição ou mudança de estado, evitando depender de tempos fixos. Para layout e seleção, não usar force: true como prova de que o controle é acessível ao usuário.

Manter assertions de persistência após salvar e de ausência de gravação após cancelar. Em PDFs, verificar resposta, arquivo, conteúdo e inspeção visual. Tratar .skip como não executado; anexar motivo e task. Executar manualmente quando possível e preservar o estado separado do teste automatizado.

## 9 Evidências e relatório de execução

### Registro por execução

Cada variante deve registrar: runId; ID CT e critério; massa e IDs dos registros; executor e horário; versão/commit/navegador; resultado esperado e observado; estado final; evidência; task relacionada. Nos prints inseridos nos documentos, manter Figura NN e legenda descritiva, seguindo o padrão existente e a numeração do documento de destino. Capturas do Cypress seguem esse mesmo padrão; o ID do teste e da rodada ficam no registro de execução, sem alterar a legenda da figura.

Usar os estados Planejado, Aprovado, Reprovado, Bloqueado e Não executado. Bloqueado exige uma dependência que impediu a ação; quando a ação ocorre e o produto diverge do esperado, o resultado é Reprovado. Um comportamento de melhoria ainda sem regra ratificada deve ser registrado como observado, com aceitação pendente.

### Evidência mínima por fluxo

- Cadastros e edições: dados de entrada, retorno e registro reaberto; no cancelamento ou erro, comprovação de que não houve alteração indevida.

- Termos e relatórios: filtros/seleção, requisição correspondente, PDF salvo e aberto, conteúdo esperado e ausência de dados de outros registros.

- Falhas: captura do problema, passo exato, dado usado, retorno de rede quando pertinente e vínculo com BUG existente ou novo report.

- Layout: captura no zoom de 100% com resolução e tela registradas. Vídeo para comportamento de abertura, seleção ou processamento.

### Conferência de PDFs

Validar resposta e tipo de conteúdo, arquivo não vazio e parsing sem erro. Comparar título, identidade, ativos, datas, agrupamentos e filtros com a massa. Abrir o arquivo para verificar legibilidade, páginas e ausência de cortes. A resposta HTTP 200 e uma palavra encontrada no texto não bastam para aprovar a geração.

### Resumo do ciclo

Informar totais por história e prioridade, versões testadas, tempo observado, bugs reproduzidos/corrigidos, cenários bloqueados e pendências de requisito. Cobertura de execução = variantes executadas (aprovadas + reprovadas) / total planejado. Taxa de aprovação = aprovadas / executadas. Informar bloqueadas, não executadas e skips separadamente; conservar o denominador original e documentar mudanças de escopo.

No pacote de entrega do desafio, reunir plano, cenários, manual, reports, instruções de execução e evidências em um commit identificável. Publicar apenas os artefatos necessários, com credenciais e dados pessoais de evidência mascarados. O enunciado pede capturas ou vídeo que demonstrem a execução; o relatório deve permitir localizar cada cenário.

## 10 Cenários de cadastro de atribuições

### CT01 Cadastro mínimo sem colaborador

HU01.01 .02 .03 .09 .10 | P1 | Automatizada e conferência manual

**Pré-condição e dados:** M01 e M03; gestor autenticado; subárea válida sem colaborador definido.

**Passos:** 1. Abra Nova Atribuição. 2. Preencha somente os campos com asterisco, incluindo Área, Subárea, Atendido por e Modalidade. 3. Salve, localize pelo ID do ciclo e reabra.

**Resultado esperado:** Cadastro confirmado e dados persistidos. Ausência de colaborador e observação opcional não bloqueia a operação.

### CT02 Cadastro completo com colaborador e ativo

HU01.01 .02 .05 .07 .08 .09 .10 | P1 | Automatizada

**Pré-condição e dados:** M01 a M03; colaborador válido e um ativo disponível com tombo conhecido.

**Passos:** 1. Informe localização, colaborador, modalidade, SO, Office quando habilitado e observação. 2. Use Atribuir Ativo e selecione o tombo. 3. Salve, reabra e consulte o ativo no inventário.

**Resultado esperado:** Todos os valores permanecem corretos, o vínculo pertence à atribuição criada e o inventário apresenta o ativo atribuído à localização/responsável esperados.

### CT03 Modalidades Presencial e Home Office

HU01.04 | P1 | Automatizada por variante

**Pré-condição e dados:** M03; dois conjuntos independentes com os mesmos campos obrigatórios.

**Passos:** 1. Cadastre uma atribuição Presencial. 2. Em outra variante, cadastre Home Office. 3. Reabra cada registro e consulte a listagem.

**Resultado esperado:** Ambas as modalidades podem ser selecionadas e persistem no registro correto; as ações da listagem continuam acessíveis.

### CT04 Destino com e sem colaborador

HU01.02 | P1 | Automatizada por variante

**Pré-condição e dados:** M01; subárea válida com colaborador elegível e variante sem colaborador.

**Passos:** 1. Cadastre para o colaborador conhecido. 2. Cadastre outro registro somente para a subárea. 3. Reabra e compare os dois destinos.

**Resultado esperado:** As duas formas de atribuição são aceitas; a variante sem colaborador não recebe vínculo residual ou dado de outro cadastro.

### CT05 Omissão dos campos obrigatórios no cadastro

HU01.03 | P1 | Automatizada por campo

**Pré-condição e dados:** M01; formulário válido de referência; lista de todos os campos com asterisco conferida na tela.

**Passos:** 1. Tente salvar o formulário vazio. 2. Em variantes independentes, remova apenas um obrigatório de um formulário válido. 3. Salve e procure eventual registro indevido.

**Resultado esperado:** Cada ausência bloqueia a conclusão, identifica o campo inválido e não cria atribuição. Os campos restantes não se perdem sem necessidade.

### CT06 Dependência da seleção de Pacote Office

HU01.06 | P2 | Automatizada

**Pré-condição e dados:** M03; opção de Office válida; SO e demais campos preenchidos.

**Passos:** 1. Confira o campo com Utilizará Pacote Office desmarcado. 2. Marque e selecione um pacote. 3. Salve e reabra. 4. Em outra variante, desmarque após escolher o pacote.

**Resultado esperado:** A seleção só fica disponível quando a checkbox está marcada. A gravação segue esse estado; o tratamento de um valor anterior ao desmarcar deve respeitar a regra confirmada.

### CT07 Vínculo de vários ativos

HU01.08 .10 | P1 | Automatizada

**Pré-condição e dados:** M02; dois ativos disponíveis com tombos distintos, reservados para o caso.

**Passos:** 1. Crie uma atribuição. 2. Adicione cada ativo por Atribuir Ativo. 3. Salve e reabra. 4. Consulte os dois itens no inventário.

**Resultado esperado:** Os dois ativos aparecem uma vez cada, com tombo e descrição corretos, vinculados à mesma atribuição e refletidos no inventário.

### CT08 Troca de Área e dependência de Subárea

HU01.01 e risco complementar | P2 | Automatizada

**Pré-condição e dados:** M01 com Área A/Subárea A1 e Área B/Subárea B1; relações conhecidas.

**Passos:** 1. Selecione A e A1. 2. Mude para B. 3. Confira as opções e escolha B1. 4. Salve e reabra.

**Resultado esperado:** A localização salva corresponde à seleção válida. A tela não mantém uma subárea incompatível silenciosamente; o mecanismo de ajuste depende da regra acordada.

### CT09 Sistema Operacional e observação opcional

HU01.05 .07 | P2 | Automatizada por variante

**Pré-condição e dados:** M03; duas opções válidas de SO e observação sintética com acentos e quebra de linha dentro dos limites da tela.

**Passos:** 1. Cadastre com SO e observação preenchidos. 2. Reabra e compare o texto. 3. Em outra variante, deixe a observação vazia.

**Resultado esperado:** O SO escolhido persiste; a observação preserva o conteúdo informado, e sua ausência não impede o cadastro. Não pressupor tamanho máximo não definido.

### CT10 Cancelamento do cadastro de atribuição

HU01.09 | P1 | Automatizada

**Pré-condição e dados:** M02 e M03; identificação exclusiva do caso e um ativo disponível.

**Passos:** 1. Preencha o formulário e adicione o ativo. 2. Clique em Cancelar. 3. Pesquise o registro pelo identificador e confira o estado do ativo.

**Resultado esperado:** A tela retorna ao fluxo de consulta, não há nova atribuição e o ativo não fica vinculado por dados que não foram salvos.

## 11 Cenários de edição de atribuições

### CT11 Carregamento completo da atribuição para edição

HU02.01 .02 .04 | P1 | Automatizada

**Pré-condição e dados:** M03; atribuição própria com todos os campos preenchidos e dois ativos; snapshot dos valores originais.

**Passos:** 1. Localize pelo ID. 2. Abra Editar na linha correta. 3. Compare Área, Subárea, Colaborador, Atendido por, Modalidade, SO, Office e Observações. 4. Confira os ativos.

**Resultado esperado:** Todos os dados anteriores são carregados. Cada ativo exibe tombo, descrição e status correspondentes ao snapshot.

### CT12 Alteração dos campos básicos e persistência

HU02.03 .10 .11 .13 | P1 | Automatizada

**Pré-condição e dados:** M03; atribuição própria e valores alternativos válidos para Atendido por, Modalidade e Observações.

**Passos:** 1. Edite os três campos. 2. Salve e confira a confirmação. 3. Reabra o mesmo ID e compare com os valores anteriores.

**Resultado esperado:** Os campos alterados persistem, os demais são preservados e o ID/vínculos da atribuição continuam os mesmos.

### CT13 Alteração de localização e colaborador

HU02.03 .11 | P1 | Automatizada por variante

**Pré-condição e dados:** M01 e M03; destino alternativo e colaborador válido, além de variante sem colaborador.

**Passos:** 1. Abra o registro próprio. 2. Altere Área, Subárea e Colaborador conforme a variante. 3. Salve, reabra e consulte os ativos vinculados.

**Resultado esperado:** Localização e responsável refletem o novo destino; não há combinação inválida de área/subárea nem referência residual ao colaborador removido.

### CT14 Conferência dos ativos já vinculados

HU02.04 .11 | P1 | Automatizada

**Pré-condição e dados:** M03; dois ativos com descrições e status conhecidos na atribuição.

**Passos:** 1. Abra a edição. 2. Compare cada linha dos ativos com a massa. 3. Salve uma mudança apenas de observação e reabra.

**Resultado esperado:** Nenhum ativo é omitido, duplicado ou trocado. Tombo, descrição e status permanecem corretos após alteração sem mudança de vínculo.

### CT15 Substituição com ativo disponibilizado

HU02.05 .06 .09 .11 .13 | P1 | Automatizada e conferência de histórico

**Pré-condição e dados:** M02/M03; ativo A atribuído e ativo B disponível, com tombos distintos.

**Passos:** 1. Selecione DISPONÍVEL para A. 2. Remova A. 3. Adicione B e salve. 4. Reabra a atribuição e consulte status/localização e histórico dos dois itens.

**Resultado esperado:** B substitui A sem duplicar vínculo; A fica disponível conforme a regra de retorno, B fica atribuído e a alteração é confirmada com histórico coerente.

### CT16 Troca de ativo com defeito registrado

HU02.05 .06 .08 .11 .13 | P1 | Automatizada e conferência de histórico

**Pré-condição e dados:** M02/M03; ativo A atribuído, B disponível e descrição de defeito conhecida.

**Passos:** 1. Marque COM DEFEITO para A e informe o problema. 2. Remova A. 3. Adicione B e salve. 4. Reabra e consulte o histórico de A.

**Resultado esperado:** A deixa a atribuição com defeito e descrição registrados; B fica vinculado corretamente. Nenhum ativo ou informação de defeito é perdido.

### CT17 Inclusão adicional sem remover o ativo anterior

HU02.06 .11 | P1 | Automatizada

**Pré-condição e dados:** M03 com um ativo; M02 com um segundo ativo disponível.

**Passos:** 1. Abra a edição do ID próprio. 2. Adicione o segundo ativo, mantendo o primeiro. 3. Salve e reabra.

**Resultado esperado:** A atribuição contém os dois ativos, uma vez cada, e preserva as informações do primeiro vínculo.

### CT18 Obrigatórios ausentes durante a edição

HU02.07 .11 | P1 | Automatizada por campo

**Pré-condição e dados:** M03; snapshot completo e lista dos obrigatórios da edição.

**Passos:** 1. Limpe um obrigatório por variante. 2. Tente salvar. 3. Reabra o ID em nova navegação e compare com o snapshot.

**Resultado esperado:** A validação impede atualização inválida, identifica o campo e preserva a versão anteriormente salva, inclusive vínculos.

### CT19 Cancelamento de alterações e vínculos

HU02.10 .12 | P1 | Automatizada

**Pré-condição e dados:** M03 com ativo A e snapshot; B disponível para uma troca não salva.

**Passos:** 1. Altere campo, remova A e adicione B. 2. Clique em Cancelar. 3. Reabra o ID e consulte os dois ativos.

**Resultado esperado:** Campos e vínculos originais permanecem. A continua vinculado e B não recebe uma atribuição decorrente da edição cancelada.

### CT20 Edição de SO e condição de Office

HU02.03 .11 | P2 | Automatizada por variante

**Pré-condição e dados:** M03 com SO e pacote conhecidos; opção alternativa válida.

**Passos:** 1. Altere SO e pacote com a checkbox marcada. 2. Salve e reabra. 3. Execute a variante com Office desmarcado e confira o valor persistido.

**Resultado esperado:** Cada campo editável persiste conforme a seleção. A opção de Office continua condicionada à checkbox e o tratamento do valor anterior segue a regra confirmada.

## 12 Cenários de geração de termos

### CT21 Termo de Responsabilidade de uma atribuição

HU03.01 .03 .05 | P1 | Automatizada e inspeção manual do PDF

**Pré-condição e dados:** M03; atribuição com colaborador, área e ativos conhecidos; repetir Presencial e Home Office.

**Passos:** 1. Marque somente a atribuição própria. 2. Abra Gerar Termos. 3. Selecione Responsabilidade e clique em Gerar. 4. Salve e abra o PDF.

**Resultado esperado:** PDF válido com título de Responsabilidade e dados do registro selecionado. Todos os itens de conteúdo da HU03.05 são conferidos em CT26.

**Reteste do BUG 14:** Reproduzir com uma única atribuição de massa própria nas duas modalidades e conferir a requisição de geração. Nos registros 1978 e 1982, a observação de 07/10/2026 retornou HTTP 502 e HTML de erro para Responsabilidade. O reteste de 08/10/2026 confirmou o mesmo resultado com massa própria: atribuição 2157 em Home Office e 2160 em Presencial. Após a correção, conferir resposta, integridade, abertura, conteúdo e aparência do PDF; repetir CT27 para comparar o lote. Evidências no [BUG 14](BUG_REPORTS.md#bug-14-geração-individual-de-termos-retorna-http-502).

### CT22 Termo de Empréstimo de uma atribuição

HU03.01 .03 .05 | P1 | Automatizada e inspeção manual do PDF

**Pré-condição e dados:** M03; atribuição própria com ativos conhecidos; repetir as duas modalidades.

**Passos:** 1. Selecione a atribuição. 2. Abra o modal e escolha Empréstimo. 3. Gere, salve e abra o PDF.

**Resultado esperado:** PDF válido com título de Empréstimo, sem conteúdo residual do tipo Responsabilidade e com dados correspondentes à seleção.

**Reteste do BUG 14:** Repetir Empréstimo com as mesmas atribuições usadas em CT21. Os dois registros do diagnóstico original retornaram HTTP 502 na seleção individual; juntos retornaram HTTP 200, application/pdf e assinatura %PDF-. Em 08/10/2026, as atribuições próprias 2157 e 2160 também retornaram HTTP 502 individualmente. Os pares 2157/2158 e 2160/2161 retornaram PDF nos dois tipos. Essa comparação não aprova o conteúdo completo dos termos nem substitui CT26.

### CT23 Exclusividade dos tipos e botão Gerar

HU03.02 .03 | P2 | Automatizada

**Pré-condição e dados:** M03; uma atribuição marcada e modal aberto.

**Passos:** 1. Escolha Responsabilidade. 2. Escolha Empréstimo. 3. Volte para Responsabilidade. 4. Confira a seleção e a disponibilidade do botão Gerar.

**Resultado esperado:** Somente um tipo permanece selecionado a cada troca; Gerar está disponível para iniciar a operação válida.

### CT24 Geração sem atribuição ou sem tipo selecionado

Complementar HU03; regra negativa a confirmar | P2 | Automatizada por variante

**Pré-condição e dados:** Fluxo de termos acessível; variantes sem checkbox de atribuição e sem tipo de termo.

**Passos:** 1. Tente gerar sem atribuição. 2. Repita com atribuição e tipo não informado quando a interface permitir. 3. Observe retorno e arquivo.

**Resultado esperado:** Conforme a regra ratificada, a tela orienta a seleção e não gera PDF vazio ou de registros não selecionados. Registrar a regra e a mensagem antes da aceitação.

**Reteste do BUG 13:** Na observação de 07/10/2026, o botão Gerar dentro do modal acionou o alerta “Selecione um tipo de Termo e uma ou mais Atribuiçôes” quando não havia atribuição selecionada. Após a melhoria na aplicação, conferir a grafia “Atribuições” e preservar o comportamento de validação. Evidências e reprodução: [BUG 13](BUG_REPORTS.md#bug-13-grafia-incorreta-no-alerta-de-geração-de-termos), figura 28 e assets/bugs/bug-13-alerta.json. Esta observação não encerra Q08 nem comprova a variante sem tipo de termo.

### CT25 Fechamento do modal pelo X

HU03.04 | P2 | Automatizada

**Pré-condição e dados:** M03; atribuição marcada e modal de termos aberto.

**Passos:** 1. Escolha um tipo. 2. Feche pelo X. 3. Confira que não houve geração e reabra o modal.

**Resultado esperado:** O modal fecha, o fluxo principal permanece utilizável e não há geração involuntária de documento.

### CT26 Conteúdo e integridade dos dois tipos de termo

HU03.05 | P1 | Automatizada para texto e inspeção manual

**Pré-condição e dados:** PDFs de CT21/CT22 e snapshot de nome, área e todos os ativos; modelo esperado para o texto legal.

**Passos:** 1. Extraia o texto. 2. Compare título, declaração, nome, área e lista de ativos. 3. Abra o PDF e confira campo de CPF, local, data, assinatura e todas as páginas.

**Resultado esperado:** Todos os elementos exigidos existem, são legíveis e correspondem à massa. O campo de CPF permite preenchimento manual; não exigir CPF real previamente preenchido.

### CT27 Termos para múltiplas atribuições

HU03.05 e regressão de seleção | P1 | Automatizada e inspeção manual

**Pré-condição e dados:** M03; duas atribuições distintas próprias e uma terceira não selecionada; contratos de apresentação múltipla acordados.

**Passos:** 1. Marque exatamente duas atribuições. 2. Gere cada tipo de termo em variantes. 3. Confira responsáveis, áreas e equipamentos no resultado.

**Resultado esperado:** A saída contém todos os registros selecionados e nenhum não selecionado, sem misturar responsáveis ou ativos. A organização em arquivos/páginas segue a regra confirmada.

**Conferência parcial da automação em 08/10/2026:** Os quatro lotes da HU03 usam três atribuições próprias por modalidade, marcam exatamente duas e conferem os IDs e o tipo enviados, a exclusão da terceira seleção, HTTP 200, application/pdf e assinatura %PDF-. A correspondência dos responsáveis, áreas e ativos dentro do PDF continua pendente de CT26/CT27; a resposta da API não aprova o conteúdo completo nem a organização dos termos.

## 13 Cenários de movimentação de ativos

### CT28 Tela de movimentação e opções de filtro

HU04.01 .02 | P1 | Automatizada e conferência manual

**Pré-condição e dados:** M01/M04; lista de áreas cadastradas conhecida; zoom de 100%.

**Passos:** 1. Abra Relatórios &gt; Movimentação de Ativos. 2. Confira filtros, Pesquisar, Gerar Relatório e visualização. 3. Compare as opções de Área com a lista de referência.

**Resultado esperado:** A tela e os controles são acessíveis. O dropdown oferece todas as áreas cadastradas, e o período utiliza dd/mm/aaaa.

### CT29 Aplicação dos filtros pelo botão Pesquisar

HU04.02 .03; BUG 11 | P1 | Automatizada por combinação

**Pré-condição e dados:** M04; massa com registros dentro e fora do recorte; filtro por área, período e ambos, conforme combinações aceitas.

**Passos:** 1. Preencha o recorte. 2. Clique em Pesquisar. 3. Compare os itens e o filtro em uso com a massa. 4. Observe indicação de atualização.

**Resultado esperado:** Pesquisar aplica os valores selecionados e atualiza a listagem corretamente. O acionamento é compreensível; não assumir aplicação automática nem ausência do botão.

### CT30 Agrupamento e detalhes das movimentações

HU04.04 .05 .06 | P1 | Automatizada

**Pré-condição e dados:** M04; dois grupos com datas, contagens e dados de ativos previamente conhecidos.

**Passos:** 1. Pesquise a massa. 2. Compare cabeçalho de área, datas e contagens. 3. Confira tombo, série, descrição, lotação anterior/atual e colaborador de cada item.

**Resultado esperado:** Agrupamentos e quantidades coincidem com os registros esperados; todos os campos exigidos estão presentes e corretos.

### CT31 Consulta vazia e ausência de resultado residual

HU04.03 .08 | P2 | Automatizada

**Pré-condição e dados:** M04 e M05; primeiro recorte com registros e segundo recorte válido sem dados.

**Passos:** 1. Pesquise o conjunto com dados. 2. Altere para o recorte vazio e clique em Pesquisar. 3. Confira mensagem e listagem.

**Resultado esperado:** A tela informa que não há dados disponíveis. Registros da consulta anterior não permanecem como se pertencessem ao novo filtro.

### CT32 Datas e interação com o calendário

HU04.02; BUG 3; limites a confirmar | P2 | Automatizada para filtros e manual para UX

**Pré-condição e dados:** M04 com limites conhecidos; regra de inclusão inicial/final e padrão de abertura do calendário confirmados.

**Passos:** 1. Consulte início/fim do período e dias adjacentes. 2. Tente data impossível e período invertido quando aplicável. 3. Clique no campo e no ícone do calendário.

**Resultado esperado:** Formato e limites seguem a regra confirmada; datas inválidas não produzem consulta enganosa. A abertura do seletor atende ao padrão de UX acordado, sem assumir que o ícone isolado viole HU04.

### CT33 Geração de movimentação sem filtros

Complementar HU04; regra negativa a confirmar | P2 | Automatizada

**Pré-condição e dados:** Tela de movimentação; Área e Período vazios; regra de consulta sem recorte ratificada.

**Passos:** 1. Remova os filtros. 2. Acione Gerar Relatório. 3. Confira a mensagem e eventual documento.

**Resultado esperado:** O fluxo respeita o contrato confirmado: orienta o preenchimento se obrigatório ou explicita a exportação completa se permitida. Não impor bloqueio apenas porque o teste atual espera um alerta.

### CT34 PDF de movimentação e abertura em nova aba

HU04.07 | P1 | Automatizada para arquivo e manual para nova aba

**Pré-condição e dados:** M04; consulta válida já exibida e seleção de filtros capturada.

**Passos:** 1. Clique em Gerar Relatório. 2. Observe a abertura real em nova aba. 3. Salve, extraia e abra o PDF. 4. Compare agrupamento por área/data com a tela.

**Resultado esperado:** PDF válido e legível abre em nova aba, com a mesma estrutura e dados da consulta. Teste com target alterado ou window.open stubado requer conferência manual complementar.

### CT35 Coerência do recorte entre tela e PDF

HU04.02 .03 .07 | P1 | Automatizada e inspeção manual

**Pré-condição e dados:** M04; duas consultas de recorte distinto e dados de outra área fora do filtro.

**Passos:** 1. Pesquise e exporte o recorte A. 2. Troque para B, pesquise e exporte novamente. 3. Compare IDs, datas e totais dos dois PDFs com cada consulta.

**Resultado esperado:** Cada arquivo contém somente o conjunto da sua consulta, sem dados residuais de A no PDF B nem registros de outras áreas/períodos.

## 14 Cenários provisórios da História 05

Q05 pendente de confirmação. Registrar observações e retestes; a aceitação formal depende do saneamento da história.

### CT36 Atribuições por Área e tipo obrigatório

HU05 provisória; manual seção 5 | P2 | Automatizada e observação manual

**Pré-condição e dados:** Q05 pendente; tela de Atribuições por Área; massa conhecida.

**Passos:** 1. Abra a tela. 2. Confira Tipo, Área, Subárea e Pesquisar. 3. Tente pesquisar sem Tipo. 4. Selecione Sintético e depois Analítico.

**Resultado esperado:** Registrar a validação do tipo obrigatório e os filtros observados no manual. A aprovação de critério formal depende da confirmação de Q05; não exigir período por cópia da HU04.

### CT37 Consulta sintética com filtros opcionais

HU05 provisória; manual seção 5 | P1 | Automatizada por recorte

**Pré-condição e dados:** M03; atribuições em duas áreas/subáreas e quantidades esperadas.

**Passos:** 1. Selecione Sintético. 2. Pesquise sem área/subárea e depois com cada filtro aceito. 3. Compare gráficos e quantidades com a massa.

**Resultado esperado:** Registrar se o resultado sintetiza o conjunto selecionado e respeita a opcionalidade indicada no manual. Ratificar os totais e o agrupamento antes da aceitação.

### CT38 Geração do PDF sintético

HU05 provisória; BUG 10 | P1 | Automatizada e inspeção manual

**Pré-condição e dados:** CT37 com resultado conhecido; registro de rede correlacionado ao clique de geração.

**Passos:** 1. Clique em Gerar Relatório. 2. Confira resposta, tipo de conteúdo e arquivo. 3. Abra o PDF e compare com a consulta.

**Resultado esperado:** PDF abre, contém dados coerentes e não é vazio ou inválido. HTTP 200 não encerra a validação. Reteste da falha BUG 10 pode ser registrado enquanto Q05 permanece pendente.

Q05 pendente de confirmação. Registrar observações e retestes; a aceitação formal depende do saneamento da história.

### CT39 Consulta e PDF analítico com o recorte

HU05 provisória; BUG 6 | P1 | Automatizada e inspeção manual

**Pré-condição e dados:** M03; dados em mais de uma área/subárea; escopo da exportação confirmado.

**Passos:** 1. Selecione Analítico e filtre a massa. 2. Compare tabela e distribuição. 3. Gere PDF e confira os registros incluídos e a indicação de processamento.

**Resultado esperado:** Consulta e exportação seguem o escopo ratificado. O PDF é legível e a geração apresenta estado compreensível; cobertura formal da HU05 continua pendente até Q05.

### CT40 Atribuições por Área sem resultados

HU05 provisória; manual seção 5 | P2 | Automatizada por tipo

**Pré-condição e dados:** M05; recorte válido sem atribuições, após uma consulta com dados.

**Passos:** 1. Execute o recorte vazio em Sintético e Analítico. 2. Confira mensagem, gráficos e tabelas. 3. Observe o tratamento de exportação vazia.

**Resultado esperado:** Registrar ausência de dados sem informação residual ou erro técnico. A mensagem e a possibilidade de PDF vazio seguem os critérios que forem confirmados em Q05.

### CT41 Legibilidade e consistência do gráfico analítico

HU05 provisória; BUG 12 | P2 | Manual e assertions de dados

**Pré-condição e dados:** Consulta analítica com valores conhecidos; 1366x768 e 1920x1080 em zoom de 100%.

**Passos:** 1. Compare rótulos e valores com a tabela. 2. Consulte os detalhes disponíveis no gráfico. 3. Repita nas resoluções e capture a evidência.

**Resultado esperado:** Rótulos, valores e detalhes são legíveis e coerentes com a tabela. Registrar a observação e retestar o padrão de apresentação acordado para a melhoria.

## 15 Cenários de suporte e regressão

### CT42 Login válido inválido e encerramento da sessão

Suporte às histórias; manual seção 1; BUG 4 | P1 | Automatizada e inspeção de rede

**Pré-condição e dados:** M08; sessão limpa; contrato do formulário de login identificado.

**Passos:** 1. Entre com credenciais válidas e confira acesso. 2. Saia e tente reabrir uma tela interna. 3. Em sessão limpa, informe credenciais inválidas e observe tela/retorno.

**Resultado esperado:** Login válido permite acesso; login inválido mantém acesso negado. Após sair, a tela protegida exige autenticação. Avaliar HTTP, alerta e redirecionamento segundo o contrato; não inferir vulnerabilidade apenas por HTTP 200.

### CT43 Recusa de tombo duplicado

Suporte de integridade; BUG 1 | P1 | Automatizada e inspeção manual

**Pré-condição e dados:** M02; primeiro ativo criado no ciclo com tombo único; demais campos válidos.

**Passos:** 1. Cadastre outro ativo com o mesmo tombo. 2. Confira validação e retorno. 3. Pesquise pelo tombo e reabra o registro original.

**Resultado esperado:** A duplicidade é recusada com mensagem clara, há somente um cadastro e os dados originais permanecem. O teste .skip não comprova a correção.

### CT44 Cadastro de ativos e validação dos obrigatórios

Suporte às histórias; manual seção 4 | P1 | Automatizada por variante

**Pré-condição e dados:** M02; Tipo, Marca, Modelo, Tombo e Código da Aquisição válidos; tipos de referência confirmados.

**Passos:** 1. Cadastre tipos distintos da massa, reabrindo para conferir dados. 2. Em variantes, omita cada obrigatório e tente salvar. 3. Preencha outro formulário e cancele.

**Resultado esperado:** Cada tipo válido persiste corretamente; ausência de obrigatório bloqueia o cadastro. Cancelar não cria registro. Tombos únicos e origem dos ativos ficam no manifesto.

### CT45 Edição e histórico de ativo

Suporte de integridade; manual seção 4 | P2 | Automatizada

**Pré-condição e dados:** Ativo próprio de M02 e snapshot dos dados/status/localização/histórico.

**Passos:** 1. Consulte histórico. 2. Edite campos permitidos, salve e reabra. 3. Em variantes, cancele uma alteração e tente salvar sem obrigatório.

**Resultado esperado:** Edição válida persiste e preserva dados não alterados. Cancelamento e edição inválida mantêm o snapshot. Histórico corresponde ao ativo selecionado.

### CT46 Layout das telas afetadas em zoom normal

Complementar; BUG 2 | P1 | Manual e automação sem force

**Pré-condição e dados:** Home, Atribuições, Devolvidos à Celop, Movimentação e Atribuições por Área; variantes 1366x768 e 1920x1080, zoom 100%.

**Passos:** 1. Abra cada tela. 2. Localize filtros, botões, ações e conteúdo das listagens/gráficos. 3. Use os controles sem reduzir o zoom ou forçar clique.

**Resultado esperado:** Informação legível e controles alcançáveis, com reorganização ou rolagem adequada. Capturar cada tela/resolução; visibilidade isolada de um elemento não comprova ausência de corte.

### CT47 Primeiro e segundo anexo de termo

Complementar; BUG 5 | P1 | Manual e futura automação

**Pré-condição e dados:** Atribuição própria; dois PDFs válidos; regra de rejeição/substituição confirmada; arquivo inadequado para variante negativa.

**Passos:** 1. Anexe o primeiro termo e abra-o. 2. Tente anexar o segundo ao mesmo registro. 3. Confira o documento resultante. 4. Repita Responsabilidade e arquivo inadequado conforme regra.

**Resultado esperado:** Primeiro anexo funciona. O segundo segue a política ratificada sem HTTP 500. Em rejeição, o anterior permanece; em substituição, o novo pertence ao registro certo. Arquivo inadequado não corrompe o anexo.

### CT48 Seleção e devolução no Depósito CTI

Complementar; BUG 7 | P1 | Manual e futura automação

**Pré-condição e dados:** M07; gestor autorizado; critérios de elegibilidade definidos.

**Passos:** 1. Marque um e vários itens elegíveis. 2. Execute Devolver para a Celop e confira as listagens. 3. Tente selecionar item inelegível ou sem permissão, se houver perfil disponível.

**Resultado esperado:** Somente o conjunto elegível selecionado é devolvido. Bloqueios previstos têm motivo compreensível. Não habilitar indiscriminadamente o input como solução da task.

### CT49 Alternância de exibição da senha

Melhoria; BUG 8 | P3 | Manual e futura automação

**Pré-condição e dados:** Tela de login; implementação da melhoria disponível; senha sintética.

**Passos:** 1. Digite a senha. 2. Alterne exibir/ocultar. 3. Acione o controle pelo teclado. 4. Envie um login válido em outra variante.

**Resultado esperado:** O valor digitado é preservado, a senha inicia mascarada e o controle não envia o formulário. Login continua funcionando. Se a melhoria não foi implementada, registrar pendência em vez de aprovação.

### CT50 Exportação em Ativos e Devolvidos à Celop

Complementar; BUG 6 | P1 | Manual e futura automação de PDF

**Pré-condição e dados:** Massas próprias nos dois módulos; recorte diferente da base completa; escopo de filtros/seleção e feedback confirmado.

**Passos:** 1. Pesquise o conjunto esperado em cada módulo. 2. Gere o relatório. 3. Observe processamento, conclusão/falha e conteúdo do PDF. 4. Compare com o escopo ratificado.

**Resultado esperado:** A exportação respeita o recorte previsto ou identifica claramente o conjunto completo quando permitido. O usuário percebe o andamento e o resultado; o PDF é íntegro e correspondente à regra.

### CT51 Identificação e acionamento das ações da atribuição

Melhoria; BUG 9 | P2 | Manual

**Pré-condição e dados:** Listagem com atribuição própria; zoom 100%; correção de espaçamento disponível.

**Passos:** 1. Identifique Nova Atribuição e Gerar Termos. 2. Acione separadamente os quatro ícones da linha própria. 3. Confira título/ID dos modais e navegação por teclado.

**Resultado esperado:** Os alvos são distintos e a ação escolhida abre o registro correto. Espaçamento e identificação permitem uso sem acionamento acidental; não avaliar apenas a aparência da captura.

### CT52 Notificações e vínculo com a atribuição

Complementar; manual seção 6 | P3 | Manual

**Pré-condição e dados:** Notificação disponível com atribuição conhecida e permissão de consulta.

**Passos:** 1. Abra a lista no menu superior. 2. Acesse Exibir todas as notificações. 3. Use Ir para Atribuição e compare o registro.

**Resultado esperado:** A central apresenta a notificação e a ação leva à atribuição correspondente. Não assumir expansão do item do menu superior como requisito ausente no desafio.

### CT53 Gerenciamento de conta e alteração de senha

Complementar; manual seção 6 | P3 | Manual com conta isolada

**Pré-condição e dados:** M08 com conta isolada e recuperação combinada; não usar a credencial compartilhada do desafio.

**Passos:** 1. Abra Gerenciar. 2. Tente confirmação divergente e valor abaixo do mínimo informado na tela. 3. Cancele e confira acesso. 4. Salve senha válida, valide login e restaure conforme combinado.

**Resultado esperado:** Valores inválidos não alteram a senha; Cancelar mantém a anterior. Alteração válida funciona conforme a regra da tela. Se não houver conta isolada, registrar bloqueio e não modificar a conta comum.

## 16 Decisões pendentes

Todas as decisões abaixo estão pendentes de validação pelo responsável pelo requisito. Não há aprovação ou data de decisão registrada. Após a resposta, informar a definição, o nome de quem validou, a data e a versão afetada; ajustar somente os resultados esperados e variantes envolvidos.

### Q01 Política do segundo anexo

Pendente | Afeta: CT47 e BUG 5.

Definição necessária: Definir se outro termo do mesmo tipo deve ser rejeitado, substituir o anterior ou gerar uma nova versão; especificar confirmação e documento que permanece acessível.

Até a definição: Preservar a integridade do anexo e não retornar HTTP 500. A política de troca fica sem julgamento de aceitação até a resposta.

### Q02 Escopo e feedback das exportações

Pendente | Afeta: CT39 CT50 e BUG 6.

Definição necessária: Definir por módulo se o PDF usa o filtro aplicado, a seleção ou toda a base; esclarecer geração em andamento, conclusão e falha. Na HU04, tela e PDF já devem corresponder à mesma consulta.

Até a definição: Não impor recorte ao exportador fora da HU04 sem contrato. Registrar conjunto observado e feedback; ratificar a regra antes de aprovar o escopo.

### Q03 Elegibilidade e permissão no Depósito CTI

Pendente | Afeta: CT48 e BUG 7.

Definição necessária: Definir status elegíveis, perfil autorizado e restrições da devolução individual ou em lote, incluindo a justificativa de itens desabilitados.

Até a definição: Usar itens próprios e distinguir bloqueio previsto de seleção indevidamente impedida. Não considerar todas as caixas obrigatoriamente habilitadas.

### Q04 Abertura do calendário

Pendente | Afeta: CT32.07 a CT32.10 e BUG 3.

Definição necessária: Confirmar o padrão de UX para abrir pelo campo e pelo ícone, nos dois extremos do período, e os navegadores aplicáveis.

Até a definição: Registrar cada interação. A abertura apenas pelo ícone não viola, por si, o critério de formato da HU04.

### Q05 Correção do requisito da História 05

Pendente | Afeta: CT36 a CT41 HU05 e BUG 6 BUG 10 BUG 12.

Definição necessária: Confirmar que o fluxo é Atribuições por Área e definir filtros, agrupamentos, dados, mensagem vazia e conteúdo do PDF. Corrigir os oito critérios repetidos da HU04 na página 6 do desafio.

Até a definição: Manter CT36 a CT41 exploratórios. Retestar falhas técnicas documentadas; a aprovação desses retestes não comprova aceitação formal da HU05.

### Q06 Valor de Office ao desmarcar

Pendente | Afeta: CT06.03 e CT20.02.

Definição necessária: Definir se o pacote previamente escolhido é limpo ou mantido sem efeito ao desmarcar Utilizará Pacote Office, inclusive após salvar e reabrir.

Até a definição: A habilitação pela checkbox é exigida na HU01. A retenção do valor anterior depende da decisão; registrar estado e persistência separadamente.

### Q07 Troca de Área e Subárea

Pendente | Afeta: CT08.

Definição necessária: Confirmar como uma Subárea incompatível é tratada após mudar a Área: limpeza, nova seleção obrigatória ou outro ajuste explícito.

Até a definição: Validar a localização final e registrar o mecanismo. A integridade da relação permanece exigida; não impor um mecanismo de interface sem regra.

### Q08 Geração de termos sem seleção e em lote

Pendente | Afeta: CT24 e CT27.

Definição necessária: Definir retorno quando não há atribuição ou tipo selecionado e a organização dos documentos para duas atribuições: arquivos, páginas e separação de responsáveis.

Até a definição: Não admitir dados de registros não selecionados. Mensagem e organização exatas dependem de confirmação, sem alterar o conteúdo obrigatório da HU03.

### Q09 Limites de período e consulta sem filtros

Pendente | Afeta: CT29.01 CT29.02 CT32.01 a CT32.06 e CT33.

Definição necessária: Confirmar inclusão das datas inicial/final, tratamento de data impossível ou intervalo invertido e quais combinações sem Área ou Período são permitidas.

Até a definição: Conferir o formato exigido pela HU04. Julgar limites e obrigatoriedade apenas após a regra; não usar a expectativa de um teste existente como requisito.

## 17 Registro de execução

O manifesto identifica 140 variantes dos 53 cenários existentes. Os procedimentos e resultados esperados permanecem nos casos CT01 a CT53. Cada ID CTxx.yy recebe seu próprio estado, resultado observado e evidência, mesmo quando o teste foi executado junto de outras variantes.

### Situação inicial do ciclo

Ciclo: ainda não iniciado. runId, executor, início, fim, versão do sistema, commit da suíte, navegador e sistema operacional: a registrar na abertura da rodada. Ambiente alvo: http://testeqa.pge.ce.gov.br.

| **Planejadas** | **Aprovadas** | **Reprovadas** | **Bloqueadas** | **Não executadas** |
| --- | --- | --- | --- | --- |
| 140 | 0 | 0 | 0 | 140 |

Cobertura de execução: 0%. Taxa de aprovação: não aplicável, pois não há variantes executadas. As capturas dos reports documentam observações anteriores e não comprovam o resultado desta rodada. A aceitação e o encerramento do ciclo permanecem pendentes.

### Como preencher cada resultado

Substituir Não executado pelo estado comprovado. No campo Registro, informar o resultado observado e o nome da figura ou caminho da evidência; incluir runId, ID CTxx.yy, task, horário e motivo quando houver falha ou bloqueio. O arquivo de evidência deve permitir identificar filtros, massa, IDs e resultado; dados do executor e ambiente podem ser comuns à rodada.

Conferir a lista de obrigatórios e tipos na versão testada. Campos ou tipos adicionais recebem os próximos sufixos livres; registrar a mudança do manifesto e o novo denominador antes da execução. Não reutilizar IDs de variantes removidas. Restrições de massa, permissão e regras são motivos a avaliar, sem marcar bloqueio antes de constatar o impedimento.

### Leitura do código antes da rodada

Há três testes com .skip: duplicidade de tombo em ativos/cadastro_ativos.cy.js (CT43); PDF de movimentação em relatorios/movimentacao_de_ativos.cy.js (CT34 e CT35); PDF de atribuições em relatorios/atribuicoes_por_area.cy.js (CT38 e CT39 conforme o tipo). Esta é uma constatação do código, sem log de execução. Manter o motivo do skip e registrar a validação manual separadamente quando realizada.

## 17 Registro de execução Cadastro de atribuições

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT06: Q06. CT08: Q07.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT01.01 | Cadastro mínimo sem colaborador | Não executado | — |
| CT02.01 | Cadastro completo com um ativo | Não executado | — |
| CT03.01 | Presencial | Não executado | — |
| CT03.02 | Home Office | Não executado | — |
| CT04.01 | Com colaborador | Não executado | — |
| CT04.02 | Sem colaborador | Não executado | — |
| CT05.01 | Formulário vazio | Não executado | — |
| CT05.02 | Sem Área | Não executado | — |
| CT05.03 | Sem Subárea | Não executado | — |
| CT05.04 | Sem Atendido por | Não executado | — |
| CT05.05 | Sem Modalidade | Não executado | — |
| CT06.01 | Office desmarcado desde o início | Não executado | — |
| CT06.02 | Office marcado com pacote | Não executado | — |
| CT06.03 | Desmarcar após escolher pacote | Não executado | — |
| CT07.01 | Dois ativos na mesma atribuição | Não executado | — |
| CT08.01 | Trocar Área A por B e escolher Subárea B1 | Não executado | — |
| CT09.01 | SO A e observação preenchida | Não executado | — |
| CT09.02 | SO B e observação vazia | Não executado | — |
| CT10.01 | Cancelar cadastro com ativo adicionado | Não executado | — |

## 17 Registro de execução Edição de atribuições

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT20: Q06.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT11.01 | Carregar campos e dois ativos | Não executado | — |
| CT12.01 | Alterar Atendido por Modalidade e Observações | Não executado | — |
| CT13.01 | Novo destino com colaborador | Não executado | — |
| CT13.02 | Novo destino sem colaborador | Não executado | — |
| CT14.01 | Preservar dois ativos ao mudar observação | Não executado | — |
| CT15.01 | Substituir A disponível por B | Não executado | — |
| CT16.01 | Substituir A com defeito e motivo por B | Não executado | — |
| CT17.01 | Adicionar B mantendo A | Não executado | — |
| CT18.01 | Sem Área | Não executado | — |
| CT18.02 | Sem Subárea | Não executado | — |
| CT18.03 | Sem Atendido por | Não executado | — |
| CT18.04 | Sem Modalidade | Não executado | — |
| CT19.01 | Cancelar alteração de campos e troca de ativos | Não executado | — |
| CT20.01 | Alterar SO e Office marcado | Não executado | — |
| CT20.02 | Alterar com Office desmarcado | Não executado | — |

## 17 Registro de execução Termos

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT24: Q08. CT27: Q08.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT21.01 | Responsabilidade Presencial | Não executado | — |
| CT21.02 | Responsabilidade Home Office | Não executado | — |
| CT22.01 | Empréstimo Presencial | Não executado | — |
| CT22.02 | Empréstimo Home Office | Não executado | — |
| CT23.01 | Responsabilidade para Empréstimo | Não executado | — |
| CT23.02 | Empréstimo para Responsabilidade | Não executado | — |
| CT24.01 | Sem atribuição selecionada | Não executado | — |
| CT24.02 | Sem tipo de termo selecionado | Não executado | — |
| CT25.01 | Fechar modal pelo X | Não executado | — |
| CT26.01 | Conteúdo do termo de Responsabilidade | Não executado | — |
| CT26.02 | Conteúdo do termo de Empréstimo | Não executado | — |
| CT27.01 | Duas atribuições em Responsabilidade | Não executado | — |
| CT27.02 | Duas atribuições em Empréstimo | Não executado | — |

## 17 Registro de execução Movimentação

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT29: Q09 nas variantes .01 e .02. CT32: Q09 nas variantes .01 a .06; Q04 nas .07 a .10. CT33: Q09.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT28.01 | Controles áreas e formato de período | Não executado | — |
| CT29.01 | Filtro somente Área | Não executado | — |
| CT29.02 | Filtro somente Período | Não executado | — |
| CT29.03 | Área e Período combinados | Não executado | — |
| CT30.01 | Agrupamentos contagens e detalhes conhecidos | Não executado | — |
| CT31.01 | Consulta com dados seguida de consulta vazia | Não executado | — |
| CT32.01 | Registro na data inicial | Não executado | — |
| CT32.02 | Registro na data final | Não executado | — |
| CT32.03 | Dia anterior ao início | Não executado | — |
| CT32.04 | Dia posterior ao fim | Não executado | — |
| CT32.05 | Data impossível | Não executado | — |
| CT32.06 | Intervalo invertido | Não executado | — |
| CT32.07 | Clique no campo inicial | Não executado | — |
| CT32.08 | Clique no ícone inicial | Não executado | — |
| CT32.09 | Clique no campo final | Não executado | — |
| CT32.10 | Clique no ícone final | Não executado | — |
| CT33.01 | Gerar sem Área e Período | Não executado | — |
| CT34.01 | Arquivo conteúdo e abertura real em nova aba | Não executado | — |
| CT35.01 | Exportação do recorte A | Não executado | — |
| CT35.02 | Exportação do recorte B após A | Não executado | — |

## 17 Registro de execução História 05 provisória

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT36: Q05. CT37: Q05. CT38: Q05 para aceitação da HU05. CT39: Q02 e Q05. CT40: Q05. CT41: Q05. Q05 pendente. Resultados exploratórios e retestes não encerram a aceitação da história.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT36.01 | Consulta sem Tipo | Não executado | — |
| CT36.02 | Controles e consulta Sintético | Não executado | — |
| CT36.03 | Controles e consulta Analítico | Não executado | — |
| CT37.01 | Sintético sem Área e Subárea | Não executado | — |
| CT37.02 | Sintético somente Área | Não executado | — |
| CT37.03 | Sintético com Área e Subárea | Não executado | — |
| CT38.01 | PDF sintético da consulta conhecida | Não executado | — |
| CT39.01 | Analítico e PDF somente Área | Não executado | — |
| CT39.02 | Analítico e PDF com Área e Subárea | Não executado | — |
| CT40.01 | Sintético sem dados após consulta com dados | Não executado | — |
| CT40.02 | Analítico sem dados após consulta com dados | Não executado | — |
| CT41.01 | Analítico em 1366x768 | Não executado | — |
| CT41.02 | Analítico em 1920x1080 | Não executado | — |

## 17 Registro de execução Suporte e regressão

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT47: Q01 nas variantes de segundo anexo; formato inadequado conforme contrato de upload. CT48: Q03 e disponibilidade de massa/perfil. CT50: Q02. CT53: Conta isolada e recuperação combinada.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT42.01 | Login válido | Não executado | — |
| CT42.02 | Login inválido em sessão limpa | Não executado | — |
| CT42.03 | Logout e acesso posterior à tela protegida | Não executado | — |
| CT43.01 | Novo cadastro com tombo já usado | Não executado | — |
| CT44.01 | Cadastro válido Desktop | Não executado | — |
| CT44.02 | Sem Tipo | Não executado | — |
| CT44.03 | Cancelar cadastro preenchido | Não executado | — |
| CT44.04 | Cadastro válido Notebook | Não executado | — |
| CT44.05 | Cadastro válido Monitor | Não executado | — |
| CT44.06 | Cadastro válido Impressora | Não executado | — |
| CT44.07 | Cadastro válido Webcam | Não executado | — |
| CT44.08 | Sem Marca | Não executado | — |
| CT44.09 | Sem Modelo | Não executado | — |
| CT44.10 | Sem Tombo | Não executado | — |
| CT44.11 | Sem Código da Aquisição | Não executado | — |
| CT44.12 | Formulário vazio | Não executado | — |
| CT45.01 | Histórico e edição válida | Não executado | — |
| CT45.02 | Cancelar edição | Não executado | — |
| CT45.03 | Editar sem Tipo | Não executado | — |
| CT45.04 | Editar sem Marca | Não executado | — |
| CT45.05 | Editar sem Modelo | Não executado | — |
| CT45.06 | Editar sem Tombo | Não executado | — |
| CT45.07 | Editar sem Código da Aquisição | Não executado | — |
| CT46.01 | Home em 1366x768 | Não executado | — |
| CT46.02 | Home em 1920x1080 | Não executado | — |

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT47: Q01 nas variantes de segundo anexo; formato inadequado conforme contrato de upload. CT48: Q03 e disponibilidade de massa/perfil. CT50: Q02. CT53: Conta isolada e recuperação combinada.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT46.03 | Atribuições em 1366x768 | Não executado | — |
| CT46.04 | Atribuições em 1920x1080 | Não executado | — |
| CT46.05 | Devolvidos à Celop em 1366x768 | Não executado | — |
| CT46.06 | Devolvidos à Celop em 1920x1080 | Não executado | — |
| CT46.07 | Movimentação em 1366x768 | Não executado | — |
| CT46.08 | Movimentação em 1920x1080 | Não executado | — |
| CT46.09 | Atribuições por Área em 1366x768 | Não executado | — |
| CT46.10 | Atribuições por Área em 1920x1080 | Não executado | — |
| CT47.01 | Primeiro anexo Empréstimo | Não executado | — |
| CT47.02 | Segundo anexo Empréstimo | Não executado | — |
| CT47.03 | Primeiro anexo Responsabilidade | Não executado | — |
| CT47.04 | Segundo anexo Responsabilidade | Não executado | — |
| CT47.05 | Arquivo inadequado em Empréstimo | Não executado | — |
| CT47.06 | Arquivo inadequado em Responsabilidade | Não executado | — |
| CT48.01 | Um item elegível | Não executado | — |
| CT48.02 | Vários itens elegíveis | Não executado | — |
| CT48.03 | Item inelegível | Não executado | — |
| CT48.04 | Perfil sem permissão | Não executado | — |
| CT49.01 | Exibir e ocultar senha | Não executado | — |
| CT49.02 | Controle pelo teclado | Não executado | — |
| CT49.03 | Login válido após alternância | Não executado | — |
| CT50.01 | Exportação de Ativos | Não executado | — |
| CT50.02 | Exportação de Devolvidos à Celop | Não executado | — |
| CT51.01 | Nova Atribuição | Não executado | — |
| CT51.02 | Gerar Termos | Não executado | — |

Pré-condição, passos e resultado esperado: consultar o caso CT correspondente. Dependências: CT47: Q01 nas variantes de segundo anexo; formato inadequado conforme contrato de upload. CT48: Q03 e disponibilidade de massa/perfil. CT50: Q02. CT53: Conta isolada e recuperação combinada.

| **Execução** | **Variante** | **Estado** | **Registro observado e evidência** |
| --- | --- | --- | --- |
| CT51.03 | Ícone Anexar | Não executado | — |
| CT51.04 | Ícone Ativos vinculados | Não executado | — |
| CT51.05 | Ícone Histórico | Não executado | — |
| CT51.06 | Ícone Editar | Não executado | — |
| CT51.07 | Navegação por teclado | Não executado | — |
| CT52.01 | Central e vínculo com a atribuição | Não executado | — |
| CT53.01 | Confirmação divergente | Não executado | — |
| CT53.02 | Senha abaixo do mínimo da tela | Não executado | — |
| CT53.03 | Cancelar mudança de senha | Não executado | — |
| CT53.04 | Salvar senha válida validar e restaurar | Não executado | — |

## 17 Referências históricas para o reteste

Localizar as capturas no documento [BUG_REPORTS.md](BUG_REPORTS.md), junto da task indicada. Preservar o report original e anexar o resultado da nova rodada com o ID de execução correspondente. Data, versão, executor e resolução que não constam no report precisam ser registrados no reteste.

| **Task** | **Cenário** | **Evidência no report** | **Situação atual** |
| --- | --- | --- | --- |
| BUG 1 | CT43 | Figuras 01, 02 | Reteste pendente |
| BUG 2 | CT46 | Figuras 03, 04, 05, 06, 07, 08, 09, 10 | Reteste pendente |
| BUG 3 | CT32 | Figuras 11 | Reteste pendente |
| BUG 4 | CT42 | Figuras 12 | Reteste pendente |
| BUG 5 | CT47 | Figuras 13, 14 | Reteste pendente |
| BUG 6 | CT39 e CT50 | Figuras 15, 16, 17, 18 | Reteste pendente |
| BUG 7 | CT48 | Figuras 19 | Reteste pendente |
| BUG 8 | CT49 | Figuras 20 | Reteste pendente |
| BUG 9 | CT51 | Figuras 21 | Reteste pendente |
| BUG 10 | CT38 | Figuras 22, 23, 24, 25 | Reteste pendente |
| BUG 11 | CT29 | Figuras 26 | Reteste pendente |
| BUG 12 | CT41 | Figuras 27, 31 e 32 | Registro aprovado; documentação concluída em 08/10/2026; reteste da correção pendente |
| BUG 13 | CT24.01 | Figura 28 e bug-13-alerta.json; print do contexto e texto do evento window:alert | Melhoria de grafia observada em 07/10/2026; reteste da correção pendente |
| BUG 14 | CT21 e CT22; CT27 na regressão | Figuras 29, 30 e bug-14-geracao.json, incluindo o reteste de 08/10/2026 com massa própria | Falha HTTP 502 reproduzida em 07/10/2026 e confirmada nas duas modalidades em 08/10/2026; reteste da correção pendente |
| BUG 15 | CT46 | Evidências da automação da HU04 | Divergência de datas reproduzida em 08/10/2026; reteste da correção pendente |
| BUG 16 | CT46 | bug-16-abertura.json e registros manuais da HU04 | Comportamento de aba única confirmado em 08/10/2026; reteste da correção pendente |

Conclusão inicial: o plano e o manifesto estão preparados; não há resultados deste ciclo para recomendar aceitação. BUG 1 a BUG 12 continuam como baseline de falhas ou melhorias, sem inferir que foram corrigidos ou reproduzidos na versão atual. BUG 13 e BUG 14 foram observados na validação da HU03 em 07/10/2026; BUG 15 e BUG 16 foram observados na validação da HU04 em 08/10/2026. Todos têm reteste da correção pendente. Essa observação não altera os estados do ciclo nem os contadores do manifesto.
