/* jshint esversion: 6 */
const faceapi = require('face-api.js');
const canvas = require('canvas');
const faceDetectionNet = faceapi.nets.tinyFaceDetector;
const faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 480, scoreThreshold: 0.5 });
const Promise = require('bluebird');

const fs = require('fs');
faceapi.env.monkeyPatch({ Canvas: canvas.Canvas, Image: canvas.Image, ImageData: canvas.ImageData });

function run() {
  var c;

  Promise.join(
    faceDetectionNet.loadFromDisk('./models'),
    faceapi.nets.faceLandmark68Net.loadFromDisk('./models'),
    faceapi.nets.faceRecognitionNet.loadFromDisk('./models'),
    () => null).then(() => {
    return canvas.loadImage("C:\\Users\\Keith\\Pictures\\01\\15\\IMG_20190115_173821858.jpg");
  }).then((img) => {
    c = new canvas.createCanvas(img.width, img.height);
    var ctx = c.getContext('2d');

    ctx.drawImage(img, 0, 0);

    return c;
  }).then((c) => {
    return faceapi.detectAllFaces(c, faceDetectionOptions)
      .withFaceLandmarks().withFaceDescriptors();
  }).then((detections) => {
    faceapi.drawDetection(c, detections);
    // detections[j].descriptor = Float32Array of 128 elements
    fs.writeFileSync('detections.json', JSON.stringify(detections));

    fs.writeFileSync('faceDetection.jpg', c.toBuffer('image/jpeg'));

    console.log('done, saved results to out/faceDetection.jpg');
  });
}

run();
