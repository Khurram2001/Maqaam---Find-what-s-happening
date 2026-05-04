-- Allow deleting a user who owns events: owned events (and EventImages) cascade.
-- Approver / rejector FKs already use ON DELETE SET NULL in the initial migration.
ALTER TABLE "Event" DROP CONSTRAINT "Event_userId_fkey";

ALTER TABLE "Event"
ADD CONSTRAINT "Event_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
