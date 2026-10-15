const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const create = readFileSync(join(__dirname, '../src/users/dto/create-user.dto.ts'), 'utf8');
const update = readFileSync(join(__dirname, '../src/users/dto/update-user.dto.ts'), 'utf8');

describe('auth user DTOs', () => {
  it('requires password, role_ids and person on create', () => {
    assert.match(create, /class PersonInputDto/);
    assert.match(create, /first_name: string/);
    assert.match(create, /document_number: string/);
    assert.match(create, /person: PersonInputDto/);
    assert.match(create, /ArrayMinSize\(1\)/);
    assert.equal(create.includes('assign_student_role'), false);
  });

  it('allows optional person on update', () => {
    assert.match(update, /person\?: PersonInputDto/);
  });
});
