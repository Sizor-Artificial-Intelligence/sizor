-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `password` TEXT NOT NULL,
    `nextPathSignup` VARCHAR(191) NULL DEFAULT '/auth/signup/company/',
    `codeVerification` VARCHAR(191) NULL,
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `isGoogle` BOOLEAN NOT NULL DEFAULT false,
    `routesAllowed` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NOT NULL DEFAULT 'https://firebasestorage.googleapis.com/v0/b/chatzy-bca9e.firebasestorage.app/o/default-avatar-icon-of-social-media-user-vector.jpg?alt=media&token=970f912c-6aa7-4d7d-9cf1-4970a1411624',

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `initialsName` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NULL,
    `conectedWithCalendar` BOOLEAN NOT NULL DEFAULT false,
    `googleCalendarId` TEXT NULL,
    `googleAccessToken` TEXT NULL,
    `googleRefreshToken` TEXT NULL,
    `googleTokenExpiry` DATETIME(3) NULL,
    `googleCalendarName` TEXT NULL,
    `googleCalendarEmail` TEXT NULL,
    `SETT_IA_RESPONSE` BOOLEAN NOT NULL DEFAULT true,
    `NOTT_METHOD` VARCHAR(191) NOT NULL DEFAULT 'app',
    `NOTT_FORM_SUBMISSION` BOOLEAN NOT NULL DEFAULT true,
    `NOTT_APPOINTMENT_CREATED` BOOLEAN NOT NULL DEFAULT true,
    `NOTT_APPOINTMENT_MODIFIED` BOOLEAN NOT NULL DEFAULT true,
    `NOTT_APPOINTMENT_CANCELLED` BOOLEAN NOT NULL DEFAULT true,
    `NOTT_CHAT_ASSIGNED_TO_HUMAN` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `dateStartSubscription` DATETIME(3) NULL,
    `datePay` DATETIME(3) NULL,
    `daysToExpireSubscription` INTEGER NOT NULL DEFAULT 30,
    `pendingPayment` BOOLEAN NOT NULL DEFAULT false,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `maxContacts` INTEGER NOT NULL DEFAULT 7,
    `contactsUsed` INTEGER NOT NULL DEFAULT 0,
    `contactsUnlimited` BOOLEAN NOT NULL DEFAULT false,
    `maxAgents` INTEGER NOT NULL DEFAULT 1,
    `agentsUsed` INTEGER NOT NULL DEFAULT 0,
    `agentsUnlimited` BOOLEAN NOT NULL DEFAULT false,
    `maxTokens` DOUBLE NOT NULL DEFAULT 10000,
    `tokensUsed` INTEGER NOT NULL DEFAULT 0,
    `maxSocialMedia` INTEGER NOT NULL DEFAULT 1,
    `socialMediaUsed` INTEGER NOT NULL DEFAULT 0,
    `baseTokens` DOUBLE NOT NULL DEFAULT 10000,
    `additionalTokens` DOUBLE NOT NULL DEFAULT 0,
    `additionalTokensUsed` DOUBLE NOT NULL DEFAULT 0,
    `additionalTokensType` VARCHAR(191) NULL,
    `additionalTokensPrice` DOUBLE NOT NULL DEFAULT 0,
    `additionalTokensExpiry` DATETIME(3) NULL,
    `facebookConnected` BOOLEAN NOT NULL DEFAULT false,
    `whatsappConnected` BOOLEAN NOT NULL DEFAULT false,
    `instagramConnected` BOOLEAN NOT NULL DEFAULT false,
    `webConnected` BOOLEAN NOT NULL DEFAULT false,
    `API_TOKEN_FACEBOOK` TEXT NULL,
    `ACCOUNT_ID_FACEBOOK` TEXT NULL,
    `API_TOKEN_INSTAGRAM` TEXT NULL,
    `ACCOUNT_ID_INSTAGRAM` TEXT NULL,
    `API_TOKEN_WHATSAPP` TEXT NULL,
    `ACCOUNT_ID_WHATSAPP` TEXT NULL,
    `agentId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCompany` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `License` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `maxUsers` INTEGER NOT NULL DEFAULT 1,
    `maxLicenses` INTEGER NOT NULL DEFAULT 1,
    `usersUnlimited` BOOLEAN NOT NULL DEFAULT false,
    `usersUsed` INTEGER NOT NULL DEFAULT 1,
    `subdomain` VARCHAR(191) NULL,
    `nameEnterprise` VARCHAR(191) NULL,
    `parentTenantId` VARCHAR(191) NULL,
    `nameParent` VARCHAR(191) NULL,
    `isEnterprise` BOOLEAN NOT NULL DEFAULT false,
    `isSon` BOOLEAN NOT NULL DEFAULT false,
    `hasPremium` BOOLEAN NOT NULL DEFAULT false,
    `dateLastVerification` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TokenTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `tokensAmount` DOUBLE NOT NULL,
    `price` DOUBLE NOT NULL,
    `increaseType` VARCHAR(191) NULL,
    `expiryDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `name` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `origin` VARCHAR(191) NOT NULL DEFAULT 'Manual',
    `senderId` VARCHAR(191) NULL,
    `respondWithIa` BOOLEAN NOT NULL DEFAULT false,
    `agentId` VARCHAR(191) NULL,
    `resumeConversation` TEXT NULL,
    `threadId` TEXT NULL,
    `sentiment` VARCHAR(191) NULL DEFAULT 'neutral',
    `leadTemperature` VARCHAR(191) NULL DEFAULT 'cold',
    `assignedUserId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `content` TEXT NULL,
    `sender` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `timestamp` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNREAD',
    `type` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `attachments` TEXT NULL,
    `companyId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomField` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fieldType` VARCHAR(191) NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `options` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactCustomFieldValue` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `customFieldId` VARCHAR(191) NOT NULL,
    `value` TEXT NULL,

    UNIQUE INDEX `ContactCustomFieldValue_contactId_customFieldId_key`(`contactId`, `customFieldId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Form` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Form_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormField` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `formId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `fieldType` VARCHAR(191) NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `placeholder` VARCHAR(191) NULL,
    `options` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormResponse` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `formId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormResponseValue` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `formResponseId` VARCHAR(191) NOT NULL,
    `formFieldId` VARCHAR(191) NOT NULL,
    `value` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `FormResponseValue_formResponseId_formFieldId_key`(`formResponseId`, `formFieldId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agent` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `instructions` TEXT NOT NULL,
    `canManageAppointments` BOOLEAN NOT NULL DEFAULT false,
    `canCollectFormData` BOOLEAN NOT NULL DEFAULT false,
    `canAccessPortfolio` BOOLEAN NOT NULL DEFAULT false,
    `formId` VARCHAR(191) NULL,
    `limitations` TEXT NULL,
    `escalationRules` TEXT NULL,
    `assistantId` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NULL,
    `path` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reaction` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `emoji` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Reaction_messageId_senderId_emoji_key`(`messageId`, `senderId`, `emoji`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Portfolio` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DOUBLE NULL,
    `imageUrl` TEXT NULL,

    INDEX `Portfolio_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiKey` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastUsed` DATETIME(3) NULL,

    INDEX `ApiKey_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiKeyLicense` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `apiKeyId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    INDEX `ApiKeyLicense_apiKeyId_idx`(`apiKeyId`),
    INDEX `ApiKeyLicense_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `ApiKeyLicense_apiKeyId_tenantId_key`(`apiKeyId`, `tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingFolder` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `TrainingFolder_companyId_idx`(`companyId`),
    INDEX `TrainingFolder_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingFile` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ready',

    INDEX `TrainingFile_companyId_idx`(`companyId`),
    INDEX `TrainingFile_folderId_idx`(`folderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentTrainingFolder` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,

    INDEX `AgentTrainingFolder_agentId_idx`(`agentId`),
    INDEX `AgentTrainingFolder_folderId_idx`(`folderId`),
    UNIQUE INDEX `AgentTrainingFolder_agentId_folderId_key`(`agentId`, `folderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentTrainingFile` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,

    INDEX `AgentTrainingFile_agentId_idx`(`agentId`),
    INDEX `AgentTrainingFile_fileId_idx`(`fileId`),
    UNIQUE INDEX `AgentTrainingFile_agentId_fileId_key`(`agentId`, `fileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plan` ADD CONSTRAINT `Plan_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCompany` ADD CONSTRAINT `UserCompany_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCompany` ADD CONSTRAINT `UserCompany_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TokenTransaction` ADD CONSTRAINT `TokenTransaction_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TokenTransaction` ADD CONSTRAINT `TokenTransaction_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomField` ADD CONSTRAINT `CustomField_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactCustomFieldValue` ADD CONSTRAINT `ContactCustomFieldValue_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactCustomFieldValue` ADD CONSTRAINT `ContactCustomFieldValue_customFieldId_fkey` FOREIGN KEY (`customFieldId`) REFERENCES `CustomField`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Form` ADD CONSTRAINT `Form_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormField` ADD CONSTRAINT `FormField_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponse` ADD CONSTRAINT `FormResponse_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponse` ADD CONSTRAINT `FormResponse_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponse` ADD CONSTRAINT `FormResponse_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponseValue` ADD CONSTRAINT `FormResponseValue_formResponseId_fkey` FOREIGN KEY (`formResponseId`) REFERENCES `FormResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormResponseValue` ADD CONSTRAINT `FormResponseValue_formFieldId_fkey` FOREIGN KEY (`formFieldId`) REFERENCES `FormField`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Portfolio` ADD CONSTRAINT `Portfolio_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiKeyLicense` ADD CONSTRAINT `ApiKeyLicense_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `ApiKey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingFolder` ADD CONSTRAINT `TrainingFolder_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingFolder` ADD CONSTRAINT `TrainingFolder_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `TrainingFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingFile` ADD CONSTRAINT `TrainingFile_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingFile` ADD CONSTRAINT `TrainingFile_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `TrainingFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTrainingFolder` ADD CONSTRAINT `AgentTrainingFolder_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTrainingFolder` ADD CONSTRAINT `AgentTrainingFolder_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `TrainingFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTrainingFile` ADD CONSTRAINT `AgentTrainingFile_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTrainingFile` ADD CONSTRAINT `AgentTrainingFile_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `TrainingFile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
