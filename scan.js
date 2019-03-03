/* jslint esversion: 6 */
const Promise = require('bluebird'),
      recursive = Promise.promisify(require('recursive-readdir')),
      path = require('path'),
      exif = require('fast-exif'),
      faceDetect = require('./faceDetect.js');

const dms2frac = (val, ref) => {
  return invertGps(ref) * (val[0] + val[1] / 60 + val[2] / 3600);
};

const invertGps = (ref) => {
  return (ref == 'S' || ref == 'W') ? -1 : 1;
};

const gpsExtract = (exifData) => {
  if (!exifData.gps) {
    return null;
  }

  return [
    dms2frac(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef),
    dms2frac(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef)
  ];
};

const scanFile = (filename) => {
  return Promise.join(
    exif.read(filename),
    faceDetect(filename),
  (exifData, faceData) => {
    if (!exifData) {
      return {
        file: { full: filename },
        date: Date.now() // use lstat here to get the file creation date
      };
    }

    return {
      camera: {
        make: exifData.image.Make,
        model: exifData.image.Model
      },
      location: {
        type: 'Point',
        coordinates: gpsExtract(exifData)
      },
      date: exifData.exif.DateTimeOriginal,
      file: { full: filename },
      faces: faceData
    };
  });
};

// returns an array of promises that each resolve to the exif data needed
// for the model
module.exports = {
  directory: (dir) => {
    return recursive(dir).filter((file) => {
      var extension = path.extname(file).toLowerCase();

      return (extension == '.jpg') || (extension == '.jpeg');
    })
    .mapSeries(scanFile);
  },
  file: scanFile
};
