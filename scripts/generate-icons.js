/**
 * Icon Generation Script
 * 
 * This script helps generate app icons from a base 1024x1024 image.
 * Requires: ImageMagick (https://imagemagick.org/)
 * 
 * Usage:
 *   node scripts/generate-icons.js path/to/icon-1024.png
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const sizes = {
  ios: [1024, 180, 120, 87, 80, 76, 60, 58, 40, 29, 20],
  android: [512, 192, 144, 96, 72, 48, 36],
  adaptive: [1024], // Android adaptive icon
}

function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function generateIcons(inputPath, outputDir) {
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`)
    process.exit(1)
  }

  if (!checkImageMagick()) {
    console.error('Error: ImageMagick not found. Please install from https://imagemagick.org/')
    console.log('\nAlternatively, use online tools:')
    console.log('- https://www.appicon.co/')
    console.log('- https://icon.kitchen/')
    process.exit(1)
  }

  // Create output directories
  const iosDir = path.join(outputDir, 'ios')
  const androidDir = path.join(outputDir, 'android')
  
  fs.mkdirSync(iosDir, { recursive: true })
  fs.mkdirSync(androidDir, { recursive: true })

  console.log('Generating iOS icons...')
  sizes.ios.forEach(size => {
    const outputPath = path.join(iosDir, `icon-${size}.png`)
    try {
      execSync(`magick "${inputPath}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'ignore' })
      console.log(`  ✓ ${size}x${size}`)
    } catch (error) {
      console.error(`  ✗ Failed to generate ${size}x${size}`)
    }
  })

  console.log('\nGenerating Android icons...')
  sizes.android.forEach(size => {
    const outputPath = path.join(androidDir, `icon-${size}.png`)
    try {
      execSync(`magick "${inputPath}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'ignore' })
      console.log(`  ✓ ${size}x${size}`)
    } catch (error) {
      console.error(`  ✗ Failed to generate ${size}x${size}`)
    }
  })

  console.log('\n✓ Icon generation complete!')
  console.log(`\nOutput directories:`)
  console.log(`  iOS: ${iosDir}`)
  console.log(`  Android: ${androidDir}`)
}

// Main
const inputFile = process.argv[2]
const outputDir = process.argv[3] || path.join(__dirname, '..', 'apps', 'web', 'public', 'generated-icons')

if (!inputFile) {
  console.log('Usage: node scripts/generate-icons.js <input-1024x1024.png> [output-dir]')
  console.log('\nExample:')
  console.log('  node scripts/generate-icons.js icon-1024.png')
  process.exit(1)
}

generateIcons(inputFile, outputDir)

