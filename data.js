/* ===== EDIT ME: site settings & issue data ===== */
const CONFIG={
  startYear:2012,                 // first year in archive
  latest:{y:2026,m:9},            // newest issue (month 1-12). Update when a new issue is published.
  email:'info@kabarinews.com',
  formEndpoint:'https://formspree.io/f/xqpewbpb',                // paste a Formspree URL (https://formspree.io/f/xxxx) to receive messages by form; empty = opens email app
  website:'https://kabarinews.com',
  issuu:'https://issuu.com/kabari8',   // official Kabari page on Issuu; used as the "Read" fallback until an issue has its own link
  location:'San Francisco, United States',
  signup:{                        // Constant Contact INLINE form: paste the two codes between the backticks ` `
    universal:`<!-- Begin Constant Contact Active Forms -->
<script> var _ctct_m = "03a3be2c346528ddfe3b8afc71410877"; </script>
<script id="signupScript" src="https://static.ctctcdn.com/js/signup-form-widget/current/signup-form-widget.min.js" async defer></script>
<!-- End Constant Contact Active Forms -->`,                 // 1) Universal Code (loaded on every page)
    inline:`<!-- Begin Constant Contact Inline Form Code -->
<div class="ctct-inline-form" data-form-id="8e08c888-f507-4d9e-b419-f2aaea6f4230"></div>
<!-- End Constant Contact Inline Form Code -->`                     // 2) Inline Code (shows the form on the home page)
  },
  signupUrl:'',                   // Constant Contact sign-up form link (see instructions). Empty = Subscribe opens an email to info@
  apps:{appStore:'',googlePlay:''},  // paste the App Store / Google Play URLs of the Kabari app
  social:{facebook:'https://facebook.com/ikutkabari',instagram:'https://instagram.com/ikutkabari',pinterest:'https://pinterest.com/kabari',x:'',youtube:''}
};
/* Real covers / links per issue. Key = "YYYY-M". Anything not listed gets a generated cover and "Coming soon" buttons.
   Example: "2026-9":{cover:"covers/2026-09.jpg",read:"https://...",pdf:"pdf/2026-09.pdf",desc:{en:"...",id:"..."}} */
const OVERRIDES={};
const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const CATS=['News','Culture','Community','Business','Lifestyle'];
const CAT_COLOR={News:'#0F7B3F',Culture:'#0A0A0A',Community:'#166534',Business:'#374151',Lifestyle:'#3F6212'};
const ISSUES=[];
for(let y=CONFIG.latest.y;y>=CONFIG.startYear;y--){
  for(let m=(y===CONFIG.latest.y?CONFIG.latest.m:12);m>=1;m--){
    const o=OVERRIDES[y+'-'+m]||{};
    ISSUES.push({id:y+'-'+m,y,m,cat:o.cat||CATS[(y*12+m)%5],cover:o.cover||'',read:o.read||'',pdf:o.pdf||'',desc:o.desc||null});
  }
}
