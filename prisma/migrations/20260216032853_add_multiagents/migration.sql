-- AlterTable
ALTER TABLE `Agent` ADD COLUMN `isMultiAgent` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `instructions` TEXT NULL;

-- CreateTable
CREATE TABLE `AgentSubAgent` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `mainAgentId` VARCHAR(191) NOT NULL,
    `subAgentId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(64) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `AgentSubAgent_mainAgentId_idx`(`mainAgentId`),
    INDEX `AgentSubAgent_subAgentId_idx`(`subAgentId`),
    UNIQUE INDEX `AgentSubAgent_mainAgentId_subAgentId_key`(`mainAgentId`, `subAgentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AgentSubAgent` ADD CONSTRAINT `AgentSubAgent_mainAgentId_fkey` FOREIGN KEY (`mainAgentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentSubAgent` ADD CONSTRAINT `AgentSubAgent_subAgentId_fkey` FOREIGN KEY (`subAgentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
