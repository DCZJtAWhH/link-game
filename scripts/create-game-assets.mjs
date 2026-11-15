// @ts-nocheck -- Standalone SVG rasterizer uses short numeric vector tuples;
// this development-only art source is not part of the game runtime.
/**
 * Original fruit illustrations and music, created for this project.
 * Run `node scripts/create-game-assets.mjs` with Node 24; no packages required.
 * The small SVG vocabulary below is rasterized at 4x then downsampled to RGBA PNG.
 * SVG path data remains here as the editable source. Generated PNG/WAV files are
 * committed, so building or playing the game never needs this generator.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const art = resolve(root, 'assets/resources/art');
const audio = resolve(root, 'assets/resources/audio');
await mkdir(art, { recursive: true });
await mkdir(audio, { recursive: true });

const leaf = '<path d="M62 29 C64 11 83 11 91 15 C85 29 75 35 62 29 Z" fill="#4A8250"/>';
const stem = '<path d="M63 36 Q61 25 66 17" fill="none" stroke="#70523C" stroke-width="6"/>';
const shine = '<path d="M35 54 Q30 61 31 69" fill="none" stroke="#FFE9D0" stroke-width="5"/>';
const pictures = {
  apple: `${stem}${leaf}<path d="M64 42 C38 23 16 42 20 68 C23 96 44 116 63 107 C84 118 108 91 109 67 C112 38 85 27 64 42 Z" fill="#C83F42"/><path d="M63 43 C47 33 24 45 27 65 C28 83 38 100 51 103 C44 87 44 62 63 43 Z" fill="#E56358"/>${shine}`,
  banana: '<path d="M32 30 C34 69 63 94 101 70 C90 103 59 117 35 95 C15 78 17 47 26 28 Z" fill="#DDA83F"/><path d="M31 27 C38 66 63 83 102 64 L108 67 C99 91 73 108 49 99 C24 91 17 61 25 28 Z" fill="#F1CD55"/><path d="M34 44 C41 76 65 91 90 79" fill="none" stroke="#FFE8A0" stroke-width="5"/><path d="M24 30 L24 20 L32 17 L37 25 L32 31 Z" fill="#6C6340"/><path d="M100 63 L111 59 L115 66 L107 74 Z" fill="#6C6340"/>',
  orange: '<path d="M62 31 Q62 20 71 18" fill="none" stroke="#6A6941" stroke-width="5"/><path d="M67 27 C72 9 91 17 98 26 C86 34 77 35 67 27 Z" fill="#548650"/><circle cx="64" cy="72" r="42" fill="#DF833B"/><ellipse cx="60" cy="68" rx="36" ry="37" fill="#F4A747"/><path d="M35 55 Q30 61 32 68" fill="none" stroke="#FFE3AB" stroke-width="6"/><circle cx="83" cy="76" r="2" fill="#DE823A"/><circle cx="74" cy="91" r="2" fill="#DE823A"/><circle cx="91" cy="63" r="2" fill="#DE823A"/>',
  grapes: '<path d="M63 30 Q64 18 76 16" fill="none" stroke="#6C6342" stroke-width="6"/><path d="M61 28 C46 11 30 20 26 34 C39 42 51 41 61 28 Z" fill="#5F8B52"/><circle cx="47" cy="48" r="19" fill="#7962A2"/><circle cx="77" cy="48" r="19" fill="#9E7BBD"/><circle cx="32" cy="72" r="18" fill="#9575B5"/><circle cx="63" cy="73" r="20" fill="#69518D"/><circle cx="92" cy="72" r="18" fill="#8767A8"/><circle cx="48" cy="96" r="18" fill="#9271B3"/><circle cx="77" cy="96" r="18" fill="#7B5B9F"/><circle cx="63" cy="113" r="12" fill="#9F80BA"/><path d="M39 43 L44 39 M69 41 L74 38 M24 67 L28 64 M54 67 L58 63 M84 66 L88 63 M40 92 L45 89" fill="none" stroke="#D6C2EA" stroke-width="4"/>',
  strawberry: '<path d="M24 46 C12 71 49 112 63 117 C80 110 114 72 105 47 C97 29 80 30 64 37 C46 30 31 30 24 46 Z" fill="#CC4750"/><path d="M31 47 C23 61 41 93 56 106 C42 79 47 55 62 42 C51 37 37 37 31 47 Z" fill="#E46C6C"/><path d="M64 37 L43 24 L46 36 L26 31 L37 46 L20 46 L46 53 L62 43 L79 54 L106 45 L88 42 L99 29 L79 34 L82 23 Z" fill="#527F4F"/><path d="M42 64 L44 68 M62 61 L64 65 M83 61 L85 65 M52 82 L54 86 M75 80 L77 84 M64 99 L66 102" fill="none" stroke="#FFE2A1" stroke-width="4"/>',
  watermelon: '<path d="M13 47 L114 47 C113 84 96 113 64 114 C34 113 15 86 13 47 Z" fill="#4F8554"/><path d="M20 48 L107 48 C105 79 91 105 64 106 C38 105 22 80 20 48 Z" fill="#DAE7A2"/><path d="M25 48 L102 48 C101 76 87 99 64 100 C42 98 27 77 25 48 Z" fill="#E46D68"/><path d="M39 59 L42 66 M60 62 L60 69 M82 59 L79 66 M51 80 L53 87 M77 80 L75 87" fill="none" stroke="#664D40" stroke-width="5"/>',
  pineapple: '<path d="M58 40 L38 8 L57 18 L66 3 L73 22 L95 11 L85 41 Z" fill="#527E49"/><path d="M62 42 L50 19 L68 31 L83 20 L79 44 Z" fill="#76A45A"/><path d="M64 35 C88 35 104 58 100 86 C97 112 84 121 64 122 C43 121 28 109 27 84 C24 57 40 35 64 35 Z" fill="#DAAC4B"/><path d="M64 39 C45 46 32 71 35 89 C36 103 40 109 49 114 C42 93 47 63 64 39 Z" fill="#ECC96A"/><path d="M41 49 L96 87 M31 68 L88 110 M30 88 L68 118 M85 49 L32 88 M96 65 L45 115 M99 84 L64 120" fill="none" stroke="#BB8E39" stroke-width="2.5"/>',
  pear: `${stem}${leaf}<path d="M63 33 C78 33 79 52 83 60 C90 73 107 83 102 101 C97 119 32 122 25 103 C19 85 34 75 43 60 C49 50 46 34 63 33 Z" fill="#9CAC4B"/><path d="M60 38 C46 44 53 59 42 74 C30 91 30 101 40 108 C47 112 53 112 57 112 C44 96 56 78 57 64 C60 53 65 44 60 38 Z" fill="#C6CE74"/><path d="M37 86 Q32 94 37 100" fill="none" stroke="#E6E7AE" stroke-width="5"/>`,
  peach: '<path d="M65 33 Q62 23 70 16" fill="none" stroke="#775C44" stroke-width="5"/><path d="M65 29 C77 11 94 17 104 29 C89 40 78 40 65 29 Z" fill="#5D8D54"/><path d="M63 42 C43 27 18 43 19 70 C20 97 42 113 64 118 C88 113 111 95 110 67 C109 43 82 29 63 42 Z" fill="#DE8B7D"/><path d="M62 43 C49 35 27 45 26 66 C23 84 36 102 52 108 C42 85 48 59 62 43 Z" fill="#F0B7A0"/><path d="M64 47 C76 62 76 91 64 110" fill="none" stroke="#C9716D" stroke-width="3"/><path d="M36 54 Q29 62 31 71" fill="none" stroke="#FFDCBF" stroke-width="5"/>',
  cherry: '<path d="M38 67 C54 53 61 35 65 19 C70 43 80 55 91 68" fill="none" stroke="#527C48" stroke-width="5"/><path d="M65 21 C76 9 93 17 98 28 C84 33 74 32 65 21 Z" fill="#6D9855"/><circle cx="38" cy="88" r="25" fill="#A93F4D"/><ellipse cx="32" cy="83" rx="18" ry="19" fill="#C95A63"/><circle cx="91" cy="90" r="24" fill="#B23C4A"/><ellipse cx="85" cy="84" rx="17" ry="18" fill="#D36068"/><path d="M25 77 L30 73 M79 77 L84 73" fill="none" stroke="#F6C3BA" stroke-width="5"/>',
  tile: '<path d="M17 8 L111 8 Q122 8 122 19 L122 112 Q122 124 110 124 L18 124 Q6 124 6 112 L6 20 Q6 8 17 8 Z" fill="#C8D0B9"/><path d="M17 4 L111 4 Q122 4 122 15 L122 107 Q122 119 110 119 L18 119 Q6 119 6 107 L6 16 Q6 4 17 4 Z" fill="#FFFDF3"/><path d="M18 9 L110 9 Q117 9 117 17 L117 103" fill="none" stroke="#FFFFFF" stroke-width="3"/>',
  'tile-selected': '<path d="M17 8 L111 8 Q122 8 122 19 L122 112 Q122 124 110 124 L18 124 Q6 124 6 112 L6 20 Q6 8 17 8 Z" fill="#537F59"/><path d="M17 4 L111 4 Q122 4 122 15 L122 107 Q122 119 110 119 L18 119 Q6 119 6 107 L6 16 Q6 4 17 4 Z" fill="#E9F3C7" stroke="#64915E" stroke-width="6"/>',
  hint: '<path d="M43 83 C43 68 29 65 29 47 C29 7 99 7 99 47 C99 65 85 68 85 83 Z" fill="#EDCB67"/><path d="M64 32 L64 62 M49 48 L64 62 L79 48" fill="none" stroke="#FFF1B5" stroke-width="6"/><path d="M45 85 L83 85 L80 105 L49 105 Z" fill="#6D8B70"/><path d="M54 109 L75 109 L70 118 L59 118 Z" fill="#486950"/>',
  shuffle: '<path d="M19 37 L34 37 C63 37 65 92 93 92 L108 92 M19 92 L33 92 C62 92 64 37 94 37 L109 37" fill="none" stroke="#5D8B65" stroke-width="10"/><path d="M95 24 L112 37 L95 50 M95 79 L112 92 L95 105" fill="none" stroke="#5D8B65" stroke-width="9"/>',
  time: '<circle cx="64" cy="69" r="43" fill="#D6A46F"/><circle cx="64" cy="66" r="37" fill="#FFF0CE"/><path d="M64 43 L64 67 L81 78" fill="none" stroke="#7B6145" stroke-width="7"/><path d="M55 14 L73 14 M64 14 L64 24" fill="none" stroke="#7B6145" stroke-width="7"/><path d="M99 12 L99 36 M87 24 L111 24" fill="none" stroke="#5A875C" stroke-width="6"/>',
};

const SIZE = 128, SCALE = 4, N = SIZE * SCALE;
const number = value => Number(value ?? 0);
const rgba = hex => hex === 'none' ? null : [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
function pathPoints(data) {
  const tokens = data.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const paths = []; let points = [], current = [0, 0], origin = [0, 0], command;
  const take = () => [number(tokens.shift()), number(tokens.shift())];
  while (tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[0])) command = tokens.shift();
    if (command === 'M') {
      if (points.length) paths.push(points);
      current = take(); origin = current; points = [current]; command = 'L';
    } else if (command === 'L') { current = take(); points.push(current); }
    else if (command === 'Q' || command === 'C') {
      const start = current, a = take(), b = take(), c = command === 'C' ? take() : b;
      for (let i = 1; i <= 20; i++) {
        const t = i / 20, u = 1 - t;
        points.push(command === 'Q'
          ? [u*u*start[0]+2*u*t*a[0]+t*t*b[0], u*u*start[1]+2*u*t*a[1]+t*t*b[1]]
          : [u*u*u*start[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t*t*t*c[0], u*u*u*start[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t*t*t*c[1]]);
      }
      current = c;
    } else if (command === 'Z') { points.push(origin); current = origin; command = undefined; }
    else throw new Error(`Unsupported SVG command ${command}`);
  }
  if (points.length) paths.push(points);
  return paths;
}
function ellipse(cx, cy, rx, ry) {
  return Array.from({length: 81}, (_, i) => [cx + Math.cos(i*Math.PI/40)*rx, cy + Math.sin(i*Math.PI/40)*ry]);
}
function raster(svg) {
  const pixels = new Uint8Array(N*N*4);
  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const i = (y*N+x)*4; pixels.set(color, i);
  };
  const polygon = (points, color) => {
    if (!color) return;
    const scaled = points.map(([x,y]) => [x*SCALE,y*SCALE]);
    const low = Math.max(0, Math.floor(Math.min(...scaled.map(p=>p[1]))));
    const high = Math.min(N-1, Math.ceil(Math.max(...scaled.map(p=>p[1]))));
    for (let y = low; y <= high; y++) {
      const crossings = [];
      for (let i=0,j=scaled.length-1;i<scaled.length;j=i++) {
        const a=scaled[i], b=scaled[j], row=y+.5;
        if ((a[1]>row)!==(b[1]>row)) crossings.push(a[0]+(row-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      crossings.sort((a,b)=>a-b);
      for (let i=0;i+1<crossings.length;i+=2) {
        const end=Math.min(N-1,Math.floor(crossings[i+1]-.5));
        for (let x=Math.max(0,Math.ceil(crossings[i]-.5));x<=end;x++) put(x,y,color);
      }
    }
  };
  const stroke = (points, color, width) => {
    const r=width/2;
    for (let i=1;i<points.length;i++) {
      const [a,b]=[points[i-1],points[i]], dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
      if (!length) continue;
      const ox=-dy/length*r,oy=dx/length*r;
      polygon([[a[0]+ox,a[1]+oy],[b[0]+ox,b[1]+oy],[b[0]-ox,b[1]-oy],[a[0]-ox,a[1]-oy]],color);
    }
    for (const point of points) polygon(ellipse(...point,r,r),color);
  };
  for (const match of svg.matchAll(/<(path|circle|ellipse)\s+([^>]+)\/>/g)) {
    const attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    const paths=match[1]==='path' ? pathPoints(attrs.d) : [ellipse(number(attrs.cx),number(attrs.cy),number(attrs.rx??attrs.r),number(attrs.ry??attrs.r))];
    for (const points of paths) {
      polygon(points,rgba(attrs.fill??'#000000'));
      if (attrs.stroke) stroke(points,rgba(attrs.stroke),number(attrs['stroke-width']??1));
    }
  }
  const out=Buffer.alloc(SIZE*SIZE*4);
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) {
    const sum=[0,0,0,0];
    for(let sy=0;sy<SCALE;sy++) for(let sx=0;sx<SCALE;sx++) {
      const index=((y*SCALE+sy)*N+x*SCALE+sx)*4, a=pixels[index+3]/255;
      for(let c=0;c<3;c++) sum[c]+=pixels[index+c]*a;
      sum[3]+=a;
    }
    const target=(y*SIZE+x)*4;
    for(let c=0;c<3;c++) out[target+c]=sum[3] ? Math.round(sum[c]/sum[3]) : 0;
    out[target+3]=Math.round(sum[3]/(SCALE*SCALE)*255);
  }
  return out;
}
function crc32(data) {
  let crc=0xffffffff;
  for(const byte of data) { crc^=byte; for(let j=0;j<8;j++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc^0xffffffff)>>>0;
}
function png(data) {
  const chunk=(type,body)=> {
    const name=Buffer.from(type), length=Buffer.alloc(4), crc=Buffer.alloc(4);
    length.writeUInt32BE(body.length); crc.writeUInt32BE(crc32(Buffer.concat([name,body])));
    return Buffer.concat([length,name,body,crc]);
  };
  const header=Buffer.alloc(13); header.writeUInt32BE(SIZE,0); header.writeUInt32BE(SIZE,4); header[8]=8; header[9]=6;
  const scan=Buffer.alloc((SIZE*4+1)*SIZE);
  for(let y=0;y<SIZE;y++) data.copy(scan,y*(SIZE*4+1)+1,y*SIZE*4,(y+1)*SIZE*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
for (const [name, svg] of Object.entries(pictures)) await writeFile(resolve(art,`${name}.png`),png(raster(svg)));

// Mono PCM WAV, 22.05kHz, moderate volume and soft attack/release.
function wave(seconds, voices, gain=.18) {
  const rate=22050, count=Math.round(seconds*rate), data=Buffer.alloc(44+count*2);
  data.write('RIFF'); data.writeUInt32LE(data.length-8,4); data.write('WAVEfmt ',8); data.writeUInt32LE(16,16);
  data.writeUInt16LE(1,20); data.writeUInt16LE(1,22); data.writeUInt32LE(rate,24); data.writeUInt32LE(rate*2,28);
  data.writeUInt16LE(2,32); data.writeUInt16LE(16,34); data.write('data',36); data.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++) {
    const time=i/rate; let sample=0;
    for (const {start=0,duration,frequency,volume=1} of voices) {
      const t=time-start;
      if(t<0||t>duration) continue;
      const envelope=Math.min(t/.015,1,Math.max((duration-t)/.08,0))*Math.exp(-t*2.2);
      sample+=(Math.sin(2*Math.PI*frequency*t)+.12*Math.sin(4*Math.PI*frequency*t))*envelope*volume;
    }
    data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample*gain))*32767),44+i*2);
  }
  return data;
}
const tone=(frequency,start,duration,volume=1)=>({frequency,start,duration,volume});
const sounds={
  click: wave(.12,[tone(520,0,.1)],.08),
  match: wave(.35,[tone(659.25,0,.15),tone(880,.12,.2)],.15),
  mismatch: wave(.22,[tone(220,0,.18),tone(196,.07,.12)],.09),
  win: wave(1.15,[tone(523.25,0,.25),tone(659.25,.18,.25),tone(783.99,.36,.3),tone(1046.5,.6,.5)],.14),
  fail: wave(.8,[tone(392,0,.3),tone(329.63,.2,.3),tone(261.63,.4,.35)],.11),
};
const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
const musicVoices=melody.map((frequency,index)=>tone(frequency,index*.5,.42,.65));
for(let index=0;index<8;index++) musicVoices.push(tone([130.81,174.61,130.81,196][Math.floor(index/2)],index, .85,.4));
sounds.music=wave(8,musicVoices,.11);
for (const [name,data] of Object.entries(sounds)) await writeFile(resolve(audio,`${name}.wav`),data);
console.log(`Generated ${Object.keys(pictures).length} transparent 128px PNGs and ${Object.keys(sounds).length} original PCM WAVs.`);
