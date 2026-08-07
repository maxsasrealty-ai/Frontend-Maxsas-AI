// CJS fallback for non-Metro bundlers (e.g. Vercel SSR/Node)
const mod = require('./Icon.web');
module.exports = mod.default || mod;
module.exports.default = mod.default || mod;
module.exports.LexusIcon = mod.default || mod;
