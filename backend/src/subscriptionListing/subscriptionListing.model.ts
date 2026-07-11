import { model, Schema } from "mongoose";
import { ISubscriptionListing, SubscriptionListingType } from "@/types/subscriptionListing.types";

const SubscriptionListingSchema = new Schema<ISubscriptionListing>({
	name: { type: String, required: true, trim: true },
	description: { type: String, trim: true },
	type: { type: String, enum: Object.values(SubscriptionListingType), required: true },
	customTypeText: {
		type: String,
		trim: true,
		required: function () { return this.type === 'custom'; }
	},
	durationInDays: { type: Number, required: true },
	gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true },
	cost: { type: Number, required: true },
	currency: { type: String, required: true },
	discount: {
		amount: { type: Number },
		type: { type: String, enum: ['percentage', 'fixed'] },
		validUntil: { type: Date }
	},
	isActive: { type: Boolean, default: true },
	isRecurring: { type: Boolean },
	features: [{ type: String }],
	startDate: { type: Date },
	endDate: { type: Date }
}, {
	timestamps: true
});

SubscriptionListingSchema.index({ gymId: 1, isActive: 1 });

export const SubscriptionListing = model<ISubscriptionListing>('SubscriptionListing', SubscriptionListingSchema);
