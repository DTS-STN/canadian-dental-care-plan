export class BaseWebException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name; // Set the exception's name to the class name
    Error.captureStackTrace(this, this.constructor); // Captures the stack trace
  }
}
