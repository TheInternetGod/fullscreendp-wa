const Jimp = require('jimp')

const generateProfilePicture = async (media) => {
    try {
        const jimp = await Jimp.read(media)
        const min = jimp.getWidth()
        const max = jimp.getHeight()
        const cropped = jimp.crop(0, 0, min, max)
        return {
            img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
            preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG)
        }
    } catch (error) {
        console.error(`Failed to generate profile picture `, error);
    }
};

module.exports = generateProfilePicture;