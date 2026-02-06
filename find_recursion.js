const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'USER', 'Desktop', 'SISTEMA GESTION', 'app-wrapper.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Use regex to find function definitions and check if they call themselves
// This is a rough heuristic
const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
let match;
const recursiveFound = [];

while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1];
    // Find the body of the function (rough estimation by looking for the next few thousand chars or until end of file)
    // and check if 'name(' exists after the definition
    const startIndex = match.index + match[0].length;
    const searchArea = content.substring(startIndex, startIndex + 10000); // 10k chars should cover most functions

    // Look for name( but not if it's the definition itself (which we already skipped)
    const recursivePattern = new RegExp('\\b' + name + '\\s*\\(', 'g');
    if (recursivePattern.test(searchArea)) {
        recursiveFound.push(name);
    }
}

// Check arrow functions too
const arrowRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*(async\s+)?\(.*?\)\s*=>/g;
while ((match = arrowRegex.exec(content)) !== null) {
    const name = match[1];
    const startIndex = match.index + match[0].length;
    const searchArea = content.substring(startIndex, startIndex + 10000);
    const recursivePattern = new RegExp('\\b' + name + '\\s*\\(', 'g');
    if (recursivePattern.test(searchArea)) {
        recursiveFound.push(name);
    }
}

console.log("Potential recursive functions found:");
console.log(Array.from(new Set(recursiveFound)).join(', '));
