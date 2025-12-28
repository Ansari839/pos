import { ConfigService } from '../services/config-service';
import { RuleEngine, RuleContext } from './rule-engine';
import { NextResponse } from 'next/server';

/**
 * Server-side helper to check features in API routes/Server Actions.
 */
export async function checkFeature(businessId: string, featureKey: string) {
    const isEnabled = await ConfigService.isFeatureEnabled(businessId, featureKey);
    if (!isEnabled) {
        throw new Error(`Feature ${featureKey} is disabled for this business.`);
    }
}

/**
 * Server-side helper to evaluate rules in API routes/Server Actions.
 */
export async function checkRule(context: RuleContext, ruleKey: string) {
    const allowed = await RuleEngine.evaluateRule(context, ruleKey);
    if (!allowed) {
        throw new Error(`Action blocked by rule: ${ruleKey}`);
    }
}

/**
 * Middleware adapter mockup (if using in Next.js middleware)
 */
export function featureGuardResponse(featureKey: string) {
    return NextResponse.json(
        { error: `Feature ${featureKey} not enabled.` },
        { status: 403 }
    );
}
