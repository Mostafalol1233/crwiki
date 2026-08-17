# Google publisher setup

CrossFire Wiki now contains a non-blocking `GoogleAdSlot` component. It supports either Google AdSense or Google Ad Manager and renders nothing until the corresponding production variables are configured. No publisher ID is hardcoded in the repository.

## Choose the correct Google product

Google Ads is for buying and managing advertising campaigns. It is not the product used to place ads on CrossFire Wiki. For ordinary website monetization, use **Google AdSense**. Use **Google Ad Manager** when you need a publisher network, explicit ad units, direct-sold inventory, or more advanced mediation and reporting.

| Product | Use on this site | Required setup |
|---|---|---|
| AdSense | Simple publisher monetization | Add and verify `crossfire.wiki` in AdSense, then create an ad unit |
| Ad Manager | Managed inventory and ad units | Create a network, define an ad unit, and obtain the network code and unit path |
| Google Ads | Buying traffic or campaigns | Not used by the site’s publisher slots |

## Vercel production variables

For AdSense, configure the following production variables in Vercel:

```text
VITE_GOOGLE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_GOOGLE_ADSENSE_SLOT_WEAPONS=XXXXXXXXXX
```

For Google Ad Manager, configure these instead:

```text
VITE_GOOGLE_AD_MANAGER_NETWORK_CODE=123456
VITE_GOOGLE_AD_MANAGER_UNIT_WEAPONS=crossfire/weapons-top
```

Use one publisher path at a time. Do not enter a placeholder value. The page’s ad slot is intentionally hidden when these variables are absent, so the wiki remains usable during review and Google account approval.

## ads.txt

After AdSense or Ad Manager provides the exact authorized seller line, add that line to a root-level `public/ads.txt` file and deploy it at `https://crossfire.wiki/ads.txt`. The repository does not add a placeholder `ads.txt` line because an incorrect publisher ID can prevent verification.

## Official references

Consult Google’s [AdSense site-connection guide](https://support.google.com/adsense/answer/7584263?hl=en), [Ad Manager inventory guide](https://support.google.com/admanager/answer/6022000?hl=en), [Google Publisher Tag guide](https://developers.google.com/publisher-tag/guides/get-started), and [ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en) before enabling production traffic.
