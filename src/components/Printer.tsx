import axios from "axios";
import { cloneDeep } from "lodash";
import { capitalizeAndRemoveAccents } from "../utils/text.utils";
import { breakText, setRightAlignment } from "./Printer.utils";
import { PrintColor, PrinterAlign, PrinterCutType, PrinterTextFont, PrintSymbolLevel, PrintSymbolType } from "./Printer.enums";
import { AddSymbolOptions, AddTextOptions, AllowedPrintSymbolLevel, TextSize, TextStyle } from "./Printer.types";
import { PaperSize } from "../providers/PrinterProvider.enum";

export class Printer {
  private static readonly TIMEOUT = 5000;
  private static readonly HEARTBEAT_XML = `<?xml version="1.0" encoding="utf-8"?>
  <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
      <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"></epos-print>
    </s:Body>
  </s:Envelope>`;

  private printerIp: string;
  private paperSize: PaperSize;
  private textFont = PrinterTextFont.FONT_A;
  private textSize: TextSize = { width: 1, height: 1 };
  private textStyle: TextStyle = { reverse: false, ul: false, em: false, color: PrintColor.COLOR_1 };
  private cursorX = 0;
  private xmlChunks: string[] = [];

  constructor(printerIp: string, paperSize: PaperSize) {
    this.printerIp = printerIp;
    this.paperSize = paperSize;
  }

  addXmlChunk = (xmlChunk: string): void => {
    this.xmlChunks.push(xmlChunk);
  };

  setXmlChunks = (xmlChunks: string[]): void => {
    this.reset();
    this.xmlChunks = xmlChunks;
  };

  getXmlChunks = (): string[] => {
    return this.xmlChunks;
  };

  private reset(): void {
    this.xmlChunks = [];
    this.cursorX = 0;
    this.setTextFont(PrinterTextFont.FONT_A);
    this.setTextSize({ width: 1, height: 1 });
    this.setTextStyle({ reverse: false, ul: false, em: false, color: PrintColor.COLOR_1 });
  }

  addText(text: string, { rightPadding = 0, addNewLine = false, alignRight = false, capitalize = false }: AddTextOptions = {}): void {
    if (alignRight) {
      this.xmlChunks.push(`<text>${setRightAlignment(this.cursorX, text.length, this.getCharactersPerLine())}</text>`);
    }

    const brokenText = breakText(
      capitalize ? capitalizeAndRemoveAccents(text) : text,
      this.getCharactersPerLine(),
      rightPadding,
      this.cursorX
    );
    const lines = brokenText.split("\n");

    this.xmlChunks.push(`<text>${this.escapeXml(brokenText)}</text>`);
    this.cursorX += lines[lines.length - 1].length;
    this.cursorX %= this.getCharactersPerLine();

    if (addNewLine) {
      this.addNewLine();
    }
  }

  addNewLine(): void {
    this.xmlChunks.push(`<text>\n</text>`);
    this.cursorX = 0;
  }

  setTextFont(font: PrinterTextFont): void {
    this.textFont = font;
    this.xmlChunks.push(`<text font="${font}" />`);
  }

  setTextStyle({ reverse, ul, em, color }: Partial<TextStyle>): void {
    this.textStyle = {
      reverse: reverse ?? this.textStyle.reverse,
      ul: ul ?? this.textStyle.ul,
      em: em ?? this.textStyle.em,
      color: color ?? this.textStyle.color,
    };
    this.xmlChunks.push(
      `<text reverse="${this.textStyle.reverse}" ul="${this.textStyle.ul}" em="${this.textStyle.em}" color="${this.textStyle.color}" />`
    );
  }

  setTextSize(textSize: TextSize): void {
    this.xmlChunks.push(`<text width="${textSize.width}" height="${textSize.height}" />`);
    this.textSize = textSize;
  }

  setTextAlign(align: PrinterAlign): void {
    this.xmlChunks.push(`<text align="${align}" />`);
  }

  addFeedLine(line: number): void {
    this.xmlChunks.push(`<feed line="${line}" />`);
  }

  addCut(type: PrinterCutType = PrinterCutType.CUT_FEED): void {
    this.xmlChunks.push(`<cut type="${type}" />`);
  }

  /**
   * Adds a 2D barcode symbol to the print buffer in XML format.
   *
   * @param {string} data - The content/data to encode within the symbol.
   *
   * @param {Object} options - Configuration options for the symbol.
   * @param {PrintSymbolType} options.type - The type of 2D code to print (e.g. QR Code, PDF417, etc.).
   * @param {AllowedPrintSymbolLevel} options.level - Error correction level or symbol quality level,
   * depending on the barcode type.
   * @param {number} [options.width] - Optional. Specifies the width of each module (square block) in dots.
   *
   * - The valid range is:
   *    - **QR Code**: 1 to 16 (default = 3)
   *    - **PDF417**: 2 to 8 (default = 3)
   *    - **Aztec/DataMatrix/GS1 DataBar**: 2 to 16 or 2 to 8 depending on type
   *    - **MaxiCode**: Ignored
   *
   * @param {number} [options.height] - Optional. Specifies the height of each module in dots.
   *
   * - Only applies to **PDF417**, range: 2 to 8 (default = 3). For other types, height is ignored.
   *
   * @param {number} [options.size] - Optional. Size-specific attribute depending on symbol type:
   *
   * - **PDF417**: Specifies number of codewords per row (default = 0)
   * - **GS1 DataBar (Expanded Stacked)**: Specifies maximum width (default = 0 for auto)
   * - **Others (QR Code, MaxiCode, Aztec, DataMatrix)**: Ignored
   *
   * @returns {void}
   */
  addSymbol(data: string, { type, level, width, height, size }: AddSymbolOptions): void {
    const widthStr = width ? ` width="${width}"` : "";
    const heightStr = height ? ` height="${height}"` : "";
    const sizeStr = size ? ` size="${size}"` : "";
    this.xmlChunks.push(`<symbol type="${type}" level="${level}"${widthStr}${heightStr}${sizeStr}>${this.escapeXml(data)}</symbol>`);
  }

  addHorizontalLine(): void {
    this.addNewLine();
    const textStyle = cloneDeep(this.textStyle);
    this.setTextStyle({ ul: true });
    this.addText(" ".repeat(this.getCharactersPerLine()));
    this.addNewLine();
    this.addNewLine();
    this.setTextStyle(textStyle);
  }

  toXml(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
            <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
              <s:Body>
                <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
                  ${this.xmlChunks.join("\n")}
                </epos-print>
              </s:Body>
            </s:Envelope>`;
  }

  async checkOnline(): Promise<boolean> {
    try {
      await this.sendRequest(Printer.HEARTBEAT_XML);
      return true;
    } catch {
      return false;
    }
  }

  async send(): Promise<void> {
    const xml = this.toXml();
    await this.sendRequest(xml);
    this.reset();
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/\n/g, "&#10;")
      .replace(/\t/g, "&#9;");
  }

  private sendRequest = (body: string): Promise<void> => {
    return axios.post(`https://${this.printerIp}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=${Printer.TIMEOUT}`, body, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "",
        "If-Modified-Since": "Thu, 01 Jun 1970 00:00:00 GMT",
        Authorization: undefined,
      },
      transformRequest: [
        (data, headers) => {
          delete headers.Authorization;
          return data;
        },
      ],
    });
  };

  private getCharactersPerLine = (): number => {
    const paperWidthDots = this.paperSize === PaperSize.SIZE_80MM ? 576 : 384;
    const baseCharWidthDots = this.textFont === PrinterTextFont.FONT_A ? 12 : 9;
    return Math.floor(paperWidthDots / (baseCharWidthDots * this.textSize.width));
  };
}
