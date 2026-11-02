import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG definitions for the official TRUSSETS brand logo
// Exact color matching from the uploaded TRUSETS-logo-website.png:
// - Gold: #D39F34, #E2B246, #C58F24, #A87114
// - Maroon: #6F0D1C, #77101F, #5D0814
// - Text: TRU in Gold gradient, SSETS in Deep Maroon #700B1B, followed by ® in #700B1B

const svgColor = `<svg viewBox="0 0 680 144" width="680" height="144" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Metallic Gold Gradient for 'TRU' and the Lower Emblem Wing -->
    <linearGradient id="trussetsGoldGrad" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#E2B448" />
      <stop offset="30%" stop-color="#D49E2D" />
      <stop offset="70%" stop-color="#BE851C" />
      <stop offset="100%" stop-color="#9C650F" />
    </linearGradient>

    <!-- Specular highlight for lower gold wing -->
    <linearGradient id="trussetsGoldWingHighlight" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#FCE18D" />
      <stop offset="45%" stop-color="#E4B44B" />
      <stop offset="100%" stop-color="#B27B17" />
    </linearGradient>

    <!-- Deep Royal Burgundy/Maroon for the Top Wing and 'SSETS' -->
    <linearGradient id="trussetsMaroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7B0E1E" />
      <stop offset="50%" stop-color="#6F0D1C" />
      <stop offset="100%" stop-color="#550713" />
    </linearGradient>

    <!-- Subtle Drop Shadow -->
    <filter id="logoShadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.10" />
    </filter>
  </defs>

  <!-- 1. LEFT EMBLEM: Interlocking Feather/Crescent Swooshes -->
  <g id="trussets-emblem" transform="translate(12, 10)" filter="url(#logoShadow)">
    <!-- Top Maroon Wing with left feather tip and sweep -->
    <path
      d="M 12 40 
         C 26 22, 54 8, 92 8 
         C 108 8, 120 15, 125 27 
         C 127 34, 124 46, 114 59 
         C 101 74, 82 88, 58 96 
         C 69 82, 82 66, 80 50 
         C 78 33, 60 26, 44 33 
         C 32 38, 22 45, 12 40 Z"
      fill="url(#trussetsMaroonGrad)"
    />

    <!-- Bottom Gold Crescent Swoosh -->
    <path
      d="M 46 48 
         C 36 60, 31 75, 36 88 
         C 43 103, 63 111, 88 111 
         C 103 111, 116 104, 124 94 
         C 109 97, 91 94, 76 84 
         C 63 74, 53 62, 53 50 
         C 53 43, 56 35, 61 28 
         C 53 35, 46 42, 46 48 Z"
      fill="url(#trussetsGoldWingHighlight)"
    />
  </g>

  <!-- 2. BRAND TYPOGRAPHY: TRUSSETS -->
  <g id="trussets-text" transform="translate(150, 94)">
    <!-- 'TRU' in Rich Metallic Gold -->
    <text
      x="0"
      y="0"
      font-family="'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Liberation Sans', sans-serif"
      font-size="80"
      font-weight="900"
      letter-spacing="1"
      fill="url(#trussetsGoldGrad)"
    >TRU</text>

    <!-- 'SSETS' in Deep Burgundy Maroon -->
    <text
      x="238"
      y="0"
      font-family="'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Liberation Sans', sans-serif"
      font-size="80"
      font-weight="900"
      letter-spacing="1"
      fill="#700B1B"
    >SSETS</text>

    <!-- Registered Trademark symbol ® -->
    <g transform="translate(488, -60)">
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke="#700B1B"
        stroke-width="2.2"
        fill="none"
      />
      <text
        x="12"
        y="17"
        font-family="'Plus Jakarta Sans', 'Liberation Sans', sans-serif"
        font-size="14"
        font-weight="800"
        text-anchor="middle"
        fill="#700B1B"
      >R</text>
    </g>
  </g>
</svg>`;

// White variant for dark modal headers, dark backgrounds, etc.
const svgWhite = `<svg viewBox="0 0 680 144" width="680" height="144" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 1. LEFT EMBLEM (White variant) -->
  <g id="trussets-emblem-white" transform="translate(12, 10)">
    <path
      d="M 12 40 
         C 26 22, 54 8, 92 8 
         C 108 8, 120 15, 125 27 
         C 127 34, 124 46, 114 59 
         C 101 74, 82 88, 58 96 
         C 69 82, 82 66, 80 50 
         C 78 33, 60 26, 44 33 
         C 32 38, 22 45, 12 40 Z"
      fill="#FFFFFF"
    />
    <path
      d="M 46 48 
         C 36 60, 31 75, 36 88 
         C 43 103, 63 111, 88 111 
         C 103 111, 116 104, 124 94 
         C 109 97, 91 94, 76 84 
         C 63 74, 53 62, 53 50 
         C 53 43, 56 35, 61 28 
         C 53 35, 46 42, 46 48 Z"
      fill="#E2E8F0"
      opacity="0.92"
    />
  </g>

  <!-- 2. TYPOGRAPHY: TRUSSETS (White variant) -->
  <g id="trussets-text-white" transform="translate(150, 94)">
    <text
      x="0"
      y="0"
      font-family="'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Liberation Sans', sans-serif"
      font-size="80"
      font-weight="900"
      letter-spacing="1"
      fill="#FFFFFF"
    >TRU</text>
    <text
      x="238"
      y="0"
      font-family="'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Liberation Sans', sans-serif"
      font-size="80"
      font-weight="900"
      letter-spacing="1"
      fill="#FFFFFF"
    >SSETS</text>
    <g transform="translate(488, -60)">
      <circle cx="12" cy="12" r="11" stroke="#FFFFFF" stroke-width="2.2" fill="none" />
      <text x="12" y="17" font-family="'Plus Jakarta Sans', 'Liberation Sans', sans-serif" font-size="14" font-weight="800" text-anchor="middle" fill="#FFFFFF">R</text>
    </g>
  </g>
</svg>`;

// Favicon SVG (icon mark only)
const svgFavicon = `<svg viewBox="0 0 144 144" width="144" height="144" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="favGold" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#FCE18D" />
      <stop offset="45%" stop-color="#E4B44B" />
      <stop offset="100%" stop-color="#B27B17" />
    </linearGradient>
    <linearGradient id="favMaroon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7B0E1E" />
      <stop offset="50%" stop-color="#6F0D1C" />
      <stop offset="100%" stop-color="#550713" />
    </linearGradient>
  </defs>
  <g transform="translate(4, 14)">
    <path
      d="M 12 40 C 26 22, 54 8, 92 8 C 108 8, 120 15, 125 27 C 127 34, 124 46, 114 59 C 101 74, 82 88, 58 96 C 69 82, 82 66, 80 50 C 78 33, 60 26, 44 33 C 32 38, 22 45, 12 40 Z"
      fill="url(#favMaroon)"
    />
    <path
      d="M 46 48 C 36 60, 31 75, 36 88 C 43 103, 63 111, 88 111 C 103 111, 116 104, 124 94 C 109 97, 91 94, 76 84 C 63 74, 53 62, 53 50 C 53 43, 56 35, 61 28 C 53 35, 46 42, 46 48 Z"
      fill="url(#favGold)"
    />
  </g>
</svg>`;

async function generateAssets() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'trussets-logo.svg'), svgColor.trim());
  fs.writeFileSync(path.join(publicDir, 'trussets-logo-white.svg'), svgWhite.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon.trim());
  console.log('Written SVG files to public/');

  // Generate High-Resolution Transparent PNGs with Sharp
  // 1. TRUSETS-logo-website.png (exactly as named by user)
  const pngBuffer = await sharp(Buffer.from(svgColor), { density: 300 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'TRUSETS-logo-website.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'trussets-logo.png'), pngBuffer);
  console.log('Rendered TRUSETS-logo-website.png & trussets-logo.png successfully! Size:', pngBuffer.length);

  // Generate White PNG
  const whitePngBuffer = await sharp(Buffer.from(svgWhite), { density: 300 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'trussets-logo-white.png'), whitePngBuffer);
  console.log('Rendered trussets-logo-white.png! Size:', whitePngBuffer.length);
}

generateAssets().catch(err => {
  console.error('Error generating brand assets:', err);
  process.exit(1);
});
