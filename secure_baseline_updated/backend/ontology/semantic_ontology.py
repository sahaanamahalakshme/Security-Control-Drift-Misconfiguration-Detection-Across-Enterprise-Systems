from __future__ import annotations
import difflib
import json
from pathlib import Path
from typing import Optional


# Keyword sets used only for the fuzzy fallback path (unseen provider/service).
CATEGORY_KEYWORDS = {
    "AUDIT_LOGGING": ["cloudtrail", "activity log", "audit log", "diagnostic",
                      "log analytics", "flow log", "logging"],
    "DATA_ENCRYPTION_AT_REST": ["encrypt", "kms", "sse", "storage encryption",
                                 "disk encryption", "at-rest", "public access prevention"],
    "NETWORK_PERIMETER_CONTROL": ["firewall", "security group", "nsg",
                                    "ingress", "egress", "acl", "network security"],
    "NETWORK_TRAFFIC_VISIBILITY": ["flow log", "traffic mirroring", "netflow"],
    "IDENTITY_ASSURANCE": ["mfa", "step-up", "sso", "identity provider", "authentication"],
    "CREDENTIAL_HYGIENE": ["access key", "credential rotation", "secret rotation"],
    "KEY_MANAGEMENT": ["kms", "cmk", "key rotation", "key vault"],
    "ENDPOINT_HEALTH": ["edr", "endpoint", "agent", "antivirus", "crowdstrike", "tamper"],
    "SUPPLY_CHAIN_INTEGRITY": ["ci/cd", "pipeline", "branch protection", "signed commit",
                                 "build agent", "jenkins", "github actions"],
}


class SemanticOntology:
    """Living Security Dictionary: provider/service -> universal_category."""

    def __init__(self, baseline_controls: Optional[list] = None):
        self._dictionary: dict[tuple[str, str], str] = {}
        self._learned_terms: list[dict] = []  # audit trail of auto-learned mappings
        if baseline_controls:
            self.bootstrap_from_baseline(baseline_controls)

    def bootstrap_from_baseline(self, baseline_controls: list) -> None:
        """Seed the dictionary from datasets/baseline.json controls."""
        for c in baseline_controls:
            key = self._key(c["provider"], c["service"])
            self._dictionary[key] = c["universal_category"]

    @staticmethod
    def _key(provider: str, service: str) -> tuple[str, str]:
        return (provider.strip().lower(), service.strip().lower())

    def classify(self, provider: str, service: str) -> str:
        """
        Return the universal_category for a (provider, service) pair.
        Exact dictionary hit first; falls back to lexical similarity against
        CATEGORY_KEYWORDS; unresolvable terms land in 'UNCATEGORIZED' rather
        than raising, so the pipeline never breaks on an unseen vendor.
        """
        key = self._key(provider, service)
        if key in self._dictionary:
            return self._dictionary[key]

        category = self._fuzzy_classify(service)
        if category:
            self._dictionary[key] = category
            self._learned_terms.append({
                "provider": provider, "service": service,
                "assigned_category": category, "method": "lexical_similarity_fallback"
            })
            return category

        self._dictionary[key] = "UNCATEGORIZED"
        self._learned_terms.append({
            "provider": provider, "service": service,
            "assigned_category": "UNCATEGORIZED", "method": "no_match"
        })
        return "UNCATEGORIZED"

    def _fuzzy_classify(self, service: str) -> Optional[str]:
        service_lower = service.strip().lower()
        best_category, best_score = None, 0.0
        for category, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                score = difflib.SequenceMatcher(None, service_lower, kw).ratio()
                # also credit substring containment heavily (e.g. "Audit Logging" contains "audit log")
                if kw in service_lower or service_lower in kw:
                    score = max(score, 0.85)
                if score > best_score:
                    best_category, best_score = category, score
        return best_category if best_score >= 0.55 else None

    def learned_terms_report(self) -> list:
        """Everything the ontology had to figure out on its own this run."""
        return self._learned_terms

    def dictionary_size(self) -> int:
        return len(self._dictionary)


def load_ontology_from_datasets(datasets_dir: str = "datasets") -> SemanticOntology:
    baseline_path = Path(datasets_dir) / "baseline.json"
    with open(baseline_path) as f:
        baseline = json.load(f)["controls"]
    return SemanticOntology(baseline_controls=baseline)


if __name__ == "__main__":
    # Quick smoke test: classify a vendor NOT in baseline.json to prove the
    # fuzzy fallback + auto-learning path works.
    onto = load_ontology_from_datasets("../../datasets")
    print("Seeded dictionary size:", onto.dictionary_size())
    print("Known ->", onto.classify("AWS", "CloudTrail"))
    print("Unseen ->", onto.classify("Wiz", "Cloud Audit Trail Export"))
    print("Learned terms:", onto.learned_terms_report())