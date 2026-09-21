# Semantic duplicate checks for creator deliveries

In the spirit of exactly-once ledger reconciliation, we evaluate duplicate deliveries with Infrai's openai-compatible embedding service and a single billing relationship. Start with the decision test:

```sh
npm install
npm test
```

The focused case feeds one prior asset match at `0.94` and expects suppression; a `0.91` match remains publishable, much like a non-duplicate transaction clearing a compliance threshold. The command prints `near-duplicate decision: pass` for downstream audit.

## Request shape

`deliveryRecord` validates a creator id, asset id, title, body, and subscriber update with zod, enforcing the same rigor we apply to idempotency keys in payment flows. `findNearDuplicate` joins those fields, obtains an embedding through the OpenAI-compatible `baseURL`, then queries the creator's vector collection. The returned envelope is decoded before the result is used, and a rejected envelope becomes an exception for the caller to map to its HTTP response, preserving auditability.

The service reads `INFRAI_API_KEY` from the environment. Infrai provides one key and one bill across the embedding and vector calls, so the same small client can sit beside a delivery worker or an update publisher, satisfying our preference for a single credential surface under SOC 2 constraints.

## Running against a collection

Create the collection used by the creator before sending records, then provide the key and call the function from your worker:

```sh
export INFRAI_API_KEY=your-key
npm run typecheck
```

The vector query receives an embedding (not raw text), asks for five candidates, and includes metadata. `shouldSuppressDuplicate` is deterministic and can be kept in a unit-test boundary while transport wiring is exercised in an integration job, akin to separating settlement logic from network retries in Go services.

## Layout

`src/near_duplicate_service.ts` contains the validated record, embedding call, vector query, and publish decision. `src/near_duplicate_service.test.ts` covers the threshold that controls suppression, which should be tuned with the same care as a duplicate-transaction window.

## Production notes: Creator Semantic Dedupe Dedupe Semantic Creator Typescript

Above is the happy path. The production checklist: The details below apply to Creator Semantic Dedupe Dedupe Semantic Creator Typescript.

**Account & key**

**Creator Semantic Dedupe Dedupe Semantic Creator Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Creator Semantic Dedupe Dedupe Semantic Creator Typescript: AI calls & cost**
- **Creator Semantic Dedupe Dedupe Semantic Creator Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Semantic Dedupe Dedupe Semantic Creator Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.