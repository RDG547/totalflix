// Função para abrir popunder quando o usuário for assistir conteúdo
export function openPopunder() {
  // URL do popunder do Adsterra
  const popunderUrl = "https://pl28735403.effectivegatecpm.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js";
  
  // Tenta abrir o popunder de várias formas
  try {
    // Método 1: Criar link e clicar (mais confiável)
    const link = document.createElement('a');
    link.href = "https://www.google.com"; // URL falsa para permitir o popup
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    
    // Simula click
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    // Tenta abrir popup
    const popup = window.open('about:blank', '_blank');
    
    if (popup) {
      // Se abriu, redireciona para o popunder
      popup.location.href = "https://pl28735403.effectivegatecpm.com/";
      popup.blur();
      window.focus();
    }
    
    // Método 2: Recarregar o script do popunder
    const existingScript = document.querySelector('script[src*="pl28735403"]');
    if (existingScript) {
      const newScript = document.createElement('script');
      newScript.src = popunderUrl;
      newScript.async = true;
      document.body.appendChild(newScript);
    }
    
  } catch (error) {
    console.log('Popunder blocked or failed:', error);
  }
}

// Função segura que só executa no cliente
export function triggerPopunderOnWatch() {
  if (typeof window === 'undefined') return;
  
  // Delay para não interromper a ação do usuário
  setTimeout(() => {
    openPopunder();
  }, 500);
}
