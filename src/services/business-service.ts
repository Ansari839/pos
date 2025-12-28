import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../lib/audit';

export interface CreateBusinessInput {
    name: string;
    industryId: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
    themeConfig?: any;
}

export class BusinessService {
    /**
     * Performs the primary onboarding for a new business tenant.
     */
    static async onboardBusiness(input: CreateBusinessInput) {
        const { name, industryId, adminEmail, adminName, adminPassword, themeConfig } = input;

        // 1. Validate Industry
        const industry = await prisma.industry.findUnique({
            where: { id: industryId },
        });
        if (!industry) throw new Error('Invalid industry selection');

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 2. Create Business
            const business = await tx.business.create({
                data: {
                    name,
                    industryId,
                    themeConfig: themeConfig || {
                        color: industry.defaultTheme || 'blue',
                        mode: 'light',
                        iconPack: industry.iconPack,
                    },
                    settings: {
                        currency: 'USD', // default
                        timezone: 'UTC',
                    },
                },
            });

            // 3. Find Admin Role
            const adminRole = await tx.role.findUnique({
                where: { name: 'Admin' },
            });
            if (!adminRole) throw new Error('Default Admin role not found. Please run seed script.');

            // 4. Create Admin User
            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    name: adminName,
                    password: hashedPassword,
                    businessId: business.id,
                    roleId: adminRole.id,
                },
            });

            // 5. Enable default features (Foundational)
            const features = await tx.feature.findMany();
            for (const feature of features) {
                await tx.businessFeature.create({
                    data: {
                        businessId: business.id,
                        featureId: feature.id,
                        enabled: true, // Auto-enable all for now, can be restricted later
                    }
                })
            }

            // 6. Create default Chart of Accounts
            const defaultAccounts = [
                { name: 'Cash', type: 'ASSET' },
                { name: 'Bank', type: 'ASSET' },
                { name: 'Accounts Receivable', type: 'ASSET' },
                { name: 'Sales', type: 'INCOME' },
                { name: 'Tax Payable', type: 'LIABILITY' },
                { name: 'Cost of Goods Sold', type: 'EXPENSE' },
                { name: 'Inventory', type: 'ASSET' },
            ];

            for (const acc of defaultAccounts) {
                await tx.account.create({
                    data: {
                        businessId: business.id,
                        ...acc
                    }
                });
            }

            // 6. Log the creation
            await tx.auditLog.create({
                data: {
                    businessId: business.id,
                    userId: user.id,
                    module: 'Business',
                    action: 'ONBOARD',
                    after: { businessName: name, adminEmail },
                }
            });

            return { business, user };
        });
    }

    static async getBusinessWithFullContext(businessId: string) {
        return prisma.business.findUnique({
            where: { id: businessId },
            include: {
                industry: true,
                features: {
                    include: {
                        feature: true,
                    },
                },
            },
        });
    }
}
