#!/bin/bash
# سكربت تحديث TrColors على السيرفر
# الاستخدام: ./deploy.sh أو bash deploy.sh

set -e

# تحميل nvm (npm/node) لجلسات SSH غير التفاعلية
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# إضافة مسارات شائعة لـ npm كاحتياط إذا لم يتوفر nvm
export PATH="$PATH:/usr/local/bin:/usr/bin:/root/.nvm/versions/node/*/bin"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ خطأ: npm غير موجود في PATH"
  echo "PATH=$PATH"
  echo "NVM_DIR=$NVM_DIR"
  exit 1
fi

echo "🚀 بدء تحديث TrColors..."
echo "📦 npm: $(command -v npm) ($(npm -v))"

cd /root/trcolors-new

# سحب آخر التحديثات
echo "📥 سحب التحديثات من Git..."
git pull origin main

# بناء لوحة التحكم (dashboard)
echo "🔨 بناء لوحة التحكم..."
cd client
cat > .env << 'EOF'
REACT_APP_API_URL=https://dashboard.trcolors.com/api
EOF
npm run build
cp -r build/* /var/www/new-dashboard-trcolors/
echo "✅ لوحة التحكم جاهزة"

# بناء الموقع العام
echo "🔨 بناء الموقع العام..."
cat > .env << 'EOF'
REACT_APP_API_URL=https://www.trcolors.com/api
EOF
npm run build
cp -r build/* /var/www/new-site-trcolors/
echo "✅ الموقع العام جاهز"

# إعادة تشغيل السيرفر
echo "🔄 إعادة تشغيل API..."
cd ../server
pm2 restart trcolors-new-api

echo ""
echo "🎉 تم التحديث بنجاح!"
