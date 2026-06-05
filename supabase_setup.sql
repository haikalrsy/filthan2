-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  nik TEXT UNIQUE,
  role TEXT CHECK (role IN ('admin', 'guru', 'siswa')),
  class TEXT, -- For students
  is_approved BOOLEAN DEFAULT true,
  is_pending BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure columns exist if table was already created
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pending BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nik TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nisn TEXT;

-- Update role constraint if it exists
DO $$ 
BEGIN 
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'guru', 'siswa'));
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  nis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create attendances table
CREATE TABLE IF NOT EXISTS attendances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL, -- Can be profile.uid or student.id
  user_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('guru', 'siswa')) NOT NULL,
  status TEXT CHECK (status IN ('hadir', 'izin', 'sakit', 'alfa')) NOT NULL,
  date DATE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create voting_sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  target_grade INTEGER, -- 10, 11, or 12
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL, -- references profiles.uid
  voter_id UUID REFERENCES auth.users(id),
  decision TEXT CHECK (decision IN ('naik', 'tinggal', 'lulus', 'tidak_lulus')) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, student_id, voter_id)
);

-- Enable RLS
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Voting Sessions Policies
DROP POLICY IF EXISTS "Sessions are viewable by everyone." ON voting_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions." ON voting_sessions;
CREATE POLICY "Sessions are viewable by everyone." ON voting_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage sessions." ON voting_sessions FOR ALL USING (is_admin());

-- Votes Policies
DROP POLICY IF EXISTS "Votes are viewable by authorized users." ON votes;
DROP POLICY IF EXISTS "Teachers can vote." ON votes;
CREATE POLICY "Votes are viewable by authorized users." ON votes FOR SELECT USING (
  is_admin() OR voter_id = auth.uid() OR student_id = auth.uid()
);
CREATE POLICY "Teachers can vote." ON votes FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role IN ('admin', 'guru'))
  )
);

-- Helper function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE uid = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile." ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = uid);
-- NOTE: Do NOT use FOR ALL here! It causes infinite recursion because is_admin() queries profiles.
-- Split into separate INSERT/UPDATE/DELETE policies instead.
CREATE POLICY "Admins can insert any profile." ON profiles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update any profile." ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete any profile." ON profiles FOR DELETE USING (is_admin());

-- Students Policies
DROP POLICY IF EXISTS "Students are viewable by authenticated users." ON students;
DROP POLICY IF EXISTS "Admins can manage students." ON students;
CREATE POLICY "Students are viewable by authenticated users." ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage students." ON students FOR ALL USING (is_admin());

-- Attendances Policies
DROP POLICY IF EXISTS "Attendances are viewable by authenticated users." ON attendances;
DROP POLICY IF EXISTS "Users can insert attendances." ON attendances;
DROP POLICY IF EXISTS "Admins and recorders can update attendances." ON attendances;
CREATE POLICY "Attendances are viewable by authenticated users." ON attendances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert attendances." ON attendances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins and recorders can update attendances." ON attendances FOR UPDATE USING (
  is_admin() OR recorded_by = auth.uid()
);
