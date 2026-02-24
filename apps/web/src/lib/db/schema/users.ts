/**
 * Database schema for user profiles
 * F047: User Profile and Username
 * 
 * This file documents the Supabase schema for user profiles.
 * Run these SQL statements in your Supabase SQL editor to create the profiles table.
 */

/**
 * User profiles table schema
 */
export const USER_PROFILES_SCHEMA = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_-]+$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username 
  ON profiles(username);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    -- Generate initial username from email or use UUID
    COALESCE(
      LOWER(SPLIT_PART(NEW.email, '@', 1)),
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.email
    )
  )
  ON CONFLICT (username) DO UPDATE
  SET username = EXCLUDED.username || '_' || SUBSTRING(NEW.id::text, 1, 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`;

/**
 * User preferences table schema (for app settings)
 */
export const USER_PREFERENCES_SCHEMA = `
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'standard',
  mode TEXT DEFAULT 'light',
  default_canvas_width INTEGER DEFAULT 80,
  default_canvas_height INTEGER DEFAULT 30,
  default_character_set TEXT DEFAULT 'light',
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  grid_visible BOOLEAN DEFAULT TRUE,
  rulers_visible BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT theme_valid CHECK (theme IN ('standard', 'dieter', 'warhol', 'moebius', 'peanuts', 'bass', 'albers', 'mondrian', 'ghibli', 'kare', 'klein', 'morris', 'vignelli', 'hockney')),
  CONSTRAINT mode_valid CHECK (mode IN ('light', 'dark'))
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create default preferences on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences on signup
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_preferences();
`;

/**
 * TypeScript types for user profiles
 */
export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  theme: string;
  mode: 'light' | 'dark';
  default_canvas_width: number;
  default_canvas_height: number;
  default_character_set: string;
  auto_save_enabled: boolean;
  grid_visible: boolean;
  rulers_visible: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdatePreferencesInput {
  theme?: string;
  mode?: 'light' | 'dark';
  default_canvas_width?: number;
  default_canvas_height?: number;
  default_character_set?: string;
  auto_save_enabled?: boolean;
  grid_visible?: boolean;
  rulers_visible?: boolean;
  preferences?: Record<string, unknown>;
}

/**
 * Profile validation helpers
 */
export const USERNAME_REGEX = /^[a-z0-9_-]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }
  
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }
  
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, hyphens, and underscores' };
  }
  
  return { valid: true };
}

export function validateBio(bio: string): { valid: boolean; error?: string } {
  if (bio && bio.length > BIO_MAX_LENGTH) {
    return { valid: false, error: `Bio must be at most ${BIO_MAX_LENGTH} characters` };
  }
  
  return { valid: true };
}
