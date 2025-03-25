export const splitByIndex = (str: string, index: number) => {
    return [str.slice(0, index), str.slice(index)];
}

export const setRightAlignment = (existingTextLength: number, textToAlignLength: number, charactersPerLine: number): string => {
    const maxLength = charactersPerLine;
    const spaces = maxLength - existingTextLength - textToAlignLength;
    if (spaces === 0) return '';
    if (spaces > 0) return ' '.repeat(spaces);
    return '\n' + ' '.repeat(maxLength - textToAlignLength);
};
export const breakText = (
    text: string | undefined,
    charactersPerLine: number,
    paddingRight: number,
    existingTextLengthBefore: number
) => {
    if (!text) return '';
    const maxLength = charactersPerLine - paddingRight;
    const words = text.split(' ');

    const lines = words.reduce((acc, word, index) => {
        const maxLineLength = acc.length === 1 ? maxLength - (existingTextLengthBefore || 0) : maxLength;

        const newWord = index === 0 ? word : ` ${word}`;
        if (acc[acc.length - 1].length + newWord.length > maxLineLength) {
            return [...acc, word];
        }

        return [...acc.slice(0, -1), acc[acc.length - 1] + newWord];
    }, ['']);

    const cleanedLines = lines.filter((word) => word.length > 0);
    return cleanedLines.join('\n');
};
