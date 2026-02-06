
const fs = require('fs');
const path = 'app-wrapper.tsx';

try {
    const buffer = fs.readFileSync(path);
    let lineCount = 0;
    let startOffset = 0; // Default to 0 for line 1
    let endOffset = -1;
    const startLine = 2888;
    const endLine = 4292;

    // We need to find the newline BEFORE the start line (to start cutting after it)
    // and the newline OF the end line (to cut up to and including it)

    // Example: Delete line 2 (indices between 1st \n and 2nd \n)
    // startLine = 2. We need 1st \n position.
    // endLine = 2. We need 2nd \n position.

    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 10) { // \n
            lineCount++;

            // Found the newline ending line (lineCount)

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
