import { useRef } from 'react';

type ParametersType<T> = T extends (...args: infer P) => any ? P : never;

export default function useDebounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  const timerRef = useRef(0);

  const debouncedFunc = (...args: ParametersType<T>) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => func(...args), delay);
  };

  return debouncedFunc as T;
}
