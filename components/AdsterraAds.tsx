"use client";

import Script from "next/script";

export function AdsterraAds() {
  return (
    <>
      {/* Adsterra Script 1 */}
      <Script
        src="https://pl28735403.effectivegatecpm.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js"
        strategy="lazyOnload"
      />
      
      {/* Adsterra Script 2 com container */}
      <Script
        src="https://pl28735413.effectivegatecpm.com/28fe29024925ba318c588b98f9674bb9/invoke.js"
        strategy="lazyOnload"
        data-cfasync="false"
      />
    </>
  );
}

// Componente para o container do segundo anúncio
export function AdsterraContainer() {
  return (
    <div 
      id="container-28fe29024925ba318c588b98f9674bb9" 
      className="w-full min-h-[100px] flex items-center justify-center"
    />
  );
}
