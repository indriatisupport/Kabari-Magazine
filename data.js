/* ===== EDIT ME: site settings & issue data ===== */
const CONFIG={
  startYear:2012,                 // first year in archive
  latest:{y:2026,m:9},            // newest issue (month 1-12). Update when a new issue is published.
  email:'info@kabarinews.com',
  chatEndpoint:'https://kabari-chat.indriatisupport.workers.dev',
  formEndpoint:'https://formspree.io/f/xqpewbpb',                // paste a Formspree URL (https://formspree.io/f/xxxx) to receive messages by form; empty = opens email app
  website:'https://kabarinews.com',
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
  social:{facebook:'https://facebook.com/ikutkabari',instagram:'https://instagram.com/ikutkabari',pinterest:'https://pinterest.com/kabari',x:'',youtube:''},
// Firebase setup
firebase: {
  apiKey: "AIzaSyB088KOXbcvLvGdFUkR5Whxs2qX8InSxy0",
  authDomain: "kabari-magazine-login.firebaseapp.com",
  projectId: "kabari-magazine-login",
  storageBucket: "kabari-magazine-login.firebasestorage.app",
  messagingSenderId: "897011551840",
  appId: "1:897011551840:web:f2eebee717a07d1aff7d05"
}};
/* Real covers / links per issue. Key = "YYYY-M". Anything not listed gets a generated cover and "Coming soon" buttons.
   Example: "2026-9":{cover:"covers/2026-09.jpg",read:"https://...",pdf:"pdf/2026-09.pdf",desc:{en:"...",id:"..."}} */
const OVERRIDES={
  "2026-9":{cover:"covers/2026-09.jpg",read:"pdf/2026-09.pdf",pdf:"pdf/2026-09.pdf"},
  "2026-8":{cover:"covers/2026-08.jpg",read:"pdf/2026-08.pdf",pdf:"pdf/2026-08.pdf"},
  "2026-7":{cover:"covers/2026-07.png",read:"pdf/2026-07.pdf",pdf:"pdf/2026-07.pdf"},
  "2026-6":{cover:"covers/2026-06.png",read:"pdf/2026-06.pdf",pdf:"pdf/2026-06.pdf"},
  "2026-5":{cover:"covers/2026-05.png",read:"pdf/2026-05.pdf",pdf:"pdf/2026-05.pdf"},
  "2026-4":{cover:"covers/2026-04.png",read:"pdf/2026-04.pdf",pdf:"pdf/2026-04.pdf"},
  "2026-3":{cover:"covers/2026-03.jpg",read:"pdf/2026-03.pdf",pdf:"pdf/2026-03.pdf"},
  "2026-2":{cover:"covers/2026-02.jpg",read:"pdf/2026-02.pdf",pdf:"pdf/2026-02.pdf"},
  "2026-1":{cover:"covers/2026-01.jpg",read:"pdf/2026-01.pdf",pdf:"pdf/2026-01.pdf"}

};
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
