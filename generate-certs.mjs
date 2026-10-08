import fs from "fs";
import path from "path";
import selfsigned from "selfsigned";

const keyPath = path.join(process.cwd(), "key.pem");
const certPath = path.join(process.cwd(), "cert.pem");

console.log("🔒 Generating self-signed SSL certificate for HTTPS...");

async function generateCerts() {
  try {
    const attrs = [{ name: "commonName", value: "localhost" }];
    const options = { keySize: 2048, days: 365 };

    let pwaCert = selfsigned.generate ? selfsigned.generate(attrs, options) : selfsigned(attrs, options);
    
    if (pwaCert && typeof pwaCert.then === "function") {
      pwaCert = await pwaCert;
    }

    const privateKey = pwaCert?.private || pwaCert?.key;
    const cert = pwaCert?.cert;

    if (privateKey && cert) {
      fs.writeFileSync(keyPath, privateKey, "utf-8");
      fs.writeFileSync(certPath, cert, "utf-8");
      console.log("✅ Successfully created 'key.pem' and 'cert.pem'!");
      console.log("🚀 You can now start the server with HTTPS support: npm run start:https");
    } else if (selfsigned.generate) {
      console.log("Generating via callback fallback...");
      selfsigned.generate(attrs, options, (err, keys) => {
        if (err || !keys) {
          console.error("❌ Failed to generate certs:", err);
          process.exit(1);
        }
        fs.writeFileSync(keyPath, keys.private || keys.key, "utf-8");
        fs.writeFileSync(certPath, keys.cert, "utf-8");
        console.log("✅ Successfully created 'key.pem' and 'cert.pem'!");
        console.log("🚀 You can now start the server with HTTPS support: npm run start:https");
      });
    }
  } catch (err) {
    console.error("❌ Error during SSL cert generation:", err);
  }
}

generateCerts();
