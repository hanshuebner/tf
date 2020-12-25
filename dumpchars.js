const fs = require('fs');

const data = fs.readFileSync('c16.bin');

for (let i = 0; i < 2048; i += 8) {
    const c = i / 8;
    console.log(c, String.fromCharCode(c))
    for (let x = 0; x < 8; x++) {
        const line = data[i + x];
        console.log((line & 128 ? 'X' : ' ')
                    + (line & 64 ? 'X' : ' ')
                    + (line & 32 ? 'X' : ' ')
                    + (line & 16 ? 'X' : ' ')
                    + (line & 8 ? 'X' : ' ')
                    + (line & 4 ? 'X' : ' ')
                    + (line & 2 ? 'X' : ' ')
                    + (line & 1 ? 'X' : ' '));
    }
}