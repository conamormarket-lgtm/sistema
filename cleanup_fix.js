const fs = require('fs');

const filePath = 'c:\\Users\\USER\\Desktop\\SISTEMA GESTION\\app-wrapper.tsx';

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Revert specific problematic replacements
    // We replaced (var) with (var: any) globally, catching function calls.
    // Reverting them (variable names: snapshot, doc, e, files, value)

    const vars = ['snapshot', 'doc', 'e', 'files', 'value'];

    vars.forEach(v => {
        // Revert (v: any) -> (v)
        const regex = new RegExp(`\\(${v}: any\\)`, 'g');
        content = content.replace(regex, `(${v})`);
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Reverted invalid Regex Fixes');

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
