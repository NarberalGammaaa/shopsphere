import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/axios.js';
import { dayLabel } from '../utils/format.js';

export const isPincode = (value) => /^[1-9][0-9]{5}$/.test(value || '');

// Shows how long delivery takes from each seller's dispatch PIN to the given PIN.
export default function DeliveryEstimate({ pincode, productIds }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const idsKey = productIds.join(',');
  const valid = isPincode(pincode);

  useEffect(() => {
    if (!valid || !idsKey) {
      setRows([]);
      setError('');
      return undefined;
    }
    let cancelled = false;
    api
      .get('/delivery/estimate', { params: { pincode, productIds: idsKey } })
      .then((r) => {
        if (!cancelled) {
          setRows(r.data);
          setError('');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [valid, pincode, idsKey]);

  if (error) return <p className="alert">{error}</p>;
  if (rows.length === 0) return null;

  const latest = rows.map((r) => r.latest).sort().at(-1);
  const earliest = rows.map((r) => r.earliest).sort().at(-1);

  return (
    <div className="delivery">
      <p className="delivery__headline">
        Delivery to {pincode}: <strong>{earliest === latest ? dayLabel(latest) : `${dayLabel(earliest)} to ${dayLabel(latest)}`}</strong>
      </p>
      <ul>
        {rows.map((r) => (
          <li key={r.productId}>
            {rows.length > 1 && <span>{r.productName}: </span>}
            ships from {r.sellerName} (PIN {r.fromPincode}, {r.zone}), about {r.transitDays} day{r.transitDays > 1 ? 's' : ''} in transit
          </li>
        ))}
      </ul>
      <p className="muted">Estimated by PIN-code region plus 1 day for packing. It is not live courier tracking.</p>
    </div>
  );
}
