export function serviceSuccess(data, source, warning = null) {
  return {
    data,
    source,
    warning,
    error: null,
  };
}

export function serviceFailure(error, source = "local", data = null, warning = null) {
  return {
    data,
    source,
    warning,
    error: normalizeError(error),
  };
}

export function normalizeError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return String(error);
}
