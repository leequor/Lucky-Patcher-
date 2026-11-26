
export const CUSTOMER_PAY_TERMS = [
  "Net 30",
  "Net 45",
  "COD",
  "Prepaid",
];

export function validateCustomerInput(input) {
  const code = typeof input?.code === "string" ? input.code.trim() : "";
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const address = typeof input?.address === "string" ? input.address.trim() : "";
  const payTerms =
    typeof input?.pay_terms === "string" ? input.pay_terms.trim() : "";

  const errors = {};

  if (!code) {
    errors.code = "Customer code is required.";
  } else if (code.length > 10) {
    errors.code = "Customer code must be 10 characters or fewer.";
  }

  if (!name) {
    errors.name = "Customer name is required.";
  } else if (name.length > 100) {
    errors.name = "Customer name must be 100 characters or fewer.";
  }

  if (
    input?.address !== undefined &&
    input.address !== null &&
    typeof input.address !== "string"
  ) {
    errors.address = "Enter a valid address.";
  }

  if (address.length > 200) {
    errors.address = "Address must be 200 characters or fewer.";
  }

  if (
    input?.pay_terms !== undefined &&
    input.pay_terms !== null &&
    typeof input.pay_terms !== "string"
  ) {
    errors.pay_terms = "Choose one of the listed payment terms.";
  }

  if (payTerms && !CUSTOMER_PAY_TERMS.includes(payTerms)) {
    errors.pay_terms = "Choose one of the listed payment terms.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    value: {
      code,
      name,
      address: address || null,
      pay_terms: payTerms || null,
    },
  };
}
