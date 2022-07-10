const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');
const app = express();

const htmlTemplate = fs.readFileSync('./index.html', 'utf8');

imager = async (artistName, trackName) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width: 512,
            height: 512,
        }
    })
    let htemp = '';
    htemp = htmlTemplate.replace('Artist Name', artistName);
    htemp = htemp.replace('TRACK NAME', trackName);

    const page = await browser.newPage();
    await page.setContent(htemp, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
        const selectors = Array.from(document.querySelectorAll("img"));
        await Promise.all([
            document.fonts.ready,
            ...selectors.map((img) => {
                // Image has already finished loading, let’s see if it worked
                if (img.complete) {
                    // Image loaded and has presence
                    if (img.naturalHeight !== 0) return;
                    // Image failed, so it has no height
                    throw new Error("Image failed to load");
                }
                // Image hasn’t loaded yet, added an event listener to know when it does
                return new Promise((resolve, reject) => {
                    img.addEventListener("load", resolve);
                    img.addEventListener("error", reject);
                });
            }),
        ]);
    });

    const element = await page.$('#body');
    const image = await element.screenshot({ omitBackground: true });
    await page.close();
    await browser.close();
    return image;
}

// get /image/:artist/:track
app.get('/image/:artist/:track', async (req, res) => {
    const artistName = req.params.artist;
    const trackName = req.params.track;
    const img = await imager(artistName, trackName);
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': `public, immutable, no-transform, s-max-age=2592000, max-age=2592000` });
    res.end(img);
})

app.listen(3000, () => {
    console.log('app listening on port 3000!');
})