import { PrintColor, PrintSymbolLevel } from "./Printer.enums";

export interface TextSize {
    width: number;
    height: number;
}

export interface TextStyle {
    reverse: boolean;
    ul: boolean;
    em: boolean;
    color: PrintColor;
}

// Aztec Code has error correction level from 5 to 95 (Default: 23)
export type AllowedPrintSymbolLevel = PrintSymbolLevel | number;