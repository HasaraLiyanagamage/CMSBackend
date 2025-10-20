import mongoose from 'mongoose';
const customerSchema = new mongoose.Schema({
  basicInfo: {
    companyName: { type: String, required: true },
    businessRegistrationNumber: { type: String, required: true },
    taxId: String,
    address: { type: String, required: true },
    city: String,
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' },
    phone: { type: String, required: true },
    fax: String,
    email: String,
    website: String,
    businessType: String,
    yearEstablished: String
  },
  ownerDetails: {
    ownerName: { type: String, required: true },
    ownerNIC: { type: String, required: true },
    ownerPassport: String,
    ownerAddress: String,
    ownerPhone: String,
    ownerEmail: String,
    authorizedPerson: String,
    authorizedPersonNIC: String,
    relationship: String
  },
  attachments: [String],
  declaration: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Customer', customerSchema);