describe('Edição e Histórico de Ativos', () => {

  // O JavaScript do formulário acessa #os, que não existe nesta tela.
  Cypress.on('uncaught:exception', (err) => {
    const mensagemConhecida = err.message.includes("Cannot read properties of null (reading 'disabled')") ||
      err.message.includes("Cannot set properties of null (setting 'disabled')");
    const origemConhecida = err.stack?.split('\n')
      .find((linha) => linha.trimStart().startsWith('at '))
      ?.includes(`${Cypress.config('baseUrl')}/portal_service/listing_assets`);

    if (err.name === 'TypeError' && mensagemConhecida && origemConhecida) {
      return false;
    }
    return true;
  });

  beforeEach(() => {
    cy.login()

    cy.visit('/portal_service/listing_assets')

    cy.get('i.fa-edit', { timeout: 10000 }).should('be.visible')
  })

  context('Validação do Histórico de Ativos', () => {
    it('Deve exibir o histórico inicial do ativo cadastrado', () => {
      const tomboUnico = `TB-${Date.now()}`;

      cy.fixture('ativo').then((massaAtivo) => {
        const dadosAtivo = {
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        };

        cy.visit('/portal_service/listing_assets/new');
        cy.cadastrarAtivo(dadosAtivo);
        cy.salvarAtivo();

        cy.location('pathname').should('eq', '/portal_service/listing_assets');
        cy.contains('table tbody tr', tomboUnico)
          .find('a[data-target="#bondmodal"]')
          .should('have.length', 1)
          .then(($acaoHistorico) => {
            cy.intercept('GET', `**${$acaoHistorico.attr('href')}`).as('getHistory');
            cy.wrap($acaoHistorico).click();
          });

        cy.wait('@getHistory')
          .its('response.statusCode')
          .should('eq', 200);
        cy.get('#bondmodal').should('be.visible');
        cy.get('#bondmodal .modal-content').should('be.visible');
        cy.get('#bondmodal .modal-title').should(
          'contain.text',
          `HISTÓRICO: ${tomboUnico} - ${dadosAtivo.tipo} ${dadosAtivo.marca} ${dadosAtivo.modelo}`
        );

        cy.get('#bondmodal .modal-body table').should('have.length', 1);
        cy.get('#bondmodal .modal-body thead')
          .should('contain.text', 'Lotação atual')
          .and('contain.text', 'Usuário');
        cy.get('#bondmodal .modal-body tbody tr')
          .should('have.length', 1)
          .find('td')
          .should(($celulas) => {
            expect($celulas).to.have.length(2);
            expect($celulas.eq(0).text().trim(), 'lotação inicial').to.eq('CTI - DEPOSITO SERVICE DESK');
            expect($celulas.eq(1).text().trim(), 'usuário inicial').to.eq('SUPORTE');
          });
      });
    });
  });

  context('Validação da Edição de Ativos', () => {
    it('Deve carregar o formulário de edição com os dados preenchidos', () => {
      const tomboUnico = `TB-${Date.now()}`;

      cy.fixture('ativo').then((massaAtivo) => {
        const dadosAtivo = {
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        };

        cy.visit('/portal_service/listing_assets/new');
        cy.cadastrarAtivo(dadosAtivo);
        cy.salvarAtivo();

        cy.location('pathname').should('eq', '/portal_service/listing_assets');
        cy.contains('table tbody tr', tomboUnico)
          .find('a[href$="/edit"]')
          .should('have.length', 1)
          .click();

        cy.url().should('include', '/edit')
        cy.get('.card-header h6').should('contain.text', 'Atualizando Ativo')

        cy.get('#type').should('be.visible').and('have.value', dadosAtivo.tipo);
        cy.get('#asset_brand').should('be.visible').and('have.value', dadosAtivo.marca);
        cy.get('#asset_model').should('have.value', dadosAtivo.modelo);
        cy.get('#asset_serial').should('have.value', dadosAtivo.numeroSerie);
        cy.get('#asset_tombo').should('be.visible').and('have.value', dadosAtivo.tombo);
        cy.get('#asset_acquisition_id').should('have.value', dadosAtivo.aquisicao);
        cy.get('#asset_specification').should('have.value', dadosAtivo.especificacao);
      });
    })

    it('Deve permitir editar e guardar as informações de um ativo com sucesso', () => {
      const tomboUnico = `TB-${Date.now()}`;
      const marcaEditada = 'Marca Editada pelo Cypress';
      const especificacaoEditada = 'Especificação atualizada via teste automatizado';

      cy.visit('/portal_service/listing_assets/new');
      cy.fixture('ativo').as('massaAtivoEdicao').then((massaAtivo) => {
        cy.cadastrarAtivo({
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        });
      });
      cy.salvarAtivo();

      cy.location('pathname').should('eq', '/portal_service/listing_assets');
      cy.contains('table tbody tr', tomboUnico)
        .find('a[href$="/edit"]')
        .should('have.length', 1)
        .click();
      cy.get('#asset_tombo').should('have.value', tomboUnico);

      cy.get('#asset_brand').clear().type(marcaEditada)
      cy.get('#asset_specification').clear().type(especificacaoEditada)

      cy.intercept({
        method: /(POST|PUT|PATCH)/,
        url: '**/portal_service/listing_assets/*'
      }).as('atualizarAtivo');

      cy.get('input[type="submit"][value="Salvar"]').click()
      cy.wait('@atualizarAtivo', { timeout: 15000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 302, 303]);

      cy.location('pathname').should('eq', '/portal_service/listing_assets');
      cy.contains('table tbody tr', tomboUnico)
        .find('a[href$="/edit"]')
        .should('have.length', 1)
        .click();

      cy.get('#asset_tombo').should('have.value', tomboUnico);
      cy.get('#asset_brand').should('have.value', marcaEditada);
      cy.get('#asset_specification').should('have.value', especificacaoEditada);

      cy.get('@massaAtivoEdicao').then((massaAtivo) => {
        cy.get('#type').should('have.value', massaAtivo.desktopPadrao.tipo);
        cy.get('#asset_model').should('have.value', massaAtivo.desktopPadrao.modelo);
        cy.get('#asset_serial').should('have.value', massaAtivo.desktopPadrao.numeroSerie);
        cy.get('#asset_acquisition_id').should('have.value', massaAtivo.desktopPadrao.aquisicao);
      });
    })

    it('Deve preservar os dados originais ao cancelar a edição do ativo', () => {
      const tomboUnico = `TB-${Date.now()}`;

      cy.fixture('ativo').then((massaAtivo) => {
        const dadosAtivo = {
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        };

        cy.visit('/portal_service/listing_assets/new');
        cy.cadastrarAtivo(dadosAtivo);
        cy.salvarAtivo();

        cy.location('pathname').should('eq', '/portal_service/listing_assets');
        cy.contains('table tbody tr', tomboUnico)
          .find('a[href$="/edit"]')
          .should('have.length', 1)
          .click();
        cy.get('#asset_tombo').should('have.value', tomboUnico);

        cy.location('pathname').then((caminhoEdicao) => {
          expect(caminhoEdicao).to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
          cy.intercept({
            method: /(POST|PUT|PATCH)/,
            url: `**${caminhoEdicao.replace(/\/edit$/, '')}`
          }).as('salvarEdicaoCancelada');
        });

        cy.get('#asset_brand').clear().type('Marca que deve ser descartada');
        cy.get('#asset_specification').clear().type('Especificação que deve ser descartada');
        cy.cancelarAtivo();

        cy.location('pathname').should('eq', '/portal_service/listing_assets');
        cy.contains('table tbody tr', tomboUnico)
          .find('a[href$="/edit"]')
          .should('have.length', 1)
          .then(($editarAtivo) => {
            cy.intercept('GET', `**${$editarAtivo.attr('href')}`).as('reabrirAtivoCancelado');
            cy.wrap($editarAtivo).click();
          });

        cy.wait('@reabrirAtivoCancelado')
          .its('response.statusCode')
          .should('eq', 200);
        cy.get('@salvarEdicaoCancelada.all').should('have.length', 0);

        cy.get('#type').should('have.value', dadosAtivo.tipo);
        cy.get('#asset_brand').should('have.value', dadosAtivo.marca);
        cy.get('#asset_model').should('have.value', dadosAtivo.modelo);
        cy.get('#asset_serial').should('have.value', dadosAtivo.numeroSerie);
        cy.get('#asset_tombo').should('have.value', dadosAtivo.tombo);
        cy.get('#asset_acquisition_id').should('have.value', dadosAtivo.aquisicao);
        cy.get('#asset_specification').should('have.value', dadosAtivo.especificacao);
      });
    });

    it('Deve impedir a edição sem Marca e preservar os dados originais', () => {
      const tomboUnico = `TB-${Date.now()}`;

      cy.fixture('ativo').then((massaAtivo) => {
        const dadosAtivo = {
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        };

        cy.visit('/portal_service/listing_assets/new');
        cy.cadastrarAtivo(dadosAtivo);
        cy.salvarAtivo();

        cy.location('pathname').should('eq', '/portal_service/listing_assets');
        cy.contains('table tbody tr', tomboUnico)
          .find('a[href$="/edit"]')
          .should('have.length', 1)
          .click();
        cy.get('#asset_tombo').should('have.value', tomboUnico);

        cy.location('pathname').then((caminhoEdicao) => {
          expect(caminhoEdicao).to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
          const caminhoAtivo = caminhoEdicao.replace(/\/edit$/, '');

          cy.intercept({
            method: /(POST|PUT|PATCH)/,
            url: `**${caminhoAtivo}`
          }).as('salvarEdicaoInvalida');

          cy.get('#asset_brand').clear();
          cy.get('#asset_specification').clear().type('Especificação de edição inválida');
          cy.get('input[type="submit"][value="Salvar"]').click();

          cy.wait('@salvarEdicaoInvalida', { timeout: 15000 })
            .its('response.statusCode')
            .should('be.oneOf', [200, 422]);
          cy.location('pathname').should('eq', caminhoAtivo);
          cy.get('#asset_brand').should('be.visible').and('have.value', '');
          cy.get('.alert-danger').should('be.visible').and('contain.text', 'Marca não informado!');

          cy.intercept('GET', `**${caminhoEdicao}`).as('reabrirAtivoInvalido');
          cy.visit(caminhoEdicao);
          cy.wait('@reabrirAtivoInvalido')
            .its('response.statusCode')
            .should('eq', 200);

          cy.get('#type').should('have.value', dadosAtivo.tipo);
          cy.get('#asset_brand').should('have.value', dadosAtivo.marca);
          cy.get('#asset_model').should('have.value', dadosAtivo.modelo);
          cy.get('#asset_serial').should('have.value', dadosAtivo.numeroSerie);
          cy.get('#asset_tombo').should('have.value', dadosAtivo.tombo);
          cy.get('#asset_acquisition_id').should('have.value', dadosAtivo.aquisicao);
          cy.get('#asset_specification').should('have.value', dadosAtivo.especificacao);
        });
      });
    });
  })
})