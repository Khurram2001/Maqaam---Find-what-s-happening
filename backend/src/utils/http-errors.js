function appError({ message, status, code, details }) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details !== undefined) {
    err.details = details;
  }
  return err;
}

function validationError(zodError, message = "Invalid request body") {
  return appError({
    message,
    status: 400,
    code: "VALIDATION_ERROR",
    details: zodError.flatten(),
  });
}

function forbiddenError(message = "Forbidden") {
  return appError({ message, status: 403, code: "FORBIDDEN" });
}

function notFoundError(message = "Not found") {
  return appError({ message, status: 404, code: "NOT_FOUND" });
}

function conflictError(message) {
  return appError({ message, status: 409, code: "CONFLICT" });
}

function unauthenticatedError(message = "Unauthenticated") {
  return appError({ message, status: 401, code: "UNAUTHENTICATED" });
}

function badRequestError(message) {
  return appError({ message, status: 400, code: "VALIDATION_ERROR" });
}

module.exports = {
  validationError,
  forbiddenError,
  notFoundError,
  conflictError,
  unauthenticatedError,
  badRequestError,
};
