import { Request, Response } from "express";
import { SubscriptionListing } from "./subscriptionListing.model";
import { ISubscriptionListing } from "@/types/subscriptionListing.types";

// Create a new subscription listing
export const createSubscriptionListing = async (
	req: Request<{}, {}, Omit<ISubscriptionListing, '_id' | 'createdAt' | 'updatedAt'>>,
	res: Response<{success:boolean, created:ISubscriptionListing} | {success:boolean, error: string }>
) => {
	try {
		const listing = await SubscriptionListing.create(req.body);
		res.status(201).json({success:true, created:listing});
	} catch (error) {
		res.status(400).json({success:false, error: (error as Error).message });
	}
};

// Get all subscription listings
export const getSubscriptionListings = async (
	req: Request,
	res: Response
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const type = req.query.type as string;
		const gymId = req.query.gymId as string;

		const filter: Record<string, unknown> = {};
		if (type) filter.type = type;
		if (gymId) filter.gymId = gymId;

		const total = await SubscriptionListing.countDocuments(filter);
		const listings = await SubscriptionListing.find(filter)
			.populate("gymId", "name status")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({
			success: true,
			data: {
				subscriptions: listings,
				total,
				page,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};

// Get a single subscription listing by ID
export const getSubscriptionListingById = async (
	req: Request<{ id: string }>,
	res: Response<ISubscriptionListing | { error: string }>
) => {
	try {
		const listing = await SubscriptionListing.findById(req.params.id);
		if (!listing) return res.status(404).json({ error: "Subscription listing not found" });
		res.json(listing);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

// Update a subscription listing
export const updateSubscriptionListing = async (
    req: Request<{ id: string }, {}, Partial<Omit<ISubscriptionListing, '_id' | 'createdAt' | 'updatedAt'>>>,
    res: Response<
        { success: true; listing: ISubscriptionListing } |
        { success: false; error: string }
    >
) => {
    try {
        const existing = await SubscriptionListing.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, error: "Subscription listing not found" });

        // Merge discount if present
        let updateBody = req.body as any;
        if (req.body.discount) {
            updateBody = {
                ...req.body,
                discount: {
                    ...(existing.discount ?? {}),
                    ...req.body.discount
                }
            };
        }

        const listing = await SubscriptionListing.findByIdAndUpdate(
            req.params.id,
            updateBody,
            { new: true }
        );

        if (!listing) return res.status(404).json({ success: false, error: "Subscription listing not found" });
        res.json({ success: true, data: listing });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};

// Delete a subscription listing
export const deleteSubscriptionListing = async (
	req: Request<{ id: string }>,
	res: Response<{ success:boolean, message: string } | { error: string }>
) => {
	try {
		const listing = await SubscriptionListing.findByIdAndDelete(req.params.id);
		if (!listing) return res.status(404).json({ error: "Subscription listing not found" });
		res.json({ success:true, message: "Subscription listing deleted" });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};
