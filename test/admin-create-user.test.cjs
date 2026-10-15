const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const root = join(__dirname, '..');
const src = readFileSync(join(root, 'src/users/repositories/users.repository.ts'), 'utf8');
const dto = readFileSync(join(root, 'src/users/dto/create-user.dto.ts'), 'utf8');
const svc = readFileSync(join(root, 'src/users/users.service.ts'), 'utf8');

describe('admin create user', () => {
  it('validates plaintext password before hashing', () => {
    assert.match(dto, /password: string/);
    assert.match(dto, /role_ids/);
    const validateAt = src.indexOf('validatePassword(');
    const hashAt = src.indexOf('hashSync');
    assert.ok(validateAt > -1);
    assert.ok(hashAt > validateAt);
    assert.match(src, /createUserDto\.password/);
    assert.equal(src.includes('generateTemporaryPassword'), false);
  });

  it('does not assign STUDENT by default', () => {
    assert.equal(svc.includes('assignStudentRole'), false);
    assert.equal(svc.includes('Roles.STUDENT'), false);
  });
});
