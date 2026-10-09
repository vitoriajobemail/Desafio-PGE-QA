
Cypress.Commands.add('acessarMovimentacaoAtivos', () => {
  cy.contains('span', 'Relatórios').click({ force: true });
  
  cy.contains('.collapse-item', 'Movimentação de Ativos').click({ force: true });
  
  cy.contains('button', 'Gerar Relatório', { timeout: 15000 }).should('be.visible');
});

Cypress.Commands.add('filtrarMovimentacaoAtivos', (area, dataInicio, dataFim) => {
  if (area) {
    cy.get('#area_name')
      .select(area, { force: true })
      .trigger('change', { force: true })
      .find('option:selected')
      .should('contain.text', area);
  }
  
  if (dataInicio) {
    // Campos type="date" no Cypress exigem o formato YYYY-MM-DD
    cy.get('#initial_date').clear().type(dataInicio); 
  }
  
  if (dataFim) {
    cy.get('#final_date').clear().type(dataFim);
  }

  const idUnico = Cypress._.uniqueId('pesquisa_');
  cy.intercept('POST', '**/portal_service/reports/moves_today').as(idUnico);
  
  cy.get('input[value="Pesquisar"]').click({ force: true });
  
  cy.wait(`@${idUnico}`, { timeout: 15000 });
});

Cypress.Commands.add('gerarRelatorioMovimentacaoPdf', () => {
  // Removemos o target="_blank" da <a> para evitar abrir nova aba.
  cy.document().then((doc) => {
    const linkRelatorio = doc.querySelector('a[href="/portal_service/reports/pdf_create"]');
    if (linkRelatorio && linkRelatorio.getAttribute('target') === '_blank') {
      linkRelatorio.removeAttribute('target');
    }
  });

  cy.contains('button', 'Gerar Relatório').click({ force: true });
  cy.wait(3000);
});


Cypress.Commands.add('acessarAtribuicoesPorArea', () => {
  cy.visit('/portal_service/reports/assignments_by_area');
  cy.contains('button, a', 'Gerar Relatório', { timeout: 15000 }).should('be.visible');
});

Cypress.Commands.add('filtrarAtribuicoesPorArea', (tipo, area, subarea) => {
  if (tipo) {
    cy.get(`input[name="type"][value="${tipo}"]`).check({ force: true });
  }
  
  if (area && subarea) {
    cy.intercept('GET', '**/portal_service/subareas.json*').as('subareasAtribuicoes');
  }

  if (area) {
    cy.get('#search_area').select(area, { force: true });
  }

  if (area && subarea) {
    cy.wait('@subareasAtribuicoes', { timeout: 15000 })
      .its('response.statusCode').should('be.oneOf', [200, 304]);
  }

  if (subarea) {
    cy.get('#search_subarea').select(subarea, { force: true });
  }

  cy.intercept('POST', '**/portal_service/reports/assignments_by_area').as('pesquisaAtribuicoes');
  
  cy.get('input[value="Pesquisar"]').click({ force: true });
  cy.wait('@pesquisaAtribuicoes', { timeout: 15000 });
});