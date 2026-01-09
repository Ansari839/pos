import React from "react";
import Barcode from "react-barcode";

interface BarcodePrintableProps {
    value: string;
    name?: string;
    price?: number;
}

export const BarcodePrintable = React.forwardRef<HTMLDivElement, BarcodePrintableProps>(
    ({ value, name, price }, ref) => {
        return (
            <div ref={ref} className="flex flex-col items-center justify-center p-4 bg-white border border-black w-fit mx-auto print:border-none print:shadow-none">
                {name && <div className="text-sm font-bold mb-1 max-w-[200px] text-center truncate">{name}</div>}
                <Barcode
                    value={value}
                    width={1.5}
                    height={40}
                    fontSize={12}
                    displayValue={true}
                    margin={0}
                />
                {price !== undefined && (
                    <div className="text-lg font-black mt-1">${price.toFixed(2)}</div>
                )}
            </div>
        );
    }
);

BarcodePrintable.displayName = "BarcodePrintable";
