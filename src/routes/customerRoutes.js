import express from 'express';
import multer from 'multer';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all customers (admin and employee access)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ msg: 'Access denied. Admin or Employee only.' });
    }
    const customers = await Customer.find({}).populate('createdBy', 'name email');
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Customer registration
router.post('/', auth, upload.array('attachments'), async (req, res) => {
  try {
    const { basicInfo, ownerDetails, declaration } = req.body;
    const attachments = req.files ? req.files.map(f => f.path) : [];

    const newCustomer = new Customer({
      basicInfo: typeof basicInfo === 'string' ? JSON.parse(basicInfo) : basicInfo,
      ownerDetails: typeof ownerDetails === 'string' ? JSON.parse(ownerDetails) : ownerDetails,
      attachments,
      declaration,
      createdBy: req.user.id
    });

    await newCustomer.save();
    res.json({ msg: 'Customer registration submitted successfully', customerId: newCustomer._id });
  } catch (err) {
    console.error('Customer registration error:', err);
    res.status(400).json({ msg: err.message || 'Failed to submit customer registration' });
  }
});

// Get my customer data (customer access only)
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ msg: 'Access denied. Customer only.' });
    }
    const customer = await Customer.findOne({ createdBy: req.user.id });
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer data:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update customer status (admin and employee access)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ msg: 'Access denied. Admin or Employee only.' });
    }
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    console.error('Error updating customer status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/admin/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user role (admin only)
router.patch('/admin/users/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const { role } = req.body;
    if (!['admin', 'employee', 'customer'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
}

export default router;
