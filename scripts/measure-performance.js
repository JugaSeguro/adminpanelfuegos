const puppeteer = require('puppeteer');

(async () => {
    const TARGET_URL = 'http://localhost:3001'; // Adjust if needed

    console.log(`🚀 Starting Performance Test on ${TARGET_URL}...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Enable performance metrics
    await page.setCacheEnabled(false);

    try {
        console.log('📡 Navigating to page...');
        const navigationStart = Date.now();
        await page.goto(TARGET_URL, { waitUntil: 'networkidle0', timeout: 60000 });
        const loadTime = Date.now() - navigationStart;

        console.log(`✅ Page loaded in ${loadTime}ms`);

        // Capture Navigation Timing Metrics
        const perfData = await page.evaluate(() => {
            const navCallback = window.performance.getEntriesByType("navigation")[0];
            const paintCallback = window.performance.getEntriesByType("paint");

            const fcp = paintCallback.find(e => e.name === 'first-contentful-paint')?.startTime;

            return {
                domInteractive: navCallback.domInteractive,
                domComplete: navCallback.domComplete,
                fcp: fcp || 0,
                ttfb: navCallback.responseStart - navCallback.requestStart,
            };
        });

        console.log('\n📊 Core Metrics:');
        console.log(`- TTFB (Time to First Byte): ${perfData.ttfb.toFixed(2)}ms`);
        console.log(`- FCP (First Contentful Paint): ${perfData.fcp.toFixed(2)}ms`);
        console.log(`- DOM Interactive: ${perfData.domInteractive.toFixed(2)}ms`);
        console.log(`- DOM Complete: ${perfData.domComplete.toFixed(2)}ms`);

        // Measure Heap Size
        const metrics = await page.metrics();
        console.log(`\n💾 Resources:`);
        console.log(`- JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- DOM Nodes: ${metrics.Nodes}`);

        // Scroll Test for FPS/Lag estimation
        console.log('\n📜 Running Scroll Test...');
        await page.evaluate(async () => {
            return new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
        console.log('✅ Scroll test finished.');

        // Final Heap check after scroll
        const finalMetrics = await page.metrics();
        console.log(`- JS Heap After Scroll: ${(finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- DOM Nodes After Scroll: ${finalMetrics.Nodes}`);

    } catch (error) {
        console.error('❌ Error measuring performance:', error);
    } finally {
        await browser.close();
    }
})();
