/* jshint esversion: 6 */
const Promise = require('bluebird'),
      fs = Promise.promisifyAll(require('fs')),
      path = require('path'),
      sharp = require('sharp'),
      options = require('./options.json');

module.exports = (image) => {
  console.log(image);
  if (!image.file.thumb) {
    console.log('creating thumbnail for', options.thumbDirectory, image._id, image.file.full);
    var thumbFilename = path.join(options.thumbDirectory, image._id.toString() + '.jpg');

    return sharp(image.file.full).resize(320, 240).toFile(thumbFilename)
    .then(() => {
      image.file.thumb = thumbFilename;

      return image.save();
    });
  }

  return image;
};
