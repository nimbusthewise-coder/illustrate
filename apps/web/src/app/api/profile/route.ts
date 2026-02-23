import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores')
    .optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
});

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    // Validate input
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if username is being changed
    if (data.username) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true },
      });

      // If user already has a username and is trying to change it, reject
      if (currentUser?.username && currentUser.username !== data.username) {
        return NextResponse.json(
          { 
            error: 'Username cannot be changed once set',
            message: 'Usernames are immutable for embed URL stability. Contact support if you need to change it.'
          },
          { status: 400 }
        );
      }

      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
    }

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        username: data.username,
        image: data.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
