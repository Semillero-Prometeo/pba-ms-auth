const { readFileSync } = require('fs');
const { join } = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const seed = readFileSync(join(__dirname, '../prisma/seed/document-types.seed.ts'), 'utf8');
const schema = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf8');
const sql = readFileSync(
  join(__dirname, '../prisma/migrations/20261015010000_colombian_document_types/migration.sql'),
  'utf8',
);

describe('colombian document types', () => {
  it('seeds cédula, tarjeta de identidad and otro only', () => {
    assert.match(seed, /Cédula de ciudadanía/);
    assert.match(seed, /Tarjeta de identidad/);
    assert.match(seed, /Otro/);
    assert.equal(seed.includes('Pasaporte'), false);
    assert.equal(seed.includes('Identificacion Nacional'), false);
    assert.equal(seed.includes('Permiso de Residencia'), false);
  });

  it('enum is NATIONAL_ID, IDENTITY_CARD and OTHER', () => {
    const block = schema.slice(schema.indexOf('enum DocumentTypes'), schema.indexOf('enum AppSettings'));
    assert.match(block, /NATIONAL_ID/);
    assert.match(block, /IDENTITY_CARD/);
    assert.match(block, /OTHER/);
    assert.equal(block.includes('PASSPORT'), false);
    assert.equal(block.includes('FOREIGNER_ID'), false);
    assert.equal(block.includes('RESIDENCY_PERMISSION'), false);
  });

  it('migration remaps leftover types to Otro', () => {
    assert.match(sql, /IDENTITY_CARD/);
    assert.match(sql, /Tarjeta de identidad/);
  });
});
