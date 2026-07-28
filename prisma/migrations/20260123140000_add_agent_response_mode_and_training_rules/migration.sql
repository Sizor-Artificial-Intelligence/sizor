-- AlterTable
ALTER TABLE `Agent` ADD COLUMN `responseMode` VARCHAR(32) NOT NULL DEFAULT 'instructions_only';

-- CreateTable
CREATE TABLE `AgentTrainingRule` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `trigger` TEXT NOT NULL,
    `response` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `AgentTrainingRule_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AgentTrainingRule` ADD CONSTRAINT `AgentTrainingRule_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
