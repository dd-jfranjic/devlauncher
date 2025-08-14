-- CreateTable
CREATE TABLE "SystemService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "ports" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "version" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemService_name_key" ON "SystemService"("name");

-- CreateIndex
CREATE INDEX "SystemService_name_idx" ON "SystemService"("name");

-- CreateIndex
CREATE INDEX "SystemService_type_idx" ON "SystemService"("type");

-- CreateIndex
CREATE INDEX "SystemService_status_idx" ON "SystemService"("status");
