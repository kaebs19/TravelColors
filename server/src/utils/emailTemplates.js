/**
 * قوالب البريد الإلكتروني — شركة ألوان المسافر | Travel Colors
 * تصميم RTL عربي احترافي مع شعار + معلومات الشركة
 */

const BRAND = {
  name: 'شركة ألوان المسافر',
  nameEn: 'Travel Colors',
  tagline: 'متخصصون في استخراج تأشيرة الشنقن في وقت قصير',
  color: '#1e3a5f',
  colorLight: '#2a4a73',
  accent: '#2563eb',
  gold: '#d4a853',
  url: 'https://www.trcolors.com',
  logoUrl: 'https://www.trcolors.com/uploads/logo-1771113367995-505445895.jpg',
  email: 'info@trcolors.com',
  visaEmail: 'visa@trcolors.com',
  phone: '+966 55 922 9597',
  licenseNo: '73104877',
  address: 'المملكة العربية السعودية - الرياض، حي الصحافة',
  services: [
    'استخراج تأشيرة الشنقن',
    'حجز طيران',
    'حجوزات فندقية حول العالم',
    'برامج شهر العسل للعرسان',
    'رخص دولية'
  ]
};

const STATUS_LABELS = {
  draft: 'مسودة',
  submitted: 'مُرسل',
  under_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  received: 'مُستلم'
};

const SERVICE_LABELS = {
  visa: 'التأشيرة الأمريكية',
  license: 'الرخصة الدولية',
  'visa-service': 'خدمة التأشيرة'
};

// ──────────────────────────────────────────────────────────────
// Base Layout — التصميم الأساسي
// ──────────────────────────────────────────────────────────────

const baseLayout = (title, content) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.color} 0%, ${BRAND.colorLight} 100%);padding:32px 32px 28px;text-align:center;">
              <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="80" height="80" style="display:block;margin:0 auto 16px;border-radius:12px;border:2px solid rgba(255,255,255,0.2);" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                ${BRAND.name}
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:0.5px;">
                ${BRAND.nameEn}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:36px 32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Company Info Footer -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 12px;color:${BRAND.color};font-size:13px;font-weight:700;text-align:center;">
                ${BRAND.name}
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-align:center;line-height:1.8;">
                ${BRAND.tagline}
              </p>
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-align:center;line-height:1.8;">
                حجز طيران · حجوزات فندقية حول العالم · برامج شهر العسل · رخص دولية
              </p>

              <!-- Contact Info -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:16px;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 6px;color:#374151;font-size:12px;">
                      📞 <a href="tel:+966559229597" style="color:#374151;text-decoration:none;direction:ltr;unicode-bidi:embed;">${BRAND.phone}</a>
                    </p>
                    <p style="margin:0 0 6px;color:#374151;font-size:12px;">
                      ✉️ <a href="mailto:${BRAND.email}" style="color:${BRAND.accent};text-decoration:none;">${BRAND.email}</a>
                    </p>
                    <p style="margin:0 0 6px;color:#374151;font-size:12px;">
                      🌐 <a href="${BRAND.url}" style="color:${BRAND.accent};text-decoration:none;">${BRAND.url}</a>
                    </p>
                    <p style="margin:0 0 6px;color:#9ca3af;font-size:11px;">
                      📍 ${BRAND.address}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- License Badge -->
          <tr>
            <td style="background:${BRAND.color};padding:14px 32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;">
                مرخص من هيئة السياحة رقم: <strong style="color:#ffffff;">${BRAND.licenseNo}</strong>
              </p>
            </td>
          </tr>

        </table>

        <!-- Auto-generated note -->
        <p style="margin:20px 0 0;color:#9ca3af;font-size:11px;text-align:center;">
          هذا البريد مُرسل تلقائياً من نظام ${BRAND.name}، يرجى عدم الرد عليه.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ──────────────────────────────────────────────────────────────
// 1. Welcome Email — ترحيب بعد التسجيل
// ──────────────────────────────────────────────────────────────

const welcomeEmail = (name, overrides = {}) => {
  const subject = overrides.subject || `أهلاً بك في ${BRAND.name}!`;
  const html = baseLayout(subject, `
    <h2 style="margin:0 0 20px;color:${BRAND.color};font-size:22px;text-align:center;">مرحباً بك ${name} 👋</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.8;text-align:center;">
      يسعدنا انضمامك إلى <strong>${BRAND.name}</strong>!<br>
      حسابك جاهز الآن ويمكنك البدء في تقديم طلباتك.
    </p>

    <!-- Services Box -->
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #e2e8f0;">
      <p style="margin:0 0 14px;color:${BRAND.color};font-size:15px;font-weight:700;text-align:center;">✨ خدماتنا المميزة</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:8px 12px;color:#374151;font-size:14px;line-height:1.6;">🛂 استخراج تأشيرة الشنقن في وقت قصير</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#374151;font-size:14px;line-height:1.6;">✈️ حجز طيران بأفضل الأسعار</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#374151;font-size:14px;line-height:1.6;">🏨 حجوزات فندقية حول العالم</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#374151;font-size:14px;line-height:1.6;">💍 برامج شهر العسل للعرسان</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#374151;font-size:14px;line-height:1.6;">🪪 الرخصة الدولية للقيادة</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#374151;font-size:14px;line-height:1.6;">🇺🇸 التأشيرة الأمريكية</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:28px 0 12px;">
      <a href="${BRAND.url}/portal/dashboard" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
        الذهاب للوحة التحكم
      </a>
    </div>

    <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
      للاستفسار تواصل معنا عبر الواتساب: <a href="https://wa.me/966559229597" style="color:${BRAND.accent};text-decoration:none;direction:ltr;unicode-bidi:embed;">${BRAND.phone}</a>
    </p>
  `);

  return { subject, html };
};

// ──────────────────────────────────────────────────────────────
// 2. Password Reset Email — رابط استعادة كلمة المرور
// ──────────────────────────────────────────────────────────────

const passwordResetEmail = (name, resetUrl, overrides = {}) => {
  const subject = overrides.subject || 'استعادة كلمة المرور — ' + BRAND.name;
  const html = baseLayout(subject, `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#fef3c7;width:64px;height:64px;border-radius:50%;line-height:64px;font-size:28px;">🔐</div>
    </div>

    <h2 style="margin:0 0 16px;color:${BRAND.color};font-size:22px;text-align:center;">استعادة كلمة المرور</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.8;text-align:center;">
      مرحباً <strong>${name}</strong>،<br>
      تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
        إعادة تعيين كلمة المرور
      </a>
    </div>

    <div style="background:#fef3c7;border-radius:10px;padding:16px 20px;margin:24px 0;border-right:4px solid #f59e0b;">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.7;">
        ⚠️ هذا الرابط صالح لمدة <strong>30 دقيقة</strong> فقط.<br>
        إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذا البريد بأمان.
      </p>
    </div>

    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
      إذا لم يعمل الزر، انسخ الرابط التالي:<br>
      <a href="${resetUrl}" style="color:${BRAND.accent};font-size:11px;word-break:break-all;">${resetUrl}</a>
    </p>
  `);

  return { subject, html };
};

// ──────────────────────────────────────────────────────────────
// 3. Password Changed Email — تأكيد تغيير كلمة المرور
// ──────────────────────────────────────────────────────────────

const passwordChangedEmail = (name, overrides = {}) => {
  const subject = overrides.subject || 'تم تغيير كلمة المرور — ' + BRAND.name;
  const html = baseLayout(subject, `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#d1fae5;width:64px;height:64px;border-radius:50%;line-height:64px;font-size:28px;">✅</div>
    </div>

    <h2 style="margin:0 0 16px;color:${BRAND.color};font-size:22px;text-align:center;">تم تغيير كلمة المرور</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.8;text-align:center;">
      مرحباً <strong>${name}</strong>،<br>
      نودّ إعلامك بأن كلمة مرور حسابك قد تم تغييرها بنجاح.
    </p>

    <div style="background:#fef2f2;border-radius:10px;padding:16px 20px;margin:24px 0;border-right:4px solid #ef4444;">
      <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.7;">
        🔒 إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً:<br>
        البريد: <a href="mailto:${BRAND.email}" style="color:${BRAND.accent};">${BRAND.email}</a><br>
        الهاتف: <a href="tel:+966559229597" style="color:${BRAND.accent};direction:ltr;unicode-bidi:embed;">${BRAND.phone}</a>
      </p>
    </div>

    <div style="text-align:center;margin:28px 0 12px;">
      <a href="${BRAND.url}/portal/login" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
        تسجيل الدخول
      </a>
    </div>
  `);

  return { subject, html };
};

// ──────────────────────────────────────────────────────────────
// 4. Application Submitted Email — تأكيد تقديم طلب
// ──────────────────────────────────────────────────────────────

const applicationSubmittedEmail = (name, appNumber, serviceType, overrides = {}) => {
  const serviceName = SERVICE_LABELS[serviceType] || serviceType;
  const subject = overrides.subject || `تم استلام طلبك — ${serviceName}`;
  const html = baseLayout(subject, `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#dbeafe;width:64px;height:64px;border-radius:50%;line-height:64px;font-size:28px;">📩</div>
    </div>

    <h2 style="margin:0 0 16px;color:${BRAND.color};font-size:22px;text-align:center;">تم استلام طلبك بنجاح</h2>

    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.8;text-align:center;">
      مرحباً <strong>${name}</strong>،<br>
      شكراً لاختيارك ${BRAND.name}. تم استلام طلبك وسيتم مراجعته من قبل فريقنا المتخصص.
    </p>

    <!-- Order Details Card -->
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #e2e8f0;">
      <p style="margin:0 0 16px;color:${BRAND.color};font-size:14px;font-weight:700;">تفاصيل الطلب:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;width:40%;">الخدمة</td>
          <td style="padding:10px 0;color:#374151;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${serviceName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">رقم الطلب</td>
          <td style="padding:10px 0;color:${BRAND.accent};font-size:14px;font-weight:700;border-bottom:1px solid #e5e7eb;direction:ltr;text-align:right;">${appNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">الحالة</td>
          <td style="padding:10px 0;font-size:14px;">
            <span style="display:inline-block;background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">✓ مُرسل</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.7;text-align:center;">
      سنقوم بإشعارك عند أي تحديث على طلبك عبر البريد الإلكتروني.
    </p>

    <div style="text-align:center;margin:0 0 16px;">
      <a href="${BRAND.url}/portal/dashboard" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
        متابعة الطلب
      </a>
    </div>
  `);

  return { subject, html };
};

// ──────────────────────────────────────────────────────────────
// 5. Status Update Email — إشعار تغيير حالة الطلب
// ──────────────────────────────────────────────────────────────

const statusUpdateEmail = (name, appNumber, newStatus, serviceType, overrides = {}) => {
  const serviceName = SERVICE_LABELS[serviceType] || serviceType;
  const statusLabel = STATUS_LABELS[newStatus] || newStatus;

  const statusStyles = {
    under_review: { bg: '#fffbeb', color: '#d97706', icon: '⏳', badgeBg: '#fef3c7', badgeColor: '#92400e' },
    approved:     { bg: '#f0fdf4', color: '#16a34a', icon: '✅', badgeBg: '#d1fae5', badgeColor: '#065f46' },
    rejected:     { bg: '#fef2f2', color: '#dc2626', icon: '❌', badgeBg: '#fee2e2', badgeColor: '#991b1b' },
    completed:    { bg: '#f5f3ff', color: '#7c3aed', icon: '📦', badgeBg: '#ede9fe', badgeColor: '#5b21b6' },
    received:     { bg: '#ecfeff', color: '#0891b2', icon: '🎉', badgeBg: '#cffafe', badgeColor: '#155e75' }
  };
  const sc = statusStyles[newStatus] || { bg: '#f1f5f9', color: '#64748b', icon: '📋', badgeBg: '#e2e8f0', badgeColor: '#475569' };

  const subject = overrides.subject || `تحديث على طلبك ${appNumber} — ${statusLabel}`;
  const html = baseLayout(subject, `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${sc.badgeBg};width:64px;height:64px;border-radius:50%;line-height:64px;font-size:28px;">${sc.icon}</div>
    </div>

    <h2 style="margin:0 0 16px;color:${BRAND.color};font-size:22px;text-align:center;">تحديث على طلبك</h2>

    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.8;text-align:center;">
      مرحباً <strong>${name}</strong>،<br>
      تم تحديث حالة طلبك لدى ${BRAND.name}:
    </p>

    <!-- Status Card -->
    <div style="background:${sc.bg};border-radius:12px;padding:24px;margin:24px 0;border-right:4px solid ${sc.color};">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid rgba(0,0,0,0.06);width:40%;">الخدمة</td>
          <td style="padding:10px 0;color:#374151;font-size:14px;font-weight:600;border-bottom:1px solid rgba(0,0,0,0.06);">${serviceName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid rgba(0,0,0,0.06);">رقم الطلب</td>
          <td style="padding:10px 0;color:${BRAND.accent};font-size:14px;font-weight:700;border-bottom:1px solid rgba(0,0,0,0.06);direction:ltr;text-align:right;">${appNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">الحالة الجديدة</td>
          <td style="padding:10px 0;font-size:14px;">
            <span style="display:inline-block;background:${sc.badgeBg};color:${sc.badgeColor};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">
              ${sc.icon} ${statusLabel}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${BRAND.url}/portal/dashboard" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
        عرض تفاصيل الطلب
      </a>
    </div>

    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
      للاستفسار تواصل معنا عبر الواتساب: <a href="https://wa.me/966559229597" style="color:${BRAND.accent};text-decoration:none;direction:ltr;unicode-bidi:embed;">${BRAND.phone}</a>
    </p>
  `);

  return { subject, html };
};

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  passwordChangedEmail,
  applicationSubmittedEmail,
  statusUpdateEmail
};
