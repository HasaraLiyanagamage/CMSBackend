const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Customer = require('../models/Customer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Create or update customer record (customer user must be authenticated)
router.post('/', auth, upload.array('attachments', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const { basicInfo, ownerDetails, declaration } = req.body;
    let customer = await Customer.findOne({ user: userId });
    const attachments = (req.files || []).map(f => '/uploads/' + path.basename(f.path));
    const payload = {
      user: userId,
      basicInfo: basicInfo ? JSON.parse(basicInfo) : {},
      ownerDetails: ownerDetails ? JSON.parse(ownerDetails) : {},
      declaration: declaration === 'true' || declaration === true,
    };
    if(customer){
      customer.basicInfo = payload.basicInfo;
      customer.ownerDetails = payload.ownerDetails;
      customer.declaration = payload.declaration;
      customer.attachments = customer.attachments.concat(attachments);
      await customer.save();
    } else {
      customer = new Customer({...payload, attachments});
      await customer.save();
    }
    res.json({msg:'Customer saved', customer});
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

// Get all customers (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if(req.user.role !== 'admin') return res.status(403).json({msg:'Forbidden'});
    const customers = await Customer.find().populate('user','name email role');
    res.json(customers);
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

// Get my customer (for customer user)
router.get('/me', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    res.json(customer);
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

// Update customer status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if(req.user.role !== 'admin') return res.status(403).json({msg:'Forbidden'});
    const { status } = req.body;
    if(!['pending','approved','rejected'].includes(status)) return res.status(400).json({msg:'Invalid status'});
    const customer = await Customer.findByIdAndUpdate(req.params.id, {status}, {new:true}).populate('user','name email');
    res.json(customer);
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

// Get all users (admin only)
router.get('/admin/users', auth, async (req, res) => {
  try {
    if(req.user.role !== 'admin') return res.status(403).json({msg:'Forbidden'});
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

// Update user role (admin only)
router.patch('/admin/users/:id/role', auth, async (req, res) => {
  try {
    if(req.user.role !== 'admin') return res.status(403).json({msg:'Forbidden'});
    const { role } = req.body;
    if(!['admin','employee','customer'].includes(role)) return res.status(400).json({msg:'Invalid role'});
    const user = await User.findByIdAndUpdate(req.params.id, {role}, {new:true}).select('-password');
    res.json(user);
  } catch(err){ console.error(err); res.status(500).json({msg:'Server error'}); }
});

module.exports = router;
