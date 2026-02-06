const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);

if (files.length === 0) {
    console.log('Usage: node fix_ts_errors.js <file1> <file2> ...');
    // Default to app-wrapper.tsx if no args for backward compatibility during dev
    files.push('c:\\Users\\USER\\Desktop\\SISTEMA GESTION\\app-wrapper.tsx');
}

files.forEach(filePath => {
    try {
        console.log(`Processing: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 1. updates = {} -> updates: any = {}
        content = content.replace(/(let|const)\s+updates\s*=\s*\{\}/g, '$1 updates: any = {}');

        // 2. catch (error) -> catch (error: any)
        // Ensure it doesn't already have a type
        content = content.replace(/catch\s*\(\s*(\w+)\s*\)\s*\{/g, 'catch ($1: any) {');
        // Also handle catch(e) without brace immediately (less common but possible)
        // content = content.replace(/catch\s*\(\s*(\w+)\s*\)(?!\s*:)/g, 'catch ($1: any)'); 

        // 3. Array methods callbacks
        const methods = 'map|find|filter|forEach|some|every|reduce|flatMap';

        // Single arg, no parens: .map(p =>
        const regexSingleNoParens = new RegExp(`\\.(${methods})\\s*\\(\\s*([a-zA-Z0-9_]+)\\s*=>`, 'g');
        content = content.replace(regexSingleNoParens, '.$1(($2: any) =>');

        // Single arg, with parens: .map((p) =>
        const regexSingleParens = new RegExp(`\\.(${methods})\\s*\\(\\s*\\(\\s*([a-zA-Z0-9_]+)\\s*\\)\\s*=>`, 'g');
        content = content.replace(regexSingleParens, '.$1(($2: any) =>');

        // Two args: .map((p, i) =>
        const regexTwoArgs = new RegExp(`\\.(${methods})\\s*\\(\\s*\\(\\s*([a-zA-Z0-9_]+)\\s*,\\s*([a-zA-Z0-9_]+)\\s*\\)\\s*=>`, 'g');
        content = content.replace(regexTwoArgs, '.$1(($2: any, $3: any) =>');

        // Three args: .map((p, i, a) =>
        const regexThreeArgs = new RegExp(`\\.(${methods})\\s*\\(\\s*\\(\\s*([a-zA-Z0-9_]+)\\s*,\\s*([a-zA-Z0-9_]+)\\s*,\\s*([a-zA-Z0-9_]+)\\s*\\)\\s*=>`, 'g');
        content = content.replace(regexThreeArgs, '.$1(($2: any, $3: any, $4: any) =>');

        // Event handlers
        content = content.replace(/onChange=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, 'onChange={($1: any) =>');
        content = content.replace(/onFileChange=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, 'onFileChange={($1: any) =>');
        content = content.replace(/onClick=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, 'onClick={($1: any) =>');
        content = content.replace(/onSubmit=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, 'onSubmit={($1: any) =>');

        // General Arrow Function fixes: (arg) =>
        content = content.replace(/\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, '($1: any) =>');

        // Two args arrow: (arg1, arg2) =>
        // Be careful not to break things that are already typed. 
        // Only match if no colons inside parens? 
        // Regex for "no colon" is hard.
        // Let's rely on the fact that formatted code usually has spaces.
        content = content.replace(/\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, '($1: any, $2: any) =>');

        // useState fixes
        content = content.replace(/(React\.)?useState\(\s*\[\]\s*\)/g, '$1useState<any[]>([])');
        content = content.replace(/(React\.)?useState\(\s*\{\}\s*\)/g, '$1useState<any>({})');
        content = content.replace(/(React\.)?useState\(\s*null\s*\)/g, '$1useState<any>(null)');
        content = content.replace(/(React\.)?useState\(\s*undefined\s*\)/g, '$1useState<any>(undefined)');

        // createContext fix
        content = content.replace(/createContext\(\s*null\s*\)/g, 'createContext<any>(null)');

        // Object.entries fix
        content = content.replace(/\.map\(\(\[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]\)\s*=>/g, '.map(([$1, $2]: [string, any]) =>');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        } else {
            console.log(`No changes needed for: ${filePath}`);
        }

    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
    }
});
