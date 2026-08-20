export const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  TypeScript: '#3178c6',
  'C#': '#178600',
  C: '#555555',
  'C++': '#f34b7d',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Markdown: '#083fa1',
  Shell: '#89e051',
  Vue: '#41b883',
};

// Fallback generator for unmapped languages
export function getColorForLanguage(language: string | undefined): string {
  if (!language) return '#94a3b8'; // Default gray for unknown
  
  if (languageColors[language]) {
    return languageColors[language];
  }

  // Generate a distinct color based on string hash
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}
