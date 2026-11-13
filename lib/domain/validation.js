import {
  PAY_TERM_VALUES,
  STATUS_VALUES,
  UNIT_VALUES,
} from "./constants.js";
import { isValidDateOnly } from "./pricing.js";

export const MINIMUM_PASSWORD_LENGTH = 6;
export const MAX_PRICE = 9_999_999.99;

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCode(value) {
  return normalizeText(value).toUpperCase();
}

export function parseMoneyInput(value) {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "")
    .replace(/[₱$,\s]/g, "")
    .trim();
  if (cleaned === "") return Number.NaN;
  return Number(cleaned);
}

function isBlank(value) {
  return normalizeText(value).length === 0;
}

function result(errors) {
  return Object.keys(errors).length === 0
    ? { ok: true, errors: {} }
    : { ok: false, errors };
}

export function validateCustomer(input, { codeExists } = {}) {
  const errors = {};
  const code = normalizeCode(input.code);
  const name = normalizeText(input.name);
  const email = normalizeText(input.email);

  if (isBlank(code)) {
    errors.code = "Customer code is required.";
  } else if (code.length < 3 || code.length > 20) {
    errors.code = "Use 3 to 20 characters for the customer code.";
  } else if (!CODE_PATTERN.test(code)) {
    errors.code = "Use letters, numbers and dashes only, starting with a letter or number.";
  } else if (codeExists && codeExists(code)) {
    errors.code = `Customer code ${code} is already in use.`;
  }

  if (isBlank(name)) {
    errors.name = "Customer name is required.";
  } else if (name.length < 2) {
    errors.name = "Enter the full customer name.";
  } else if (name.length > 120) {
    errors.name = "Keep the customer name under 120 characters.";
  }

  if (!isBlank(email) && !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address, for example name@company.com.";
  }

  if (normalizeText(input.contactPerson).length > 120) {
    errors.contactPerson = "Keep the contact person under 120 characters.";
  }

  if (normalizeText(input.phone).length > 40) {
    errors.phone = "Keep the phone number under 40 characters.";
  }

  if (normalizeText(input.address).length > 240) {
    errors.address = "Keep the address under 240 characters.";
  }

  if (!PAY_TERM_VALUES.includes(input.payTerms)) {
    errors.payTerms = "Choose one of the allowed payment terms.";
  }

  if (!STATUS_VALUES.includes(input.status)) {
    errors.status = "Choose Active or Inactive.";
  }

  if (normalizeText(input.notes).length > 1000) {
    errors.notes = "Keep notes under 1000 characters.";
  }

  return result(errors);
}

export function validateProduct(input, { codeExists } = {}) {
  const errors = {};
  const code = normalizeCode(input.code);
  const description = normalizeText(input.description);

  if (isBlank(code)) {
    errors.code = "Product code is required.";
  } else if (code.length < 3 || code.length > 24) {
    errors.code = "Use 3 to 24 characters for the product code.";
  } else if (!CODE_PATTERN.test(code)) {
    errors.code = "Use letters, numbers and dashes only, starting with a letter or number.";
  } else if (codeExists && codeExists(code)) {
    errors.code = `Product code ${code} is already in use.`;
  }

  if (isBlank(description)) {
    errors.description = "Product description is required.";
  } else if (description.length < 2) {
    errors.description = "Enter a longer product description.";
  } else if (description.length > 160) {
    errors.description = "Keep the description under 160 characters.";
  }

  if (!UNIT_VALUES.includes(input.unit)) {
    errors.unit = "Choose one of the allowed units.";
  }

  if (!STATUS_VALUES.includes(input.status)) {
    errors.status = "Choose Active or Inactive.";
  }

  if (normalizeText(input.notes).length > 1000) {
    errors.notes = "Keep notes under 1000 characters.";
  }

  return result(errors);
}

export function validatePrice(input, { prices = [], priceId = null } = {}) {
  const errors = {};
  const amount = parseMoneyInput(input.amount);
  const effectiveDate = normalizeText(input.effectiveDate);

  if (Number.isNaN(amount)) {
    errors.amount = "Enter the price amount.";
  } else if (amount <= 0) {
    errors.amount = "The price must be greater than zero.";
  } else if (amount > MAX_PRICE) {
    errors.amount = "The price must be below 10,000,000.";
  } else if (Number(amount.toFixed(2)) !== amount) {
    errors.amount = "Use at most two decimal places.";
  }

  if (!isValidDateOnly(effectiveDate)) {
    errors.effectiveDate = "Choose a valid effective date.";
  } else if (effectiveDate > "2100-12-31") {
    errors.effectiveDate = "Choose a date before 2101.";
  } else if (effectiveDate < "2000-01-01") {
    errors.effectiveDate = "Choose a date after 1999.";
  } else {
    const clash = prices.find(
      (price) =>
        price.effectiveDate === effectiveDate &&
        price.id !== priceId &&
        !price.isDeleted,
    );
    if (clash) {
      errors.effectiveDate = `A price is already effective on ${effectiveDate}. Edit that entry instead.`;
    }
  }

  if (normalizeText(input.note).length > 200) {
    errors.note = "Keep the note under 200 characters.";
  }

  return result(errors);
}

export function validateEmail(value) {
  const email = normalizeText(value);
  if (!email) return "Email is required.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return null;
}

export function validateRegistration({ name, email, password, confirmPassword }) {
  const errors = {};
  const cleanName = normalizeText(name);
  const cleanEmail = normalizeText(email);

  if (!cleanName) {
    errors.name = "Full name is required.";
  } else if (cleanName.length > 120) {
    errors.name = "Keep your name under 120 characters.";
  }

  if (!cleanEmail) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(cleanEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (String(password).length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = "The passwords do not match.";
  }

  return result(errors);
}

export function validatePasswordPair(password, confirmPassword) {
  const errors = {};
  if (!password) {
    errors.password = "Password is required.";
  } else if (String(password).length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = "The passwords do not match.";
  }
  return result(errors);
}
