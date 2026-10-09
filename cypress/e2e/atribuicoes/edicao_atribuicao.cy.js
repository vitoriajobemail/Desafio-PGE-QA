describe('HU02 - Edição de Atribuições', () => {

  beforeEach(() => {
    cy.fixture('edicao_atribuicao').as('massaEdicao');
    cy.login();
    const tomboUnico = `TB-${Date.now()}`;
    let ativoId;

    cy.fixture('ativo').then((massaAtivo) => {
      cy.cadastrarAtivoViaApi({
        ...massaAtivo.desktopPadrao,
        tombo: tomboUnico
      }).then(({ urlEdicao }) => {
        expect(urlEdicao, 'edição do ativo criado').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
        ativoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
      });
    });

    cy.fixture('atribuicao').as('massaAtribuicao').then((massaAtribuicao) => {
      cy.cadastrarAtribuicaoViaApi({
        ...massaAtribuicao.obrigatorios,
        soLabel: massaAtribuicao.completo.soLabel,
        observacao: massaAtribuicao.completo.observacao,
        ativoId
      }).then(({ colaboradorId }) => {
        cy.wrap(colaboradorId, { log: false }).as('colaboradorOriginalId');
      });
    });

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

        cy.visit(urlEdicao);
        cy.get('select[name*="[asset_id]"]').first().should('have.value', ativoId);
        cy.get('#so').should('not.have.value', '');
      });
    });
    cy.get('#set_area', { timeout: 15000 }).should('be.visible');
  });

  describe('Cenários Positivos', () => {
    it('Cenário 1: Deve carregar dados anteriores e permitir alterar área, subárea, colaborador, modalidade, sistema operacional e observação', function () {
      let caminhoEdicao;
      let campoAtendidoPor;
      let novoColaboradorId;
      let novoSistemaOperacionalId;
      cy.location('pathname').then((pathname) => {
        caminhoEdicao = pathname;
      });
      const camposOriginais = {
        '#set_area': this.massaAtribuicao.obrigatorios.area,
        '#resp_subarea': this.massaAtribuicao.obrigatorios.subarea,
        '#so': this.massaAtribuicao.completo.soLabel
      };
      cy.get('#collaborators').should('have.value', this.colaboradorOriginalId);
      cy.get('input[name="bond[modality]"]:checked')
        .should('have.value', 'Presencial');
      Object.entries(camposOriginais).forEach(([seletor, valorEsperado]) => {
        cy.get(seletor).find('option:selected').should(($opcao) => {
          expect($opcao.text().trim(), `valor carregado em ${seletor}`).to.eq(valorEsperado);
        });
      });
      
      cy.get('#bond_observation')
        .should('have.value', this.massaAtribuicao.completo.observacao);
      cy.get('#check_office').should('not.be.checked');
      cy.get('#so').then(($campo) => {
        const sistemaAtualId = $campo.val();
        const outroSistema = Array.from($campo[0].options).find((opcao) =>
          opcao.value && !opcao.disabled && opcao.value !== sistemaAtualId
        );
        expect(Boolean(outroSistema), 'outro sistema operacional selecionável').to.be.true;
        novoSistemaOperacionalId = outroSistema.value;
      });
      cy.get('#collaborators').then(($campo) => {
        const colaboradorAtualId = $campo.val();
        const outroColaborador = Array.from($campo[0].options).find((opcao) =>
          opcao.value && !opcao.disabled && opcao.value !== colaboradorAtualId
        );
        expect(Boolean(outroColaborador), 'outro colaborador selecionável').to.be.true;
        novoColaboradorId = outroColaborador.value;

        cy.atualizarFormularioAtribuicao({
          ...this.massaEdicao.edicaoCamposBasicos,
          area: this.massaAtribuicao.alternativo.area,
          subarea: this.massaAtribuicao.alternativo.subarea,
          colaboradorId: novoColaboradorId,
          sistemaOperacionalId: novoSistemaOperacionalId
        });
      });
      cy.get('#attended')
        .should('have.value', this.massaEdicao.edicaoCamposBasicos.atendidoPor)
        .invoke('attr', 'name')
        .then((nome) => {
          campoAtendidoPor = nome;
        });
      cy.salvarEdicaoAtribuicao();
      cy.get('@updateAtribuicao').then(({ request }) => {
        const dadosEnviados = new URLSearchParams(request.body);
        expect(dadosEnviados.get(campoAtendidoPor), 'Atendido por enviado à API')
          .to.eq(this.massaEdicao.edicaoCamposBasicos.atendidoPor);
        expect(dadosEnviados.get('bond[user_id]'), 'novo colaborador enviado à API')
          .to.eq(novoColaboradorId);
        expect(dadosEnviados.get('bond[operating_system_id]'), 'novo sistema operacional enviado à API')
          .to.eq(novoSistemaOperacionalId);
        expect(dadosEnviados.get('bond[has_office_suite]'), 'estado sem Office enviado à API')
          .to.eq('0');
      });

      cy.url().should('not.include', '/edit');
      cy.url().should('match', /\/portal_service\/bonds(\/\d+)?$/);

      cy.get('.alert-success, .notice, [class*="success"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain.text', 'sucesso');

      if (this.massaEdicao.edicaoCamposBasicos.observacao) {
        cy.contains(this.massaEdicao.edicaoCamposBasicos.observacao).should('be.visible');
      }

      cy.then(() => {
        cy.visit(caminhoEdicao);
      });
      cy.get('input[name="bond[modality]"]:checked')
        .should('have.value', this.massaEdicao.edicaoCamposBasicos.modalidade);
      cy.get('#bond_observation')
        .should('have.value', this.massaEdicao.edicaoCamposBasicos.observacao);
      cy.get('#collaborators').should(($campo) => {
        expect($campo.val(), 'colaborador salvo após reabrir').to.eq(novoColaboradorId);
      });
      cy.get('#so').should(($campo) => {
        expect($campo.val(), 'sistema operacional salvo após reabrir').to.eq(novoSistemaOperacionalId);
      });
      cy.get('#check_office').should('not.be.checked');
      const camposEditados = {
        '#set_area': this.massaAtribuicao.alternativo.area,
        '#resp_subarea': this.massaAtribuicao.alternativo.subarea
      };
      Object.entries(camposEditados).forEach(([seletor, valorEsperado]) => {
        cy.get(seletor).find('option:selected').should(($opcao) => {
          expect($opcao.text().trim(), `valor salvo em ${seletor}`).to.eq(valorEsperado);
        });
      });
    });

    it('Cenário 2: Deve permitir substituir ativo marcando como DISPONÍVEL e adicionando novo tombo', function () {
      const novoTombo = `TB-S-${Date.now()}`;
      const segundoTombo = `TB-S2-${Date.now()}`;
      let caminhoEdicao;
      let ativoAnteriorId;
      let novoAtivoId;
      let descricaoNovoAtivo;
      let segundoAtivoId;
      let descricaoSegundoAtivo;

      cy.location('pathname').then((pathname) => {
        caminhoEdicao = pathname;
      });
      cy.get('select[name*="[asset_id]"]').first().invoke('val').then((id) => {
        ativoAnteriorId = id;
      });

      cy.fixture('ativo').then((massaAtivo) => {
        cy.cadastrarAtivoViaApi({
          ...massaAtivo.desktopPadrao,
          tombo: novoTombo
        }).then(({ urlEdicao }) => {
          expect(urlEdicao, 'edição do novo ativo criado').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
          novoAtivoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
        });
        cy.cadastrarAtivoViaApi({
          ...massaAtivo.desktopPadrao,
          tombo: segundoTombo
        }).then(({ urlEdicao }) => {
          expect(urlEdicao, 'edição do segundo ativo criado').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
          segundoAtivoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
        });
      });
      cy.reload();

      cy.get('select[name*="status"]').first().select('DISPONÍVEL', { force: true });
      cy.contains('.btn-danger', 'Remover')
        .should('be.visible')
        .click({ force: true });

      cy.intercept({
        method: 'GET',
        pathname: '/portal_service/listing_assets.json'
      }).as('carregarAtivoSubstituto');

      cy.atualizarFormularioAtribuicao({
        ...this.massaEdicao.substituicaoAtivoDisponivel,
        novoTombo
      });
      cy.wait('@carregarAtivoSubstituto', { timeout: 15000 }).then(({ request, response }) => {
        expect(request.query.id, 'ativo consultado na substituição').to.eq(novoAtivoId);
        expect(response.statusCode, 'consulta da descrição do novo ativo').to.eq(200);
      });
      cy.get('select[name*="[description]"]').last().should('not.have.value', '').then(($campo) => {
        descricaoNovoAtivo = {
          valor: $campo.val(),
          texto: $campo.find('option:selected').text().trim()
        };
        expect(descricaoNovoAtivo.texto, 'descrição exibida antes de salvar').not.to.eq('');
      });
      cy.get('select[name*="[status_id]"]').last().select('VÍNCULADO', { force: true });

      cy.atualizarFormularioAtribuicao({ novoTombo: segundoTombo });
      cy.wait('@carregarAtivoSubstituto', { timeout: 15000 }).then(({ request, response }) => {
        expect(request.query.id, 'segundo ativo consultado na substituição').to.eq(segundoAtivoId);
        expect(response.statusCode, 'consulta da descrição do segundo ativo').to.eq(200);
      });
      cy.get('select[name*="[description]"]').last().should('not.have.value', '').then(($campo) => {
        descricaoSegundoAtivo = {
          valor: $campo.val(),
          texto: $campo.find('option:selected').text().trim()
        };
        expect(descricaoSegundoAtivo.texto, 'descrição do segundo ativo antes de salvar').not.to.eq('');
      });
      cy.get('select[name*="[status_id]"]').last().select('VÍNCULADO', { force: true });
      cy.salvarEdicaoAtribuicao();

      cy.url().should('not.include', '/edit');
      cy.url().should('match', /\/portal_service\/bonds(\/\d+)?$/);

      cy.get('.alert-success, .notice, [class*="success"]', { timeout: 10000 })
        .should('be.visible');

      if (this.massaEdicao.substituicaoAtivoDisponivel.observacao) {
        cy.contains(this.massaEdicao.substituicaoAtivoDisponivel.observacao).should('be.visible');
      }

      cy.then(() => {
        cy.visit(caminhoEdicao);
      });
      cy.get('select[name*="[asset_id]"]').should(($campos) => {
        const ativosVinculados = Array.from($campos, (campo) => campo.value).filter(Boolean);
        expect(ativosVinculados, 'dois ativos vinculados após reabrir').to.have.members([novoAtivoId, segundoAtivoId]);
        expect(ativosVinculados, 'ativo anterior removido após reabrir').not.to.include(ativoAnteriorId);
      }).then(($campos) => {
        const $ativo = $campos.filter((_, campo) => campo.value === novoAtivoId);
        expect($ativo.length, 'campo exclusivo do ativo substituto').to.eq(1);
        const nomeDescricao = $ativo.attr('name').replace('[asset_id]', '[description]');
        cy.get(`select[name="${nomeDescricao}"]`).should(($campo) => {
          expect($campo.val(), 'descrição salva do ativo substituto').to.eq(descricaoNovoAtivo.valor);
          expect($campo.find('option:selected').text().trim(), 'descrição exibida após reabrir')
            .to.eq(descricaoNovoAtivo.texto);
        });
        const $segundoAtivo = $campos.filter((_, campo) => campo.value === segundoAtivoId);
        expect($segundoAtivo.length, 'campo exclusivo do segundo ativo').to.eq(1);
        const nomeSegundaDescricao = $segundoAtivo.attr('name').replace('[asset_id]', '[description]');
        cy.get(`select[name="${nomeSegundaDescricao}"]`).should(($campo) => {
          expect($campo.val(), 'descrição salva do segundo ativo').to.eq(descricaoSegundoAtivo.valor);
          expect($campo.find('option:selected').text().trim(), 'descrição do segundo ativo após reabrir')
            .to.eq(descricaoSegundoAtivo.texto);
        });
        [$ativo, $segundoAtivo].forEach(($campoAtivo) => {
          const nomeStatus = $campoAtivo.attr('name').replace('[asset_id]', '[status_id]');
          cy.get(`select[name="${nomeStatus}"]`).find('option:selected').should(($opcao) => {
            expect($opcao.text().trim(), 'status do ativo vinculado após reabrir').to.match(/^VÍNCULADO\b/);
          });
        });
      });

      cy.then(() => {
        cy.visit({
          url: '/portal_service/deposits',
          qs: { 'q[asset_id_eq]': ativoAnteriorId }
        });
        cy.get('table tbody tr').should('have.length', 1);
        cy.get(`a[href="/portal_service/deposits/${ativoAnteriorId}/edit"]`)
          .should('have.length', 1)
          .closest('tr')
          .within(() => {
            cy.contains('td', 'DISPONÍVEL').should('be.visible');
          });
      });
    });

    it('Cenário 3: Deve permitir trocar ativo registrando DEFEITO e novo tombo', function () {
      const novoTombo = `TB-S-${Date.now()}`;
      let caminhoEdicao;
      let ativoAnteriorId;
      let novoAtivoId;

      cy.location('pathname').then((pathname) => {
        caminhoEdicao = pathname;
      });
      cy.get('select[name*="[asset_id]"]').first().invoke('val').then((id) => {
        ativoAnteriorId = id;
      });

      cy.fixture('ativo').then((massaAtivo) => {
        cy.cadastrarAtivoViaApi({
          ...massaAtivo.desktopPadrao,
          tombo: novoTombo
        }).then(({ urlEdicao }) => {
          expect(urlEdicao, 'edição do novo ativo criado').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
          novoAtivoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
        });
      });
      cy.reload();

      cy.get('select[name*="status"]')
        .first()
        .select('COM DEFEITO', { force: true })
        .trigger('change', { force: true });

      cy.get('input[name*="bond_asset_attributes"][name$="[observation]"]').first()
        .should('be.visible')
        .clear()
        .type(this.massaEdicao.trocaAtivoComDefeito.descricaoDefeito)
        .should('have.value', this.massaEdicao.trocaAtivoComDefeito.descricaoDefeito);

      cy.contains('.btn-danger', 'Remover')
        .should('be.visible')
        .click({ force: true });

      cy.intercept({
        method: 'GET',
        pathname: '/portal_service/listing_assets.json'
      }).as('carregarAtivoTrocaDefeito');

      cy.atualizarFormularioAtribuicao({
        ...this.massaEdicao.trocaAtivoComDefeito,
        novoTombo
      });
      cy.wait('@carregarAtivoTrocaDefeito', { timeout: 15000 }).then(({ request, response }) => {
        expect(request.query.id, 'ativo consultado na troca por defeito').to.eq(novoAtivoId);
        expect(response.statusCode, 'consulta da descrição do novo ativo').to.eq(200);
      });
      cy.get('select[name*="[description]"]').last().should('not.have.value', '');
      cy.get('select[name*="[status_id]"]').last().select('VÍNCULADO', { force: true });
      cy.salvarEdicaoAtribuicao();

      cy.url().should('not.include', '/edit');
      cy.url().should('match', /\/portal_service\/bonds(\/\d+)?$/);

      cy.get('.alert-success, .notice, [class*="success"]', { timeout: 10000 })
        .should('be.visible');

      cy.then(() => {
        cy.visit(caminhoEdicao);
      });
      cy.get('select[name*="[asset_id]"]').should(($campos) => {
        const ativosVinculados = Array.from($campos, (campo) => campo.value).filter(Boolean);
        expect(ativosVinculados, 'novo ativo vinculado após reabrir').to.include(novoAtivoId);
        expect(ativosVinculados, 'ativo com defeito removido após reabrir').not.to.include(ativoAnteriorId);
      });

      cy.then(() => {
        cy.visit({
          url: '/portal_service/deposits',
          qs: { 'q[asset_id_eq]': ativoAnteriorId }
        });
        cy.get('table tbody tr').should('have.length', 1);
        cy.get(`a[href="/portal_service/deposits/${ativoAnteriorId}/edit"]`)
          .should('have.length', 1)
          .closest('tr')
          .within(() => {
            cy.contains('td', 'COM DEFEITO').should('be.visible');
            cy.contains('td', this.massaEdicao.trocaAtivoComDefeito.descricaoDefeito)
              .should('be.visible');
          });
      });
    });

  });

  describe('Cenários Negativos e Validações de Borda', () => {
    it('Cenário 4: Deve manter a validação dos campos obrigatórios se limpos durante a edição', function () {
      cy.intercept({
        method: /(POST|PUT|PATCH)/,
        pathname: /^\/portal_service\/bonds\/\d+$/
      }).as('atualizacaoAtribuicaoInvalida');

      cy.get('#set_area').select('');

      cy.salvarEdicaoAtribuicao(false);

      cy.url().should('include', '/edit');
      cy.get('#set_area').then(($select) => {
        expect($select[0].checkValidity()).to.be.false;
      });
      cy.get('@atualizacaoAtribuicaoInvalida.all').should('have.length', 0);

      cy.reload();
      cy.get('#set_area').should(($select) => {
        expect($select.val(), 'área preenchida para validar subárea').not.to.eq('');
        expect($select[0].validity.valid, 'área válida ao testar subárea').to.be.true;
      });
      cy.get('#resp_subarea').should(($select) => {
        expect($select[0].required, 'subárea obrigatória na edição').to.be.true;
        expect($select.val(), 'subárea original carregada').not.to.eq('');
      }).select('');

      cy.salvarEdicaoAtribuicao(false);

      cy.url().should('include', '/edit');
      cy.get('#resp_subarea').then(($select) => {
        expect($select[0].validity.valueMissing, 'subárea vazia bloqueia o envio').to.be.true;
        expect($select[0].checkValidity()).to.be.false;
      });
      cy.get('@atualizacaoAtribuicaoInvalida.all').should('have.length', 0);

      cy.reload();
      cy.get('input[name="bond[employee_type]"]:checked').should('have.value', 'Colaborador');
      ['#set_area', '#resp_subarea'].forEach((seletor) => {
        cy.get(seletor).should(($select) => {
          expect($select.val(), `campo preenchido em ${seletor}`).not.to.eq('');
          expect($select[0].validity.valid, `campo válido em ${seletor}`).to.be.true;
        });
      });
      cy.get('#collaborators').should(($select) => {
        expect($select[0].required, 'colaborador obrigatório na edição').to.be.true;
        expect($select.val(), 'colaborador original carregado').not.to.eq('');
      }).select('', { force: true });

      cy.salvarEdicaoAtribuicao(false);

      cy.url().should('include', '/edit');
      cy.get('#collaborators').then(($select) => {
        expect($select[0].validity.valueMissing, 'colaborador vazio bloqueia o envio').to.be.true;
        expect($select[0].checkValidity()).to.be.false;
      });
      cy.get('@atualizacaoAtribuicaoInvalida.all').should('have.length', 0);
    });

    it('Cenário 5: Deve permitir cancelar a edição e descartar alterações', function () {
      let caminhoEdicao;
      let dadosOriginais;
      let remocoesVisiveisAntes;
      let novoColaboradorId;
      let novoSistemaOperacionalId;

      cy.intercept({
        method: /(POST|PUT|PATCH)/,
        pathname: /^\/portal_service\/bonds\/\d+$/
      }).as('atualizacaoAtribuicaoCancelada');

      cy.location('pathname').then((pathname) => {
        caminhoEdicao = pathname;
      });
      cy.get('#bond_observation').then(($observacao) => {
        const $formulario = $observacao.closest('form');
        dadosOriginais = {
          ativoId: $formulario.find('select[name*="[asset_id]"]').first().val(),
          tombo: $formulario.find('select[name*="[asset_id]"]').first().find('option:selected').text().trim(),
          statusAtivoId: $formulario.find('select[name*="[status_id]"]').first().val(),
          statusAtivoLabel: $formulario.find('select[name*="[status_id]"]').first().find('option:selected').text().trim(),
          colaboradorId: $formulario.find('#collaborators').val(),
          sistemaOperacionalId: $formulario.find('#so').val(),
          area: $formulario.find('#set_area').val(),
          subarea: $formulario.find('#resp_subarea').val(),
          modalidade: $formulario.find('input[name="bond[modality]"]:checked').val(),
          observacao: $observacao.val(),
          atendidoPor: $formulario.find('#attended').val()
        };
        expect(dadosOriginais.tombo, 'tombo exclusivo criado pelo teste').to.match(/^TB-\d+$/);
        expect(dadosOriginais.statusAtivoId, 'status original do ativo').to.match(/^\d+$/);
        expect(dadosOriginais.statusAtivoLabel, 'descrição do status original').not.to.eq('');
      });

      cy.get('#so').then(($campo) => {
        const sistemaAtualId = $campo.val();
        const outroSistema = Array.from($campo[0].options).find((opcao) =>
          opcao.value && !opcao.disabled && opcao.value !== sistemaAtualId
        );
        expect(Boolean(outroSistema), 'outro sistema operacional para cancelar').to.be.true;
        novoSistemaOperacionalId = outroSistema.value;
      });
      cy.get('#collaborators').then(($campo) => {
        const colaboradorAtualId = $campo.val();
        const outroColaborador = Array.from($campo[0].options).find((opcao) =>
          opcao.value && !opcao.disabled && opcao.value !== colaboradorAtualId
        );
        expect(Boolean(outroColaborador), 'outro colaborador para cancelar').to.be.true;
        novoColaboradorId = outroColaborador.value;

        cy.atualizarFormularioAtribuicao({
          ...this.massaEdicao.edicaoCamposBasicos,
          area: this.massaAtribuicao.alternativo.area,
          subarea: this.massaAtribuicao.alternativo.subarea,
          colaboradorId: novoColaboradorId,
          sistemaOperacionalId: novoSistemaOperacionalId
        });
      });
      cy.get('#collaborators').should(($campo) => {
        expect($campo.val(), 'novo colaborador antes de cancelar').to.eq(novoColaboradorId);
      });
      cy.get('#so').should(($campo) => {
        expect($campo.val(), 'novo sistema operacional antes de cancelar').to.eq(novoSistemaOperacionalId);
      });
      cy.get('#set_area').find('option:selected').should(($opcao) => {
        expect($opcao.text().trim(), 'nova área antes de cancelar')
          .to.eq(this.massaAtribuicao.alternativo.area);
      });
      cy.get('#resp_subarea').find('option:selected').should(($opcao) => {
        expect($opcao.text().trim(), 'nova subárea antes de cancelar')
          .to.eq(this.massaAtribuicao.alternativo.subarea);
      });
      cy.get('input[name="bond[modality]"]:checked')
        .should('have.value', this.massaEdicao.edicaoCamposBasicos.modalidade);
      cy.get('#bond_observation')
        .should('have.value', this.massaEdicao.edicaoCamposBasicos.observacao);
      cy.get('#attended')
        .should('have.value', this.massaEdicao.edicaoCamposBasicos.atendidoPor);

      cy.get('#check_office').should('not.be.checked').check().should('be.checked');

      cy.get('select[name*="[status_id]"]').first().select('DISPONÍVEL', { force: true });
      cy.get('#bond_observation').then(($observacao) => {
        remocoesVisiveisAntes = $observacao.closest('form').find('.btn-danger')
          .filter((_, botao) => botao.textContent.includes('Remover')).filter(':visible').length;
        expect(remocoesVisiveisAntes, 'ativo com botão Remover disponível').to.be.greaterThan(0);
      });
      cy.contains('.btn-danger', 'Remover').should('be.visible').click({ force: true });
      cy.get('#bond_observation').should(($observacao) => {
        const remocoesVisiveis = $observacao.closest('form').find('.btn-danger')
          .filter((_, botao) => botao.textContent.includes('Remover')).filter(':visible').length;
        expect(remocoesVisiveis, 'item removido antes de cancelar').to.eq(remocoesVisiveisAntes - 1);
      });

      cy.contains('Cancelar', { timeout: 10000 }).click({ force: true });

      cy.get('table', { timeout: 15000 }).should('be.visible');
      cy.url().should('not.include', '/edit');
      cy.url().should('include', '/portal_service/bonds');

      cy.then(() => {
        cy.visit(caminhoEdicao);
        cy.get('input[name="bond[modality]"]:checked')
          .should('have.value', dadosOriginais.modalidade);
        cy.get('#bond_observation').should('have.value', dadosOriginais.observacao);
        cy.get('#attended').should('have.value', dadosOriginais.atendidoPor);
        cy.get('#set_area').should('have.value', dadosOriginais.area);
        cy.get('#resp_subarea').should('have.value', dadosOriginais.subarea);
        cy.get('#collaborators').should('have.value', dadosOriginais.colaboradorId);
        cy.get('#so').should('have.value', dadosOriginais.sistemaOperacionalId);
        cy.get('#check_office').should('not.be.checked');
        cy.get('select[name*="[asset_id]"]').first().should('have.value', dadosOriginais.ativoId);
        cy.get('select[name*="[status_id]"]').first().should('have.value', dadosOriginais.statusAtivoId);
        cy.contains('.btn-danger', 'Remover').should('be.visible');
        cy.request(caminhoEdicao).then((consulta) => {
          expect(consulta.status, 'consulta da atribuição após cancelar').to.eq(200);
          const $formulario = Cypress.$(consulta.body).find('#bond_observation').closest('form');
          expect($formulario.length, 'formulário da atribuição consultada').to.eq(1);
          expect($formulario.find('#check_office').prop('checked'), 'Office desmarcado na resposta da API').to.be.false;
          const $ativo = $formulario.find('select[name*="[asset_id]"]').first();
          const $status = $formulario.find('select[name*="[status_id]"]').first();
          expect($ativo.val(), 'ativo original vinculado na resposta da API').to.eq(dadosOriginais.ativoId);
          expect($ativo.find('option:selected').text().trim(), 'tombo original na resposta da API')
            .to.eq(dadosOriginais.tombo);
          expect($status.val(), 'status original na resposta da API').to.eq(dadosOriginais.statusAtivoId);
          expect($status.find('option:selected').text().trim(), 'descrição do status na resposta da API')
            .to.eq(dadosOriginais.statusAtivoLabel);
        });
      });
      cy.get('@atualizacaoAtribuicaoCancelada.all').should('have.length', 0);
    });
  });

});
