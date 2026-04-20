/*
    script.js — MY_ENCRYP/DECRYP_APP
    all the javascript logic for my encryption app
    i tried to write clean functions with good comments
*/


// =========================================================
//   TAB SWITCHING
// =========================================================

// this function shows the selected tab and hides all others
function showTab(tabName) {

    // all tab content IDs
    var allTabs = ['sym', 'asym', 'hash', 'enc', 'img'];

    // hide every tab panel first
    for (var i = 0; i < allTabs.length; i++) {
        var panel = document.getElementById('p-' + allTabs[i]);
        panel.style.display = 'none';
    }

    // remove active class from all tab buttons
    var tabButtons = document.querySelectorAll('.tab');
    for (var j = 0; j < tabButtons.length; j++) {
        tabButtons[j].classList.remove('active');
    }

    // show the selected tab
    document.getElementById('p-' + tabName).style.display = '';

    // add active class to the clicked button
    var selectedIndex = allTabs.indexOf(tabName);
    tabButtons[selectedIndex].classList.add('active');
}


// =========================================================
//   STATUS HELPER
//   shows ok / err / info message below a section
// =========================================================

function showStatus(elementId, message, type) {

    var el = document.getElementById(elementId);

    if (!el) return; // safety check

    // pick css class based on type
    var cssClass = 'err'; // default is error

    if (type === 'ok') {
        cssClass = 'ok';
    } else if (type === 'info') {
        cssClass = 'info-msg';
    }

    // build the status html
    el.innerHTML = '<div class="status ' + cssClass + '">'
                 + '<div class="sdot"></div>'
                 + message
                 + '</div>';
}


// =========================================================
//   COPY TO CLIPBOARD
// =========================================================

function copyText(elementId) {
    try {
        var text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text);
    } catch (e) {
        console.log('Copy failed:', e);
    }
}


// =========================================================
//   SYMMETRIC — ALGORITHM TIP
//   updates the tip text when user changes algorithm
// =========================================================

// tip messages for each algorithm
var algoTips = {
    aes:     'AES-256 is the gold standard. Key stretched via PBKDF2 with 100,000 iterations before use.',
    caesar:  'Caesar cipher shifts each letter by a numeric value (0–25). Historical — not secure for real data.',
    vigenere:'Vigenère uses a repeating keyword to shift letters. Stronger than Caesar but still breakable.',
    xor:     'XOR cipher XORs each byte with the key cyclically. Fast and educational — use AES for real security.'
};

function updateAlgoTip() {
    var selectedAlgo = document.getElementById('s-algo').value;
    document.getElementById('algo-tip').textContent = algoTips[selectedAlgo];
}


// =========================================================
//   SYMMETRIC — PASSWORD STRENGTH BAR
// =========================================================

// colors for each strength level (red → orange → green → dark green)
var strengthColors = ['#c0392b', '#e67e22', '#27ae60', '#1a6b3a'];

function updateStrength() {

    var key = document.getElementById('s-key').value;
    var strength = 0;

    // check length
    if (key.length >= 6)  strength = 1;
    if (key.length >= 10) strength = 2;

    // check length + uppercase + number
    if (key.length >= 14 && /[A-Z]/.test(key) && /[0-9]/.test(key)) {
        strength = 3;
    }

    // check all of the above + special character
    if (key.length >= 20 && /[^a-zA-Z0-9]/.test(key)) {
        strength = 4;
    }

    // color the bar segments
    for (var i = 1; i <= 4; i++) {
        var seg = document.getElementById('ss' + i);
        if (i <= strength) {
            seg.style.background = strengthColors[strength - 1];
        } else {
            seg.style.background = '#b8976a'; // unlit segment = beige
        }
    }
}


// =========================================================
//   SYMMETRIC — AES KEY DERIVATION
//   uses PBKDF2 to turn password into a proper AES key
// =========================================================

async function deriveAESKey(password, salt) {

    var encoder = new TextEncoder();

    // first import the password as raw key material
    var keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // now derive a 256-bit AES key from it
    var derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );

    return derivedKey;
}


// =========================================================
//   SYMMETRIC — ENCRYPT
// =========================================================

async function symEncrypt() {

    var algo = document.getElementById('s-algo').value;
    var key  = document.getElementById('s-key').value;
    var txt  = document.getElementById('s-in').value;
    var out  = document.getElementById('s-out');

    // basic validation
    if (!txt || !key) {
        showStatus('s-st', 'Please enter both text and a key.', 'err');
        return;
    }

    try {

        // ---- AES-256 ----
        if (algo === 'aes') {

            var encoder = new TextEncoder();

            // generate random salt (16 bytes) and IV (12 bytes)
            var salt = crypto.getRandomValues(new Uint8Array(16));
            var iv   = crypto.getRandomValues(new Uint8Array(12));

            var aesKey = await deriveAESKey(key, salt);

            // encrypt the text
            var ciphertext = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                encoder.encode(txt)
            );

            // pack salt + iv + ciphertext together into one array
            var combined = new Uint8Array(28 + ciphertext.byteLength);
            combined.set(salt);         // bytes 0-15
            combined.set(iv, 16);       // bytes 16-27
            combined.set(new Uint8Array(ciphertext), 28); // rest

            // convert to base64 string for easy display
            var base64 = btoa(String.fromCharCode.apply(null, combined));
            out.textContent = base64;

        // ---- Caesar Cipher ----
        } else if (algo === 'caesar') {

            var shift = (parseInt(key) || 3) % 26;

            out.textContent = txt.replace(/[a-zA-Z]/g, function(ch) {
                var base = (ch < 'a') ? 65 : 97; // uppercase or lowercase
                return String.fromCharCode(
                    (ch.charCodeAt(0) - base + shift) % 26 + base
                );
            });

        // ---- Vigenere Cipher ----
        } else if (algo === 'vigenere') {

            // key must only have letters
            var vKey = key.toLowerCase().replace(/[^a-z]/g, '');

            if (!vKey) {
                showStatus('s-st', 'Key must contain at least one letter.', 'err');
                return;
            }

            var keyIndex = 0;

            out.textContent = txt.replace(/[a-zA-Z]/g, function(ch) {
                var base  = (ch < 'a') ? 65 : 97;
                var shift = vKey[keyIndex % vKey.length].charCodeAt(0) - 97;
                keyIndex++;
                return String.fromCharCode(
                    (ch.charCodeAt(0) - base + shift) % 26 + base
                );
            });

        // ---- XOR Cipher ----
        } else {

            var xorIndex = 0;

            out.textContent = Array.from(txt).map(function(ch) {
                var xorred = ch.charCodeAt(0) ^ key[xorIndex % key.length].charCodeAt(0);
                xorIndex++;
                return String.fromCharCode(xorred);
            }).join('');
        }

        showStatus('s-st', 'Encrypted successfully.', 'ok');

    } catch (e) {
        showStatus('s-st', 'Error: ' + e.message, 'err');
    }
}


// =========================================================
//   SYMMETRIC — DECRYPT
// =========================================================

async function symDecrypt() {

    var algo = document.getElementById('s-algo').value;
    var key  = document.getElementById('s-key').value;
    var txt  = document.getElementById('s-in').value;
    var out  = document.getElementById('s-out');

    if (!txt || !key) {
        showStatus('s-st', 'Please enter both text and a key.', 'err');
        return;
    }

    try {

        // ---- AES-256 ----
        if (algo === 'aes') {

            // decode from base64 back to bytes
            var bytes = new Uint8Array(
                atob(txt).split('').map(function(c) { return c.charCodeAt(0); })
            );

            // unpack salt, iv, and ciphertext
            var salt       = bytes.slice(0, 16);
            var iv         = bytes.slice(16, 28);
            var ciphertext = bytes.slice(28);

            var aesKey = await deriveAESKey(key, salt);

            // decrypt
            var plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                ciphertext
            );

            out.textContent = new TextDecoder().decode(plaintext);

        // ---- Caesar Cipher ----
        } else if (algo === 'caesar') {

            // to decrypt caesar we shift the other way
            var shift = ((parseInt(key) || 3) % 26 + 26) % 26;

            out.textContent = txt.replace(/[a-zA-Z]/g, function(ch) {
                var base = (ch < 'a') ? 65 : 97;
                return String.fromCharCode(
                    (ch.charCodeAt(0) - base - shift + 26) % 26 + base
                );
            });

        // ---- Vigenere Cipher ----
        } else if (algo === 'vigenere') {

            var vKey = key.toLowerCase().replace(/[^a-z]/g, '');

            if (!vKey) {
                showStatus('s-st', 'Key must contain at least one letter.', 'err');
                return;
            }

            var keyIndex = 0;

            out.textContent = txt.replace(/[a-zA-Z]/g, function(ch) {
                var base  = (ch < 'a') ? 65 : 97;
                var shift = vKey[keyIndex % vKey.length].charCodeAt(0) - 97;
                keyIndex++;
                return String.fromCharCode(
                    (ch.charCodeAt(0) - base - shift + 26) % 26 + base
                );
            });

        // ---- XOR Cipher (XOR is its own inverse!) ----
        } else {

            var xorIndex = 0;

            out.textContent = Array.from(txt).map(function(ch) {
                var xorred = ch.charCodeAt(0) ^ key[xorIndex % key.length].charCodeAt(0);
                xorIndex++;
                return String.fromCharCode(xorred);
            }).join('');
        }

        showStatus('s-st', 'Decrypted successfully.', 'ok');

    } catch (e) {
        showStatus('s-st', 'Decryption failed. Wrong key or corrupted data.', 'err');
    }
}


// =========================================================
//   SYMMETRIC — CLEAR
// =========================================================

function symClear() {
    document.getElementById('s-in').value = '';
    document.getElementById('s-out').textContent = 'Result will appear here after encryption or decryption...';
    document.getElementById('s-st').innerHTML = '';
}


// =========================================================
//   RSA — VARIABLES
// =========================================================

var rsaKeyPair = null; // store generated key pair globally


// =========================================================
//   RSA — GENERATE KEY PAIR
// =========================================================

async function generateRSA() {

    var bits = parseInt(document.getElementById('rsa-bits').value);

    showStatus('rsa-gen-st', 'Generating ' + bits + '-bit RSA keys... please wait a moment.', 'info');

    try {

        // generate the key pair using Web Crypto
        rsaKeyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: bits,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );

        // export both keys so we can show them as PEM strings
        var publicKeyBuffer  = await crypto.subtle.exportKey('spki',  rsaKeyPair.publicKey);
        var privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', rsaKeyPair.privateKey);

        // helper to convert buffer to base64 string
        function bufferToBase64(buffer) {
            var bytes = new Uint8Array(buffer);
            var str = '';
            bytes.forEach(function(byte) {
                str += String.fromCharCode(byte);
            });
            return btoa(str);
        }

        // format as PEM (64 chars per line)
        var publicPEM = '-----BEGIN PUBLIC KEY-----\n'
                      + bufferToBase64(publicKeyBuffer).match(/.{1,64}/g).join('\n')
                      + '\n-----END PUBLIC KEY-----';

        var privatePEM = '-----BEGIN PRIVATE KEY-----\n'
                       + bufferToBase64(privateKeyBuffer).match(/.{1,64}/g).join('\n')
                       + '\n-----END PRIVATE KEY-----';

        // show keys on screen
        document.getElementById('rsa-pub').textContent  = publicPEM;
        document.getElementById('rsa-priv').textContent = privatePEM;

        // also auto-fill the encrypt/decrypt fields
        document.getElementById('rsa-pub-in').value  = publicPEM;
        document.getElementById('rsa-priv-in').value = privatePEM;

        showStatus('rsa-gen-st', bits + '-bit RSA key pair generated successfully.', 'ok');

    } catch (e) {
        showStatus('rsa-gen-st', 'Error: ' + e.message, 'err');
    }
}


// =========================================================
//   RSA — PEM TO ARRAYBUFFER HELPER
//   needed to import keys back from PEM string
// =========================================================

function pemToBuffer(pem) {

    // strip the header/footer lines
    var base64 = pem
        .replace(/-----[^-]+-----/g, '')
        .replace(/\s/g, '');

    // decode base64
    var binaryString = atob(base64);

    // convert to Uint8Array
    var buffer = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i);
    }

    return buffer.buffer;
}


// =========================================================
//   RSA — ENCRYPT MESSAGE
// =========================================================

async function rsaEncrypt() {

    try {

        var message   = document.getElementById('rsa-in').value;
        var publicPEM = document.getElementById('rsa-pub-in').value;

        if (!message || !publicPEM) {
            showStatus('rsa-st', 'Please enter a message and a public key.', 'err');
            return;
        }

        // import the public key
        var publicKey = await crypto.subtle.importKey(
            'spki',
            pemToBuffer(publicPEM),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['encrypt']
        );

        // encrypt the message
        var ciphertext = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            new TextEncoder().encode(message)
        );

        // convert to base64 for display
        var bytes = new Uint8Array(ciphertext);
        var str = '';
        bytes.forEach(function(b) { str += String.fromCharCode(b); });

        document.getElementById('rsa-out').textContent = btoa(str);
        showStatus('rsa-st', 'Message encrypted with RSA public key.', 'ok');

    } catch (e) {
        showStatus('rsa-st', 'Error: ' + e.message, 'err');
    }
}


// =========================================================
//   RSA — DECRYPT MESSAGE
// =========================================================

async function rsaDecrypt() {

    try {

        var ciphertextB64 = document.getElementById('rsa-out').textContent;
        var privatePEM    = document.getElementById('rsa-priv-in').value;

        if (!ciphertextB64 || !privatePEM || ciphertextB64.includes('appear')) {
            showStatus('rsa-st', 'Please encrypt a message first.', 'err');
            return;
        }

        // import the private key
        var privateKey = await crypto.subtle.importKey(
            'pkcs8',
            pemToBuffer(privatePEM),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['decrypt']
        );

        // decode base64 ciphertext
        var binaryString = atob(ciphertextB64);
        var buffer = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) {
            buffer[i] = binaryString.charCodeAt(i);
        }

        // decrypt
        var plaintext = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            buffer.buffer
        );

        document.getElementById('rsa-out').textContent = new TextDecoder().decode(plaintext);
        showStatus('rsa-st', 'Decrypted successfully with RSA private key.', 'ok');

    } catch (e) {
        showStatus('rsa-st', 'Decryption failed: ' + e.message, 'err');
    }
}


// =========================================================
//   HASH — SHA HELPER
//   uses Web Crypto to compute SHA-1 / SHA-256 / SHA-512
// =========================================================

async function computeSHA(algorithm, text) {

    var buffer = await crypto.subtle.digest(
        algorithm,
        new TextEncoder().encode(text)
    );

    // convert buffer to hex string
    var hexString = Array.from(new Uint8Array(buffer))
        .map(function(byte) {
            return byte.toString(16).padStart(2, '0');
        })
        .join('');

    return hexString;
}


// =========================================================
//   HASH — MD5 (pure JS because Web Crypto doesn't have MD5)
//   i found this algorithm online and adapted it
// =========================================================

function computeMD5(inputString) {

    // helper: add two 32-bit integers (handles overflow)
    function add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }

    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d,            a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)),       a, b, x, s, t); }

    // encode string as UTF-8 latin1
    var s = unescape(encodeURIComponent(inputString));
    var l = s.length;

    // build word array
    var w = [];
    for (var i = 0; i < l; i++) {
        w[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    }

    w[l >> 2] |= 0x80 << ((l % 4) * 8);
    w[(((l + 8) >> 6) << 4) + 14] = l * 8;

    // init hash values
    var a =  1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d =  271733878;

    // main loop
    for (var i = 0; i < w.length; i += 16) {

        var aa = a, bb = b, cc = c, dd = d;

        a = ff(a,b,c,d, w[i],    7, -680876936);
        d = ff(d,a,b,c, w[i+1], 12, -389564586);
        c = ff(c,d,a,b, w[i+2], 17,  606105819);
        b = ff(b,c,d,a, w[i+3], 22,-1044525330);
        a = ff(a,b,c,d, w[i+4],  7, -176418897);
        d = ff(d,a,b,c, w[i+5], 12, 1200080426);
        c = ff(c,d,a,b, w[i+6], 17,-1473231341);
        b = ff(b,c,d,a, w[i+7], 22,  -45705983);
        a = ff(a,b,c,d, w[i+8],  7, 1770035416);
        d = ff(d,a,b,c, w[i+9], 12,-1958414417);
        c = ff(c,d,a,b, w[i+10],17,    -42063);
        b = ff(b,c,d,a, w[i+11],22,-1990404162);
        a = ff(a,b,c,d, w[i+12], 7, 1804603682);
        d = ff(d,a,b,c, w[i+13],12,  -40341101);
        c = ff(c,d,a,b, w[i+14],17,-1502002290);
        b = ff(b,c,d,a, w[i+15],22, 1236535329);

        a = gg(a,b,c,d, w[i+1],  5, -165796510);
        d = gg(d,a,b,c, w[i+6],  9,-1069501632);
        c = gg(c,d,a,b, w[i+11],14,  643717713);
        b = gg(b,c,d,a, w[i],   20, -373897302);
        a = gg(a,b,c,d, w[i+5],  5, -701558691);
        d = gg(d,a,b,c, w[i+10], 9,   38016083);
        c = gg(c,d,a,b, w[i+15],14, -660478335);
        b = gg(b,c,d,a, w[i+4], 20, -405537848);
        a = gg(a,b,c,d, w[i+9],  5,  568446438);
        d = gg(d,a,b,c, w[i+14], 9,-1019803690);
        c = gg(c,d,a,b, w[i+3], 14, -187363961);
        b = gg(b,c,d,a, w[i+8], 20, 1163531501);
        a = gg(a,b,c,d, w[i+13], 5,-1444681467);
        d = gg(d,a,b,c, w[i+2],  9,  -51403784);
        c = gg(c,d,a,b, w[i+7], 14, 1735328473);
        b = gg(b,c,d,a, w[i+12],20,-1926607734);

        a = hh(a,b,c,d, w[i+5],  4,   -378558);
        d = hh(d,a,b,c, w[i+8], 11,-2022574463);
        c = hh(c,d,a,b, w[i+11],16, 1839030562);
        b = hh(b,c,d,a, w[i+14],23,  -35309556);
        a = hh(a,b,c,d, w[i+1],  4,-1530992060);
        d = hh(d,a,b,c, w[i+4], 11, 1272893353);
        c = hh(c,d,a,b, w[i+7], 16, -155497632);
        b = hh(b,c,d,a, w[i+10],23,-1094730640);
        a = hh(a,b,c,d, w[i+13], 4,  681279174);
        d = hh(d,a,b,c, w[i],   11, -358537222);
        c = hh(c,d,a,b, w[i+3], 16, -722521979);
        b = hh(b,c,d,a, w[i+6], 23,   76029189);
        a = hh(a,b,c,d, w[i+9],  4, -640364487);
        d = hh(d,a,b,c, w[i+12],11, -421815835);
        c = hh(c,d,a,b, w[i+15],16,  530742520);
        b = hh(b,c,d,a, w[i+2], 23, -995338651);

        a = ii(a,b,c,d, w[i],    6, -198630844);
        d = ii(d,a,b,c, w[i+7], 10, 1126891415);
        c = ii(c,d,a,b, w[i+14],15,-1416354905);
        b = ii(b,c,d,a, w[i+5], 21,  -57434055);
        a = ii(a,b,c,d, w[i+12], 6, 1700485571);
        d = ii(d,a,b,c, w[i+3], 10,-1894986606);
        c = ii(c,d,a,b, w[i+10],15,   -1051523);
        b = ii(b,c,d,a, w[i+1], 21,-2054922799);
        a = ii(a,b,c,d, w[i+8],  6, 1873313359);
        d = ii(d,a,b,c, w[i+15],10,  -30611744);
        c = ii(c,d,a,b, w[i+6], 15,-1560198380);
        b = ii(b,c,d,a, w[i+13],21, 1309151649);
        a = ii(a,b,c,d, w[i+4],  6, -145523070);
        d = ii(d,a,b,c, w[i+11],10,-1120210379);
        c = ii(c,d,a,b, w[i+2], 15,  718787259);
        b = ii(b,c,d,a, w[i+9], 21, -343485551);

        a = add32(a, aa);
        b = add32(b, bb);
        c = add32(c, cc);
        d = add32(d, dd);
    }

    // convert final hash to hex string
    function toHex(val) {
        var hex = '';
        for (var i = 0; i < 4; i++) {
            hex += ('0' + ((val >>> (i * 8)) & 0xFF).toString(16)).slice(-2);
        }
        return hex;
    }

    return toHex(a) + toHex(b) + toHex(c) + toHex(d);
}


// =========================================================
//   HASH — LIVE HASH GENERATOR
//   runs whenever user types in the hash input
// =========================================================

async function doHash() {

    var text = document.getElementById('h-in').value;

    // if empty, reset all boxes
    if (!text) {
        ['md5', 'sha1', 'sha256', 'sha512'].forEach(function(id) {
            document.getElementById('hh-' + id).textContent = '—';
        });
        return;
    }

    // compute and display all hashes
    document.getElementById('hh-md5').textContent    = computeMD5(text);
    document.getElementById('hh-sha1').textContent   = await computeSHA('SHA-1',   text);
    document.getElementById('hh-sha256').textContent = await computeSHA('SHA-256', text);
    document.getElementById('hh-sha512').textContent = await computeSHA('SHA-512', text);
}


// =========================================================
//   HASH — CLEAR
// =========================================================

function clearHash() {
    document.getElementById('h-in').value = '';
    doHash(); // this will reset all the hash boxes
}


// =========================================================
//   HASH — VERIFY INTEGRITY
// =========================================================

async function verifyHash() {

    var text      = document.getElementById('v-txt').value;
    var expected  = document.getElementById('v-hash').value.trim().toLowerCase();
    var algorithm = document.getElementById('v-algo').value;

    if (!text || !expected) {
        showStatus('v-st', 'Please fill in all fields.', 'err');
        return;
    }

    // compute hash of the input text
    var computed = await computeSHA(algorithm, text);

    if (computed === expected) {
        showStatus('v-st', 'Hash matches — data integrity confirmed, no tampering detected.', 'ok');
    } else {
        showStatus('v-st', 'Hash mismatch — data may have been altered or corrupted.', 'err');
    }
}


// =========================================================
//   ENCODE/DECODE — MORSE CODE TABLE
// =========================================================

var morseCode = {
    A: '.-',   B: '-...', C: '-.-.', D: '-..',  E: '.',
    F: '..-.', G: '--.',  H: '....', I: '..',   J: '.---',
    K: '-.-',  L: '.-..', M: '--',   N: '-.',   O: '---',
    P: '.--.', Q: '--.-', R: '.-.',  S: '...',  T: '-',
    U: '..-',  V: '...-', W: '.--',  X: '-..-', Y: '-.--',
    Z: '--..',
    '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..',
    '9': '----.'
};


// =========================================================
//   ENCODE
// =========================================================

function doEncode() {

    var format = document.getElementById('e-fmt').value;
    var text   = document.getElementById('e-in').value;
    var output = document.getElementById('e-out');

    try {

        if (format === 'base64') {
            // btoa needs latin1 so we go through encodeURIComponent first
            output.textContent = btoa(unescape(encodeURIComponent(text)));

        } else if (format === 'hex') {
            // convert each byte to 2-digit hex
            output.textContent = Array.from(new TextEncoder().encode(text))
                .map(function(b) { return b.toString(16).padStart(2, '0'); })
                .join('');

        } else if (format === 'binary') {
            // convert each byte to 8-digit binary
            output.textContent = Array.from(new TextEncoder().encode(text))
                .map(function(b) { return b.toString(2).padStart(8, '0'); })
                .join(' ');

        } else if (format === 'url') {
            output.textContent = encodeURIComponent(text);

        } else if (format === 'rot13') {
            // shift letters by 13 positions (same for encode and decode)
            output.textContent = text.replace(/[a-zA-Z]/g, function(ch) {
                var offset = ch.toLowerCase() < 'n' ? 13 : -13;
                return String.fromCharCode(ch.charCodeAt(0) + offset);
            });

        } else if (format === 'morse') {
            // convert each letter to morse, spaces become /
            output.textContent = text.toUpperCase().split('').map(function(ch) {
                if (ch === ' ') return '/';
                return morseCode[ch] || ('[' + ch + ']');
            }).join(' ');
        }

        showStatus('e-st', 'Encoded successfully.', 'ok');

    } catch (e) {
        showStatus('e-st', 'Error: ' + e.message, 'err');
    }
}


// =========================================================
//   DECODE
// =========================================================

function doDecode() {

    var format = document.getElementById('e-fmt').value;
    var text   = document.getElementById('e-in').value;
    var output = document.getElementById('e-out');

    try {

        if (format === 'base64') {
            output.textContent = decodeURIComponent(escape(atob(text)));

        } else if (format === 'hex') {
            var hexPairs = text.replace(/\s/g, '').match(/.{1,2}/g);
            var hexBytes = hexPairs.map(function(h) { return parseInt(h, 16); });
            output.textContent = new TextDecoder().decode(new Uint8Array(hexBytes));

        } else if (format === 'binary') {
            var binParts  = text.trim().split(/\s+/);
            var binBytes  = binParts.map(function(b) { return parseInt(b, 2); });
            output.textContent = new TextDecoder().decode(new Uint8Array(binBytes));

        } else if (format === 'url') {
            output.textContent = decodeURIComponent(text);

        } else if (format === 'rot13') {
            // ROT13 is symmetric so same logic as encode
            output.textContent = text.replace(/[a-zA-Z]/g, function(ch) {
                var offset = ch.toLowerCase() < 'n' ? 13 : -13;
                return String.fromCharCode(ch.charCodeAt(0) + offset);
            });

        } else if (format === 'morse') {
            // build reverse lookup table
            var reverseMorse = {};
            for (var letter in morseCode) {
                reverseMorse[morseCode[letter]] = letter;
            }

            output.textContent = text.split(' ').map(function(code) {
                if (code === '/') return ' ';
                return reverseMorse[code] || '?';
            }).join('');
        }

        showStatus('e-st', 'Decoded successfully.', 'ok');

    } catch (e) {
        showStatus('e-st', 'Decoding failed. Check your input format.', 'err');
    }
}


// =========================================================
//   ENCODE — CLEAR
// =========================================================

function clearEncode() {
    document.getElementById('e-in').value = '';
    document.getElementById('e-out').textContent = 'Result will appear here...';
    document.getElementById('e-st').innerHTML = '';
}


// =========================================================
//   IMAGE ENCRYPTION — VARIABLES
// =========================================================

var originalImageData = null; // stores original pixel data


// =========================================================
//   IMAGE — LOAD
//   called when user picks a file
// =========================================================

function loadImage(inputElement) {

    var file = inputElement.files[0];
    if (!file) return;

    var reader = new FileReader();

    reader.onload = function(event) {

        var img = new Image();

        img.onload = function() {

            // draw on original canvas
            var origCanvas = document.getElementById('orig-canvas');
            origCanvas.width  = img.width;
            origCanvas.height = img.height;

            var ctx = origCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // save pixel data for later
            originalImageData = ctx.getImageData(0, 0, img.width, img.height);

            // also draw on the output canvas (starts as a copy)
            var encCanvas = document.getElementById('enc-canvas');
            encCanvas.width  = img.width;
            encCanvas.height = img.height;
            encCanvas.getContext('2d').drawImage(img, 0, 0);

            // show the canvas section
            document.getElementById('img-loaded').style.display = '';

            showStatus('img-st', 'Image loaded successfully. Enter a key and click Encrypt.', 'ok');
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}


// =========================================================
//   IMAGE — GET KEY BYTES
//   SHA-256 hash the password to get 32 bytes for XOR
// =========================================================

async function getImageKey(password) {
    var hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
    );
    return new Uint8Array(hashBuffer);
}


// =========================================================
//   IMAGE — ENCRYPT
//   XOR each RGB byte with the key bytes
// =========================================================

async function encryptImage() {

    if (!originalImageData) {
        showStatus('img-st', 'Please upload an image first.', 'err');
        return;
    }

    var password = document.getElementById('img-key').value;

    if (!password) {
        showStatus('img-st', 'Please enter an encryption key first.', 'err');
        return;
    }

    // get the 32-byte key
    var keyBytes = await getImageKey(password);

    // copy original pixel data (don't want to modify original)
    var pixels = new Uint8Array(originalImageData.data.buffer.slice());

    // XOR each RGB byte (skip alpha channel at i+3)
    for (var i = 0; i < pixels.length; i += 4) {
        pixels[i]     = pixels[i]     ^ keyBytes[i % 32];       // Red
        pixels[i + 1] = pixels[i + 1] ^ keyBytes[(i + 1) % 32]; // Green
        pixels[i + 2] = pixels[i + 2] ^ keyBytes[(i + 2) % 32]; // Blue
        // pixels[i+3] = alpha, leave it unchanged
    }

    // draw the scrambled pixels on the output canvas
    var encCanvas = document.getElementById('enc-canvas');
    var newImageData = new ImageData(
        new Uint8ClampedArray(pixels),
        originalImageData.width,
        originalImageData.height
    );

    encCanvas.getContext('2d').putImageData(newImageData, 0, 0);
    document.getElementById('enc-label').textContent = 'Encrypted';

    showStatus('img-st', 'Image encrypted successfully. Pixels scrambled with your key.', 'ok');
}


// =========================================================
//   IMAGE — DECRYPT
//   XOR again with same key = original image restored
// =========================================================

async function decryptImage() {

    if (!originalImageData) {
        showStatus('img-st', 'Please upload an image first.', 'err');
        return;
    }

    var password = document.getElementById('img-key').value;

    if (!password) {
        showStatus('img-st', 'Please enter the decryption key.', 'err');
        return;
    }

    var keyBytes = await getImageKey(password);

    // get current pixels from the output canvas (which may be encrypted)
    var encCanvas = document.getElementById('enc-canvas');
    var ctx       = encCanvas.getContext('2d');
    var source    = ctx.getImageData(0, 0, encCanvas.width, encCanvas.height);

    var pixels = new Uint8Array(source.data.buffer.slice());

    // XOR again to reverse encryption
    for (var i = 0; i < pixels.length; i += 4) {
        pixels[i]     = pixels[i]     ^ keyBytes[i % 32];
        pixels[i + 1] = pixels[i + 1] ^ keyBytes[(i + 1) % 32];
        pixels[i + 2] = pixels[i + 2] ^ keyBytes[(i + 2) % 32];
    }

    var newImageData = new ImageData(
        new Uint8ClampedArray(pixels),
        encCanvas.width,
        encCanvas.height
    );

    ctx.putImageData(newImageData, 0, 0);
    document.getElementById('enc-label').textContent = 'Decrypted';

    showStatus('img-st', 'Image decrypted successfully. Original restored.', 'ok');
}


// =========================================================
//   IMAGE — DOWNLOAD
//   saves the output canvas as a PNG file
// =========================================================

function downloadImage() {
    var canvas = document.getElementById('enc-canvas');
    var link   = document.createElement('a');

    link.download = 'encrypted-output.png';
    link.href     = canvas.toDataURL();
    link.click();
}
