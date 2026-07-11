import { Request, Response } from "express";
import { Gym, GymFacility } from "@/gym/gym.model";
import { GymLocationService } from "@/utils/geoLocationService";
import { IGym, IGymFacility } from "@/types/gym.types";
import { UserType } from "@/types/user.types";
import User from "@/user/user.model";
import { sendEmailSafe } from "@/utils/sendEmailSafe";
import logger from "@/utils/logger";


// Create a new gym
export const createGym = async (
	req: Request<{}, {}, any>,
	res: Response<IGym | { error: string }>
) => {
	try {
		const { location, ...gymData } = req.body;

		// If location data is provided, create the location first
		let locationId = gymData.locationId;

		if (location && !locationId) {
			// Create new location
			const newLocation = await GymLocationService.createLocation({
				name: location.name,
				address: {
					street: location.street,
					city: location.city,
					state: location.state,
					zipCode: location.pinCode, // Map pinCode to zipCode
					country: location.country || 'India'
				},
				longitude: location.longitude,
				latitude: location.latitude
			});
			locationId = newLocation._id;
		}

		// Set locationId in gymData
		gymData.locationId = locationId;

		// If user is authenticated and is a gym owner, set ownerId and status to draft
		if (req.user) {
			if (req.user.userType === UserType.GYM) {
				gymData.ownerId = req.user._id as any;
				gymData.status = 'draft'; // Gym owners create gyms as drafts
			} else if (req.user.userType === UserType.SUPERADMIN) {
				// SuperAdmin can directly publish
				gymData.status = gymData.status || 'published';
			}
		}

		const gym = await GymLocationService.createGym(gymData);
		res.status(201).json(gym);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
};


// Get all gyms (with pagination, search, status filter)
export const getGyms = async (
	req: Request<{}, {}, {}, { page?: string; limit?: string; status?: string; search?: string }>,
	res: Response
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const status = req.query.status as string;
		const search = req.query.search as string;
		const skip = (page - 1) * limit;

		let query: any = {};

		// If user is not a superadmin or gym owner, only show published gyms
		if (!req.user || (req.user.userType !== UserType.SUPERADMIN && req.user.userType !== UserType.GYM)) {
			query.status = 'published';
			query.isActive = true;
		}

		// Gym owners can see their own gyms
		if (req.user && req.user.userType === UserType.GYM) {
			query = {
				$or: [
					{ status: 'published', isActive: true },
					{ ownerId: req.user._id }
				]
			};
		}

		// Superadmin status filter
		if (req.user?.userType === UserType.SUPERADMIN && status && status !== 'all') {
			query.status = status;
		}

		// Search by name
		if (search) {
			query.name = { $regex: search, $options: 'i' };
		}

		const total = await Gym.countDocuments(query);
		const gyms = await Gym.find(query)
			.populate("locationId")
			.populate("subscriptionListings")
			.populate("facilities")
			.populate("ownerId", "name email")
			.skip(skip)
			.limit(limit)
			.sort({ createdAt: -1 });

		res.json({
			success: true,
			data: {
				gyms: gyms as IGym[],
				total,
				page,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};


// Get a single gym by ID
export const getGymById = async (
	req: Request<{ id: string }>,
	res: Response<IGym | { error: string }>
) => {
	try {
		const gym = await Gym.findById(req.params.id)
			.populate("locationId")
			.populate("subscriptionListings")
			.populate("facilities");
		if (!gym) return res.status(404).json({ error: "Gym not found" });
		res.json({ success: true, data: gym as IGym });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};
// Get all subscription listings for a gym
export const getGymSubscriptionListings = async (
	req: Request<{ id: string }>,
	res: Response<any>
) => {
	try {
		const gym = await Gym.findById(req.params.id).populate({
			path: "subscriptionListings",
			model: "SubscriptionListing"
		});
		if (!gym) return res.status(404).json({ error: "Gym not found" });
		res.json({ success: true, data: gym.subscriptionListings });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

// Add a subscription listing to a gym
export const addGymSubscriptionListing = async (
	req: Request<{ id: string }, {}, { subscriptionListingId: string }>,
	res: Response<any>
) => {
	try {
		const { subscriptionListingId } = req.body;
		const gym = await Gym.findById(req.params.id);
		if (!gym) return res.status(404).json({ error: "Gym not found" });
		if (!gym.subscriptionListings?.includes(subscriptionListingId as any)) {
			gym.subscriptionListings?.push(subscriptionListingId as any);
			await gym.save();
		}
		res.json(gym);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
};


// Update a gym
export const updateGym = async (
	req: Request<{ id: string }, {}, Partial<Omit<IGym, '_id' | 'createdAt' | 'updatedAt'>>>,
	res: Response<IGym | { error: string }>
) => {
	try {
		const gym = await Gym.findByIdAndUpdate(req.params.id, req.body, { new: true })
			.populate("locationId")
			.populate("facilities");
		if (!gym) return res.status(404).json({ error: "Gym not found" });
		res.json({ success: true, data: gym as IGym });
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
};


// Delete a gym with cascade deletion
export const deleteGym = async (
	req: Request<{ id: string }>,
	res: Response<{ success: boolean; message?: string; error?: string }>
) => {
	try {
		const gymId = req.params.id;

		// Check if gym exists
		const gym = await Gym.findById(gymId);
		if (!gym) {
			return res.status(404).json({ success: false, error: "Gym not found" });
		}

		// Import models for cascade deletion
		const { GymPicture } = await import("@/gymPictures/gymPicture.model");
		const { GymReview } = await import("@/gymReview/gymReview.model");
		const { GymSlot } = await import("@/gymSlots/gymSlot.model");
		const { SubscriptionListing } = await import("@/subscriptionListing/subscriptionListing.model");

		// Delete all associated data
		await Promise.all([
			// Delete gym pictures
			GymPicture.deleteMany({ gymId }),
			// Delete gym reviews
			GymReview.deleteMany({ gymId }),
			// Delete gym slots
			GymSlot.deleteMany({ gymId }),
			// Delete subscription listings associated with this gym
			SubscriptionListing.deleteMany({ gymId }),
		]);

		// Notify gym owner before deletion (fire-and-forget)
		if (gym.ownerId) {
			const owner = await User.findById(gym.ownerId).select('name email');
			if (owner) {
				sendEmailSafe({
					templateType: 'gym-deleted',
					to: owner.email,
					subject: 'Neyofit - Your Gym Has Been Removed',
					data: {
						userName: owner.name,
						gymName: gym.name,
						dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gym-owner/dashboard`
					}
				});
			}
		}

		// Finally delete the gym
		await Gym.findByIdAndDelete(gymId);

		res.json({
			success: true,
			message: "Gym and all associated data deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting gym:", error);
		res.status(500).json({
			success: false,
			error: (error as Error).message
		});
	}
};


// Find gyms nearby (using $geoNear)
type FindGymsNearbyQuery = {
	longitude: string;
	latitude: string;
	radiusInKm?: string;
	limit?: string;
};

export const findGymsNearby = async (
	req: Request<{}, {}, {}, FindGymsNearbyQuery>,
	res: Response<any[] | { error: string }>
) => {
	try {
		const { longitude, latitude, radiusInKm, limit } = req.query;
		if (!longitude || !latitude) {
			return res.status(400).json({ error: "longitude and latitude are required" });
		}
		const gyms = await GymLocationService.findGymsNearbyGeoNear(
			parseFloat(longitude),
			parseFloat(latitude),
			radiusInKm ? parseFloat(radiusInKm) : 5,
			limit ? parseInt(limit) : 50
		);
		res.json(gyms);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

// Add a facility to a gym
export const addGymFacility = async (
	req: Request<{ id: string }, {}, { facilityId: string }>,
	res: Response<{ success: boolean, gym: IGym } | { success: boolean, error: string }>
) => {
	try {
		const { facilityId } = req.body;
		const gym = await Gym.findById(req.params.id);
		if (!gym) return res.status(404).json({ success: false, error: "Gym not found" });
		if (!gym.facilities?.includes(facilityId as any)) {
			gym.facilities?.push(facilityId as any);
			await gym.save();
		}
		res.json({ success: true, gym });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

// Remove a facility from a gym
export const removeGymFacility = async (
	req: Request<{ id: string }, {}, { facilityId: string }>,
	res: Response<IGym | { error: string }>
) => {
	try {
		const { facilityId } = req.body;
		const gym = await Gym.findById(req.params.id);
		if (!gym) return res.status(404).json({ error: "Gym not found" });
		gym.facilities = (gym.facilities || []).filter(
			(fid) => fid.toString() !== facilityId
		);
		await gym.save();
		res.json(gym);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
};

// Create a new gym facility
export const createGymFacility = async (
	req: Request<{}, {}, { name: string }>,
	res: Response<{ success: boolean; data?: IGymFacility; error?: string }>
) => {
	try {
		const facility = await GymFacility.create({ name: req.body.name });
		res.status(201).json({ success: true, data: facility });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

/**
 * Update a gym facility
 */
export const updateGymFacility = async (
	req: Request<{ id: string }, {}, { name: string }>,
	res: Response<{ success: boolean; data?: IGymFacility; error?: string }>
) => {
	try {
		const facility = await GymFacility.findByIdAndUpdate(
			req.params.id,
			{ name: req.body.name },
			{ new: true }
		);
		if (!facility) return res.status(404).json({ success: false, error: "Facility not found" });
		res.json({ success: true, data: facility });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

/**
 * Delete a gym facility from the database
 */
export const deleteGymFacility = async (
	req: Request<{ id: string }>,
	res: Response<{ success: boolean; message?: string; error?: string }>
) => {
	try {
		const facility = await GymFacility.findByIdAndDelete(req.params.id);
		if (!facility) return res.status(404).json({ success: false, error: "Facility not found" });
		res.json({ success: true, message: "Facility deleted" });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

/**
 * Get all gym facilities from the database
 */
export const getAllGymFacilities = async (
	req: Request,
	res: Response<{ success: boolean; data?: IGymFacility[]; error?: string }>
) => {
	try {
		const facilities = await GymFacility.find();
		res.json({ success: true, data: facilities });
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};

// Upload/Create gym with enhanced validation and authorization
export const uploadGym = async (
	req: Request<{}, {}, Omit<IGym, '_id' | 'createdAt' | 'updatedAt'>>,
	res: Response<{ success: boolean; gym?: IGym; message?: string; error?: string }>
) => {
	try {
		// Validate required fields
		const { name, locationId, contact } = req.body;

		if (!name || !locationId) {
			return res.status(400).json({
				success: false,
				error: 'Name and location are required fields'
			});
		}

		// Validate contact information
		if (contact && contact.email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(contact.email)) {
				return res.status(400).json({
					success: false,
					error: 'Invalid email format'
				});
			}
		}

		// Set ownerId based on authenticated user
		const gymPayload = { ...req.body };
		if (req.user) {
			if (req.user.userType === UserType.GYM) {
				gymPayload.ownerId = req.user._id as any;
				gymPayload.status = gymPayload.status || 'draft';
			} else if (req.user.userType === UserType.SUPERADMIN) {
				// SuperAdmin: use ownerId from body if provided, otherwise leave unset
				gymPayload.status = gymPayload.status || 'published';
			}
		}

		// Create gym using the existing service
		const gym = await GymLocationService.createGym(gymPayload);

		res.status(201).json({
			success: true,
			gym,
			message: 'Gym created successfully'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: (error as Error).message
		});
	}
};

// Create gym in draft mode (multi-stage creation)
export const createGymDraft = async (
	req: Request<{}, {}, Partial<Omit<IGym, '_id' | 'createdAt' | 'updatedAt'>>>,
	res: Response<{ success: boolean; gym?: IGym; message?: string; error?: string }>
) => {
	try {
		const { name, locationId } = req.body;

		if (!name || !locationId) {
			return res.status(400).json({
				success: false,
				error: 'Name and locationId are required for draft creation'
			});
		}

		const gymData = {
			name: req.body.name!,
			description: req.body.description || "",
			locationId: req.body.locationId!,
			contact: req.body.contact || {},
			priceRange: req.body.priceRange || "mid-range",
			rating: req.body.rating,
			pictures: [],
			isActive: true,
			status: 'draft' as const,
			// Set ownerId for gym owners
			...(req.user?.userType === UserType.GYM ? { ownerId: req.user._id } : {}),
			...(req.body.ownerId ? { ownerId: req.body.ownerId } : {}),
		} as any;

		const gym = await GymLocationService.createGym(gymData);

		res.status(201).json({
			success: true,
			gym,
			message: 'Gym draft created successfully'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: (error as Error).message
		});
	}
};

// Update gym status (draft -> published, etc.)
export const updateGymStatus = async (
	req: Request<{ id: string }, {}, { status: 'draft' | 'published' | 'archived' }>,
	res: Response<{ success: boolean; gym?: IGym; message?: string; error?: string }>
) => {
	try {
		const { status } = req.body;
		const gym = await Gym.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true }
		).populate("locationId").populate("subscriptionListings");

		if (!gym) {
			return res.status(404).json({
				success: false,
				error: 'Gym not found'
			});
		}

		// Notify gym owner of status change (fire-and-forget)
		if (gym.ownerId) {
			const owner = await User.findById(gym.ownerId).select('name email');
			if (owner) {
				if (status === 'published') {
					sendEmailSafe({
						templateType: 'gym-approved',
						to: owner.email,
						subject: 'Neyofit - Your Gym Has Been Approved!',
						data: {
							userName: owner.name,
							gymName: gym.name,
							dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gym-owner/dashboard`
						}
					});
				} else {
					sendEmailSafe({
						templateType: 'gym-status-changed',
						to: owner.email,
						subject: `Neyofit - Gym Status Updated to ${status}`,
						data: {
							userName: owner.name,
							gymName: gym.name,
							newStatus: status,
							dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gym-owner/dashboard`
						}
					});
				}
			}
		}

		res.json({
			success: true,
			gym: gym as IGym,
			message: `Gym status updated to ${status}`
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: (error as Error).message
		});
	}
};

// Get gyms by status
export const getGymsByStatus = async (
	req: Request<{}, {}, {}, { status?: string; page?: string; limit?: string }>,
	res: Response<{ success: boolean; gyms?: IGym[]; total?: number; error?: string }>
) => {
	try {
		const { status, page = '1', limit = '10' } = req.query;
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		const filter: any = {};
		if (status) {
			filter.status = status;
		}

		const total = await Gym.countDocuments(filter);
		const gyms = await Gym.find(filter)
			.populate("locationId")
			.populate("subscriptionListings")
			.skip(skip)
			.limit(limitNum);

		res.json({
			success: true,
			gyms: gyms as IGym[],
			total
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: (error as Error).message
		});
	}
};

// PATCH /gyms/:id/commission — set per-gym commission override (superadmin)
export const updateGymCommission = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { commissionRate, payoutSchedule } = req.body;

		if (commissionRate !== undefined && commissionRate !== null) {
			if (commissionRate < 0 || commissionRate > 100) {
				return res.status(400).json({ success: false, error: "Commission rate must be between 0 and 100" });
			}
		}

		// Fetch old gym to get previous commission rate
		const oldGym = await Gym.findById(id).select('commissionRate ownerId name');
		if (!oldGym) {
			return res.status(404).json({ success: false, error: "Gym not found" });
		}
		const oldRate = oldGym.commissionRate;

		const updateData: Record<string, unknown> = {};
		if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
		if (payoutSchedule !== undefined) updateData.payoutSchedule = payoutSchedule;

		const gym = await Gym.findByIdAndUpdate(id, updateData, { new: true });
		if (!gym) {
			return res.status(404).json({ success: false, error: "Gym not found" });
		}

		// Notify gym owner of commission change (fire-and-forget)
		if (commissionRate !== undefined && oldGym.ownerId) {
			const owner = await User.findById(oldGym.ownerId).select('name email');
			if (owner) {
				sendEmailSafe({
					templateType: 'commission-rate-changed',
					to: owner.email,
					subject: 'Neyofit - Commission Rate Updated',
					data: {
						userName: owner.name,
						gymName: oldGym.name,
						oldRate: oldRate != null ? String(oldRate) : 'Default',
						newRate: String(commissionRate),
						dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gym-owner/dashboard`
					}
				});
			}
		}

		res.json({ success: true, data: gym });
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};
