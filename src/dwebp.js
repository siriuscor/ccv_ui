const { nativeImage } = require('electron');
const fs = require('fs/promises');

module.exports = async (input_image, output_image, option, logging) => {
    try {
        // Read the WebP format file into a buffer
        const buffer = await fs.readFile(input_image);
        // Let Chromium's ImageDecoder (Skia) parse the buffer natively
        const image = nativeImage.createFromBuffer(buffer);
        
        if (image.isEmpty()) {
            throw new Error('Failed to decode WebP image: ' + input_image);
        }
        
        // Encode to JPEG at 90% quality
        const jpegBuffer = image.toJPEG(90);
        
        // Write out the result
        await fs.writeFile(output_image, jpegBuffer);
        
        return 'success';
    } catch (err) {
        console.error('WebP conversion error in Node.js wrapper:', err);
        throw err;
    }
};
