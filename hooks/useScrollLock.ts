
import { useEffect } from 'react';

export function useScrollLock(lock: boolean) {
    useEffect(() => {
        if (lock) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden'; // Lock html as well for mobile
            return () => {
                document.body.style.overflow = originalStyle;
                document.documentElement.style.overflow = '';
            };
        }
    }, [lock]);
}
