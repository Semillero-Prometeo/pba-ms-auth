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

  it('creates a person and does not require FRONT_END_URL', () => {
    assert.match(src, /person.create/);
    assert.equal(svc.includes('FRONT_END_URL'), false);
  });

  it('lists users without requiring person_id and hides deleted', () => {
    const repo = readFileSync(join(root, 'src/users/repositories/users.repository.ts'), 'utf8');
    const findAll = repo.slice(repo.indexOf('async findAll'), repo.indexOf('async findOne'));
    assert.equal(findAll.includes('person_id: { not: null }'), false);
    assert.match(findAll, /deleted_at:\s*null/);
  });

  it('creates with is_first_login false so the password works on login', () => {
    const create = src.slice(src.indexOf('async create('), src.indexOf('async update('));
    assert.match(create, /is_first_login:\s*false/);
  });

  it('reactivates an inactive user with the same username', () => {
    assert.match(svc, /deleted_at/);
    assert.match(svc, /Usuario reactivado correctamente/);
  });
});

