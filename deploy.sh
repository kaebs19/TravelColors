#!/bin/bash
# سكربت تحديث TrColors على السيرفر
# الاستخدام: ./deploy.sh أو bash deploy.sh

set -e

echo "🚀 بدء تحديث TrColors..."

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
