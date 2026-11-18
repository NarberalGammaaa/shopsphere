import { useEffect, useState } from 'react';

// Re-renders the component every `ms` milliseconds and returns the current time in ms.
export default function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
