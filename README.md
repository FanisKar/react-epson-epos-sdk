# react-epson-epos-sdk

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/FanisKar/react-epson-epos-sdk)

A React library that provides a modern and extensible alternative to the Epson ePOS SDK, enabling seamless management of Epson printer connections, text formatting, and print job handling via HTTP.

> **Note**: This library is a **Work in Progress (WIP)**. While it supports many common functionalities, any unsupported features can be implemented using the `addXmlChunk` method in the `Printer` class. Contributions and feature requests are welcome!

---

## Features

- **Printer Management**: Easily manage printer connections and statuses using the `PrinterProvider`.
- **Text Formatting**: Customize text alignment, font, size, and style.
- **2D Symbol Support**: Add various 2D symbols (e.g., QR Code, PDF417, DataMatrix) to your print jobs with customizable options.
- **Custom XML Support**: Extend functionality by adding raw XML chunks.
- **Automatic Retry**: When the printer connection is lost, the library keeps the commands in memory and automatically sends them once the printer is back online.
- **Serialized HTTP**: All requests to the same printer endpoint (print jobs, heartbeats, retries) are queued so only one `service.cgi` call runs at a time. Epson devices reject overlapping requests, which otherwise show up as short-lived canceled fetches in DevTools.
- **React Integration**: Built with React for seamless integration into your applications.
- **Improved Text Splitting**: The addText method has been enhanced to ensure that words are not split across lines. If a word doesn't fit on the current line, it is moved entirely to the next line, improving readability and maintaining proper word boundaries in printed content. This replaces the default behavior of Epson ePOS SDK which breaks text at the character level.
- **Async Print Method**: Unlike the official Epson ePOS SDK, this library's `print` method is asynchronous and returns `SUCCESS`, `QUEUED` (failed but saved for replay when the printer reconnects), or `ERROR` (failed with no retry). This provides better handling and a clearer overview of your print jobs, making it easier to manage printing operations.
- **Test mode**: Optional `testMode` on `PrinterProvider` skips all printer HTTP calls, marks configured printers as connected, logs each print (IP + full XML), and makes `print()` return `SUCCESS` for dry runs.

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

- `react` (v18 or v19)
- `react-dom` (v18 or v19)

---

## Usage

### Setting Up the PrinterProvider

Wrap your application with the `PrinterProvider` and pass a **`printers` list**. Each entry needs a stable **`id`**, **`printerIp`**, and **`paperSize`**. You can add or remove printers by updating this list.

**One printer** (same behavior as before, with an explicit id):

```tsx
import { PrinterProvider } from "react-epson-epos-sdk";
import { PaperSize } from "react-epson-epos-sdk";

const App = () => {
  return (
    <PrinterProvider
      printers={[{ id: "receipt", printerIp: "192.168.0.100", paperSize: PaperSize.SIZE_80MM }]}
      isDebugMode={true}
    >
      {/* Your application components */}
    </PrinterProvider>
  );
};

export default App;
```

**Several printers**:

```tsx
<PrinterProvider
  printers={[
    { id: "receipt", printerIp: "192.168.0.10", paperSize: PaperSize.SIZE_80MM },
    { id: "kitchen", printerIp: "192.168.0.11", paperSize: PaperSize.SIZE_58MM },
  ]}
/>
```

Optional **`options`** per printer (defaults match the previous single-printer HTTP behavior):

```tsx
{
  id: "receipt",
  printerIp: "192.168.0.100",
  paperSize: PaperSize.SIZE_80MM,
  options: { devId: "local_printer", requestTimeoutMs: 5000, printRequestTimeoutMs: 20000, useHttps: true },
}
```

### Test mode (`testMode`)

Set **`testMode`** on `PrinterProvider` when you want to exercise printing UI without hitting the network.

When **`testMode` is `true`**:

- No requests are sent for heartbeats (`checkOnline`) or jobs (`send`).
- Every printer in the **`printers`** list reports status **`CONNECTED`**.
- Calling **`print()`** logs a message to the console with that printer’s **`printerIp`** and the **full XML** payload (`toXml()`), clears the in-memory buffer like a successful print, and returns **`PrintResult.SUCCESS`**.

```tsx
<PrinterProvider
  printers={[{ id: "receipt", printerIp: "192.168.0.100", paperSize: PaperSize.SIZE_80MM }]}
  testMode={import.meta.env.DEV}
/>
```

Do not leave `testMode` enabled in production if receipts may contain sensitive data (the full XML is logged).

### Using the `usePrinter` Hook

Pass the **same `id`** you used in the `printers` list. The hook returns that printer’s instance, connection status, and `print()`.

```tsx
import { usePrinter, PrintSymbolType, PrinterCutType, PrintSymbolLevel } from "react-epson-epos-sdk";

const PrintButton = () => {
  const { printer, status, print } = usePrinter("receipt");

  const handlePrint = async () => {
    if (!printer) {
      throw new Error("Printer not found!");
    }
    // Add text to the print job
    printer.addText("Hello, Epson!", { addNewLine: true, capitalize: true });

    // Add a 2D symbol (e.g., QR Code)
    printer.addSymbol("https://example.com", {
      type: PrintSymbolType.QRCODE_MODEL_2,
      level: PrintSymbolLevel.LEVEL_M,
      width: 4,
    });

    // Add a cut command
    printer.addCut(PrinterCutType.CUT_FEED);

    // Send the print job
    try {
      await print();
      console.log("Print job sent successfully!");
    } catch (error) {
      console.error("Failed to send print job:", error);
    }
  };

  return (
    <button onClick={handlePrint} disabled={status !== "CONNECTED"}>
      Print
    </button>
  );
};

export default PrintButton;
```

---

## API Reference

### PrinterProvider

| Prop          | Type               | Description                                                                                    |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| `printers`    | `PrinterConfig[]`  | Configured printers. Change this array to add/remove/update devices; each row must have a unique `id`. An empty array is allowed (no connections, no printing). |
| `isDebugMode` | `boolean`          | (Optional) Enables debug logging for printer status and unprinted data.                        |
| `testMode`    | `boolean`          | (Optional) If `true`, skips all printer HTTP traffic; all configured printers show as connected; `print()` logs IP + XML and returns success. Default: `false`. |

Each **`PrinterConfig`** has `id`, `printerIp`, `paperSize`, and optional **`options`** (`devId`, `requestTimeoutMs`, `printRequestTimeoutMs`, `useHttps`). Export **`PrinterConfig`** / **`PrinterConnectionOptions`** from the package when typing your list.

### usePrinter Hook

Call **`usePrinter(printerId)`** with an id from the `printers` prop. If the id is **not** in `printers`, the hook still works: **`status`** stays **`DISCONNECTED`**, **`printer`** is **`undefined`**, and **`print()`** resolves to **`ERROR`** (no throw). You get:

- **`printer`**: An instance of the `Printer` class for that id.
- **`status`**: The current connection status (`CONNECTED`, `DISCONNECTED`, etc.).
- **`print()`**: Sends the current print job for that printer (async, returns `SUCCESS`, `QUEUED`, or `ERROR`).

---

## Printer Functions

The `Printer` class provides the following methods for building print jobs:

- **`addText(text: string, options?: AddTextOptions)`**

  - Adds text to the print job with optional formatting.

- **`addSymbol(data: string, options: AddSymbolOptions)`**

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
