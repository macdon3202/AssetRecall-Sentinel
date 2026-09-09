# Deployment gate

Deploy `contracts/asset_recall_sentinel.py` with no constructor arguments. Do not deploy until lint, Direct Mode tests, frontend transaction tests and build pass. After deployment, record address, deploy transaction, source SHA-256, exact Git commit and `get_config` readback before configuring the frontend.

The required live sequence is: `register_asset`, `request_scan`, `evaluate_scan`, `get_scan`, one terminal replay rejection, `refresh_scan`, and final authoritative readback. Preserve any `UNRESOLVED` or `UNDETERMINED` result rather than relabeling it successful.
