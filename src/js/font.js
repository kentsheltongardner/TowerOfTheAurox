// Font image should be 16 * 8 ascii, text should not contain, leading, trailing, or consecutive spaces
const CharColumns = 16;
const CharRows = 8;
export default class TextRenderer {
    static textCanvas(text, fontImage, wrapWidth) {
        const charWidth = fontImage.width / CharColumns;
        const charHeight = fontImage.height / CharRows;
        const textCanvas = new HTMLCanvasElement();
        const textContext = textCanvas.getContext('2d');
        const lines = [];
        let lineIndex = 0;
        let spaceIndex = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === ' ') {
                spaceIndex = i;
                continue;
            }
            const lineLength = i - lineIndex;
            const lineWidth = lineLength * charWidth;
            if (lineWidth > wrapWidth) {
                lines.push(text.substring(lineIndex, spaceIndex));
                lineIndex = spaceIndex + 1;
            }
        }
        const lastLine = text.substring(lineIndex);
        if (lastLine.length > 0) {
            lines.push(lastLine);
        }
        const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b);
        textCanvas.width = charWidth * longestLine.length;
        textCanvas.height = charHeight * lines.length;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === ' ')
                    continue;
                const code = char.charCodeAt(0);
                const srcX = code % 16;
                const srcY = Math.floor(code / 16);
                const dstX = j * charWidth;
                const dstY = i * charHeight;
                textContext.drawImage(fontImage, srcX, srcY, charWidth, charHeight, dstX, dstY, charWidth, charHeight);
            }
        }
        return textCanvas;
    }
}
