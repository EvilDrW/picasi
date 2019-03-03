/* jshint esversion: 6 */
const faceapi = require('face-api.js');
const canvas = require('canvas');
const faceDetectionNet = faceapi.nets.tinyFaceDetector;
const faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 480, scoreThreshold: 0.5 });
const Promise = require('bluebird');

faceapi.env.monkeyPatch({ Canvas: canvas.Canvas, Image: canvas.Image, ImageData: canvas.ImageData });

var ready = Promise.join(
  faceDetectionNet.loadFromDisk('./models'),
  faceapi.nets.faceLandmark68Net.loadFromDisk('./models'),
  faceapi.nets.faceRecognitionNet.loadFromDisk('./models'),
() => null);

module.exports = (filename) => {
  return canvas.loadImage(filename).then((img) => {
    var c = new canvas.createCanvas(img.width, img.height);
    var ctx = c.getContext('2d');

    ctx.drawImage(img, 0, 0);

    return c;
  }).then((c) => {
    return faceapi.detectAllFaces(c, faceDetectionOptions)
      .withFaceLandmarks().withFaceDescriptors();
  }).then((detections) => {
    return detections.map((d) => {
      return {
        box: {
          x: d.alignedRect.box._x,
          y: d.alignedRect.box._y,
          width: d.alignedRect.box._width,
          height: d.alignedRect.box._height
        },
        descriptor: Object.keys(d.descriptor).map((key) => d.descriptor[key])
      };
    });
  });
};
