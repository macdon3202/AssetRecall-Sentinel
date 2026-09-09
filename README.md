# AssetRecall Sentinel

AssetRecall Sentinel is a GenLayer intelligent registry that determines whether an official vehicle recall applies to a sealed component/risk scope for a tokenized physical asset. V1 is deliberately limited to vehicles decoded by NHTSA vPIC and recalls returned by NHTSA's official Recall API.

Unlike an evidence-submission certificate registry, users cannot supply evidence URLs. The contract constructs both authority URLs from immutable asset identity. Validators independently fetch the sources and use AI only for semantic scope matching; the contract validates identity and campaign membership and derives `AFFECTED`, `NOT_AFFECTED`, `MANUAL_REVIEW`, or `UNRESOLVED`.

## Architecture

- `contracts/asset_recall_sentinel.py`: production GenLayer contract.
- `tests/`: Direct Mode behavioral and adversarial tests.
- `frontend/`: React/Vite wallet UI with transaction journal and authoritative readback.
- `docs/SPECIFICATION.md`: proof obligation, trust model and state machine.
- `docs/TEST_MATRIX.md`: release and live verification requirements.

There is no custody, token, payout, backend or legal safety guarantee. VIN is public on-chain in V1. A finding describes only the official sources observed at its evaluation time.

## Local verification

```bash
python -X utf8 -m genvm_linter.cli check contracts/asset_recall_sentinel.py
python -m pytest -q
cd frontend
npm install
npm test
npm run build
```

## Deployment status

V1 historical Studionet deployment: `0x4A35338757456fB4287ca77e4344B87b7ceDf4b9`.

The verified V1 lifecycle registered asset #0, created scan #0 from a second wallet, independently evaluated official NHTSA sources to `AFFECTED`, rejected terminal replay without mutation, and evaluated append-only refresh scan #1. See `docs/LIVE_VERIFICATION.json`.

V2 is the current verified deployment: `0xda6B9aD1A9541b76dd542ca99a1bbC11E387b784`. It fixes the adversarial-audit finding that V1 converted a true comparative-consensus exception into a stored `UNRESOLVED` attempt. V2 deliberately lets disagreement make the transaction `UNDETERMINED`, preserving the complete pre-call state.

The V2 live lifecycle includes a successful `AFFECTED` result, unauthorized-retirement rejection, terminal-replay rejection, append-only refresh, and two real comparative-consensus disagreements. Both disagreement transactions ended `UNDETERMINED`; authoritative readback proved the refreshed scan remained `REQUESTED` with attempt `0` and no derived evidence. See `docs/LIVE_VERIFICATION_V2.json`.
