import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const logoPath = path.join(rootDir, 'public', 'TRUSETS-logo-website.png');
const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
const playStoreAssetsDir = path.join(rootDir, 'public', 'play-store-assets');

const BRAND_CRIMSON = '#77101F';
const BRAND_WHITE = '#FFFFFF';

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateLauncherIcon(size, outputPath, isRound = false) {
  const padding = Math.round(size * 0.14);
  const innerSize = size - padding * 2;

  const resizedLogo = await sharp(logoPath)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  let baseSvg;
  if (isRound) {
    const r = size / 2;
    baseSvg = Buffer.from(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${r}" cy="${r}" r="${r}" fill="${BRAND_WHITE}"/>
        <circle cx="${r}" cy="${r}" r="${r - Math.max(1, Math.round(size * 0.03))}" fill="none" stroke="${BRAND_CRIMSON}" stroke-width="${Math.max(2, Math.round(size * 0.04))}"/>
      </svg>`
    );
  } else {
    const rx = Math.round(size * 0.18);
    baseSvg = Buffer.from(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${BRAND_WHITE}"/>
        <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${rx}" fill="none" stroke="${BRAND_CRIMSON}" stroke-width="${Math.max(2, Math.round(size * 0.04))}"/>
      </svg>`
    );
  }

  await sharp(baseSvg)
    .composite([{ input: resizedLogo, top: padding, left: padding }])
    .png()
    .toFile(outputPath);
}

async function generateAdaptiveForeground(size, outputPath) {
  // Adaptive foreground safe zone is inner 66% (72dp out of 108dp)
  const innerSize = Math.round(size * 0.58);
  const offset = Math.round((size - innerSize) / 2);

  const resizedLogo = await sharp(logoPath)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([{ input: resizedLogo, top: offset, left: offset }])
    .png()
    .toFile(outputPath);
}

async function generateSplashScreen(width, height, outputPath) {
  const logoWidth = Math.round(Math.min(width, height) * 0.52);
  const logoHeight = Math.round(logoWidth * 0.45);

  const cardWidth = Math.round(logoWidth * 1.25);
  const cardHeight = Math.round(logoHeight * 1.55);
  const cardX = Math.round((width - cardWidth) / 2);
  const cardY = Math.round((height - cardHeight) / 2);

  const bgSvg = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#540B16"/>
          <stop offset="50%" stop-color="#77101F"/>
          <stop offset="100%" stop-color="#3E0710"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="28" fill="#FFFFFF"/>
    </svg>`
  );

  const resizedLogo = await sharp(logoPath)
    .resize(logoWidth, logoHeight, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(bgSvg)
    .composite([
      {
        input: resizedLogo,
        left: Math.round((width - logoWidth) / 2),
        top: Math.round((height - logoHeight) / 2),
      },
    ])
    .png()
    .toFile(outputPath);
}

async function generatePlayStoreAssets() {
  await ensureDir(playStoreAssetsDir);

  // 1. 512 x 512 High-Resolution Play Store App Icon
  const icon512Path = path.join(playStoreAssetsDir, 'trussets-icon-512x512.png');
  await generateLauncherIcon(512, icon512Path, false);

  // 2. 1024 x 500 Feature Graphic
  const featurePath = path.join(playStoreAssetsDir, 'trussets-feature-graphic-1024x500.png');
  const logoBuffer = await sharp(logoPath)
    .resize(320, 140, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const featureSvg = Buffer.from(
    `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="featBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4A0913"/>
          <stop offset="50%" stop-color="#77101F"/>
          <stop offset="100%" stop-color="#2D050B"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="500" fill="url(#featBg)"/>
      <circle cx="920" cy="80" r="220" fill="#FFFFFF" fill-opacity="0.04"/>
      <circle cx="120" cy="440" r="180" fill="#FFFFFF" fill-opacity="0.04"/>
      <rect x="64" y="130" width="360" height="240" rx="28" fill="#FFFFFF"/>
      <text x="470" y="195" font-family="sans-serif" font-size="46" font-weight="800" fill="#FFFFFF">TRUSSETS</text>
      <text x="470" y="245" font-family="sans-serif" font-size="24" font-weight="700" fill="#FDE68A">Verified Real Estate Marketplace</text>
      <text x="470" y="295" font-family="sans-serif" font-size="19" font-weight="500" fill="#F1F5F9">• 100% Direct Owner Properties (Buy, Sell &amp; Rent)</text>
      <text x="470" y="330" font-family="sans-serif" font-size="19" font-weight="500" fill="#F1F5F9">• 0% Brokerage &amp; Verified Property Documents</text>
      <text x="470" y="365" font-family="sans-serif" font-size="19" font-weight="500" fill="#F1F5F9">• Plots, Apartments, Villas &amp; Commercial Spaces</text>
    </svg>`
  );

  await sharp(featureSvg)
    .composite([{ input: logoBuffer, left: 84, top: 180 }])
    .png()
    .toFile(featurePath);

  // 3. Generate 1080x1920 Phone Screenshots & 1920x1200 Tablet Screenshot for Play Store Listing
  const smallLogo = await sharp(logoPath)
    .resize(240, 80, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const phoneScreens = [
    {
      file: 'screenshot-1-home-marketplace.png',
      badge: 'DIRECT OWNER MARKETPLACE',
      title: 'Discover Verified Properties',
      subtitle: 'Buy, Sell & Rent across Hyderabad, Bengaluru, Mumbai & Top Cities',
      card1Title: '3 BHK Luxury Gated Apartment • Financial District',
      card1Meta: '₹1.85 Cr • 2,150 sq.ft • East Facing • Verified Title',
      card2Title: 'HMDA Approved Open Villa Plot • Kokapet',
      card2Meta: '₹2.40 Cr • 300 sq.yds • Direct Owner • 0% Brokerage',
    },
    {
      file: 'screenshot-2-property-details.png',
      badge: '100% VERIFIED DOCUMENTS',
      title: 'Zero Brokerage Direct Contact',
      subtitle: 'Connect directly with verified property owners via Call or WhatsApp',
      card1Title: '4 BHK Triplex Villa • Jubilee Hills, Hyderabad',
      card1Meta: '₹6.50 Cr • 4,500 sq.ft • Registered Sale Deed & EC Verified',
      card2Title: 'Direct Owner Access & Instant Enquiries',
      card2Meta: 'Unlock Verified Owner Phone, Exact Location & Legal Vault',
    },
    {
      file: 'screenshot-3-post-property.png',
      badge: 'POST PROPERTY FREE',
      title: 'Sell or Rent Your Property Fast',
      subtitle: 'Upload photos, set your price & receive genuine buyer enquiries',
      card1Title: 'Step-by-Step Mobile Property Posting Wizard',
      card1Meta: 'Residential, Commercial, Plots, Lands & Rental Listings',
      card2Title: 'Instant Live Sync Across Android App & Website',
      card2Meta: 'Real-time updates with Trussets Verification Team',
    },
    {
      file: 'screenshot-4-profile-plans.png',
      badge: 'TRANSPARENT PLANS & PROFILE',
      title: 'Manage Listings, Saved & Plans',
      subtitle: 'Track active subscriptions, remaining unlocks, enquiries & KYC status',
      card1Title: 'Verified Buyer & Tenant Subscription Plans',
      card1Meta: 'Instant activation • GST Invoices • Dedicated Support',
      card2Title: 'Unified Account Across Mobile & Web',
      card2Meta: 'Mobile OTP & Email Login • Saved Shortlists • Enquiries',
    },
  ];

  const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  for (const scr of phoneScreens) {
    const svg = Buffer.from(
      `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#600C18"/>
            <stop offset="35%" stop-color="#77101F"/>
            <stop offset="100%" stop-color="#F8FAFC"/>
          </linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#pBg)"/>
        <rect x="340" y="90" width="400" height="50" rx="25" fill="#FFFFFF" fill-opacity="0.16"/>
        <text x="540" y="123" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="800" fill="#FDE68A">${esc(scr.badge)}</text>
        <text x="540" y="210" text-anchor="middle" font-family="sans-serif" font-size="52" font-weight="900" fill="#FFFFFF">${esc(scr.title)}</text>
        <text x="540" y="268" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="500" fill="#F1F5F9">${esc(scr.subtitle)}</text>

        <!-- Phone Frame -->
        <rect x="90" y="340" width="900" height="1480" rx="56" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="12"/>
        <!-- App Top Bar -->
        <rect x="102" y="352" width="876" height="120" rx="44" fill="#FFFFFF"/>
        <line x1="102" y1="472" x2="978" y2="472" stroke="#E2E8F0" stroke-width="2"/>
        <!-- Hero Banner inside App -->
        <rect x="140" y="510" width="800" height="240" rx="28" fill="#77101F"/>
        <text x="180" y="585" font-family="sans-serif" font-size="34" font-weight="800" fill="#FFFFFF">0% Brokerage Real Estate</text>
        <text x="180" y="635" font-family="sans-serif" font-size="24" font-weight="500" fill="#FDE68A">100% Direct Owner Verified Properties</text>
        <rect x="180" y="665" width="320" height="52" rx="14" fill="#FFFFFF"/>
        <text x="340" y="699" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="800" fill="#77101F">Explore Marketplace</text>

        <!-- Card 1 -->
        <rect x="140" y="790" width="800" height="380" rx="28" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3"/>
        <rect x="170" y="820" width="740" height="180" rx="18" fill="#E2E8F0"/>
        <rect x="190" y="840" width="190" height="40" rx="10" fill="#059669"/>
        <text x="285" y="867" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="800" fill="#FFFFFF">VERIFIED</text>
        <text x="170" y="1055" font-family="sans-serif" font-size="28" font-weight="800" fill="#0F172A">${esc(scr.card1Title)}</text>
        <text x="170" y="1105" font-family="sans-serif" font-size="22" font-weight="600" fill="#475569">${esc(scr.card1Meta)}</text>

        <!-- Card 2 -->
        <rect x="140" y="1210" width="800" height="380" rx="28" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3"/>
        <rect x="170" y="1240" width="740" height="180" rx="18" fill="#E2E8F0"/>
        <rect x="190" y="1260" width="220" height="40" rx="10" fill="#77101F"/>
        <text x="300" y="1287" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="800" fill="#FFFFFF">0% BROKERAGE</text>
        <text x="170" y="1475" font-family="sans-serif" font-size="28" font-weight="800" fill="#0F172A">${esc(scr.card2Title)}</text>
        <text x="170" y="1525" font-family="sans-serif" font-size="22" font-weight="600" fill="#475569">${esc(scr.card2Meta)}</text>

        <!-- Bottom Nav Bar -->
        <rect x="102" y="1680" width="876" height="128" rx="36" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="200" y="1755" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="800" fill="#77101F">Home</text>
        <text x="370" y="1755" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#64748B">Buy</text>
        <circle cx="540" cy="1730" r="38" fill="#77101F"/>
        <text x="540" y="1742" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF">+</text>
        <text x="710" y="1755" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#64748B">Saved</text>
        <text x="880" y="1755" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#64748B">Profile</text>
      </svg>`
    );

    await sharp(svg)
      .composite([{ input: smallLogo, left: 140, top: 372 }])
      .png()
      .toFile(path.join(playStoreAssetsDir, scr.file));
  }

  // Tablet 1920x1200 Screenshot
  const tabletSvg = Buffer.from(
    `<svg width="1920" height="1200" viewBox="0 0 1920 1200" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1200" fill="#F8FAFC"/>
      <rect x="0" y="0" width="1920" height="110" fill="#FFFFFF"/>
      <rect x="0" y="110" width="1920" height="320" fill="#77101F"/>
      <text x="960" y="235" text-anchor="middle" font-family="sans-serif" font-size="54" font-weight="900" fill="#FFFFFF">Trussets Real Estate Marketplace</text>
      <text x="960" y="300" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="600" fill="#FDE68A">Buy, Sell &amp; Rent Verified Properties with 0% Brokerage</text>
      <rect x="120" y="480" width="520" height="580" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      <rect x="700" y="480" width="520" height="580" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      <rect x="1280" y="480" width="520" height="580" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      <text x="380" y="880" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="800" fill="#0F172A">Verified Apartments &amp; Villas</text>
      <text x="960" y="880" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="800" fill="#0F172A">HMDA &amp; DTCP Open Plots</text>
      <text x="1540" y="880" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="800" fill="#0F172A">Commercial &amp; Rental Spaces</text>
    </svg>`
  );

  await sharp(tabletSvg)
    .composite([{ input: smallLogo, left: 80, top: 15 }])
    .png()
    .toFile(path.join(playStoreAssetsDir, 'screenshot-tablet-1920x1200.png'));

  console.log('Generated Play Store assets in public/play-store-assets/');
}

async function run() {
  await generatePlayStoreAssets();

  if (!fs.existsSync(androidResDir)) {
    console.log('Android res directory not found yet, skipping Android mipmap generation.');
    return;
  }

  const mipmapSizes = [
    { folder: 'mipmap-mdpi', launcher: 48, adaptive: 108 },
    { folder: 'mipmap-hdpi', launcher: 72, adaptive: 162 },
    { folder: 'mipmap-xhdpi', launcher: 96, adaptive: 216 },
    { folder: 'mipmap-xxhdpi', launcher: 144, adaptive: 324 },
    { folder: 'mipmap-xxxhdpi', launcher: 192, adaptive: 432 },
  ];

  for (const item of mipmapSizes) {
    const dir = path.join(androidResDir, item.folder);
    await ensureDir(dir);
    await generateLauncherIcon(item.launcher, path.join(dir, 'ic_launcher.png'), false);
    await generateLauncherIcon(item.launcher, path.join(dir, 'ic_launcher_round.png'), true);
    await generateAdaptiveForeground(item.adaptive, path.join(dir, 'ic_launcher_foreground.png'));
  }

  const splashTargets = [
    { folder: 'drawable', w: 480, h: 800 },
    { folder: 'drawable-port-mdpi', w: 320, h: 480 },
    { folder: 'drawable-port-hdpi', w: 480, h: 800 },
    { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { folder: 'drawable-land-mdpi', w: 480, h: 320 },
    { folder: 'drawable-land-hdpi', w: 800, h: 480 },
    { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { folder: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const target of splashTargets) {
    const dir = path.join(androidResDir, target.folder);
    await ensureDir(dir);
    await generateSplashScreen(target.w, target.h, path.join(dir, 'splash.png'));
  }

  console.log('Generated all Android launcher icons, adaptive icons, and splash screens.');
}

run().catch((err) => {
  console.error('Error generating Android assets:', err);
  process.exit(1);
});
