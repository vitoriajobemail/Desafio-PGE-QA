describe('HU04 - Consulta e Geração de Relatório de Movimentação de Ativos', () => {


  beforeEach(() => {
    cy.login();
    
    cy.visit('/portal_service/reports/index');
    
    cy.contains('button', 'Gerar Relatório', { timeout: 15000 }).should('be.visible');
  });

  it('Cenário Adicional: Deve manter os elementos críticos visíveis em resolução Desktop HD', () => {
    cy.viewport(1366, 768);
    cy.get('#area_name').should('be.visible');
    cy.get('input[value="Pesquisar"]').should('be.visible');
  });

  it('Cenário 1: Deve informar quando não existirem movimentações no período selecionado', () => {
    cy.filtrarMovimentacaoAtivos('CTI', '2024-01-01', '2026-12-31')
      .its('response.statusCode').should('eq', 200);
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    cy.filtrarMovimentacaoAtivos('PRODAT', '2050-10-10', '2050-12-12')
      .its('response.statusCode').should('eq', 200);

    cy.contains('Sem movimentações para: PRODAT').should('be.visible');
    cy.get('table tbody tr').should('not.exist');
  });

  it('Cenário 2: Deve listar resultados agrupados por área e exibir detalhes do ativo', () => {
    const filtrosEsperados = {
      area_name: 'CTI',
      initial_date: '2024-01-01',
      final_date: '2026-12-31'
    };
    cy.filtrarMovimentacaoAtivos(
      filtrosEsperados.area_name, filtrosEsperados.initial_date, filtrosEsperados.final_date
    ).then(({ request, response }) => {
      expect(response.statusCode, 'retorno da pesquisa').to.eq(200);
      Object.entries(filtrosEsperados).forEach(([campo, valorEsperado]) => {
        const valorEnviado = typeof request.body === 'string'
          ? request.body.match(new RegExp(`name="${campo}"\\r?\\n\\r?\\n([^\\r\\n]*)`))?.[1]
            ?? new URLSearchParams(request.body).get(campo)
          : request.body[campo];
        expect(valorEnviado, `filtro enviado: ${campo}`).to.eq(valorEsperado);
      });
    });

    cy.url().should('include', '/portal_service/reports/moves_today');

    const cabecalhosEsperados = ['Tombo', 'Nº de Série', 'Descrição', 'Lotação Anterior', 'Lotação Atual', 'Colaborador'];
    cabecalhosEsperados.forEach(cabecalho => {
      cy.get('table th').contains(cabecalho).should('be.visible');
    });

    cy.contains('h1, h2, h3, h4, .card-header', 'CTI').should('be.visible'); 
    
    cy.contains(/\d{1,2} de [A-Za-z]+ de 202\d - \d+ movimentaç/i).should('be.visible');

    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    cy.get('table').filter(':has(tbody tr)')
      .should('have.length.greaterThan', 0)
      .each(($tabela) => {
        const cabecalho = $tabela.find('thead tr').first().text().trim();
        const grupo = cabecalho.match(/^(\d{1,2}) de ([A-Za-zÀ-ÿ]+) de (\d{4}) - (\d+) movimentaç/i);
        expect(grupo, 'data e quantidade do grupo').not.to.be.null;
        expect($tabela.find('tbody tr'), `linhas do grupo: ${cabecalho}`)
          .to.have.length(Number(grupo[4]));

        const meses = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        const mes = meses.indexOf(grupo[2].toLowerCase());
        expect(mes, `mês do grupo: ${cabecalho}`).to.be.at.least(0);
        const data = new Date(Date.UTC(Number(grupo[3]), mes, Number(grupo[1])));
        expect(data.getUTCFullYear(), 'ano válido do grupo').to.eq(Number(grupo[3]));
        expect(data.getUTCMonth(), 'mês válido do grupo').to.eq(mes);
        expect(data.getUTCDate(), 'dia válido do grupo').to.eq(Number(grupo[1]));
        const dataISO = data.toISOString().slice(0, 10);
        expect(
          dataISO >= filtrosEsperados.initial_date && dataISO <= filtrosEsperados.final_date,
          `data do grupo no período pesquisado: ${dataISO}`
        ).to.be.true;
      });
  });

  it('Cenário 3: Deve retornar PDFs válidos com os filtros e os dados da consulta', () => {
    const execucao = Date.now();
    const pasta = Cypress.config('downloadsFolder');
    let ativoId;
    const tombo = `TB-HU04-PDF-${execucao}`;

    cy.fixture('ativo').then((massa) => cy.cadastrarAtivoViaApi({
      ...massa.desktopPadrao, tombo, numeroSerie: `SN-HU04-PDF-${execucao}`
    }).then(({ urlEdicao }) => {
      expect(urlEdicao, 'edição do ativo próprio para o PDF').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
      ativoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
      return cy.writeFile(`${pasta}/massa-hu04-pdf-${execucao}.json`, { ativoId, tombo }, { log: false });
    }));
    cy.fixture('atribuicao').then((massa) => cy.cadastrarAtribuicaoViaApi({
      ...massa.obrigatorios, soLabel: massa.completo.soLabel, ativoId
    }));
    cy.then(() => cy.request({
      url: '/portal_service/bonds', qs: { 'q[bond_asset_asset_id_eq]': ativoId }
    }).then(({ status, body }) => {
      expect(status, 'consulta da atribuição própria para o PDF').to.eq(200);
      const linhas = Cypress.$(body).find('table tbody tr');
      expect(linhas.length, 'atribuição vinculada ao ativo do PDF').to.eq(1);
      const urlEdicao = linhas.find('a[href$="/edit"]').attr('href');
      expect(urlEdicao, 'edição da atribuição do PDF').to.match(/^\/portal_service\/bonds\/\d+\/edit$/);
      const atribuicaoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
      return cy.writeFile(`${pasta}/massa-hu04-pdf-${execucao}.json`, { ativoId, atribuicaoId, tombo }, { log: false });
    }));

    const consultas = [
      { area_name: 'CTI', initial_date: new Date(execucao).toISOString().slice(0, 10),
        final_date: new Date(execucao + 86400000).toISOString().slice(0, 10) },
      { area_name: 'PRODAT', initial_date: '2050-10-10', final_date: '2050-12-12' }
    ];
    consultas.forEach((filtros, indice) => {
      cy.visit('/portal_service/reports/index');
      cy.filtrarMovimentacaoAtivos(filtros.area_name, filtros.initial_date, filtros.final_date)
        .its('response.statusCode').should('eq', 200);
      cy.get('body').should(($pagina) => {
        const linhas = $pagina.find('table tbody tr').toArray();
        if (indice === 0) {
          expect(linhas.filter((linha) => Cypress.$(linha).find('td').first().text().trim() === tombo).length,
            'movimentação própria na consulta do PDF').to.eq(1);
        } else {
          expect(linhas.length, 'consulta vazia para o segundo PDF').to.eq(0);
          expect($pagina.text(), 'mensagem da consulta vazia').to.include('Sem movimentações para: PRODAT');
        }
      }).then(($pagina) => {
        const linhas = $pagina.find('table tbody tr').toArray().map((linha) => {
          const campos = [...linha.querySelectorAll('td')].map((celula) => celula.textContent.trim());
          expect(campos.length, 'campos da movimentação na tela').to.eq(6);
          return campos;
        });
        const grupos = $pagina.find('table').toArray().filter((tabela) => tabela.querySelectorAll('tbody tr').length > 0)
          .map((tabela) => Cypress.$(tabela).find('thead tr').first().text().trim());
        const links = $pagina.find('a[href*="/portal_service/reports/pdf_create"]');
        expect(links.length, 'link de geração do PDF').to.eq(1);
        const href = links.attr('href');
        const url = new URL(href, Cypress.config('baseUrl'));
        expect(url.origin, 'origem do gerador').to.eq(new URL(Cypress.config('baseUrl')).origin);
        expect(url.pathname, 'rota do gerador').to.eq('/portal_service/reports/pdf_create');
        Object.entries(filtros).forEach(([campo, esperado]) => {
          expect(url.searchParams.get(campo), `filtro enviado ao gerador: ${campo}`).to.eq(esperado);
        });
        const arquivoPdf = `${pasta}/hu04-${execucao}-${indice}.pdf`;
        cy.writeFile(`${pasta}/consulta-hu04-pdf-${execucao}-${indice}.json`, { filtros, linhas, grupos }, { log: false });
        return cy.request({ url: href, encoding: 'binary', failOnStatusCode: false, timeout: 90000, log: false })
          .then(({ status, headers, body }) => {
            expect(status, 'retorno do gerador PDF').to.eq(200);
            expect(headers['content-type'], 'tipo do documento retornado').to.match(/^application\/pdf(?:;|$)/i);
            expect(body.slice(0, 5), 'assinatura do documento').to.eq('%PDF-');
            expect(Cypress.Buffer.from(body, 'binary').length, 'tamanho do documento').to.be.greaterThan(5);
            cy.writeFile(arquivoPdf, body, 'binary', { log: false });
            cy.task('lerPdf', arquivoPdf, { log: false }).then((texto) => {
              const compactar = (valor) => valor.replace(/\s+/g, '');
              const dataInicio = filtros.initial_date.split('-').reverse().join('/');
              const dataFim = filtros.final_date.split('-').reverse().join('/');
              expect(compactar(texto), 'área, período e total da consulta no PDF').to.include(compactar(
                `${linhas.length} Movimentações de Ativos para ${filtros.area_name} no período: ${dataInicio} à ${dataFim}`
              ));
              grupos.forEach((grupo) => {
                const dadosGrupo = grupo.match(/^(.+?)\s*-\s*(\d+)\s+movimentaç/i);
                expect(dadosGrupo, 'data e quantidade do grupo na tela').not.to.be.null;
                expect(compactar(texto), `grupo da tela no PDF: ${grupo}`)
                  .to.include(compactar(`${dadosGrupo[1]} - ${dadosGrupo[2]} movimentaç`));
              });
              const cabecalhos = /Tombo\s+Nº_de_Série\s+Descrição\s+Lotação_Atual\s+Lotação_Anterior\s+Colaborador/g;
              const primeiroCabecalho = cabecalhos.exec(texto);
              if (linhas.length === 0) {
                expect(primeiroCabecalho, 'ausência de tabela de movimentações no PDF vazio').to.be.null;
              } else {
                expect(primeiroCabecalho, 'seis colunas do PDF').not.to.be.null;
                const dadosPdf = texto.slice(primeiroCabecalho.index + primeiroCabecalho[0].length)
                  .replace(cabecalhos, '')
                  .replace(/--\s*\d+\s+of\s+\d+\s*--/g, '')
                  .replace(/\d{1,2}\s+de\s+[A-Za-zÀ-ÿ]+\s+de\s+\d{4}\s*-\s*\d+\s+movimentaç[õô]es/gi, '');
                const dadosTela = linhas.map((campos) => [
                  campos[0], campos[1], campos[2], campos[4], campos[3], campos[5]
                ].join(' ')).join(' ');
                expect(compactar(dadosPdf) === compactar(dadosTela),
                  'todos os registros e seus seis campos, sem itens extras no PDF').to.be.true;
              }
            });
          });
      });
    });
  });

  it('Cenário 4: Deve impedir a geração de relatório sem filtros e exibir alerta', () => {
    cy.contains('button, a', 'Gerar Relatório').click({ force: true });

    cy.contains('Informe uma Área e/ou Período para gerar o pdf!').should('be.visible');
  });

  it('Cenário 5: Deve respeitar os filtros e exibir os seis campos de uma movimentação própria', () => {
    const execucao = Date.now();
    const arquivoMassa = `${Cypress.config('downloadsFolder')}/massa-hu04-${execucao}.json`;
    let dadosAtivo;
    let dadosAtribuicao;
    let ativoId;
    let atribuicaoId;
    let colaboradorId;
    let nomeColaborador;

    cy.fixture('ativo').then((massa) => {
      dadosAtivo = {
        ...massa.desktopPadrao,
        tombo: `TB-HU04-${execucao}`,
        numeroSerie: `SN-HU04-${execucao}`
      };
      return cy.cadastrarAtivoViaApi(dadosAtivo).then(({ urlEdicao }) => {
        expect(urlEdicao, 'edição do ativo próprio').to.match(/^\/portal_service\/listing_assets\/\d+\/edit$/);
        ativoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
        return cy.writeFile(arquivoMassa, { ativoId, tombo: dadosAtivo.tombo }, { log: false });
      });
    });

    cy.then(() => cy.request({
      url: '/portal_service/listing_assets',
      qs: { 'q[asset_i_cont_all]': dadosAtivo.tombo }
    }).then(({ status, body }) => {
      expect(status, 'consulta do ativo próprio').to.eq(200);
      const linhas = Cypress.$(body).find('table tbody tr');
      expect(linhas.length, 'ativo próprio persistido').to.eq(1);
      const celulas = linhas.first().find('td');
      expect(celulas.eq(0).text().trim(), 'tombo persistido').to.eq(dadosAtivo.tombo);
      expect(celulas.eq(1).text().trim(), 'descrição persistida')
        .to.eq(`${dadosAtivo.tipo} ${dadosAtivo.marca} ${dadosAtivo.modelo}`);
      expect(celulas.eq(2).text().trim(), 'série persistida').to.eq(dadosAtivo.numeroSerie);
    }));

    cy.then(() => cy.request({
      url: '/portal_service/deposits',
      qs: { 'q[asset_id_eq]': ativoId }
    }).then(({ status, body }) => {
      expect(status, 'consulta da origem do ativo').to.eq(200);
      const linhas = Cypress.$(body).find('table tbody tr');
      expect(linhas.length, 'ativo próprio no Depósito CTI antes da atribuição').to.eq(1);
      expect(linhas.first().find('td').eq(1).text().trim(), 'tombo no depósito').to.eq(dadosAtivo.tombo);
      expect(linhas.first().find('td').eq(3).text().trim(), 'status inicial no depósito').to.eq('DISPONÍVEL');
    }));

    cy.fixture('atribuicao').then((massa) => {
      dadosAtribuicao = { ...massa.obrigatorios, soLabel: massa.completo.soLabel, ativoId };
      return cy.request('/portal_service/bonds/new').then(({ status, body }) => {
        expect(status, 'consulta do colaborador para o preparo').to.eq(200);
        const colaborador = Cypress.$(body).find('#collaborators option').filter((_, opcao) =>
          opcao.text.includes(dadosAtribuicao.atendidoPor)
        ).first();
        colaboradorId = colaborador.val();
        nomeColaborador = colaborador.text().trim();
        expect(colaboradorId, 'ID do colaborador do preparo').to.match(/^\d+$/);
        expect(nomeColaborador, 'nome do colaborador do preparo').not.to.eq('');
        return cy.cadastrarAtribuicaoViaApi({ ...dadosAtribuicao, colaboradorId })
          .then(({ colaboradorId: idEnviado }) => {
            expect(idEnviado, 'colaborador enviado no cadastro').to.eq(colaboradorId);
          });
      });
    });

    cy.then(() => cy.request({
      url: '/portal_service/bonds',
      qs: { 'q[bond_asset_asset_id_eq]': ativoId }
    }).then(({ status, body }) => {
      expect(status, 'consulta da atribuição própria').to.eq(200);
      const linhas = Cypress.$(body).find('table tbody tr');
      expect(linhas.length, 'atribuição vinculada ao ativo próprio').to.eq(1);
      const urlEdicao = linhas.find('a[href$="/edit"]').attr('href');
      expect(urlEdicao, 'edição da atribuição própria').to.match(/^\/portal_service\/bonds\/\d+\/edit$/);
      atribuicaoId = urlEdicao.match(/\/(\d+)\/edit$/)[1];
      return cy.request(urlEdicao).then(({ status, body }) => {
        expect(status, 'consulta dos dados persistidos da atribuição').to.eq(200);
        const formulario = Cypress.$(body);
        const ativos = formulario.find('select[name*="[asset_id]"]')
          .filter((_, campo) => campo.value !== '');
        expect(ativos.length, 'quantidade de ativos da atribuição').to.eq(1);
        expect(ativos.first().val(), 'ativo persistido').to.eq(ativoId);
        expect(formulario.find('#set_area option:selected').text().trim(), 'área persistida').to.eq(dadosAtribuicao.area);
        expect(formulario.find('#resp_subarea option:selected').text().trim(), 'subárea persistida').to.eq(dadosAtribuicao.subarea);
        expect(formulario.find('#collaborators').val(), 'colaborador persistido').to.eq(colaboradorId);
        return cy.writeFile(arquivoMassa, {
          ativoId, atribuicaoId, tombo: dadosAtivo.tombo, numeroSerie: dadosAtivo.numeroSerie,
          area: dadosAtribuicao.area, subarea: dadosAtribuicao.subarea, colaboradorId
        }, { log: false });
      });
    }));

    cy.then(() => {
      const agora = Date.now();
      const dataInicio = new Date(agora - 86400000).toISOString().slice(0, 10);
      const dataFim = new Date(agora + 86400000).toISOString().slice(0, 10);
      cy.visit('/portal_service/reports/index');
      cy.filtrarMovimentacaoAtivos(dadosAtribuicao.area, dataInicio, dataFim)
        .its('response.statusCode').should('eq', 200);
      cy.get('table tbody tr').should(($linhas) => {
        const linhas = $linhas.toArray().filter((linha) =>
          Cypress.$(linha).find('td').first().text().trim() === dadosAtivo.tombo
        );
        expect(linhas.length, 'movimentação do ativo próprio').to.eq(1);
        const valores = [...linhas[0].querySelectorAll('td')].map((celula) => celula.textContent.trim());
        expect(valores, 'seis campos da movimentação própria').to.deep.eq([
          dadosAtivo.tombo,
          dadosAtivo.numeroSerie,
          `${dadosAtivo.tipo} ${dadosAtivo.marca} ${dadosAtivo.modelo}`,
          'CTI / DEPOSITO SERVICE DESK',
          `${dadosAtribuicao.area} / ${dadosAtribuicao.subarea}`,
          nomeColaborador
        ]);
      });

      const consultasForaDoRecorte = [
        { area_name: 'PRODAT', initial_date: dataInicio, final_date: dataFim },
        { area_name: dadosAtribuicao.area, initial_date: '2050-10-10', final_date: '2050-12-12' }
      ];
      consultasForaDoRecorte.forEach((filtros) => {
        cy.visit('/portal_service/reports/index');
        cy.filtrarMovimentacaoAtivos(filtros.area_name, filtros.initial_date, filtros.final_date)
          .then(({ request, response }) => {
          expect(response.statusCode, 'retorno da consulta fora do recorte').to.eq(200);
          Object.entries(filtros).forEach(([campo, esperado]) => {
            const enviado = typeof request.body === 'string'
              ? request.body.match(new RegExp(`name="${campo}"\\r?\\n\\r?\\n([^\\r\\n]*)`))?.[1]
                ?? new URLSearchParams(request.body).get(campo)
              : request.body[campo];
            expect(enviado, `filtro enviado na consulta fora do recorte: ${campo}`).to.eq(esperado);
          });
        });
        cy.get('body').should(($pagina) => {
          const tombos = $pagina.find('table tbody tr').toArray().map((linha) =>
            Cypress.$(linha).find('td').first().text().trim()
          );
          expect(tombos, `ativo próprio fora de ${filtros.area_name}: ${filtros.initial_date} a ${filtros.final_date}`)
            .not.to.include(dadosAtivo.tombo);
        });
      });
    });
  });

  it('Cenário 6: Deve oferecer no relatório as áreas disponíveis no cadastro de atribuições', () => {
    cy.request('/portal_service/bonds/new').then(({ status, body }) => {
      expect(status, 'consulta da referência de áreas').to.eq(200);
      const areasReferencia = Cypress.$(body).find('#set_area option').toArray()
        .filter((opcao) => opcao.value !== '')
        .map((opcao) => opcao.textContent.trim()).sort();
      expect(areasReferencia.length, 'áreas disponíveis na referência').to.be.greaterThan(0);

      cy.get('#area_name option').should(($opcoes) => {
        const areas = $opcoes.toArray().filter((opcao) => opcao.value !== '');
        const nomes = areas.map((opcao) => opcao.textContent.trim()).sort();
        expect(nomes, 'nomes e quantidades de opções de área no relatório').to.deep.eq(areasReferencia);
        areas.forEach((opcao) => {
          expect(opcao.value, `valor enviado para a área ${opcao.textContent.trim()}`)
            .to.eq(opcao.textContent.trim());
          expect(opcao.disabled, `área disponível para seleção: ${opcao.textContent.trim()}`).to.be.false;
        });
      });
    });
  });

});
