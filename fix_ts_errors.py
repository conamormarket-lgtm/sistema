import re

file_path = r'c:\Users\USER\Desktop\SISTEMA GESTION\app-wrapper.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. updates = {} -> updates: any = {}
content = re.sub(r'(let|const)\s+updates\s*=\s*\{\}', r'\1 updates: any = {}', content)

# 2. catch (error) -> catch (error: any)
content = re.sub(r'catch\s*\(\s*(\w+)\s*\)', r'catch (\1: any)', content)

# 3. Array methods callbacks
# Note: careful not to match things that are already typed or complex
# Single arg no parens: .map(p =>
# We use negative lookahead to avoid already typed params if possible (though space mostly prevents it)
# We match .method( followed by var =>

methods = r'(?:map|find|filter|forEach|some|every|reduce|flatMap)'

# Single arg, no parens: .map(item =>
content = re.sub(r'\.' + methods + r'\s*\(\s*([a-zA-Z0-9_]+)\s*=>', r'.\1((\2: any) =>', content)

# Single arg, with parens: .map((item) =>
content = re.sub(r'\.' + methods + r'\s*\(\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'.\1((\2: any) =>', content)

# Two args: .map((item, index) =>
content = re.sub(r'\.' + methods + r'\s*\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'.\1((\2: any, \3: any) =>', content)

# Three args: .map((item, index, arr) =>
content = re.sub(r'\.' + methods + r'\s*\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'.\1((\2: any, \3: any, \4: any) =>', content)

# Fix (e) => void where e is implied
# Specific cases seen in logs
# onChange={(e) =>
content = re.sub(r'onChange=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'onChange={(\1: any) =>', content)
# onFileChange={(e) =>
content = re.sub(r'onFileChange=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'onFileChange={(\1: any) =>', content)
# onClick={(e) =>
content = re.sub(r'onClick=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'onClick={(\1: any) =>', content)
# onSubmit={(e) =>
content = re.sub(r'onSubmit=\{?\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>', r'onSubmit={(\1: any) =>', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Regex Fixes")
