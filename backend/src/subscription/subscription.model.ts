import { Schema, model } from 'mongoose';
import { ISubscription, SubscriptionStatus } from '@/types/subscription.types';

const SubscriptionSchema = new Schema<ISubscription>({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    subscriptionListingId: { 
        type: Schema.Types.ObjectId, 
        ref: 'SubscriptionListing', 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    status: { 
        type: String, 
        enum: Object.values(SubscriptionStatus), 
        default: SubscriptionStatus.ACTIVE },
    isRecurring: { 
        type: Boolean, 
        default: false 
    }
}, {
    timestamps: true
});

SubscriptionSchema.index({ userId: 1, subscriptionListingId: 1, status: 1 });

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);
