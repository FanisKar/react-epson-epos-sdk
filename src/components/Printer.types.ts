import { PrintColor, PrintSymbolLevel, PrintSymbolType } from "./Printer.enums";

export interface AddTextOptions {
    rightPadding?: number;
    addNewLine?: boolean;
    alignRight?: boolean;
    capitalize?: boolean;
}

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

export interface AddSymbolOptions {
    type: PrintSymbolType;
    level: AllowedPrintSymbolLevel;
    width?: number;
    height?: number;
    size?: number;
}


// Aztec Code has error correction level from 5 to 95 (Default: 23)
export type AllowedPrintSymbolLevel = PrintSymbolLevel | number;