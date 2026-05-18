BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[AdminUser] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [username] NVARCHAR(100) NOT NULL,
    [passwordHash] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AdminUser_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AdminUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AdminUser_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[Quiz] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [description] NVARCHAR(max),
    [backgroundUrl] NVARCHAR(1000),
    [primaryColor] CHAR(7) NOT NULL CONSTRAINT [Quiz_primaryColor_df] DEFAULT '#1A1815',
    [accentColor] CHAR(7) NOT NULL CONSTRAINT [Quiz_accentColor_df] DEFAULT '#C4A572',
    [textColor] CHAR(7) NOT NULL CONSTRAINT [Quiz_textColor_df] DEFAULT '#F4EFE6',
    [fontKey] NVARCHAR(50) NOT NULL CONSTRAINT [Quiz_fontKey_df] DEFAULT 'playfair-display',
    [isActive] BIT NOT NULL CONSTRAINT [Quiz_isActive_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Quiz_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Quiz_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Question] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [quizId] UNIQUEIDENTIFIER NOT NULL,
    [text] NVARCHAR(max) NOT NULL,
    [imageUrl] NVARCHAR(1000),
    [durationSec] INT NOT NULL,
    [difficulty] INT NOT NULL,
    [orderIndex] INT NOT NULL CONSTRAINT [Question_orderIndex_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Question_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Question_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Question_quizId_orderIndex_idx] ON [dbo].[Question]([quizId], [orderIndex]);

-- AddForeignKey
ALTER TABLE [dbo].[Question] ADD CONSTRAINT [Question_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- Filtered unique index: aynı anda en fazla bir aktif quiz garantisi.
-- Prisma şema dilinde `WHERE` filter'lı unique ifade edilemediği için manuel SQL.
CREATE UNIQUE INDEX [UX_Quiz_OnlyOneActive]
  ON [dbo].[Quiz]([isActive])
  WHERE [isActive] = 1;

-- Check constraint: difficulty 1-5 arası. Uygulama tarafı zod ile zorlar,
-- bu DB-level kontrol çift savunma sağlar.
ALTER TABLE [dbo].[Question] ADD CONSTRAINT [CK_Question_Difficulty]
  CHECK ([difficulty] >= 1 AND [difficulty] <= 5);

-- Check constraint: durationSec 5-600 saniye arası.
ALTER TABLE [dbo].[Question] ADD CONSTRAINT [CK_Question_DurationSec]
  CHECK ([durationSec] >= 5 AND [durationSec] <= 600);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

