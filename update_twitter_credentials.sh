#!/bin/bash

# Script para actualizar credenciales de Twitter en BaseGuardian
# Uso: ./update_twitter_credentials.sh

echo "🐦 BaseGuardian - Twitter Credentials Setup"
echo "==========================================="
echo ""
echo "Ve a: https://developer.twitter.com/en/portal/dashboard"
echo ""

# Pedir credenciales
read -p "📌 API Key (Consumer Key): " API_KEY
read -p "📌 API Secret (Consumer Secret): " API_SECRET
read -p "📌 Access Token: " ACCESS_TOKEN
read -p "📌 Access Token Secret: " ACCESS_SECRET
read -p "📌 Bearer Token (opcional): " BEARER_TOKEN

# Validar que no estén vacías
if [ -z "$API_KEY" ] || [ -z "$API_SECRET" ] || [ -z "$ACCESS_TOKEN" ] || [ -z "$ACCESS_SECRET" ]; then
    echo "❌ Error: Todas las credenciales son necesarias (excepto Bearer Token)"
    exit 1
fi

# Backup del .env actual
cp .env .env.backup.$(date +%s)
echo "✅ Backup creado: .env.backup.$(date +%s)"

# Actualizar .env
sed -i "s|TWITTER_API_KEY=.*|TWITTER_API_KEY=$API_KEY|" .env
sed -i "s|TWITTER_API_SECRET=.*|TWITTER_API_SECRET=$API_SECRET|" .env
sed -i "s|TWITTER_ACCESS_TOKEN=.*|TWITTER_ACCESS_TOKEN=$ACCESS_TOKEN|" .env
sed -i "s|TWITTER_ACCESS_SECRET=.*|TWITTER_ACCESS_SECRET=$ACCESS_SECRET|" .env

if [ -n "$BEARER_TOKEN" ]; then
    sed -i "s|TWITTER_BEARER_TOKEN=.*|TWITTER_BEARER_TOKEN=$BEARER_TOKEN|" .env
fi

# Asegurar que Twitter está habilitado
sed -i "s|ENABLE_TWITTER=.*|ENABLE_TWITTER=true|" .env

echo ""
echo "✅ Credenciales actualizadas en .env"
echo ""
echo "🔄 Ahora reinicia el agente:"
echo "   npm run stop"
echo "   npm run start"
echo ""
