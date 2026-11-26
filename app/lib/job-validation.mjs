export function validateJobInput(input) {
  const code = typeof input?.code === "string" ? input.code.trim().toUpperCase() : "";
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";

  const errors = {};

  if (!code) {
    errors.code = "Job code is required.";
  } else if (code.length > 20) {
    errors.code = "Job code must be 20 characters or fewer.";
  }

  if (!title) {
    errors.title = "Job title is required.";
  } else if (title.length > 100) {
    errors.title = "Job title must be 100 characters or fewer.";
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

  if (Object.keys(errors).length > 0) return { errors };

  return {
    value: {
      code,
      title,
      description: description || null,
    },
  };
}
