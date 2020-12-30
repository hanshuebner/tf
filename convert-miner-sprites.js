const fs = require('fs');
const { PNG } = require('pngjs');

const inputFilename = 'miner-sprites.png';
const outputFilename = 'sprites.png';

const inputImage = PNG.sync.read(fs.readFileSync(inputFilename));

const wantedSets = [14, 16, 20, 22, 26, 30, 32, 33];

const nSprites = wantedSets.length * 4;

const outputImage = new PNG({ width: 16, height: nSprites * 16 });

const convertSprite = (i, inX, inY) => {
    const base = i * 16 * 16;
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const inputIndex = ((inY + y) * inputImage.width + inX + x) * 4;
            const outputIndex = (base + y * 16 + x) * 4;
            const value = (inputImage.data[inputIndex] || inputImage.data[inputIndex + 1] || inputImage.data[inputIndex + 2]) ? 255 : 0;
            outputImage.data[outputIndex]
                = outputImage.data[outputIndex + 1] 
                = outputImage.data[outputIndex + 2] = 0;
            outputImage.data[outputIndex + 3] = value;
        }
    }
}

const wanted = index => {
    const set = Math.floor(index / 4);
    return wantedSets.indexOf(set) != -1;
}

let inputIndex = 0;
let outputIndex = 0;
for (let y = 0; y < inputImage.height; y += 16) {
    for (let x = 0; x < inputImage.width; x += 16) {
        if (wanted(inputIndex)) {
            convertSprite(outputIndex, x, y);
            outputIndex++;
        }
        inputIndex++;
    }
}

fs.writeFileSync(outputFilename, PNG.sync.write(outputImage));