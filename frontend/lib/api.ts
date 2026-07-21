const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "https://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1");

// Utility function to generate unique IDs for time slots
export const generateSlotId = (): string => {
  return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to create default time slots
export const createDefaultTimeSlot = (name: string = "Morning"): TimeSlot => ({
  id: generateSlotId(),
  name,
  startTime: "09:00",
  endTime: "21:00",
  isActive: true,
});

// Utility function to create default day schedule
export const createDefaultDaySchedule = (): DaySchedule => ({
  isClosed: false,
  slots: [createDefaultTimeSlot("Morning")],
});

// Utility function to create default opening hours
export const createDefaultOpeningHours = (): OpeningHours => ({
  monday: createDefaultDaySchedule(),
  tuesday: createDefaultDaySchedule(),
  wednesday: createDefaultDaySchedule(),
  thursday: createDefaultDaySchedule(),
  friday: createDefaultDaySchedule(),
  saturday: createDefaultDaySchedule(),
  sunday: createDefaultDaySchedule(),
});

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Add gym search functions
export const searchGyms = async (params: {
  near?: string;
  radius?: number;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/gyms?${new URLSearchParams(params as Record<string, string>)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching gyms:", error);
    throw error;
  }
};

export const searchGymsByLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 3,
  limit: number = 20
) => {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radiusInKm: radius.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(
      `${API_BASE_URL}/gyms/search/nearby?${params}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching gyms by location:", error);
    throw error;
  }
};

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: "customer" | "gym" | "employee" | "admin" | "superadmin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isEmailVerified?: boolean;
  userAvatar?: string;
  lastLogin?: string;
}

export interface Location {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  coordinates: {
    type: string;
    coordinates: [number, number];
  };
  isAllocated?: boolean;
}

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DaySchedule {
  isClosed: boolean;
  slots: TimeSlot[];
}

export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Gym {
  _id: string;
  name: string;
  description?: string;
  locationId: string;
  location?: Location;
  ownerId?: string | { _id: string };
  facilities?: (string | { _id: string; name: string })[];
  openingHours: OpeningHours;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rating?: number;
  priceRange?: "budget" | "mid-range" | "premium";
  isActive: boolean;
  status: "draft" | "published" | "archived";
  pictures?: string[];
  subscriptionListings?: SubscriptionListing[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionListing {
  _id: string;
  name: string;
  description?: string;
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  customTypeText?: string;
  durationInDays: number;
  gymId: string;
  cost: number;
  currency: string;
  discount?: {
    amount: number;
    type: "percentage" | "fixed";
    validUntil: string;
  };
  isActive: boolean;
  isRecurring?: boolean;
  features?: string[];
  startDate?: string;
  endDate?: string;
}

export interface GymSlotData {
  dayOfWeek: string;
  slots: TimeSlot[];
  isClosed: boolean;
}

export interface UserSubscription {
  _id: string;
  userId: string;
  subscriptionListingId: string | SubscriptionListing;
  startDate: string;
  endDate: string;
  status: string;
  isRecurring: boolean;
}

export interface PaymentVerifyResult {
  success: boolean;
  subscription?: UserSubscription;
  message?: string;
}

export interface PaymentStatus {
  orderId: string;
  status: string;
  amount: number;
  currency: string;
}

export interface GymPass {
  _id: string;
  gymId: string;
  gymName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface UserPayment {
  _id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  subscriptionId?: {
    _id: string;
    subscriptionListingId?: {
      _id: string;
      name: string;
      type: string;
      cost: number;
      gymId?: {
        _id: string;
        name: string;
        status?: string;
        ownerId?: string;
      };
    };
  };
  commissionRate?: number;
  commissionAmount?: number;
  gymOwnerShare?: number;
  payoutStatus?: "unpaid" | "included" | "paid";
}

export interface GymPictureUploadResult {
  uploaded: number;
  pictures: Array<{
    _id: string;
    gymId: string;
    filePath: string;
    fileName: string;
  }>;
}

export interface GymReview {
  _id: string;
  gymId: string;
  userId: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Payout & Commission interfaces
export interface PayoutDashboardData {
  summary: {
    totalUnpaidToGyms: number;
    platformCommissionEarned: number;
    totalPayoutsCompleted: number;
    completedPayoutCount: number;
  };
  pendingByOwner: Array<{
    gymOwnerId: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    totalAmount: number;
    totalCommission: number;
    totalGymOwnerShare: number;
    paymentCount: number;
    gymCount: number;
  }>;
}

export interface PayoutEntry {
  _id: string;
  gymOwnerId: string | { _id: string; name: string; email: string; phone?: string };
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  payoutAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paymentIds: string[];
  status: "pending" | "processing" | "completed" | "failed";
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  processedAt?: string;
  processedBy?: string | { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettingsData {
  _id: string;
  defaultCommissionRate: number;
  defaultPayoutSchedule: "weekly" | "biweekly" | "monthly";
  minimumPayoutAmount: number;
  isAutoPayout: boolean;
  timeFormat?: "12h" | "24h";
}

export interface GymOwnerEarningsSummary {
  totalEarnings: number;
  totalCommission: number;
  totalNetEarnings: number;
  totalPayments: number;
  pendingPayout: number;
  pendingPaymentCount: number;
  totalPaidOut: number;
  payoutCount: number;
}

export interface BankDetailsData {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
  isVerified: boolean;
}

// === CRM Interfaces ===

export interface GymMember {
  _id: string;
  gymId: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  membershipNumber: string;
  subscriptionListingId?: string | SubscriptionListing;
  membershipStartDate?: string;
  membershipEndDate?: string;
  membershipStatus: "active" | "expired" | "frozen" | "cancelled" | "trial";
  memberType: "regular" | "trial" | "guest" | "complimentary";
  source: "walk_in" | "referral" | "online" | "phone_inquiry" | "other";
  freezeHistory: Array<{
    startDate: string;
    endDate: string;
    reason?: string;
  }>;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymMemberListResponse {
  members: GymMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Visit {
  _id: string;
  gymId: string;
  memberId: string | GymMember;
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  checkedInBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitListResponse {
  visits: Visit[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VisitStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  currentlyIn: number;
}

export interface OfflinePayment {
  _id: string;
  gymId: string;
  memberId: string | GymMember;
  subscriptionListingId?: string | SubscriptionListing;
  amount: number;
  paymentMethod: "cash" | "upi" | "bank_transfer" | "card" | "other";
  transactionReference?: string;
  paymentDate: string;
  paymentType: "membership_new" | "membership_renewal" | "day_pass" | "personal_training" | "other";
  receiptNumber: string;
  notes?: string;
  recordedBy?: string;
  status: "completed" | "refunded" | "partial";
  createdAt: string;
  updatedAt: string;
}

export interface OfflinePaymentListResponse {
  payments: OfflinePayment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RevenueSummary {
  byMethod: Array<{ method: string; total: number; count: number }>;
  today: { total: number; count: number };
  thisWeek: { total: number; count: number };
  thisMonth: { total: number; count: number };
  allTime: { total: number; count: number };
}

class ApiService {
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important: include cookies
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      // Handle 401 - token expired, try to refresh
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request
          const retryResponse = await fetch(url, defaultOptions);
          return retryResponse.json();
        }
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private async processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      // Wait for existing refresh to complete
      return new Promise((resolve) => {
        this.failedQueue.push({ resolve, reject: () => {} });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        this.processQueue(null, 'refreshed');
        this.isRefreshing = false;
        return true;
      } else {
        this.processQueue(new Error('Token refresh failed'));
        this.isRefreshing = false;
        return false;
      }
    } catch (error) {
      this.processQueue(error as Error);
      this.isRefreshing = false;
      return false;
    }
  }

  // Auth endpoints
  async registerUser(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    userType?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${this.baseURL}/auth/register-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({
        ...userData,
        userType: userData.userType || "customer",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async loginUser(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${this.baseURL}/auth/login-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async logoutUser(): Promise<void> {
    await fetch(`${this.baseURL}/auth/logout`, {
      method: "POST",
      credentials: 'include',
    });
  }

  async refreshAccessToken(): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
      method: "POST",
      credentials: 'include',
    });
    return response.json();
  }

  async verifyToken(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${this.baseURL}/auth/verify-token`, {
      method: "GET",
      credentials: 'include',
    });

    if (response.status === 401) {
      // Token expired, trigger auth event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return response.json();
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return response.json();
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ token, password }),
    });
    return response.json();
  }

  async verifyEmailToken(token: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/auth/verify-email/${token}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async checkEmail(email: string): Promise<{ success: boolean; exists: boolean; hasPassword: boolean }> {
    const response = await fetch(`${this.baseURL}/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return response.json();
  }

  async sendOtp(email: string, purpose: 'login' | 'signup'): Promise<{
    success: boolean;
    message: string;
    data?: { hasPassword: boolean; isNewUser: boolean };
  }> {
    const response = await fetch(`${this.baseURL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email, purpose }),
    });
    return response.json();
  }

  async verifyOtp(data: {
    email: string;
    otp: string;
    purpose: 'login' | 'signup';
    name?: string;
    phone?: string;
    password?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async sendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/auth/send-verification-email`, {
      method: "POST",
      credentials: 'include',
    });
    return response.json();
  }

  // Gym endpoints
  async getGyms(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    near?: string;
    status?: string;
    search?: string;
  }): Promise<
    ApiResponse<{ gyms: Gym[]; total: number; page: number; pages: number }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.near) queryParams.append("near", params.near);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(`${this.baseURL}/gyms?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async createGym(gymData: {
    name: string;
    description?: string;
    locationId: string;
    facilities?: string[];
    similarGyms?: string[];
    openingHours?: OpeningHours;
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    rating?: number;
    priceRange?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Gym>> {
    const response = await fetch(`${this.baseURL}/gyms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(gymData),
    });
    return response.json();
  }

  async updateGym(
    id: string,
    gymData: {
      name?: string;
      description?: string;
      locationId?: string;
      openingHours?: OpeningHours;
      contact?: {
        phone?: string;
        email?: string;
        website?: string;
      };
      priceRange?: string;
      rating?: number;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<Gym>> {
    const response = await fetch(`${this.baseURL}/gyms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(gymData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update gym (${response.status})`);
    }

    return response.json();
  }

  async deleteGym(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/gyms/${id}`, {
      method: "DELETE",
      credentials: 'include',
    });
    return response.json();
  }

  async getGymById(id: string): Promise<ApiResponse<Gym>> {
    const response = await fetch(`${this.baseURL}/gyms/${id}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getGymSubscriptionListings(
    gymId: string
  ): Promise<ApiResponse<SubscriptionListing[]>> {
    const response = await fetch(
      `${this.baseURL}/gyms/${gymId}/subscription-listings`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Location endpoints
  async getLocations(params?: {
    page?: number;
    limit?: number;
    near?: string;
    radius?: number;
    search?: string;
  }): Promise<
    ApiResponse<{
      locations: Location[];
      total: number;
      page: number;
      pages: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.near) queryParams.append("near", params.near);
    if (params?.radius) queryParams.append("radius", params.radius.toString());
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(`${this.baseURL}/locations?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async createLocation(locationData: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      pinCode: string;
      country: string;
    };
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<Location>> {
    const requestData = {
      name: locationData.name,
      address: {
        street: locationData.address.street,
        city: locationData.address.city,
        state: locationData.address.state,
        zipCode: locationData.address.pinCode,
        country: locationData.address.country,
      },
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    };

    const response = await fetch(`${this.baseURL}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(requestData),
    });
    return response.json();
  }

  async updateLocation(
    id: string,
    locationData: {
      name?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        country?: string;
      };
      latitude?: number;
      longitude?: number;
    }
  ): Promise<ApiResponse<Location>> {
    const response = await fetch(`${this.baseURL}/locations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(locationData),
    });
    return response.json();
  }

  async deleteLocation(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/locations/${id}`, {
      method: "DELETE",
      credentials: 'include',
    });
    return response.json();
  }

  // Subscription endpoints
  async getSubscriptionListings(params?: {
    gymId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      subscriptions: SubscriptionListing[];
      total: number;
      page: number;
      pages: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.gymId) queryParams.append("gymId", params.gymId);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${this.baseURL}/subscription-listings?${queryParams}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Review endpoints
  async getGymReviews(
    gymId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<GymReview[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${this.baseURL}/gym-reviews/gym/${gymId}?${queryParams}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    return response.json();
  }

  async createGymReview(reviewData: {
    gymId: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<GymReview>> {
    const response = await fetch(`${this.baseURL}/gym-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(reviewData),
    });
    return response.json();
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
    }>
  > {
    const response = await fetch(`${this.baseURL}/health`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Payment endpoints
  async createPaymentOrder(subscriptionListingId: string): Promise<
    ApiResponse<{
      orderId: string;
      amount: number;
      currency: string;
      paymentId: string;
    }>
  > {
    const response = await fetch(`${this.baseURL}/payments/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ subscriptionListingId }),
    });
    return response.json();
  }

  async verifyPayment(paymentData: {
    subscriptionListingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<ApiResponse<PaymentVerifyResult>> {
    const response = await fetch(`${this.baseURL}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(paymentData),
    });
    return response.json();
  }

  async getPaymentStatus(orderId: string): Promise<ApiResponse<PaymentStatus>> {
    const response = await fetch(`${this.baseURL}/payments/status/${orderId}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getActiveGymPasses(): Promise<ApiResponse<GymPass[]>> {
    const response = await fetch(`${this.baseURL}/payments/gym-passes`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getUserPayments(): Promise<ApiResponse<UserPayment[]>> {
    const response = await fetch(`${this.baseURL}/payments/user-payments`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Enhanced gym management methods
  async createGymDraft(gymData: {
    name: string;
    description?: string;
    locationId: string;
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    priceRange?: string;
    rating?: number;
  }): Promise<{
    success: boolean;
    gym?: Gym;
    error?: string;
    message?: string;
  }> {
    const response = await fetch(`${this.baseURL}/gyms/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(gymData),
    });
    return response.json();
  }

  async updateGymStatus(
    gymId: string,
    status: "draft" | "published" | "archived"
  ): Promise<{
    success: boolean;
    gym?: Gym;
    error?: string;
    message?: string;
  }> {
    const response = await fetch(`${this.baseURL}/gyms/${gymId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update gym status (${response.status})`);
    }

    return response.json();
  }

  async getGymsByStatus(params?: {
    status?: "draft" | "published" | "archived";
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ gyms: Gym[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(`${this.baseURL}/gyms/status?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Location search
  async searchLocations(
    query: string,
    limit: number = 10
  ): Promise<{ success: boolean; locations?: Location[]; error?: string }> {
    const response = await fetch(
      `${this.baseURL}/locations/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Admin: get users with filters
  async getUsers(params?: {
    userType?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ success: boolean; data: User[]; pagination: { page: number; limit: number; total: number; pages: number }; message?: string }> {
    const queryParams = new URLSearchParams();
    if (params?.userType) queryParams.append("userType", params.userType);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(`${this.baseURL}/users?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Admin: create gym owner
  async createGymOwner(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${this.baseURL}/auth/register-gym-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Admin: toggle user active status
  async toggleUserStatus(userId: string): Promise<ApiResponse<User>> {
    const response = await fetch(
      `${this.baseURL}/users/${userId}/toggle-active`,
      {
        method: "PATCH",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Admin: get all payments
  async getAllPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ payments: UserPayment[]; total: number; page: number; pages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${this.baseURL}/payments/all?${queryParams}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Gym owner: get payments for their gyms
  async getGymOwnerPayments(): Promise<ApiResponse<UserPayment[]>> {
    const response = await fetch(`${this.baseURL}/payments/gym-owner`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Customer: get reviews by user
  async getUserReviews(userId: string): Promise<ApiResponse<GymReview[]>> {
    const response = await fetch(
      `${this.baseURL}/gym-reviews/user/${userId}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Customer: delete a review
  async deleteReview(reviewId: string): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/gym-reviews/${reviewId}`,
      {
        method: "DELETE",
        credentials: 'include',
      }
    );
    return response.json();
  }

  // Profile update
  async updateUserProfile(
    userId: string,
    data: { name?: string; phone?: string; userAvatar?: string }
  ): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseURL}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Dashboard data endpoints
  async getSuperAdminDashboard(): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await fetch(`${this.baseURL}/dashboard/superadmin`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getGymOwnerDashboard(): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await fetch(`${this.baseURL}/dashboard/gym-owner`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Gym facilities
  async getGymFacilities(): Promise<ApiResponse<Array<{ _id: string; name: string; description?: string }>>> {
    const response = await fetch(`${this.baseURL}/gym-facilities`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async createGymFacility(data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<{ _id: string; name: string; description?: string }>> {
    const response = await fetch(`${this.baseURL}/gym-facilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteGymFacility(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/gym-facilities/${id}`, {
      method: "DELETE",
      credentials: 'include',
    });
    return response.json();
  }

  async updateGymFacility(id: string, data: { name: string }): Promise<ApiResponse<{ _id: string; name: string }>> {
    const response = await fetch(`${this.baseURL}/gym-facilities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getPayoutSummary(): Promise<ApiResponse<Array<{
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    totalEarnings: number;
    gymCount: number;
    paymentCount: number;
    lastPaymentDate: string | null;
  }>>> {
    const response = await fetch(`${this.baseURL}/payments/payout-summary`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/users/${userId}`, {
      method: "DELETE",
      credentials: 'include',
    });
    return response.json();
  }

  // Gym pictures management
  async getGymPictures(gymId: string): Promise<ApiResponse<Array<{ _id: string; gymId: string; filePath: string; fileName: string; isCover?: boolean }>>> {
    const response = await fetch(`${this.baseURL}/gym-pictures/gym/${gymId}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async deleteGymPicture(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/gym-pictures/${id}`, {
      method: "DELETE",
      credentials: 'include',
    });
    return response.json();
  }

  // Bulk image upload
  async bulkUploadGymPictures(
    gymId: string,
    files: File[],
    captions?: string[],
    isCover?: boolean[]
  ): Promise<ApiResponse<GymPictureUploadResult>> {
    const formData = new FormData();
    formData.append("gymId", gymId);

    files.forEach((file, index) => {
      formData.append("images", file);
    });

    if (captions) {
      formData.append("captions", JSON.stringify(captions));
    }

    if (isCover) {
      formData.append("isCover", JSON.stringify(isCover));
    }

    const response = await fetch(`${this.baseURL}/gym-pictures/bulk`, {
      method: "POST",
      credentials: 'include',
      body: formData,
    });

    return response.json();
  }

  // === Payout & Commission API methods ===

  async getPayoutDashboard(): Promise<ApiResponse<PayoutDashboardData>> {
    const response = await fetch(`${this.baseURL}/payouts/dashboard`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getAllPayoutsHistory(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ payouts: PayoutEntry[]; total: number; page: number; pages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(`${this.baseURL}/payouts?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async createPayout(data: {
    gymOwnerId: string;
    notes?: string;
    paymentMethod?: string;
  }): Promise<ApiResponse<PayoutEntry>> {
    const response = await fetch(`${this.baseURL}/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async markPayoutCompleted(
    payoutId: string,
    data: { transactionReference?: string; notes?: string }
  ): Promise<ApiResponse<PayoutEntry>> {
    const response = await fetch(`${this.baseURL}/payouts/${payoutId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async markPayoutFailed(
    payoutId: string,
    data?: { notes?: string }
  ): Promise<ApiResponse<PayoutEntry>> {
    const response = await fetch(`${this.baseURL}/payouts/${payoutId}/fail`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data || {}),
    });
    return response.json();
  }

  async getPlatformSettings(): Promise<ApiResponse<PlatformSettingsData>> {
    const response = await fetch(`${this.baseURL}/platform-settings`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async updatePlatformSettings(data: Partial<PlatformSettingsData>): Promise<ApiResponse<PlatformSettingsData>> {
    const response = await fetch(`${this.baseURL}/platform-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateGymCommission(
    gymId: string,
    data: { commissionRate?: number | null; payoutSchedule?: string | null }
  ): Promise<ApiResponse<Gym>> {
    const response = await fetch(`${this.baseURL}/gyms/${gymId}/commission`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getGymOwnerEarningsSummary(): Promise<ApiResponse<GymOwnerEarningsSummary>> {
    const response = await fetch(`${this.baseURL}/payouts/my/summary`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getGymOwnerPayoutHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ payouts: PayoutEntry[]; total: number; page: number; pages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(`${this.baseURL}/payouts/my/history?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async updateBankDetails(data: Partial<BankDetailsData>): Promise<ApiResponse<BankDetailsData>> {
    const response = await fetch(`${this.baseURL}/users/bank-details`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getBankDetails(): Promise<ApiResponse<BankDetailsData>> {
    const response = await fetch(`${this.baseURL}/users/bank-details`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // === CRM: Gym Members ===

  async createGymMember(data: {
    gymId: string;
    name: string;
    phone: string;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
    emergencyContact?: { name?: string; phone?: string; relation?: string };
    subscriptionListingId?: string;
    membershipStartDate?: string;
    memberType?: string;
    source?: string;
    notes?: string;
    payment?: {
      amount: number;
      paymentMethod: string;
      transactionReference?: string;
      notes?: string;
    };
  }): Promise<ApiResponse<{ member: GymMember; payment: OfflinePayment | null }>> {
    const response = await fetch(`${this.baseURL}/gym-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getGymMembers(
    gymId: string,
    params?: { page?: number; limit?: number; status?: string; search?: string; memberType?: string }
  ): Promise<ApiResponse<GymMemberListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.memberType) queryParams.append("memberType", params.memberType);

    const response = await fetch(`${this.baseURL}/gym-members/gym/${gymId}?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getGymMember(id: string): Promise<ApiResponse<GymMember>> {
    const response = await fetch(`${this.baseURL}/gym-members/${id}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async updateGymMember(id: string, data: Partial<GymMember>): Promise<ApiResponse<GymMember>> {
    const response = await fetch(`${this.baseURL}/gym-members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteGymMember(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseURL}/gym-members/${id}`, {
      method: "DELETE",
      credentials: 'include',
    });
    return response.json();
  }

  async freezeGymMember(id: string, data: { startDate: string; endDate: string; reason?: string }): Promise<ApiResponse<GymMember>> {
    const response = await fetch(`${this.baseURL}/gym-members/${id}/freeze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async unfreezeGymMember(id: string): Promise<ApiResponse<GymMember>> {
    const response = await fetch(`${this.baseURL}/gym-members/${id}/unfreeze`, {
      method: "POST",
      credentials: 'include',
    });
    return response.json();
  }

  async renewGymMember(id: string, data: {
    subscriptionListingId: string;
    payment?: { amount: number; paymentMethod: string; transactionReference?: string };
  }): Promise<ApiResponse<{ member: GymMember; payment: OfflinePayment | null }>> {
    const response = await fetch(`${this.baseURL}/gym-members/${id}/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getExpiringMembers(gymId: string, days?: number): Promise<ApiResponse<GymMember[]>> {
    const queryParams = new URLSearchParams();
    if (days) queryParams.append("days", days.toString());

    const response = await fetch(`${this.baseURL}/gym-members/gym/${gymId}/expiring?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async searchGymMembers(gymId: string, q: string): Promise<ApiResponse<GymMember[]>> {
    const response = await fetch(`${this.baseURL}/gym-members/gym/${gymId}/search?q=${encodeURIComponent(q)}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // === CRM: Visits ===

  async checkInMember(data: { gymId: string; memberId: string; notes?: string }): Promise<ApiResponse<Visit> & { warning?: string }> {
    const response = await fetch(`${this.baseURL}/visits/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async checkOutMember(visitId: string, notes?: string): Promise<ApiResponse<Visit>> {
    const response = await fetch(`${this.baseURL}/visits/check-out/${visitId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return response.json();
  }

  async getTodayAttendance(gymId: string): Promise<ApiResponse<Visit[]>> {
    const response = await fetch(`${this.baseURL}/visits/gym/${gymId}/today`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getCurrentlyInGym(gymId: string): Promise<ApiResponse<Visit[]> & { count?: number }> {
    const response = await fetch(`${this.baseURL}/visits/gym/${gymId}/currently-in`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getVisitHistory(
    gymId: string,
    params?: { startDate?: string; endDate?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<VisitListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(`${this.baseURL}/visits/gym/${gymId}?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getMemberVisits(memberId: string): Promise<ApiResponse<Visit[]>> {
    const response = await fetch(`${this.baseURL}/visits/member/${memberId}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getVisitStats(gymId: string): Promise<ApiResponse<VisitStats>> {
    const response = await fetch(`${this.baseURL}/visits/gym/${gymId}/stats`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // === CRM: Offline Payments ===

  async createOfflinePayment(data: {
    gymId: string;
    memberId: string;
    subscriptionListingId?: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    paymentDate?: string;
    paymentType: string;
    notes?: string;
  }): Promise<ApiResponse<OfflinePayment>> {
    const response = await fetch(`${this.baseURL}/offline-payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getGymOfflinePayments(
    gymId: string,
    params?: { page?: number; limit?: number; startDate?: string; endDate?: string; paymentMethod?: string }
  ): Promise<ApiResponse<OfflinePaymentListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.paymentMethod) queryParams.append("paymentMethod", params.paymentMethod);

    const response = await fetch(`${this.baseURL}/offline-payments/gym/${gymId}?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getMemberOfflinePayments(memberId: string): Promise<ApiResponse<OfflinePayment[]>> {
    const response = await fetch(`${this.baseURL}/offline-payments/member/${memberId}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getRevenueSummary(gymId: string, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<RevenueSummary>> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const response = await fetch(`${this.baseURL}/offline-payments/gym/${gymId}/summary?${queryParams}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async refundOfflinePayment(id: string, notes?: string): Promise<ApiResponse<OfflinePayment>> {
    const response = await fetch(`${this.baseURL}/offline-payments/${id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return response.json();
  }

  // Subscription API methods
  async getUserSubscriptions(): Promise<ApiResponse<UserSubscription[]>> {
    const response = await fetch(`${this.baseURL}/payments/user-subscriptions`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  // Favorite API methods
  async checkFavorite(gymId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const response = await fetch(`${this.baseURL}/favorites/check/${gymId}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async getUserFavorites(): Promise<ApiResponse<Gym[]>> {
    const response = await fetch(`${this.baseURL}/favorites`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async toggleFavorite(gymId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const response = await fetch(`${this.baseURL}/favorites/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ gymId }),
    });
    return response.json();
  }

  // Gym Slots API methods
  async getGymSlots(gymId: string): Promise<ApiResponse<GymSlotData[]>> {
    const response = await fetch(`${this.baseURL}/gym-slots/${gymId}`, {
      method: "GET",
      credentials: 'include',
    });
    return response.json();
  }

  async createOrUpdateGymSlots(
    gymId: string,
    dayOfWeek: string,
    slots: TimeSlot[],
    isClosed: boolean
  ): Promise<ApiResponse<{ gymSlot: any }>> {
    const response = await fetch(`${this.baseURL}/gym-slots/${gymId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ dayOfWeek, slots, isClosed }),
    });
    return response.json();
  }
}

export const apiService = new ApiService();
