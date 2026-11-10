import {ADS_CONFIG} from './ads-config.js';
const slot=document.getElementById('advertisingSlot');
export function canServeAds(c){return c.mode==='adsense'&&c.siteApproved===true&&c.consentIntegrationReady===true&&/^ca-pub-\d{16}$/.test(c.publisherId)&&/^\d+$/.test(c.slotId);}
if(slot){
 if(ADS_CONFIG.mode==='off')slot.hidden=true;
 else if(canServeAds(ADS_CONFIG)){
  const container=document.createElement('ins');container.className='adsbygoogle';container.style.cssText='display:inline-block;width:300px;height:50px';container.dataset.adClient=ADS_CONFIG.publisherId;container.dataset.adSlot=ADS_CONFIG.slotId;
  slot.querySelector('.ad-preview').replaceWith(container);
  const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADS_CONFIG.publisherId;
  script.onload=()=>{try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{slot.hidden=true;}};script.onerror=()=>{slot.hidden=true;};document.head.append(script);
 }
}
document.getElementById('adDetails')?.addEventListener('click',()=>document.getElementById('adsDialog').showModal());
document.getElementById('closeAds')?.addEventListener('click',()=>document.getElementById('adsDialog').close());
