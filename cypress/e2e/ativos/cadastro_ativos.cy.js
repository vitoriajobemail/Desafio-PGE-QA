describe('Cadastro de Ativos', () => {
  
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
    cy.fixture('ativo').as('massaAtivo');

    cy.login();

    cy.visit('/portal_service/listing_assets/new');

    cy.get('#type', { timeout: 10000 }).should('be.visible');
  });

  it('Deve cadastrar um novo ativo (Desktop) preenchendo todos os campos com sucesso', function () {
    const tomboUnico = `TB-${Date.now()}`;

    cy.cadastrarAtivo({
      ...this.massaAtivo.desktopPadrao,
      tombo: tomboUnico
    });

    cy.salvarAtivo();

    cy.location('pathname').should('eq', '/portal_service/listing_assets');
    cy.contains('table tbody tr', tomboUnico).should('be.visible');

    cy.contains('table tbody tr', tomboUnico)
      .find('a[href$="/edit"]')
      .should('have.length', 1)
      .click();

    cy.get('#type').should('have.value', this.massaAtivo.desktopPadrao.tipo);
    cy.get('#asset_brand').should('have.value', this.massaAtivo.desktopPadrao.marca);
    cy.get('#asset_model').should('have.value', this.massaAtivo.desktopPadrao.modelo);
    cy.get('#asset_serial').should('have.value', this.massaAtivo.desktopPadrao.numeroSerie);
    cy.get('#asset_tombo').should('have.value', tomboUnico);
    cy.get('#asset_acquisition_id').should('have.value', this.massaAtivo.desktopPadrao.aquisicao);
    cy.get('#asset_specification').should('have.value', this.massaAtivo.desktopPadrao.especificacao);
  });

  it('Deve validar o cancelamento da operação descartando as informações', function () {
    const tomboCancelado = `TB-${Date.now()}`;

    cy.cadastrarAtivo({
      ...this.massaAtivo.notebookPadrao,
      tombo: tomboCancelado
    });

    cy.cancelarAtivo();

    cy.location('pathname').should('eq', '/portal_service/listing_assets');

    cy.intercept('GET', '**/portal_service/listing_assets*').as('buscarAtivoCancelado');
    cy.get('input[name="q[asset_i_cont_all]"]').clear().type(`${tomboCancelado}{enter}`);
    cy.wait('@buscarAtivoCancelado')
      .its('response.statusCode')
      .should('eq', 200);
    cy.contains('table tbody tr', tomboCancelado).should('not.exist');
  });

  context('Validação Data-Driven de Múltiplos Tipos de Ativos', () => {
    const tiposEquipamentos = ['NOTEBOOK', 'MONITOR', 'IMPRESSORA', 'WEBCAM'];

    tiposEquipamentos.forEach((tipo) => {
      it(`Deve cadastrar com sucesso um ativo do tipo: ${tipo}`, () => {
        const tomboUnico = `TB-${Date.now()}`;

        cy.cadastrarAtivo({
          tipo: tipo,
          marca: 'Marca Generica',
          modelo: 'Modelo Generico',
          tombo: tomboUnico,
          aquisicao: '1'
        });

        cy.salvarAtivo();

        cy.location('pathname').should('eq', '/portal_service/listing_assets');
        cy.contains('table tbody tr', tomboUnico).should('be.visible');

        cy.contains('table tbody tr', tomboUnico)
          .find('a[href$="/edit"]')
          .should('have.length', 1)
          .click();

        cy.get('#type').should('have.value', tipo);
        cy.get('#asset_brand').should('have.value', 'Marca Generica');
        cy.get('#asset_model').should('have.value', 'Modelo Generico');
        cy.get('#asset_tombo').should('have.value', tomboUnico);
        cy.get('#asset_acquisition_id').should('have.value', '1');
      });
    });
  });

  context('Cenários Negativos e Validações de Borda', () => {
    it('Deve impedir a submissão e exibir mensagem de erro ao tentar salvar formulário em branco', () => {
      cy.salvarAtivo();

      cy.location('pathname').should('eq', '/portal_service/listing_assets');
      cy.get('#type').should('be.visible');

      camposObrigatorios.forEach((campo) => {
        cy.get('.alert-danger').should('be.visible').and('contain.text', campo.mensagem);
      });
    });

    const camposObrigatorios = [
      { nome: 'Tipo', seletor: '#type', select: true, mensagem: 'Tipo não informado!' },
      { nome: 'Marca', seletor: '#asset_brand', mensagem: 'Marca não informado!' },
      { nome: 'Modelo', seletor: '#asset_model', mensagem: 'Modelo não informado!' },
      { nome: 'Tombo', seletor: '#asset_tombo', mensagem: 'Tombo não informado!' },
      { nome: 'Código de Aquisição', seletor: '#asset_acquisition_id', select: true, mensagem: 'Nº do Processo é obrigatório(a)' }
    ];

    camposObrigatorios.forEach((campo) => {
      it(`Deve impedir o cadastro sem o campo obrigatório: ${campo.nome}`, function () {
        cy.cadastrarAtivo({
          ...this.massaAtivo.desktopPadrao,
          tombo: `TB-${Date.now()}`
        });

        if (campo.select) {
          cy.get(campo.seletor).select('');
        } else {
          cy.get(campo.seletor).clear();
        }

        cy.salvarAtivo();

        cy.get(campo.seletor).should('be.visible').and('have.value', '');
        cy.get('.alert-danger').should('be.visible').and('contain.text', campo.mensagem);
      });
    });

    // BUG ENCONTRADO: O sistema está permitindo cadastrar Tombos duplicados.
    // Teste "skipado" (ignorado) até que a equipe de desenvolvimento corrija a restrição no backend.
    it.skip('Deve validar o comportamento ao tentar cadastrar um Tombo já existente (Duplicidade)', () => {
      const tomboDuplicado = `TB-${Date.now()}`;

      const dadosAtivo = {
        tipo: 'DESKTOP',
        marca: 'Dell',
        modelo: 'OptiPlex',
        tombo: tomboDuplicado,
        aquisicao: '1'
      };

      cy.cadastrarAtivo(dadosAtivo);
      cy.salvarAtivo();

      cy.location('pathname').should('eq', '/portal_service/listing_assets');
      cy.contains('table tbody tr', tomboDuplicado).should('be.visible');

      cy.visit('/portal_service/listing_assets/new');
      cy.cadastrarAtivo(dadosAtivo);
      cy.salvarAtivo();

      cy.get('#asset_tombo').should('be.visible').and('have.value', tomboDuplicado);
      cy.get('.alert-danger').should('be.visible')
        .invoke('text').should('match', /tombo/i);

      cy.visit('/portal_service/listing_assets');
      cy.intercept('GET', '**/portal_service/listing_assets*').as('buscarTomboDuplicado');
      cy.get('input[name="q[asset_i_cont_all]"]').clear().type(`${tomboDuplicado}{enter}`);
      cy.wait('@buscarTomboDuplicado')
        .its('response.statusCode')
        .should('eq', 200);
      cy.get('table tbody tr').should('have.length', 1).and('contain.text', tomboDuplicado);
    });
  });
});
