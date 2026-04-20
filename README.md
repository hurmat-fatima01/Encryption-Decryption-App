MY_ENCRYP/DECRYP_APP is a student web development project that brings five professional-grade cryptographic tools together in a single browser tab. Everything runs locally — your data never leaves your device.
The app is written in clean, readable student-style code across three files only:
MY_ENCRYP_DECRYP_APP/
 ├── index.html      → All structure & layout
 ├── style.css       → Beige/brown themed design
 └── script.js       → All cryptographic logic

✨ Features
🔑 Tab 1 — Symmetric Encryption
AlgorithmTypeSecurity LevelAES-256 (Web Crypto)Modern✅ Industry StandardCaesar CipherClassic⚠️ Educational OnlyVigenère CipherClassic⚠️ Educational OnlyXOR CipherBitwise⚠️ Educational Only

Password strength bar with 4 levels
Random salt + IV for each AES encryption
PBKDF2 key stretching (100,000 iterations)


🗝️ Tab 2 — Asymmetric Encryption (RSA)

Generate 2048-bit or 4096-bit RSA key pairs
Export keys in PEM format
Encrypt with public key → Decrypt with private key
Powered by RSA-OAEP + SHA-256


# Tab 3 — Hash Generator

Live hashing as you type — no button needed
Supports: MD5 · SHA-1 · SHA-256 · SHA-512
Built-in integrity verifier — paste a hash and confirm it matches


🔤 Tab 4 — Encoder / Decoder
FormatEncodeDecodeBase64✅✅Hexadecimal✅✅Binary✅✅URL Encode✅✅ROT-13✅✅Morse Code✅✅

🖼️ Tab 5 — Image XOR Encryption

Upload any PNG, JPG, or GIF
Password is SHA-256 hashed → used as a 32-byte XOR key
Each R, G, B pixel byte is XOR'd with the key
Same key decrypts the image perfectly (XOR is reversible)
Download the encrypted/decrypted image as PNG


 How To Run
No installation needed. Just:

Download or clone this repo
Open index.html in any modern browser
That's it — the app works instantly ✅

bash# Clone the repo
git clone https://github.com/hurmat-fatima01/MY_ENCRYP_DECRYP_APP.git

# Open the app
cd MY_ENCRYP_DECRYP_APP
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux

🛠️ Technologies Used
TechnologyPurposeHTML5Page structure, canvas element, file inputCSS3Beige theme, CSS variables, grid & flexboxJavaScript (ES2020)All app logic, async/awaitWeb Crypto APIAES-256, RSA-OAEP, PBKDF2, SHA hashesCanvas APIPixel-level image XOR encryptionClipboard APICopy-to-clipboard functionalityFileReader APIReading uploaded image files

📁 Project Structure
MY_ENCRYP_DECRYP_APP/
 │
 ├── 📄 index.html                 (428 lines)
 │       All 5 tab panels, forms, buttons, canvas
 │
 ├── 🎨 style.css                  (641 lines)
 │       Beige/brown theme, CSS variables,
 │       cards, tabs, responsive layout
 │
 ├── ⚡ script.js                  (1107 lines)
 │       Symmetric & asymmetric encryption,
 │       hashing, encoding, image XOR
 │
 ├── 📊 Presentation_Slides.pptx   (8 slides)
 ├── 📋 Project_Proposal.docx
 ├── 📖 Project_Documentation.docx
 └── 📝 README.md

🔒 Security Notes

✅ AES-256 with PBKDF2 is genuinely secure for real-world use
✅ All processing is 100% local — no data is ever sent to a server
⚠️ Caesar & Vigenère are educational only — easily broken by modern analysis
⚠️ XOR image encryption is a demonstration of the XOR principle, not production security
⚠️ The Web Crypto API requires HTTPS or localhost in some browsers


🧪 Test Cases
#TestExpected Result1AES Encrypt then DecryptOriginal text recovered2Caesar round-trip (shift=5)Original text recovered3Wrong AES key usedError message shown4SHA-256 live hashUpdates on every keystroke5Hash verify — correct hash✅ Green success message6Hash verify — wrong hash❌ Red mismatch error7Base64 encode then decodeOriginal text recovered8Morse SOS encode/decode... --- ... → SOS9RSA key gen + encrypt + decryptOriginal message recovered10Image XOR encrypt then decryptImage visually restored


🌍 Browser Compatibility
BrowserSupportedChrome 90+✅Firefox 90+✅Edge 90+✅Safari 15+✅Opera 76+✅

📝 License
This project is open source and available under the MIT License.

👨‍💻 Author
Hurmat Fatima

GitHub: @hurmat-fatima01


🙏 Acknowledgements

Web Crypto API — MDN Docs
HTML Canvas API — MDN Docs
SHA-256 / AES-GCM examples — MDN
