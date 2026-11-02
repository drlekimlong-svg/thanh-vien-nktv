// Sinh tự động bởi tools/tao_lich_ve.py từ app soạn lịch sinh hoạt. Không sửa tay.
  /*! QR Code Generator for JavaScript 2.0.4 · Copyright (c) 2009 Kazuhiko Arase · MIT license · http://www.d-project.com/
      The word 'QR Code' is a registered trademark of DENSO WAVE INCORPORATED. */
  var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1})},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(o*r,n*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}(function(){return qrcode});
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];


  /* ---------- Constants ---------- */
  var W = 1080;
  var FONT = '"Be Vietnam Pro", "Segoe UI", Tahoma, Arial, sans-serif';
  var SERIF = '"Source Serif 4", Georgia, "Times New Roman", serif';
  var MONO = '"IBM Plex Mono", Consolas, "Courier New", monospace';
  var NB = String.fromCharCode(160);
  var GROUPS = ['seiryu', 'suzaku', 'byakko', 'genbu', 'kirin', 'koi'];
  /* ink: group colour for text and rules on white · acc: accent on white · tint: light fill behind the small emblem
     col: side column of the special-programme poster · colAcc: accent on that column
     mode: how the mascot becomes white ink on the column ('neg' = dark strokes turn white, for dark-bodied mascots;
     'pos' = light areas stay white; lo/hi/gamma tune 'pos') · alias: other ways people write the group name */
  var THEMES = {
    seiryu: { name: 'Seiryu', ink: '#0F2E5C', acc: '#8A6A22', tint: '#EEF2F8', col: '#123D88', colAcc: '#E2BF6E', mode: 'neg' },
    suzaku: { name: 'Suzaku', ink: '#7A1916', acc: '#9A561C', tint: '#FAEFEC', col: '#8E1F1C', colAcc: '#F2C27E', mode: 'neg' },
    byakko: { name: 'Byakko', ink: '#2E3A48', acc: '#4A6580', tint: '#EEF2F5', col: '#3A4756', colAcc: '#C6D6E4', mode: 'pos' },
    genbu: { name: 'Genbu', ink: '#33402A', acc: '#6E6330', tint: '#F0F2EA', col: '#3B4A2F', colAcc: '#D9CA86', mode: 'pos', lo: 0.10, hi: 0.75, gamma: 1.0 },
    kirin: { name: 'Kirin', ink: '#3D3280', acc: '#8E4A6B', tint: '#F2EFFA', col: '#4B3F8F', colAcc: '#F4CADA', mode: 'pos' },
    koi: { name: 'Yin-Yang Kois', ink: '#1C2030', acc: '#8C6620', tint: '#F4F1EA', col: '#252B3B', colAcc: '#DDB05C', mode: 'pos', alias: ['kois', 'yinyangkoi', 'yinyangkois'] }
  };
  /* who presents an item: a person (title + name) and where they come from */
  var ORGS = GROUPS.concat(['bcv', 'khach']);
  /* image sizes: oy pushes the top part down and fy the bottom part, so a story keeps clear of the app bars */
  var FORMATS = {
    post: { H: 1350, oy: 0, fy: 0, rowMax: 1, titleMax: 92, label: '1080 × 1350 px' },
    story: { H: 1920, oy: 210, fy: 374, rowMax: 1.2, titleMax: 104, label: '1080 × 1920 px' }
  };
  var WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var CREDIT = 'CLB Ngoại Khoa Trưng Vương - Trường ĐH Y Khoa Phạm Ngọc Thạch';
  var CLUB = 'CÂU LẠC BỘ NGOẠI KHOA TRƯNG VƯƠNG', SCHOOL = 'Trường ĐH Y Khoa Phạm Ngọc Thạch';
  var WEEK_TITLE = 'Lịch sinh hoạt tuần';
  var TEXT = '#151A22', MUTED = '#5D6878', LINE = '#D5DCE6', BODY = '#3B4452';
  var STORE_KEY = 'nktv-lich-sinh-hoat-v1';
  var SAMPLE = {
    v: 1, sample: true, mau: 'tuan', kho: 'post', tenCT: '', phuCT: '', moTa: '', qrLink: '', qrNote: '', nhom: 'seiryu', ngay: '2026-10-04', gioBD: '14:00', gioKT: '18:00',
    dd1: 'Phòng [số phòng], khu A2', dd2: 'ĐHYK Phạm Ngọc Thạch',
    chuTri: 'BS. [Họ tên]', dieuHanh: 'SV. [Họ tên]',
    rows: [
      { t1: '14:00', t2: '15:00', title: 'Đại hội CLB Ngoại khoa Trưng Vương năm học 2026 - 2027', who: 'Thành viên CLB', org: '' },
      { t1: '15:00', t2: '15:50', title: 'Rèn luyện đọc phim CT scan bụng', who: 'Thành viên CLB', org: '' },
      { t1: '16:00', t2: '16:40', title: 'Hình ảnh chấn thương lách trên CT scan bụng', who: '', org: 'suzaku' },
      { t1: '17:10', t2: '18:00', title: 'Thông báo kế hoạch chương trình tuyển quân Gen12th', who: 'Ban tổ chức', org: '' }
    ]
  };

  /* ---------- Small helpers ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(t) { if (!/^\d{1,2}:\d{2}$/.test(t || '')) return null; var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function fromMin(m) { var h = Math.floor(m / 60), mm = m % 60; return pad2(h) + ':' + pad2(mm); }
  function parseDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d) ? null : d; }
  function dmy(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function weekday(s) { var d = parseDate(s); return d ? WEEKDAYS[d.getDay()] : ''; }
  /* the academic year turns over in September: 04/10/2026 → 2026 – 2027, 20/08/2026 → 2025 – 2026 */
  function schoolYear(s) { var d = parseDate(s); if (!d) return ''; var a = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return a + ' – ' + (a + 1); }
  function upper(s) { try { return s.toLocaleUpperCase('vi'); } catch (e) { return s.toUpperCase(); } }
  function nextSunday() { var d = new Date(); d.setHours(0, 0, 0, 0); var add = (7 - d.getDay()) % 7; d.setDate(d.getDate() + add); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  var MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  function plain(s) { return String(s || '').normalize('NFD').replace(MARKS, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
  function squash(s) { return plain(s).toLowerCase().replace(/^\s*nhom\s+/, '').replace(/[^a-z0-9]/g, ''); }
  function slug(s) { return plain(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, ''); }
  /* "Suzaku", "Nhóm Suzaku", "Yin Yang Kois", "Koi" … → group key */
  function groupOf(who) {
    var s = squash(who);
    if (!s) return null;
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i], t = THEMES[g];
      if (s === g || s === squash(t.name) || (t.alias || []).indexOf(s) >= 0) return g;
    }
    return null;
  }
  function orgOf(text) {
    var g = groupOf(text);
    if (g) return g;
    var q = squash(text);
    if (q === 'covan' || q === 'bcv' || q === 'bancovan') return 'bcv';
    if (q === 'khachmoi' || q === 'khach') return 'khach';
    return '';
  }
  /* "SV. Nguyễn Văn A - Nhóm Kirin" → name + group; "Suzaku" alone → the group */
  function parseWho(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    var whole = orgOf(s);
    if (whole) return { who: '', org: whole };
    var m = /^(.*\S)\s*[-–—]\s*([^-–—]+)$/.exec(s);
    if (m) { var o = orgOf(m[2]); if (o) return { who: m[1].trim(), org: o }; }
    return { who: s, org: '' };
  }
  function orgText(org, hasName) {
    if (THEMES[org]) return 'Nhóm ' + THEMES[org].name;
    if (org === 'bcv') return hasName ? 'Cố vấn' : 'Ban cố vấn';
    if (org === 'khach') return 'Khách mời';
    return '';
  }
  function isBreak(title) { return /^(nghỉ\s+)?(giải lao|ăn trưa|nghỉ trưa|break)\b/i.test((title || '').trim()); }
  function hexRgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function bindDashes(s) { return String(s || '').replace(/(\S)[ \t]+([-–—])[ \t]+(?=\S)/g, '$1' + NB + '$2' + NB); }
  var uidN = 0;
  function rid() { uidN += 1; return 'r' + Date.now().toString(36) + uidN; }

  var LIMITS = { tenCT: 120, phuCT: 120, moTa: 400, qrLink: 300, qrNote: 40 };
  function normalize(o) {
    var s = clone(SAMPLE);
    s.sample = false;
    if (!o || typeof o !== 'object') return null;
    ['ngay', 'gioBD', 'gioKT', 'dd1', 'dd2', 'chuTri', 'dieuHanh', 'tenCT', 'phuCT', 'moTa', 'qrLink', 'qrNote'].forEach(function (k) {
      if (typeof o[k] === 'string') s[k] = o[k].slice(0, LIMITS[k] || 200);
    });
    s.mau = o.mau === 'dacbiet' ? 'dacbiet' : 'tuan';
    s.kho = o.kho === 'story' ? 'story' : 'post';
    s.nhom = GROUPS.indexOf(o.nhom) >= 0 ? o.nhom : 'seiryu';
    s.sample = o.sample === true;
    var src = Array.isArray(o.rows) ? o.rows.slice(0, 12) : [];
    s.rows = src.map(function (r) {
      r = r || {};
      var who = typeof r.who === 'string' ? r.who.slice(0, 80) : '', org = ORGS.indexOf(r.org) >= 0 ? r.org : '';
      if (!org && who) { var p = parseWho(who); who = p.who; org = p.org; } /* drafts saved before the split */
      return { id: rid(), t1: typeof r.t1 === 'string' ? r.t1 : '', t2: typeof r.t2 === 'string' ? r.t2 : '', title: typeof r.title === 'string' ? r.title.slice(0, 200) : '', who: who, org: org };
    });
    if (!s.rows.length) s.rows = [{ id: rid(), t1: s.gioBD || '', t2: '', title: '', who: '', org: '' }];
    return s;
  }
  /* ---------- Images and fonts ---------- */
  var imgs = {};
  function loadImg(key, src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { imgs[key] = im; res(); };
      im.onerror = function () { res(); };
      im.src = src;
    });
  }
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var sample = 'LỊCH SINH HOẠT Đđ ặữ Thứ Năm học 0123–:.';
    var want = ['500 40px "Be Vietnam Pro"', '600 40px "Be Vietnam Pro"', '700 40px "Be Vietnam Pro"',
      '600 40px "Source Serif 4"', 'italic 400 40px "Source Serif 4"', '500 40px "IBM Plex Mono"', '600 40px "IBM Plex Mono"'];
    return Promise.all(want.map(function (f) { return document.fonts.load(f, sample).catch(function () {}); }));
  }

  /* The mascot artwork as one ink, made in the browser from the original files (no extra images to keep in sync).
     kind 'dark': dark strokes opaque in `color`, for white paper · 'icon': the same, bolder, for the small marks in the programme
     kind 'white': white ink for the group column */
  var inkCache = {};
  function inked(key, kind, color) {
    var th = THEMES[key], im = imgs[key];
    if (!th || !im) return null;
    var id = key + '|' + kind + '|' + (color || '');
    if (inkCache[id] !== undefined) return inkCache[id];
    var onWhite = kind === 'dark' || kind === 'icon', mode = onWhite ? 'neg' : th.mode, rgb = onWhite ? hexRgb(color) : [255, 255, 255];
    var k = kind === 'icon' ? 2.0 : 1.35, floor = kind === 'icon' ? 0.3 : 0.1;
    var lo = th.lo != null ? th.lo : 0.12, span = (th.hi != null ? th.hi : 0.92) - lo, gm = th.gamma != null ? th.gamma : 1.1;
    var w = im.naturalWidth, h = im.naturalHeight, c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    try {
      var d = g.getImageData(0, 0, w, h), p = d.data;
      for (var i = 0; i < p.length; i += 4) {
        var a = p[i + 3];
        if (!a) continue;
        var L = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255, f;
        if (mode === 'neg') f = Math.pow(Math.min(1, Math.max(0, (1 - L) * k)), 0.9);
        else f = Math.pow(Math.min(1, Math.max(0, (L - lo) / span)), gm);
        p[i] = rgb[0]; p[i + 1] = rgb[1]; p[i + 2] = rgb[2]; p[i + 3] = Math.round(a * (floor + (1 - floor) * f));
      }
      g.putImageData(d, 0, 0);
      inkCache[id] = c;
    } catch (e) { inkCache[id] = null; /* pixels not readable here: the colour artwork is used instead */ }
    return inkCache[id];
  }

  /* ---------- QR code ---------- */
  /* a bare domain gets https:// so phone cameras open it directly */
  function qrText(st) {
    var s = (st.qrLink || '').trim();
    if (s && !/^[a-z][a-z0-9+.-]*:/i.test(s) && /^[^\s\/]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) s = 'https://' + s;
    return s;
  }
  var qrMemo = { key: null, val: null };
  function qrMatrix(text) {
    if (!text) return null;
    if (qrMemo.key === text) return qrMemo.val;
    var val;
    try {
      var q = qrcode(0, 'M');
      q.addData(text); q.make();
      val = { n: q.getModuleCount(), dark: function (r, c) { return q.isDark(r, c); } };
    } catch (e) { val = { error: true }; }
    qrMemo = { key: text, val: val };
    return val;
  }
  /* two modules of white inside the box; the page around it supplies the rest of the quiet zone */
  function drawQR(ctx, m, x, y, size, color) {
    var ms = size / (m.n + 4);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, size, size);
    ctx.fillStyle = color;
    for (var r = 0; r < m.n; r++) {
      for (var c = 0; c < m.n; c++) {
        if (!m.dark(r, c)) continue;
        var x0 = Math.round(x + (c + 2) * ms), y0 = Math.round(y + (r + 2) * ms);
        ctx.fillRect(x0, y0, Math.round(x + (c + 3) * ms) - x0, Math.round(y + (r + 3) * ms) - y0);
      }
    }
  }

  /* ---------- Canvas text helpers ---------- */
  var HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  function fnt(w, s, fam) { return w + ' ' + s + 'px ' + (fam || FONT); }
  function setFont(ctx, f, ls) { ctx.font = f; if (HAS_LS) ctx.letterSpacing = (ls || 0) + 'px'; }
  function manual(ls) { return !HAS_LS && Math.abs(ls || 0) >= 1.5; }
  /* visual width: without the spacing a browser adds after the last letter */
  function tw(ctx, text, ls) {
    if (!manual(ls)) return ctx.measureText(text).width - (HAS_LS && text ? (ls || 0) : 0);
    var w = 0; for (var i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + (i < text.length - 1 ? ls : 0); return w;
  }
  function put(ctx, text, x, y, ls) {
    if (!manual(ls)) { ctx.fillText(text, x, y); return; }
    for (var i = 0; i < text.length; i++) { ctx.fillText(text[i], x, y); x += ctx.measureText(text[i]).width + ls; }
  }
  function putR(ctx, text, xr, y, ls) { put(ctx, text, xr - tw(ctx, text, ls), y, ls); }
  function putC(ctx, text, xc, y, ls) { put(ctx, text, xc - tw(ctx, text, ls) / 2, y, ls); }
  function baseline(ctx, size, top, lh) {
    var m = ctx.measureText('Hg');
    var a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
    if (!(a > 0) || !(d > 0)) { a = size * 1.0; d = size * 0.27; }
    return top + (lh - (a + d)) / 2 + a;
  }
  /* "2026 - 2027" stays on one line; a line never starts with a dash */
  function wrap(ctx, text, maxW) {
    var words = bindDashes(String(text || '').trim()).split(/[ \t\r\n]+/).filter(Boolean), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(test).width <= maxW) cur = test; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    var out = [];
    lines.forEach(function (l) {
      if (ctx.measureText(l).width <= maxW) { out.push(l); return; }
      var part = '';
      Array.from(l).forEach(function (ch) { if (part && ctx.measureText(part + ch).width > maxW) { out.push(part); part = ch; } else part += ch; });
      if (part) out.push(part);
    });
    return out;
  }
  /* addresses break after a comma when they can: "Phòng [số phòng]," / "khu A2" */
  function wrapPhrases(ctx, text, maxW) {
    var parts = String(text || '').trim().split(/,\s*/).filter(Boolean), lines = [], cur = '';
    parts.forEach(function (p, i) {
      var piece = p + (i < parts.length - 1 ? ',' : '');
      if (ctx.measureText(piece).width > maxW) {
        if (cur) lines.push(cur);
        var w = wrap(ctx, piece, maxW); cur = w.pop(); lines = lines.concat(w);
        return;
      }
      var test = cur ? cur + ' ' + piece : piece;
      if (!cur || ctx.measureText(test).width <= maxW) cur = test; else { lines.push(cur); cur = piece; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function ellipsize(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    var s = text; while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s.trim() + '…';
  }
  function contain(ctx, im, x, y, w, h, ax, ay) {
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    var s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
    ctx.drawImage(im, x + (w - dw) * ax, y + (h - dh) * ay, dw, dh);
  }
  /* biggest size (down to min) at which one line fits maxW */
  function fitSize(ctx, text, weight, max, min, maxW, fam) {
    for (var s = max; s > min; s -= 1) { setFont(ctx, fnt(weight, s, fam), 0); if (ctx.measureText(text).width <= maxW) return s; }
    return min;
  }
  function smallLabel(ctx, text, x, y, color) {
    setFont(ctx, fnt(700, 12), 2.6); ctx.fillStyle = color;
    put(ctx, text, x, y, 2.6);
    return tw(ctx, text, 2.6);
  }
  function section(ctx, t, x0, x1, y) {
    setFont(ctx, fnt(700, 13), 3.4); ctx.fillStyle = t.ink;
    put(ctx, 'CHƯƠNG TRÌNH', x0, y, 3.4);
    var sx = x0 + tw(ctx, 'CHƯƠNG TRÌNH', 3.4) + 16;
    ctx.fillRect(sx, y - 5, x1 - sx, 1);
  }
  function timeText(st) { return st.gioBD ? (st.gioKT ? st.gioBD + ' – ' + st.gioKT : st.gioBD) : ''; }
  function placeParts(st) { return [st.dd1, st.dd2].map(function (x) { return (x || '').trim(); }).filter(Boolean); }

  /* ---------- Programme rows (both posters) ---------- */
  /* under each title: "ThS. BSCK I. Nguyễn Văn A – Cố vấn"; the name in the accent colour, the role after it quieter */
  function whoParts(r) {
    var name = (r.who || '').replace(/\s+/g, ' ').trim(), org = ORGS.indexOf(r.org) >= 0 ? r.org : '', label = orgText(org, !!name);
    var full = bindDashes(name && label ? name + ' – ' + label : (name || label));
    return { text: full, nameLen: name && label ? name.length : full.length, grp: THEMES[org] ? org : null };
  }
  function rowsLayout(ctx, rows, s, o) {
    var cw = o.right - o.tx, out = [], total = 0;
    rows.forEach(function (r) {
      var wp = whoParts(r), whoLines = [], room = cw - (wp.grp ? 34 * s : 22 * s);
      if (wp.text) {
        setFont(ctx, fnt(600, 19 * s), 0.2 * s);
        whoLines = wrap(ctx, wp.text, room);
        if (whoLines.length > 2) whoLines = [whoLines[0], ellipsize(ctx, whoLines.slice(1).join(' '), room)];
      }
      var brk = isBreak(r.title);
      setFont(ctx, brk ? fnt('italic 400', 29 * s, SERIF) : fnt(600, 29 * s, SERIF), 0);
      var R = { r: r, lines: wrap(ctx, r.title, cw), wp: wp, whoLines: whoLines, brk: brk, pad: o.pad * s };
      var bh = Math.max(1, R.lines.length) * 36 * s + (whoLines.length ? 8 * s + whoLines.length * 26 * s : 0);
      R.h = Math.max(o.stackTime ? 58 * s : 36 * s, bh) + 2 * R.pad;
      out.push(R);
      total += R.h;
    });
    return { rows: out, total: total };
  }
  function fitRows(ctx, st, o) {
    var rows = st.rows.filter(function (r) { return (r.title || '').trim() || r.t1; });
    if (!rows.length) return null;
    /* a story has room to spare: its rows may grow up to 120% before anything shrinks */
    var avail = o.bottom - o.top, L = null, scale = 1, scales = [];
    for (var v = Math.round((o.maxScale || 1) * 100); v >= 70; v -= 5) scales.push(v / 100);
    for (var si = 0; si < scales.length; si++) {
      L = rowsLayout(ctx, rows, scales[si], o); scale = scales[si];
      if (L.total <= avail) break;
    }
    return { L: L, scale: scale, overflow: L.total > avail, count: rows.length };
  }
  function paintWho(ctx, t, R, x, wy, s) {
    var cursor = 0, ls = 0.2 * s;
    R.whoLines.forEach(function (ln, k) {
      var start = R.wp.text.indexOf(ln, cursor);
      if (start < 0) start = cursor;
      cursor = start + ln.length;
      var cut = Math.max(0, Math.min(ln.length, R.wp.nameLen - start)), a = ln.slice(0, cut), b = ln.slice(cut);
      setFont(ctx, fnt(600, 19 * s), ls);
      var by = baseline(ctx, 19 * s, wy + k * 26 * s, 26 * s);
      ctx.fillStyle = t.acc; put(ctx, a, x, by, ls);
      if (b) {
        var aw = a ? tw(ctx, a, ls) + ls : 0;
        setFont(ctx, fnt(500, 19 * s), ls); ctx.fillStyle = MUTED; put(ctx, b, x + aw, by, ls);
      }
    });
  }
  function paintRows(ctx, t, F, o) {
    var s = F.scale, y = o.top, stop = false;
    F.L.rows.forEach(function (R) {
      if (stop || y + R.h > o.bottom + 0.5) { stop = true; return; } /* only whole items */
      var r = R.r, top = y + R.pad;
      setFont(ctx, fnt(600, 29 * s, SERIF), 0);
      var base = baseline(ctx, 29 * s, top, 36 * s);
      if (o.stackTime) {
        setFont(ctx, fnt(600, 24 * s, MONO), 0); ctx.fillStyle = r.t1 ? t.ink : MUTED;
        put(ctx, r.t1 || '--:--', o.x, base, 0);
        if (r.t2) { setFont(ctx, fnt(500, 16 * s, MONO), 0); ctx.fillStyle = MUTED; put(ctx, r.t2, o.x, base + 25 * s, 0); }
      } else {
        setFont(ctx, fnt(500, 22 * s, MONO), 0); ctx.fillStyle = r.t1 ? t.ink : MUTED;
        put(ctx, (r.t1 || '--:--') + (r.t2 ? ' – ' + r.t2 : ''), o.x, base, 0);
      }
      setFont(ctx, R.brk ? fnt('italic 400', 29 * s, SERIF) : fnt(600, 29 * s, SERIF), 0);
      ctx.fillStyle = R.brk ? MUTED : TEXT;
      R.lines.forEach(function (ln, k) { put(ctx, ln, o.tx, base + k * 36 * s, 0); });
      if (R.whoLines.length) {
        var wy = top + Math.max(1, R.lines.length) * 36 * s + 8 * s, x = o.tx;
        var ic = R.wp.grp ? inked(R.wp.grp, 'icon', t.ink) : null;
        if (ic) { contain(ctx, ic, o.tx, wy, 26 * s, 26 * s, 0.5, 0.5); x += 34 * s; }
        else { ctx.fillStyle = t.acc; ctx.fillRect(o.tx, wy + 13 * s, 14 * s, 1.5 * s); x += 22 * s; }
        paintWho(ctx, t, R, x, wy, s);
      }
      y += R.h;
      ctx.fillStyle = LINE; ctx.fillRect(o.x, Math.round(y) - 1, o.right - o.x, 1);
    });
  }
  function drawRows(ctx, st, t, o) {
    var F = fitRows(ctx, st, o);
    if (!F) return { scale: 1, overflow: false, count: 0 };
    paintRows(ctx, t, F, o);
    return { scale: F.scale, overflow: F.overflow, count: F.count };
  }
  function roles(ctx, st, cols, yl, yv, max, cut) {
    [['CHỦ TRÌ', st.chuTri], ['ĐIỀU HÀNH', st.dieuHanh]].forEach(function (p, i) {
      var x = cols[i][0], maxW = cols[i][1];
      smallLabel(ctx, p[0], x, yl, MUTED);
      var txt = (p[1] || '').trim();
      if (!txt) return;
      var size = fitSize(ctx, txt, 600, max, 18, maxW);
      setFont(ctx, fnt(600, size), 0);
      if (ctx.measureText(txt).width > maxW) cut.names = true;
      ctx.fillStyle = TEXT; put(ctx, ellipsize(ctx, txt, maxW), x, yv, 0);
    });
  }
  function qrCaption(st) { return (st.qrNote || '').replace(/\s+/g, ' ').trim(); }

  /* ---------- Poster A: weekly schedule, white paper ---------- */
  var M = 72, R_EDGE = W - 72, QR_A = 136;
  function medal(ctx, t, key, cx, cy) {
    ctx.save();
    ctx.strokeStyle = t.acc; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = t.tint; ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = t.ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 49, 0, Math.PI * 2); ctx.clip();
    var src = inked(key, 'dark', t.ink) || imgs[key];
    if (src) contain(ctx, src, cx - 43, cy - 40, 86, 86, 0.5, 0.5);
    ctx.restore();
  }
  function drawA(ctx, st, key, F) {
    var t = THEMES[key], cut = {}, oy = F.oy, fy = F.fy, H = F.H;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    var wm = inked(key, 'dark', t.ink);
    if (wm) { var ww = 700, wh = ww * wm.height / wm.width; ctx.globalAlpha = 0.06; ctx.drawImage(wm, 530, 1200 + fy - wh, ww, wh); ctx.globalAlpha = 1; }
    ctx.fillStyle = t.ink; ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10);

    if (imgs.logo) contain(ctx, imgs.logo, M, 62 + oy, 74, 79, 0.5, 0.5);
    setFont(ctx, fnt(700, 15), 3); ctx.fillStyle = t.ink; put(ctx, CLUB, 164, 97 + oy, 3);
    setFont(ctx, fnt(500, 15), 0); ctx.fillStyle = MUTED; put(ctx, SCHOOL, 164, 121 + oy, 0);
    medal(ctx, t, key, 958, 102 + oy);
    setFont(ctx, fnt(700, 12), 2.6); ctx.fillStyle = MUTED; putR(ctx, 'NHÓM TRỰC', 886, 91 + oy, 2.6);
    var ns = fitSize(ctx, t.name, 600, 30, 20, 250, SERIF);
    setFont(ctx, fnt(600, ns, SERIF), 0); ctx.fillStyle = t.ink; putR(ctx, t.name, 886, 127 + oy, 0);
    ctx.fillStyle = t.ink; ctx.fillRect(M, 172 + oy, R_EDGE - M, 1);

    var yr = schoolYear(st.ngay);
    if (yr) { setFont(ctx, fnt(700, 15), 4.5); ctx.fillStyle = t.acc; put(ctx, 'NĂM HỌC ' + yr, M, 222 + oy, 4.5); }
    var ts = fitSize(ctx, WEEK_TITLE, 600, 92, 60, R_EDGE - M + 4, SERIF);
    setFont(ctx, fnt(600, ts, SERIF), -1); ctx.fillStyle = t.ink; put(ctx, WEEK_TITLE, M - 4, 314 + oy, -1);

    /* date, time and place; with a QR code the right end of this block holds it */
    var qm = qrMatrix(qrText(st)), hasQR = !!(qm && !qm.error);
    var top = 368 + oy, d = parseDate(st.ngay), tt = timeText(st), gx = hasQR ? R_EDGE - QR_A - 20 : R_EDGE;
    ctx.fillStyle = LINE; ctx.fillRect(M, top, R_EDGE - M, 1); ctx.fillRect(540, top, 1, 88); ctx.fillRect(M, top + 88, gx - M, 1);
    smallLabel(ctx, 'NGÀY', M, top + 30, MUTED);
    setFont(ctx, fnt(600, 25), 0); ctx.fillStyle = d ? TEXT : MUTED;
    put(ctx, d ? weekday(st.ngay) + ', ' + dmy(st.ngay) : 'Chưa chọn ngày', M, top + 67, 0);
    smallLabel(ctx, 'THỜI GIAN', 568, top + 30, MUTED);
    setFont(ctx, fnt(500, 25, MONO), 0); ctx.fillStyle = tt ? TEXT : MUTED; put(ctx, tt || '—', 568, top + 67, 0);
    var ptop = top + 88, place = placeParts(st).join(', '), pw = gx - M - (hasQR ? 12 : 0), size = 25, lines = [];
    smallLabel(ctx, 'ĐỊA ĐIỂM', M, ptop + 30, MUTED);
    for (size = 25; size >= 22; size -= 1) { setFont(ctx, fnt(600, size), 0); if (ctx.measureText(place).width <= pw) break; }
    if (size < 22) {
      for (size = 25; size >= 21; size -= 1) { setFont(ctx, fnt(600, size), 0); lines = wrapPhrases(ctx, place, pw); if (lines.length <= 2) break; }
      size = Math.max(size, 21); setFont(ctx, fnt(600, size), 0);
      if (lines.length > 2) { lines = [lines[0], ellipsize(ctx, lines.slice(1).join(' '), pw)]; cut.place = true; }
    } else lines = place ? [place] : [];
    ctx.fillStyle = TEXT;
    if (!lines.length) { ctx.fillStyle = MUTED; lines = ['—']; }
    lines.forEach(function (ln, k) { put(ctx, ln, M, ptop + 67 + k * 34, 0); });
    var factsBottom = ptop + 88 + (lines.length - 1) * 34;
    ctx.fillStyle = LINE; ctx.fillRect(M, factsBottom, R_EDGE - M, 1);
    if (hasQR) {
      ctx.fillRect(gx, top, 1, factsBottom - top);
      drawQR(ctx, qm, R_EDGE - QR_A, top + 12, QR_A, t.ink);
      var note = upper(qrCaption(st) || 'Quét mã QR'), nsz = 12;
      setFont(ctx, fnt(700, nsz), 1.6);
      while (tw(ctx, note, 1.6) > QR_A + 16 && nsz > 9) { nsz -= 1; setFont(ctx, fnt(700, nsz), 1.6); }
      ctx.fillStyle = MUTED; putC(ctx, ellipsize(ctx, note, QR_A + 16), R_EDGE - QR_A / 2, top + 168, 1.6);
    }

    var secY = factsBottom + 75;
    section(ctx, t, M, R_EDGE, secY);
    var lay = drawRows(ctx, st, t, { x: M, tx: M + 228, right: R_EDGE, top: secY + 8, bottom: 1186 + fy, stackTime: false, pad: 20, maxScale: F.rowMax });

    ctx.fillStyle = t.ink; ctx.fillRect(M, 1200 + fy, R_EDGE - M, 1);
    roles(ctx, st, [[M, 436], [540, 468]], 1229 + fy, 1264 + fy, 23, cut);
    setFont(ctx, fnt(500, 14), 0); ctx.fillStyle = MUTED; put(ctx, CREDIT, M, 1306 + fy, 0);
    lay.placeCut = !!cut.place; lay.nameCut = !!cut.names;
    return lay;
  }

  /* ---------- Poster C: special programme, group column on the left ---------- */
  var CW = 330, X0 = 390, X1 = 1016, QR_C = 150;
  function drawC(ctx, st, key, F) {
    var t = THEMES[key], cut = {}, oy = F.oy, fy = F.fy, H = F.H;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = t.col; ctx.fillRect(0, 0, CW, H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var x = 22; x < CW; x += 22) ctx.fillRect(x, 0, 1, H);

    ctx.save(); ctx.translate(58, 452 + oy); ctx.rotate(-Math.PI / 2);
    setFont(ctx, fnt(700, 15), 6.3); ctx.fillStyle = t.colAcc; put(ctx, 'CHƯƠNG TRÌNH ĐẶC BIỆT', 0, 0, 6.3);
    ctx.restore();

    var d = parseDate(st.ngay);
    setFont(ctx, fnt(600, 150, SERIF), -3); ctx.fillStyle = d ? '#FFFFFF' : 'rgba(255,255,255,0.35)';
    put(ctx, d ? pad2(d.getDate()) : '––', 96, 190 + oy, -3);
    put(ctx, d ? pad2(d.getMonth() + 1) : '––', 96, 325 + oy, -3);
    var wd = d ? upper(weekday(st.ngay)) : 'CHƯA CHỌN NGÀY', wsz = 22;
    setFont(ctx, fnt(600, wsz), 2.6);
    while (tw(ctx, wd, 2.6) > CW - 120 && wsz > 14) { wsz -= 1; setFont(ctx, fnt(600, wsz), 2.6); }
    ctx.fillStyle = t.colAcc; put(ctx, wd, 100, 390 + oy, 2.6);
    if (d) { setFont(ctx, fnt(500, 26, MONO), 1); ctx.fillStyle = 'rgba(255,255,255,0.75)'; put(ctx, String(d.getFullYear()), 100, 432 + oy, 1); }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(36, 470 + oy, CW - 72, 1);

    var tt = timeText(st);
    smallLabel(ctx, 'THỜI GIAN', 36, 504 + oy, t.colAcc);
    setFont(ctx, fnt(600, 21, MONO), 0); ctx.fillStyle = '#FFFFFF'; put(ctx, tt || '—', 36, 533 + oy, 0);
    smallLabel(ctx, 'ĐỊA ĐIỂM', 36, 572 + oy, t.colAcc);
    var parts = placeParts(st), pw = CW - 72, size = 21, lines = [];
    for (size = 21; size >= 18; size -= 1) {
      setFont(ctx, fnt(600, size), 0); lines = [];
      parts.forEach(function (p) { lines = lines.concat(wrapPhrases(ctx, p, pw)); });
      if (lines.length <= 3) break;
    }
    size = Math.max(size, 18); setFont(ctx, fnt(600, size), 0);
    if (lines.length > 3) { lines = [lines[0], lines[1], ellipsize(ctx, lines.slice(2).join(' '), pw)]; cut.place = true; }
    if (!lines.length) lines = ['—'];
    ctx.fillStyle = '#FFFFFF';
    lines.forEach(function (ln, k) { put(ctx, ln, 36, 601 + oy + k * 28, 0); });
    var placeBottom = 601 + oy + (lines.length - 1) * 28;

    /* mascot as white ink, standing on the duty line */
    var wi = inked(key, 'white') || imgs[key];
    if (wi) {
      var iw = wi.naturalWidth || wi.width, ih = wi.naturalHeight || wi.height, room = 1200 + fy - (placeBottom + 56), mw = 390, mh = mw * ih / iw;
      if (mh > room) { mh = room; mw = mh * iw / ih; }
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, CW, H); ctx.clip();
      ctx.globalAlpha = 0.92; ctx.drawImage(wi, (CW - mw) / 2, 1200 + fy - mh, mw, mh);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(36, 1219 + fy, CW - 72, 1);
    smallLabel(ctx, 'NHÓM TRỰC', 36, 1247 + fy, t.colAcc);
    var ns = fitSize(ctx, t.name, 600, 34, 22, CW - 72, SERIF);
    setFont(ctx, fnt(600, ns, SERIF), 0); ctx.fillStyle = '#FFFFFF'; put(ctx, t.name, 36, 1287 + fy, 0);

    /* main column */
    if (imgs.logo) contain(ctx, imgs.logo, X0, 58 + oy, 68, 72, 0.5, 0.5);
    setFont(ctx, fnt(700, 14), 2.5); ctx.fillStyle = t.ink; put(ctx, CLUB, 474, 89 + oy, 2.5);
    setFont(ctx, fnt(500, 14), 0); ctx.fillStyle = MUTED; put(ctx, SCHOOL, 474, 111 + oy, 0);

    var qm = qrMatrix(qrText(st)), hasQR = !!(qm && !qm.error), qrTop = 1176 + fy - QR_C;
    var BOTTOM = hasQR ? qrTop - 28 : 1176 + fy;
    var raw = (st.tenCT || '').trim(), title = raw || 'Tên chương trình', MW = X1 - X0 + 4, tlines = [], tsz;
    var hasRows = st.rows.some(function (r) { return (r.title || '').trim() || r.t1; }), desc = (st.moTa || '').trim(), maxLines = hasRows || desc ? 3 : 5;
    for (tsz = F.titleMax; tsz >= 44; tsz -= 4) {
      setFont(ctx, fnt(600, tsz, SERIF), -0.8); tlines = wrap(ctx, title, MW);
      if (tlines.length <= (tsz >= 76 ? 2 : tsz >= 60 ? 3 : maxLines)) break;
    }
    tsz = Math.max(tsz, 44); setFont(ctx, fnt(600, tsz, SERIF), -0.8); tlines = wrap(ctx, title, MW);
    if (tlines.length > maxLines) { tlines = tlines.slice(0, maxLines - 1).concat([ellipsize(ctx, tlines.slice(maxLines - 1).join(' '), MW)]); cut.title = true; }
    var tlh = Math.round(tsz * 1.06), tb = 176 + oy + Math.round(tsz * 0.82), tLast = tb + (tlines.length - 1) * tlh;
    var yr = schoolYear(st.ngay), sub = (st.phuCT || '').trim() || (yr ? 'Năm học ' + yr : ''), sl = [];
    if (sub) {
      setFont(ctx, fnt('italic 400', 27, SERIF), 0);
      sl = wrap(ctx, sub, X1 - X0);
      if (sl.length > 2) { sl = [sl[0], ellipsize(ctx, sl.slice(1).join(' '), X1 - X0)]; cut.sub = true; }
    }
    var subLast = sl.length ? tLast + 54 + (sl.length - 1) * 36 : tLast, dl = [];
    if (desc) {
      setFont(ctx, fnt(500, 23), 0);
      desc.split(/\n+/).forEach(function (p) { if (p.trim()) dl = dl.concat(wrap(ctx, p.trim(), X1 - X0)); });
      if (dl.length > 6) { dl = dl.slice(0, 5).concat([ellipsize(ctx, dl.slice(5).join(' '), X1 - X0)]); cut.desc = true; }
    }
    var descFirst = subLast + (sl.length ? 56 : 64), descLast = dl.length ? descFirst + (dl.length - 1) * 35 : subLast;
    var secY = descLast + 72;
    var rowsBox = { x: X0, tx: X0 + 132, right: X1, top: secY + 8, bottom: BOTTOM, stackTime: true, pad: 22, maxScale: F.rowMax };
    var Fr = hasRows ? fitRows(ctx, st, rowsBox) : null;
    /* short content sits a little above the middle of the free space instead of leaving a hole under it */
    var blockEnd = Fr ? Math.min(BOTTOM, rowsBox.top + Fr.L.total) : descLast + 16, off = Math.max(0, Math.round((BOTTOM - blockEnd) * 0.42));
    setFont(ctx, fnt(600, tsz, SERIF), -0.8); ctx.fillStyle = raw ? t.ink : '#B9C0CA';
    tlines.forEach(function (ln, k) { put(ctx, ln, X0 - 4, tb + off + k * tlh, -0.8); });
    if (sl.length) {
      setFont(ctx, fnt('italic 400', 27, SERIF), 0); ctx.fillStyle = MUTED;
      sl.forEach(function (ln, k) { put(ctx, ln, X0, tLast + off + 54 + k * 36, 0); });
    }
    if (dl.length) {
      setFont(ctx, fnt(500, 23), 0); ctx.fillStyle = BODY;
      dl.forEach(function (ln, k) { put(ctx, ln, X0, descFirst + off + k * 35, 0); });
    }
    var lay = { scale: 1, overflow: false, count: 0 };
    if (Fr) {
      section(ctx, t, X0, X1, secY + off);
      rowsBox.top += off;
      paintRows(ctx, t, Fr, rowsBox);
      lay = { scale: Fr.scale, overflow: Fr.overflow, count: Fr.count };
    }
    if (hasQR) {
      drawQR(ctx, qm, X1 - QR_C, qrTop, QR_C, t.ink);
      var note = qrCaption(st), cx = X1 - QR_C - 22;
      setFont(ctx, fnt(700, 12), 2.6); ctx.fillStyle = MUTED;
      putR(ctx, 'QUÉT MÃ QR', cx, qrTop + (note ? 62 : 80), 2.6);
      if (note) {
        var nsz = fitSize(ctx, note, 'italic 400', 26, 18, cx - X0, SERIF);
        setFont(ctx, fnt('italic 400', nsz, SERIF), 0); ctx.fillStyle = t.ink;
        putR(ctx, ellipsize(ctx, note, cx - X0), cx, qrTop + 98, 0);
      }
    }

    ctx.fillStyle = t.ink; ctx.fillRect(X0, 1191 + fy, X1 - X0, 1);
    roles(ctx, st, [[X0, 290], [X0 + 326, 300]], 1220 + fy, 1255 + fy, 22, cut);
    setFont(ctx, fnt(500, 13), 0); ctx.fillStyle = MUTED; put(ctx, CREDIT, X0, 1295 + fy, 0);
    lay.placeCut = !!cut.place; lay.nameCut = !!cut.names; lay.titleCut = !!cut.title; lay.subCut = !!cut.sub; lay.descCut = !!cut.desc;
    return lay;
  }

  function fmt(st) { return FORMATS[st.kho] || FORMATS.post; }
  function drawPoster(ctx, st) {
    var key = THEMES[st.nhom] ? st.nhom : 'seiryu', F = fmt(st);
    ctx.save();
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.clearRect(0, 0, W, F.H);
    var lay = st.mau === 'dacbiet' ? drawC(ctx, st, key, F) : drawA(ctx, st, key, F);
    if (HAS_LS) ctx.letterSpacing = '0px';
    ctx.restore();
    return lay;
  }

  /* ---------- Checks ---------- */
  function checks(st, lay) {
    var out = [];
    function add(level, text, fix) { out.push({ level: level, text: text, fix: fix || null }); }
    var special = st.mau === 'dacbiet';
    if (special && !(st.tenCT || '').trim()) add('err', 'Chưa có tên chương trình.');
    if (!st.ngay) add('err', 'Chưa chọn ngày sinh hoạt.');
    else if (!special && parseDate(st.ngay) && parseDate(st.ngay).getDay() !== 0) add('info', dmy(st.ngay) + ' là ' + weekday(st.ngay).toLowerCase() + ', không phải Chủ nhật.');
    var place = ((st.dd1 || '') + ' ' + (st.dd2 || '')).trim();
    if (!place) add('warn', 'Chưa có địa điểm.');
    else if (/\[[^\]]*\]/.test(place)) add('warn', 'Địa điểm còn chỗ trong ngoặc [ ] chưa điền.');
    else if (/^phòng\s*(,|$)/i.test((st.dd1 || '').trim())) add('warn', 'Chưa có số phòng.');
    var a = toMin(st.gioBD), b = toMin(st.gioKT);
    if (a === null) add('warn', 'Chưa có giờ bắt đầu buổi.');
    if (a !== null && b !== null && b <= a) add('err', 'Giờ kết thúc buổi phải sau giờ bắt đầu.');
    var rows = st.rows, filled = rows.filter(function (r) { return (r.title || '').trim() || r.t1 || r.t2 || (r.who || '').trim() || r.org; });
    if (!filled.length) {
      if (special) add('info', 'Chưa có mục chương trình: ảnh chỉ hiện tên chương trình và thông tin buổi.');
      else add('err', 'Chương trình chưa có mục nào.');
    } else {
      rows.forEach(function (r, i) {
        var n = i + 1, x = toMin(r.t1), y = toMin(r.t2);
        if (!(r.title || '').trim()) add('err', 'Mục ' + n + ' chưa có nội dung.');
        if (x === null) add('err', 'Mục ' + n + ' chưa có giờ bắt đầu.');
        if (x !== null && y !== null && y <= x) add('err', 'Mục ' + n + ': giờ kết thúc phải sau giờ bắt đầu.');
        if (r.org === 'khach' && !(r.who || '').trim()) add('warn', 'Mục ' + n + ': chưa có tên khách mời.');
        if (/\[[^\]]*\]/.test(r.who || '')) add('warn', 'Mục ' + n + ': tên người trình bày còn chỗ [ ] chưa điền.');
      });
      var sorted = true;
      for (var i = 0; i + 1 < rows.length; i++) {
        var c1 = toMin(rows[i].t1), e1 = toMin(rows[i].t2), c2 = toMin(rows[i + 1].t1);
        if (c1 !== null && c2 !== null && c2 < c1) { sorted = false; continue; }
        if (e1 !== null && c2 !== null) {
          if (c2 < e1) add('warn', 'Mục ' + (i + 1) + ' và ' + (i + 2) + ' chồng giờ: mục ' + (i + 1) + ' kết thúc ' + rows[i].t2 + ', mục ' + (i + 2) + ' bắt đầu ' + rows[i + 1].t1 + '.');
          else if (c2 - e1 >= 20) add('info', 'Trống ' + (c2 - e1) + ' phút (' + rows[i].t2 + '–' + rows[i + 1].t1 + ') giữa mục ' + (i + 1) + ' và ' + (i + 2) + '.', { label: 'Thêm giải lao', act: 'gap', at: i + 1, t1: rows[i].t2, t2: rows[i + 1].t1 });
        }
      }
      if (!sorted) add('warn', 'Các mục chưa theo thứ tự giờ.', { label: 'Xếp theo giờ', act: 'sort' });
      var starts = rows.map(function (r) { return toMin(r.t1); }).filter(function (v) { return v !== null; });
      var ends = rows.map(function (r) { return toMin(r.t2); }).filter(function (v) { return v !== null; });
      if (starts.length && ends.length && a !== null && b !== null) {
        var s0 = Math.min.apply(null, starts), e0 = Math.max.apply(null, ends);
        if (s0 !== a || e0 !== b) add('info', 'Giờ buổi ' + st.gioBD + '–' + st.gioKT + ' khác khung chương trình ' + fromMin(s0) + '–' + fromMin(e0) + '.', { label: 'Lấy theo chương trình', act: 'span', t1: fromMin(s0), t2: fromMin(e0) });
      }
    }
    var qt = qrText(st);
    if (qt) {
      var qm = qrMatrix(qt);
      if (!qm || qm.error) add('err', 'Link quá dài, không tạo được mã QR. Dùng link rút gọn.');
      else if (qm.n >= 45) add('warn', 'Link dài nên mã QR dày, khó quét. Nên dùng link rút gọn.');
      if (qt !== (st.qrLink || '').trim()) add('info', 'Đã thêm https:// vào link của mã QR.');
    }
    if (lay && lay.titleCut) add('warn', 'Tên chương trình dài quá số dòng cho phép, ảnh đã cắt bớt. Nên rút gọn.');
    if (lay && lay.subCut) add('warn', 'Dòng phụ dài quá 2 dòng, ảnh đã cắt bớt.');
    if (lay && lay.descCut) add('warn', 'Mô tả dài quá 6 dòng, ảnh đã cắt bớt. Nên rút gọn.');
    if (lay && lay.placeCut) add('warn', 'Địa điểm quá dài, ảnh đã cắt bớt phần cuối. Nên rút gọn.');
    if (lay && lay.nameCut) add('warn', 'Tên chủ trì hoặc điều hành quá dài, ảnh đã cắt bớt. Nên rút gọn.');
    if (lay && lay.overflow) add('err', 'Chương trình quá dài, phần cuối bị cắt. Bớt mục, rút gọn nội dung hoặc chuyển sang khổ story.');
    else if (lay && lay.scale < 1) add('info', 'Chương trình dài, chữ đã thu nhỏ còn ' + Math.round(lay.scale * 100) + '%.');
    if (!(st.chuTri || '').trim()) add('warn', 'Chưa có tên người chủ trì.');
    else if (/\[[^\]]*\]/.test(st.chuTri)) add('warn', 'Tên người chủ trì còn chỗ [ ] chưa điền.');
    if (!(st.dieuHanh || '').trim()) add('warn', 'Chưa có tên người điều hành.');
    else if (/\[[^\]]*\]/.test(st.dieuHanh)) add('warn', 'Tên người điều hành còn chỗ [ ] chưa điền.');
    return out;
  }
  var XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  /* --- a small .xlsx writer: a zip (stored, no compression) of a few XML parts --- */
  var CRC_TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipBlob(files, type) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
      c.setUint32(38, 0, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (s, p) { return s + p.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(4, 0, true); e.setUint16(6, 0, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, size, true); e.setUint32(16, offset, true); e.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: type });
  }
  var CTRL = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(8) + String.fromCharCode(11) + String.fromCharCode(12) + String.fromCharCode(14) + '-' + String.fromCharCode(31) + ']', 'g');
  function xesc(s) { return String(s == null ? '' : s).replace(CTRL, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function xlDay(d) { return (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000; }
  /* one cell: text, or { n: number, s: style } for dates, times and counts */
  function xlCell(ref, v, style) {
    if (v == null || v === '') return '';
    if (typeof v === 'object') return '<c r="' + ref + '" s="' + v.s + '"><v>' + v.n + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr" s="' + style + '"><is><t xml:space="preserve">' + xesc(v) + '</t></is></c>';
  }
  function xlSheet(cols, rows, frozen, landscape) {
    var view = frozen ? '<sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView>' : '<sheetView workbookViewId="0"/>';
    var body = rows.map(function (r, i) {
      var cells = r.cells.map(function (v, j) { return xlCell('ABCDEFGH'[j] + (i + 1), v, r.styles[j]); }).join('');
      return '<row r="' + (i + 1) + '">' + cells + '</row>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews>' + view + '</sheetViews><sheetFormatPr defaultRowHeight="15"/>' +
      '<cols>' + cols.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>' +
      '<sheetData>' + body + '</sheetData>' +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
      '<pageSetup paperSize="9" orientation="' + (landscape ? 'landscape' : 'portrait') + '" fitToWidth="1" fitToHeight="0"/></worksheet>';
  }
  /* styles: 0 normal · 1 title · 2 bold label · 3 wrapped text · 4 header · 5 date · 6 time · 7 date + time · 8 number · 9 centred */
  var XL_STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="hh:mm"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/></numFmts>' +
    '<fonts count="3"><font><sz val="11"/><name val="Arial"/><family val="2"/></font><font><b/><sz val="11"/><name val="Arial"/><family val="2"/></font>' +
    '<font><b/><sz val="14"/><color rgb="FF0F2E5C"/><name val="Arial"/><family val="2"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left/><right/><top/><bottom style="thin"><color rgb="FF9AA7B8"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="10">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>' +
    '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  function xlWorkbook(sheets) {
    var R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', P = 'http://schemas.openxmlformats.org/package/2006/relationships';
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + P + '">' +
        '<Relationship Id="rId1" Type="' + R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + R + '">' +
        '<bookViews><workbookView/></bookViews><sheets>' +
        sheets.map(function (s, i) { return '<sheet name="' + xesc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + P + '">' +
        sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="' + R + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="' + R + '/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: XL_STYLES }
    ].concat(sheets.map(function (s, i) { return { name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: s.xml }; }));
    return zipBlob(files, XLSX_MIME);
  }

  /* --- what goes into the file, the e-mail and the club's log --- */
  function itemsOf(st) {
    return st.rows.filter(function (r) { return (r.title || '').trim() || r.t1; }).map(function (r, i) {
      var a = toMin(r.t1), b = toMin(r.t2);
      return { stt: i + 1, bd: r.t1 || '', kt: r.t2 || '', phut: a !== null && b !== null && b > a ? b - a : '', noiDung: (r.title || '').trim(),
        nguoi: (r.who || '').replace(/\s+/g, ' ').trim(), thuoc: orgText(ORGS.indexOf(r.org) >= 0 ? r.org : '', true) };
    });
  }
  function summaryOf(st, items) {
    var special = st.mau === 'dacbiet';
    return { loai: special ? 'Chương trình đặc biệt' : 'Lịch sinh hoạt tuần', ten: special ? (st.tenCT || '').trim() : WEEK_TITLE,
      phu: special ? (st.phuCT || '').trim() : '', moTa: special ? (st.moTa || '').trim() : '', namHoc: schoolYear(st.ngay),
      ngay: dmy(st.ngay), ngayISO: st.ngay || '', thu: weekday(st.ngay), gio: timeText(st), nhom: THEMES[st.nhom].name,
      diaDiem: placeParts(st).join(', '), chuTri: (st.chuTri || '').trim(), dieuHanh: (st.dieuHanh || '').trim(), soMuc: items.length, qr: qrText(st) };
  }
  function xlTime(t) { var m = toMin(t); return m === null ? (t || '') : { n: m / 1440, s: 6 }; }
  function buildXlsx(st, email, when) {
    var items = itemsOf(st), s = summaryOf(st, items), d = parseDate(st.ngay);
    var info = [
      ['Loại lịch', s.loai], ['Tên chương trình', s.ten], ['Dòng phụ', s.phu], ['Mô tả', s.moTa], ['Năm học', s.namHoc],
      ['Ngày', d ? { n: xlDay(d), s: 5 } : ''], ['Thứ', s.thu], ['Giờ bắt đầu', xlTime(st.gioBD)], ['Giờ kết thúc', xlTime(st.gioKT)],
      ['Địa điểm', s.diaDiem], ['Nhóm trực', s.nhom], ['Chủ trì', s.chuTri], ['Điều hành', s.dieuHanh],
      ['Số mục chương trình', { n: items.length, s: 8 }], ['Link mã QR', s.qr], ['Người làm lịch', email],
      ['Thời điểm xác nhận', { n: xlDay(when) + (when.getHours() * 60 + when.getMinutes()) / 1440, s: 7 }]
    ].filter(function (r) { return !(r[0] === 'Dòng phụ' || r[0] === 'Mô tả') || r[1]; });
    var sheet1 = [{ cells: ['Thông tin buổi sinh hoạt · CLB Ngoại Khoa Trưng Vương'], styles: [1] }, { cells: [], styles: [] }]
      .concat(info.map(function (r) { return { cells: r, styles: [2, 3] }; }));
    var sheet2 = [{ cells: ['STT', 'Bắt đầu', 'Kết thúc', 'Thời lượng (phút)', 'Nội dung', 'Chức danh – họ tên', 'Nhóm / vai trò'], styles: [4, 4, 4, 4, 4, 4, 4] }]
      .concat(items.map(function (it) {
        return { cells: [{ n: it.stt, s: 9 }, xlTime(it.bd), xlTime(it.kt), it.phut === '' ? '' : { n: it.phut, s: 8 }, it.noiDung, it.nguoi, it.thuoc], styles: [9, 6, 6, 8, 3, 3, 3] };
      }));
    return {
      blob: xlWorkbook([{ name: 'Buổi sinh hoạt', xml: xlSheet([26, 72], sheet1, false) }, { name: 'Chương trình', xml: xlSheet([6, 10, 10, 12, 50, 34, 20], sheet2, true, true) }]),
      items: items, summary: s
    };
  }

const LINK_CHU = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,600;1,8..60,400&display=swap';
let daNap = null;
/** Nạp phông chữ của ảnh và các hình mascot, chỉ khi mở tới phần lịch. */
function napTaiNguyen() {
  if (daNap) return daNap;
  if (!document.querySelector('link[data-chu-lich]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = LINK_CHU; l.setAttribute('data-chu-lich', '');
    document.head.append(l);
  }
  daNap = Promise.all([loadFonts(), loadImg('logo', 'img/logo.webp')].concat(GROUPS.map(function (g) { return loadImg(g, 'img/' + g + '.webp'); })))
    .then(function () { inkCache = {}; });
  return daNap;
}
function tenTep(st) {
  var d = st.ngay || 'chua-co-ngay', name = slug(THEMES[st.nhom].name) || st.nhom;
  var head = st.mau === 'dacbiet' ? (slug(st.tenCT) || 'Chuong-trinh-dac-biet') : 'Lich-sinh-hoat-tuan';
  return head + '_' + d + '_' + name + (st.kho === 'story' ? '_story' : '');
}
function duLieu(st) {
  return { v: 1, mau: st.mau, kho: st.kho, tenCT: st.tenCT, phuCT: st.phuCT, moTa: st.moTa, qrLink: st.qrLink, qrNote: st.qrNote,
    nhom: st.nhom, ngay: st.ngay, gioBD: st.gioBD, gioKT: st.gioKT, dd1: st.dd1, dd2: st.dd2, chuTri: st.chuTri, dieuHanh: st.dieuHanh,
    rows: st.rows.map(function (r) { return { t1: r.t1, t2: r.t2, title: r.title, who: r.who, org: r.org }; }) };
}
export { GROUPS, THEMES, ORGS, normalize, drawPoster, checks, fmt, weekday, dmy, toMin, parseWho, orgText, rid, nextSunday, sortRowsOf, itemsOf, summaryOf, buildXlsx, napTaiNguyen, tenTep, duLieu };
function sortRowsOf(rows) { rows.sort(function (p, q) { var x = toMin(p.t1), y = toMin(q.t1); if (x === null) return 1; if (y === null) return -1; return x - y; }); }
