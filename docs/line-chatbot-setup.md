# LINE Chatbot setup — สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.

This feature adds a LINE Messaging API webhook to the existing storefront. The website remains the system of record for products, stock and reservations. Standard products can be reserved in a guided chat flow that submits the final order to the existing website checkout API; the special ช1 set stays on the website because it requires choosing a unique number from 1–99.

## What it does

- Verifies every webhook with the LINE channel secret and the raw request body.
- Replies to greeting/help, product-code and material/price searches, special-set searches, and reservation instructions.
- Displays product cards using the live product data loaded by the existing store backend.
- Starts a guided reservation flow for regular product codes via `จอง ชศ1 1` (replace the code and quantity). It collects name, telephone, unit/organization, delivery method, shipping address/postal code if applicable, and an enabled payment method, then asks for explicit confirmation.
- Stores the user's in-progress reservation step in a `lineBotSessions` Firestore collection, with a two-hour idle expiry. No customer reservation is created until the user presses `ยืนยัน`.
- Sends customers to the existing website to complete checkout, so the current checkout validation, stock handling and Firestore persistence remain authoritative.
- Allows order tracking in chat using `ติดตาม BPP-2569-1234 5678` (replace with the customer's actual order number and last four phone digits).
- Optionally sends a new-order notification to staff LINE user IDs.

## Environment variables

Configure these in the Vercel project environment settings (Production and Preview as appropriate):

- `LINE_CHANNEL_SECRET`: Messaging API channel secret.
- `LINE_CHANNEL_ACCESS_TOKEN`: channel access token used for reply and optional staff push notifications.
- `PUBLIC_SITE_URL`: public storefront URL. Defaults to `https://www.somdejpitakphaendin.com`.
- `LINE_ADMIN_USER_IDS`: optional comma-separated staff LINE user IDs for new-order push notifications.

Never put these credentials in frontend code, commit them to GitHub, or share them in chat.

## LINE Developers setup

1. Open the LINE Official Account's Messaging API channel in LINE Developers Console.
2. Copy the channel secret and issue a channel access token.
3. Set the environment variables above in the Vercel project.
4. Deploy the feature branch to a preview first; do not switch the production webhook until the preview has passed validation.
5. After the feature branch has been merged to `main` and the production deployment is ready, set the webhook URL to `https://www.somdejpitakphaendin.com/api/line/webhook` (or the actual production domain configured in Vercel), and enable **Use webhook**. Do not point the production LINE channel to this branch until the production code includes the route.
6. In LINE Official Account Manager, turn off conflicting automatic responses/greeting messages if the bot is intended to own those replies.
7. Press **Verify** in LINE Developers Console and test: `รายการพระ`, `ชศ1`, `ชุดพิเศษ`, `วิธีจอง`, and order tracking with an actual order number and phone suffix.

## Rich Menu suggestions

Create the Rich Menu image in LINE Official Account Manager and set each hotspot to a Message action:
- `รายการพระ`
- `ชุดพิเศษ`
- `วิธีจอง`
- `ติดตาม`
- `ติดต่อเจ้าหน้าที่`

A URI action can open the storefront directly. Rich-menu tab switching needs separate rich menus and LINE's rich-menu switch action/aliases.

## Important limitations for this first increment

- Guided chat reservations are supported for standard items and are submitted to the existing website `POST /api/orders` endpoint. The website remains authoritative for stock validation, order numbering, and persistence.
- The special `ช1` set must be booked on the website because the buyer must select a unique number from 1–99; its number-locking logic is not replicated in chat.
- If the webhook code is on a preview deployment, the preview host may be protected by Vercel SSO. Do not point LINE at the preview host or activate the production webhook until this feature is merged and deployed to the public production domain.
- Staff notifications are optional and only work when `LINE_ADMIN_USER_IDS` is configured with LINE user IDs.
- Product image cards include images only where an absolute HTTPS front-image URL is already stored. Relative website asset paths are intentionally omitted because LINE requires externally accessible image URLs.
- This code does not take or store payment card details. Payment is handled by the website's configured reservation workflow.
