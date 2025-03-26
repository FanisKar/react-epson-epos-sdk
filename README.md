# react-epson-epos-sdk

A React library that provides a modern and extensible alternative to the Epson ePOS SDK, enabling seamless management of Epson printer connections, text formatting, and print job handling via HTTP.

> **Note**: This library is a **Work in Progress (WIP)**. While it supports many common functionalities, any unsupported features can be implemented using the `addXmlChunk` method in the `Printer` class. Contributions and feature requests are welcome!

---

## Features

- **Printer Management**: Easily manage printer connections and statuses using the `PrinterProvider`.
- **Text Formatting**: Customize text alignment, font, size, and style.
- **2D Symbol Support**: Add various 2D symbols (e.g., QR Code, PDF417, DataMatrix) to your print jobs with customizable options.
- **Custom XML Support**: Extend functionality by adding raw XML chunks.
- **Automatic Retry**: When the printer connection is lost, the library keeps the commands in memory and automatically sends them once the printer is back online.
- **React Integration**: Built with React for seamless integration into your applications.
- **Improved Text Splitting**: The addText method has been enhanced to ensure that words are not split across lines. If a word doesn't fit on the current line, it is moved entirely to the next line, improving readability and maintaining proper word boundaries in printed content. This replaces the default behavior of Epson ePOS SDK which breaks text at the character level.

---

## Installation

Install the library using npm or yarn:

```bash
npm install react-epson-epos-sdk
```

or

```bash
yarn add react-epson-epos-sdk
```

---

## Peer Dependencies

Ensure you have the following peer dependencies installed in your project:

- `react` (v17, v18, or v19)
- `react-dom` (v17, v18, or v19)

---

## Usage

### Setting Up the PrinterProvider

Wrap your application with the `PrinterProvider` to manage printer connections and state:

```tsx
import { PrinterProvider } from "react-epson-epos-sdk";
import { PaperSize } from "react-epson-epos-sdk";

const App = () => {
  return (
    <PrinterProvider printerIp="192.168.0.100" paperSize={PaperSize.SIZE_80MM} isDebugMode={true}>
      {/* Your application components */}
    </PrinterProvider>
  );
};

export default App;
```

### Using the `usePrinter` Hook

The `usePrinter` hook provides access to the printer context, allowing you to interact with the printer directly:

```tsx
import { usePrinter, PrintSymbolType, PrinterCutType, PrintSymbolLevel } from 'react-epson-epos-sdk';

const PrintButton = () => {
  const { printer, status, print } = usePrinter();

  const handlePrint = async () => {
    if (!printer) {
      throw new Error('Printer not found!');
    }
    // Add text to the print job
    printer.addText('Hello, Epson!', { addNewLine: true, capitalize: true });

    // Add a 2D symbol (e.g., QR Code)
    printer.addSymbol('https://example.com', {
      type: PrintSymbolType.QRCODE_MODEL_2,
      level: PrintSymbolLevel.LEVEL_M,
      width: 4,
    });

    // Add a cut command
    printer.addCut(PrinterCutType.CUT_FEED);

    // Send the print job
    try {
      await print();
      console.log('Print job sent successfully!');
    } catch (error) {
      console.error('Failed to send print job:', error);
    }
  };

  return (
    <button onClick={handlePrint} disabled={status !== 'CONNECTED'}>
      Print
    </button>
  );
};

export default PrintButton;
```

---

## API Reference

### PrinterProvider

| Prop          | Type        | Description                                                             |
| ------------- | ----------- | ----------------------------------------------------------------------- |
| `printerIp`   | `string`    | The IP address of the printer.                                          |
| `paperSize`   | `PaperSize` | The paper size, using the `PaperSize` enum.                             |
| `isDebugMode` | `boolean`   | (Optional) Enables debug logging for printer status and unprinted data. |

### usePrinter Hook

The `usePrinter` hook provides access to the following:

- **`printer`**: An instance of the `Printer` class.
- **`connection`**: The current connection status (`CONNECTED`, `DISCONNECTED`, etc.).
- **`print()`**: A method to send the current print job to the printer.

---

## Printer Functions

The `Printer` class provides the following methods for building print jobs:

- **`addText(text: string, options?: { rightPadding?: number; addNewLine?: boolean; alignRight?: boolean; capitalize?: boolean })`**

  - Adds text to the print job with optional formatting.

- **`addSymbol(data: string, options: { type: PrintSymbolType; level: AllowedPrintSymbolLevel; width?: number; height?: number; size?: number })`**

  - Adds a 2D symbol (e.g., QR Code, PDF417, DataMatrix) to the print job with customizable options.

- **`addCut(type?: PrinterCutType)`**

  - Adds a cut command to the print job.

- **`addFeedLine(line: number)`**

  - Adds a feed line to the print job.

- **`setTextFont(font: PrinterTextFont)`**

  - Sets the font for the text.

- **`setTextStyle(style: Partial<TextStyle>)`**

  - Sets the style for the text (e.g., bold, underline).

- **`setTextSize(size: TextSize)`**

  - Sets the size of the text.

- **`setTextAlign(align: PrinterAlign)`**

  - Sets the alignment of the text.

- **`addHorizontalLine()`**

  - Adds a horizontal line to the print job.

- **`addXmlChunk(xmlChunk: string)`**
  - Adds a raw XML chunk to the print job.

---

## Enums

### PrinterTextFont

- `FONT_A`
- `FONT_B`
- `FONT_C`
- `FONT_D`
- `FONT_E`

### PrinterCutType

- `CUT_NO_FEED`
- `CUT_FEED`
- `CUT_RESERVE`
- `FULL_CUT_NO_FEED`
- `FULL_CUT_FEED`
- `FULL_CUT_RESERVE`

### PrintColor

- `COLOR_NONE`
- `COLOR_1`
- `COLOR_2`
- `COLOR_3`
- `COLOR_4`

### PrinterAlign

- `ALIGN_LEFT`
- `ALIGN_CENTER`
- `ALIGN_RIGHT`

### PaperSize

- `SIZE_80MM`
- `SIZE_58MM`

### PrintSymbolType

- `PDF417_standard`
- `PDF417_truncated`
- `QRCODE_MODEL_1`
- `QRCODE_MODEL_2`
- `MAXICODE_MODE_2`
- `MAXICODE_MODE_3`
- `MAXICODE_MODE_4`
- `MAXICODE_MODE_5`
- `MAXICODE_MODE_6`
- `GS1_DATABAR_STACKED`
- `GS1_DATABAR_STACKED_OMNIDIRECTIONAL`
- `GS1_DATABAR_EXPANDED_STACKED`
- `AZTECCODE_FULLRANGE`
- `AZTECCODE_COMPACT`
- `DATAMATRIX_SQUARE`
- `DATAMATRIX_RECTANGLE_8`
- `DATAMATRIX_RECTANGLE_12`
- `DATAMATRIX_RECTANGLE_16`

### PrintSymbolLevel

- `LEVEL_0` to `LEVEL_8` (PDF417 error correction levels)
- `LEVEL_L`, `LEVEL_M`, `LEVEL_Q`, `LEVEL_H` (QR Code error correction levels)
- `DEFAULT`
- **Note**: Aztec Code has error correction levels ranging from 5 to 95 (Default: 23).

---

## Development

This library is still under development. If you encounter any missing features or bugs, feel free to open an issue or submit a pull request. Contributions are always welcome!

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
