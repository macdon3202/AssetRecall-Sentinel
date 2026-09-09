# Test and release matrix

Before deployment: GenVM lint, production-source Direct Mode tests, frontend transaction tests and production build must pass. After deployment: verify source hash/config, run one official-source scan, one invalid identity or malformed-input negative, retry/replay controls, and authoritative readback. A live `AFFECTED` result must never be claimed unless the deployed scan actually reaches it.

Required adversarial cases include wrong caller retirement, invalid VIN/year/market/digest, source HTTP failure, decoded identity mismatch, invented campaign ID, malformed model schema, semantic uncertainty, no recalls, duplicate terminal evaluation, bounded retry, stale revision, and append-only refresh.
