const currency = import.meta.env.VITE_CURRENCY || 'USD';
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });

export const money = (value) => formatter.format(Number(value) || 0);

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
