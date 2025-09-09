"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDXpN6QYVLVhAhWKD9XGQYA-C9m78gxpY8",
    authDomain: "earnly-5d310.firebaseapp.com",
    projectId: "earnly-5d310",
    storageBucket: "earnly-5d310.firebasestorage.app",
    messagingSenderId: "171420312697",
    appId: "1:171420312697:web:6d6f5a8140a3bef8bae0a8",
    measurementId: "G-0F3TMPP96J"
};
const app = (0, app_1.initializeApp)(firebaseConfig);
const db = (0, firestore_1.getFirestore)(app);
// Sample data to initialize collections
const initializeDatabase = async () => {
    try {
        console.log('🚀 Initializing Earnly database...');
        // 1. Create sample rewards catalog
        const rewards = [
            {
                id: 'amazon-5',
                title: 'Amazon Gift Card $5',
                description: 'Instant digital delivery to your email',
                provider: 'amazon',
                price: 500,
                value: 5,
                currency: 'USD',
                region: ['US', 'CA', 'RO'],
                category: 'giftcard',
                active: true,
                stock: 50,
                image: 'https://cdn.earnly.app/amazon-5.png',
                terms: 'Code expires in 1 year from purchase date',
                estimatedDelivery: 'instant',
                instructions: 'Redeem at amazon.com/gift-cards',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'amazon-10',
                title: 'Amazon Gift Card $10',
                description: 'Instant digital delivery to your email',
                provider: 'amazon',
                price: 1000,
                value: 10,
                currency: 'USD',
                region: ['US', 'CA', 'RO'],
                category: 'giftcard',
                active: true,
                stock: 30,
                image: 'https://cdn.earnly.app/amazon-10.png',
                terms: 'Code expires in 1 year from purchase date',
                estimatedDelivery: 'instant',
                instructions: 'Redeem at amazon.com/gift-cards',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'paypal-5',
                title: 'PayPal $5',
                description: 'Instant PayPal transfer to your account',
                provider: 'paypal',
                price: 500,
                value: 5,
                currency: 'USD',
                region: ['US', 'CA', 'RO', 'UK', 'DE'],
                category: 'paypal',
                active: true,
                stock: 100,
                image: 'https://cdn.earnly.app/paypal-5.png',
                terms: 'Transfer processed within 24 hours',
                estimatedDelivery: '1-24h',
                instructions: 'Enter your PayPal email when redeeming',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'steam-20',
                title: 'Steam Wallet $20',
                description: 'Steam digital wallet code',
                provider: 'steam',
                price: 2000,
                value: 20,
                currency: 'USD',
                region: ['US', 'CA', 'RO', 'UK', 'DE'],
                category: 'giftcard',
                active: true,
                stock: 25,
                image: 'https://cdn.earnly.app/steam-20.png',
                terms: 'Code expires in 1 year from purchase date',
                estimatedDelivery: 'instant',
                instructions: 'Redeem in Steam client under "Add funds"',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'crypto-btc',
                title: 'Bitcoin Transfer',
                description: 'Minimum $10 equivalent Bitcoin transfer',
                provider: 'bitcoin',
                price: 1000,
                value: 10,
                currency: 'USD',
                region: ['US', 'CA', 'RO', 'UK', 'DE'],
                category: 'crypto',
                active: false, // Coming soon
                stock: 0,
                image: 'https://cdn.earnly.app/bitcoin.png',
                terms: 'Bitcoin transfers processed within 1-3 business days',
                estimatedDelivery: '1-3days',
                instructions: 'Provide your Bitcoin wallet address when redeeming',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        // Add rewards to Firestore
        for (const reward of rewards) {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'rewards', reward.id), reward);
            console.log(`✅ Added reward: ${reward.title}`);
        }
        // 2. Create sample gift codes for each active reward
        for (const reward of rewards) {
            if (!reward.active || reward.stock === 0)
                continue;
            const codesCollection = (0, firestore_1.collection)(db, `giftCodes/${reward.id}/codes`);
            // Generate sample codes for testing (max 5 for demo)
            const codeCount = Math.min(reward.stock, 5);
            for (let i = 1; i <= codeCount; i++) {
                const code = {
                    code: `${reward.provider.toUpperCase()}-${reward.value}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${i.toString().padStart(3, '0')}`,
                    status: 'free',
                    reservedBy: null,
                    reservedAt: null,
                    usedBy: null,
                    usedAt: null,
                    batch: 'initial_batch_2024',
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                    createdAt: new Date()
                };
                await (0, firestore_1.addDoc)(codesCollection, code);
            }
            console.log(`✅ Added ${codeCount} codes for ${reward.title}`);
        }
        // 3. Create admin configuration
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'config', 'app'), {
            version: '1.0.0',
            maintenanceMode: false,
            features: {
                redemption: true,
                referrals: false,
                notifications: true
            },
            updatedAt: new Date()
        });
        console.log('✅ Added app configuration');
        console.log('');
        console.log('🎉 Database initialized successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
        console.log('2. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
        console.log('3. Deploy Cloud Functions: firebase deploy --only functions');
        console.log('4. Add real gift codes using admin helpers');
        console.log('5. Test the complete flow!');
        console.log('');
    }
    catch (error) {
        console.error('❌ Error initializing database:', error);
    }
};
// Run the initialization
initializeDatabase();
