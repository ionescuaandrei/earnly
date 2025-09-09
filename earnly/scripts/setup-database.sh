#!/bin/bash

echo "🚀 Setting up Earnly database schema..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase."
    echo "Login with: firebase login"
    exit 1
fi

echo "📋 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo "⚡ Deploying Cloud Functions..."
firebase deploy --only functions

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Cloud Functions"
    exit 1
fi

echo "🗄️ Initializing database with sample data..."
npx ts-node scripts/initDatabase.ts

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🎯 Your Earnly app is ready with:"
echo "• Firestore security rules deployed"
echo "• Database indexes configured"
echo "• Cloud Functions for redemption"
echo "• Sample rewards catalog"
echo "• Gift codes inventory"
echo ""
echo "📱 You can now:"
echo "1. Test user registration"
echo "2. Complete BitLabs surveys"
echo "3. Redeem rewards"
echo "4. View earning history"
echo ""
