// سطر «برمجة وتطوير محمد صالح» في فوتر الموقع العام
// عند الضغط على الاسم يُفتح واتساب على رقم المطوّر
const DEV_WHATSAPP = '966595273180';

const DeveloperCredit = ({ style = {} }) => (
  <p
    className="developer-credit"
    style={{
      margin: '8px 0 0',
      fontSize: '0.8rem',
      opacity: 0.85,
      ...style
    }}
  >
    برمجة وتطوير{' '}
    <a
      href={`https://wa.me/${DEV_WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      title="تواصل عبر واتساب"
      style={{
        color: '#25D366',
        fontWeight: 700,
        textDecoration: 'none'
      }}
    >
      محمد صالح
    </a>
  </p>
);

export default DeveloperCredit;
