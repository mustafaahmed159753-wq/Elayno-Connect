<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/08b027f8-d706-4286-bb05-31f02bdd2bc5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Teaching the IT Bot with Images

In Admin mode, open **Image Learning** to upload a JPEG, PNG, or WebP reference photo (up to 8 MB). Gemini analyzes it and saves the extracted visual notes for use in future IT triage. The original image is not retained. Do not upload patient-identifying or other sensitive personal information.
