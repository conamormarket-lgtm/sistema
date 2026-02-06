const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'USER', 'Desktop', 'SISTEMA GESTION', 'app-wrapper.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove null bytes and other common garbage characters
// but keep standard printable ASCII and some common Spanish characters (áéíóúñÁÉÍÓÚÑ)
content = content.replace(/[^\x20-\x7E\n\r\táéíóúñÁÉÍÓÚÑ¡¿]/g, '');

// Also fix the specific corruption I saw if it still exists in the string
content = content.replace(/function as\s+\{urarEstructurasAnidadas/g, 'function asegurarEstructurasAnidadas');

fs.writeFileSync(filePath, content, 'utf8');
console.log("File cleaned and repaired.");
