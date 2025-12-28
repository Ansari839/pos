import { prisma } from '../lib/prisma';
import { Decimal } from 'decimal.js';

export class UnitService {
    /**
     * Converts a quantity from a source unit to a target unit.
     * If both are the same, returns quantity.
     */
    static async convert(quantity: number | string | Decimal, fromUnitId: string, toUnitId: string) {
        if (fromUnitId === toUnitId) return new Decimal(quantity);

        // Find direct conversion
        const conversion = await prisma.unitConversion.findFirst({
            where: {
                OR: [
                    { fromUnitId, toUnitId },
                    { fromUnitId: toUnitId, toUnitId: fromUnitId }
                ]
            }
        });

        if (!conversion) {
            throw new Error(`No conversion found from ${fromUnitId} to ${toUnitId}`);
        }

        const qty = new Decimal(quantity);
        const multiplier = new Decimal(conversion.multiplier as any);

        if (conversion.fromUnitId === fromUnitId) {
            // Direct: from -> to (multiplier)
            return qty.mul(multiplier);
        } else {
            // Reverse: to -> from (1 / multiplier)
            return qty.div(multiplier);
        }
    }

    /**
     * Simplified: Convert to Base Unit (multiplier multiplication)
     */
    static async convertToBase(qty: number | string | Decimal, fromUnitId: string, toUnitId: string, multiplier: number | string | Decimal) {
        return new Decimal(qty).mul(new Decimal(multiplier));
    }
}
