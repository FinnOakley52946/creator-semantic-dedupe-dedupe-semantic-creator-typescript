import assert from "node:assert/strict";
import { shouldSuppressDuplicate } from "./near_duplicate_service.js";

assert.equal(shouldSuppressDuplicate([{ id: "prior", score: 0.94 }]), true);
assert.equal(shouldSuppressDuplicate([{ id: "prior", score: 0.91 }]), false);
console.log("near-duplicate decision: pass");
