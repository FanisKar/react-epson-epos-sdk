import { PrintColor } from "./Printer.enums";

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