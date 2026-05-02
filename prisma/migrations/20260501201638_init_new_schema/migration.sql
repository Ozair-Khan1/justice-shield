-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ATTORNEY', 'ADMIN');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('ATTORNEY', 'MARKETING_SPECIALIST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "full_name" TEXT,
    "phone" TEXT,
    "firm_name" TEXT,
    "specialties" TEXT,
    "bar_number" TEXT,
    "years_experience" INTEGER DEFAULT 0,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "membership_tier" TEXT NOT NULL DEFAULT 'basic',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "encounter_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "location_address" TEXT,
    "notes" TEXT,
    "attorney_name" TEXT,
    "recording_url" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncounterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CivilIntake" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "matter_type" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'standard',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferred_contact" TEXT NOT NULL DEFAULT 'phone',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_attorney_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivilIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyAlert" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorApplication" (
    "id" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "full_name" TEXT NOT NULL,
    "firm_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "website" TEXT,
    "specialties" TEXT,
    "bar_number" TEXT,
    "years_experience" INTEGER DEFAULT 0,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "EncounterSession_user_id_idx" ON "EncounterSession"("user_id");

-- CreateIndex
CREATE INDEX "EncounterSession_status_idx" ON "EncounterSession"("status");

-- CreateIndex
CREATE INDEX "CivilIntake_user_id_idx" ON "CivilIntake"("user_id");

-- CreateIndex
CREATE INDEX "CivilIntake_status_idx" ON "CivilIntake"("status");

-- CreateIndex
CREATE INDEX "CivilIntake_assigned_attorney_id_idx" ON "CivilIntake"("assigned_attorney_id");

-- CreateIndex
CREATE INDEX "EmergencyAlert_user_id_idx" ON "EmergencyAlert"("user_id");

-- CreateIndex
CREATE INDEX "EmergencyAlert_session_id_idx" ON "EmergencyAlert"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorApplication_email_key" ON "VendorApplication"("email");

-- CreateIndex
CREATE INDEX "VendorApplication_status_idx" ON "VendorApplication"("status");

-- CreateIndex
CREATE INDEX "Otp_email_idx" ON "Otp"("email");

-- CreateIndex
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

-- AddForeignKey
ALTER TABLE "EncounterSession" ADD CONSTRAINT "EncounterSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CivilIntake" ADD CONSTRAINT "CivilIntake_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CivilIntake" ADD CONSTRAINT "CivilIntake_assigned_attorney_id_fkey" FOREIGN KEY ("assigned_attorney_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "EncounterSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
