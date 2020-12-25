const fs = require('fs');
const { PNG } = require('pngjs');

// piskel exports PNGs that have extra zeros at the end.  Deal with this:
const readImage = (filename) => {
    const data = fs.readFileSync(pngFilename);
    let end;
    for (end = data.length - 1; end && !data[end]; end--)
        ;
    return PNG.sync.read(data.slice(0, end + 1));
}

const asHexByte = (number) =>
    ('0' + number.toString(16)).substr(0, 2).toUpperCase();

const getCharAt = (png, y0, x0, buf, index) => {
    for (let y = 0; y < 8; y++) {
        let byte = 0;
        for (let x = 0; x < 8; x++) {
            byte <<= 1;
            const idx = ((png.width * (y0 + y) + (x0 + x)) << 2) + 3;
            byte = byte | (png.data[idx] ? 1 : 0);
        }
        buf.writeUInt8(byte, index * 8 + y);
    }
}

const getBigSprite = (png, spriteNumber, buf, index) => {
    getCharAt(png, spriteNumber * 16,     0, buf, index);
    getCharAt(png, spriteNumber * 16 + 8, 0, buf, index + 1);
    getCharAt(png, spriteNumber * 16,     8, buf, index + 2);
    getCharAt(png, spriteNumber * 16 + 8, 8, buf, index + 3);
}

const makeBlocksFileBuffer = (blocks) => {
    const nBlocks = blocks.length / 1024;
    const sectorLength = 256;
    const recordLength = 128;
    const flags = 0;
    const eofOffset = 0;
    const sectorCount = nBlocks * 1024 / sectorLength;
    const level3RecordCount = nBlocks * 1024 / recordLength;
    const header = Buffer.alloc(128, 0);
    const headerData = Buffer.from([0x07, 0x54, 0x49, 0x46, 0x49, 0x4c, 0x45, 0x53,
                                    sectorCount >> 8, sectorCount & 255, 
                                    flags, 256 / recordLength, eofOffset, recordLength,
                                    level3RecordCount & 255, level3RecordCount >> 8]);
    headerData.copy(header);
    const blocksFileBuffer = Buffer.alloc(header.length + blocks.length);
    header.copy(blocksFileBuffer);
    blocks.copy(blocksFileBuffer, header.length);
    return blocksFileBuffer;
}

const makeSpriteBuffer = (pngFilename) => {
    const png = readImage(pngFilename);

    if (png.width != 16) {
        throw new Error(`Image is ${png.width} wide, expected 16`);
    }
    if (png.height % 16) {
        throw new Error(`Image is not a multiple of 16 in height`);
    }
    const spriteBuffer = Buffer.alloc(2048, 0);
    const spriteCount = png.height / 16;
    for (let sprite = 0; sprite < spriteCount; sprite++) {
        getBigSprite(png, sprite, spriteBuffer, sprite * 4);
    }
    console.log(spriteCount, 'sprites copied');
    return spriteBuffer;
}

const makeSourceBuffer = (filename) => {
    let lines = fs.readFileSync(filename, 'utf-8')
        .split(/\r?\n/)
        .reduce((lines, line) => {
            if (line.length) {
                if (line.length % 64) {
                    line += ' '.repeat(64 - (line.length % 64));
                }
                return lines.concat(line.match(/.{64}/g));
            } else {
                return lines;
            }
        }, []);
    const lastBlockLine = '--> ' + ' '.repeat(60);
    let output = '';
    while (lines.length) {
        if (output) {
            output += lastBlockLine;
        }
        const chunk = lines.slice(0, 15);
        output += chunk.join('');
        lines = lines.slice(15);
    }
    return Buffer.from(output);
}

const stringToBlocks = (string) => {
    const lines = string.split(/\r?\n/);
    const buffer = Buffer.alloc(lines.length * 64, 32);
    lines.forEach((line, i) => {
        if (line.length > 64) {
            throw new Error(`Line ${line} longer than 64 characters, can't copy to block`);
        }
        Buffer.from(line).copy(buffer, i * 64);
    });
    return buffer;
}

const sourceFilename = 'source.fs';
const pngFilename = 'sprites.png';
const blocksFilename = 'BLOCKS';

const screenCount = 100;
const libScreen = 80;
const charsScreen = 97;

const blocksBuffer = Buffer.alloc(screenCount * 1024, ' ');

stringToBlocks(`\\ Directory -*- Forth-Block -*-
\\ 2 - Source code
\\ ${libScreen} - Library
\\ ${charsScreen} - Character set and sprites
2 load`).copy(blocksBuffer);

const sourceBuffer = makeSourceBuffer(sourceFilename);
if (sourceBuffer.length > libScreen * 1024) {
    throw new Error("Too many SOURCE screens");
}
console.log(Math.ceil(sourceBuffer.length / 1024), 'SOURCE screens')
sourceBuffer.copy(blocksBuffer, 1024);

const libBuffer = fs.readFileSync('LIB');
if (libBuffer.length > (charsScreen - libScreen) * 1024) {
    throw new Error("Too many LIB screens")
}
console.log(Math.ceil(libBuffer.length / 1024), 'LIB screens')
libBuffer.copy(blocksBuffer, (libScreen - 1) * 1024);

const charsetBuffer = fs.readFileSync('CHARS');
charsetBuffer.copy(blocksBuffer, (charsScreen - 1) * 1024);

const spriteBuffer = makeSpriteBuffer(pngFilename);
spriteBuffer.copy(blocksBuffer, (charsScreen + 1) * 1024);

const blocks = makeBlocksFileBuffer(blocksBuffer);
fs.writeFileSync(blocksFilename, blocks);
