# AssetRecall Sentinel V2 — Release Evidence

## Release identity

| Field | Verified value |
|---|---|
| Network | GenLayer Studionet |
| Current contract | [`0xda6B9aD1A9541b76dd542ca99a1bbC11E387b784`](https://explorer-studio.genlayer.com/address/0xda6B9aD1A9541b76dd542ca99a1bbC11E387b784) |
| Contract version readback | `ASSET_RECALL_SENTINEL_V2` |
| Reviewed source | [`contracts/asset_recall_sentinel.py`](../contracts/asset_recall_sentinel.py) |
| Reviewed source SHA-256 | `2098416b2703337def6c5fcc3e22a5df9716decce6d55ab4d16a92c193e5adf5` |
| Constructor arguments | `[]` |
| Production frontend | https://asset-recall-sentinel.pages.dev |
| Repository | https://github.com/macdon3202/AssetRecall-Sentinel |

The deployed contract exposes 9 validated methods: 3 view methods and 6 write methods. Its live configuration reports `NHTSA_VPIC_AND_RECALLS` as the authority and `CONTRACT_CONSTRUCTED` as the evidence URL policy.

## Proof obligation and source controls

AssetRecall Sentinel determines whether official recall language for an exactly decoded US-market vehicle covers a sealed component or risk scope. A contributor cannot supply an evidence URL. Every validator independently retrieves two contract-constructed official sources:

- NHTSA vPIC VIN decoding: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json`
- NHTSA recall search: `https://api.nhtsa.gov/recalls/recallsByVehicle?make={MAKE}&model={MODEL}&modelYear={YEAR}`

AI returns only a closed semantic observation: scope match and official campaign identifiers. Contract logic independently checks decoded identity, observation schema, campaign membership and the digest of fetched bytes, then derives the stored result. True comparative disagreement is not converted into a verdict: the transaction becomes `UNDETERMINED` and storage rolls back.

## Live fixture

| Field | Value |
|---|---|
| Asset ID | `0` |
| VIN | `1HGCM82633A004352` |
| Registered identity | `HONDA / ACCORD / 2003 / US` |
| Metadata digest | `1d7d70d6e911c4c33ab3cf1a6a67e8c00967f64e778fbcb8f3ff736e4fd896fc` |
| Risk scope | `frontal air bag inflator rupture` |

## Complete Studionet lifecycle

| Step | Transaction | Execution | Authoritative result |
|---|---|---|---|
| Register asset #0 | [`0xee5487b0cdb225046b76a5a77015caf7069aa9c0add6dd694dfa28041bdb4b58`](https://explorer-studio.genlayer.com/tx/0xee5487b0cdb225046b76a5a77015caf7069aa9c0add6dd694dfa28041bdb4b58) | `SUCCESS` | Asset `ACTIVE`, revision `1` |
| Request scan #0 from a second wallet | [`0x8288d110c7adf786402e992eb0142ded1f3c04784140cfb521480ea74df8a5d8`](https://explorer-studio.genlayer.com/tx/0x8288d110c7adf786402e992eb0142ded1f3c04784140cfb521480ea74df8a5d8) | `SUCCESS` | Scan `REQUESTED`, attempt `0` |
| Evaluate scan #0 | [`0x549a371c24e27a2fac4c95071e37b898658b75592869b89950dd64ae4a98aa88`](https://explorer-studio.genlayer.com/tx/0x549a371c24e27a2fac4c95071e37b898658b75592869b89950dd64ae4a98aa88) | `SUCCESS`, consensus `Accepted` | `AFFECTED`, attempt `1` |
| Unauthorized retirement | [`0x0988c0a51a33b15fcb1947be1d761b7cdb7384293c35b6f98ad9041347a213f8`](https://explorer-studio.genlayer.com/tx/0x0988c0a51a33b15fcb1947be1d761b7cdb7384293c35b6f98ad9041347a213f8) | `ERROR: OWNER_ONLY` | Asset remained `ACTIVE` |
| Replay terminal scan #0 | [`0xeb8b588241b45b5aa09e90529542fe65d79e7e20c7f24bcada9559281932d2eb`](https://explorer-studio.genlayer.com/tx/0xeb8b588241b45b5aa09e90529542fe65d79e7e20c7f24bcada9559281932d2eb) | `ERROR: SCAN_NOT_RETRYABLE` | Scan #0 remained unchanged |
| Create append-only refresh scan #1 | [`0xc10d8de04ba855ffaca6e651a86962c9af4033e713549d18bcd8a2e778819ff7`](https://explorer-studio.genlayer.com/tx/0xc10d8de04ba855ffaca6e651a86962c9af4033e713549d18bcd8a2e778819ff7) | `SUCCESS` | Scan #1 `REQUESTED`, `supersedes=0` |
| Evaluate refresh: disagreement #1 | [`0x96bb912b5e9905d1997f8cca1517c4a18dccda02643db4c8a1281de03bda9343`](https://explorer-studio.genlayer.com/tx/0x96bb912b5e9905d1997f8cca1517c4a18dccda02643db4c8a1281de03bda9343) | `UNDETERMINED` | Full rollback; scan #1 unchanged |
| Evaluate refresh: disagreement #2 | [`0x192ed66f2dd6ecb87a0744296a7444344e12a1363d2fc26c93496ea1e30bb86f`](https://explorer-studio.genlayer.com/tx/0x192ed66f2dd6ecb87a0744296a7444344e12a1363d2fc26c93496ea1e30bb86f) | `UNDETERMINED` | Full rollback; scan #1 unchanged |

## Successful finding readback

Scan #0 reached `AFFECTED` with reason `OFFICIAL_RECALL_SCOPE_MATCH`. The contract stored fetched-source digest:

`462d76ed19c1df5d5bc46aacececd4d3de8cd0d3027679bd64e61c6265067672`

Validated official campaign identifiers:

`19V499000`, `19V501000`, `17V220000`, `15V320000`, `14V700000`, `15V370000`, `14V353000`

This is the completed positive lifecycle. It demonstrates that a valid user can register an asset, request a scan, obtain independent validator evaluation and read back the finalized contract state.

## Failure and adversarial readback

### Unauthorized caller

A second wallet attempted to retire asset #0. Execution returned `OWNER_ONLY`. Readback confirmed the asset was still `ACTIVE`; ownership and state were not modified.

### Terminal replay

An evaluation was submitted again for finalized scan #0. Execution returned `SCAN_NOT_RETRYABLE`. Readback confirmed its `AFFECTED` result, attempt counter, source digest and campaign list were unchanged.

### Real validator disagreement

Two separate live validator sets disagreed while evaluating refresh scan #1. Both transactions ended `UNDETERMINED`. After each transaction, authoritative readback showed:

- state: `REQUESTED`
- attempt: `0`
- evaluated timestamp: `0`
- source digest: empty
- matched campaigns: empty
- prior scan #0: unchanged

The result is `PASS_FAIL_CLOSED_AND_RETRY_SAFE`. No semantic result is claimed for scan #1.

## Local and build verification

| Verification layer | Result |
|---|---|
| GenVM lint | `PASS` |
| GenVM contract validation | `PASS` — 9 methods |
| Direct Mode contract suite | `PASS` — 16/16 |
| Frontend transaction-journal suite | `PASS` — 5/5 |
| Frontend production build | `PASS` |
| Cloudflare production readback | HTTP `200` |
| Production bundle contract check | V2 address embedded; `V2 VERIFIED` present; `V1 VERIFIED` absent |

The Direct Mode suite covers valid evaluation, authorization, malformed inputs, source failure, decoded-identity mismatch, invented campaign IDs, malformed model output, uncertainty, empty recalls, bounded retry, stale revision, replay, append-only refresh and comparative-consensus rollback.

## Frontend verification

Cloudflare Pages project: `asset-recall-sentinel`

- Production URL: https://asset-recall-sentinel.pages.dev
- Verified deployment URL: https://2894430b.asset-recall-sentinel.pages.dev
- Frontend release commit: `e12d782`
- Production bundle observed: `/assets/index-BgvBAz7e.js`
- Production contract: `0xda6B9aD1A9541b76dd542ca99a1bbC11E387b784`

The frontend does not equate a submitted or finalized receipt with success. It checks execution outcome, journals pending transactions across reload and performs authoritative state readback.

## Reproduction commands

```bash
python -X utf8 -m genvm_linter.cli check contracts/asset_recall_sentinel.py
python -m pytest -q
cd frontend
npm test
npm run build
```

## Evidence index

- Machine-readable V2 lifecycle: [`LIVE_VERIFICATION_V2.json`](./LIVE_VERIFICATION_V2.json)
- Predeployment gates and source identity: [`PREDEPLOY_VERIFICATION.json`](./PREDEPLOY_VERIFICATION.json)
- Specification and trust boundary: [`SPECIFICATION.md`](./SPECIFICATION.md)
- Test and release matrix: [`TEST_MATRIX.md`](./TEST_MATRIX.md)
- Frontend deployment readback: [`FRONTEND_DEPLOYMENT.json`](./FRONTEND_DEPLOYMENT.json)

## Limitations and non-claims

- `AFFECTED` means official recall language matched the sealed risk scope. It does not prove that this individual vehicle remains unrepaired.
- The registry does not certify ownership, mechanical condition, insurance eligibility or legal liability.
- The VIN is public on-chain.
- Refresh scan #1 has no semantic verdict because two live validator sets disagreed; it remains safely retryable.
- The SHA-256 above identifies the reviewed V2 source. Deploy-receipt byte extraction is not claimed.
- Source availability observed from one machine does not guarantee permanent future availability from every validator.

## Release conclusion

AssetRecall Sentinel V2 has a completed live positive lifecycle, verified authorization and replay failure paths, and a live validator-disagreement case that preserved all pre-call state. The production frontend points to the verified V2 deployment. The unresolved refresh verdict is disclosed rather than presented as a successful evaluation.
