describe('HU05 - Consulta e Geração de Relatório de Atribuições por Área', () => {

  beforeEach(() => {
    cy.login();
    cy.acessarAtribuicoesPorArea();
  });

  it('Cenário Adicional: Deve preservar os controles e o resumo analítico nas resoluções Desktop', () => {
    cy.viewport(1366, 768);
    cy.get('input[name="type"]').should('be.visible');
    cy.get('#search_area').should('be.visible');
    cy.get('input[value="Pesquisar"]').should('be.visible');
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '');

    const lerResumo = (table) => [...table.querySelectorAll('tr')]
      .map((row) => [...row.cells].map((cell) => cell.textContent.trim()));
    let resumoEsperado;
    cy.contains('th', 'Total de Atribuições').closest('table').then(($table) => {
      resumoEsperado = lerResumo($table[0]);
      const linhaTotal = resumoEsperado.find((linha) => linha[0] === 'Total de Atribuições');
      expect(linhaTotal, 'Linha do total da consulta de referência').to.exist;
      expect(linhaTotal[1], 'Total da consulta de referência').to.match(/^\d+$/);
      expect(Number(linhaTotal[1]), 'Consulta de referência com dados').to.be.greaterThan(0);
    });

    [[1366, 768], [1920, 1080]].forEach(([largura, altura]) => {
      cy.viewport(largura, altura);
      cy.window().its('innerWidth').should('eq', largura);
      cy.window().its('innerHeight').should('eq', altura);
      cy.get('input[name="type"]').should('be.visible');
      cy.get('#search_area').should('be.visible');
      cy.get('#search_subarea').should('be.visible');
      cy.get('input[value="Pesquisar"]').should('be.visible');
      cy.get('a[href*="assignments_by_area_pdf"]').should('be.visible');
      cy.contains('h1, h2, h3, h4, .card-header', 'Relatório Analítico - CTI').should('be.visible');
      cy.contains('th', 'Total de Atribuições').closest('table').should('be.visible').and(($table) => {
        expect(lerResumo($table[0]), `Resumo preservado em ${largura}x${altura}`).to.deep.eq(resumoEsperado);
      });
      cy.scrollTo('top');
      cy.screenshot(`hu05-analitico-${largura}x${altura}`, { capture: 'viewport' });
    });
  });

  it('Cenário 1: Deve informar a consulta sintética vazia e remover os resultados anteriores', () => {
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    const filtrosEsperados = { type: 'syntetic', subarea_name: '' };
    cy.get('#search_area').contains('option', /^OUVIDORIA$/).invoke('val').should('not.be.empty').then((id) => {
      filtrosEsperados.area_name = id;
    });

    cy.filtrarAtribuicoesPorArea('syntetic', 'OUVIDORIA', '').then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta vazia').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });

    cy.contains('Sem atribuições para: OUVIDORIA').should('be.visible');
    cy.get('table tbody tr').should('not.exist');
  });

  it('Cenário 2: Deve conferir o resumo analítico de CTI e os totais por Subárea', () => {
    const filtrosEsperados = { type: 'analytic', subarea_name: '' };
    cy.get('#search_area').contains('option', /^CTI$/).invoke('val').should('not.be.empty').then((id) => {
      filtrosEsperados.area_name = id;
    });
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '').then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta analítica').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });

    cy.url().should('include', '/portal_service/reports/assignments_by_area');
    cy.contains('h1, h2, h3, h4, .card-header', 'CTI').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    cy.contains('th', 'Total de Atribuições').closest('table').should(($table) => {
      const cabecalhos = [...$table[0].querySelectorAll('th')].map((cell) => cell.textContent.trim());
      expect(cabecalhos, 'Cabeçalhos do resumo').to.include.members(['Área/Subárea', 'Atribuições']);
      const linhas = [...$table[0].querySelectorAll('tr')];
      const grupos = linhas.filter((row) => row.querySelectorAll('td').length === 2);
      expect(grupos.length, 'Subáreas com dados').to.be.greaterThan(0);
      const soma = grupos.reduce((total, row) => {
        const quantidade = row.cells[1].textContent.trim();
        expect(quantidade, 'Quantidade da subárea').to.match(/^\d+$/);
        return total + Number(quantidade);
      }, 0);
      const linhaTotal = linhas.find((row) => row.cells[0]?.textContent.trim() === 'Total de Atribuições');
      expect(linhaTotal, 'Linha do total').to.exist;
      const total = linhaTotal.cells[1].textContent.trim();
      expect(total, 'Total exibido').to.match(/^\d+$/);
      expect(Number(total), 'Total igual à soma das subáreas').to.eq(soma);
    });
  });

  it('Cenário 3: Deve gerar o PDF analítico correspondente à consulta de CTI', () => {
    let areaEsperada;
    let totalEsperado;
    let subareasEsperadas;
    cy.get('#search_area').contains('option', /^CTI$/).invoke('val').should('not.be.empty').then((id) => {
      areaEsperada = id;
    });
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '');
    cy.contains('th', 'Total de Atribuições').closest('table').then(($table) => {
      const linhas = [...$table[0].querySelectorAll('tr')];
      const linhaTotal = linhas.find((row) => row.cells[0]?.textContent.trim() === 'Total de Atribuições');
      totalEsperado = Number(linhaTotal.cells[1].textContent.trim());
      expect(totalEsperado, 'Quantidade da consulta antes da exportação').to.be.greaterThan(0);
      subareasEsperadas = linhas.filter((row) => row.querySelectorAll('td').length === 2 && Number(row.cells[1].textContent.trim()) > 0)
        .map((row) => row.cells[0].textContent.trim());
      expect(subareasEsperadas.length, 'Subáreas da consulta').to.be.greaterThan(0);
    });

    cy.get('a[href*="assignments_by_area_pdf"]').should('have.length', 1).invoke('attr', 'href').then((href) => {
      const parametros = new URL(href, Cypress.config('baseUrl')).searchParams;
      expect(parametros.get('type'), 'Tipo da exportação').to.eq('analytic');
      expect(parametros.get('area'), 'Área da exportação').to.eq(areaEsperada);
      expect(parametros.get('subarea'), 'Subárea da exportação').to.eq('');
      const inicioGeracao = new Date();
      cy.request({ url: href, encoding: 'binary', failOnStatusCode: false, timeout: 120000, log: false }).then((response) => {
        expect(response.status, 'Resposta do PDF analítico').to.eq(200);
        expect(response.headers['content-type'], 'Tipo de conteúdo do PDF').to.include('application/pdf');
        expect(response.body.slice(0, 5), 'Assinatura do arquivo').to.eq('%PDF-');
        const formatarData = new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo'
        });
        const datasEsperadas = [inicioGeracao, new Date()].map((data) => formatarData.format(data));
        const arquivo = `${Cypress.config('downloadsFolder')}/hu05-atribuicoes-cti.pdf`;
        cy.writeFile(arquivo, response.body, 'binary', { log: false });
        cy.task('lerPdf', arquivo, { log: false }).then((texto) => {
          expect(typeof texto, 'Texto extraído do PDF').to.eq('string');
          const normalizar = (valor) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').toUpperCase();
          const conteudo = normalizar(texto);
          expect(conteudo.includes('RELATORIODEATRIBUICOES'), 'Título do relatório').to.eq(true);
          expect(datasEsperadas.some((data) => conteudo.includes(normalizar(`Gerado em: ${data}`))), 'Data da geração em Brasília').to.eq(true);
          subareasEsperadas.forEach((subarea) => {
            expect(conteudo.includes(normalizar(`CTI / ${subarea}`)), `Agrupamento CTI / ${subarea}`).to.eq(true);
          });
          expect((texto.match(/Colaborador\s*:/g) || []).length, 'Quantidade de atribuições exportadas').to.eq(totalEsperado);
        });
      });
    });
  });

  // BUG 10: o diagnóstico do PDF sintético retornou HTTP 200 e 2 bytes sem assinatura PDF.
  // Reteste da correção pendente; conteúdo e gráficos sintéticos também precisam de validação.
  it.skip('Cenário 6: Reteste da assinatura do PDF sintético — BUG 10', () => {
    cy.filtrarAtribuicoesPorArea('syntetic', 'CTI', '');
    cy.get('a[href*="assignments_by_area_pdf"]').invoke('attr', 'href').then((href) => {
      cy.request({ url: href, encoding: 'binary', failOnStatusCode: false, timeout: 120000, log: false }).then((response) => {
        expect(response.status, 'Resposta do PDF sintético').to.eq(200);
        expect(response.headers['content-type'], 'Tipo de conteúdo do PDF').to.include('application/pdf');
        expect(response.body.slice(0, 5), 'Assinatura do PDF sintético').to.eq('%PDF-');
      });
    });
  });

  it('Cenário 4: Deve impedir a pesquisa sem selecionar o Tipo obrigatório', () => {
    cy.get('input[name="type"]').each(($tipo) => {
      cy.wrap($tipo).should('not.be.checked');
    });

    cy.get('#type_syntetic').should('have.prop', 'required', true).then(($tipo) => {
      $tipo[0].addEventListener('invalid', cy.stub().as('tipoObrigatorio'), { once: true });
    });
    cy.intercept('POST', '**/portal_service/reports/assignments_by_area').as('consultaSemTipo');

    cy.get('input[value="Pesquisar"]').click();

    cy.get('@tipoObrigatorio').should('have.been.calledOnce');
    cy.get('#type_syntetic').should(($tipo) => {
      expect($tipo[0].validity.valueMissing, 'Tipo obrigatório ausente').to.eq(true);
      expect($tipo[0].validity.valid, 'Tipo inválido').to.eq(false);
      expect($tipo[0].validationMessage, 'Mensagem nativa de Tipo obrigatório').not.to.be.empty;
    });
    cy.get('@consultaSemTipo.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/portal_service/reports/assignments_by_area');
    cy.get('table tbody tr').should('not.exist');
  });

  it('Cenário 5: Deve consultar o resumo sintético e conferir as quantidades por modalidade', () => {
    const filtrosEsperados = { type: 'syntetic', subarea_name: '' };
    cy.get('#search_area').contains('option', /^CTI$/).invoke('val').should('not.be.empty').then((id) => {
      filtrosEsperados.area_name = id;
    });
    cy.filtrarAtribuicoesPorArea('syntetic', 'CTI', '').then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta sintética').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });

    cy.contains('h1, h2, h3, h4, .card-header', 'Relatório Sintético - CTI').should('be.visible');
    cy.contains('Total de Atribuições:').invoke('text').then((texto) => {
      const total = texto.match(/Total de Atribuições:\s*(\d+)/);
      expect(total, 'Total do relatório sintético').not.to.be.null;
      const quantidadeTotal = Number(total[1]);
      expect(quantidadeTotal, 'Consulta sintética com dados').to.be.greaterThan(0);
      cy.contains('td', /^Presencial$/).closest('table').should(($table) => {
        const linhas = [...$table[0].querySelectorAll('tr')].filter((row) => row.cells.length === 2);
        expect(linhas.map((row) => row.cells[0].textContent.trim()), 'Modalidades').to.include.members(['Presencial', 'Home Office']);
        const soma = linhas.reduce((resultado, row) => {
          const quantidade = row.cells[1].textContent.trim();
          expect(quantidade, 'Quantidade por modalidade').to.match(/^\d+$/);
          return resultado + Number(quantidade);
        }, 0);
        expect(soma, 'Modalidades somam o total do relatório').to.eq(quantidadeTotal);
      });
    });
  });

  it('Cenário 7: Deve respeitar o recorte de Subárea na consulta e no PDF analítico', () => {
    let areaId;
    let subarea;
    let subareaId;
    let quantidadeEsperada;
    let outrasSubareas;
    cy.get('#search_area').contains('option', /^CTI$/).invoke('val').should('not.be.empty').then((id) => {
      areaId = id;
    });
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '');
    cy.contains('th', 'Total de Atribuições').closest('table').then(($table) => {
      const grupos = [...$table[0].querySelectorAll('tr')]
        .filter((row) => row.querySelectorAll('td').length === 2)
        .map((row) => {
          const quantidade = row.cells[1].textContent.trim();
          expect(quantidade, 'Quantidade da subárea de referência').to.match(/^\d+$/);
          return { nome: row.cells[0].textContent.trim(), quantidade: Number(quantidade) };
        })
        .filter((grupo) => grupo.quantidade > 0);
      expect(grupos.length, 'Subáreas distintas para conferir a exclusão').to.be.greaterThan(1);
      subarea = grupos[0].nome;
      quantidadeEsperada = grupos[0].quantidade;
      outrasSubareas = grupos.slice(1).map((grupo) => grupo.nome);
    });
    cy.get('#search_subarea option').then(($options) => {
      const opcao = [...$options].find((option) => option.textContent.trim() === subarea);
      expect(Boolean(opcao), 'Subárea do resumo disponível no filtro').to.eq(true);
      subareaId = opcao.value;
      expect(subareaId, 'ID da Subárea escolhida').not.to.be.empty;
    });

    cy.then(() => cy.filtrarAtribuicoesPorArea('analytic', 'CTI', subarea)).then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      const filtrosEsperados = { type: 'analytic', area_name: areaId, subarea_name: subareaId };
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta por Subárea').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });
    cy.contains('th', 'Total de Atribuições').closest('table').should(($table) => {
      const linhas = [...$table[0].querySelectorAll('tr')];
      const grupos = linhas.filter((row) => row.querySelectorAll('td').length === 2);
      expect(grupos.map((row) => row.cells[0].textContent.trim()), 'Somente a Subárea escolhida no resumo').to.deep.eq([subarea]);
      const quantidade = grupos[0].cells[1].textContent.trim();
      expect(quantidade, 'Quantidade da Subárea filtrada').to.match(/^\d+$/);
      expect(Number(quantidade), 'Quantidade preservada no recorte').to.eq(quantidadeEsperada);
      const linhaTotal = linhas.find((row) => row.cells[0]?.textContent.trim() === 'Total de Atribuições');
      expect(linhaTotal, 'Linha do total').to.exist;
      const total = linhaTotal.cells[1].textContent.trim();
      expect(total, 'Total do recorte').to.match(/^\d+$/);
      expect(Number(total), 'Total igual à Subárea escolhida').to.eq(quantidadeEsperada);
    });

    cy.get('a[href*="assignments_by_area_pdf"]').should('have.length', 1).invoke('attr', 'href').then((href) => {
      const parametros = new URL(href, Cypress.config('baseUrl')).searchParams;
      expect(parametros.get('type'), 'Tipo da exportação').to.eq('analytic');
      expect(parametros.get('area'), 'Área da exportação').to.eq(areaId);
      expect(parametros.get('subarea'), 'Subárea da exportação').to.eq(subareaId);
      cy.request({ url: href, encoding: 'binary', failOnStatusCode: false, timeout: 120000, log: false }).then((response) => {
        expect(response.status, 'Resposta do PDF por Subárea').to.eq(200);
        expect(response.headers['content-type'], 'Tipo de conteúdo do PDF').to.include('application/pdf');
        expect(response.body.slice(0, 5), 'Assinatura do arquivo').to.eq('%PDF-');
        const arquivo = `${Cypress.config('downloadsFolder')}/hu05-atribuicoes-cti-subarea.pdf`;
        cy.writeFile(arquivo, response.body, 'binary', { log: false });
        cy.task('lerPdf', arquivo, { log: false }).then((texto) => {
          expect(typeof texto, 'Texto extraído do PDF').to.eq('string');
          const normalizar = (valor) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').toUpperCase();
          const conteudo = normalizar(texto);
          expect(conteudo.includes(normalizar(`CTI / ${subarea}`)), 'Agrupamento escolhido no PDF').to.eq(true);
          outrasSubareas.forEach((outra) => {
            expect(conteudo.includes(normalizar(`CTI / ${outra}`)), `Agrupamento excluído do PDF: ${outra}`).to.eq(false);
          });
          expect((texto.match(/Colaborador\s*:/g) || []).length, 'Quantidade de atribuições exportadas no recorte').to.eq(quantidadeEsperada);
        });
      });
    });
  });

  it('Cenário 8: Deve informar a consulta analítica vazia e remover os resultados anteriores', () => {
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    const filtrosEsperados = { type: 'analytic', subarea_name: '' };
    cy.get('#search_area').contains('option', /^OUVIDORIA$/).invoke('val').should('not.be.empty').then((id) => {
      filtrosEsperados.area_name = id;
    });
    cy.filtrarAtribuicoesPorArea('analytic', 'OUVIDORIA', '').then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta analítica vazia').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });

    cy.contains('Sem atribuições para: OUVIDORIA').should('be.visible');
    cy.get('table tbody tr').should('not.exist');
  });

  it('Cenário 9: Deve consultar o resumo sintético sem Área e Subárea', () => {
    cy.get('#search_area').should('have.prop', 'required', false).and('have.value', '');
    cy.get('#search_subarea').should('have.prop', 'required', false).and('have.value', '');
    cy.filtrarAtribuicoesPorArea('syntetic', '', '').then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      const filtrosEsperados = { type: 'syntetic', area_name: '', subarea_name: '' };
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta sem Área e Subárea').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });

    cy.contains('h1, h2, h3, h4, .card-header', 'Relatório Sintético').should('be.visible');
    cy.contains('Total de Atribuições:').invoke('text').then((texto) => {
      const total = texto.match(/Total de Atribuições:\s*(\d+)/);
      expect(total, 'Total do relatório sem filtros opcionais').not.to.be.null;
      const quantidadeTotal = Number(total[1]);
      expect(quantidadeTotal, 'Consulta sem filtros opcionais com dados').to.be.greaterThan(0);
      cy.contains('td', /^Presencial$/).closest('table').should(($table) => {
        const linhas = [...$table[0].querySelectorAll('tr')].filter((row) => row.cells.length === 2);
        expect(linhas.map((row) => row.cells[0].textContent.trim()), 'Modalidades').to.include.members(['Presencial', 'Home Office']);
        const soma = linhas.reduce((resultado, row) => {
          const quantidade = row.cells[1].textContent.trim();
          expect(quantidade, 'Quantidade por modalidade').to.match(/^\d+$/);
          return resultado + Number(quantidade);
        }, 0);
        expect(soma, 'Modalidades somam o total sem filtros opcionais').to.eq(quantidadeTotal);
      });
    });
  });

  it('Cenário 10: Deve consultar o resumo sintético por Área e Subárea', () => {
    let areaId;
    let subarea;
    let subareaId;
    let quantidadeEsperada;
    cy.get('#search_area').contains('option', /^CTI$/).invoke('val').should('not.be.empty').then((id) => {
      areaId = id;
    });
    cy.filtrarAtribuicoesPorArea('analytic', 'CTI', '');
    cy.contains('th', 'Total de Atribuições').closest('table').then(($table) => {
      const grupos = [...$table[0].querySelectorAll('tr')]
        .filter((row) => row.querySelectorAll('td').length === 2)
        .map((row) => {
          const quantidade = row.cells[1].textContent.trim();
          expect(quantidade, 'Quantidade da subárea de referência').to.match(/^\d+$/);
          return { nome: row.cells[0].textContent.trim(), quantidade: Number(quantidade) };
        })
        .filter((grupo) => grupo.quantidade > 0);
      expect(grupos.length, 'Subáreas distintas na consulta de referência').to.be.greaterThan(1);
      subarea = grupos[0].nome;
      quantidadeEsperada = grupos[0].quantidade;
      expect(grupos.reduce((soma, grupo) => soma + grupo.quantidade, 0), 'Área com mais dados que a Subárea escolhida').to.be.greaterThan(quantidadeEsperada);
    });
    cy.get('#search_subarea option').then(($options) => {
      const opcao = [...$options].find((option) => option.textContent.trim() === subarea);
      expect(Boolean(opcao), 'Subárea do resumo disponível no filtro').to.eq(true);
      subareaId = opcao.value;
      expect(subareaId, 'ID da Subárea escolhida').not.to.be.empty;
    });

    cy.then(() => cy.filtrarAtribuicoesPorArea('syntetic', 'CTI', subarea)).then(({ request, response }) => {
      expect(request.headers['content-type'], 'Formato do formulário').to.include('multipart/form-data');
      const filtrosEsperados = { type: 'syntetic', area_name: areaId, subarea_name: subareaId };
      Object.entries(filtrosEsperados).forEach(([nome, esperado]) => {
        const campo = request.body.match(new RegExp('name="' + nome + '"\\r?\\n\\r?\\n([^\\r\\n]*)'));
        expect(campo?.[1] ?? null, `Filtro enviado: ${nome}`).to.eq(esperado);
      });
      expect(response.statusCode, 'Resposta da consulta sintética por Subárea').to.eq(200);
      expect(response.headers['content-type'], 'Conteúdo da consulta').to.include('text/html');
    });
    cy.contains('h1, h2, h3, h4, .card-header', 'Relatório Sintético').should('be.visible');
    cy.contains('Total de Atribuições:').invoke('text').then((texto) => {
      const total = texto.match(/Total de Atribuições:\s*(\d+)/);
      expect(total, 'Total sintético por Subárea').not.to.be.null;
      const quantidadeTotal = Number(total[1]);
      expect(quantidadeTotal, 'Total sintético igual à Subárea da consulta analítica').to.eq(quantidadeEsperada);
      cy.contains('td', /^Presencial$/).closest('table').should(($table) => {
        const linhas = [...$table[0].querySelectorAll('tr')].filter((row) => row.cells.length === 2);
        expect(linhas.map((row) => row.cells[0].textContent.trim()), 'Modalidades').to.include.members(['Presencial', 'Home Office']);
        const soma = linhas.reduce((resultado, row) => {
          const quantidade = row.cells[1].textContent.trim();
          expect(quantidade, 'Quantidade por modalidade').to.match(/^\d+$/);
          return resultado + Number(quantidade);
        }, 0);
        expect(soma, 'Modalidades somam o total da Subárea').to.eq(quantidadeTotal);
      });
    });
  });

});
