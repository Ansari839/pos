import { prisma } from '../lib/prisma';
import deepmerge from 'deepmerge';
import { get } from 'lodash';

export class ConfigService {
    /**
     * Returns the final effective configuration for a business by merging:
     * 1. System Defaults (Hardcoded or Global Rule)
     * 2. Industry Defaults (Stored in Industry.defaultConfig)
     * 3. Business Overrides (Stored in Business.settings and BusinessRule)
     */
    static async getEffectiveConfig(businessId: string) {
        // 1. System Defaults (Foundation)
        const systemDefaults = {
            features: {
                POS_BASIC: true,
                INVENTORY: true,
            },
            rules: {
                'discount.max_percent': 10,
                'stock.allow_negative': false,
                'currency': 'USD',
            }
        };

        // Fetch Business with Industry
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            include: {
                industry: true,
                features: {
                    include: {
                        feature: true,
                    }
                },
                rules: true,
            }
        });

        if (!business) throw new Error('Business not found');

        // 2. Industry Defaults
        const industryDefaults = (business.industry.defaultConfig as any) || {};

        // 3. Business Overrides
        const businessFeatureOverrides: Record<string, boolean> = {};
        business.features.forEach(bf => {
            businessFeatureOverrides[bf.feature.key] = bf.enabled;
        });

        const businessRules: Record<string, any> = {};
        business.rules.forEach(rule => {
            businessRules[rule.ruleKey] = rule.ruleValue;
        });

        const businessOverrides = {
            features: businessFeatureOverrides,
            rules: businessRules,
        };

        // Layering: System -> Industry -> Business
        const effectiveConfig = deepmerge.all([
            systemDefaults,
            industryDefaults,
            businessOverrides
        ]);

        return effectiveConfig as any;
    }

    /**
     * Specific check for feature enablement.
     */
    static async isFeatureEnabled(businessId: string, featureKey: string): Promise<boolean> {
        const config = await this.getEffectiveConfig(businessId);
        return !!config.features?.[featureKey];
    }

    /**
     * Fetches a specific rule value.
     */
    static async getRuleValue(businessId: string, ruleKey: string, defaultValue?: any): Promise<any> {
        const config = await this.getEffectiveConfig(businessId);
        return config.rules?.[ruleKey] ?? defaultValue;
    }
}
