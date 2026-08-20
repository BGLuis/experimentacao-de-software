const fs = require('fs');
const Papa = require('./dashboard/node_modules/papaparse');
const data = fs.readFileSync('data/repositorios_populares.csv', 'utf8');
const parsed = Papa.parse(data, {header: true, dynamicTyping: true}).data.filter(d => d && d.repositorio);

let totalAi = 0;
const aiByYear = {};
const aiMarkdownRecent = [];
const aiLangs = {};

parsed.forEach(d => {
  const isAi = d.tags && String(d.tags).toLowerCase().match(/ai|ml|llm|gpt|machine learning|artificial intelligence/);
  
  if (isAi) {
    totalAi++;
    
    if (d.criado_em) {
      const year = String(d.criado_em).substring(0, 4);
      if (year && !isNaN(Number(year))) {
        aiByYear[year] = (aiByYear[year] || 0) + 1;
        
        if (Number(year) >= 2023 && d.linguagens && String(d.linguagens).toLowerCase().includes('markdown')) {
          aiMarkdownRecent.push(d);
        }

        if (Number(year) >= 2024) {
           const primaryLang = d.linguagens ? String(d.linguagens).split(',')[0].trim() : 'Nenhuma';
           aiLangs[primaryLang] = (aiLangs[primaryLang] || 0) + (d.estrelas || 0);
        }
      }
    }
  }
});

console.log({ totalAi, aiByYear, aiMarkdownRecentCount: aiMarkdownRecent.length, aiLangs });
