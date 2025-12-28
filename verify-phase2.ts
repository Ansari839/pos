import 'dotenv/config';
import { ConfigService } from './src/services/config-service';
import { AdminConfigService } from './src/services/admin-config-service';
import { RuleEngine } from './src/lib/rule-engine';
import { prisma } from './src/lib/prisma';

async function verifyPhase2() {
    console.log('--- STARTING PHASE 2 VERIFICATION ---');

    try {
        // 1. Get a test business (created in Phase 1 verification)
        const business = await prisma.business.findFirst({
            where: { name: 'Test Coffee Shop' },
            include: { industry: true }
        });

        if (!business) throw new Error('Test business not found. Run phase 1 verification first.');
        const adminUser = await prisma.user.findFirst({ where: { businessId: business.id } });
        if (!adminUser) throw new Error('Admin user not found for test business.');

        console.log(`✓ Using business: ${business.name} (Industry: ${business.industry.name})`);
        console.log(`✓ Using user: ${adminUser.email} for audit.`);

        // 2. Check Industry Default Rule
        // Restaurant default for 'discount.max_percent' is 15
        const defaultConfig = await ConfigService.getEffectiveConfig(business.id);
        console.log('Effective discount.max_percent (Default):', defaultConfig.rules['discount.max_percent']);

        // 3. Apply a Business Override
        console.log('Applying business rule override: discount.max_percent = 25');
        await AdminConfigService.updateRule(business.id, 'discount.max_percent', 25, 'POS', adminUser.id);

        // 4. Verify Override Layering
        const updatedConfig = await ConfigService.getEffectiveConfig(business.id);
        const newValue = updatedConfig.rules['discount.max_percent'];
        console.log('Effective discount.max_percent (Override):', newValue);

        if (newValue !== 25) throw new Error('Layering failed: Business override not respected.');
        console.log('✓ Layering logic verified.');

        // 5. Check Feature Toggle
        console.log('Toggling feature: TABLE_MANAGEMENT -> false');
        await AdminConfigService.toggleFeature(business.id, 'TABLE_MANAGEMENT', false, adminUser.id);

        const isTableEnabled = await ConfigService.isFeatureEnabled(business.id, 'TABLE_MANAGEMENT');
        console.log('Is TABLE_MANAGEMENT enabled?', isTableEnabled);
        if (isTableEnabled !== false) throw new Error('Feature toggle failed.');
        console.log('✓ Feature toggle verified.');

        // 6. Test Rule Engine Evaluation
        console.log('Testing Rule Engine: Trying 20% discount (Allowed 25%)');
        const allowed = await RuleEngine.evaluateRule({ businessId: business.id, value: 20 }, 'discount.max_percent');
        console.log('Evaluation result:', allowed);
        if (!allowed) throw new Error('Rule evaluation failed.');

        console.log('Testing Rule Engine: Trying 30% discount (Allowed 25%)');
        const blocked = await RuleEngine.evaluateRule({ businessId: business.id, value: 30 }, 'discount.max_percent');
        console.log('Evaluation result:', blocked);
        if (blocked) throw new Error('Rule evaluation error: Should have blocked.');

        console.log('--- PHASE 2 VERIFICATION COMPLETE ---');
    } catch (error) {
        console.error('PHASE 2 VERIFICATION FAILED:', error);
        process.exit(1);
    }
}

verifyPhase2();
