-- Properties System Database Setup
-- Creates properties table and loads sample data for testing

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    property_link TEXT,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS' NOT NULL,
    category VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    location VARCHAR(255),
    description TEXT,
    contact_info JSONB DEFAULT '{}',
    badges TEXT[],
    status VARCHAR(20) DEFAULT 'Published' CHECK (status IN ('Published', 'Unpublished', 'Featured')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_currency ON properties(currency);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);

-- Insert sample properties data for testing
INSERT INTO properties (title, property_link, price, currency, category, details, location, description, contact_info, badges, status) VALUES
-- Houses for Sale (GHS)
('Modern 4-Bedroom House in East Legon', 'https://example.com/property1', 850000.00, 'GHS', 'Houses for Sale', '{"bedrooms": 4, "bathrooms": 3, "size": "250 sqm", "furnished": "Unfurnished"}', 'East Legon, Accra', 'Beautiful modern house with spacious rooms, fitted kitchen, and parking for 2 cars. Located in a quiet residential area with 24/7 security.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"New", "Featured"}', 'Featured'),

('3-Bedroom House in Tema', 'https://example.com/property2', 420000.00, 'GHS', 'Houses for Sale', '{"bedrooms": 3, "bathrooms": 2, "size": "180 sqm", "furnished": "Semi-furnished"}', 'Tema, Greater Accra', 'Well-maintained house in a serene environment. Close to schools, hospitals, and shopping centers.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Hot Deal"}', 'Published'),

-- Houses for Rent (GHS)
('Executive 2-Bedroom Apartment', 'https://example.com/property3', 2500.00, 'GHS', 'Houses for Rent', '{"bedrooms": 2, "bathrooms": 2, "size": "120 sqm", "furnished": "Fully furnished"}', 'Airport Residential, Accra', 'Luxury apartment with modern amenities, gym, swimming pool, and 24/7 security. Perfect for executives.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Luxury", "Featured"}', 'Featured'),

('1-Bedroom Studio Apartment', 'https://example.com/property4', 800.00, 'GHS', 'Apartments / Flats', '{"bedrooms": 1, "bathrooms": 1, "size": "45 sqm", "furnished": "Furnished"}', 'Adenta, Accra', 'Cozy studio apartment ideal for young professionals. Includes utilities and internet.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"New"}', 'Published'),

-- Commercial Properties (USD)
('Office Space in Cantonments', 'https://example.com/property5', 3500.00, 'USD', 'Commercial Properties', '{"size": "200 sqm", "floors": 2, "parking": "10 spaces", "furnished": "Office furniture included"}', 'Cantonments, Accra', 'Prime office location suitable for corporate headquarters. Modern facilities with backup power and high-speed internet.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Prime Location", "Featured"}', 'Featured'),

('Retail Shop in Osu', 'https://example.com/property6', 1200.00, 'USD', 'Commercial Properties', '{"size": "80 sqm", "frontage": "Street facing", "parking": "2 spaces", "furnished": "Unfurnished"}', 'Osu, Accra', 'Strategic retail location with high foot traffic. Perfect for fashion, electronics, or food business.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"High Traffic"}', 'Published'),

-- Land for Sale (GHS)
('Residential Land in Oyibi', 'https://example.com/property7', 180000.00, 'GHS', 'Land for Sale', '{"size": "100ft x 70ft", "title": "Registered", "access": "Good road access", "utilities": "Electricity and water nearby"}', 'Oyibi, Greater Accra', 'Prime residential land in a developing area. Perfect for building your dream home. All documents ready.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Registered Title", "Good Access"}', 'Published'),

('Commercial Land in Spintex', 'https://example.com/property8', 450000.00, 'GHS', 'Land for Sale', '{"size": "200ft x 150ft", "title": "Registered", "access": "Main road frontage", "utilities": "All utilities available"}', 'Spintex, Accra', 'Large commercial plot on main Spintex road. Ideal for shopping mall, office complex, or mixed-use development.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Main Road", "Commercial", "Featured"}', 'Featured'),

-- New Developments (USD)
('Luxury Estate in Trasacco', 'https://example.com/property9', 125000.00, 'USD', 'New Developments / Estates', '{"bedrooms": 3, "bathrooms": 2, "size": "180 sqm", "furnished": "Unfurnished", "amenities": "Pool, gym, security"}', 'Trasacco Valley, East Legon', 'Brand new development in prestigious Trasacco Valley. Modern architecture with world-class amenities.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Luxury", "New", "Estate"}', 'Featured'),

-- Short Stay Rentals (GHS)
('Airbnb Apartment in Labone', 'https://example.com/property10', 350.00, 'GHS', 'Short Stay / Airbnb-style Rentals', '{"bedrooms": 2, "bathrooms": 1, "size": "90 sqm", "furnished": "Fully furnished", "amenities": "WiFi, AC, Kitchen"}', 'Labone, Accra', 'Beautiful beachside apartment perfect for short stays. Walking distance to Labadi Beach and restaurants.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Beachside", "Fully Equipped"}', 'Published'),

-- Industrial Properties (USD)
('Warehouse in Tema Industrial Area', 'https://example.com/property11', 8500.00, 'USD', 'Industrial Properties', '{"size": "1000 sqm", "height": "8 meters", "loading": "4 loading bays", "power": "3-phase electricity"}', 'Tema Industrial Area', 'Large warehouse facility with modern infrastructure. Suitable for manufacturing, storage, or distribution.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Industrial", "Large Space"}', 'Published'),

-- Serviced Spaces (GHS)
('Co-working Space in Osu', 'https://example.com/property12', 450.00, 'GHS', 'Serviced / Shared Spaces', '{"desks": "Hot desk available", "amenities": "WiFi, printing, meeting rooms", "hours": "24/7 access"}', 'Osu, Accra', 'Modern co-working space with all amenities. Perfect for freelancers, startups, and remote workers.', '{"phone": "0242799990", "whatsapp": "+233242799990"}', '{"Co-working", "24/7 Access"}', 'Published');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at_trigger
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_properties_updated_at();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON properties TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Verify the setup
SELECT 
    COUNT(*) as total_properties,
    COUNT(CASE WHEN currency = 'GHS' THEN 1 END) as ghs_properties,
    COUNT(CASE WHEN currency = 'USD' THEN 1 END) as usd_properties,
    COUNT(CASE WHEN status = 'Featured' THEN 1 END) as featured_properties
FROM properties;

-- Show sample data by category
SELECT 
    category,
    COUNT(*) as count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    currency
FROM properties 
GROUP BY category, currency 
ORDER BY category, currency;
