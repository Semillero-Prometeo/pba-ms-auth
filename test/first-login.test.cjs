const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const auth = readFileSync(join(__dirname, '../src/auth/auth.service.ts'), 'utf8');

describe('first login', () => {
  it('does not return a resetToken instead of a session JWT', () => {
    const validate = auth.slice(auth.indexOf('async validateUser'), auth.indexOf('async login'));
    assert.equal(validate.includes('resetToken'), false);
    assert.equal(validate.includes('requiresPasswordChange'), false);
    assert.match(validate, /is_first_login:\s*false/);
  });
});
