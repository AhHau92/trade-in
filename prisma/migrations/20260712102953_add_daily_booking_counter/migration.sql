-- CreateTable
CREATE TABLE "DailyBookingCounter" (
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyBookingCounter_pkey" PRIMARY KEY ("date")
);
