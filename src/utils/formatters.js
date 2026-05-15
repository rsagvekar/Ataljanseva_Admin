import moment from 'moment';
import { COLORS } from '../config/theme';

export const formatDate = (d) => {
  if (!d) return '—';
  const m = moment(d);
  return m.isValid() ? m.format('DD MMM YYYY') : '—';
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  const m = moment(d);
  return m.isValid() ? m.format('DD MMM YYYY, hh:mm A') : '—';
};

export const formatRelative = (d) => {
  if (!d) return '—';
  const m = moment(d);
  return m.isValid() ? m.fromNow() : '—';
};

export const formatCurrency = (n) => {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
};

export const formatPhone = (p) => {
  if (!p) return '—';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return p;
};

export const truncate = (str, n = 50) =>
  str && str.length > n ? `${str.slice(0, n)}…` : str || '';

export const initials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
};

export const getStatusColor = (status) => {
  const map = {
    Pending:     { bg: COLORS.statusPendingBg,    text: COLORS.statusPending },
    'In Progress':{ bg: COLORS.statusInProgressBg, text: COLORS.statusInProgress },
    Resolved:    { bg: COLORS.statusResolvedBg,   text: COLORS.statusResolved },
    Active:      { bg: COLORS.statusActiveBg,     text: COLORS.statusActive },
    Inactive:    { bg: COLORS.statusInactiveBg,   text: COLORS.statusInactive },
    Completed:   { bg: COLORS.statusResolvedBg,   text: COLORS.statusResolved },
    Planned:     { bg: COLORS.purpleLight,         text: COLORS.purple },
    Ongoing:     { bg: COLORS.statusInProgressBg, text: COLORS.statusInProgress },
    Delayed:     { bg: COLORS.dangerLight,         text: COLORS.danger },
    Cancelled:   { bg: COLORS.gray100,             text: COLORS.gray500 },
  };
  return map[status] || { bg: COLORS.gray100, text: COLORS.gray500 };
};
