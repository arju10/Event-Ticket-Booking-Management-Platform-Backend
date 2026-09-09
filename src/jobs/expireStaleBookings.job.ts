import { bookingService } from "../modules/booking/booking.service";
import { waitlistService } from "../modules/waitlist/waitlist.service";
import { logger } from "../utils/logger";

const INTERVAL_MS = 60 * 1000; // runs every minute

export function startBackgroundJobs() {
  setInterval(async () => {
    try {
      const expiredBookings = await bookingService.expireStalePendingBookings();
      if (expiredBookings > 0)
        logger.info(`Expired ${expiredBookings} stale PENDING booking(s)`);

      const expiredOffers = await waitlistService.expireLapsedWaitlistOffers();
      if (expiredOffers > 0)
        logger.info(`Expired ${expiredOffers} lapsed waitlist offer(s)`);
    } catch (err) {
      logger.error("Background job failed", { err });
    }
  }, INTERVAL_MS);

  logger.info(
    "Background jobs started (stale booking + waitlist offer expiry, every 60s)",
  );
}
