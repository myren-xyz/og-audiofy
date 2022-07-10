const puppeteer = require('puppeteer');
const fs = require('fs');

var browser;

const htmlTemplate = fs.readFileSync('./index.html', 'utf8');

runBrowser = async () => {
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width: 512,
            height: 512,
        }
    })
}

image = async () => {
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });
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
    const image = await element.screenshot({ omitBackground: true, path: './image.png' });
    await page.close();
    // return image;
}

closeBrowser = async () => {
    browser.close();
}

runBrowser().then(image).then(closeBrowser);