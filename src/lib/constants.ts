// Retorna a URL absoluta da logo para o PDF conseguir baixar
export const getLogoUrl = () => {
  if (typeof window !== 'undefined') {
    // No navegador, pega a origem (ex: http://localhost:3000 ou https://seu-site.com)
    return `${window.location.origin}/assets/logo.png`;
  }
  return '';
};