

//API Error class
export class ApiError extends Error {
  constructor(message, cause = null, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (cause) {
      this.cause = cause;
    }
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }}

  //Specific error classes
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', cause = null) {
    super(message, cause, 404);
    this.name = 'NotFoundError';
  } }

  // validation error
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', cause = null) {
    super(message, cause, 400);
    this.name = 'ValidationError';
  }}

  //unauthorized error
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', cause = null) {
    super(message, cause, 401);
    this.name = 'UnauthorizedError';
  }}

  //conflict error
export class ConflictError extends ApiError {
  constructor(message = 'Conflict occurred', cause = null) {
    super(message, cause, 409);
    this.name = 'ConflictError';
  }}

  //internal server error
export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', cause = null) {
    super(message, cause, 500);
    this.name = 'InternalServerError';
  }}

