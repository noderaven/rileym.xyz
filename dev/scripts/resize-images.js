import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resizeImage() {
    const inputPath = join(__dirname, '../assets/images/oscp-badge.png');
    const sizes = [200, 400];

    try {
        for (const size of sizes) {
            const outputPath = join(__dirname, `../assets/images/oscp-badge-${size}.png`);
            await sharp(inputPath)
                .resize(size)
                .toFile(outputPath);
            console.log(`Generated ${size}px version`);
        }
        console.log('Image resizing complete!');
    } catch (error) {
        console.error('Error resizing images:', error);
    }
}

resizeImage(); 