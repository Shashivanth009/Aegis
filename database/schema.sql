-- Drop old tables if they exist
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS student_documents;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS user_roles;

-- 1. User Roles Table (For RBAC)
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'ADMIN' -- ADMIN | EXAMINER | STUDENT
);

-- 2. Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- The student user who owns the profile
  full_name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  exam_name TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING | CLEARED | REJECTED
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Student Documents Table
CREATE TABLE student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'AADHAAR' | 'SSC_MEMO' | 'HALLTICKET'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  signature TEXT NOT NULL,
  ai_validation_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, document_type) -- One of each type per student max
);

-- 4. Audit / Antigravity Tracking
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- VERIFIED | REJECTED | SUSPICIOUS
  actor_ip TEXT,
  actor_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- user_roles: Everyone can read their own role (critical for login routing)
CREATE POLICY "Users read own role"
ON user_roles FOR SELECT USING (user_id = auth.uid());

-- students: Students manage their own record
CREATE POLICY "Students manage own record"
ON students FOR ALL USING (user_id = auth.uid());

-- students: Admins can see all students
CREATE POLICY "Admins read all students"
ON students FOR SELECT USING (
  EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- students: Examiners can see all students (read-only)
CREATE POLICY "Examiners read all students"
ON students FOR SELECT USING (
  EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'EXAMINER')
);

-- student_documents: Students manage docs for their own student record
CREATE POLICY "Students manage own docs"
ON student_documents FOR ALL USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- student_documents: Admins can see all docs
CREATE POLICY "Admins read all docs"
ON student_documents FOR SELECT USING (
  EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- student_documents: Examiners can see all docs
CREATE POLICY "Examiners read all docs"
ON student_documents FOR SELECT USING (
  EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'EXAMINER')
);

-- audit_logs: Any authenticated user can insert
CREATE POLICY "Auth users insert logs"
ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- audit_logs: Admins can read all logs
CREATE POLICY "Admins read logs"
ON audit_logs FOR SELECT USING (
  EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- 5. Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Storage" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Auth Upload Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificates');
