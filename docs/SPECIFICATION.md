# AssetRecall Sentinel V2 specification

## Boundary and proof obligation

V2 determines whether an official NHTSA recall for an exactly decoded US-market vehicle semantically covers a sealed component/risk scope. It does not certify ownership, mechanical condition, repair completion, insurance eligibility, or legal liability.

The falsifiers are an identity mismatch, absence of an official recall, no semantic scope match, source failure, malformed observation, or validator disagreement. User text and URLs are never evidence authorities.

## Actors and records

- Asset owner registers an immutable VIN, make, model, year, market and metadata digest.
- Any wallet may request a scan or refresh a terminal scan.
- Validators independently fetch contract-constructed NHTSA vPIC and Recall API URLs.
- The contract validates identity, campaign membership and schema, then derives the state.

Assets use `ACTIVE -> RETIRED`. Scans use `REQUESTED -> AFFECTED | NOT_AFFECTED | MANUAL_REVIEW | UNRESOLVED`; only `UNRESOLVED` can retry, bounded to three attempts. Refresh creates a new append-only scan linked by `supersedes`.

## Consensus and deterministic result

AI returns only `scope_match` and official campaign identifiers. Consensus covers status, identity, recall count, fetched-byte digest, semantic match and campaign set. The contract rejects invented campaign IDs and deterministically maps the normalized observation to the final state.

A validator's internal fetch/model/parse failure is a canonical observation and may settle to `UNRESOLVED` when validators agree. A true comparative disagreement is not caught: it remains transaction-level `UNDETERMINED`, so every write rolls back and the attempt is not consumed.

## Architecture difference

This is not a policy/certificate application registry. There are no user evidence URLs, mutable policy versions, evidence revisions or supplier certification counters. It uses a pre-registered asset ledger plus append-only point-in-time recall scans against two fixed government APIs.
