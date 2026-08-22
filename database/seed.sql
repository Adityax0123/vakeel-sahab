-- Sample seed data for local testing.
-- Password for ALL sample users below is: Passw0rd!  (already hashed with bcrypt, 10 rounds)

INSERT INTO users (name, email, phone, password_hash, role) VALUES
('Admin User', 'admin@vakeelsahab.com', '9999999999', '$2a$10$OmmDa.YVdEdJJ6YNArMzm.8Mp9aKDKtssbLqOXZH4Yj0pSoQgq8KO', 'admin'),
('Client Demo', 'client@example.com', '9111111111', '$2a$10$OmmDa.YVdEdJJ6YNArMzm.8Mp9aKDKtssbLqOXZH4Yj0pSoQgq8KO', 'client'),
('Adv. Ramesh Kumar', 'ramesh.lawyer@vakeelsahab.com', '9222222222', '$2a$10$OmmDa.YVdEdJJ6YNArMzm.8Mp9aKDKtssbLqOXZH4Yj0pSoQgq8KO', 'lawyer'),
('Adv. Priya Singh', 'priya.lawyer@vakeelsahab.com', '9333333333', '$2a$10$OmmDa.YVdEdJJ6YNArMzm.8Mp9aKDKtssbLqOXZH4Yj0pSoQgq8KO', 'lawyer'),
('Dev Aman Verma', 'aman.dev@vakeelsahab.com', '9444444444', '$2a$10$OmmDa.YVdEdJJ6YNArMzm.8Mp9aKDKtssbLqOXZH4Yj0pSoQgq8KO', 'developer');

INSERT INTO lawyer_profiles (user_id, specialization, designation, experience_years, qualifications, registration_no, bio, office_location)
VALUES
((SELECT id FROM users WHERE email='ramesh.lawyer@vakeelsahab.com'), 'Transport & Motor Vehicle Services', 'Advocate', 8, 'LL.B, Bar Council Registered', 'BC/REG/0001', 'Handles transport and motor vehicle related legal matters.', '[City]'),
((SELECT id FROM users WHERE email='priya.lawyer@vakeelsahab.com'), '[Specialization]', 'Advocate', 6, 'LL.B, LL.M', 'BC/REG/0002', '[Enter bio]', '[City]');

INSERT INTO lawyer_services (lawyer_id, name, description) VALUES
((SELECT id FROM lawyer_profiles WHERE registration_no='BC/REG/0001'), 'Motor Vehicle Act related matters', 'Assistance with MV Act cases and documentation.'),
((SELECT id FROM lawyer_profiles WHERE registration_no='BC/REG/0001'), 'Challan-related assistance', 'Help resolving traffic challans.');

INSERT INTO developer_profiles (user_id, skills, bio) VALUES
((SELECT id FROM users WHERE email='aman.dev@vakeelsahab.com'), 'React, Tailwind, WordPress, Node.js', 'Builds business and legal-firm websites.');
