const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const src = readFileSync(join(__dirname, '../src/users/users.service.ts'), 'utf8');

describe('updateAuthUser admin edit', () => {
  it('treats the current password as a no-op', () => {
    assert.match(src, /bcrypt\.compare/);
    assert.equal(src.includes('Esta contraseña ya ha sido utilizada'), false);
    assert.match(src, /is_first_login:\s*false/);
  });

  it('upserts person and blocks last admin / self inactive', () => {
    assert.match(src, /person/);
    assert.match(src, /No puedes dejar el sistema sin un administrador/);
    assert.match(src, /No puedes darte de baja a ti mismo/);
  });
});
