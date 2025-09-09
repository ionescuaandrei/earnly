#!/bin/bash

echo "🚀 Setting up Earnly database schema..."

# Add sample rewards using firebase firestore:set
echo "📦 Adding sample rewards..."

firebase firestore:set rewards/amazon-5 '{
  "title": "Amazon Gift Card $5",
  "description": "Instant digital delivery to your email",
  "provider": "amazon",
  "price": 500,
  "value": 5,
  "currency": "USD",
  "region": ["US", "CA", "RO"],
  "category": "giftcard",
  "active": true,
  "stock": 50,
  "image": "https://cdn.earnly.app/amazon-5.png",
  "terms": "Code expires in 1 year from purchase date",
  "estimatedDelivery": "instant",
  "instructions": "Redeem at amazon.com/gift-cards"
}'

firebase firestore:set rewards/amazon-10 '{
  "title": "Amazon Gift Card $10",
  "description": "Instant digital delivery to your email", 
  "provider": "amazon",
  "price": 1000,
  "value": 10,
  "currency": "USD",
  "region": ["US", "CA", "RO"],
  "category": "giftcard",
  "active": true,
  "stock": 30,
  "image": "https://cdn.earnly.app/amazon-10.png",
  "terms": "Code expires in 1 year from purchase date",
  "estimatedDelivery": "instant",
  "instructions": "Redeem at amazon.com/gift-cards"
}'

firebase firestore:set rewards/steam-20 '{
  "title": "Steam Gift Card $20",
  "description": "Perfect for gaming purchases",
  "provider": "steam", 
  "price": 2000,
  "value": 20,
  "currency": "USD",
  "region": ["US", "CA", "RO", "EU"],
  "category": "gaming",
  "active": true,
  "stock": 25,
  "image": "https://cdn.earnly.app/steam-20.png",
  "terms": "Use on Steam platform only",
  "estimatedDelivery": "instant",
  "instructions": "Redeem at store.steampowered.com"
}'

# Add app settings
echo "⚙️  Adding app settings..."

firebase firestore:set settings/app '{
  "version": "1.0.0",
  "maintenanceMode": false,
  "supportedCountries": ["US", "CA", "RO", "EU"],
  "minimumRedemption": 100,
  "maximumRedemption": 10000,
  "creditsPerDollar": 100
}'

firebase firestore:set settings/bitlabs '{
  "enabled": true,
  "webhookSecret": "your-webhook-secret",
  "apiKey": "your-api-key",
  "baseUrl": "https://api.bitlabs.ai"
}'

echo "✅ Database setup complete!"
echo "🔗 Check your Firebase Console: https://console.firebase.google.com/project/earnly-5d310/firestore"
