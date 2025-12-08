#!/usr/bin/env node

/**
 * Script to migrate API routes from legacy fake-token parsing to the shared
 * getUserIdFromToken(headers()) helper. It removes inline token parsing helpers
 * and injects a consistent unauthorized guard.
 */

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const apiRoots = ['src/api', 'src/app/api'].map((dir) => path.join(projectRoot, dir));
const blockRegex = /(\s*)const headersList = headers\(\);[\s\S]*?const userId = token\.split\('-'\)\[2\][^;]*;[\s\S]*?\n\1\}/g;

function walk(dir) {
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(fullPath);
        if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            return [fullPath];
        }
        return [];
    });
}

function ensureNamedImport(source, specifier, code) {
    const alreadyHasImport = new RegExp(`import\\s+\\{[^}]*\\b${specifier}\\b[^}]*\\}\\s+from\\s+['"]${source}['"];?`);
    if (alreadyHasImport.test(code)) return code;

    const namedImportRegex = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${source}['"];?`);
    if (namedImportRegex.test(code)) {
        return code.replace(namedImportRegex, (full, imports) => {
            const parts = imports.split(',').map((p) => p.trim()).filter(Boolean);
            if (!parts.includes(specifier)) parts.push(specifier);
            return `import { ${parts.join(', ')} } from '${source}';`;
        });
    }

    const importStatements = [...code.matchAll(/import[\s\S]*?from ['"][^'"]+['"];?/g)];
    const insertPos = importStatements.length
        ? importStatements[importStatements.length - 1].index + importStatements[importStatements.length - 1][0].length
        : 0;

    const importLine = `import { ${specifier} } from '${source}';\n`;
    return insertPos === 0 ? `${importLine}${code}` : `${code.slice(0, insertPos)}\n${importLine}${code.slice(insertPos)}`;
}

function removeLocalFakeTokenHelper(code) {
    const match = code.match(/async function getUserIdFromToken/);
    const start = match ? match.index : -1;
    if (start === -1) return code;
    const braceStart = code.indexOf('{', start);
    if (braceStart === -1) return code;
    let depth = 1;
    let i = braceStart + 1;
    while (i < code.length && depth > 0) {
        const ch = code[i];
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
        i += 1;
    }
    return code.slice(0, start) + code.slice(i);
}

function replaceInlineFakeTokenBlock(code) {
    return code.replace(blockRegex, (_match, indent) => {
        const baseIndent = indent ?? '';
        return (
            `${baseIndent}const userId = getUserIdFromToken(headers());\n` +
            `${baseIndent}if (!userId) {\n` +
            `${baseIndent}    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });\n` +
            `${baseIndent}}\n`
        );
    });
}

function normalizeHelperCalls(code) {
    return code
        .replace(/await\s+getUserIdFromToken\s*\(\s*\)/g, 'getUserIdFromToken(headers())')
        .replace(/getUserIdFromToken\s*\(\s*\)/g, 'getUserIdFromToken(headers())');
}

let updatedFiles = 0;

for (const root of apiRoots) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('fake-token')) continue;

        const original = content;
        content = removeLocalFakeTokenHelper(content);
        content = replaceInlineFakeTokenBlock(content);
        content = normalizeHelperCalls(content);

        if (content !== original) {
            content = ensureNamedImport('@/lib/firestore-helpers', 'getUserIdFromToken', content);
            content = ensureNamedImport('next/headers', 'headers', content);
            fs.writeFileSync(file, content);
            updatedFiles += 1;
            console.log(`[auth-fix] updated ${path.relative(projectRoot, file)}`);
        }
    }
}

console.log(`[auth-fix] Completed. Updated ${updatedFiles} file(s).`);
