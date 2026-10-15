UPDATE "document_type" SET "name" = 'Cédula de ciudadanía', "updated_at" = CURRENT_TIMESTAMP
WHERE "short_name" = 'NATIONAL_ID';

UPDATE "document_type" SET "name" = 'Otro', "updated_at" = CURRENT_TIMESTAMP
WHERE "short_name" = 'OTHER';

UPDATE "person"
SET "document_type_id" = (SELECT "id" FROM "document_type" WHERE "short_name" = 'OTHER')
WHERE "document_type_id" IN (
  SELECT "id" FROM "document_type"
  WHERE "short_name" IN ('PASSPORT', 'RESIDENCY_PERMISSION', 'FOREIGNER_ID')
);

DELETE FROM "document_type"
WHERE "short_name" IN ('PASSPORT', 'RESIDENCY_PERMISSION', 'FOREIGNER_ID');

CREATE TYPE "DocumentTypes_new" AS ENUM ('NATIONAL_ID', 'IDENTITY_CARD', 'OTHER');
ALTER TABLE "document_type" ALTER COLUMN "short_name" TYPE "DocumentTypes_new"
  USING ("short_name"::text::"DocumentTypes_new");
DROP TYPE "DocumentTypes";
ALTER TYPE "DocumentTypes_new" RENAME TO "DocumentTypes";

INSERT INTO "document_type" ("id", "short_name", "name", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'IDENTITY_CARD', 'Tarjeta de identidad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "document_type" WHERE "short_name" = 'IDENTITY_CARD'
);
