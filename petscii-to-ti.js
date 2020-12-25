// Convert C16 Character ROM to TI-99 character set

const fs = require('fs');

const input = fs.readFileSync('c16.bin');
const buffer = Buffer.alloc(2048, 0);
input.copy(buffer,  64 * 8,       0,  32 * 8);      // @ A ...
input.copy(buffer,  32 * 8,  32 * 8,  64 * 8);      // SPC ! ...
input.copy(buffer, 128 * 8,  64 * 8,  96 * 8);      // Graphics Page 1
input.copy(buffer, 160 * 8,  96 * 8, 128 * 8);      // Graphics Page 2
input.copy(buffer,  96 * 8, 128 * 8, 160 * 8);      // ` a ...
Buffer.alloc(8, 255).copy(buffer, 0, 0, 8);         // Cursor Glyph
fs.writeFileSync('CHARS', buffer);