import { ConfigService } from '../services/config-service';

export interface RuleContext {
    businessId: string;
    user?: any;
    resource?: any;
    value?: any;
    [key: string]: any;
}

export class RuleEngine {
    /**
     * Evaluates if an action or value passes a specific rule.
     * e.g. evaluateRule({ businessId, value: 20 }, 'discount.max_percent')
     */
    static async evaluateRule(context: RuleContext, ruleKey: string): Promise<boolean> {
        const ruleValue = await ConfigService.getRuleValue(context.businessId, ruleKey);

        if (ruleValue === undefined || ruleValue === null) {
            return true; // Default to allow if no rule exists
        }

        // Specialized Logic per Rule Key
        switch (ruleKey) {
            case 'discount.max_percent':
                return Number(context.value) <= Number(ruleValue);

            case 'stock.allow_negative':
                return !!ruleValue === true;

            // Add more specialized rules here...

            default:
                // Generic equality check for boolean/simple rules
                if (typeof ruleValue === 'boolean') return ruleValue;
                return context.value === ruleValue;
        }
    }
}
