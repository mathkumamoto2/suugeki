from __future__ import annotations
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

Mode = Literal['solution','hint','check','diagnostic','visualize','slides','review']
IntegralKind = Literal['indefinite','definite']
Level = Literal['standard','detailed','lecture']

class ProblemRequest(BaseModel):
    input: str = Field(..., examples=['x^2e^x'])
    kind: IntegralKind = 'indefinite'
    lower: str = '0'
    upper: str = '1'
    level: Level = 'lecture'
    hide_answer: bool = False

class HintRequest(BaseModel):
    input: str
    current_step: int = 0
    level: Level = 'standard'

class CheckRequest(BaseModel):
    problem: str
    student_answer: str

class DiagnoseRequest(BaseModel):
    input: str
    failed_step_id: Optional[str] = None
    student_work: Optional[str] = None

class VisualizeRequest(BaseModel):
    input: str
    lower: str = '0'
    upper: str = '1'
    samples: int = 80

class Step(BaseModel):
    id: str
    title: str
    tex: str
    explanation: str
    hint: str
    related_topics: List[str] = []
    common_mistakes: List[str] = []

class FinalAnswer(BaseModel):
    tex: str
    plain: str
    explanation: str

class Diagnostic(BaseModel):
    main_topic: str
    weak_points: List[str]
    prerequisites: List[str]
    review_order: List[str]
    practice_problems: List[str]

class GraphPoint(BaseModel):
    x: float
    y: float

class GraphData(BaseModel):
    function_tex: str
    lower: Optional[float] = None
    upper: Optional[float] = None
    x_min: Optional[float] = None
    x_max: Optional[float] = None
    y_min: Optional[float] = None
    y_max: Optional[float] = None
    integral_value_tex: Optional[str] = None
    primitive_tex: Optional[str] = None
    primitive_points: List[GraphPoint] = []
    primitive_shift_up_points: List[GraphPoint] = []
    primitive_shift_down_points: List[GraphPoint] = []
    points: List[GraphPoint]

class Slide(BaseModel):
    title: str
    tex: str
    body: str
    visual_hint: str

class TutorResponse(BaseModel):
    mode: Mode
    problem: Dict[str, Any]
    steps: List[Step]
    final_answer: Optional[FinalAnswer] = None
    diagnostics: Diagnostic
    graph: Optional[GraphData] = None
    slides: List[Slide] = []
    warnings: List[str] = []

class CheckResponse(BaseModel):
    is_correct: bool
    derivative_tex: str
    difference_tex: str
    feedback: str
    diagnostics: Diagnostic

class WorkLineDiagnosis(BaseModel):
    line_number: int
    raw: str
    parsed_tex: Optional[str] = None
    derivative_tex: Optional[str] = None
    difference_tex: Optional[str] = None
    status: Literal['ok','check','parse_error']
    feedback: str

class WorkDiagnosisResponse(BaseModel):
    lines: List[WorkLineDiagnosis]
    summary: str
    diagnostics: Diagnostic
