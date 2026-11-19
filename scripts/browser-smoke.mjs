import { chromium } from "playwright";
import fs from "node:fs";
const browser = await chromium.launch({headless:true,args:["--autoplay-policy=no-user-gesture-required"]});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
const errors=[];
page.on("pageerror",e=>errors.push(String(e)));
page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text())});
await page.goto("https://mayabachrach.github.io/radio/?browser-smoke=1",{waitUntil:"domcontentloaded",timeout:60000});
await page.locator("#webamp #main-window").waitFor({timeout:45000});
await page.locator("#webamp #equalizer-window").waitFor({timeout:15000});
await page.waitForTimeout(3000);
const report=await page.evaluate(()=>({
 main:!!document.querySelector("#webamp #main-window"),
 equalizer:!!document.querySelector("#webamp #equalizer-window"),
 playlist:!!document.querySelector("#webamp #playlist-window"),
 closeVisible:[...document.querySelectorAll("#webamp #close,#webamp #equalizer-close")].some(el=>getComputedStyle(el).display!=="none"),
 mainBackground:getComputedStyle(document.querySelector("#webamp #main-window")).backgroundImage.slice(0,120),
 stationText:document.querySelector("#webamp #marquee")?.textContent?.slice(0,200),
 bodyScrollWidth:document.body.scrollWidth,
 viewportWidth:window.innerWidth,
 status:document.querySelector("#status")?.textContent
}));
fs.mkdirSync("artifacts",{recursive:true});
await page.screenshot({path:"artifacts/radio.png",fullPage:true});
fs.writeFileSync("artifacts/report.json",JSON.stringify({...report,errors},null,2));
console.log(JSON.stringify({...report,errors},null,2));
if(!report.main||!report.equalizer||report.playlist||report.closeVisible||report.status)process.exitCode=1;
await browser.close();
