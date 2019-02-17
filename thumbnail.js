/* jshint esversion: 6 */
const Promise = require('bluebird'),
      fs = Promise.promisifyAll(require('fs')),
      path = require('path'),
      sharp = require('sharp'),
      options = require('./options.json');

module.exports = (models) => {
  return (req, res, next) => {
    models.image.findById(req.params.imageID).then((image) => {
      if (!image) {
        return res.status(404);
      }

      if (!image.file.thumb) {
        var thumbFilename = path.join(options.thumbDirectory, image._id.toString());

        return sharp(image.file.full).resize(320, 240).toBuffer()
        .then((data) => {
          return fs.writeFileAsync(thumbFilename, data);
        })
        .then(() => {
          image.file.thumb = thumbFilename;
          return image.save();
        })
        .then(() => {
          return image.file.thumb;
        });
      }

      return image.file.thumb;
    })
    .then((filename) => {
      res.sendFile(filename);
    });
  };
};
