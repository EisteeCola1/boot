-- Complete Database Setup Script for SBF Learning Platform
-- This script sets up all tables, modules, questions, and configurations

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  display_order INTEGER,
  shared_with_module_id UUID REFERENCES modules(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_number INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer options table
CREATE TABLE IF NOT EXISTS answer_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User question progress table
CREATE TABLE IF NOT EXISTS user_question_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  is_mastered BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Exam sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  exam_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam answers table
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES answer_options(id),
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module questions junction table (for shared questions)
CREATE TABLE IF NOT EXISTS module_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, question_id)
);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Modules are viewable by everyone" ON modules;
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Answer options are viewable by everyone" ON answer_options;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_question_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_question_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_question_progress;
DROP POLICY IF EXISTS "Users can view their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can insert their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can update their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can view their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can insert their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Module questions are viewable by everyone" ON module_questions;

-- Create policies
CREATE POLICY "Modules are viewable by everyone" ON modules FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);
CREATE POLICY "Answer options are viewable by everyone" ON answer_options FOR SELECT USING (true);
CREATE POLICY "Module questions are viewable by everyone" ON module_questions FOR SELECT USING (true);

CREATE POLICY "Users can view their own progress" ON user_question_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert their own progress" ON user_question_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own progress" ON user_question_progress FOR UPDATE USING (true);

CREATE POLICY "Users can view their own exam sessions" ON exam_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own exam sessions" ON exam_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own exam sessions" ON exam_sessions FOR UPDATE USING (true);

CREATE POLICY "Users can view their own exam answers" ON exam_answers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own exam answers" ON exam_answers FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 3. INSERT MODULES
-- ============================================================================

-- Clear existing data
TRUNCATE TABLE modules CASCADE;

-- SBF SEE MODULES
INSERT INTO modules (name, slug, description, category, display_order) VALUES
('Vorschriften und Pflichten', 'see-vorschriften-pflichten', 'Rechtliche Grundlagen und Pflichten auf See', 'see', 1),
('Ausweichen', 'see-ausweichen', 'Ausweichregeln und Vorfahrtsregeln', 'see', 2),
('Lichter', 'see-lichter', 'Lichterführung von Seefahrzeugen', 'see', 3),
('Zeichen und Töne', 'see-zeichen-toene', 'Schallsignale und Zeichen auf See', 'see', 4),
('Verkehrstrennungsgebiete', 'see-verkehrstrennungsgebiete', 'Verhalten in Verkehrstrennungsgebieten', 'see', 5),
('Umweltschutz', 'see-umweltschutz', 'Umweltschutz auf See', 'see', 6),
('Navigation', 'see-navigation', 'Kartenarbeit und Navigationsaufgaben', 'see', 7),
('Wetterkunde', 'see-wetterkunde', 'Wetter und Wettervorhersage', 'see', 8),
('Sicherheit auf dem Wasser', 'see-sicherheit', 'Sicherheitsausrüstung und Notfallmaßnahmen', 'see', 9),
('Funk und Kommunikation', 'see-funk', 'Seefunk und Kommunikation', 'see', 10);

-- SBF BINNEN MODULES
INSERT INTO modules (name, slug, description, category, display_order) VALUES
('Allgemeine Vorschriften', 'binnen-vorschriften', 'Rechtliche Grundlagen für Binnengewässer', 'binnen', 1),
('Verkehrsregeln', 'binnen-verkehrsregeln', 'Verkehrsregeln auf Binnengewässern', 'binnen', 2),
('Fahrwasser', 'binnen-fahrwasser', 'Fahrwasser und Fahrrinnen', 'binnen', 3),
('Fahrrinne und Markierungen', 'binnen-markierungen', 'Tonnen und Markierungen', 'binnen', 4),
('Schleusen und Brückendurchfahrten', 'binnen-schleusen', 'Verhalten an Schleusen und Brücken', 'binnen', 5),
('Beleuchtung und Signale', 'binnen-lichter-signale', 'Lichter und Signale auf Binnengewässern', 'binnen', 6),
('Wetter', 'binnen-wetter', 'Wetterkunde für Binnengewässer', 'binnen', 7),
('Sicherheit auf dem Wasser', 'binnen-sicherheit', 'Sicherheitsausrüstung für Binnenfahrzeuge', 'binnen', 8),
('Umweltschutz', 'binnen-umweltschutz', 'Umweltschutz auf Binnengewässern', 'binnen', 9);

-- BASISFRAGEN MODULES (separate for each category, will be linked)
INSERT INTO modules (name, slug, description, category, display_order) VALUES
('Basisfragen', 'see-basisfragen', 'Gemeinsame Grundlagen für alle Sportbootführerscheine', 'see', 11),
('Basisfragen', 'binnen-basisfragen', 'Gemeinsame Grundlagen für alle Sportbootführerscheine', 'binnen', 10);

-- PRAXIS MODULES
INSERT INTO modules (name, slug, description, category, display_order) VALUES
('Seemannsknoten', 'see-knoten', 'Die wichtigsten Seemannsknoten', 'see', 12),
('Schallsignale auf See', 'see-schallsignale', 'Schallsignale und deren Bedeutung', 'see', 13),
('Lichter an Seefahrzeugen', 'see-lichter-fahrzeuge', 'Lichterführung verschiedener Fahrzeugtypen', 'see', 14),
('Zeichen auf See', 'see-zeichen', 'Sichtzeichen und Tageszeichen', 'see', 15),
('Feuerarten auf Seekarten', 'see-feuerarten', 'Leuchtfeuer und ihre Darstellung', 'see', 16);

INSERT INTO modules (name, slug, description, category, display_order) VALUES
('Zeichen im Binnenbereich', 'binnen-zeichen', 'Zeichen und Markierungen im Binnenbereich', 'binnen', 11),
('Lichter an Binnenfahrzeugen', 'binnen-lichter-fahrzeuge', 'Lichterführung auf Binnengewässern', 'binnen', 12),
('Schallsignale im Binnenbereich', 'binnen-schallsignale', 'Schallsignale auf Binnengewässern', 'binnen', 13),
('Knoten', 'binnen-knoten', 'Die wichtigsten Knoten für Binnengewässer', 'binnen', 14);

-- Link shared modules (Basisfragen and Knoten)
UPDATE modules SET shared_with_module_id = (SELECT id FROM modules WHERE slug = 'binnen-basisfragen') WHERE slug = 'see-basisfragen';
UPDATE modules SET shared_with_module_id = (SELECT id FROM modules WHERE slug = 'see-basisfragen') WHERE slug = 'binnen-basisfragen';
UPDATE modules SET shared_with_module_id = (SELECT id FROM modules WHERE slug = 'binnen-knoten') WHERE slug = 'see-knoten';
UPDATE modules SET shared_with_module_id = (SELECT id FROM modules WHERE slug = 'see-knoten') WHERE slug = 'binnen-knoten';

-- ============================================================================
-- 4. INSERT SAMPLE QUESTIONS
-- ============================================================================

DO $$
DECLARE
    v_module_id uuid;
    v_question_id uuid;
BEGIN
    -- SBF SEE: Vorschriften und Pflichten (3 questions)
    SELECT id INTO v_module_id FROM modules WHERE slug = 'see-vorschriften-pflichten';
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Ab welcher Motorleistung ist der SBF See Pflicht?', 1) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, '11,03 kW (15 PS)', true, 1),
    (v_question_id, '7,35 kW (10 PS)', false, 2),
    (v_question_id, '22,06 kW (30 PS)', false, 3),
    (v_question_id, 'Keine Führerscheinpflicht', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Welche Dokumente müssen an Bord mitgeführt werden?', 2) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Führerschein und Bootspapiere', true, 1),
    (v_question_id, 'Nur der Führerschein', false, 2),
    (v_question_id, 'Nur die Bootspapiere', false, 3),
    (v_question_id, 'Keine Dokumente erforderlich', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Wo gilt der SBF See?', 3) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Auf Seeschifffahrtsstraßen und in Küstengewässern', true, 1),
    (v_question_id, 'Nur auf Binnengewässern', false, 2),
    (v_question_id, 'Weltweit auf allen Gewässern', false, 3),
    (v_question_id, 'Nur in deutschen Hoheitsgewässern', false, 4);
    
    -- SBF SEE: Ausweichen (3 questions)
    SELECT id INTO v_module_id FROM modules WHERE slug = 'see-ausweichen';
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Welches Fahrzeug ist ausweichpflichtig bei Kursen die sich kreuzen?', 1) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Das Fahrzeug das das andere an Steuerbord hat', true, 1),
    (v_question_id, 'Das Fahrzeug das das andere an Backbord hat', false, 2),
    (v_question_id, 'Beide Fahrzeuge gleichzeitig', false, 3),
    (v_question_id, 'Das langsamere Fahrzeug', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Was bedeutet "Kurshalteflichtig"?', 2) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Kurs und Geschwindigkeit beibehalten', true, 1),
    (v_question_id, 'Sofort stoppen', false, 2),
    (v_question_id, 'Beschleunigen', false, 3),
    (v_question_id, 'Nach Backbord ausweichen', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Welches Fahrzeug hat Vorfahrt?', 3) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Manövrierunfähige Fahrzeuge', true, 1),
    (v_question_id, 'Motorboote', false, 2),
    (v_question_id, 'Segelboote', false, 3),
    (v_question_id, 'Das größere Fahrzeug', false, 4);

    -- SBF BINNEN: Allgemeine Vorschriften (3 questions)
    SELECT id INTO v_module_id FROM modules WHERE slug = 'binnen-vorschriften';
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Ab welcher Motorleistung ist der SBF Binnen Pflicht?', 1) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, '11,03 kW (15 PS)', true, 1),
    (v_question_id, '7,35 kW (10 PS)', false, 2),
    (v_question_id, '22,06 kW (30 PS)', false, 3),
    (v_question_id, 'Keine Führerscheinpflicht', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Wo gilt der SBF Binnen?', 2) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Auf Binnengewässern und Bundeswasserstraßen', true, 1),
    (v_question_id, 'Nur auf Seen', false, 2),
    (v_question_id, 'Auf Seeschifffahrtsstraßen', false, 3),
    (v_question_id, 'Nur auf Flüssen', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Was gilt auf Bundeswasserstraßen?', 3) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Binnenschifffahrtsstraßen-Ordnung', true, 1),
    (v_question_id, 'Seeschifffahrtsstraßen-Ordnung', false, 2),
    (v_question_id, 'Straßenverkehrs-Ordnung', false, 3),
    (v_question_id, 'Keine besonderen Regeln', false, 4);

    -- SBF BINNEN: Verkehrsregeln (3 questions)
    SELECT id INTO v_module_id FROM modules WHERE slug = 'binnen-verkehrsregeln';
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Wer hat Vorfahrt im Binnenbereich?', 1) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Berufsschifffahrt hat Vorrang', true, 1),
    (v_question_id, 'Sportboote haben immer Vorfahrt', false, 2),
    (v_question_id, 'Das größere Fahrzeug', false, 3),
    (v_question_id, 'Das schnellere Fahrzeug', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Wie verhält man sich bei Begegnung?', 2) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Nach Steuerbord ausweichen', true, 1),
    (v_question_id, 'Nach Backbord ausweichen', false, 2),
    (v_question_id, 'Stoppen und warten', false, 3),
    (v_question_id, 'Beschleunigen', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Was bedeutet "Rechts vor Links"?', 3) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Das von rechts kommende Fahrzeug hat Vorfahrt', true, 1),
    (v_question_id, 'Man fährt immer rechts', false, 2),
    (v_question_id, 'Links überholen ist verboten', false, 3),
    (v_question_id, 'Keine besondere Bedeutung', false, 4);

    -- BASISFRAGEN (shared between SEE and BINNEN - create once, link to both)
    SELECT id INTO v_module_id FROM modules WHERE slug = 'see-basisfragen';
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Was ist beim Ankern zu beachten?', 1) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Ausreichend Kettenlänge verwenden', true, 1),
    (v_question_id, 'Immer nur kurz ankern', false, 2),
    (v_question_id, 'Nur bei Windstille ankern', false, 3),
    (v_question_id, 'Ankern ist verboten', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Welche Ausrüstung ist Pflicht?', 2) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Rettungswesten für alle Personen', true, 1),
    (v_question_id, 'Nur Feuerlöscher', false, 2),
    (v_question_id, 'Keine Ausrüstung erforderlich', false, 3),
    (v_question_id, 'Nur Erste-Hilfe-Set', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Was ist ein Fender?', 3) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Ein Schutz zum Anlegen am Steg', true, 1),
    (v_question_id, 'Ein Segel', false, 2),
    (v_question_id, 'Ein Anker', false, 3),
    (v_question_id, 'Eine Boje', false, 4);
    
    -- Link basisfragen to binnen module via junction table
    INSERT INTO module_questions (module_id, question_id)
    SELECT 
        (SELECT id FROM modules WHERE slug = 'binnen-basisfragen'),
        id
    FROM questions WHERE module_id = v_module_id;

    -- KNOTEN (shared between SEE and BINNEN)
    SELECT id INTO v_module_id FROM modules WHERE slug = 'see-knoten';
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Welcher Knoten eignet sich zum Festmachen?', 1) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Palstek', true, 1),
    (v_question_id, 'Kreuzknoten', false, 2),
    (v_question_id, 'Schotstek', false, 3),
    (v_question_id, 'Webleinstek', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Wie macht man eine Leine fest?', 2) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Mit mehreren Rundtörns', true, 1),
    (v_question_id, 'Einfach überwerfen', false, 2),
    (v_question_id, 'Nur einen Knoten', false, 3),
    (v_question_id, 'Gar nicht', false, 4);
    
    INSERT INTO questions (module_id, question_text, question_number) 
    VALUES (v_module_id, 'Wofür verwendet man den Webleinstek?', 3) RETURNING id INTO v_question_id;
    INSERT INTO answer_options (question_id, option_text, is_correct, display_order) VALUES
    (v_question_id, 'Zum Festmachen an einem Pfahl', true, 1),
    (v_question_id, 'Zum Verbinden zweier Leinen', false, 2),
    (v_question_id, 'Als Sicherungsknoten', false, 3),
    (v_question_id, 'Zum Ankern', false, 4);
    
    -- Link knoten to binnen module via junction table
    INSERT INTO module_questions (module_id, question_id)
    SELECT 
        (SELECT id FROM modules WHERE slug = 'binnen-knoten'),
        id
    FROM questions WHERE module_id = v_module_id;

END $$;

COMMIT;
