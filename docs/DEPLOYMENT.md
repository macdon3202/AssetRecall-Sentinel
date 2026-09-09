# Deployment gate

Deploy `contracts/asset_recall_sentinel.py` V2 with no constructor arguments. Its expected SHA-256 is `2098416b2703337def6c5fcc3e22a5df9716decce6d55ab4d16a92c193e5adf5`. Do not reuse the historical V1 address. After deployment, record address, deploy transaction, source SHA-256, exact Git commit and `get_config` readback before configuring the frontend.

The required live sequence is: `register_asset`, `request_scan`, `evaluate_scan`, `get_scan`, one terminal replay rejection, `refresh_scan`, and final authoritative readback. Preserve any `UNRESOLVED` or `UNDETERMINED` result rather than relabeling it successful.
