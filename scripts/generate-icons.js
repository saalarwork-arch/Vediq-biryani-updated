const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function makeIcons() {
  const rootDir = process.cwd();
  const svgPath = path.join(rootDir, 'public', 'logo.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Background color: #07111F (Royal Navy)
  // 1. icon-192.png
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(svgBuffer).resize(150, 150, { fit: 'contain' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(path.join(rootDir, 'public', 'icon-192.png'));

  // 2. icon-512.png
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(svgBuffer).resize(410, 410, { fit: 'contain' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(path.join(rootDir, 'public', 'icon-512.png'));

  // 3. icon-maskable-512.png (80% safe zone with 15% padding)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(svgBuffer).resize(330, 330, { fit: 'contain' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(path.join(rootDir, 'public', 'icon-maskable-512.png'));

  // 4. apple-touch-icon.png (180x180 for iOS Safari)
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(svgBuffer).resize(140, 140, { fit: 'contain' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(path.join(rootDir, 'public', 'apple-touch-icon.png'));

  // 5. Admin dedicated badge
  const adminBadgeSvg = `
    <svg width="400" height="80" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="80" y="10" width="240" height="60" rx="16" fill="#101F35" stroke="#C9A24A" stroke-width="4"/>
      <text x="200" y="52" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="32" fill="#F3DC9B" letter-spacing="6">ADMIN</text>
    </svg>
  `;
  const adminBadgeBuf = Buffer.from(adminBadgeSvg);

  // admin-icon-192.png
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(svgBuffer).resize(126, 126, { fit: 'contain' }).toBuffer(),
      top: 15,
      left: 33
    },
    {
      input: await sharp(adminBadgeBuf).resize(110, 22, { fit: 'contain' }).toBuffer(),
      top: 155,
      left: 41
    }
  ])
  .png()
  .toFile(path.join(rootDir, 'public', 'admin-icon-192.png'));

  // admin-icon-512.png
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(svgBuffer).resize(350, 350, { fit: 'contain' }).toBuffer(),
      top: 40,
      left: 81
    },
    {
      input: await sharp(adminBadgeBuf).resize(280, 56, { fit: 'contain' }).toBuffer(),
      top: 420,
      left: 116
    }
  ])
  .png()
  .toFile(path.join(rootDir, 'public', 'admin-icon-512.png'));

  // admin-icon-maskable-512.png
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 17, b: 31, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(svgBuffer).resize(280, 280, { fit: 'contain' }).toBuffer(),
      top: 85,
      left: 116
    },
    {
      input: await sharp(adminBadgeBuf).resize(220, 44, { fit: 'contain' }).toBuffer(),
      top: 390,
      left: 146
    }
  ])
  .png()
  .toFile(path.join(rootDir, 'public', 'admin-icon-maskable-512.png'));

  // Also replace /public/icon.png with crisp 512x512
  fs.copyFileSync(
    path.join(rootDir, 'public', 'icon-512.png'),
    path.join(rootDir, 'public', 'icon.png')
  );

  console.log('SUCCESS: All PWA icons generated!');
}

makeIcons().catch((err) => {
  console.error('ERROR generating icons:', err);
  process.exit(1);
});
