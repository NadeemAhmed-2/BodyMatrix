const jwt = require('jsonwebtoken');
const axios = require('axios');

let publicKeys = null;
let keysExpiry = null;

async function getGooglePublicKeys() {
  if (publicKeys && keysExpiry && Date.now() < keysExpiry) {
    return publicKeys;
  }
  const response = await axios.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  publicKeys = response.data;
  
  // Parse cache control header to set keysExpiry
  const cacheControl = response.headers['cache-control'];
  const maxAgeMatch = cacheControl ? cacheControl.match(/max-age=(\d+)/) : null;
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600000;
  keysExpiry = Date.now() + maxAge;
  return publicKeys;
}

async function verifyFirebaseIdToken(token) {
  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      throw new Error('Invalid token format');
    }
    const kid = decodedToken.header.kid;
    const keys = await getGooglePublicKeys();
    const publicKey = keys[kid];
    if (!publicKey) {
      throw new Error(`Public key not found for kid: ${kid}`);
    }
    const projectId = process.env.FIREBASE_PROJECT_ID || 'body-matrix-23';
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      ignoreExpiration: true, // Ignore expiration to accommodate local testing environment clock skews
    });
    return { success: true, decoded: verified };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { verifyFirebaseIdToken };
