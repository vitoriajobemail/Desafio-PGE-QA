
Cypress.Commands.add('selecionarAtribuicaoNaTabela', (id) => {
  if (id !== undefined) {
    expect(String(id), 'ID da atribuição selecionada').to.match(/^\d+$/);
    cy.get('input.marcar[type="checkbox"][value="' + id + '"]')
      .should('have.length', 1).check({ force: true });
  } else {
    cy.get('table tbody input[type="checkbox"]').first().check({ force: true });
  }
  cy.get('table', { timeout: 15000 }).should('be.visible');
});

Cypress.Commands.add('selecionarMultiplasAtribuicoes', (quantidade = 2, ids) => {
  if (ids !== undefined) {
    expect(ids, 'IDs solicitados para o lote').to.be.an('array').with.length(quantidade);
    expect(new Set(ids).size, 'IDs distintos no lote').to.eq(quantidade);
    ids.forEach((id) => cy.selecionarAtribuicaoNaTabela(id));
    return;
  }

  cy.get('input.marcar[type="checkbox"]').then(($checkboxes) => {
    const total = Math.min(quantidade, $checkboxes.length);
    for(let i = 0; i < total; i++) {
      // Faz o check individualmente e aguarda o reload dinâmico da aplicação
      cy.get('input.marcar[type="checkbox"]').eq(i).check({ force: true });
      cy.get('table', { timeout: 15000 }).should('be.visible');
    }
  });
});

Cypress.Commands.add('abrirModalGerarTermos', () => {
  let aberturaConcluida;
  cy.window().then((win) => {
    aberturaConcluida = new Cypress.Promise((resolve) => {
      win.jQuery('#generate_term').one('shown.bs.modal', () => resolve());
    });
  });
  cy.contains('button', 'Gerar Termos').click({ force: true });
  cy.then({ timeout: 10000 }, () => aberturaConcluida);
  cy.get('#generate_term', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('fecharModalGerarTermos', () => {
  let fechamentoConcluido;
  cy.window().then((win) => {
    fechamentoConcluido = new Cypress.Promise((resolve) => {
      win.jQuery('#generate_term').one('hidden.bs.modal', () => resolve());
    });
  });
  cy.get('#generate_term button[data-dismiss="modal"]').first().click({ force: true });
  cy.then({ timeout: 10000 }, () => fechamentoConcluido);
  cy.get('#generate_term').should('not.be.visible');
});

Cypress.Commands.add('selecionarTipoTermo', (tipo) => {
  if (tipo === 'responsabilidade') {
    cy.get('#term_type_liability').check({ force: true }).trigger('change', { force: true });
  } else if (tipo === 'emprestimo') {
    cy.get('#term_type_loan').check({ force: true }).trigger('change', { force: true });
  }
});

Cypress.Commands.add('confirmarGeracaoTermo', (esperarResposta = true, { validarPdf = false } = {}) => {
  if (esperarResposta) {
    cy.document().then((doc) => {
      const forms = doc.querySelectorAll('form');
      forms.forEach(form => {
        if (form.getAttribute('target') === '_blank') {
          form.removeAttribute('target');
        }
      });
    });

    if (validarPdf) {
      cy.window().then((win) => {
        cy.stub(win, 'open').as('abrirPdfTermo');
      });
    }

    cy.get('#btn-termo').click({ force: true });
    if (validarPdf) {
      return cy.get('@abrirPdfTermo').should('have.been.calledOnce').then((abrirPdf) => {
        const caminhoPdf = abrirPdf.firstCall.args[0];
        expect(caminhoPdf, 'endpoint de geração do termo')
          .to.match(/^\/portal_service\/bonds\/term_responsibility_asset\?/);

        return cy.request({
          url: caminhoPdf,
          encoding: 'binary',
          failOnStatusCode: false,
          log: false
        }).then((resposta) => {
          expect(resposta.status, 'retorno da geração do termo').to.eq(200);
          expect(resposta.headers['content-type'], 'tipo de conteúdo do termo')
            .to.include('application/pdf');
          expect(resposta.body.slice(0, 5), 'assinatura do arquivo PDF').to.eq('%PDF-');
          return resposta;
        });
      });
    } else {
      cy.wait(3000);
    }
  } else {
    cy.get('#btn-termo').click({ force: true });
  }
});

Cypress.Commands.add('validarConteudoPdf', (nomeArquivo, textosEsperados) => {
  const caminhoPdf = `${Cypress.config('downloadsFolder')}/${nomeArquivo}`;
  cy.readFile(caminhoPdf, { timeout: 15000, log: false }).should('exist');
  return cy.task('lerPdf', caminhoPdf, { log: false }).then((textoDoPdf) => {
    textosEsperados.forEach(texto => {
      expect(textoDoPdf).to.include(texto);
    });
    return textoDoPdf;
  });
});

Cypress.Commands.add('prepararAtribuicoesParaTermos', (modalidades) => {
  const identificador = Date.now();
  const massa = {};
  return cy.fixture('ativo').then((massaAtivo) => {
    return cy.fixture('atribuicao').then((massaAtribuicao) => {
      return cy.request({ url: '/portal_service/bonds/new', log: false }).then((formulario) => {
        expect(formulario.status, 'formulário do preparo de termos').to.eq(200);
        const opcoes = Cypress.$(formulario.body).find('#collaborators option').filter((_, opcao) => {
          const nome = opcao.text.trim();
          return /^\d+$/.test(opcao.value) && !opcao.disabled && nome.length >= 3 && nome.length <= 120;
        });
        const colaboradorPadrao = opcoes.first().val();
        const outroColaborador = opcoes.filter((_, opcao) =>
          opcao.value !== colaboradorPadrao && opcao.text.trim() !== opcoes.first().text().trim()
        ).first().val();
        expect(colaboradorPadrao, 'colaborador padrão do preparo').to.match(/^\d+$/);
        expect(outroColaborador, 'outro colaborador do preparo').to.match(/^\d+$/);

        let preparo = cy.wrap(null, { log: false });
        modalidades.forEach((modalidade, indiceModalidade) => {
          massa[modalidade] = [];
          for (let indice = 0; indice < 3; indice++) {
            const tombo = 'TB-' + identificador + '-' + indiceModalidade + indice;
            const numeroSerie = 'SN-HU03-' + identificador + '-' + indiceModalidade + indice;
            const dadosAtivo = modalidade === 'Home Office'
              ? massaAtivo.notebookPadrao : massaAtivo.desktopPadrao;
            const dadosAtribuicao = indice === 1
              ? massaAtribuicao.alternativo : massaAtribuicao.obrigatorios;
            const colaboradorEsperado = indice === 1 ? outroColaborador : colaboradorPadrao;
            let ativoId;

            preparo = preparo.then(() => {
              return cy.cadastrarAtivoViaApi({ ...dadosAtivo, tombo, numeroSerie });
            }).then(({ urlEdicao }) => {
              expect(urlEdicao, 'edição do ativo próprio para termos')
                .to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
              ativoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
              return cy.cadastrarAtribuicaoViaApi({
                ...dadosAtribuicao,
                soLabel: massaAtribuicao.completo.soLabel,
                observacao: 'QA_HU03_' + identificador + '_' + indiceModalidade + '_' + indice,
                ativoId,
                colaboradorId: colaboradorEsperado,
                ...(modalidade === 'Home Office' ? { modalidade } : {})
              });
            }).then(({ colaboradorId }) => {
              expect(colaboradorId, 'colaborador usado no cadastro').to.eq(colaboradorEsperado);
              return cy.request({
                url: '/portal_service/bonds',
                qs: { 'q[bond_asset_asset_id_eq]': ativoId },
                log: false
              });
            }).then((consulta) => {
              expect(consulta.status, 'consulta da atribuição própria').to.eq(200);
              const linhas = Cypress.$(consulta.body).find('table tbody tr');
              expect(linhas.length, 'atribuição do ativo próprio').to.eq(1);
              const id = linhas.find('input.marcar[type="checkbox"]').val();
              expect(id, 'ID da atribuição própria').to.match(/^\d+$/);
              return cy.request({ url: '/portal_service/bonds/' + id + '/edit', log: false })
                .then((edicao) => {
                  expect(edicao.status, 'consulta dos dados gravados').to.eq(200);
                  const campos = Cypress.$(edicao.body);
                  expect(campos.find('select[name*="[asset_id]"]').first().val(), 'ativo gravado')
                    .to.eq(ativoId);
                  expect(campos.find('#collaborators').val(), 'colaborador gravado')
                    .to.eq(colaboradorEsperado);
                  expect(campos.find('input[name="bond[modality]"]:checked').val(), 'modalidade gravada')
                    .to.eq(modalidade);
                  massa[modalidade].push({
                    id, ativoId, tombo, numeroSerie, modalidade,
                    descricao: [dadosAtivo.tipo, dadosAtivo.marca, dadosAtivo.modelo].join(' '),
                    area: dadosAtribuicao.area, subarea: dadosAtribuicao.subarea,
                    colaboradorId: colaboradorEsperado,
                    responsavel: campos.find('#collaborators option:selected').text().trim()
                  });
                });
            });
          }
        });
        return preparo.then(() => {
          const ids = Object.values(massa).flat().map((atribuicao) => atribuicao.id);
          expect(ids, 'total de atribuições próprias').to.have.length(modalidades.length * 3);
          expect(new Set(ids).size, 'atribuições próprias distintas').to.eq(ids.length);
          return massa;
        });
      });
    });
  });
});
