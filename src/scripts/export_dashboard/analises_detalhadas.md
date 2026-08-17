# Análises Detalhadas: Repositórios Populares do GitHub

Este documento compila todos os insights detalhados descobertos durante a fase de exploração de dados no terminal usando os scripts analíticos.

## 1. O Paradoxo da Wiki (A Regra de Ouro da Documentação)
Existe uma ideia comum de que "projetos com Wiki no GitHub são mais bem-sucedidos". Os dados provam exatamente o oposto:
* Repositórios **SEM Wiki** no GitHub têm uma média de **16.020 estrelas**, 214 issues abertas e 59 PRs ativos.
* Repositórios **COM Wiki** no GitHub têm uma média menor: **12.446 estrelas**, 180 issues e apenas 41 PRs ativos.

**Conclusão:** Os repositórios massivos (como React, TensorFlow, VS Code) não usam a Wiki nativa do GitHub. Eles hospedam sites de documentação próprios (usando ferramentas como Docusaurus, Next.js). Usar a Wiki nativa é sinal de projetos de médio porte, enquanto a ausência dela em projetos gigantes indica documentação hospedada fora do GitHub.

## 2. Tamanho do Código e o "Efeito de Longo Prazo"
Categorizamos os repositórios pelo seu tamanho físico (em KB) e cruzamos com a taxa de abandono oficial (`esta_arquivado`). 
A estatística é perfeitamente linear: **quanto menor o repositório, maior a chance dele morrer.**
* **Projetos Pequenos (< 1 MB):** Taxa de abandono de **9,2%**.
* **Projetos Gigantes (> 100 MB):** Taxa de abandono de apenas **4,3%**.

**Conclusão:** Projetos pequenos tendem a ser utilitários de nicho, scripts ou experimentos que ficam obsoletos. Projetos gigantes representam grandes ecossistemas e recebem manutenção de longo prazo.

## 3. O Mito do "Trabalho Duro" vs Popularidade
* **Tamanho e Commits não importam:** A correlação entre o tamanho em KB ou quantidade de commits e o número de estrelas é quase zero (0.04 e 0.09). Projetos com milhares de commits não tendem a ter mais estrelas. A popularidade vem do valor da ideia e utilidade.
* **Forks (0.64) e Observadores (0.72):** Estas são as métricas com forte correlação com as estrelas. O crescimento da comunidade de desenvolvedores/contribuidores anda lado a lado com as estrelas.

## 4. Tendências de Tags: A Mina de Ouro é a "Educação"
As tags que geram a maior média de estrelas por repositório indicam uma tendência massiva de materiais educativos:
1. `programming` (Média: 68.832 estrelas)
2. `computer-science` (Média: 66.293 estrelas)
3. `education` (Média: 51.279 estrelas)

Se a linguagem ou tag for relacionada a dicas de entrevistas (Ex: Nenhuma linguagem específica + tag `interview`), a média sobe para absurdos **44.400 estrelas**. O GitHub atua fortemente como um centro universitário descentralizado.

## 5. O Fenômeno da Inteligência Artificial e Markdown
A partir de 2022/2023, o número de projetos com foco em IA explodiu.
* **Python** lidera com folga absurda. Em repositórios de IA criados a partir de 2024, Python acumulou mais de **6.8 milhões de estrelas**.
* **A Hipótese do Markdown:** Sim, começaram a surgir recentemente projetos hiper-focados em "Agent Skills" e prompts de LLMs estruturados puramente em **Markdown** (Ex: repositórios da categoria *skills* criados em 2026). Além disso, repositórios "Sem Linguagem" (que são apenas super-listas de ferramentas de IA em `.md`) ocupam o 4º lugar de estrelas no ecossistema de IA.

## 6. Dinheiro, Ideologia e Licenças
A licença dita o modelo de sobrevivência do repositório:
* **Licenças Copyleft (AGPL v3 e GPL v3):** Entre **43% e 49%** dos projetos pedem ativamente doações (`recebe_doacoes`). Como essas licenças impedem fechamento do código por empresas, eles dependem da comunidade (Patreon, Sponsors) para sobreviver.
* **Inteligência Artificial (O Domínio Corporativo):** Modelos de IA e frameworks (LangChain, etc.) usam **Apache 2.0** e **MIT**. Eles evitam GPL para permitir adoção comercial em massa por Startups.
* **Projetos Abandonados:** Projetos sob `LGPL` e `BSD 3-Clause` são os que mais constam como "Arquivados" (cerca de 10%), frequentemente sendo ferramentas e infraestruturas antigas que perderam a guerra de popularidade para o MIT.
