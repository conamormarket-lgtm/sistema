
const fs = require('fs');
const path = 'app-wrapper.tsx';

try {
    const buffer = fs.readFileSync(path);
    let lineCount = 0;
    let startOffset = 0;
    let endOffset = -1;
    const startLine = 5483;
    const endLine = 5770;

    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 10) { // \n
            lineCount++;

            if (lineCount === startLine - 1) {
                startOffset = i + 1;
            }

            if (lineCount === endLine) {
                endOffset = i + 1;
                break;
            }
        }
    }

    if (startLine === 1) startOffset = 0;

    console.log(`Deleting from byte ${startOffset} to ${endOffset} (Lines ${startLine}-${endLine})`);

    if (endOffset !== -1) {
        const newBuffer = Buffer.concat([
            buffer.slice(0, startOffset),
            buffer.slice(endOffset)
        ]);
        fs.writeFileSync(path, newBuffer);
        console.log('Successfully deleted lines.');
    } else {
        console.error('Could not find end line');
        process.exit(1);
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}
