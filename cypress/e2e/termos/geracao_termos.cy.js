describe('HU03 - Geração de Termos (Responsabilidade e Empréstimo)', () => {

  const modalidades = ['Home Office', 'Presencial'];
  let massaTermos;
  const caminhoDaMassa = (atribuicoes, modalidade) => {
    const parametros = new URLSearchParams();
    atribuicoes.forEach(({ id }) => parametros.append('q[id_in][]', id));
    if (modalidade) parametros.set('q[modality_eq]', modalidade);
    return '/portal_service/bonds?' + parametros.toString();
  };


  const validarPdfGerado = (resposta, { parametro, nome }, atribuicoes) => {
    const nomeArquivo = 'HU03-' + parametro + '-' + atribuicoes.map(({ id }) => id).join('-') + '.pdf';
    cy.writeFile(Cypress.config('downloadsFolder') + '/' + nomeArquivo, resposta.body,
      { encoding: 'binary', log: false });
    return cy.validarConteudoPdf(nomeArquivo, ['TERMO DE ' + nome.toUpperCase()]).then((texto) => {
      const normalizar = valor => valor.replace(/<[^>]+>/g, '').normalize('NFKC').replace(/\s+/g, ' ').trim();
      const conteudo = normalizar(texto);
      const declaracoes = parametro === 'liability' ? [
        'Pelo presente termo, declaro receber os bens relacionados no presente termo',
        'assumo total responsabilidade pela guarda',
        'sobre todas as ocorrências relativas aos bens'
      ] : [
        'Pelo presente termo, declaro receber na condição de empréstimo',
        'Procuradoria-Geral do Estado do Ceará - PGE',
        'equipamentos foram recebidos em funcionamento e em bom estado de conservação',
        'ficarei responsável por sua guarda e conservação'
      ];
      declaracoes.forEach(declaracao => {
        expect(conteudo, 'declaração do termo de ' + nome).to.include(declaracao);
      });
      expect(conteudo, 'ausência do outro tipo de termo').not.to.include(
        parametro === 'liability' ? 'TERMO DE EMPRÉSTIMO' : 'TERMO DE RESPONSABILIDADE'
      );

      // A data do servidor evita depender do relógio e do fuso horário do computador de execução.
      const dataServidor = new Date(resposta.headers.date);
      expect(dataServidor.getTime(), 'data HTTP da geração').to.be.finite;
      const dataEsperada = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Fortaleza', day: '2-digit', month: 'long', year: 'numeric'
      }).format(dataServidor).toLocaleLowerCase('pt-BR');
      const blocos = conteudo.split(/\bNome:\s*/).slice(1);
      atribuicoes.forEach((atribuicao) => {
        const bloco = blocos.find(item => item.startsWith(normalizar(atribuicao.responsavel) + ' CPF:'));
        expect(bloco, 'dados do responsável da atribuição ' + atribuicao.id).to.be.a('string');
        expect(bloco, 'campo CPF para preenchimento manual').to.match(/\bCPF:\s*_{5,}(?:\s|$)/);
        expect(bloco, 'área do responsável').to.include('Área: ' + atribuicao.area);
        expect(bloco, 'tombo do responsável').to.include(atribuicao.tombo);
        expect(bloco, 'série do responsável').to.include(atribuicao.numeroSerie);
        expect(bloco, 'descrição do equipamento').to.include(atribuicao.descricao);
        const localEData = bloco.match(/(?:^|\s)([\p{L}][\p{L} .'-]{1,60}), (\d{2} de [\p{L}]+ de \d{4})\b/u);
        expect(localEData, 'local e data preenchidos no termo').not.to.be.null;
        expect(localEData[2].toLocaleLowerCase('pt-BR'), 'data de emissão do responsável').to.eq(dataEsperada);
        expect(bloco, 'linha para assinatura do responsável').to.match(/_{5,}\s+Assinatura\b/);
        atribuicoes.filter(outra => outra.id !== atribuicao.id).forEach((outra) => {
          expect(bloco, 'ausência de equipamento do outro responsável').not.to.include(outra.tombo);
        });
      });
      const idsSelecionados = atribuicoes.map(({ id }) => id);
      Object.values(massaTermos).flat().filter(atribuicao => !idsSelecionados.includes(atribuicao.id))
        .forEach((atribuicao) => {
          expect(conteudo, 'ausência de ativo não selecionado').not.to.include(atribuicao.tombo);
          expect(conteudo, 'ausência de série não selecionada').not.to.include(atribuicao.numeroSerie);
        });
    });
  };

  before(() => {
    cy.login();
    cy.prepararAtribuicoesParaTermos(modalidades).then((massa) => {
      massaTermos = massa;
    });
  });

  beforeEach(() => {
    cy.login();
    cy.visit(caminhoDaMassa(Object.values(massaTermos).flat()));
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.get('input.marcar[type="checkbox"]').should('have.length', 6);
  });

  it('Cenário 1: Deve validar regras de exclusividade do modal e barrar geração sem seleção', () => {
    const id = massaTermos.Presencial[0].id;
    cy.selecionarAtribuicaoNaTabela(id);
    cy.abrirModalGerarTermos();

    cy.selecionarTipoTermo('responsabilidade');
    cy.get('#term_type_liability').should('be.checked');
    cy.get('#term_type_loan').should('not.be.checked');

    cy.selecionarTipoTermo('emprestimo');
    cy.get('#term_type_loan').should('be.checked');
    cy.get('#term_type_liability').should('not.be.checked');

    cy.selecionarTipoTermo('responsabilidade');
    cy.get('#term_type_liability').should('be.checked');
    cy.get('#term_type_loan').should('not.be.checked');
    cy.get('#btn-termo').should('be.visible').and('be.enabled');

    cy.fecharModalGerarTermos();

    cy.get('input.marcar[type="checkbox"][value="' + id + '"]').uncheck({ force: true });
    cy.get('input.marcar[type="checkbox"][value="' + id + '"]').trigger('change', { force: true });
    cy.get('input.marcar[type="checkbox"]:checked').should('not.exist');

    cy.abrirModalGerarTermos();
    // Stub direto em window.alert da página atual: não depende do evento window:alert do Cypress.
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaSemSelecao');
    });
    cy.get('#btn-termo').should('be.visible').click();
    cy.get('@alertaSemSelecao').should(
      'have.been.calledWithMatch',
      /Selecione um tipo de Termo e uma ou mais Atribuiç[ôõ]es/
    );
  });

  modalidades.forEach((modalidade) => {
    context(`Testes de Geração para a Modalidade: ${modalidade}`, () => {
      
      beforeEach(() => {
        cy.intercept('GET', '**/portal_service/bonds*').as('filtrarModalidade');
        cy.get('#q_modality_eq').select(modalidade, { force: true });
        cy.wait('@filtrarModalidade', { timeout: 15000 }).then((requisicao) => {
          expect(requisicao.response.statusCode, 'consulta por modalidade').to.be.oneOf([200, 304]);
          expect(new URL(requisicao.request.url).searchParams.get('q[modality_eq]'), 'modalidade enviada')
            .to.eq(modalidade);
        });
        // A troca do filtro na tela remove os IDs; limita novamente aos registros do preparo.
        cy.visit(caminhoDaMassa(massaTermos[modalidade], modalidade));
        cy.get('table', { timeout: 15000 }).should('be.visible');
        cy.get('input.marcar[type="checkbox"]').should('have.length', 3).then(($campos) => {
          expect(Array.from($campos, (campo) => campo.value), 'atribuições próprias da modalidade')
            .to.have.members(massaTermos[modalidade].map(({ id }) => id));
        });
      });

      [
        { cenario: 2, tipo: 'responsabilidade', parametro: 'liability', nome: 'Responsabilidade' },
        { cenario: 3, tipo: 'emprestimo', parametro: 'loan', nome: 'Empréstimo' }
      ].forEach(({ cenario, tipo, parametro, nome }) => {
        it.skip(`Cenário ${cenario}: Deve validar o Termo de ${nome} individual — reteste BUG14 (${modalidade})`, () => {
          const atribuicao = massaTermos[modalidade][0];
          cy.selecionarAtribuicaoNaTabela(atribuicao.id);
          cy.get('input.marcar[type="checkbox"]:checked').should('have.length', 1);
          cy.abrirModalGerarTermos();
          cy.selecionarTipoTermo(tipo);
          cy.window().then((win) => {
            win.alert = () => true;
            win.confirm = () => true;
          });

          return cy.confirmarGeracaoTermo(true, { validarPdf: true }).then((resposta) => {
            return cy.get('@abrirPdfTermo').then((abrirPdf) => {
              const parametros = new URL(abrirPdf.firstCall.args[0], Cypress.config('baseUrl')).searchParams;
              expect(parametros.get('term_type'), 'tipo do termo individual').to.eq(parametro);
              expect((parametros.get('bonds_ids') || '').split(','), 'única atribuição enviada')
                .to.deep.eq([atribuicao.id]);
            }).then(() => {
              return validarPdfGerado(resposta, { parametro, nome }, [atribuicao]);
            });
          });
        });
      });

      [
        { tipo: 'responsabilidade', parametro: 'liability', nome: 'Responsabilidade' },
        { tipo: 'emprestimo', parametro: 'loan', nome: 'Empréstimo' }
      ].forEach(({ tipo, parametro, nome }) => {
        it(`Cenário 4: Deve gerar termo de ${nome} para múltiplas atribuições simultaneamente (${modalidade})`, () => {
          const atribuicoesDoLote = massaTermos[modalidade].slice(0, 2);
          const idsDoLote = atribuicoesDoLote.map(({ id }) => id);
          const idNaoSelecionado = massaTermos[modalidade][2].id;
          cy.selecionarMultiplasAtribuicoes(2, idsDoLote);
          cy.get('input.marcar[type="checkbox"][value="' + idNaoSelecionado + '"]')
            .should('not.be.checked');
          let idsSelecionados;
          cy.get('input.marcar[type="checkbox"]:checked')
            .should('have.length', 2)
            .then(($atribuicoes) => {
              idsSelecionados = Array.from($atribuicoes, (campo) => campo.value);
              expect(idsSelecionados, 'atribuições marcadas para o lote').to.have.members(idsDoLote);
            });
          cy.abrirModalGerarTermos();
          cy.selecionarTipoTermo(tipo);

          cy.window().then((win) => {
            win.alert = () => true;
            win.confirm = () => true;
          });

          cy.confirmarGeracaoTermo(true, { validarPdf: true }).then((resposta) => {
            return validarPdfGerado(resposta, { parametro, nome }, atribuicoesDoLote);
          });
          cy.get('@abrirPdfTermo').then((abrirPdf) => {
            const parametros = new URL(
              abrirPdf.firstCall.args[0], Cypress.config('baseUrl')
            ).searchParams;
            expect(parametros.get('term_type'), 'tipo de termo enviado')
              .to.eq(parametro);
            const idsEnviados = (parametros.get('bonds_ids') || '').split(',');
            expect(idsEnviados, 'quantidade de atribuições enviada')
              .to.have.length(idsSelecionados.length);
            expect(idsEnviados, 'atribuições enviadas para geração')
              .to.have.members(idsSelecionados);
          });
        });
      });
    });
  });
});
