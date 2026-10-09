const { defineConfig } = require("cypress");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://testeqa.pge.ce.gov.br',

    numTestsKeptInMemory: 0,
    pageLoadTimeout: 120000,
    blockHosts: [
      "*.google-analytics.com",
      "*.fonts.googleapis.com",
      "*.googletagmanager.com"
    ],
    setupNodeEvents(on, config) {
      on('task', {
        async lerPdf(caminhoPdf) {
          const parser = new PDFParse({ data: fs.readFileSync(caminhoPdf) });
          try {
            const { text } = await parser.getText();
            return text;
          } finally {
            await parser.destroy();
          }
        }
      });

      return config;
    },
  },
});