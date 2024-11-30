import { writeFileSync } from 'fs';
import puppeteer, { Page } from 'puppeteer';
import { createFolderRecursiveIfNoExist } from 'utils/dist/node';
import { getDateString, wait } from 'utils/dist/common';
import { join } from 'path';

export class PictureMaker {
  constructor(
    private shootingTime: number,
    private timeout: number,
    private address: string,
    private resultFolder: string,
    private windowSize?: { width: number, height: number },
    private logAction: (action: string) => void = () => null
  ) { }

  async start() {
    this.logAction('Starting');
    try {
      const browserData = await this.createBrowserData();
      const countOfShots = this.shootingTime * 60 / (this.timeout / 1000);

      createFolderRecursiveIfNoExist(this.resultFolder);

      await this.takeScreenShots(browserData.page, countOfShots, this.timeout);

      await browserData.browser.close();
    } catch (e) {
      let errorMessage;

      if (typeof e === 'string') {
        errorMessage = e;
      } else {
        errorMessage = JSON.stringify(e);
      }
      this.logAction(`ERROR:\n${errorMessage}`);
    }
    this.logAction('End');
  }

  private async createBrowserData() {
    const browser = await puppeteer.launch({ args: ['--disable-features=site-per-process'] });

    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(0);

    await page.setViewport({
      width: this.windowSize?.width ?? 1450,
      height: this.windowSize?.height ?? 720
    });
    page.goto(this.address, { waitUntil: 'networkidle0' });

    await wait(5000);

    return { browser, page };
  }

  private async takeScreenShots(page: Page, screenshotsCount: number, timeoutToWait: number) {
    for (let i = 0; i < screenshotsCount; i++) {
      const data = await page.screenshot({ type: 'png' });
      const fileName = join(this.resultFolder, `${getDateString(new Date())}.png`);

      writeFileSync(fileName, data);
      const action = `${i + 1} screenshot of ${screenshotsCount}`;
      this.logAction(action);
      if (i < (screenshotsCount - 1)) {
        await wait(timeoutToWait);
      }
    }
  }
}