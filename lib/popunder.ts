// Função para abrir popunder/smartlink quando o usuário for assistir conteúdo
export function openPopunder() {
  // URLs dos anúncios Adsterra
  const popunderUrl = "https://fixesconsessionconsession.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js";
  const smartlinkUrl = "https://fixesconsessionconsession.com/ueqjseci?key=63c9cbec9e24dda8c816a9461f648386";
  
  // Tenta abrir o smartlink em nova aba
  try {
    const popup = window.open(smartlinkUrl, '_blank');
    
    if (popup) {
      // Se abriu, tenta dar foco de volta à janela principal
      popup.blur();
      window.focus();
    }
    
    // Também tenta recarregar o script do popunder
    const existingScript = document.querySelector('script[src*="fixesconsessionconsession.com/1c/a3/d9"]');
    if (!existingScript) {
      const newScript = document.createElement('script');
      newScript.src = popunderUrl;
      newScript.async = true;
      document.body.appendChild(newScript);
    }
    
  } catch (error) {
    console.log('Popunder/Smartlink blocked or failed:', error);
  }
}

// Função segura que só executa no cliente
export function triggerPopunderOnWatch() {
  if (typeof window === 'undefined') return;
  
  // Delay para não interromper a ação do usuário
  setTimeout(() => {
    openPopunder();
  }, 300);
}

// Função para abrir apenas o smartlink (para outros casos)
export function openSmartlinkOnly() {
  if (typeof window === 'undefined') return;
  
  const smartlinkUrl = "https://fixesconsessionconsession.com/ueqjseci?key=63c9cbec9e24dda8c816a9461f648386";
  
  try {
    window.open(smartlinkUrl, '_blank');
  } catch (error) {
    console.log('Smartlink blocked:', error);
  }
}
