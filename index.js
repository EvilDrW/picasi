/* jslint esversion: 6 */
const express = require('express'),
      mongoose = require('mongoose'),
      scan = require('./scan.js'),
      thumbnail = require('./thumbnail.js'),
      Promise = require('bluebird'),
      options = require('./options.json');

const app = express();
mongoose.Promise = Promise;

const db = mongoose.createConnection(`mongodb://${options.mongoIpAddress}:${options.mongoPort}/${options.mongoDatabase}`);
const models = require('./models.js')(db);

db.dropDatabase().then(() => {
  scan.directory(options.imageDirectory).map((data) => {
    var image = new models.image(data);

    return image.save();
  }).map((img) => { console.log(img._id); return; }).all();
});

app.get('/images', (req, res, next) => {
  var query = {};

  if (req.query.datebegin) {
    query.date = query.date || {};
    query.date.$gte = req.query.datebegin;
  }
  if (req.query.dateend) {
    query.date = query.date || {};
    query.date.$lte = req.query.dateend;
  }
  if (req.query.nearlat && req.query.nearlon) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [req.query.nearlon, req.query.nearlat]
        }
      }
    };

    if (req.query.neardist) {
      query.location.$maxDistance = req.query.neardist;
    }
  }

  var q = models.image.find(query);

  if (req.query.limit) {
    q.limit(req.query.limit);
  }

  q.sort({ date: -1 }).exec().then((images) => {
    res.send(images.map((img) => {
      return img._id;
    }));
  });
});

app.get('/images/:imageID', (req, res, next) => {
  models.image.findById(req.params.imageID).then((image) => {
    if (!image) {
      return res.status(404);
    }

    res.sendFile(image.file.full);
  });
});

app.get('/images/:imageID/thumbnail', thumbnail(models));

app.get('/images/:imageID/metadata', (req, res, next) => {
  models.image.findById(req.params.imageID).then((image) => {
    if (!image) {
      return res.status(404);
    }

    res.send(image);
  });
});

app.use(express.static('./static'));

app.listen(80);
