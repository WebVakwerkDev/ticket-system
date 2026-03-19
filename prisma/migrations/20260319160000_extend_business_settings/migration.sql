ALTER TABLE "business_settings"
ADD COLUMN "defaultVatRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
ADD COLUMN "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "defaultQuoteValidDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "defaultPriceLabel" TEXT NOT NULL DEFAULT 'Projectprijs',
ADD COLUMN "quoteFooterText" TEXT,
ADD COLUMN "invoiceFooterText" TEXT,
ADD COLUMN "defaultTermsText" TEXT,
ADD COLUMN "emailSignature" TEXT;
