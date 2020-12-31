const fs = require('fs');
const { PNG } = require('pngjs');

const inputFilename = 'redballoon-characters.png';
const outputFilename = 'sprites.png';

const nSprites = 8 * 2;

const inputImage = PNG.sync.read(fs.readFileSync(inputFilename));
const outputImage = new PNG({ width: 16, height: nSprites * 16 });

const convertSprite = (i, inX, inY) => {
    const base = i * 16 * 16;
    console.log(i, inX, inY);
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const inputIndex = ((inY + y * 2) * inputImage.width + (inX + x * 2)) * 4;
            const outputIndex = (base + y * 16 + x) * 4;
            const value = (inputImage.data[inputIndex] == 0) ? 255 : 0;
            outputImage.data[outputIndex]
                = outputImage.data[outputIndex + 1] 
                = outputImage.data[outputIndex + 2] = 0;
            outputImage.data[outputIndex + 3] = value;
        }
    }
}

let outputIndex = 0;
for (let direction = 0; direction < 8; direction++) {
    for (let frame = 0; frame < 2; frame++) {
        convertSprite(outputIndex++, (frame + 8) * 36 + 4, direction * 36 + 4);
    }
}

fs.writeFileSync(outputFilename, PNG.sync.write(outputImage));