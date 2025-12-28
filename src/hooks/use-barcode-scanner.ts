import { useEffect, useCallback, useState } from "react";

interface UseBarcodeScannerOptions {
    onScan: (code: string) => void;
    minLength?: number;
}

/**
 * Hook to handle barcode scanner input.
 * Most USB/Bluetooth scanners act as keyboard input (HID mode).
 * This hook listens for rapid keypresses ending with Enter.
 */
export function useBarcodeScanner({ onScan, minLength = 3 }: UseBarcodeScannerOptions) {
    const [buffer, setBuffer] = useState<string>("");
    const [lastKeyTime, setLastKeyTime] = useState<number>(0);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;

            // Scanners type very fast (usually < 50ms between keys)
            // If user types manually, it's usually slower.
            // We reset buffer if pause is too long (> 100ms)
            if (timeDiff > 100) {
                setBuffer("");
            }

            setLastKeyTime(currentTime);

            if (e.key === "Enter") {
                if (buffer.length >= minLength) {
                    onScan(buffer);
                    setBuffer("");
                }
                return;
            }

            // Ignore non-character keys (e.g. Shift, Control, etc.)
            // Note: Scanner sends characters.
            if (e.key.length === 1) {
                setBuffer((prev) => prev + e.key);
            }
        },
        [buffer, lastKeyTime, onScan, minLength]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);
}
