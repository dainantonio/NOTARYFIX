# Security Notes

## Gemini API Key

`VITE_GEMINI_API_KEY` is a Vite (frontend) environment variable and is visible in the compiled browser bundle. This is a known limitation of static hosting on GitHub Pages.

### Immediate mitigation (do this now)
1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your Gemini API key
3. Under **Application restrictions**, select **HTTP referrers (web sites)**
4. Add: `https://dainantonio.github.io/*`
5. Under **API restrictions**, restrict to **Generative Language API** only

This ensures the key can only be used from your domain, limiting abuse risk.

### Production recommendation
Move all AI calls to a serverless edge function (Netlify Functions, Vercel Edge, or Cloudflare Workers). The function holds the key server-side and your frontend calls `/api/ai` instead of Gemini directly. This fully eliminates key exposure.

## User Data

All user data is stored in `localStorage` (browser-side only). No data is transmitted to any third-party service except:
- Google Gemini API (appointment details for AI drafting)

Ensure appointment data sent to Gemini does not include PII beyond what is necessary for the notary workflow (signer name, document type, date, state).

## Shell Scripts

Patch scripts (`upgrade_v*.sh`, etc.) have been removed and added to `.gitignore`. Use git branches for all future changes.
