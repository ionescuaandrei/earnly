import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getFirestore, setDoc } from 'firebase/firestore';

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      }
    ];

    // Add rewards to Firestore
    for (const reward of rewards) {
      await setDoc(doc(db, 'rewards', reward.id), reward);
      console.log(`✅ Added reward: ${reward.title}`);
    }

    // 2. Create sample gift codes for each reward
    for (const reward of rewards) {
      console.log(`🎫 Adding codes for ${reward.title}...`);
      
      // Generate sample codes for testing (5 codes per reward)
      for (let i = 1; i <= 5; i++) {
        const code = {
          code: `${reward.provider.toUpperCase()}-${reward.value}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: 'free',
          reservedBy: null,
          reservedAt: null,
          usedBy: null,
          usedAt: null,
          batch: 'initial_batch',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          createdAt: new Date()
        };
        
        await addDoc(collection(db, `giftCodes/${reward.id}/codes`), code);
      }
      
      console.log(`✅ Added 5 codes for ${reward.title}`);
    }

    console.log('🎉 Database initialized successfully!');
    console.log('');
    console.log('📱 Next steps:');
    console.log('1. Start your app: npx expo start');
    console.log('2. Register a new user');
    console.log('3. Check the Rewards tab to see the catalog');
    console.log('4. Complete a survey to earn credits');
    console.log('5. Try redeeming a reward!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.log('');
    console.log('🔧 This error might be due to:');
    console.log('1. Missing Firebase config in the script');
    console.log('2. Firestore security rules preventing writes');
    console.log('3. Network connectivity issues');
    console.log('');
    console.log('💡 Alternative: Add rewards manually in Firebase Console');
  }
};

// Run the initialization
initializeDatabase();
