export const getLangCode = (language?: string | string[]) => {
  if (!language) return null;

  // Se for array, pega o primeiro. Se for string, usa ela mesma.
  const codeRaw = Array.isArray(language) ? language[0] : language;
  
  if (!codeRaw) return null;

  const code = codeRaw.toLowerCase();
  
  if (code.includes('por') || code === 'pt') return 'PT';
  if (code.includes('eng') || code === 'en') return 'EN';
  if (code.includes('spa') || code === 'es') return 'ES';
  if (code.includes('fre') || code === 'fr') return 'FR';
  
  return code.substring(0, 2).toUpperCase();
};


export const SOURCE_MAP: Record<string, { label: string, color: string, text: string }> = {
  openlibrary: { label: 'Open Library', color: '#E8DED1', text: '#5D4037' }, // Bege Escuro
  google:      { label: 'Google Books', color: '#D1E8E2', text: '#2C5F2D' }, // Verde Sálvia
  gutenberg:   { label: 'Gutenberg',    color: '#E8D1D1', text: '#5F2C2C' }, // Rosado Antigo
  standard:    { label: 'Standard Ebooks', color: '#E1D1E8', text: '#4A2C5F' },
  local:       { label: 'Servidor Local', color: '#D0E0FF', text: '#003366' },
  default:     { label: 'Acervo',       color: '#F0F0F0', text: '#666' }
};

export const generateFileName = (title: string) => {
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    return `${cleanTitle}.pdf`;
}

export const formatFolderName = (uri: string) => {
    try {
      const decoded = decodeURIComponent(uri);
      // O Android geralmente retorna algo como ".../tree/primary:Download/Livros"
      // Vamos tentar pegar só o que vem depois de "primary:" ou da última barra
      if (decoded.includes('primary:')) {
        return decoded.split('primary:')[1];
      }
      // Fallback para outros tipos de armazenamento
      const parts = decoded.split(':');
      return parts.length > 1 ? parts[parts.length - 1] : decoded;
    } catch {
      return 'Pasta Personalizada';
    }
  };