const fs = require('fs');

const filePath = 'app-wrapper.tsx';
const startLine = parseInt(process.argv[2]);
const endLine = parseInt(process.argv[3]);

if (!startLine || !endLine || isNaN(startLine) || isNaN(endLine)) {
    console.error('Usage: node delete_lines.js <startLine> <endLine>');
    process.exit(1);
}

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    // 1-based index adjustment
    const startIndex = startLine - 1;

    // Check bounds
    if (startIndex < 0 || startIndex >= lines.length) {
        console.error('Start line out of bounds');
        process.exit(1);
    }

    // number of items to delete
    const deleteCount = endLine - startLine + 1;

    console.log(`Deleting lines ${startLine} to ${endLine} (${deleteCount} lines)`);

    // splice modifies array in place
    lines.splice(startIndex, deleteCount);

    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log(`Successfully deleted lines.`);
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
