CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'LINK', 'PUBLIC');
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
CREATE TYPE "BackgroundMode" AS ENUM ('TRANSPARENT', 'SOLID', 'CHECKERBOARD');
CREATE TYPE "OperationType" AS ENUM ('PIXELS_SET', 'CANVAS_CLEAR', 'CANVAS_RESIZE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE "Session" (
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
  "thumbnailUrl" TEXT,
  "allowGuests" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectMember" (
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ProjectRole" NOT NULL DEFAULT 'VIEWER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId", "userId")
);

CREATE TABLE "ProjectPalette" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "colors" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectPalette_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Canvas" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "backgroundMode" "BackgroundMode" NOT NULL DEFAULT 'CHECKERBOARD',
  "currentSnapshotId" TEXT,
  "currentSequence" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Canvas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CanvasSnapshot" (
  "id" TEXT NOT NULL,
  "canvasId" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "encodedPixelData" TEXT NOT NULL,
  "sequenceNumber" INTEGER NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanvasSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CanvasOperation" (
  "id" TEXT NOT NULL,
  "canvasId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sequenceNumber" INTEGER NOT NULL,
  "operationType" "OperationType" NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanvasOperation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CanvasVersion" (
  "id" TEXT NOT NULL,
  "canvasId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanvasVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invite" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "role" "ProjectRole" NOT NULL DEFAULT 'VIEWER',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX "Project_visibility_updatedAt_idx" ON "Project"("visibility", "updatedAt");
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");
CREATE INDEX "ProjectPalette_projectId_idx" ON "ProjectPalette"("projectId");
CREATE INDEX "Canvas_projectId_idx" ON "Canvas"("projectId");
CREATE INDEX "Canvas_currentSnapshotId_idx" ON "Canvas"("currentSnapshotId");
CREATE UNIQUE INDEX "CanvasSnapshot_canvasId_sequenceNumber_key" ON "CanvasSnapshot"("canvasId", "sequenceNumber");
CREATE INDEX "CanvasSnapshot_createdById_idx" ON "CanvasSnapshot"("createdById");
CREATE UNIQUE INDEX "CanvasOperation_canvasId_sequenceNumber_key" ON "CanvasOperation"("canvasId", "sequenceNumber");
CREATE INDEX "CanvasOperation_userId_idx" ON "CanvasOperation"("userId");
CREATE INDEX "CanvasVersion_canvasId_createdAt_idx" ON "CanvasVersion"("canvasId", "createdAt");
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");
CREATE INDEX "Invite_projectId_idx" ON "Invite"("projectId");
CREATE INDEX "Invite_expiresAt_idx" ON "Invite"("expiresAt");
CREATE INDEX "ActivityLog_projectId_createdAt_idx" ON "ActivityLog"("projectId", "createdAt");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectPalette" ADD CONSTRAINT "ProjectPalette_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CanvasSnapshot" ADD CONSTRAINT "CanvasSnapshot_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CanvasSnapshot" ADD CONSTRAINT "CanvasSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CanvasOperation" ADD CONSTRAINT "CanvasOperation_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CanvasOperation" ADD CONSTRAINT "CanvasOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CanvasSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
