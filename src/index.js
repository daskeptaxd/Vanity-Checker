require('dotenv').config({ path: '../config/.env' });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const CONFIG = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    VANITY_FILE: path.join(__dirname, '../data/vanity.txt'),
    AVAILABLE_FILE: path.join(__dirname, '../data/available.txt'),
    PROXY_FILE: path.join(__dirname, '../config/PROXY_LIST.txt'),
    INVITE_API_URL: 'https://discord.com/api/v9/invites/',
    REQUEST_DELAY: 1000
};

// Proxy management
let proxies = [];
let currentProxyIndex = 0;

/**
 * Delays execution for the specified time
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} Resolves after delay
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads proxies from config file
 * @returns {boolean} True if loaded, false otherwise
 * @description Reads and parses proxy list in ip:port format (can be changed)
 */
const loadProxies = () => {
    try {
        if (!fs.existsSync(CONFIG.PROXY_FILE)) {
            console.log('[INFO] No proxy file found, using direct connection');
            return false;
        }

        const proxyData = fs.readFileSync(CONFIG.PROXY_FILE, 'utf8');
        proxies = proxyData
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.includes(':'))
            .map(proxy => `http://${proxy}`);

        if (proxies.length > 0) {
            console.log(`[INFO] Loaded ${proxies.length} proxies`);
            return true;
        }

        console.log('[INFO] No valid proxies found, using direct connection');
        return false;
    } catch (error) {
        console.log(`[WARN] Failed to load proxies: ${error.message}`);
        return false;
    }
};

/**
 * Gets next proxy from the rotation pool
 * @returns {string|null} Proxy URL or null if none available
 * @description Round-robin proxy rotation
 */
const getNextProxy = () => {
    if (proxies.length === 0) return null;
    const proxy = proxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
    return proxy;
};

/**
 * Checks if a  vanity URL is available
 * @param {string} vanity - Vanity code to check
 * @description Logs result and saves available ones to .txt
 */
const checkVanity = async (vanity) => {
    try {
        const proxy = getNextProxy();
        const config = { timeout: 5000 };

        if (proxy) {
            const agent = new HttpsProxyAgent(proxy);
            config.httpsAgent = agent;
            config.httpAgent = agent;
        }

        await axios.get(`${CONFIG.INVITE_API_URL}${vanity}`, config);
        console.log(`[TAKEN] ${vanity}`);
    } catch (error) {
        if (error.response?.status === 404) {
            fs.appendFileSync(CONFIG.AVAILABLE_FILE, `${vanity}\n`);
            console.log(`[AVAILABLE] ${vanity}`);
        } else {
            console.log(`[ERROR] ${vanity} - ${error.message}`);
        }
    }
};

/**
 * Main execution function
 * @description Loads vanities from file and checks each one
 * @async Processes vanity list 
 */
const main = async () => {
    try {
        console.log('[INFO] Starting Discord Vanity URL Checker...\n');

        loadProxies();

        if (!fs.existsSync(CONFIG.VANITY_FILE)) {
            console.log(`[ERROR] ${CONFIG.VANITY_FILE} not found. Please create it and add vanity URLs to check.`);
            process.exit(1);
        }

        if (fs.existsSync(CONFIG.AVAILABLE_FILE)) {
            fs.unlinkSync(CONFIG.AVAILABLE_FILE);
        }

        const vanityList = fs.readFileSync(CONFIG.VANITY_FILE, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);

        if (vanityList.length === 0) {
            console.log(`[ERROR] No vanity URLs found in ${CONFIG.VANITY_FILE}`);
            process.exit(1);
        }

        console.log(`[INFO] Checking ${vanityList.length} vanity URLs...`);
        console.log(`[INFO] Available vanities will be saved to ${CONFIG.AVAILABLE_FILE}\n`);

        for (let i = 0; i < vanityList.length; i++) {
            await checkVanity(vanityList[i]);

            if (i < vanityList.length - 1) {
                await sleep(CONFIG.REQUEST_DELAY);
            }
        }

        console.log('\n[INFO] Vanity check completed!');

        if (fs.existsSync(CONFIG.AVAILABLE_FILE)) {
            const availableVanities = fs.readFileSync(CONFIG.AVAILABLE_FILE, 'utf8')
                .split('\n')
                .filter(line => line.trim());

            if (availableVanities.length > 0) {
                console.log(`\n[SUCCESS] Found ${availableVanities.length} available vanity URL(s):`);
                availableVanities.forEach(vanity => console.log(`  - ${vanity}`));
            } else {
                console.log('\n[INFO] No available vanity URLs found.');
            }
        } else {
            console.log('\n[INFO] No available vanity URLs found.');
        }
    } catch (error) {
        console.log(`[ERROR] ${error.message}`);
        process.exit(1);
    }
};

(async () => {
    await main();
})();