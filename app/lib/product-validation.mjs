export const PRODUCT_UNITS = [
  "each",
  "piece",
  "box",
  "pack",
  "set",
  "pair",
  "kg",
  "g",
  "liter",
  "meter",
  "roll",
];

export const PRODUCT_STATUSES = ["active", "inactive"];

export function validateProductInput(input) {
  const code = typeof input?.code === "string" ? input.code.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";
  const unit = typeof input?.unit === "string" ? input.unit.trim().toLowerCase() : "";
  const status =
    typeof input?.status === "string" ? input.status.trim().toLowerCase() : "";
  const priceText =
    typeof input?.current_price === "string"
      ? input.current_price.trim()
      : typeof input?.current_price === "number"
        ? String(input.current_price)
        : "";

  const errors = {};
  if (!code) {
    errors.code = "Product code is required.";
  } else if (code.length > 20) {
    errors.code = "Product code must be 20 characters or fewer.";
  }
  if (!description) {
    errors.description = "Product description is required.";
  } else if (description.length > 200) {
    errors.description = "Product description must be 200 characters or fewer.";
  }
  if (!unit) {
    errors.unit = "Unit is required.";
  } else if (!PRODUCT_UNITS.includes(unit)) {
    errors.unit = "Choose one of the allowed units.";
  }

  let currentPrice = null;
  if (priceText) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(priceText)) {
      errors.current_price = "Enter a valid price with at most two decimal places.";
    } else {
      currentPrice = Number(priceText);
      if (!Number.isFinite(currentPrice) || currentPrice < 0) {
        errors.current_price = "Enter a valid non-negative price.";
      }
    }
  }

  if (!status) {
    errors.status = "Status is required.";
  } else if (!PRODUCT_STATUSES.includes(status)) {
    errors.status = "Choose Active or Inactive.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    value: {
      code,
      description,
      unit,
      current_price: currentPrice,
      status,
    },
  };
}
