import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'public');
const stubsDir = path.join(__dirname, 'stubs');

// Browser-only modules redirected to lightweight stubs.
// Key: virtual /framework/... path. Value: filesystem path to stub.
const STUBS = {
    '/framework/core/App/App.js': path.join(stubsDir, 'App.js'),
    '/framework/core/View/View.js': path.join(stubsDir, 'View.js'),
    '/framework/ext/Socket/Socket.js': path.join(stubsDir, 'Socket.js'),
};

function stubUrl(virtualPath) {
    const stub = STUBS[virtualPath];
    return stub ? pathToFileURL(stub).href : null;
}

function virtualPath(filesystemPath) {
    const rel = path.relative(root, filesystemPath).split(path.sep).join('/');
    return rel.startsWith('..') ? null : '/' + rel;
}

// path.join(root, '/foo') treats '/foo' as absolute on Windows — strip the leading slash.
function frameworkPath(specifier) {
    return path.join(root, specifier.slice(1));
}

export function resolve(specifier, context, next) {
    // Absolute /framework/... and /app.js — map into public/
    if (specifier.startsWith('/')) {
        const url = stubUrl(specifier) ?? pathToFileURL(frameworkPath(specifier)).href;
        return { url, shortCircuit: true };
    }

    // Relative imports that resolve into a browser-only stub target
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
        try {
            const resolved = fileURLToPath(new URL(specifier, context.parentURL));
            const vp = virtualPath(resolved);
            if (vp) {
                const url = stubUrl(vp);
                if (url) return { url, shortCircuit: true };
            }
        } catch {}
    }

    return next(specifier, context);
}
