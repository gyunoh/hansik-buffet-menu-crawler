const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const axios = require('axios');

router.get('/', async (req, res, next) => {
    const instaId = req.query?.instaId;
    await axios.post(process.env.SLACK_CHANNEL_WEBHOOK_URL, { text: `${instaId} 메뉴를 찾고 있습니다...` });

    if (instaId) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(`https://www.instagram.com/${instaId}/`, {
            waitUntil: 'networkidle2'
        });

        const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('._ac7v._aang a'))?.map((el) => el.href));
        
        await browser.close();
        
        if (hrefs?.length) {
            const urls = await Promise.all(hrefs.splice(0, 2)?.map(async (href) => {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto(href, { waitUntil: 'networkidle2' });
                const url = await page.evaluate(() => document.querySelector('._aatk._aatn img')?.src);
                return url;
            }));

            await axios.post(process.env.SLACK_CHANNEL_WEBHOOK_URL, {
                blocks: [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": `:knife_fork_plate: ${instaId}의 오늘의 메뉴입니다`,
                            "emoji": true
                        }
                    },
                    ...urls?.map((url) => {
                        return {
                            "type": "image",
                            "image_url": url,
                            "alt_text": url
                        }
                    })
                ]
            });

            return res.sendStatus(200);
        }
    }

    await axios.post(process.env.SLACK_CHANNEL_WEBHOOK_URL, { text: '메뉴를 찾지 못했습니다... :(' });

    res.sendStatus(200);
});

module.exports = router;