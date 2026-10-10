import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middlewares/error.middleware.js';

test('Error Middleware - Production-Grade Formatting', async (t) => {
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      jsonPayload: null,
      json(data) {
        this.jsonPayload = data;
        return this;
      },
    };
    return res;
  };

  await t.test('formats Mongoose ValidationError with 400 Bad Request', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        password: { message: 'Password is required' },
      },
    };
    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.success, false);
    assert.match(res.jsonPayload.message, /Email is required/);
  });

  await t.test('formats Mongoose CastError with 400 Bad Request', () => {
    const err = {
      name: 'CastError',
      path: '_id',
      value: 'invalid_mongo_id',
    };
    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.success, false);
    assert.match(res.jsonPayload.message, /Invalid ID format/);
  });

  await t.test('formats duplicate key error with 409 Conflict', () => {
    const err = {
      code: 11000,
      keyValue: { email: 'duplicate@domain.com' },
    };
    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, 409);
    assert.equal(res.jsonPayload.success, false);
    assert.match(res.jsonPayload.message, /Duplicate entry for email/);
  });

  await t.test('formats JWT error with 401 Unauthorized', () => {
    const err = {
      name: 'JsonWebTokenError',
    };
    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonPayload.success, false);
    assert.match(res.jsonPayload.message, /Not authorized/);
  });
});
