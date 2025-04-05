// Font image should be 16 * 8 ascii, text should not contain, leading, trailing, or consecutive spaces
import Images from './images.js';
const CharColumns = 16;
const CharRows = 8;
export default class TextRenderer {
    static IntroText = [
        "Beneath the light of a sickle moon the last aurox walks alone. He is huge and powerful, ancient and tired. His joints ache under his hulking weight, and his brain boils with fever. He has not seen his own kind since he left his mother.",
        "As he lays down to die the madding spirit whispers in the aurox's ear. It speaks of the enemy that builds and burns and loves only what it can control. A rage fills the aurox. His nostrils flare and his breath is fire. He dies, but his hatred lingers in the forest of dry bones.",
        "The years pass, and countless lost souls walk into the dark shade of the forest. Stone by stone their tower rises."
    ];
    static IntroTextImage = TextRenderer.pageCanvas(TextRenderer.IntroText, Images.Font, 360);
    static pageCanvas(pageText, fontImage, wrapWidth) {
        const paragraphCanvases = [];
        let height = 0;
        let width = 0;
        const charHeight = fontImage.height / CharRows;
        for (const paragraphText of pageText) {
            // console.log(fontImage.width, fontImage.height)
            const paragraphCanvas = TextRenderer.paragraphCanvas(paragraphText, fontImage, wrapWidth);
            paragraphCanvases.push(paragraphCanvas);
            height += paragraphCanvas.height;
            if (paragraphCanvas.width > width) {
                width = paragraphCanvas.width;
            }
        }
        if (pageText.length > 1) {
            height += charHeight * (pageText.length - 1);
        }
        const pageCanvas = document.createElement('canvas');
        const pageContext = pageCanvas.getContext('2d');
        pageCanvas.width = width;
        pageCanvas.height = height;
        let y = 0;
        for (const paragraphCanvas of paragraphCanvases) {
            pageContext.drawImage(paragraphCanvas, 0, y);
            y += paragraphCanvas.height + charHeight;
        }
        return pageCanvas;
    }
    static paragraphCanvas(paragraphText, fontImage, wrapWidth) {
        const charWidth = fontImage.width / CharColumns;
        const charHeight = fontImage.height / CharRows;
        const paragraphCanvas = document.createElement('canvas');
        const paragraphContext = paragraphCanvas.getContext('2d');
        const lines = [];
        let lineIndex = 0;
        let spaceIndex = 0;
        for (let i = 0; i < paragraphText.length; i++) {
            if (paragraphText[i] === ' ') {
                spaceIndex = i;
                continue;
            }
            const lineLength = i - lineIndex;
            const lineWidth = lineLength * charWidth;
            if (lineWidth > wrapWidth) {
                lines.push(paragraphText.substring(lineIndex, spaceIndex));
                lineIndex = spaceIndex + 1;
            }
        }
        const lastLine = paragraphText.substring(lineIndex);
        if (lastLine.length > 0) {
            lines.push(lastLine);
        }
        const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b);
        paragraphCanvas.width = charWidth * longestLine.length;
        paragraphCanvas.height = charHeight * lines.length;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === ' ')
                    continue;
                const code = char.charCodeAt(0);
                const srcX = code % 16 * charWidth;
                const srcY = Math.floor(code / 16) * charHeight;
                const dstX = j * charWidth;
                const dstY = i * charHeight;
                paragraphContext.drawImage(fontImage, srcX, srcY, charWidth, charHeight, dstX, dstY, charWidth, charHeight);
            }
        }
        return paragraphCanvas;
    }
}
