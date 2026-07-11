import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import { UserType } from '../types/user.types';


const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Neyofit API Documentation',
      version: version,
      description: 'API documentation for Neyofit backend services',
      contact: {
        name: 'Neyofit Team'
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the user'
            },
            userType: {
              type: 'string',
              enum: Object.values(UserType),
              description: 'Type of user account',
              example: 'member'
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe',
              minLength: 2,
              maxLength: 100
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
              pattern: '^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$'
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '+91-9876543210',
              pattern: '^\\+?[\\d\\s-()]+$'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              nullable: true
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Whether the email is verified',
              default: false
            },
            isPhoneVerified: {
              type: 'boolean',
              description: 'Whether the phone number is verified',
              default: false
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
              default: true
            },
            password: {
              type: 'string',
              description: 'User password (hashed)',
              minLength: 6,
              writeOnly: true
            },
            userAvatar: {
              type: 'string',
              description: 'URL to user avatar image',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user account was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user account was last updated'
            }
          },
          required: ['userType', 'name', 'email', 'phone', 'password']
        },
        DayHours: {
          type: 'object',
          properties: {
            open: {
              type: 'string',
              description: 'Opening time in HH:mm format',
              example: '09:00'
            },
            close: {
              type: 'string',
              description: 'Closing time in HH:mm format',
              example: '22:00'
            },
            closed: {
              type: 'boolean',
              default: false,
              description: 'Whether the gym is closed on this day'
            }
          }
        },
        GymFacility: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the facility'
            },
            name: {
              type: 'string',
              description: 'Name of the facility',
              example: 'Swimming Pool'
            }
          },
          required: ['name']
        },
        Gym: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the gym'
            },
            name: {
              type: 'string',
              description: 'Name of the gym',
              example: 'FitZone Plus'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the gym',
              example: 'A modern fitness center with state-of-the-art equipment'
            },
            locationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Reference to the gym location'
            },
            facilities: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'List of facility IDs available at this gym'
            },
            similarGyms: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'List of similar gym IDs'
            },
            openingHours: {
              type: 'object',
              properties: {
                monday: { $ref: '#/components/schemas/DayHours' },
                tuesday: { $ref: '#/components/schemas/DayHours' },
                wednesday: { $ref: '#/components/schemas/DayHours' },
                thursday: { $ref: '#/components/schemas/DayHours' },
                friday: { $ref: '#/components/schemas/DayHours' },
                saturday: { $ref: '#/components/schemas/DayHours' },
                sunday: { $ref: '#/components/schemas/DayHours' }
              },
              description: 'Operating hours for each day of the week'
            },
            contact: {
              type: 'object',
              properties: {
                phone: {
                  type: 'string',
                  example: '+91-9876543210'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'contact@fitzone.com'
                },
                website: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://fitzone.com'
                }
              },
              description: 'Contact information for the gym'
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
              description: 'Average rating of the gym',
              example: 4.5
            },
            priceRange: {
              type: 'string',
              enum: ['budget', 'mid-range', 'premium'],
              description: 'Price category of the gym'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the gym is currently active'
            },
            subscriptionListings: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'List of subscription plan IDs'
            },
            pictures: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'List of gym picture IDs'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the gym was added to the system'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the gym information was last updated'
            }
          },
          required: ['name', 'locationId']
        },
        Location: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the location',
              example: '64e9c2f1a1b2c3d4e5f6a7b8'
            },
            name: {
              type: 'string',
              description: 'Name of the location/branch',
              example: 'Koramangala Branch'
            },
            address: {
              type: 'object',
              required: ['street', 'city', 'state', 'pinCode', 'country'],
              properties: {
                street: {
                  type: 'string',
                  description: 'Street address',
                  example: '123 Main St'
                },
                city: {
                  type: 'string',
                  description: 'City name',
                  example: 'Bangalore'
                },
                state: {
                  type: 'string',
                  description: 'State name',
                  example: 'Karnataka'
                },
                pinCode: {
                  type: 'string',
                  description: 'Postal/PIN code',
                  example: '560034'
                },
                country: {
                  type: 'string',
                  description: 'Country name',
                  example: 'India'
                }
              }
            },
            coordinates: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['Point'],
                  default: 'Point',
                  description: 'GeoJSON type'
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number'
                  },
                  minItems: 2,
                  maxItems: 2,
                  description: 'Longitude and Latitude coordinates',
                  example: [77.6229, 12.9345]
                }
              },
              required: ['type', 'coordinates']
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the location was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the location was last updated'
            }
          },
          required: ['name', 'address', 'coordinates']
        },
        SubscriptionListing: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the subscription listing'
            },
            name: {
              type: 'string',
              description: 'Name of the subscription package',
              example: 'Monthly Pass'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the subscription',
              example: 'Access for 30 days'
            },
            type: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
              description: 'Type of subscription period',
              example: 'monthly'
            },
            durationInDays: {
              type: 'integer',
              minimum: 1,
              description: 'Duration of the subscription in days',
              example: 30
            },
            gymId: {
              type: 'string',
              format: 'ObjectId',
              description: 'ID of the gym offering this subscription'
            },
            cost: {
              type: 'number',
              minimum: 0,
              description: 'Cost of the subscription',
              example: 1200
            },
            currency: {
              type: 'string',
              enum: ['INR', 'USD', 'EUR', 'GBP'],
              description: 'Currency of the cost',
              example: 'INR'
            },
            discount: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number',
                  minimum: 0,
                  description: 'Discount amount',
                  example: 10
                },
                type: {
                  type: 'string',
                  enum: ['percentage', 'fixed'],
                  description: 'Type of discount',
                  example: 'percentage'
                },
                validUntil: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Discount validity end date'
                }
              }
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the subscription listing is active',
              default: true
            },
            isRecurring: {
              type: 'boolean',
              description: 'Whether the subscription automatically renews',
              default: false
            },
            features: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of features included in this subscription',
              example: ['pool', 'steam']
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'When the subscription listing becomes available'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'When the subscription listing expires'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the subscription listing was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the subscription listing was last updated'
            }
          },
          required: ['name', 'type', 'durationInDays', 'gymId', 'cost', 'currency']
        },
        GymPicture: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the gym picture'
            },
            gymId: {
              type: 'string',
              format: 'ObjectId',
              description: 'ID of the gym this picture belongs to',
              required: true
            },
            imageData: {
              type: 'string',
              format: 'binary',
              description: 'The actual image data'
            },
            imageType: {
              type: 'string',
              description: 'MIME type of the image',
              example: 'image/jpeg'
            },
            imageSize: {
              type: 'number',
              description: 'Size of the image in bytes',
              example: 1024000
            },
            caption: {
              type: 'string',
              description: 'Optional caption for the image',
              example: 'Main workout area'
            },
            uploadedBy: {
              type: 'string',
              format: 'ObjectId',
              description: 'ID of the user who uploaded the picture'
            },
            isCover: {
              type: 'boolean',
              default: false,
              description: 'Whether this is the cover picture for the gym'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the picture was uploaded'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the picture was last updated'
            }
          },
          required: ['gymId', 'imageData', 'imageType', 'imageSize']
        },
        GymReview: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique identifier for the review'
            },
            gymId: {
              type: 'string',
              format: 'ObjectId',
              description: 'ID of the gym being reviewed'
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'ID of the user writing the review'
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Rating given to the gym (1-5 stars)',
              example: 4.5
            },
            comment: {
              type: 'string',
              description: 'Review comment/text',
              example: 'Great facilities and friendly staff!'
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'List of image IDs associated with the review'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the review was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the review was last updated'
            }
          },
          required: ['gymId', 'userId', 'rating']
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Gyms', description: 'Gym management endpoints' },
      { name: 'Locations', description: 'Location management endpoints' },
      { name: 'Subscriptions', description: 'Subscription management endpoints' },
      { name: 'Reviews', description: 'Gym review management endpoints' },
      { name: 'Pictures', description: 'Gym picture management endpoints' },
      { name: 'Facilities', description: 'Gym facility management endpoints' }
    ]
  },
  apis: [
    './src/**/*.routes.ts',
    './src/**/*.types.ts'
  ]
};

export const specs = swaggerJsdoc(options);
