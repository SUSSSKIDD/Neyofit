import 'dotenv/config';
import mongoose from 'mongoose';
import User from '@/user/user.model';
import { Gym, GymFacility } from '@/gym/gym.model';
import { Location } from '@/location/location.model';
import { SubscriptionListing } from '@/subscriptionListing/subscriptionListing.model';
import { Subscription } from '@/subscription/subscription.model';
import { Payment } from '@/payment/payment.model';
import { GymReview } from '@/gymReview/gymReview.model';
import { GymSlot } from '@/gymSlots/gymSlot.model';
import { GymPicture } from '@/gymPictures/gymPicture.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neo-new';

// ─── Helpers ───────────────────────────────────────────────
function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function slotId() {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Seed Function ─────────────────────────────────────────
async function seed() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to', MONGO_URI);

  // Clear existing data
  console.log('🗑️  Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Location.deleteMany({}),
    GymFacility.deleteMany({}),
    Gym.deleteMany({}),
    SubscriptionListing.deleteMany({}),
    Subscription.deleteMany({}),
    Payment.deleteMany({}),
    GymReview.deleteMany({}),
    GymSlot.deleteMany({}),
    GymPicture.deleteMany({}),
  ]);
  console.log('✅ Database cleared');

  // ─── 1. Users ────────────────────────────────────────────
  console.log('👤 Creating users…');

  const superadmin = await User.create({
    userType: 'superadmin',
    name: 'Admin Neyofit',
    email: 'admin@Neyofit.com',
    phone: '+919999900001',
    password: 'NeyofitAdmin123',
    isActive: true,
    isEmailVerified: true,
  });

  const gymOwner1 = await User.create({
    userType: 'gym',
    name: 'Rajesh Sharma',
    email: 'rajesh@fitzone.com',
    phone: '+919999900002',
    password: 'GymOwnerPass123',
    isActive: true,
    isEmailVerified: true,
  });

  const gymOwner2 = await User.create({
    userType: 'gym',
    name: 'Priya Patel',
    email: 'priya@ironpump.com',
    phone: '+919999900003',
    password: 'GymOwnerPass123',
    isActive: true,
    isEmailVerified: true,
  });

  const customers = await User.create([
    {
      userType: 'customer',
      name: 'Amit Kumar',
      email: 'amit@gmail.com',
      phone: '+919999900010',
      password: 'CustomerPass123',
      isActive: true,
      isEmailVerified: true,
    },
    {
      userType: 'customer',
      name: 'Sneha Gupta',
      email: 'sneha@gmail.com',
      phone: '+919999900011',
      password: 'CustomerPass123',
      isActive: true,
      isEmailVerified: true,
    },
    {
      userType: 'customer',
      name: 'Rohit Mehra',
      email: 'rohit@gmail.com',
      phone: '+919999900012',
      password: 'CustomerPass123',
      isActive: true,
      isEmailVerified: true,
    },
    {
      userType: 'customer',
      name: 'Neha Singh',
      email: 'neha@gmail.com',
      phone: '+919999900013',
      password: 'CustomerPass123',
      isActive: true,
      isEmailVerified: true,
    },
    {
      userType: 'customer',
      name: 'Vikram Joshi',
      email: 'vikram@gmail.com',
      phone: '+919999900014',
      password: 'CustomerPass123',
      isActive: true,
      isEmailVerified: true,
    },
  ]);

  console.log(`  ✅ Created 1 superadmin, 2 gym owners, ${customers.length} customers`);

  // ─── 2. Locations ────────────────────────────────────────
  console.log('📍 Creating locations…');

  const locations = await Location.create([
    {
      name: 'Koramangala, Bangalore',
      address: { street: '80 Feet Road', city: 'Bangalore', state: 'Karnataka', pinCode: '560034', country: 'India' },
      coordinates: { type: 'Point', coordinates: [77.6245, 12.9352] },
    },
    {
      name: 'Indiranagar, Bangalore',
      address: { street: '100 Feet Road', city: 'Bangalore', state: 'Karnataka', pinCode: '560038', country: 'India' },
      coordinates: { type: 'Point', coordinates: [77.6408, 12.9784] },
    },
    {
      name: 'Andheri West, Mumbai',
      address: { street: 'Linking Road', city: 'Mumbai', state: 'Maharashtra', pinCode: '400053', country: 'India' },
      coordinates: { type: 'Point', coordinates: [72.8296, 19.1364] },
    },
    {
      name: 'Banjara Hills, Hyderabad',
      address: { street: 'Road No 12', city: 'Hyderabad', state: 'Telangana', pinCode: '500034', country: 'India' },
      coordinates: { type: 'Point', coordinates: [78.4401, 17.4156] },
    },
    {
      name: 'Connaught Place, Delhi',
      address: { street: 'Block A, Inner Circle', city: 'New Delhi', state: 'Delhi', pinCode: '110001', country: 'India' },
      coordinates: { type: 'Point', coordinates: [77.2195, 28.6315] },
    },
    {
      name: 'Salt Lake, Kolkata',
      address: { street: 'Sector V', city: 'Kolkata', state: 'West Bengal', pinCode: '700091', country: 'India' },
      coordinates: { type: 'Point', coordinates: [88.4337, 22.5726] },
    },
  ]);

  console.log(`  ✅ Created ${locations.length} locations`);

  // ─── 3. Facilities ───────────────────────────────────────
  console.log('🏗️  Creating facilities…');

  const facilities = await GymFacility.create([
    { name: 'Cardio Zone' },
    { name: 'Weight Training' },
    { name: 'Yoga Studio' },
    { name: 'Swimming Pool' },
    { name: 'Steam & Sauna' },
    { name: 'Personal Training' },
    { name: 'Locker Room' },
    { name: 'Parking' },
    { name: 'Shower' },
    { name: 'CrossFit Area' },
    { name: 'Zumba Classes' },
    { name: 'Juice Bar' },
  ]);

  console.log(`  ✅ Created ${facilities.length} facilities`);

  // ─── 4. Gyms ─────────────────────────────────────────────
  console.log('🏋️ Creating gyms…');

  const gyms = await Gym.create([
    {
      name: 'FitZone Koramangala',
      description: 'Premium fitness center in the heart of Koramangala with world-class equipment and certified trainers. Open 6 AM to 11 PM daily.',
      locationId: locations[0]._id,
      ownerId: gymOwner1._id,
      facilities: [facilities[0]._id, facilities[1]._id, facilities[2]._id, facilities[5]._id, facilities[6]._id, facilities[8]._id],
      contact: { phone: '+918001234567', email: 'info@fitzone.com', website: 'https://fitzone.com' },
      rating: 4.5,
      priceRange: 'premium',
      isActive: true,
      status: 'published',
    },
    {
      name: 'FitZone Indiranagar',
      description: 'State-of-the-art gym with Olympic lifting platforms, functional training area, and luxury locker rooms.',
      locationId: locations[1]._id,
      ownerId: gymOwner1._id,
      facilities: [facilities[0]._id, facilities[1]._id, facilities[9]._id, facilities[6]._id, facilities[7]._id],
      contact: { phone: '+918001234568', email: 'indiranagar@fitzone.com' },
      rating: 4.2,
      priceRange: 'premium',
      isActive: true,
      status: 'published',
    },
    {
      name: 'Iron Pump Gym',
      description: 'Affordable yet powerful gym for serious lifters. Great community of bodybuilders and strength athletes.',
      locationId: locations[2]._id,
      ownerId: gymOwner2._id,
      facilities: [facilities[0]._id, facilities[1]._id, facilities[6]._id, facilities[8]._id],
      contact: { phone: '+918009876543', email: 'info@ironpump.com' },
      rating: 4.0,
      priceRange: 'budget',
      isActive: true,
      status: 'published',
    },
    {
      name: 'Iron Pump Elite',
      description: 'Our premium branch with pool, sauna, and spa facilities alongside hardcore training equipment.',
      locationId: locations[3]._id,
      ownerId: gymOwner2._id,
      facilities: [facilities[0]._id, facilities[1]._id, facilities[3]._id, facilities[4]._id, facilities[5]._id, facilities[6]._id, facilities[11]._id],
      contact: { phone: '+918009876544', email: 'elite@ironpump.com' },
      rating: 4.7,
      priceRange: 'premium',
      isActive: true,
      status: 'published',
    },
    {
      name: 'BodyCraft Fitness',
      description: 'Modern gym with group classes, personal training, and a relaxing juice bar. Perfect for beginners and pros alike.',
      locationId: locations[4]._id,
      ownerId: gymOwner1._id,
      facilities: [facilities[0]._id, facilities[1]._id, facilities[2]._id, facilities[10]._id, facilities[11]._id, facilities[7]._id],
      contact: { phone: '+918005551234', email: 'hello@bodycraft.in' },
      rating: 3.8,
      priceRange: 'mid-range',
      isActive: true,
      status: 'published',
    },
    {
      name: 'Zen Yoga & Wellness',
      description: 'Dedicated yoga and wellness studio with meditation rooms, hot yoga, and aerial yoga classes.',
      locationId: locations[5]._id,
      ownerId: gymOwner2._id,
      facilities: [facilities[2]._id, facilities[4]._id, facilities[6]._id, facilities[8]._id],
      contact: { phone: '+918007779999', email: 'namaste@zenyoga.in' },
      rating: 4.6,
      priceRange: 'mid-range',
      isActive: true,
      status: 'draft',
    },
  ]);

  console.log(`  ✅ Created ${gyms.length} gyms`);

  // ─── 5. Subscription Listings (Plans) ────────────────────
  console.log('💳 Creating subscription plans…');

  const plans: any[] = [];

  for (const gym of gyms.filter(g => g.status === 'published')) {
    const gymPlans = await SubscriptionListing.create([
      {
        name: 'Daily Pass',
        description: `Single day access to ${gym.name}`,
        type: 'daily',
        durationInDays: 1,
        gymId: gym._id,
        cost: gym.priceRange === 'premium' ? 500 : gym.priceRange === 'mid-range' ? 300 : 150,
        currency: 'INR',
        isActive: true,
        features: ['Full gym access', 'Locker included'],
      },
      {
        name: 'Weekly Pass',
        description: `7 days unlimited access to ${gym.name}`,
        type: 'custom',
        customTypeText: 'Weekly',
        durationInDays: 7,
        gymId: gym._id,
        cost: gym.priceRange === 'premium' ? 2000 : gym.priceRange === 'mid-range' ? 1200 : 700,
        currency: 'INR',
        isActive: true,
        features: ['Full gym access', 'Locker included', 'Group classes'],
      },
      {
        name: 'Monthly Membership',
        description: `Full month membership at ${gym.name}`,
        type: 'monthly',
        durationInDays: 30,
        gymId: gym._id,
        cost: gym.priceRange === 'premium' ? 5000 : gym.priceRange === 'mid-range' ? 3000 : 1500,
        currency: 'INR',
        isActive: true,
        discount: { amount: 10, type: 'percentage', validUntil: daysFromNow(60) },
        features: ['Full gym access', 'Locker included', 'Group classes', 'Personal trainer (1 session)'],
      },
      {
        name: 'Annual Membership',
        description: `Best value! 12 months at ${gym.name}`,
        type: 'yearly',
        durationInDays: 365,
        gymId: gym._id,
        cost: gym.priceRange === 'premium' ? 45000 : gym.priceRange === 'mid-range' ? 28000 : 14000,
        currency: 'INR',
        isActive: true,
        discount: { amount: 20, type: 'percentage', validUntil: daysFromNow(90) },
        features: ['Full gym access', 'Locker included', 'All group classes', 'Personal trainer (4 sessions/month)', 'Diet consultation'],
      },
    ]);

    // Link plans to gym
    await Gym.findByIdAndUpdate(gym._id, {
      subscriptionListings: gymPlans.map(p => p._id),
    });

    plans.push(...gymPlans);
  }

  console.log(`  ✅ Created ${plans.length} subscription plans`);

  // ─── 6. Subscriptions & Payments ─────────────────────────
  console.log('📄 Creating subscriptions and payments…');

  const subscriptionsData = [
    { user: customers[0], plan: plans[2], daysAgoStart: 10 },  // Amit → FitZone monthly (active)
    { user: customers[1], plan: plans[6], daysAgoStart: 5 },   // Sneha → Iron Pump monthly (active)
    { user: customers[2], plan: plans[15], daysAgoStart: 60 },  // Rohit → BodyCraft annual (active)
    { user: customers[3], plan: plans[0], daysAgoStart: 0 },   // Neha → FitZone daily (today)
    { user: customers[4], plan: plans[10], daysAgoStart: 3 },  // Vikram → Iron Pump Elite monthly (active)
    { user: customers[0], plan: plans[9], daysAgoStart: 2 },   // Amit → Iron Pump Elite weekly (active)
    { user: customers[1], plan: plans[4], daysAgoStart: 20 },  // Sneha → FitZone Indiranagar monthly (active)
  ];

  let subCount = 0;
  let payCount = 0;

  for (const { user, plan, daysAgoStart } of subscriptionsData) {
    if (!plan) continue;

    const startDate = daysAgo(daysAgoStart);
    const endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);
    const isActive = endDate > new Date();

    const subscription = await Subscription.create({
      userId: user._id,
      subscriptionListingId: plan._id,
      startDate,
      endDate,
      status: isActive ? 'active' : 'expired',
      isRecurring: false,
    });
    subCount++;

    await Payment.create({
      userId: user._id,
      subscriptionId: subscription._id,
      razorpayOrderId: `order_seed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      razorpayPaymentId: `pay_seed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      razorpaySignature: 'seed_signature_placeholder',
      amount: plan.cost,
      currency: plan.currency,
      status: 'paid',
    });
    payCount++;
  }

  // Add a few failed/created payments for realism
  await Payment.create([
    {
      userId: customers[2]._id,
      razorpayOrderId: `order_seed_failed_1`,
      amount: 5000,
      currency: 'INR',
      status: 'failed',
    },
    {
      userId: customers[3]._id,
      razorpayOrderId: `order_seed_created_1`,
      amount: 2000,
      currency: 'INR',
      status: 'created',
    },
  ]);
  payCount += 2;

  console.log(`  ✅ Created ${subCount} subscriptions and ${payCount} payments`);

  // ─── 7. Gym Reviews ──────────────────────────────────────
  console.log('⭐ Creating reviews…');

  const reviews = await GymReview.create([
    { gymId: gyms[0]._id, userId: customers[0]._id, rating: 5, comment: 'Best gym in Koramangala! Amazing equipment and the trainers are super knowledgeable.' },
    { gymId: gyms[0]._id, userId: customers[1]._id, rating: 4, comment: 'Great facility, gets a bit crowded during evenings though.' },
    { gymId: gyms[0]._id, userId: customers[3]._id, rating: 5, comment: 'Clean, well-maintained, and great variety of machines. Love it!' },
    { gymId: gyms[1]._id, userId: customers[0]._id, rating: 4, comment: 'Good gym with nice CrossFit setup. Parking can be tricky.' },
    { gymId: gyms[1]._id, userId: customers[4]._id, rating: 4, comment: 'Solid gym, friendly staff. Would love to see more group classes.' },
    { gymId: gyms[2]._id, userId: customers[1]._id, rating: 4, comment: 'Affordable and has everything you need. No frills but gets the job done.' },
    { gymId: gyms[2]._id, userId: customers[2]._id, rating: 3, comment: 'Decent gym for the price. Could use some newer cardio machines.' },
    { gymId: gyms[3]._id, userId: customers[4]._id, rating: 5, comment: 'The pool and sauna are incredible! Worth every rupee of the premium membership.' },
    { gymId: gyms[3]._id, userId: customers[2]._id, rating: 5, comment: 'Absolutely premium experience. The juice bar is a nice touch after workouts.' },
    { gymId: gyms[4]._id, userId: customers[3]._id, rating: 4, comment: 'Good gym in CP area. The Zumba classes are really fun!' },
  ]);

  console.log(`  ✅ Created ${reviews.length} reviews`);

  // ─── 8. Gym Slots ────────────────────────────────────────
  console.log('🕐 Creating time slots…');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  let slotCount = 0;

  for (const gym of gyms.filter(g => g.status === 'published')) {
    for (const day of days) {
      const isSunday = day === 'sunday';
      await GymSlot.create({
        gymId: gym._id,
        dayOfWeek: day,
        isClosed: false,
        slots: isSunday
          ? [
            { id: slotId(), name: 'Morning', startTime: '07:00', endTime: '12:00', isActive: true },
          ]
          : [
            { id: slotId(), name: 'Morning', startTime: '06:00', endTime: '10:00', isActive: true },
            { id: slotId(), name: 'Afternoon', startTime: '10:00', endTime: '16:00', isActive: true },
            { id: slotId(), name: 'Evening', startTime: '16:00', endTime: '22:00', isActive: true },
          ],
      });
      slotCount++;
    }
  }

  console.log(`  ✅ Created ${slotCount} slot entries across ${gyms.filter(g => g.status === 'published').length} gyms`);

  // ─── 9. Gym Pictures ─────────────────────────────────────
  console.log('📸 Creating gym picture records…');

  let picCount = 0;
  for (const gym of gyms) {
    const pics = await GymPicture.create([
      {
        gymId: gym._id,
        imageUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800`,
        imageType: 'image/jpeg',
        caption: `${gym.name} - Main Area`,
        altText: `${gym.name} main training area`,
        uploadedBy: gym.ownerId,
        isCover: true,
      },
      {
        gymId: gym._id,
        imageUrl: `https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800`,
        imageType: 'image/jpeg',
        caption: `${gym.name} - Equipment`,
        altText: `${gym.name} equipment section`,
        uploadedBy: gym.ownerId,
        isCover: false,
      },
    ]);

    await Gym.findByIdAndUpdate(gym._id, {
      pictures: pics.map(p => p._id),
    });

    picCount += pics.length;
  }

  console.log(`  ✅ Created ${picCount} picture records`);

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 Seed complete! Here are the login credentials:\n');
  console.log('  SUPERADMIN:');
  console.log('    Email: admin@Neyofit.com');
  console.log('    Password: NeyofitAdmin123\n');
  console.log('  GYM OWNER 1 (FitZone):');
  console.log('    Email: rajesh@fitzone.com');
  console.log('    Password: GymOwnerPass123\n');
  console.log('  GYM OWNER 2 (Iron Pump):');
  console.log('    Email: priya@ironpump.com');
  console.log('    Password: GymOwnerPass123\n');
  console.log('  CUSTOMERS:');
  console.log('    Email: amit@gmail.com     | Password: CustomerPass123');
  console.log('    Email: sneha@gmail.com    | Password: CustomerPass123');
  console.log('    Email: rohit@gmail.com    | Password: CustomerPass123');
  console.log('    Email: neha@gmail.com     | Password: CustomerPass123');
  console.log('    Email: vikram@gmail.com   | Password: CustomerPass123');
  console.log('═'.repeat(50));

  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB. Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});