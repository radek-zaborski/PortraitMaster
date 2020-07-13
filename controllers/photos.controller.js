const Photo = require('../models/photo.model');
const Voter = require('../models/vote.model');
const requestIp = require('request-ip');

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title.length > 25 || author.length > 50) {
      res.json({message: 'the value provided is too long'})
    }

    let isHTML = RegExp.prototype.test.bind(/(<([^>]+)>)/i);

      if(isHTML(title) == true) {
        throw new Error('Invalid characters');
      }
      
    if(title && author && email && file) {

      const stringCorrect = new RegExp(/(([A-z]|\s)*)/, 'g');
      const correctAuthor = author.match(stringCorrect).join('');
      const correctTitle = title.match(stringCorrect).join('');

      const stringMail = new RegExp(/^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}$/, 'i');
      const correctMail = email.match(stringMail).join('');

      const fileName = file.path.split('/').slice(-1)[0];
      const extFile = fileName.split('.').slice(-1)[0];
      
      if(extFile === 'gif' ||extFile === 'jpg' ||extFile === 'png'){
      const newPhoto = new Photo({ title: correctTitle, author: correctAuthor, email: correctMail, src: fileName, votes: 0 });
      await newPhoto.save();
      res.json(newPhoto);
      }
      else {
        throw new Error('please enter a valid data')
      }
    } else {
      throw new Error('please enter a valid data');
    }

  } catch(err) {
    res.status(500).json(err);
  }
};

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }
};

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const findVote = await Voter.findOne({ user: clientIp });

    if(!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });

    } else if(!findVote) {  
      const newVoter = new Voter({ user: clientIp, votes: [photoToUpdate] });
      newVoter.save();
      console.log('add new Voter', newVoter);

      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });

    } else if(findVote) {
      const isVoted = findVote.votes.includes(photoToUpdate._id);
      
      if (!isVoted) {
        findVote.votes.push(photoToUpdate);
        findVote.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
      } else {
        res.status(500).json({ message: 'sorry, You have voted before' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }
};