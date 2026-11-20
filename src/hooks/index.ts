import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  simulated: boolean;
  refetch: () => void;
}

export function useAsync<T>(
  asyncFn: () => Promise<{ data: T; error?: string | null; simulated?: boolean }>,
  deps: unknown[] = []
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState<boolean>(false);

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);
    let isMounted = true;

    asyncFn()
      .then(res => {
        if (!isMounted) return;
        if (res.error) {
          setError(res.error);
          setData(null);
        } else {
          setData(res.data);
          setError(null);
        }
        setSimulated(Boolean(res.simulated));
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : String(err));
        setData(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, simulated, refetch: execute };
}

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export function useCountUp(target: number, durationMs = 1200): number {
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(reducedMotion ? target : 0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setCount(target);
      return;
    }

    let animationFrameId: number;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / durationMs, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(startValue + (target - startValue) * ease);
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationFrameId);
      startRef.current = null;
    };
  }, [target, durationMs, reducedMotion]);

  return count;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
