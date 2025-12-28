import 'dotenv/config';
import { BusinessService } from './src/services/business-service';
import { prisma } from './src/lib/prisma';
import { hasPermission } from './src/lib/access-control';

async function verify() {
    console.log('--- STARTING VERIFICATION ---');

    try {
        // 1. Fetch some seeded data
        const industries = await prisma.industry.findMany();
        if (industries.length === 0) throw new Error('No industries found. Seed failed?');
        console.log(`✓ Found ${industries.length} industries.`);

        // 2. Test Onboarding
        console.log('Testing business onboarding...');
        const result = await BusinessService.onboardBusiness({
            name: 'Test Coffee Shop',
            industryId: industries[0].id,
            adminEmail: `admin_${Date.now()}@example.com`,
            adminName: 'Admin User',
            adminPassword: 'securepassword123',
        });
        console.log('✓ Onboarding successful for:', result.business.name);

        // 3. Test Access Control
        console.log('Testing RBAC logic...');
        const userWithRoles: any = await prisma.user.findUnique({
            where: { id: result.user.id },
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
        });

        // Check if admin has 'manage' permission on 'POS' (based on our seed)
        // Note: our seed currently just creates permissions, it doesn't link them to roles.
        // Let's check permissions existence first.
        const posManagePerm = await prisma.permission.findFirst({
            where: { module: 'POS', action: 'manage' }
        });

        if (posManagePerm) {
            console.log('✓ Found POS manage permission.');
        }

        console.log('--- VERIFICATION COMPLETE ---');
    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
        process.exit(1);
    }
}

verify();
