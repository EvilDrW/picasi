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
  scan.directory(options.imageDirectory).mapSeries((data) => {
    var image = new models.image(data);

    return image.save();
  }).mapSeries((data) => {
    return thumbnail(data);
  }).all();
});

var buildImageQuery = (urlQuery) => {
  var query = {};

  if (urlQuery.datebegin) {
    query.date = query.date || {};
    query.date.$gte = urlQuery.datebegin;
  }
  if (urlQuery.dateend) {
    query.date = query.date || {};
    query.date.$lte = urlQuery.dateend;
  }
  if (urlQuery.nearlat && urlQuery.nearlon) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [urlQuery.nearlon, urlQuery.nearlat]
        }
      }
    };

    if (urlQuery.neardist) {
      query.location.$maxDistance = urlQuery.neardist;
    }
  }

  return query;
};

app.get('/images', (req, res, next) => {
  var q = models.image.find(buildImageQuery(req.query));

  if (req.query.limit) {
    q.limit(req.query.limit);
  }

  q.sort({ date: -1 }).exec().then((images) => {
    res.send(images.map((img) => {
      return img._id;
    }));
  });
});

app.get('/images/count', (req, res, next) => {
  models.image.count(buildImageQuery(req.query)).exec().then((cnt) => {
    res.json(cnt);
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

app.get('/images/:imageID/thumbnail', (req, res, next) => {
  models.image.findById(req.params.imageID).then((image) => {
    if (!image) {
      return res.status(404);
    }

    res.sendFile(image.file.thumb);
  });
});

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
