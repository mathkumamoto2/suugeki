export type Step={id:string;title:string;tex:string;explanation:string;hint:string;related_topics:string[];common_mistakes:string[]};
export type FinalAnswer={tex:string;plain:string;explanation:string};
export type Diagnostic={main_topic:string;weak_points:string[];prerequisites:string[];review_order:string[];practice_problems:string[]};
export type GraphPoint={x:number;y:number};
export type GraphData={function_tex:string;lower?:number;upper?:number;points:GraphPoint[]};
export type Slide={title:string;tex:string;body:string;visual_hint:string};
export type TutorResponse={mode:string;problem:Record<string,unknown>;steps:Step[];final_answer?:FinalAnswer|null;diagnostics:Diagnostic;graph?:GraphData|null;slides:Slide[];warnings:string[]};
export type CheckResponse={is_correct:boolean;derivative_tex:string;difference_tex:string;feedback:string;diagnostics:Diagnostic};
export type WorkLineDiagnosis={line_number:number;raw:string;parsed_tex?:string;derivative_tex?:string;difference_tex?:string;status:'ok'|'check'|'parse_error';feedback:string};
export type WorkDiagnosisResponse={lines:WorkLineDiagnosis[];summary:string;diagnostics:Diagnostic};


export type PreviewResponse = {
  input: string;
  tex: string;
  display_tex: string;
};
