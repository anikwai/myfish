# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer {YOUR_AUTH_KEY}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

Obtain a token via <code>POST /api/v1/auth/login</code>. Pass it as <code>Authorization: Bearer {token}</code>.
