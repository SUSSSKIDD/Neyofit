import { Gym } from "@/gym/gym.model"
import {Location} from "@/location/location.model"
import { IGym } from "@/types/gym.types"
import {ILocation} from "@/types/location.types"

// member functions with `static` declarations can be used without instantiating the class.

export class GymLocationService {
  /**
   * Find gyms within a specified radius of user coordinates
   * @param userLongitude - User's longitude
   * @param userLatitude - User's latitude
   * @param radiusInKm - Search radius in kilometers (default: 5km)
   * @param limit - Maximum number of results (default: 50)
   */
  static async findGymsNearby(
    userLongitude: number,
    userLatitude: number,
    radiusInKm: number = 5, //By default, radius is 5Km
    limit: number = 50
  ): Promise<(IGym & { location: ILocation; distance: number })[]> {
    
    const radiusInMeters = radiusInKm * 1000;
    
    const gymsWithLocation = await Gym.aggregate([
      // Match active gyms only
      {
        $match: { isActive: true }
      },
      // Lookup location data
      {
        $lookup: {
          from: 'locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'location'
        }
      },
      // Unwind location array
      {
        $unwind: '$location'
      },
      // Apply geospatial filter
      {
        $match: {
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [userLongitude, userLatitude]
              },
              $maxDistance: radiusInMeters
            }
          }
        }
      },
      // Calculate distance
      {
        $addFields: {
          distance: {
            $divide: [
              {
                $arrayElemAt: [
                  {
                    $map: {
                      input: [
                        {
                          $geoDistance: {
                            from: {
                              type: 'Point',
                              coordinates: [userLongitude, userLatitude]
                            },
                            to: '$location.coordinates'
                          }
                        }
                      ],
                      as: 'dist',
                      in: '$$dist'
                    }
                  },
                  0
                ]
              },
              1000
            ] // Convert meters to kilometers
          }
        }
      },
      // Sort by distance
      {
        $sort: { distance: 1 }
      },
      // Limit results
      {
        $limit: limit
      }
    ]);
    
    return gymsWithLocation;
  }

  /**
   * Create a new location
   */
  static async createLocation(locationData: {
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
  }): Promise<ILocation> {
    
    const location = new Location({
      name: locationData.name,
      address: {
        street: locationData.address.street,
        city: locationData.address.city,
        state: locationData.address.state,
        pinCode: locationData.address.zipCode, // Map zipCode to pinCode
        country: locationData.address.country || 'India'
      },
      coordinates: {
        type: 'Point',
        coordinates: [locationData.longitude, locationData.latitude]
      }
    });
    //save the entry to DB
    return await location.save();
  }

  /**
   * Create a new gym
   */
  static async createGym(gymData: Omit<IGym, '_id' | 'createdAt' | 'updatedAt'>): Promise<IGym> {
    const gym = new Gym(gymData);
    // save the entry to DB
    return await gym.save();
  }

  /**
   * Alternative method using $geoNear aggregation (more performant for complex queries)
   */
  static async findGymsNearbyGeoNear(
    userLongitude: number,
    userLatitude: number,
    radiusInKm: number = 5,
    limit: number = 50
  ) {
    const radiusInMeters = radiusInKm * 1000;
    
    // First get nearby locations
    const nearbyLocations = await Location.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [userLongitude, userLatitude]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      {
        $addFields: {
          distanceInKm: { $divide: ['$distance', 1000] }
        }
      }
    ]);

    // Get location IDs
    const locationIds = nearbyLocations.map(loc => loc._id);

    // Find gyms at these locations
    const gyms = await Gym.find({
      locationId: { $in: locationIds },
      isActive: true
    }).populate('locationId');

    // Combine and sort by distance
    const gymsWithDistance = gyms.map(gym => {
      const locationData = nearbyLocations.find(
        loc => loc._id.toString() === (gym.locationId as any)._id.toString()
      );
      return {
        ...gym.toObject(),
        distance: locationData?.distanceInKm || 0
      };
    }).sort((a, b) => a.distance - b.distance).slice(0, limit);

    return gymsWithDistance;
  }
}