import { Decimal } from 'decimal.js';

export type TaxType = 'INCLUSIVE' | 'EXCLUSIVE';

export interface TaxConfig {
    rate: string | number | Decimal;
    type: TaxType;
}

export class PricingEngine {
    /**
     * Calculates the final price including tax details.
     */
    static calculateItemPrice(basePrice: string | number | Decimal, quantity: number, taxConfig?: TaxConfig) {
        const price = new Decimal(basePrice);
        const qty = new Decimal(quantity);
        const subtotal = price.mul(qty);

        if (!taxConfig) {
            return {
                subtotal: subtotal.toDecimalPlaces(4),
                taxAmount: new Decimal(0),
                total: subtotal.toDecimalPlaces(4),
            };
        }

        const taxRate = new Decimal(taxConfig.rate).div(100);
        let taxAmount: Decimal;
        let total: Decimal;

        if (taxConfig.type === 'INCLUSIVE') {
            // Total includes tax: Total = Subtotal
            // Tax = Total - (Total / (1 + Rate))
            total = subtotal;
            const baseAmount = total.div(new Decimal(1).add(taxRate));
            taxAmount = total.sub(baseAmount);
        } else {
            // Total excludes tax: Total = Subtotal + (Subtotal * Rate)
            taxAmount = subtotal.mul(taxRate);
            total = subtotal.add(taxAmount);
        }

        return {
            subtotal: subtotal.toDecimalPlaces(4),
            taxAmount: taxAmount.toDecimalPlaces(4),
            total: total.toDecimalPlaces(4),
        };
    }
}
