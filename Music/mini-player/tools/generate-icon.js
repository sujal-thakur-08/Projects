const PImage = require('pureimage');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');
const Stream = require('stream');

function pngBufferFromImage(img) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = new Stream.PassThrough();
        stream.on('data', (c) => chunks.push(c));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
        PImage.encodePNGToStream(img, stream).then(() => stream.end()).catch(reject);
    });
}

async function drawIcon(size) {
    const img = PImage.make(size, size);
    const ctx = img.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;

    // solid background
    ctx.fillStyle = '#1fb6ff';
    ctx.fillRect(0, 0, size, size);

    // circle for record
    ctx.beginPath();
    ctx.fillStyle = '#7b61ff';
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // inner label
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(cx, cy, Math.max(4, size * 0.08), 0, Math.PI * 2);
    ctx.fill();

    // play triangle
    const triSize = radius * 0.9;
    const tx = cx - triSize * 0.15;
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.moveTo(tx, cy - triSize * 0.5);
    ctx.lineTo(tx, cy + triSize * 0.5);
    ctx.lineTo(tx + triSize, cy);
    ctx.closePath();
    ctx.fill();

    return img;
}

async function makeIco() {
    const sizes = [256, 128, 64, 48, 32, 16];
    const buffers = [];
    for (const s of sizes) {
        const img = await drawIcon(s);
        const buf = await pngBufferFromImage(img);
        buffers.push(buf);
    }
    const ico = await toIco(buffers);
    const out = path.join(__dirname, '..', 'assets', 'icon.ico');
    fs.writeFileSync(out, ico);
    console.log('Wrote', out);
}

makeIco().catch((e) => { console.error(e); process.exit(1); });
