import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Keep route transitions deterministic: any navigation to a different pathname
 * starts at the top, so users never land mid-page from previous scroll state.
 */
export function ScrollToTopOnNavigation() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preserve in-page hash anchor jumps, but reset regular page-to-page navigation.
    if (location.hash) return;

    if (navigationType === 'PUSH' || navigationType === 'REPLACE' || navigationType === 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.hash, location.pathname, location.search, navigationType]);

  return null;
}
