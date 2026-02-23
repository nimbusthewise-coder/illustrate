'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    image: '',
  });

  // Fetch profile on mount
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        username: data.username || '',
        image: data.image || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === profile?.username) {
      setUsernameError(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (!data.available) {
        setUsernameError(data.reason || 'Username not available');
      } else {
        setUsernameError(null);
      }
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameBlur = () => {
    if (formData.username) {
      checkUsernameAvailability(formData.username);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username || undefined,
          image: formData.image || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update profile');
      }

      setProfile(data);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information and username
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/15 border border-error/30 rounded-lg">
            <p className="text-error font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-success/15 border border-success/30 rounded-lg">
            <p className="text-success font-medium">Profile updated successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Display Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your display name"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This is how your name will appear across the application
            </p>
          </div>

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
              {profile?.username && (
                <span className="ml-2 text-xs text-warning">
                  (immutable once set)
                </span>
              )}
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              onBlur={handleUsernameBlur}
              disabled={!!profile?.username}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="your-username"
              pattern="[a-z0-9_-]+"
              minLength={3}
              maxLength={30}
            />
            {checkingUsername && (
              <p className="mt-1 text-xs text-muted-foreground">Checking availability...</p>
            )}
            {usernameError && (
              <p className="mt-1 text-xs text-error">{usernameError}</p>
            )}
            {!profile?.username && !usernameError && formData.username && (
              <p className="mt-1 text-xs text-success">Username available!</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {profile?.username 
                ? 'Your username is used in embed URLs (e.g., illustrate.md/your-username/diagram-id) and cannot be changed'
                : 'Username must be 3-30 characters, lowercase letters, numbers, hyphens, and underscores only'
              }
            </p>
            {profile?.username && (
              <p className="mt-1 text-xs text-foreground">
                Your embed URLs: <code className="bg-muted px-1 py-0.5 rounded">illustrate.md/{profile.username}/...</code>
              </p>
            )}
          </div>

          {/* Avatar URL Field */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-foreground mb-2">
              Avatar URL (optional)
            </label>
            <input
              type="url"
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              URL to your profile picture
            </p>
            {formData.image && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <img
                  src={formData.image}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full border border-border object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.alt = 'Invalid image URL';
                  }}
                />
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Email cannot be changed from this page
            </p>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">Account Information</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Account ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{profile?.id}</code></p>
              <p>Created: {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString()}</p>
              <p>Last updated: {profile?.updatedAt && new Date(profile.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || !!usernameError || checkingUsername}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
