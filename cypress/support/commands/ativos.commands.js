Cypress.Commands.add('cadastrarAtivo', (dados = {}) => {
  if (dados.tipo) {
    cy.get('#type').select(dados.tipo);
  }

  if (dados.marca) {
    cy.get('#asset_brand').clear().type(dados.marca);
  }

  if (dados.modelo) {
    cy.get('#asset_model').clear().type(dados.modelo);
  }

  if (dados.numeroSerie) {
    cy.get('#asset_serial').clear().type(dados.numeroSerie);
  }

  if (dados.tombo) {
    cy.get('#asset_tombo').clear().type(dados.tombo);
  }

  if (dados.aquisicao) {
    cy.get('#asset_acquisition_id').select(dados.aquisicao);
  }

  if (dados.especificacao) {
    cy.get('#asset_specification').clear().type(dados.especificacao);
  }
});

Cypress.Commands.add('salvarAtivo', (esperarResposta = true) => {
  if (esperarResposta) {
    cy.intercept({
      method: /(POST|PUT|PATCH)/,
      url: '**/portal_service/listing_assets*'
    }).as('salvarRequisicaoAtivo');

    cy.get('input[type="submit"][value="Salvar"]').click({ force: true });

    cy.wait('@salvarRequisicaoAtivo', { timeout: 15000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 302, 303]);
  } else {
    cy.get('input[type="submit"][value="Salvar"]').click({ force: true });
  }
});

Cypress.Commands.add('cancelarAtivo', () => {
  cy.contains(/cancelar/i).click({ force: true });
});

Cypress.Commands.add('cadastrarAtivoViaApi', (dados = {}) => {
  return cy.request('/portal_service/listing_assets/new').then((formulario) => {
    const token = Cypress.$(formulario.body).find('input[name="authenticity_token"]').val();
    expect(Boolean(token), 'token do formulário de ativos').to.be.true;

    return cy.request({
      method: 'POST',
      url: '/portal_service/listing_assets',
      form: true,
      body: {
        authenticity_token: token,
        'asset[type]': dados.tipo,
        'asset[brand]': dados.marca,
        'asset[model]': dados.modelo,
        'asset[serial]': dados.numeroSerie,
        'asset[tombo]': dados.tombo,
        'asset[acquisition_id]': dados.aquisicao,
        'asset[specification]': dados.especificacao
      }
    }).then((resposta) => {
      expect(resposta.status, 'cadastro do ativo de teste').to.eq(200);

      return cy.request({
        url: '/portal_service/listing_assets',
        qs: { 'q[asset_i_cont_all]': dados.tombo }
      }).then((consulta) => {
        expect(consulta.status, 'consulta do ativo criado').to.eq(200);
        const linhasAtivo = Cypress.$(consulta.body).find('table tbody tr');
        expect(linhasAtivo.length, 'resultado da busca pelo tombo').to.eq(1);
        expect(linhasAtivo.text(), 'tombo do ativo criado').to.include(dados.tombo);

        return { urlEdicao: linhasAtivo.find('a[href$="/edit"]').attr('href') };
      });
    });
  });
});
