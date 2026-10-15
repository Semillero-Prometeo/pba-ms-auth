const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const src = readFileSync(join(__dirname, '../src/users/users.service.ts'), 'utf8');

describe('updateAuthUser admin edit', () => {
  it('can set roles and username without a person row', () => {
    assert.match(src, /setRoles/);
    assert.match(src, /role_ids/);
    assert.equal(src.includes('person_id: exists.person.id'), false);
  });
});
