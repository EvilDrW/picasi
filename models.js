/* jshint esversion: 6 */
const mongoose = require('mongoose'),
      GeoJSON = require('mongoose-geojson-schema'),
      Schema = mongoose.Schema;

var Person = new Schema({
  name: { type: String, default: 'unknown' }
});

var Image = new Schema({
  file: {
    full: { type: String, required: true },
    thumb: { type: String }
  },
  camera: {
    make: { type: String, default: 'unknown' },
    model: { type: String, default: 'unknown' }
  },
  location: mongoose.Schema.Types.Point,
  date: { type: Date, required: true },
  faces: [{
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    box: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    descriptor: { type: [Number], required: true, minlength: 128, maxlength: 128 }
  }]
});

Image.index({ location: '2dsphere' });

module.exports = (db) => {
  return {
    image: db.model('image', Image),
    person: db.model('person', Person)
  };
};
