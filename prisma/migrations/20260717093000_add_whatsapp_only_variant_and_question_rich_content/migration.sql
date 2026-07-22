-- Variant: whole-variant WhatsApp-only flag.
ALTER TABLE "Variant" ADD COLUMN "isWhatsappOnly" BOOLEAN NOT NULL DEFAULT false;

-- QuestionTemplate: single vs multi select, plus optional help text shown
-- under the question title on the storefront.
ALTER TABLE "QuestionTemplate" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'single';
ALTER TABLE "QuestionTemplate" ADD COLUMN "helpText" TEXT;

-- QuestionTemplateOption: richer per-option presentation.
ALTER TABLE "QuestionTemplateOption" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "QuestionTemplateOption" ADD COLUMN "description" TEXT;
ALTER TABLE "QuestionTemplateOption" ADD COLUMN "defaultChecked" BOOLEAN NOT NULL DEFAULT false;
