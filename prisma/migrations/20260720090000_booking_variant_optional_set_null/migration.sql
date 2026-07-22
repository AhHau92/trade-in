-- Booking.variantId: RESTRICT -> SET NULL, and made nullable.
--
-- Previously deleting a Product/Variant that any booking referenced was
-- blocked outright (RESTRICT), even though bookings already carry their own
-- productName/variantName/branchName snapshots (see earlier migrations) and
-- don't actually need the live variant row to display correctly. That made
-- it impossible to ever delete a product once a single test (or real, later
-- cancelled) booking existed against it.
--
-- Switching to SET NULL means deleting the variant/product just detaches
-- this column on any booking that referenced it — the booking row, its
-- snapshot fields, and its status/history are completely untouched.

ALTER TABLE "Booking" ALTER COLUMN "variantId" DROP NOT NULL;

ALTER TABLE "Booking" DROP CONSTRAINT "Booking_variantId_fkey";

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
