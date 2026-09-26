from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PredictionRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, description="Input message to analyze")

class UrlAnalysisItem(BaseModel):
    url: str
    domain: str
    hostname: str
    protocol: str
    isHttps: bool
    riskScore: float
    riskLevel: str
    threatFlags: List[str]
    reasons: List[str]

class TriggeredRuleItem(BaseModel):
    id: str
    category: str
    severity: str
    points: int
    description: str
    matchedText: Optional[str] = None

class SafetyVerificationDossier(BaseModel):
    isVerifiedSafe: bool
    safetyFace: str
    faceIcon: str
    safetyStatus: str
    safetyScore: float
    verifiedChecks: List[str]
    safetyMessage: str

class PipelineBreakdown(BaseModel):
    mlScore: float
    mlConfidence: float
    ruleScore: float
    mlWeight: float
    ruleWeight: float
    triggeredRulesCount: int

class PredictionResponse(BaseModel):
    prediction: str
    riskScore: float
    riskLevel: str
    confidence: float
    category: str
    decisionReason: str
    recommendation: str
    modelVersion: str
    patterns: List[str]
    extractedUrls: List[str]
    urlAnalysis: List[Dict[str, Any]]
    urlRiskScore: float
    triggeredRules: List[Dict[str, Any]]
    pipelineBreakdown: Dict[str, Any]
    safetyVerification: Dict[str, Any]
