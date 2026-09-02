-- Seed data for Tenali Exams Publishers App

-- Clear existing products to avoid conflicts during seeding
DELETE FROM products;

-- Insert Product 1: MTS + POSTMAN / MG
INSERT INTO products (
    id, slug, name, bundle_title, books_included, edition, 
    short_description, description, price, image, images, 
    category, exam_coverage, features, brand, badge, stock, languages
) VALUES (
    'p1', 
    'mts-postman-mg', 
    'MTS + POSTMAN / MG', 
    '2-Book Preparation Set', 
    2, 
    'First Edition', 
    'Comprehensive 2-book preparation bundle covering MTS, Postman, and Mail Guard syllabi. Updated with latest department rules.', 
    'Prepare for MTS, Postman, and Mail Guard (MG) examinations with this complete 2-book preparation set. This bundle combines essential exam-focused study material covering the key subjects, concepts, rules, and postal-related topics required for your preparation.

The content is presented in a simple and easy-to-understand format, helping you learn important concepts, revise efficiently, and practice key topics.', 
    800, 
    '/images/book-mts-postman.jpg', 
    '["/images/book-mts-postman.jpg", "/images/common-guide-2027.jpg"]', 
    'Combo Pack', 
    'MTS, Postman & Mail Guard (MG) Examinations', 
    '["Exam-focused coverage for MTS, Postman & Mail Guard (MG)", "Coverage of relevant postal subjects, rules, and concepts", "Concept-based notes, tables, and important rules", "Useful study material for revision and exam preparation"]', 
    'Tenali Exams Publishers', 
    'Best Seller', 
    100,
    '[{"code": "en", "name": "English"}, {"code": "te", "name": "Telugu"}, {"code": "hi", "name": "Hindi"}]'
);

-- Insert Product 2: PA / SA
INSERT INTO products (
    id, slug, name, bundle_title, books_included, edition, 
    short_description, description, price, image, images, 
    category, exam_coverage, features, brand, badge, stock, languages
) VALUES (
    'p2', 
    'pa-sa', 
    'PA / SA (LGO)', 
    'PA/SA (LGO) Guide Set', 
    3, 
    'First Edition', 
    'Complete 3-book preparation bundle for PA / SA examination.', 
    'Prepare for the Postal Assistant (PA) and Sorting Assistant (SA) examinations with this complete 3-book preparation set. The bundle brings together essential study material covering the subjects and concepts required for your exam preparation, presented in a simple and easy-to-understand format.', 
    1200, 
    '/images/book-pa-sa.jpg', 
    '["/images/book-pa-sa.jpg"]', 
    'Study Guide', 
    'Postal Assistant (PA) & Sorting Assistant (SA) Examinations', 
    '["PA / SA exam-focused study material", "Coverage of relevant postal subjects, manuals, and concepts", "Topic-wise practice questions and MCQs", "Concept-based explanations for easier preparation", "Useful revision material for exam preparation"]', 
    'Tenali Exams Publishers', 
    NULL, 
    100,
    '[{"code": "en", "name": "English"}, {"code": "te", "name": "Telugu"}, {"code": "hi", "name": "Hindi"}]'
);
