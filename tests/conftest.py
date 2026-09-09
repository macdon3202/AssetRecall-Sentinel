import atexit,os
from pathlib import Path
import pytest
from gltest.direct.sdk_loader import setup_sdk_paths
CONTRACT=Path(__file__).parents[1]/"contracts"/"asset_recall_sentinel.py"
setup_sdk_paths(CONTRACT)
@pytest.fixture(autouse=True)
def windows_direct_mode_compat(monkeypatch):
    setup_sdk_paths(CONTRACT)
    if os.name!="nt":yield;return
    real=os.unlink;deferred=[]
    def unlink(path,*args,**kwargs):
        try:return real(path,*args,**kwargs)
        except PermissionError:deferred.append(os.fspath(path))
    monkeypatch.setattr(os,"unlink",unlink);yield
    for path in deferred:
        try:real(path)
        except PermissionError:atexit.register(lambda p=path: os.path.exists(p) and real(p))
