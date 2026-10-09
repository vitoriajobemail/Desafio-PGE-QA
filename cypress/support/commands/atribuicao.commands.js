
Cypress.Commands.add('preencherFormularioAtribuicao', (dados = {}) => {
  if (dados.area) {
    cy.intercept({
      method: 'GET',
      pathname: '/portal_service/subareas.json'
    }).as('carregarSubareasAtribuicao');

    cy.get('#set_area').select(dados.area);
    cy.wait('@carregarSubareasAtribuicao', { timeout: 15000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 304]);
  }

  if (dados.subarea) {
    cy.get('#resp_subarea').select(dados.subarea)
      .find('option:selected')
      .should(($opcao) => {
        expect([$opcao.val(), $opcao.text().trim()], 'Subárea selecionada')
          .to.include(dados.subarea);
      });
  }

  if (dados.atendidoPor) {
    cy.get('#collaborators').next('.select2-container').click();
    cy.get('.select2-results__option').contains(dados.atendidoPor).click();
  }

  if (dados.modalidade === 'Home Office') {
    cy.get('input[type="radio"][value="home_office"]').check();
  } else if (dados.modalidade === 'Presencial') {
    cy.get('input[type="radio"][value="presencial"]').check();
  }

  if (dados.soLabel) cy.get('#so').select(dados.soLabel);

  if (dados.officeOptionLabel) {
    cy.get('#check_office').check();
    cy.get('#key').select(dados.officeOptionLabel);
  }

  if (dados.observacao) {
    cy.get('#bond_observation').type(dados.observacao);
  }

  if (Array.isArray(dados.tombosLabels) && dados.tombosLabels.length > 0) {
    dados.tombosLabels.forEach((tomboLabel, index) => {
      cy.get('#btn_asset').click({force: true});
      cy.get('.select_tombo').eq(index).select(tomboLabel, { force: true });
    });
  }
});

Cypress.Commands.add('cadastrarAtribuicaoViaApi', (dados = {}) => {
  return cy.request('/portal_service/bonds/new').then((formulario) => {
    const campos = Cypress.$(formulario.body);
    const token = campos.find('input[name="authenticity_token"]').val();
    const areaId = campos.find('#set_area option').filter((_, opcao) =>
      opcao.value === dados.area || opcao.text.trim() === dados.area
    ).val();
    const sistemaId = campos.find('#so option').filter((_, opcao) =>
      opcao.value === dados.soLabel || opcao.text.trim() === dados.soLabel
    ).val();
    const colaboradorId = dados.colaboradorId ?? campos.find('#collaborators option').filter((_, opcao) =>
      opcao.text.includes(dados.atendidoPor)
    ).first().val();

    expect(Boolean(token), 'token do formulário de atribuições').to.be.true;
    expect(areaId, 'área do preparo').to.match(/^\d+$/);
    expect(sistemaId, 'sistema operacional do preparo').to.match(/^\d+$/);
    expect(colaboradorId, 'colaborador do preparo').to.match(/^\d+$/);

    return cy.request({
      url: '/portal_service/subareas.json',
      qs: { area_id: areaId }
    }).then((consulta) => {
      expect(consulta.status, 'consulta das subáreas').to.eq(200);
      const subarea = consulta.body.find((item) =>
        String(item.id) === dados.subarea || item.description === dados.subarea
      );
      expect(subarea, 'subárea do preparo').to.exist;

      return cy.request({
        method: 'POST',
        url: '/portal_service/bonds',
        form: true,
        body: {
          authenticity_token: token,
          'bond[area]': areaId,
          'bond[subarea_id]': subarea.id,
          'bond[employee_type]': 'Colaborador',
          'bond[user_id]': colaboradorId,
          'bond[attendant_attributes][0][attended_by]': '',
          'bond[modality]': dados.modalidade ?? 'Presencial',
          'bond[operating_system_id]': sistemaId,
          'bond[has_office_suite]': '0',
          'bond[observation]': dados.observacao ?? '',
          'bond[bond_asset_attributes][0][asset_id]': dados.ativoId,
          'bond[bond_asset_attributes][0][description]': '',
          'bond[bond_asset_attributes][0][status_id]': '5',
          'bond[bond_asset_attributes][0][_destroy]': 'false'
        }
      }).then((resposta) => {
        expect(resposta.status, 'cadastro da atribuição de teste').to.eq(200);
        return { ...resposta, colaboradorId };
      });
    });
  });
});

Cypress.Commands.add('salvarAtribuicao', (esperarResposta = true) => {
  if (esperarResposta) {
    cy.intercept('POST', '**/portal_service/bonds').as('postAtribuicao');
    cy.get('input[type="submit"][value="Salvar"]').click();
    cy.wait('@postAtribuicao').then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 302]);
    });
  } else {
    // Para validações HTML5 onde o envio HTTP é bloqueado pelo próprio navegador
    cy.get('input[type="submit"][value="Salvar"]').click();
  }
});

Cypress.Commands.add('atualizarFormularioAtribuicao', (dados = {}) => {
  if (dados.area) {
    cy.intercept({
      method: 'GET',
      pathname: '/portal_service/subareas.json'
    }).as('carregarSubareasEdicao');
    cy.get('#set_area').select(dados.area);
    cy.wait('@carregarSubareasEdicao', { timeout: 15000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 304]);
  }
  if (dados.subarea) cy.get('#resp_subarea').select(dados.subarea);

  if (dados.sistemaOperacionalId) {
    cy.get('#so')
      .should('not.be.disabled')
      .select(dados.sistemaOperacionalId);
  }

  if (dados.colaboradorId) {
    cy.get('#collaborators')
      .should('not.be.disabled')
      .select(dados.colaboradorId, { force: true });
  }

  if (dados.atendidoPor) {
    cy.get('#attended').select(dados.atendidoPor, { force: true });
  }

  if (dados.modalidade) {
    cy.get('input[type="radio"]').then(($radios) => {
      const target = Array.from($radios).find(r => 
        r.value.toLowerCase().includes(dados.modalidade.toLowerCase().replace(' ', '_')) ||
        r.value.toLowerCase().includes(dados.modalidade.toLowerCase())
      );
      if (target) {
        cy.wrap(target).check({ force: true });
      } else {
        cy.contains('label', dados.modalidade).find('input[type="radio"]').check({ force: true });
      }
    });
  }

  if (dados.observacao) {
    cy.get('#bond_observation').clear().type(dados.observacao);
  }

  if (dados.novoTombo) {
    cy.get('#btn_asset').click({ force: true });
    cy.get('.select_tombo').last().select(dados.novoTombo, { force: true });
  }
});

Cypress.Commands.add('salvarEdicaoAtribuicao', (esperarResposta = true) => {
  if (esperarResposta) {
    cy.intercept({
      method: /(POST|PUT|PATCH)/,
      pathname: /^\/portal_service\/bonds\/\d+$/
    }).as('updateAtribuicao');

    cy.get('input[type="submit"][value="Salvar"]').click({ force: true });

    cy.wait('@updateAtribuicao', { timeout: 15000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 302, 303]);
  } else {
    cy.get('input[type="submit"][value="Salvar"]').click({ force: true });
  }
});
