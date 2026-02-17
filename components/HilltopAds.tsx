"use client";

import Script from "next/script";

export function HilltopAds() {
  return (
    <>
      {/* HilltopAds Popunder Script - Zona #6809961 */}
      <Script
        src="https://agedhead.com/bq3vVw0.Po3kpYvCbcmfVgJVZVDH0C2/OgDaAd5KOFTWYJx-LITWYC4yMCDxkT5_Nnj/UF"
        strategy="lazyOnload"
        onLoad={() => console.log('HilltopAds popunder loaded')}
        onError={(e) => console.error('HilltopAds error:', e)}
      />
    </>
  );
}

// Função para abrir o popunder manualmente (se necessário)
export function openHilltopAds() {
  if (typeof window !== 'undefined') {
    const url = "https://agedhead.com/bq3vVw0.Po3kpYvCbcmfVgJVZVDH0C2/OgDaAd5KOFTWYJx-LITWYC4yMCDxkT5_Nnj/UF";
    window.open(url, '_blank');
  }
}
