const runFullTest = async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const registerUrl = 'http://localhost:5001/api/auth/register';
  const verifyUrl = 'http://localhost:5001/api/auth/verify-otp';
  const profileUrl = 'http://localhost:5001/api/profile';

  try {
    console.log(`1. Registering user ${email}...`);
    const regRes = await fetch(registerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email, password: 'password123' })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status, regData);

    const mongoose = require('mongoose');
    console.log('Connecting to MongoDB to read OTP...');
    await mongoose.connect('mongodb://localhost:27017/fitness');
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      verificationOtp: String
    }));
    
    const dbUser = await User.findOne({ email });
    const otp = dbUser.verificationOtp;
    console.log(`Found OTP in DB: ${otp}`);
    await mongoose.disconnect();

    console.log('\n2. Verifying OTP...');
    const verRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const verData = await verRes.json();
    console.log('Verify Status:', verRes.status, verData);
    const token = verData.token;

    console.log('\n3. Fetching profile (should be null initially)...');
    const getResponse1 = await fetch(profileUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData1 = await getResponse1.json();
    console.log('Get Profile Status:', getResponse1.status);
    console.log('Get Profile Body:', getData1);

    console.log('\n4. Creating/Saving Profile...');
    const putResponse = await fetch(profileUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Kayden Reed',
        age: 26,
        gender: 'male',
        weightKg: 94.2,
        heightCm: 188
      })
    });
    const putData = await putResponse.json();
    console.log('Create Profile Status:', putResponse.status);
    console.log('Create Profile Body:', putData);

    console.log('\n5. Fetching Profile again...');
    const getResponse2 = await fetch(profileUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData2 = await getResponse2.json();
    console.log('Get Profile Status:', getResponse2.status);
    console.log('Get Profile Body:', getData2);

  } catch (err) {
    console.error('Error:', err);
  }
};

runFullTest();
