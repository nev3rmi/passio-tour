import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/config';

const pool = new Pool({
  host: config.DATABASE.host,
  port: config.DATABASE.port,
  database: 'passio_tour', // Use the correct database name
  user: config.DATABASE.username,
  password: config.DATABASE.password || '',
});

// Demo users
const demoUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@passiotour.com',
    password: 'Admin@123',
    full_name: 'Admin User',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    phone: '+1234567890',
    status: 'active',
    email_verified: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'tour-operator@example.com',
    password: 'Operator@123',
    full_name: 'Sarah Johnson',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'tour_operator',
    phone: '+1234567892',
    status: 'active',
    email_verified: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'partner@example.com',
    password: 'Partner@123',
    full_name: 'Mike Williams',
    first_name: 'Mike',
    last_name: 'Williams',
    role: 'partner',
    phone: '+1234567893',
    status: 'active',
    email_verified: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'customer1@example.com',
    password: 'Customer@123',
    full_name: 'Emma Davis',
    first_name: 'Emma',
    last_name: 'Davis',
    role: 'customer',
    phone: '+1234567894',
    status: 'active',
    email_verified: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'customer2@example.com',
    password: 'Customer2@123',
    full_name: 'John Smith',
    first_name: 'John',
    last_name: 'Smith',
    role: 'customer',
    phone: '+1234567895',
    status: 'active',
    email_verified: true,
  },
];

// Demo tours
const demoTours = [
  {
    title: 'Bali Island Paradise Experience',
    slug: 'bali-island-paradise',
    short_description: 'Discover the magic of Bali with temples, beaches, and rice terraces',
    description: 'Experience the enchanting island of Bali with its stunning beaches, ancient temples, lush rice terraces, and vibrant culture. This comprehensive tour includes visits to iconic temples like Tanah Lot and Uluwatu\'s art scene, and relaxation on pristine beaches.',
    type: 'beach',
    operator_id: '550e8400-e29b-41d4-a716-446655440002',
    base_price: 1299.00,
    currency: 'USD',
    duration_hours: 168,
    start_time: '09:00',
    country: 'Indonesia',
    city: 'Bali',
    max_participants: 15,
    min_participants: 2,
    difficulty: 'easy',
    languages: ['English', 'Indonesian'],
    status: 'active',
  },
  {
    title: 'Tokyo & Mount Fuji Adventure',
    slug: 'tokyo-mount-fuji-adventure',
    short_description: 'Explore modern Tokyo and the iconic Mount Fuji',
    description: 'Immerse yourself in the perfect blend of modern and traditional Japan. Visit Tokyo\'s bustling districts, experience authentic Japanese cuisine, and take a day trip to the majestic Mount Fuji. This tour offers a perfect introduction to Japanese culture and landscapes.',
    type: 'adventure',
    operator_id: '550e8400-e29b-41d4-a716-446655440002',
    base_price: 1899.00,
    currency: 'USD',
    duration_hours: 120,
    start_time: '08:00',
    country: 'Japan',
    city: 'Tokyo',
    max_participants: 10,
    min_participants: 1,
    difficulty: 'moderate',
    languages: ['English', 'Japanese'],
    status: 'active',
  },
  {
    title: 'Singapore City Discovery',
    slug: 'singapore-city-discovery',
    short_description: 'Experience the multicultural metropolis of Singapore',
    description: 'Discover Singapore\'s unique blend of cultures, modern architecture, and world-class attractions. Visit Gardens by the Bay, Marina Bay Sands, Chinatown, Little India, and enjoy the famous Singapore street food. Perfect for first-time visitors.',
    type: 'city',
    operator_id: '550e8400-e29b-41d4-a716-446655440002',
    base_price: 799.00,
    currency: 'USD',
    duration_hours: 72,
    start_time: '10:00',
    country: 'Singapore',
    city: 'Singapore',
    max_participants: 20,
    min_participants: 1,
    difficulty: 'easy',
    languages: ['English', 'Mandarin', 'Malay'],
    status: 'active',
  },
  {
    title: 'Bangkok Temples & Markets Tour',
    slug: 'bangkok-temples-markets',
    short_description: 'Explore Bangkok\'s magnificent temples and vibrant markets',
    description: 'Dive into the heart of Thailand with visits to Bangkok\'s most iconic temples including Wat Pho and Wat Arun. Experience the bustling Chatuchak weekend market, enjoy a Chao Phraya river cruise, and taste authentic Thai street food.',
    type: 'cultural',
    operator_id: '550e8400-e29b-41d4-a716-446655440002',
    base_price: 299.00,
    currency: 'USD',
    duration_hours: 48,
    start_time: '09:30',
    country: 'Thailand',
    city: 'Bangkok',
    max_participants: 12,
    min_participants: 1,
    difficulty: 'easy',
    languages: ['English', 'Thai'],
    status: 'active',
  },
  {
    title: 'Kuala Lumpur Heritage Walk',
    slug: 'kuala-lumpur-heritage',
    short_description: 'Discover KL\'s rich cultural heritage and modern skyline',
    description: 'Explore Kuala Lumpur\'s diverse neighborhoods, from colonial architecture to modern skyscrapers. Visit the iconic Petronas Towers, explore Batu Caves, and wander through colorful markets in Chinatown and Little India.',
    type: 'historical',
    operator_id: '550e8400-e29b-41d4-a716-446655440003',
    base_price: 199.00,
    currency: 'USD',
    duration_hours: 36,
    start_time: '08:30',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    max_participants: 8,
    min_participants: 1,
    difficulty: 'moderate',
    languages: ['English', 'Malay'],
    status: 'active',
  },
  {
    title: 'Phuket Beach & Island Hopping',
    slug: 'phuket-beach-island-hopping',
    short_description: 'Relax on pristine beaches and explore nearby islands',
    description: 'Enjoy Thailand\'s famous beaches in Phuket with crystal-clear waters and white sand. Take boat trips to nearby islands like Phi Phi and James Bond Island. Perfect for beach lovers and snorkeling enthusiasts.',
    type: 'beach',
    operator_id: '550e8400-e29b-41d4-a716-446655440003',
    base_price: 899.00,
    currency: 'USD',
    duration_hours: 96,
    start_time: '09:00',
    country: 'Thailand',
    city: 'Phuket',
    max_participants: 8,
    min_participants: 2,
    difficulty: 'easy',
    languages: ['English', 'Thai'],
    status: 'active',
  },
];


// Demo tour images
const demoTourImages = [
  // Bali images
  { tour_slug: 'bali-island-paradise', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', alt_text: 'Bali rice terraces', is_primary: true, sort_order: 1 },
  { tour_slug: 'bali-island-paradise', url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800', alt_text: 'Tanah Lot temple', is_primary: false, sort_order: 2 },
  { tour_slug: 'bali-island-paradise', url: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?w=800', alt_text: 'Bali beach', is_primary: false, sort_order: 3 },
  
  // Tokyo images
  { tour_slug: 'tokyo-mount-fuji-adventure', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', alt_text: 'Tokyo skyline', is_primary: true, sort_order: 1 },
  { tour_slug: 'tokyo-mount-fuji-adventure', url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt_text: 'Mount Fuji', is_primary: false, sort_order: 2 },
  { tour_slug: 'tokyo-mount-fuji-adventure', url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800', alt_text: 'Cherry blossoms', is_primary: false, sort_order: 3 },
  
  // Singapore images
  { tour_slug: 'singapore-city-discovery', url: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=800', alt_text: 'Marina Bay Sands', is_primary: true, sort_order: 1 },
  { tour_slug: 'singapore-city-discovery', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', alt_text: 'Gardens by the Bay', is_primary: false, sort_order: 2 },
  
  // Bangkok images
  { tour_slug: 'bangkok-temples-markets', url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800', alt_text: 'Wat Arun temple', is_primary: true, sort_order: 1 },
  { tour_slug: 'bangkok-temples-markets', url: 'https://images.unsplash.com/photo-1569660072562-48a035e65c30?w=800', alt_text: 'Bangkok street food', is_primary: false, sort_order: 2 },
  
  // Kuala Lumpur images
  { tour_slug: 'kuala-lumpur-heritage', url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', alt_text: 'Petronas Towers', is_primary: true, sort_order: 1 },
  { tour_slug: 'kuala-lumpur-heritage', url: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800', alt_text: 'Batu Caves', is_primary: false, sort_order: 2 },
  
  // Phuket images
  { tour_slug: 'phuket-beach-island-hopping', url: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800', alt_text: 'Phuket beach', is_primary: true, sort_order: 1 },
  { tour_slug: 'phuket-beach-island-hopping', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', alt_text: 'Phi Phi Islands', is_primary: false, sort_order: 2 },
];

// Demo tour dates
const demoTourDates = [
  { tour_slug: 'bali-island-paradise', date: '2025-01-15', max_participants: 15 },
  { tour_slug: 'bali-island-paradise', date: '2025-01-22', max_participants: 15 },
  { tour_slug: 'bali-island-paradise', date: '2025-01-29', max_participants: 15 },
  { tour_slug: 'tokyo-mount-fuji-adventure', date: '2025-01-20', max_participants: 10 },
  { tour_slug: 'tokyo-mount-fuji-adventure', date: '2025-02-03', max_participants: 10 },
  { tour_slug: 'singapore-city-discovery', date: '2025-01-18', max_participants: 20 },
  { tour_slug: 'singapore-city-discovery', date: '2025-01-25', max_participants: 20 },
  { tour_slug: 'bangkok-temples-markets', date: '2025-01-16', max_participants: 12 },
  { tour_slug: 'bangkok-temples-markets', date: '2025-01-17', max_participants: 12 },
  { tour_slug: 'kuala-lumpur-heritage', date: '2025-01-19', max_participants: 8 },
  { tour_slug: 'phuket-beach-island-hopping', date: '2025-01-21', max_participants: 8 },
  { tour_slug: 'phuket-beach-island-hopping', date: '2025-01-28', max_participants: 8 },
];

async function seedUsers() {
  console.log('Seeding users...');
  
  // Test database connection first
  try {
    const result = await pool.query('SELECT 1');
    console.log('Database connection successful');
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
  
  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    try {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, first_name, last_name, role, phone, status, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, hashedPassword, user.full_name, user.first_name, user.last_name, user.role, user.phone, user.status, user.email_verified]
      );
      console.log(`✓ User ${user.email} seeded successfully`);
    } catch (err) {
      console.error(`Failed to seed user ${user.email}:`, err);
      throw err;
    }
  }
  
  console.log('✓ Users seeded successfully');
}

async function seedTours() {
  console.log('Seeding tours...');
  
  // First, create a default tour category if it doesn't exist
  await pool.query(`
    INSERT INTO tour_categories (name, slug, description, is_active, created_at, updated_at)
    VALUES ('General', 'general', 'General tour category', true, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  
  // Get the category ID
  const categoryResult = await pool.query('SELECT id FROM tour_categories WHERE name = $1', ['General']);
  const categoryId = categoryResult.rows[0]?.id;
  
  for (const tour of demoTours) {
    try {
      await pool.query(
        `INSERT INTO tours (
          title, slug, short_description, description, type, operator_id, base_price, currency,
          duration_hours, start_time, country, city, max_participants, min_participants,
          difficulty, languages, status, category_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING`,
        [
          tour.title, tour.slug, tour.short_description, tour.description, tour.type,
          tour.operator_id, tour.base_price, tour.currency, tour.duration_hours,
          tour.start_time, tour.country, tour.city, tour.max_participants,
          tour.min_participants, tour.difficulty, tour.languages, tour.status, categoryId
        ]
      );
      console.log(`✓ Tour "${tour.title}" seeded successfully`);
    } catch (err) {
      console.error(`Failed to seed tour "${tour.title}":`, err);
      throw err;
    }
  }
  
  console.log('✓ Tours seeded successfully');
}

async function seedTourImages() {
  console.log('Seeding tour images...');
  
  for (const image of demoTourImages) {
    try {
      // Get tour ID from slug
      const tourResult = await pool.query('SELECT id FROM tours WHERE slug = $1', [image.tour_slug]);
      
      if (tourResult.rows.length > 0) {
        const tourId = tourResult.rows[0].id;
        
        await pool.query(
          `INSERT INTO tour_images (tour_id, url, alt_text, is_primary, sort_order, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT DO NOTHING`,
          [tourId, image.url, image.alt_text, image.is_primary, image.sort_order]
        );
        console.log(`✓ Tour image "${image.alt_text}" seeded successfully`);
      }
    } catch (err) {
      console.error(`Failed to seed tour image "${image.alt_text}":`, err);
      throw err;
    }
  }
  
  console.log('✓ Tour images seeded successfully');
}

async function seedTourDates() {
  console.log('Seeding tour dates...');
  
  for (const dateItem of demoTourDates) {
    try {
      // Get tour ID from slug
      const tourResult = await pool.query('SELECT id FROM tours WHERE slug = $1', [dateItem.tour_slug]);
      
      if (tourResult.rows.length > 0) {
        const tourId = tourResult.rows[0].id;
        
        await pool.query(
          `INSERT INTO tour_dates (tour_id, date, available, max_participants, current_participants, created_at, updated_at)
           VALUES ($1, $2, true, $3, 0, NOW(), NOW())
           ON CONFLICT (tour_id, date) DO NOTHING`,
          [tourId, dateItem.date, dateItem.max_participants]
        );
        console.log(`✓ Tour date ${dateItem.date} for "${dateItem.tour_slug}" seeded successfully`);
      }
    } catch (err) {
      console.error(`Failed to seed tour date ${dateItem.date} for "${dateItem.tour_slug}":`, err);
      throw err;
    }
  }
  
  console.log('✓ Tour dates seeded successfully');
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await seedUsers();
    await seedTours();
    await seedTourImages();
    await seedTourDates();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nDemo Accounts:');
    console.log('- Admin: admin@passiotour.com / Admin@123');
    console.log('- Tour Operator: tour-operator@example.com / Operator@123');
    console.log('- Partner: partner@example.com / Partner@123');
    console.log('- Customer 1: customer1@example.com / Customer@123');
    console.log('- Customer 2: customer2@example.com / Customer2@123');
    console.log('\nDemo Tours Available:');
    console.log('- Bali Island Paradise Experience (Beach Tour)');
    console.log('- Tokyo & Mount Fuji Adventure (Adventure Tour)');
    console.log('- Singapore City Discovery (City Tour)');
    console.log('- Bangkok Temples & Markets Tour (Cultural Tour)');
    console.log('- Kuala Lumpur Heritage Walk (Historical Tour)');
    console.log('- Phuket Beach & Island Hopping (Beach Tour)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();