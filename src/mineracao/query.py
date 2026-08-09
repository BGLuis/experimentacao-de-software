"""Consulta GraphQL usada na Sprint 1."""

POPULAR_REPOSITORIES_QUERY = """
query PopularRepositories($first: Int!) {
  search(query: "stars:>0 sort:stars-desc", type: REPOSITORY, first: $first) {
    repositoryCount
    nodes {
      ... on Repository {
        name
        nameWithOwner
        url
        stargazerCount
        createdAt
        updatedAt
        primaryLanguage { name }
        pullRequests(states: MERGED) { totalCount }
        releases { totalCount }
        openIssues: issues(states: OPEN) { totalCount }
        closedIssues: issues(states: CLOSED) { totalCount }
      }
    }
  }
}
"""
