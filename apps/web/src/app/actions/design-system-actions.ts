'use server';

/**
 * Server actions for design system operations with tier enforcement
 */

import { prisma } from '@/lib/prisma';
import { enforceDesignSystemCreation } from '@/lib/tier-enforcement';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  upgradeRequired?: boolean;
};

/**
 * Create a new design system with tier enforcement
 */
export async function createDesignSystem(params: {
  userId: string;
  name: string;
  description?: string;
  version?: string;
  data: unknown;
  isPublic?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, name, description, version, data, isPublic } = params;

    // Enforce design system creation limits
    const enforcement = await enforceDesignSystemCreation(userId);
    if (!enforcement.allowed) {
      return {
        success: false,
        error: enforcement.reason,
        upgradeRequired: enforcement.upgradeRequired,
      };
    }

    // Create the design system
    const designSystem = await prisma.designSystem.create({
      data: {
        userId,
        name,
        description: description || null,
        version: version || '1.0.0',
        isPublic: isPublic ?? false,
        data: JSON.parse(JSON.stringify(data)),
      },
    });

    revalidatePath('/design-systems');

    return {
      success: true,
      data: { id: designSystem.id },
    };
  } catch (error) {
    console.error('Error creating design system:', error);
    return {
      success: false,
      error: 'Failed to create design system',
    };
  }
}

/**
 * Update design system
 */
export async function updateDesignSystem(params: {
  userId: string;
  designSystemId: string;
  updates: {
    name?: string;
    description?: string;
    version?: string;
    data?: unknown;
    isPublic?: boolean;
  };
}): Promise<ActionResult> {
  try {
    const { userId, designSystemId, updates } = params;

    // Check if user owns this design system
    const designSystem = await prisma.designSystem.findUnique({
      where: { id: designSystemId },
    });

    if (!designSystem) {
      return {
        success: false,
        error: 'Design system not found',
      };
    }

    if (designSystem.userId !== userId) {
      return {
        success: false,
        error: 'You do not have permission to update this design system',
      };
    }

    // Update the design system
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.version !== undefined) updateData.version = updates.version;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    if (updates.data !== undefined) updateData.data = JSON.parse(JSON.stringify(updates.data));

    await prisma.designSystem.update({
      where: { id: designSystemId },
      data: updateData,
    });

    revalidatePath('/design-systems');
    revalidatePath(`/design-systems/${designSystemId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating design system:', error);
    return {
      success: false,
      error: 'Failed to update design system',
    };
  }
}

/**
 * Delete design system
 */
export async function deleteDesignSystem(params: {
  userId: string;
  designSystemId: string;
}): Promise<ActionResult> {
  try {
    const { userId, designSystemId } = params;

    // Check if user owns this design system
    const designSystem = await prisma.designSystem.findUnique({
      where: { id: designSystemId },
    });

    if (!designSystem) {
      return {
        success: false,
        error: 'Design system not found',
      };
    }

    if (designSystem.userId !== userId) {
      return {
        success: false,
        error: 'You do not have permission to delete this design system',
      };
    }

    await prisma.designSystem.delete({
      where: { id: designSystemId },
    });

    revalidatePath('/design-systems');

    return { success: true };
  } catch (error) {
    console.error('Error deleting design system:', error);
    return {
      success: false,
      error: 'Failed to delete design system',
    };
  }
}

/**
 * List user's design systems
 */
export async function listDesignSystems(userId: string): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      description: string | null;
      version: string;
      isPublic: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  >
> {
  try {
    const designSystems = await prisma.designSystem.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: designSystems,
    };
  } catch (error) {
    console.error('Error listing design systems:', error);
    return {
      success: false,
      error: 'Failed to load design systems',
    };
  }
}

/**
 * Get count of user's design systems (for limit checking)
 */
export async function getDesignSystemCount(userId: string): Promise<number> {
  try {
    return await prisma.designSystem.count({
      where: { userId },
    });
  } catch (error) {
    console.error('Error counting design systems:', error);
    return 0;
  }
}
