export enum PrinterCutType {
    CUT_NO_FEED = 'no_feed',
    CUT_FEED = 'feed',
    CUT_RESERVE = 'reserve',
    FULL_CUT_NO_FEED = 'no_feed_fullcut',
    FULL_CUT_FEED = 'feed_fullcut',
    FULL_CUT_RESERVE = 'reserve_fullcut'
}

export enum PrintColor {
    COLOR_NONE = 'none',
    COLOR_1 = 'color_1',
    COLOR_2 = 'color_2',
    COLOR_3 = 'color_3',
    COLOR_4 = 'color_4',
}

export enum PrinterAlign {
    ALIGN_LEFT = 'left',
    ALIGN_CENTER = 'center',
    ALIGN_RIGHT = 'right'
}

export enum PrinterTextFont {
    FONT_A = 'font_a',
    FONT_B = 'font_b',
    FONT_C = 'font_c',
    FONT_D = 'font_d',
    FONT_E = 'font_e',
}

// Print symbol type for 2D symbols
export enum PrintSymbolType {
    PDF417_standard = 'pdf417_standard',
    PDF417_truncated = 'pdf417_truncated',
    QRCODE_MODEL_1 = 'qrcode_model_1',
    QRCODE_MODEL_2 = 'qrcode_model_2',
    MAXICODE_MODE_2 = 'maxicode_mode_2',
    MAXICODE_MODE_3 = 'maxicode_mode_3',
    MAXICODE_MODE_4 = 'maxicode_mode_4',
    MAXICODE_MODE_5 = 'maxicode_mode_5',
    MAXICODE_MODE_6 = 'maxicode_mode_6',
    GS1_DATABAR_STACKED = 'gs1_databar_stacked',
    GS1_DATABAR_STACKED_OMNIDIRECTIONAL = 'gs1_databar_stacked_omnidirectional',
    GS1_DATABAR_EXPANDED_STACKED = 'gs1_databar_expanded_stacked',
    AZTECCODE_FULLRANGE = 'azteccode_fullrange',
    AZTECCODE_COMPACT = 'azteccode_compact',
    DATAMATRIX_SQUARE = 'datamatrix_square',
    DATAMATRIX_RECTANGLE_8 = 'datamatrix_rectangle_8',
    DATAMATRIX_RECTANGLE_12 = 'datamatrix_rectangle_12',
    DATAMATRIX_RECTANGLE_16 = 'datamatrix_rectangle_16',
}

// Error correction level for PDF 417 and QR Code
export enum PrintSymbolLevel {
    LEVEL_0 = 'level_0', // PDF 417 error correction level 0
    LEVEL_1 = 'level_1', // PDF 417 error correction level 1
    LEVEL_2 = 'level_2', // PDF 417 error correction level 2
    LEVEL_3 = 'level_3', // PDF 417 error correction level 3
    LEVEL_4 = 'level_4', // PDF 417 error correction level 4
    LEVEL_5 = 'level_5', // PDF 417 error correction level 5
    LEVEL_6 = 'level_6', // PDF 417 error correction level 6
    LEVEL_7 = 'level_7', // PDF 417 error correction level 7
    LEVEL_8 = 'level_8', // PDF 417 error correction level 8
    LEVEL_L = 'level_l', // QR Code error correction level L
    LEVEL_M = 'level_m', // QR Code error correction level M
    LEVEL_Q = 'level_q', // QR Code error correction level Q
    LEVEL_H = 'level_h', // QR Code error correction level H
    DEFAULT = 'default', // Default error correction level
}
