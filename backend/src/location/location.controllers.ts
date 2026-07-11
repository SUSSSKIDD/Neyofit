import { Request, Response } from "express";
import { Location } from "@/location/location.model";
import { ILocation } from "@/types/location.types";
import { GymLocationService } from "@/utils/geoLocationService";

// Create a new location (with geospatial coordinates)
export const createLocation = async (
	req: Request<{}, {}, {
		name: string;
		address: {
			street: string;
			city: string;
			state: string;
			zipCode: string;
			country?: string;
		};
		longitude: number;
		latitude: number;
	}>,
	res: Response<ILocation | { error: string }>
) => {
	try {
		const location = await GymLocationService.createLocation(req.body);
		res.status(201).json(location);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
};

// Get all locations (with pagination and search)
export const getLocations = async (
	req: Request<{}, {}, {}, { page?: string; limit?: string; search?: string }>,
	res: Response
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const search = req.query.search as string;
		const skip = (page - 1) * limit;

		const query: any = {};
		if (search) {
			const searchRegex = new RegExp(search, 'i');
			query.$or = [
				{ name: searchRegex },
				{ 'address.city': searchRegex },
				{ 'address.state': searchRegex },
			];
		}

		const total = await Location.countDocuments(query);
		const locations = await Location.find(query)
			.skip(skip)
			.limit(limit)
			.sort({ createdAt: -1 });

		res.json({
			success: true,
			data: {
				locations: locations as ILocation[],
				total,
				page,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};

// Get a single location by ID
export const getLocationById = async (
	req: Request<{ id: string }>,
	res: Response<ILocation | { error: string }>
) => {
	try {
		const location = await Location.findById(req.params.id);
		if (!location) return res.status(404).json({ error: "Location not found" });
		res.json(location as ILocation);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

// Update a location
export const updateLocation = async (
	req: Request<{ id: string }, {}, Partial<Omit<ILocation, '_id' | 'createdAt' | 'updatedAt'>>>,
	res: Response<ILocation | { error: string }>
) => {
	try {
		const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!location) return res.status(404).json({ error: "Location not found" });
		res.json(location as ILocation);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
};

// Delete a location
export const deleteLocation = async (
	req: Request<{ id: string }>,
	res: Response<{ message: string } | { error: string }>
) => {
	try {
		const location = await Location.findByIdAndDelete(req.params.id);
		if (!location) return res.status(404).json({ error: "Location not found" });
		res.json({ message: "Location deleted" });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};

// Search locations by name, city, or state
export const searchLocations = async (
	req: Request<{}, {}, {}, { q?: string; limit?: string }>,
	res: Response<{ success: boolean; locations?: ILocation[]; error?: string }>
) => {
	try {
		const { q, limit = '10' } = req.query;
		const limitNum = parseInt(limit);

		if (!q || q.trim().length < 2) {
			return res.status(400).json({
				success: false,
				error: 'Search query must be at least 2 characters long'
			});
		}

		const searchRegex = new RegExp(q.trim(), 'i');
		const locations = await Location.find({
			$or: [
				{ name: searchRegex },
				{ 'address.city': searchRegex },
				{ 'address.state': searchRegex },
				{ 'address.street': searchRegex }
			]
		}).limit(limitNum);

		res.json({
			success: true,
			locations: locations as ILocation[]
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: (error as Error).message
		});
	}
};
