from __future__ import annotations
import sympy as sp
from .schemas import Diagnostic
from .math_engine import tags_for

TOPIC_DATA={
 'べき関数':('べき関数の積分',['指数法則','べき関数の微分','積分は微分の逆操作'],['指数法則','べき関数の微分','べき関数の積分'],['x^2','x^5','sqrt(x)']),
 '指数関数':('指数関数の積分',['指数法則','e^xの微分','合成関数'],['e^xの微分','e^xの積分','e^(ax+b)の積分'],['e^x','e^(2*x)','3*e^(3*x+1)']),
 '三角関数':('三角関数の積分',['三角関数の微分','符号の確認','合成関数'],['sin/cosの微分','sin/cosの積分','合成関数の積分'],['sin(x)','cos(x)','cos(2*x)']),
 '置換積分':('置換積分',['合成関数','連鎖律','内側の関数とその微分'],['合成関数','連鎖律','置換積分'],['2*x*cos(x^2)','2*x*e^(x^2)','1/(x+1)']),
 '部分積分':('部分積分',['積の微分','部分積分公式','uとdvの選択','式整理'],['積の微分','部分積分公式','x e^x','x^2 e^x'],['x*e^x','x^2*e^x','log(x)']),
 '有理関数':('有理関数の積分',['因数分解','分数式の変形','部分分数分解','logの積分'],['因数分解','部分分数分解','logの積分'],['1/(x^2+3*x+2)','1/(x^2-1)','x/(x^2+1)']),
 '和の積分':('積分の線形性',['式の展開','項ごとの処理','基本公式'],['式の整理','積分の線形性','基本公式'],['x^2+3*x+1','sin(x)+cos(x)','e^x+x^2']),
}

def build_diagnostic(expr:sp.Expr, failed_step_id:str|None=None)->Diagnostic:
    tags=tags_for(expr); selected=None
    for t in tags:
        if t in TOPIC_DATA: selected=TOPIC_DATA[t]; break
    if selected is None: selected=('積分の基本確認',['基本公式','式整理'],['基本公式','例題演習'],['x^2','e^x','sin(x)'])
    main,pre,review,practice=selected
    weak=[]
    if failed_step_id:
        if 'choose' in failed_step_id or 'parts' in failed_step_id: weak+=['uとdvの選択','積の微分の理解']
        if 'sub' in failed_step_id: weak+=['内側の関数とその微分の発見','連鎖律']
        if 'pf' in failed_step_id: weak+=['因数分解','部分分数分解']
    if not weak: weak=pre[:2]
    return Diagnostic(main_topic=main,weak_points=weak,prerequisites=pre,review_order=review,practice_problems=practice)
