const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  adminToken: '',
  collectorToken: '',
  customerToken: '',
  testCollectorId: '',
  testCustomerId: '',
  testAccountId: ''
};

// Test functions
const testRoutes = {
  // Test Admin Authentication
  async testAdminAuth() {
    console.log('🔐 Testing Admin Authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'admin123'
      });
      testConfig.adminToken = response.data.token;
      console.log('✅ Admin login successful');
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message);
    }
  },

  // Test Collector Authentication
  async testCollectorAuth() {
    console.log('\n🔐 Testing Collector Authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/auth/collector/login`, {
        collectorId: 'COL001', // Use an existing collector ID
        password: 'password123'
      });
      testConfig.collectorToken = response.data.data.token;
      testConfig.testCollectorId = response.data.data._id;
      console.log('✅ Collector login successful');
    } catch (error) {
      console.log('❌ Collector login failed:', error.response?.data?.message);
    }
  },

  // Test Customer Authentication
  async testCustomerAuth() {
    console.log('\n🔐 Testing Customer Authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/auth/customer/login`, {
        customerId: 'CUST001', // Use an existing customer ID
        password: 'password123'
      });
      testConfig.customerToken = response.data.token;
      testConfig.testCustomerId = response.data.data._id;
      console.log('✅ Customer login successful');
    } catch (error) {
      console.log('❌ Customer login failed:', error.response?.data?.message);
    }
  },

  // Test Collector Routes
  async testCollectorRoutes() {
    console.log('\n👨‍💼 Testing Collector Routes...');
    
    const headers = { Authorization: `Bearer ${testConfig.collectorToken}` };

    try {
      // Test dashboard
      const dashboard = await axios.get(`${BASE_URL}/collector/dashboard`, { headers });
      console.log('✅ Collector dashboard working');

      // Test customers
      const customers = await axios.get(`${BASE_URL}/collector/customers`, { headers });
      console.log('✅ Get customers working');

      // Test collections
      const collections = await axios.get(`${BASE_URL}/collector/collections`, { headers });
      console.log('✅ Get collections working');

      // Test withdrawals
      const withdrawals = await axios.get(`${BASE_URL}/collector/withdrawals`, { headers });
      console.log('✅ Get withdrawals working');

      // Test statements
      const statements = await axios.get(`${BASE_URL}/collector/statements`, { headers });
      console.log('✅ Get statements working');

      // Test feedback
      const feedback = await axios.get(`${BASE_URL}/collector/feedback`, { headers });
      console.log('✅ Get feedback working');

    } catch (error) {
      console.log('❌ Collector route failed:', error.response?.data?.message);
    }
  },

  // Test Withdrawal Routes
  async testWithdrawalRoutes() {
    console.log('\n💰 Testing Withdrawal Routes...');
    
    const customerHeaders = { Authorization: `Bearer ${testConfig.customerToken}` };
    const collectorHeaders = { Authorization: `Bearer ${testConfig.collectorToken}` };

    try {
      // Test create withdrawal (customer)
      const withdrawalData = {
        accountId: testConfig.testAccountId,
        amount: 1000,
        reason: 'Emergency funds needed'
      };
      const createWithdrawal = await axios.post(`${BASE_URL}/withdrawals`, withdrawalData, { headers: customerHeaders });
      console.log('✅ Create withdrawal working');

      // Test get customer withdrawals
      const myWithdrawals = await axios.get(`${BASE_URL}/withdrawals/customer/my-requests`, { headers: customerHeaders });
      console.log('✅ Get customer withdrawals working');

      // Test get collector withdrawals
      const collectorWithdrawals = await axios.get(`${BASE_URL}/withdrawals/collector/pending`, { headers: collectorHeaders });
      console.log('✅ Get collector withdrawals working');

    } catch (error) {
      console.log('❌ Withdrawal route failed:', error.response?.data?.message);
    }
  },

  // Test Feedback Routes
  async testFeedbackRoutes() {
    console.log('\n💬 Testing Feedback Routes...');
    
    const customerHeaders = { Authorization: `Bearer ${testConfig.customerToken}` };
    const collectorHeaders = { Authorization: `Bearer ${testConfig.collectorToken}` };

    try {
      // Test create feedback (customer)
      const feedbackData = {
        type: 'suggestion',
        subject: 'Improve mobile app',
        message: 'Please add more features to the mobile application',
        rating: 4
      };
      const createFeedback = await axios.post(`${BASE_URL}/feedback`, feedbackData, { headers: customerHeaders });
      console.log('✅ Create feedback working');

      // Test get customer feedback
      const myFeedback = await axios.get(`${BASE_URL}/feedback/customer/my-feedback`, { headers: customerHeaders });
      console.log('✅ Get customer feedback working');

      // Test get collector feedback
      const collectorFeedback = await axios.get(`${BASE_URL}/feedback/collector`, { headers: collectorHeaders });
      console.log('✅ Get collector feedback working');

    } catch (error) {
      console.log('❌ Feedback route failed:', error.response?.data?.message);
    }
  },

  // Test Statement Routes
  async testStatementRoutes() {
    console.log('\n📊 Testing Statement Routes...');
    
    const customerHeaders = { Authorization: `Bearer ${testConfig.customerToken}` };
    const collectorHeaders = { Authorization: `Bearer ${testConfig.collectorToken}` };

    try {
      // Test get customer statements
      const myStatements = await axios.get(`${BASE_URL}/statements/customer/my-statements`, { headers: customerHeaders });
      console.log('✅ Get customer statements working');

      // Test get collector statements
      const collectorStatements = await axios.get(`${BASE_URL}/statements/collector`, { headers: collectorHeaders });
      console.log('✅ Get collector statements working');

    } catch (error) {
      console.log('❌ Statement route failed:', error.response?.data?.message);
    }
  },

  // Test Payment Routes
  async testPaymentRoutes() {
    console.log('\n💳 Testing Payment Routes...');
    
    const customerHeaders = { Authorization: `Bearer ${testConfig.customerToken}` };
    const collectorHeaders = { Authorization: `Bearer ${testConfig.collectorToken}` };

    try {
      // Test get customer payments
      const myPayments = await axios.get(`${BASE_URL}/payments/customer/my-payments`, { headers: customerHeaders });
      console.log('✅ Get customer payments working');

      // Test get collector payments
      const allPayments = await axios.get(`${BASE_URL}/payments`, { headers: collectorHeaders });
      console.log('✅ Get all payments working');

    } catch (error) {
      console.log('❌ Payment route failed:', error.response?.data?.message);
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Route Tests...\n');

  await testRoutes.testAdminAuth();
  await testRoutes.testCollectorAuth();
  await testRoutes.testCustomerAuth();
  
  if (testConfig.collectorToken) {
    await testRoutes.testCollectorRoutes();
    await testRoutes.testWithdrawalRoutes();
    await testRoutes.testFeedbackRoutes();
    await testRoutes.testStatementRoutes();
    await testRoutes.testPaymentRoutes();
  }

  console.log('\n🎉 Route testing completed!');
}

runAllTests();