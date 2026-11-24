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

export function validateProductInput(input) {
  const code = typeof input?.code === "string" ? input.code.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";
  const unit = typeof input?.unit === "string" ? input.unit.trim().toLowerCase() : "";

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

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    value: {
      code,
      description,
      unit,
    },
  };
}
