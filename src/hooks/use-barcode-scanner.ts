import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
    onScan: (code: string) => void;
    minLength?: number;
    maxDelay?: number;
}

/**
 * Hook to handle barcode scanner input.
 * Optimized with useRef to handle rapid HID input without React state lag.
 */
export function useBarcodeScanner({ onScan, minLength = 3, maxDelay = 40 }: UseBarcodeScannerOptions) {
    const bufferRef = useRef<string>("");
    const lastKeyTimeRef = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore modifiers
            if (e.key.length > 1 && e.key !== 'Enter') return;

            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            if (e.key === "Enter") {
                if (bufferRef.current.length >= minLength) {
                    onScan(bufferRef.current);
                }
                bufferRef.current = "";
                return;
            }

            // Reset if delay is too long (character-by-character check)
            if (timeDiff > maxDelay && bufferRef.current.length > 0) {
                bufferRef.current = "";
            }

            // Scanners send characters. Ignore non-char keys like Shift/Ctrl/Alt
            if (e.key.length === 1) {
                bufferRef.current += e.key;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onScan, minLength, maxDelay]);
}
