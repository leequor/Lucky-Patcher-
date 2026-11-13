import { daysBetween, parseDateOnly, todayISO } from "./format.js";

/**
 * Price history rules.
 * A price row is { id, productId, amount, effectiveDate, note, ... }.
 * The current price is the newest row whose effective date is on or before
 * the requested date. No row means the product has no price yet — which the
 * UI must show as "No price set", never as zero.
 */

export function sortPricesDescending(prices) {
  return [...prices].sort((a, b) => {
    if (a.effectiveDate === b.effectiveDate) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    }
    return a.effectiveDate < b.effectiveDate ? 1 : -1;
  });
}

export function priceAsOf(prices, asOf = todayISO()) {
  const eligible = prices
    .filter((price) => price.effectiveDate <= asOf)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : 1));
  return eligible.length > 0 ? eligible[eligible.length - 1] : null;
}

export function upcomingPrices(prices, asOf = todayISO()) {
  return sortPricesDescending(prices).filter(
    (price) => price.effectiveDate > asOf,
  );
}

export function nextScheduledPrice(prices, asOf = todayISO()) {
  const upcoming = upcomingPrices(prices, asOf).sort((a, b) =>
    a.effectiveDate < b.effectiveDate ? -1 : 1,
  );
  return upcoming[0] ?? null;
}

/** Delta of `price` against the row that was effective immediately before it. */
export function priceDelta(prices, price) {
  const earlier = prices
    .filter((row) => row.effectiveDate < price.effectiveDate)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : 1));
  const previous = earlier[earlier.length - 1];
  if (!previous || !previous.amount) return null;
  const amount = price.amount - previous.amount;
  return {
    amount,
    percent: (amount / previous.amount) * 100,
    previousAmount: previous.amount,
    previousDate: previous.effectiveDate,
  };
}

export function priceAgeDays(price, asOf = todayISO()) {
  if (!price) return null;
  return daysBetween(price.effectiveDate, asOf);
}

export function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return false;
  return parseDateOnly(value) !== null;
}
