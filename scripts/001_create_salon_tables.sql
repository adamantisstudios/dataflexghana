-- Salon & Beauty Services Database Schema
-- Run this script in Supabase SQL editor to set up the salon feature

-- Create salon_categories table
CREATE TABLE IF NOT EXISTS salon_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create salon_services table
CREATE TABLE IF NOT EXISTS salon_services (
  id BIGSERIAL PRIMARY KEY,
  service_name VARCHAR(200) NOT NULL,
  service_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category_id BIGINT NOT NULL REFERENCES salon_categories(id) ON DELETE CASCADE,
  base_price DECIMAL(10, 2) NOT NULL,
  express_price DECIMAL(10, 2),
  duration_minutes INT DEFAULT 60,
  provider_name VARCHAR(150) NOT NULL,
  provider_contact VARCHAR(20),
  provider_location VARCHAR(200),
  provider_availability TEXT,
  provider_social_media JSONB,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create salon_bookings table
CREATE TABLE IF NOT EXISTS salon_bookings (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES salon_services(id) ON DELETE CASCADE,
  service_name VARCHAR(200) NOT NULL,
  client_name VARCHAR(150) NOT NULL,
  client_whatsapp VARCHAR(20) NOT NULL,
  location VARCHAR(200) NOT NULL,
  landmark VARCHAR(255),
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create salon_locations table (Accra suburbs)
CREATE TABLE IF NOT EXISTS salon_locations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  region VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create salon_referrals table
CREATE TABLE IF NOT EXISTS salon_referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_name VARCHAR(150) NOT NULL,
  referrer_whatsapp VARCHAR(20) NOT NULL,
  referrer_email VARCHAR(100),
  referred_name VARCHAR(150) NOT NULL,
  referred_whatsapp VARCHAR(20) NOT NULL,
  service_name VARCHAR(200) NOT NULL,
  location VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert salon categories
INSERT INTO salon_categories (name, description, icon) VALUES
('Braiding Services', 'Box braids, cornrows, twists, and specialty braiding styles', 'braids'),
('Hair Styling', 'Haircuts, coloring, relaxing, and styling services', 'scissors'),
('Hair Care & Treatment', 'Deep conditioning, scalp treatments, and hair wellness', 'droplet'),
('Nail Services', 'Manicure, pedicure, and nail art', 'nail'),
('Makeup Services', 'Makeup application, eyebrows, and face services', 'face'),
('Massage & Spa', 'Professional massage and relaxation treatments', 'spa'),
('Waxing & Epilation', 'Hair removal services including waxing and threading', 'zap'),
('Special Services', 'Bridal makeup, event styling, and custom services', 'sparkles')
ON CONFLICT (name) DO NOTHING;

-- Insert Accra locations
INSERT INTO salon_locations (name, region) VALUES
-- Central Accra
('Abelenkpe', 'Central Accra'),
('Abossey Okai', 'Central Accra'),
('Accra New Town', 'Central Accra'),
('Adabraka', 'Central Accra'),
('Airport Residential Area', 'Central Accra'),
('Asylum Down', 'Central Accra'),
('Avenor', 'Central Accra'),
('Cantonments', 'Central Accra'),
('Christiansborg / Osu', 'Central Accra'),
('Dzorwulu', 'Central Accra'),
('Jamestown', 'Central Accra'),
('Kanda', 'Central Accra'),
('Kokomlemle', 'Central Accra'),
('Korle Bu', 'Central Accra'),
('Korle Gonno', 'Central Accra'),
('Kotobabi', 'Central Accra'),
('Kpehe', 'Central Accra'),
('Labone', 'Central Accra'),
('Maamobi', 'Central Accra'),
('Ministries', 'Central Accra'),
('North Ridge', 'Central Accra'),
('Nyaniba', 'Central Accra'),
('Okaishie', 'Central Accra'),
('Osu', 'Central Accra'),
('Osu Kinkawe', 'Central Accra'),
('Ringway Estates', 'Central Accra'),
('Roman Ridge', 'Central Accra'),
('Shiabu', 'Central Accra'),
('South La', 'Central Accra'),
('Swalaba', 'Central Accra'),
('Tudu', 'Central Accra'),
('Usshertown', 'Central Accra'),
('Victoriaborg', 'Central Accra'),
('West Ridge', 'Central Accra'),

-- Western Accra
('Ablekuma', 'Western Accra'),
('Abofu', 'Western Accra'),
('Awoshie', 'Western Accra'),
('Bubiashie', 'Western Accra'),
('Chorkor', 'Western Accra'),
('Darkuman', 'Western Accra'),
('Dansoman', 'Western Accra'),
('Dunkonah', 'Western Accra'),
('Gbawe', 'Western Accra'),
('Glefe', 'Western Accra'),
('Kaneshie', 'Western Accra'),
('Lapaz', 'Western Accra'),
('Lartebiokorshie', 'Western Accra'),
('Mamprobi', 'Western Accra'),
('Mataheko', 'Western Accra'),
('Mpoase', 'Western Accra'),
('New Mamprobi', 'Western Accra'),
('Odorkor', 'Western Accra'),
('Russia', 'Western Accra'),
('Sabon Zongo', 'Western Accra'),
('Santa Maria', 'Western Accra'),
('Tesano', 'Western Accra'),

-- Northern Accra
('Abeka', 'Northern Accra'),
('Achimota', 'Northern Accra'),
('Agbogba', 'Northern Accra'),
('Alajo', 'Northern Accra'),
('Amasaman', 'Northern Accra'),
('Apenkwa', 'Northern Accra'),
('Ashaiman', 'Northern Accra'),
('Ashongman', 'Northern Accra'),
('Ashaley Botwe', 'Northern Accra'),
('Bortianor', 'Northern Accra'),
('Christian Village', 'Northern Accra'),
('Dome', 'Northern Accra'),
('Dodowa', 'Northern Accra'),
('Gbwe', 'Northern Accra'),
('Haatso', 'Northern Accra'),
('Kwabenya', 'Northern Accra'),
('Kwashieman', 'Northern Accra'),
('Madina', 'Northern Accra'),
('Nima', 'Northern Accra'),
('Nkwatanang', 'Northern Accra'),
('North Legon', 'Northern Accra'),
('Ofankor', 'Northern Accra'),
('Oyarifa', 'Northern Accra'),
('Pantang', 'Northern Accra'),
('Pokuase', 'Northern Accra'),
('Taifa', 'Northern Accra'),
('West Legon', 'Northern Accra'),

-- Eastern & Coastal Accra
('Adenta', 'Eastern Accra'),
('Adjiringanor', 'Eastern Accra'),
('Airport Hills', 'Eastern Accra'),
('Bawaleshie', 'Eastern Accra'),
('Burma Camp', 'Eastern Accra'),
('East Legon', 'Eastern Accra'),
('Kpone', 'Eastern Accra'),
('La', 'Eastern Accra'),
('Nungua', 'Eastern Accra'),
('Prampram', 'Eastern Accra'),
('Sakumono', 'Eastern Accra'),
('Sege', 'Eastern Accra'),
('Shiashie', 'Eastern Accra'),
('Spintex Road Area', 'Eastern Accra'),
('Tema', 'Eastern Accra'),
('Teshie', 'Eastern Accra'),
('Tse Addo', 'Eastern Accra')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_salon_services_category_id ON salon_services(category_id);
CREATE INDEX IF NOT EXISTS idx_salon_services_status ON salon_services(status);
CREATE INDEX IF NOT EXISTS idx_salon_bookings_service_id ON salon_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_salon_bookings_status ON salon_bookings(status);
CREATE INDEX IF NOT EXISTS idx_salon_bookings_created_at ON salon_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_salon_locations_name ON salon_locations(name);
CREATE INDEX IF NOT EXISTS idx_salon_referrals_status ON salon_referrals(status);
CREATE INDEX IF NOT EXISTS idx_salon_referrals_created_at ON salon_referrals(created_at);
CREATE INDEX IF NOT EXISTS idx_salon_referrals_location ON salon_referrals(location);

-- Insert sample salon services (optional - for testing)
INSERT INTO salon_services (
  service_name,
  service_code,
  description,
  category_id,
  base_price,
  express_price,
  duration_minutes,
  provider_name,
  provider_contact,
  provider_location,
  status,
  image_urls
) SELECT
  'Classic Box Braids',
  'SAL-001',
  'Full head box braids styling - professional and durable',
  (SELECT id FROM salon_categories WHERE name = 'Braiding Services'),
  120,
  160,
  180,
  'Ama Mensah',
  '+233 24 123 4567',
  'East Legon',
  'active',
  ARRAY[]::TEXT[]
UNION ALL SELECT
  'Professional Haircut & Styling',
  'SAL-002',
  'Complete haircut with modern styling techniques',
  (SELECT id FROM salon_categories WHERE name = 'Hair Styling'),
  50,
  75,
  60,
  'Kwame Boateng',
  '+233 24 987 6543',
  'Osu',
  'active',
  ARRAY[]::TEXT[]
UNION ALL SELECT
  'Luxury Spa Massage',
  'SAL-003',
  'Full body therapeutic massage with aromatherapy',
  (SELECT id FROM salon_categories WHERE name = 'Massage & Spa'),
  200,
  280,
  120,
  'Abena Asante',
  '+233 24 567 8901',
  'Cantonments',
  'active',
  ARRAY[]::TEXT[]
UNION ALL SELECT
  'Bridal Makeup Package',
  'SAL-004',
  'Complete bridal makeup with consultations and touch-ups',
  (SELECT id FROM salon_categories WHERE name = 'Special Services'),
  300,
  400,
  150,
  'Yaa Boateng',
  '+233 24 234 5678',
  'Teshie',
  'active',
  ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM salon_services WHERE service_code = 'SAL-001');

-- Grant necessary permissions if using Row Level Security
-- Note: Adjust these based on your auth setup
ALTER TABLE salon_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to services and categories
CREATE POLICY "Allow public read access to services" ON salon_services
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to categories" ON salon_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to locations" ON salon_locations
  FOR SELECT USING (true);

CREATE POLICY "Allow public create bookings" ON salon_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read bookings" ON salon_bookings
  FOR SELECT USING (true);
