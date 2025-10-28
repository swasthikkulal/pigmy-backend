const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCollectorAuth() {
  console.log('🔐 Testing Collector Auth without .env file...\n');
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    const login = await axios.post(`${BASE_URL}/auth/collector/login`, {
      username: 'virat@gmail.com',
      password: '123456789'
    });
    
    const token = login.data.data.token;
    console.log('✅ Login successful');
    console.log('   Token received');
    
    // 2. Test protected route
    console.log('\n2. Testing protected route...');
    const response = await axios.get(`${BASE_URL}/collector/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Protected route working!');
    console.log('   Dashboard data received');
    console.log('   Response:', response.data);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testCollectorAuth();