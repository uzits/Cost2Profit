# Cost2Profit — Free, ad-free PWA

A mobile-first pricing and profit calculator. Works on Android, iPhone, and desktop via a browser; installable on supported browsers. No ads, analytics, external APIs, accounts, or paid hosting are required.

## What it calculates
- Fixed costs **per sale**: e.g., materials, labor, packaging, shipping, per-order advertising.
- Percentage fees **of selling price**: e.g., marketplace commissions and payment processing.
- **Recommended price** = fixed costs / (1 - total fee percentage - target net margin percentage).
- **Profit at price P** = P - fixed costs - (P × total fee percentage).
- **Actual net profit margin** = profit / P × 100 (for P > 0).
- **Break-even price** = fixed costs / (1 - fee percentage) (when fees < 100%).
- **Markup on fixed costs** = actual net profit / fixed costs × 100 (undefined if fixed costs are zero).
- Quantity-based projection = per-sale net profit × number of sales.

All currency choices are **display units, not exchange-rate conversions**. Inputs must all be in the selected currency. Tax/VAT, refunds, fixed monthly overhead, and tiered fees must be included manually as per-sale expenses as applicable; this version does not separately model tax treatment, multiple products per order, or sales-volume-dependent costs. It is a planning tool, not financial or tax advice.

## Run locally
To test without installing software, open `index.html` in a browser. Calculations work, but PWA installation and offline caching require serving it from HTTPS or localhost.

For a local test with Python installed:
```
cd cost2profit
python -m http.server 8000
```
Open http://localhost:8000/ and use your browser developer tools to inspect the app.

## Publish for free with GitHub Pages
1. Create a free GitHub account, if needed.
2. Create a new **public** repository such as `cost2profit`.
3. Upload the **contents** of this folder to the root of the repository (`index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, `icons/`).
4. Under the repository **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
5. Your app will be served at `https://YOUR-USERNAME.github.io/cost2profit/` after GitHub Pages finishes deploying.

## Install on phones
- Android: Open the published HTTPS address in Chrome, then use **Install app** or **Add to Home screen** from the browser menu, depending on the browser.
- iPhone: Open the address in Safari, tap **Share → Add to Home Screen** (select **Open as Web App**, if offered), then Add.

Visit the PWA online once, then it can load offline from the service-worker cache. Calculations and saved scenarios are stored in browser localStorage for the specific site/browser; deleting site data or switching browsers can erase them. These scenarios are **not synced or backed up**.

## Updating the app
When changing app files, update `CACHE` in `sw.js` (e.g., `cost2profit-v2`) before deploying so phones install the updated offline files. Open the app online to obtain the new version.

## License
For this project, you may use and modify the provided source for your Cost2Profit app. No third-party JS or CSS dependencies.
