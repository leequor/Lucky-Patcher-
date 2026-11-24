export function validatePriceInput(input) {
  const amountText =
    typeof input?.amount === "string"
      ? input.amount.trim()
      : typeof input?.amount === "number"
        ? String(input.amount)
        : "";
  const effectiveDate =
    typeof input?.effective_date === "string" ? input.effective_date.trim() : "";

  const errors = {};
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amountText)) {
    errors.amount = "Enter a non-negative amount with at most two decimal places.";
  }

  const date = new Date(`${effectiveDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== effectiveDate
  ) {
    errors.effective_date = "Enter a valid effective date.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    value: {
      amount: amountText,
      effective_date: effectiveDate,
    },
  };
}
