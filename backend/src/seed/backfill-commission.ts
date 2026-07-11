/**
 * One-time backfill script for existing paid payments.
 * Adds commission fields to payments that were created before the commission system.
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/seed/backfill-commission.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Payment } from "@/payment/payment.model";
import { Subscription } from "@/subscription/subscription.model";
import { SubscriptionListing } from "@/subscriptionListing/subscriptionListing.model";
import { Gym } from "@/gym/gym.model";
import {
  PlatformSettings,
  getOrCreateSettings,
} from "@/platformSettings/platformSettings.model";

async function backfill() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("No MONGODB_URI or MONGO_URI found in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // Ensure platform settings exist
  const settings = await getOrCreateSettings();
  console.log(`Platform settings: commission rate = ${settings.defaultCommissionRate}%`);

  // Find paid payments without commission data
  const payments = await Payment.find({
    status: "paid",
    gymOwnerId: { $exists: false },
  });

  console.log(`Found ${payments.length} payments to backfill`);

  let updated = 0;
  let skipped = 0;

  for (const payment of payments) {
    try {
      if (!payment.subscriptionId) {
        skipped++;
        continue;
      }

      const subscription = await Subscription.findById(payment.subscriptionId);
      if (!subscription) {
        skipped++;
        continue;
      }

      const listing = await SubscriptionListing.findById(
        (subscription as any).subscriptionListingId
      );
      if (!listing) {
        skipped++;
        continue;
      }

      const gym = await Gym.findById(listing.gymId);
      if (!gym || !gym.ownerId) {
        skipped++;
        continue;
      }

      const commissionRate =
        gym.commissionRate != null
          ? gym.commissionRate
          : settings.defaultCommissionRate;
      const commissionAmount = Math.round(
        (payment.amount * commissionRate) / 100
      );
      const gymOwnerShare = payment.amount - commissionAmount;

      await Payment.findByIdAndUpdate(payment._id, {
        gymId: gym._id,
        gymOwnerId: gym.ownerId,
        commissionRate,
        commissionAmount,
        gymOwnerShare,
        payoutStatus: "unpaid",
      });

      updated++;
    } catch (err) {
      console.error(
        `Error processing payment ${payment._id}: ${(err as Error).message}`
      );
      skipped++;
    }
  }

  console.log(`Backfill complete: ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
