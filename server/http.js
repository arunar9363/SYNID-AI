export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const handle = (route) => (req, res, next) => {
  Promise.resolve(route(req, res, next)).catch(next);
};

export function checkFields(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Provide a JSON object.');
  }
  if (Object.keys(body).some(key => !fields.includes(key))) {
    throw new HttpError(400, 'The request contains an unsupported field.');
  }
  return body;
}

export function textField(value, label, limit, { allowEmpty = false, trim = true } = {}) {
  if (typeof value !== 'string' || value.length > limit || (!allowEmpty && !value.trim())) {
    const requirement = allowEmpty ? `up to ${limit}` : `between 1 and ${limit}`;
    throw new HttpError(400, `${label} must be ${requirement} characters.`);
  }
  return trim ? value.trim() : value;
}
