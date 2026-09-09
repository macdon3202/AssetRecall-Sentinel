import hashlib,json
from pathlib import Path
import pytest

CONTRACT=Path(__file__).parents[1]/"contracts"/"asset_recall_sentinel.py"
VIN="1HGCM82633A004352"; OWNER="0x"+"11"*20; OTHER="0x"+"22"*20; META="a"*64
def deploy(vm,direct_deploy):vm.warp("2026-09-09T12:00:00+00:00");return direct_deploy(CONTRACT,sdk_version="v0.2.16")
def register(c):return c.register_asset(VIN,"HONDA","ACCORD",2003,"US",META)
def sources(identity=True,recalls=True):
    vin={"Results":[{"Make":"HONDA" if identity else "TOYOTA","Model":"ACCORD","ModelYear":"2003","ErrorCode":"0"}]}
    rows=[{"NHTSACampaignNumber":"19V182000","Component":"AIR BAGS","Summary":"Driver frontal air bag inflator may rupture","Consequence":"Serious injury"}] if recalls else []
    return vin,{"results":rows}
def mock(vm,identity=True,recalls=True,answer=None,status=200):
    vin,rows=sources(identity,recalls);vm.mock_web(r"vpic\.nhtsa\.dot\.gov",{"status":status,"body":json.dumps(vin)});vm.mock_web(r"api\.nhtsa\.gov/recalls",{"status":status,"body":json.dumps(rows)})
    vm.mock_llm("ASSET_RECALL_SENTINEL_V2",answer or {"scope_match":"YES","campaigns":["19V182000"]})
def scan(c):return c.request_scan(0,"frontal air bag inflator rupture")

def test_affected_happy_path(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm);assert c.evaluate_scan(sid)=="AFFECTED";r=c.get_scan(sid);assert r["matched_campaigns"]==["19V182000"] and len(r["source_digest"])==64
def test_no_official_recalls_is_not_affected(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm,recalls=False,answer={"scope_match":"NO","campaigns":[]});assert c.evaluate_scan(sid)=="NOT_AFFECTED";assert c.get_scan(sid)["reason"]=="NO_OFFICIAL_RECALLS"
def test_no_semantic_match(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm,answer={"scope_match":"NO","campaigns":[]});assert c.evaluate_scan(sid)=="NOT_AFFECTED"
def test_unknown_is_manual_review(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm,answer={"scope_match":"UNKNOWN","campaigns":[]});assert c.evaluate_scan(sid)=="MANUAL_REVIEW"
def test_identity_mismatch_fails_closed(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm,identity=False);assert c.evaluate_scan(sid)=="UNRESOLVED"
def test_source_failure_fails_closed_and_is_retryable(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm,status=503);assert c.evaluate_scan(sid)=="UNRESOLVED";direct_vm._web_mocks.clear();direct_vm._llm_mocks.clear();mock(direct_vm);assert c.retry_scan(sid)=="AFFECTED";assert c.get_scan(sid)["attempt"]==2
def test_invented_campaign_is_rejected(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm,answer={"scope_match":"YES","campaigns":["FAKE"]});assert c.evaluate_scan(sid)=="UNRESOLVED"
def test_terminal_replay_blocked(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm);c.evaluate_scan(sid)
    with direct_vm.expect_revert("SCAN_NOT_RETRYABLE"):c.evaluate_scan(sid)
def test_refresh_is_append_only(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm);c.evaluate_scan(sid);new=c.refresh_scan(sid);assert int(new)==1;assert c.get_scan(new)["supersedes"]==0 and c.get_scan(sid)["state"]=="AFFECTED"
def test_only_owner_retires(direct_vm,direct_deploy):
    c=deploy(direct_vm,direct_deploy);register(c);from genlayer.py.types import Address;direct_vm.sender=Address(OTHER)
    with direct_vm.expect_revert("OWNER_ONLY"):c.retire_asset(0)
    assert c.get_asset(0)["state"]=="ACTIVE"
@pytest.mark.parametrize("vin,year,market,digest",[("BAD",2003,"US",META),(VIN,1970,"US",META),(VIN,2003,"GB",META),(VIN,2003,"US","x"*64)])
def test_invalid_registration(direct_vm,direct_deploy,vin,year,market,digest):
    c=deploy(direct_vm,direct_deploy)
    with pytest.raises(Exception):c.register_asset(vin,"HONDA","ACCORD",year,market,digest)
    assert c.get_config()["asset_count"]==0
def test_urls_are_contract_constructed(direct_vm,direct_deploy):
    source=CONTRACT.read_text(encoding="utf-8");assert "def request_scan(self,asset_id:u256,risk_scope:str)" in source;assert "vpic.nhtsa.dot.gov" in source and "api.nhtsa.gov/recalls" in source
def test_comparative_disagreement_rolls_back_without_mutation(direct_vm,direct_deploy,monkeypatch):
    c=deploy(direct_vm,direct_deploy);register(c);sid=scan(c);mock(direct_vm);before=c.get_scan(sid)
    from genlayer import gl
    def disagree(*args,**kwargs):raise RuntimeError("validator consensus undetermined")
    monkeypatch.setattr(gl.eq_principle,"prompt_comparative",disagree)
    with pytest.raises(RuntimeError,match="consensus undetermined"):c.evaluate_scan(sid)
    assert c.get_scan(sid)==before
