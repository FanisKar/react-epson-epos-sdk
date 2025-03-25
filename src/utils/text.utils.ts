export const capitalizeAndRemoveAccents = (text?: string): string | undefined => {
    return text?.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
}