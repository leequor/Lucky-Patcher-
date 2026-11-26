export function validateDepartmentInput(input) {
  const code =
    typeof input?.code === "string" ? input.code.trim().toUpperCase() : "";
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";

  const errors = {};

  if (!code) {
    errors.code = "Department code is required.";
  } else if (code.length > 20) {
    errors.code = "Department code must be 20 characters or fewer.";
  }

  if (!name) {
    errors.name = "Department name is required.";
  } else if (name.length > 100) {
    errors.name = "Department name must be 100 characters or fewer.";
  }

  if (
    input?.description !== undefined &&
    input.description !== null &&
    typeof input.description !== "string"
  ) {
    errors.description = "Enter a valid description.";
  } else if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    value: {
      code,
      name,
      description: description || null,
    },
  };
}
