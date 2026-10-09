describe('HU01 - Cadastro de Atribuições', () => {

  beforeEach(() => {
    cy.fixture('atribuicao').as('massaAtribuicao');
    cy.login();
    cy.visit('/portal_service/bonds/new');
    cy.get('#set_area', { timeout: 10000 }).should('be.visible');
  });

  describe('Cenários Positivos', () => {  
    it('Cenário 1: Deve salvar preenchendo apenas os campos OBRIGATÓRIOS', function () {
      const tomboUnico = `TB-${Date.now()}`;

      cy.fixture('ativo').then((massaAtivo) => {
        cy.cadastrarAtivoViaApi({
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        });
      });

      cy.visit('/portal_service/bonds/new');
      cy.preencherFormularioAtribuicao({
        ...this.massaAtribuicao.obrigatorios,
        tombosLabels: [tomboUnico]
      });
      cy.get('#set_status').select('VÍNCULADO');
      cy.salvarAtribuicao();
      cy.location('pathname').should('eq', '/portal_service/bonds');
      cy.get('#bond_search').should('be.visible');
      cy.get('table tbody').should('be.visible');
      cy.get('.alert-danger').should('not.exist');
    });

    it('Cenário 2: Deve salvar preenchendo TODOS os campos (Obrigatórios + Opcionais)', function () {
      const tomboUnico = `TB-${Date.now()}`;
      let ativoId;
      let chaveOfficeId;

      cy.fixture('ativo').then((massaAtivo) => {
        cy.cadastrarAtivoViaApi({
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        }).then(({ urlEdicao }) => {
          expect(urlEdicao, 'edição do ativo criado').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
          ativoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
        });
      });

      cy.visit('/portal_service/bonds/new');
      
      cy.get('#check_office').check();

      const dadosFormulario = { ...this.massaAtribuicao.completo, tombosLabels: [tomboUnico] };
      delete dadosFormulario.officeOptionLabel;
      
      cy.preencherFormularioAtribuicao(dadosFormulario);

      cy.get('#set_status').select('VÍNCULADO');
      cy.salvarAtribuicao();
      cy.then(() => {
        cy.request({
          url: '/portal_service/bonds',
          qs: { 'q[bond_asset_asset_id_eq]': ativoId }
        }).then((consulta) => {
          expect(consulta.status, 'consulta da atribuição criada').to.eq(200);
          const linhas = Cypress.$(consulta.body).find('table tbody tr');
          expect(linhas.length, 'atribuição do ativo exclusivo').to.eq(1);
          const urlEdicao = linhas.find('a[href$="/edit"]').attr('href');
          expect(urlEdicao, 'edição da atribuição criada').to.match(/^\/portal_service\/bonds\/\d+\/edit$/);

          cy.request(urlEdicao).then((edicao) => {
            expect(edicao.status, 'consulta do vínculo de Office').to.eq(200);
            const $pagina = Cypress.$(edicao.body);
            expect($pagina.find('select[name*="[asset_id]"]').first().val(), 'ativo vinculado').to.eq(ativoId);
            expect($pagina.find('#check_office').prop('checked'), 'Office vinculado').to.be.true;
          });
        });
      });
      cy.location('pathname').should('eq', '/portal_service/bonds');
      cy.get('#bond_search').should('be.visible');
      cy.get('table tbody').should('be.visible');
      cy.get('.alert-danger').should('not.exist');
    });

    it('Cenário 3: Deve salvar com conjunto alternativo de dados (Área/Subárea diferentes)', function () {
      const tomboUnico = `TB-${Date.now()}`;

      cy.fixture('ativo').then((massaAtivo) => {
        cy.cadastrarAtivoViaApi({
          ...massaAtivo.desktopPadrao,
          tombo: tomboUnico
        });
      });

      cy.visit('/portal_service/bonds/new');
      cy.preencherFormularioAtribuicao({
        ...this.massaAtribuicao.alternativo,
        tombosLabels: [tomboUnico]
      });
      cy.get('#set_status').select('VÍNCULADO');
      cy.salvarAtribuicao();
      cy.location('pathname').should('eq', '/portal_service/bonds');
      cy.get('#bond_search').should('be.visible');
      cy.get('table tbody').should('be.visible');
      cy.get('.alert-danger').should('not.exist');
    });
  });

  describe('Cenários Negativos e Validações de Borda', () => {
    it('Cenário 4: Deve impedir a submissão e exibir validação HTML5 ao tentar salvar formulário em branco', function () {
      cy.intercept({
        method: 'POST',
        pathname: '/portal_service/bonds'
      }).as('postAtribuicaoBloqueada');

      // Passa false para não travar esperando a requisição HTTP que não vai acontecer
      cy.salvarAtribuicao(false);
      cy.url().should('include', '/portal_service/bonds/new');
      cy.get('#set_area').then(($select) => {
        expect($select[0].checkValidity()).to.be.false;
      });
      cy.get('@postAtribuicaoBloqueada.all').should('have.length', 0);
    });

    it('Cenário 5: Deve permitir cancelar a operação e retornar para a listagem sem salvar', function () {
      cy.intercept({
        method: 'POST',
        pathname: '/portal_service/bonds'
      }).as('postAtribuicaoCancelada');

      cy.preencherFormularioAtribuicao(this.massaAtribuicao.obrigatorios);      
      cy.get('a').contains(/voltar|cancelar/i).click();
      cy.url().should('include', '/portal_service/bonds');
      cy.url().should('not.include', '/new');
      cy.get('@postAtribuicaoCancelada.all').should('have.length', 0);
    });
  });  

});
