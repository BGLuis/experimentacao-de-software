<div align="center">

<!-- Badges de Status do GitHub -->
![GitHub Stars](https://www.shieldcn.dev/github/stars/bgluis/experimentacao-de-software.svg?variant=secondary&size=sm)
![GitHub Forks](https://www.shieldcn.dev/github/forks/bgluis/experimentacao-de-software.svg?variant=secondary&size=sm)
![Watchers](https://www.shieldcn.dev/github/watchers/bgluis/experimentacao-de-software.svg?variant=secondary&size=sm)
![Contributors](https://www.shieldcn.dev/github/contributors/bgluis/experimentacao-de-software.svg?theme=emerald&size=sm)
![License](https://www.shieldcn.dev/github/license/bgluis/experimentacao-de-software.svg?variant=ghost&size=sm)

<br/>

<!-- Badges das Tecnologias Utilizadas -->
![Python](https://www.shieldcn.dev/badge/Python-3776AB.svg?logo=python&variant=branded&size=sm)

  <h3>Experimentação de Software</h3>
  Mineração e análise de dados dos repositórios mais populares do GitHub via GraphQL.
</div>

# 📖 Sobre
O repositório contém scripts em Python desenvolvidos para extrair dados estruturados dos repositórios com maior número de estrelas no GitHub. Através de consultas feitas à API GraphQL do GitHub, o projeto coleta e analisa métricas cruciais de sistemas open-source. Os dados coletados são então salvos e validados para gerar relatórios e responder a diferentes questões de pesquisa (RQs) propostas.

# 📋 Motivo
O projeto foi criado como requisito prático para a disciplina de Laboratório de Experimentação de Software (Engenharia de Software, 6º período). O objetivo é estudar empiricamente as principais características de sistemas populares open-source através da mineração de dados via API GraphQL do GitHub, enquanto simultaneamente é implementada e monitorada uma metodologia ágil utilizando um quadro Kanban para a gestão de progresso do grupo.

# 📊 Dados Extraídos
Durante a mineração dos repositórios via API GraphQL, um extenso conjunto de dados é coletado e estruturado referente a **12.233 repositórios**. Os dados são salvos em CSV (`data/repositorios_populares.csv`) contendo os seguintes agrupamentos:

**Informações Gerais**
- Repositório (Nome e URL) e Descrição
- Linguagens primárias e Tags / Tópicos
- Licença adotada
- Tamanho em KB
- Indicadores booleanos (`e_fork`, `esta_arquivado`, `recebe_doacoes`, `possui_wiki`, `possui_issues`)

**Popularidade e Envolvimento**
- Total de Estrelas, Forks e Observadores (watchers)
- Usuários mencionáveis (contributors/participants)

**Atividade e Histórico**
- Data de criação e Idade em dias
- Data da última atualização / último push e os respectivos dias desde as ocorrências
- Total de Commits, Releases e médias de dias entre commits (histórico e recente)
- Maior intervalo recente sem submissão de código (gap)

**Issues e Pull Requests**
- Total de Issues (Abertas, Fechadas e Total)
- Razão de fechamento de Issues
- Total de Pull Requests (Abertas e Aceitas)

# 📚 Laboratórios e Documentação
As instruções e definições detalhadas de cada etapa prática da disciplina são armazenadas na pasta `docs/`. Acesse os links abaixo para visualizar o roteiro completo de cada laboratório:
- [Laboratório 01 - Características de repositórios populares](docs/lab01_instructions.md)
- *Laboratório 02 (A ser adicionado)*
- *Laboratório 03 (A ser adicionado)*
- *Laboratório 04 (A ser adicionado)*

# 💻 Como iniciar

### Requisitos
- [Python 3.x](https://www.python.org/downloads/)
- [Git](https://git-scm.com/downloads)

### Instalação

1. Clone o repositório do projeto:
  ```sh
  git clone https://github.com/bgluis/experimentacao-de-software.git
  ```

2. Navegue até o diretório do projeto:
  ```sh
  cd experimentacao-de-software
  ```

3. Crie e ative o ambiente virtual (Recomendado):
  ```sh
  python -m venv .venv
  source .venv/bin/activate  # No Linux/macOS
  # ou
  .venv\Scripts\activate     # No Windows
  ```

4. Configure as variáveis de ambiente:
  Copie o arquivo de exemplo e insira seu token:
  ```sh
  cp .env.example .env
  ```

# ⚙️ Variáveis de Ambiente

| Variável | Descrição | Valor Padrão/Exemplo |
| :--- | :--- | :--- |
| `GITHUB_TOKEN` | Token de autenticação pessoal do GitHub necessário para consultar a API GraphQL. Você pode usar múltiplos tokens separados por vírgula para evitar limites de taxa (Rate Limits). | `ghp_seutoken123...` ou `token1,token2` |

# 🤝 Contribuidores
 <a href="https://github.com/bgluis/experimentacao-de-software/graphs/contributors">
   <img src="https://contrib.rocks/image?repo=bgluis/experimentacao-de-software"/>
 </a>
