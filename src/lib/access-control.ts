import { Prisma } from '@prisma/client';

// Define the shape of User with necessary relations loaded
// This type helps ensure we pass the correct data structure to permission checks
export type UserWithRoles = Prisma.UserGetPayload<{
    include: {
        role: {
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        },
        business: {
            include: {
                features: {
                    include: {
                        feature: true
                    }
                }
            }
        }
    }
}>;

export interface AccessContext {
    user: UserWithRoles;
    resource?: any;
    [key: string]: any;
}

/**
 * Checks if a user has a specific permission via their role.
 */
export function hasPermission(user: UserWithRoles, module: string, action: string): boolean {
    if (!user || !user.role) return false;

    // Admin role bypass (optional, dependent on exact requirements, strictly checking permissions is safer)
    // if (user.role.name === 'Admin') return true; 

    return user.role.permissions.some(rp =>
        rp.permission.module === module && rp.permission.action === action
    );
}

/**
 * Checks if a feature is enabled for the user's business.
 */
export function hasFeature(user: UserWithRoles, featureKey: string): boolean {
    if (!user || !user.business) return false;

    return user.business.features.some(bf =>
        bf.feature.key === featureKey && bf.enabled
    );
}

/**
 * Evaluates context-based rules (ABAC).
 * This is a foundational implementation that can be expanded with a rule engine.
 */
export function evaluateRules(context: AccessContext, ruleKey: string): boolean {
    const { user } = context;
    if (!user) return false;

    // Example logic placeholder
    // In a real implementation, 'rules' would be fetched from DB (e.g. user.business.settings.rules)
    // const rules = user.business.settings?.['rules'] || {};
    // const specificRule = rules[ruleKey];

    // For now, we return true to allow logic to be implemented per specific rule requirement later
    return true;
}
