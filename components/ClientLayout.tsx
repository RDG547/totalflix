'use client'

import { ReactNode, useEffect } from 'react'
import { PageTransition } from './PageTransition'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    // Suppress unhandled errors from third-party ad scripts
    const adDomainPatterns = ['.f8c00ef6a5.com', 'wpadmngr.com', 'fixesconsession', 'agedhead.com', 'clickadilla'];

    const handleError = (event: ErrorEvent) => {
      const src = event.filename || '';
      const msg = event.message || '';
      if (adDomainPatterns.some(p => src.includes(p) || msg.includes(p)) || msg.includes("reading 'fp'")) {
        event.preventDefault();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '');
      if (reason.includes('Network Error') || adDomainPatterns.some(p => reason.includes(p))) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return <PageTransition>{children}</PageTransition>
}
