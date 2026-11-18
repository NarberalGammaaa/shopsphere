import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import useNow from '../utils/useNow.js';

const pad = (n) => String(n).padStart(2, '0');

function split(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

// Sale countdown. Before the sale it counts down to the start, during the sale to the end.
export default function OfferBanner() {
  const [offer, setOffer] = useState(null);
  const now = useNow(1000);

  useEffect(() => {
    api.get('/offers/current').then((r) => setOffer(r.data || null)).catch(() => setOffer(null));
  }, []);

  if (!offer) return null;
  const start = new Date(offer.startsAt).getTime();
  const end = new Date(offer.endsAt).getTime();
  if (now >= end) return null;

  const running = now >= start;
  const t = split((running ? end : start) - now);

  return (
    <div className="offer" role="status">
      <div className="container offer__inner">
        <p className="offer__text">
          <strong>{offer.title}</strong>{' '}
          {running ? `${offer.discountPercent}% off everything. Ends in` : `starts soon with ${offer.discountPercent}% off. Starts in`}
        </p>
        <div className="countdown" aria-label="Time remaining">
          {[['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']].map(([key, label]) => (
            <span key={key} className="countdown__cell">
              <b>{pad(t[key])}</b>
              <small>{label}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
