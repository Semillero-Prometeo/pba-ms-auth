-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'USER', 'STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "DocumentTypes" AS ENUM ('FOREIGNER_ID', 'NATIONAL_ID', 'PASSPORT', 'RESIDENCY_PERMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "AppSettings" AS ENUM ('FRONT_END_URL', 'LOCK_LOGIN_UNTIL', 'LOCK_LOGIN_ATTEMPTS', 'SESSION_EXPIRATION');

-- CreateTable
CREATE TABLE "app_settings" (
    "id" CHAR(36) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "key" "AppSettings" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_type" (
    "id" CHAR(36) NOT NULL,
    "short_name" "DocumentTypes" NOT NULL,
    "name" VARCHAR(45) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" CHAR(36) NOT NULL,
    "name" "Roles" NOT NULL DEFAULT 'USER',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" CHAR(36) NOT NULL,
    "person_id" CHAR(36),
    "username" VARCHAR(120) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "temp_password" VARCHAR(255),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMP(3),
    "is_first_login" BOOLEAN NOT NULL DEFAULT true,
    "deleted_reason" VARCHAR(500),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "role_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" CHAR(36) NOT NULL,
    "moodle_id" INTEGER,
    "document_type_id" CHAR(36) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "document_number" VARCHAR(11),
    "phone" VARCHAR(15),
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "synchronized_at" TIMESTAMP(3),
    "birth_date" TIMESTAMP(3),

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_settings_key_index" ON "app_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "unique_app_settings" ON "app_settings"("key", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_short_name_key" ON "document_type"("short_name");

-- CreateIndex
CREATE INDEX "document_type_name_index" ON "document_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "role_name_index" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_username_index" ON "user"("username");

-- CreateIndex
CREATE INDEX "unique_user_person_id" ON "user"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "unique_session_user_id" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "unique_user_role_role_id" ON "user_role"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_role" ON "user_role"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_moodle_id_key" ON "person"("moodle_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_email_key" ON "person"("email");

-- CreateIndex
CREATE INDEX "idx_person_moodle" ON "person"("moodle_id");

-- CreateIndex
CREATE INDEX "idx_person_email" ON "person"("email");

-- CreateIndex
CREATE INDEX "idx_person_deleted_at" ON "person"("deleted_at");

-- CreateIndex
CREATE INDEX "unique_person_document_type_id" ON "person"("document_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_identification" ON "person"("document_number", "document_type_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
