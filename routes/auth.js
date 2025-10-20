const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register (employee or customer) - role provided in body
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if(!name || !email || !password) return res.status(400).json({msg:'Missing fields'});
    const existing = await User.findOne({email});
    if(existing) return res.status(400).json({msg:'Email exists'});
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({name, email, password:hash, role: role || 'customer'});
    await user.save();
    res.json({msg:'User registered', userId: user._id});
  } catch(err){ 
    console.error(err); 
    if(err.code === 11000) {
      res.status(400).json({msg:'An account with this email already exists'});
    } else {
      res.status(500).json({msg:'Server error'}); 
    }
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({msg:'Invalid credentials'});
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(400).json({msg:'Invalid credentials'});
    const token = jwt.sign({id:user._id, role:user.role}, process.env.JWT_SECRET || 'secret', {expiresIn:'7d'});
    res.json({token, user:{id:user._id, name:user.name, email:user.email, role:user.role}});
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

module.exports = router;
