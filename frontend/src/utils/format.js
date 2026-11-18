const currency = import.meta.env.VITE_CURRENCY || 'INR';
const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 });

export const money = (value) => formatter.format(Number(value) || 0);

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const dateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// "2026-11-18" (a LocalDate from the API) -> "Wed, 18 Nov"
export const dayLabel = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

// whole days from today (local time) to an ISO date
export const daysFromToday = (isoDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${isoDate}T00:00:00`) - today) / 86400000);
};

export const errorText = (e) => (typeof e === 'string' ? e : e?.message || 'Something went wrong');
