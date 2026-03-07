const mongoose = require('mongoose');

const visaApplicationSchema = new mongoose.Schema({
  // ربط بالعميل
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    index: true
  },

  // ربط بعميل الإدارة (ربط يدوي من لوحة التحكم)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },

  // رقم الطلب التلقائي
  applicationNumber: {
    type: String,
    unique: true
  },

  // حالة الطلب
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'draft'
  },

  // آخر خطوة وصل لها المتقدم
  currentStep: {
    type: Number,
    default: 1
  },

  // نوع التأشيرة
  visaType: {
    type: String,
    enum: ['tourism', 'medical', 'study'],
    default: 'tourism'
  },

  // === Section 1: صورة الجواز ===
  passportImage: String,

  // === Section 2: البيانات الشخصية ===
  personalInfo: {
    fullName: String,
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed']
    },
    birthCity: String,
    dateOfBirth: Date,
    country: String,
    nationality: String,
    nationalId: String,
    hasOtherNationality: {
      type: Boolean,
      default: false
    },
    otherNationalityDetails: String,
    hasResidencyOtherCountry: {
      type: Boolean,
      default: false
    },
    residencyDetails: String
  },

  // === Section 3: بيانات جواز السفر ===
  passportDetails: {
    passportLost: {
      type: Boolean,
      default: false
    },
    passportNumber: String,
    passportIssuePlace: String,
    passportIssueDate: Date,
    passportExpiryDate: Date
  },

  // === Section 4: معلومات الاتصال ===
  contactInfo: {
    streetAddress: String,
    districtCity: String,
    email: String,
    workPhone: String,
    mobilePhone: String,
    previousPhonesEmails: String,
    emails: [String],
    phones: [String]
  },

  // === Section 5: معلومات السفر ===
  travelInfo: {
    expectedArrivalDate: Date,
    travelPurpose: {
      type: String,
      enum: ['tourism', 'study', 'medical', 'official', 'other']
    },
    stayDuration: String,
    stayDurationNumber: Number,
    stayDurationType: {
      type: String,
      enum: ['days', 'weeks', 'months']
    },
    usAddress: String,
    usStreetAddress: String,
    usCity: String,
    usState: String
  },

  // === Section 6: المعلومات المالية ===
  financialInfo: {
    selfPaying: {
      type: Boolean,
      default: true
    },
    sponsorName: String,
    sponsorAddress: String,
    sponsorRelationship: String,
    sponsorPhone: String,
    sponsorEmail: String
  },

  // === Section 7: معلومات المضيف ===
  hostInfo: {
    hostName: String,
    hostAddress: String,
    hostPhone: String,
    hostEmail: String
  },

  // === Section 8: مرافقو السفر ===
  travelCompanions: {
    hasCompanions: {
      type: Boolean,
      default: null
    },
    companions: [{
      companionName: String,
      companionRelationship: String
    }]
  },

  // === Section 9: السفر السابق لأمريكا ===
  previousUSTravel: {
    beenToUS: {
      type: Boolean,
      default: null
    },
    lastUSArrival: Date,
    previousVisaType: String,
    lastVisaIssueDate: Date,
    visaNumber: String,
    sameVisaType: {
      type: Boolean,
      default: null
    },
    fingerprinted: {
      type: Boolean,
      default: null
    },
    visaLostStolen: {
      type: Boolean,
      default: null
    },
    visaCancelled: {
      type: Boolean,
      default: null
    },
    usDriversLicense: {
      type: Boolean,
      default: null
    },
    licenseNumberState: String,
    visaRefused: {
      type: Boolean,
      default: null
    }
  },

  // === Section 10: معلومات العائلة ===
  familyInfo: {
    fatherFullName: String,
    fatherFirstName: String,
    fatherLastName: String,
    fatherDOB: Date,
    motherFullName: String,
    motherFirstName: String,
    motherLastName: String,
    motherDOB: Date,
    hasImmediateRelativesUS: {
      type: Boolean,
      default: null
    },
    hasAnyRelativesUS: {
      type: Boolean,
      default: null
    },
    relativeName: String,
    relativeAddress: String,
    relativePhone: String,
    relativeRelationship: String
  },

  // === Section 11: معلومات الزوج/ة ===
  spouseInfo: {
    spouseGender: {
      type: String,
      enum: ['male', 'female', null]
    },
    spouseFullName: String,
    spouseDOB: Date,
    spouseNationality: String,
    spouseBirthPlace: String,
    spouseAddress: String
  },

  // === Section 12: العمل ===
  employmentInfo: {
    isEmployed: {
      type: Boolean,
      default: null
    },
    currentJobTitle: String,
    currentEmployer: String,
    employerAddress: String,
    monthlySalary: String,
    jobDescription: String,
    currentJobStartDate: Date,
    hasPreviousJob: {
      type: Boolean,
      default: null
    },
    prevEmployerName: String,
    prevEmployerAddress: String,
    prevJobStartDate: Date,
    prevJobEndDate: Date,
    prevJobTitle: String,
    prevManagerName: String
  },

  // === Section 13: التعليم ===
  educationInfo: {
    hasEducation: {
      type: Boolean,
      default: null
    },
    universityName: String,
    universityCity: String,
    universityAddress: String,
    major: String,
    studyStartDate: Date,
    graduationDate: Date
  },

  // === Section 14: تاريخ السفر والخدمة العسكرية ===
  travelHistoryMilitary: {
    countriesVisited5Years: String,
    visitedCountries: [String],
    militaryService: {
      type: Boolean,
      default: null
    },
    militaryRank: String,
    militarySpecialty: String,
    militaryStartDate: Date,
    militaryEndDate: Date
  },

  // === Section 15: بيانات إضافية لتأشيرة الدراسة ===
  studentAdditionalInfo: {
    references: [{
      refName: String,
      refAddress: String,
      refPhone: String
    }]
  },

  // === Section 16: المقابلة والتواصل الاجتماعي ===
  interviewSocialMedia: {
    interviewLanguage: {
      type: String,
      enum: ['arabic', 'english', 'french', 'other', null]
    },
    socialFacebook: String,
    socialInstagram: String,
    socialTwitter: String,
    socialLinkedin: String,
    socialWhatsapp: String,
    socialOther: String
  },

  // === Section 17: الصورة الشخصية ===
  personalPhoto: String,

  // === Section 18: الإقرار والتوقيع ===
  declaration: {
    declarationAccepted: {
      type: Boolean,
      default: false
    },
    declarantName: String,
    signature: String,
    declarationDate: Date
  },

  // ملاحظات الإدارة
  adminNotes: String,

  // تاريخ التقديم
  submittedAt: Date
}, {
  timestamps: true
});

// توليد رقم الطلب تلقائياً قبل الحفظ
visaApplicationSchema.pre('save', async function() {
  if (!this.applicationNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.applicationNumber = `VA-${dateStr}-${rand}`;
  }
});

// Indexes
visaApplicationSchema.index({ applicationNumber: 1 });
visaApplicationSchema.index({ status: 1 });
visaApplicationSchema.index({ createdAt: -1 });
visaApplicationSchema.index({ 'personalInfo.fullName': 'text', 'passportDetails.passportNumber': 'text' });

module.exports = mongoose.model('VisaApplication', visaApplicationSchema);
