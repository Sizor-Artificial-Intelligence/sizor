-- AlterTable
ALTER TABLE `Company` ADD COLUMN `copilotUnlimited` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `CopilotTokenUsage` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `tokensUsed` INTEGER NOT NULL DEFAULT 0,

    INDEX `CopilotTokenUsage_companyId_idx`(`companyId`),
    INDEX `CopilotTokenUsage_date_idx`(`date`),
    UNIQUE INDEX `CopilotTokenUsage_companyId_date_key`(`companyId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CopilotTokenUsage` ADD CONSTRAINT `CopilotTokenUsage_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
