"use client";

import Script from "next/script";

export const HILLTOP_VAST_TAG_URL = "https://faithfuloccasion.com/dLmYFLzZd.GxNVvgZaGZUu/Sesmh9qu_ZxUQlWkkPjTdc/yHMtTMcb4YMlTJMPtBNMztIZx_N_zTggxKN/ypZ/sNa/Ws1DpBdeDm0xxw";

const HILLTOP_SCRIPT_URLS = [
  "https://relieved-understanding.com/bqXEV.sgdeGjlR0aYKW/ca/beamW9ruQZiUHlakcP/TlcbyrM/TAcs3gNbj/UptTNdzvIxxANVzCcj2TOBQ-",
  "https://relieved-understanding.com/b.X-V/s/dhGRlL0fYMWQcc/UeFmn9IumZJUtlKkpP/Tdc/y/M_Tnc/3/OeDtE/tENCzGIBxpNYzScS4/NqQV",
  "https://relieved-understanding.com/bkX/V/s/d.GYlm0mYSWScM/XeLmZ9Lu/ZYUUlvkCP-T_cyyNM/Tfc/3EO/T/cwtwNgznIzxFNyzIglw/MCQq",
] as const;

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
      {HILLTOP_SCRIPT_URLS.map((src, index) => (
        <Script
          key={src}
          id={`hilltop-zone-${index + 1}`}
          src={src}
          strategy="lazyOnload"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ))}
    </>
  );
}
