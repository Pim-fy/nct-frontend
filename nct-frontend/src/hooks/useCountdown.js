import { useEffect, useState } from 'react';

const useCountdown = (enabled = true) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return undefined;

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [enabled]);

  return now;
};

export default useCountdown;
