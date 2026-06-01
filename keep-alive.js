const https = require('https');

// ==========================================
// CONFIGURATION
// ==========================================
// Enter a real test email and password from your Render database below.
const TEST_EMAIL = "your_test_email@example.com"; 
const TEST_PASSWORD = "your_test_password"; 

const BASE_URL = "https://travyn-backend.onrender.com/api/v1";
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

console.log("🚀 Starting Travyn Keep-Alive Bot...");
console.log(`⏰ Ping Interval: Every ${PING_INTERVAL_MS / 1000 / 60} minutes`);

// ==========================================
// KEEP-ALIVE LOGIC
// ==========================================
async function performKeepAlivePing() {
    console.log(`\n[${new Date().toLocaleTimeString()}] ⏳ Waking up server and logging in...`);

    try {
        // Step 1: Login to get JWT Token
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });

        if (!loginResponse.ok) {
            console.error(`❌ Login failed! Server is awake, but credentials might be wrong. Status: ${loginResponse.status}`);
            return;
        }

        const authData = await loginResponse.json();
        const token = authData.token;

        console.log(`✅ Login successful! Token acquired. Fetching profile...`);

        // Step 2: Fetch user profile (Simulates realistic database read)
        const profileResponse = await fetch(`${BASE_URL}/profile/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (profileResponse.ok) {
            console.log(`✅ Profile fetched successfully! Server is hot and ready.`);
        } else {
            console.error(`❌ Failed to fetch profile. Status: ${profileResponse.status}`);
        }

    } catch (error) {
        console.error(`❌ Network Error: Could not reach Render server.`, error.message);
    }
}

// Run immediately once
performKeepAlivePing();

// Run every 10 minutes forever
setInterval(performKeepAlivePing, PING_INTERVAL_MS);
