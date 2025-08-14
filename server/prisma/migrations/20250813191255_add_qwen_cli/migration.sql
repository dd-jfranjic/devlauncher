-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "paths" TEXT NOT NULL,
    "ports" TEXT NOT NULL,
    "dockerProject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "claudeCli" TEXT NOT NULL DEFAULT '{"installed":false}',
    "geminiCli" TEXT NOT NULL DEFAULT '{"installed":false}',
    "qwenCli" TEXT NOT NULL DEFAULT '{"installed":false}',
    "urlResolver" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("claudeCli", "createdAt", "dockerProject", "geminiCli", "id", "location", "name", "paths", "ports", "slug", "status", "type", "updatedAt", "urlResolver") SELECT "claudeCli", "createdAt", "dockerProject", "geminiCli", "id", "location", "name", "paths", "ports", "slug", "status", "type", "updatedAt", "urlResolver" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE INDEX "Project_slug_idx" ON "Project"("slug");
CREATE INDEX "Project_status_idx" ON "Project"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
