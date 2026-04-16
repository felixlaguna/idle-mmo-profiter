/**
 * preresize-sprites.ts — Pre-resize all sprite PNGs to exactly 48×48.
 *
 * Why: Sprites are stored at 250×250, 256×256, 512×512, etc. Both the
 * Playwright DB generator and the game browser downscale them to 48×48
 * at render time, but non-integer downscale ratios (e.g. 5.33× for 256→48)
 * cause sub-pixel antialiasing differences between environments. Pre-resizing
 * to 48×48 means both environments display the image at exactly 1:1 — no
 * downscale, no antialiasing differences.
 *
 * Uses Lanczos-3 (sharp.kernel.lanczos3) for highest quality downscaling.
 * Sprites that are already exactly 48×48 are skipped (idempotent).
 * Sprites with dimensions larger than 48 in either axis but non-square
 * (e.g. 1280×720 banners) are still resized to 48×48 using fit:fill so
 * the hash pipeline treats them consistently.
 *
 * Usage:
 *   npx tsx scripts/preresize-sprites.ts
 *   npx tsx scripts/preresize-sprites.ts --dry-run   # report without writing
 *
 * After running, regenerate the hash DB:
 *   make generate-sprite-hashes
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')
const SPRITES_DIR = path.join(ROOT, 'src/data/sprites')
const TARGET_SIZE = 48

async function main(): Promise<void> {
  console.log('IdleMMO Sprite Pre-Resize — 48×48 Lanczos-3')
  console.log('============================================\n')

  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  if (dryRun) {
    console.log('DRY RUN MODE — no files will be written\n')
  }

  // -------------------------------------------------------------------------
  // Collect all PNG files
  // -------------------------------------------------------------------------

  const files = fs
    .readdirSync(SPRITES_DIR)
    .filter((f) => f.endsWith('.png'))
    .sort()

  console.log(`Found ${files.length} PNG sprites in ${SPRITES_DIR}\n`)

  // -------------------------------------------------------------------------
  // Process each sprite
  // -------------------------------------------------------------------------

  let skipped = 0
  let resized = 0
  let failed = 0
  const failedFiles: string[] = []

  const startTime = Date.now()

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const filepath = path.join(SPRITES_DIR, filename)

    let metadata: sharp.Metadata
    try {
      metadata = await sharp(filepath).metadata()
    } catch (err) {
      console.warn(`[${i + 1}/${files.length}] FAIL (metadata) ${filename}: ${err}`)
      failed++
      failedFiles.push(filename)
      continue
    }

    const { width, height } = metadata
    if (width === undefined || height === undefined) {
      console.warn(`[${i + 1}/${files.length}] FAIL (no dimensions) ${filename}`)
      failed++
      failedFiles.push(filename)
      continue
    }

    // Skip sprites that are already exactly 48×48
    if (width === TARGET_SIZE && height === TARGET_SIZE) {
      skipped++
      continue
    }

    if (!dryRun) {
      try {
        // Resize to exactly 48×48 with Lanczos-3.
        // fit: 'fill' stretches non-square images to exactly 48×48 (consistent
        // with how CSS width/height: 48px renders them).
        const resizedBuffer = await sharp(filepath)
          .resize(TARGET_SIZE, TARGET_SIZE, {
            kernel: sharp.kernel.lanczos3,
            fit: 'fill',
          })
          .png()
          .toBuffer()

        fs.writeFileSync(filepath, resizedBuffer)
        resized++
      } catch (err) {
        console.warn(`[${i + 1}/${files.length}] FAIL (resize) ${filename}: ${err}`)
        failed++
        failedFiles.push(filename)
        continue
      }
    } else {
      // Dry run — just count
      resized++
    }

    // Progress every 100 items or at the end
    if ((i + 1) % 100 === 0 || i === files.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(
        `[${i + 1}/${files.length}] resized=${resized} skipped=${skipped} failed=${failed}  (${elapsed}s)`,
      )
    }
  }

  // -------------------------------------------------------------------------
  // Verification pass (only if not dry-run)
  // -------------------------------------------------------------------------

  let verifyFailed = 0
  if (!dryRun && resized > 0) {
    console.log('\nVerifying output dimensions…')
    for (const filename of files) {
      const filepath = path.join(SPRITES_DIR, filename)
      try {
        const m = await sharp(filepath).metadata()
        if (m.width !== TARGET_SIZE || m.height !== TARGET_SIZE) {
          console.warn(`  VERIFY FAIL: ${filename} is ${m.width}×${m.height}`)
          verifyFailed++
        }
      } catch (err) {
        console.warn(`  VERIFY FAIL (read): ${filename}: ${err}`)
        verifyFailed++
      }
    }
    if (verifyFailed === 0) {
      console.log(`  All ${files.length} sprites verified at ${TARGET_SIZE}×${TARGET_SIZE}.`)
    } else {
      console.error(`  ${verifyFailed} sprites failed verification!`)
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  console.log('\n--- Summary ---')
  console.log(`  Total sprites:  ${files.length}`)
  console.log(`  Already 48×48:  ${skipped}`)
  console.log(`  Resized:        ${resized}`)
  console.log(`  Failed:         ${failed}`)
  if (verifyFailed > 0) {
    console.log(`  Verify failed:  ${verifyFailed}`)
  }
  console.log(`  Total time:     ${((Date.now() - startTime) / 1000).toFixed(1)}s`)

  if (failedFiles.length > 0) {
    console.log('\n  Failed files:')
    for (const f of failedFiles) {
      console.log(`    ${f}`)
    }
  }

  if (!dryRun && resized > 0) {
    console.log(
      `\nDone. Run 'make generate-sprite-hashes' to regenerate the hash database.`,
    )
  } else if (dryRun) {
    console.log(
      `\nDRY RUN complete. ${resized} sprites would be resized.`,
    )
  }

  process.exit(failed > 0 || verifyFailed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
