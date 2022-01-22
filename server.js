require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');

const { Schema } = mongoose;
console.log(process.env['MONGO_URI']);
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl/:url', function(req, res) {
  Url.find({short_url:req.params.url}).exec(function(err, people) {
    res.redirect(people[0].original_url);
  });
  
});

const urlSchema = new Schema({
  original_url:  String,
  short_url: Number
});

let Url = mongoose.model('Url', urlSchema);


app.post('/api/shorturl', function(req, res) {
  const {url} = req.body;

  if(!/^(http|https)\:\/\//ig.test(url))
  {
    res.json({ error: 'invalid url' });
  }else{
    const urlObject = new URL(url);

    dns.lookup(urlObject.hostname, (err, address, family) => {
      if (err) {
        res.json({ error: 'invalid url' });
      }else{
        
        let maxShortUrl = 0;
        Url.find({}).sort({short_url:-1}).limit(1).exec(function(err, people) {

          if (err) return console.log(err);
          maxShortUrl = people[0].short_url;
          if (maxShortUrl == undefined) maxShortUrl = 0;
          maxShortUrl++;
          const newUrl = new Url({original_url:url,short_url:maxShortUrl});
          newUrl.save(function(err, data) {
            if (err) return console.error(err);
          });

          res.json({ original_url : url, short_url : maxShortUrl});
        });
      }
    });
  }


  
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});