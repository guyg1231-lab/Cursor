import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type RevealState = 'hidden' | 'visible';
type ScrollRevealOptions = {
  threshold?: number;
  rootMargin?: string;
};

function createInitialStates(count: number, initialVisibleCount: number): RevealState[] {
  return Array.from({ length: count }, (_, index) => (index < initialVisibleCount ? 'visible' : 'hidden'));
}

export function useScrollReveal(sectionCount: number, initialVisibleCount = 0, options: ScrollRevealOptions = {}) {
  const [states, setStates] = useState<RevealState[]>(() => createInitialStates(sectionCount, initialVisibleCount));
  const refs = useRef<(HTMLElement | null)[]>([]);
  const threshold = options.threshold ?? 0.16;
  const rootMargin = options.rootMargin ?? '0px 0px -8% 0px';

  useEffect(() => {
    setStates(createInitialStates(sectionCount, initialVisibleCount));
    refs.current = refs.current.slice(0, sectionCount);
  }, [initialVisibleCount, sectionCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof window.IntersectionObserver === 'undefined') {
      setStates(Array.from({ length: sectionCount }, () => 'visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setStates((previous) => {
          const next = [...previous];
          let changed = false;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const index = Number((entry.target as HTMLElement).dataset.revealIndex);
            if (!Number.isFinite(index) || next[index] === 'visible') continue;
            next[index] = 'visible';
            changed = true;
            observer.unobserve(entry.target);
          }
          return changed ? next : previous;
        });
      },
      { threshold, rootMargin },
    );

    for (let index = 0; index < sectionCount; index += 1) {
      const node = refs.current[index];
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [initialVisibleCount, rootMargin, sectionCount, threshold]);

  const setRevealRef = useCallback((index: number, node: HTMLElement | null) => {
    refs.current[index] = node;
  }, []);

  const getRevealState = useCallback(
    (index: number): RevealState => {
      if (index < 0 || index >= states.length) return 'visible';
      return states[index] ?? 'visible';
    },
    [states],
  );

  return useMemo(
    () => ({
      setRevealRef,
      getRevealState,
    }),
    [getRevealState, setRevealRef],
  );
}
