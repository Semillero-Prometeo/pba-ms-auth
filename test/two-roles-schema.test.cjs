const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const schema = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf8');
const dto = readFileSync(join(__dirname, '../src/person/dto/create-person.dto.ts'), 'utf8');
const sql = readFileSync(
  join(__dirname, '../prisma/migrations/20261015000000_two_roles_person_email/migration.sql'),
  'utf8',
);

describe('two-role schema', () => {
  it('enum has only ADMIN and USER', () => {
    const block = schema.slice(schema.indexOf('enum Roles'), schema.indexOf('enum DocumentTypes'));
    assert.match(block, /ADMIN/);
    assert.match(block, /USER/);
    assert.equal(block.includes('STUDENT'), false);
    assert.equal(block.includes('TEACHER'), false);
  });

  it('person.email is 120 chars', () => {
    assert.match(schema, /email\s+String\s+@unique\s+@db\.VarChar\(120\)/);
    assert.match(dto, /MaxLength\(120/);
  });

  it('migration remaps STUDENT/TEACHER then shrinks the enum', () => {
    assert.match(sql, /STUDENT/);
    assert.match(sql, /TEACHER/);
    assert.match(sql, /VARCHAR\(120\)/);
  });
});
