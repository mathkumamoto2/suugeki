from __future__ import annotations
import re
from typing import List
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
from .schemas import Step, FinalAnswer

x = sp.Symbol('x')
TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)
LOCAL_DICT = {'x':x,'e':sp.E,'E':sp.E,'pi':sp.pi,'sin':sp.sin,'cos':sp.cos,'tan':sp.tan,'exp':sp.exp,'log':sp.log,'ln':sp.log,'sqrt':sp.sqrt,'abs':sp.Abs}

def normalize_input(s:str)->str:
    s=s.strip().replace('　',' ').replace('−','-').replace('–','-').replace('π','pi').replace('×','*').replace('÷','/').replace('^','**').replace('∫','')
    s=re.sub(r'\bdx\b','',s); s=re.sub(r'\bint\b','',s,flags=re.I); return s.strip()

def validate_input(s:str)->None:
    if not s or not s.strip(): raise ValueError('式が空です。')
    if not re.fullmatch(r"[0-9a-zA-Z_\+\-\*/\^\(\)\.\,\sπ×÷∫]+",s): raise ValueError('使える文字は、数字・x・四則演算・括弧・sin/cos/exp/log/sqrt などに限定しています。')
    for t in ['__','[',']','{','}',';',':']:
        if t in s: raise ValueError('安全のため、この入力は受け付けません。')
    for t in ['import','eval','exec','open','sys','subprocess','lambda']:
        if re.search(r'\b'+re.escape(t)+r'\b',s.lower()): raise ValueError('安全のため、この入力は受け付けません。')

def parse_math(s:str)->sp.Expr:
    validate_input(s)
    expr=sp.simplify(parse_expr(normalize_input(s),local_dict=LOCAL_DICT,transformations=TRANSFORMATIONS,evaluate=True))
    unknown=expr.free_symbols-{x}
    if unknown: raise ValueError('このMVPで使える変数は x のみです。未対応: '+','.join(map(str,unknown)))
    return expr

def parse_bound(s:str)->sp.Expr:
    validate_input(s)
    expr=sp.simplify(parse_expr(normalize_input(s),local_dict=LOCAL_DICT,transformations=TRANSFORMATIONS,evaluate=True))
    if expr.free_symbols: raise ValueError('積分範囲には x を含めないでください。')
    return expr

def tex(expr)->str: return sp.latex(sp.simplify(expr))

def is_linear(arg:sp.Expr):
    arg=sp.expand(arg); a=sp.diff(arg,x); b=sp.simplify(arg-a*x); return (not a.has(x) and not b.has(x)),sp.simplify(a),sp.simplify(b)

def mkstep(id_,title,tex_,explanation,hint,topics,mistakes=None):
    return Step(id=id_,title=title,tex=tex_,explanation=explanation,hint=hint,related_topics=topics,common_mistakes=mistakes or [])

def detect_poly_exp(expr:sp.Expr):
    expr=sp.simplify(expr); factors=list(sp.Mul.make_args(expr)); exp_arg=None; n=None
    if expr.func==sp.exp: return True,0,expr.args[0]
    for f in factors:
        if f.func==sp.exp:
            exp_arg=f.args[0]
            if not is_linear(exp_arg)[0]: return False,0,sp.Integer(0)
        elif f==x: n=1
        elif f.is_Pow and f.base==x and f.exp.is_integer and int(f.exp)>=0: n=int(f.exp)
        else: return False,0,sp.Integer(0)
    return exp_arg is not None and n is not None, (n or 0), (exp_arg or sp.Integer(0))

def detect_rational(expr:sp.Expr):
    num,den=sp.fraction(sp.together(expr))
    if den==1: return False,expr
    try: sp.Poly(num,x); sp.Poly(den,x); return True,sp.apart(expr,x)
    except Exception: return False,expr

def detect_substitution(expr:sp.Expr):
    for f in sp.Mul.make_args(expr):
        if f.func in (sp.exp,sp.sin,sp.cos): u,kind=f.args[0],f.func.__name__
        elif f.is_Pow and f.exp==-1: u,kind=f.base,'reciprocal'
        else: continue
        du=sp.diff(u,x)
        if du==0: continue
        ratio=sp.simplify((expr/f)/du)
        if not ratio.has(x): return True,u,kind
    return False,None,None

def tags_for(expr:sp.Expr)->List[str]:
    tags=[]
    if expr.is_Add: tags.append('和の積分')
    coeff,rest=expr.as_coeff_Mul()
    if coeff!=1 and rest!=1: tags.append('定数倍')
    if (expr.is_Pow and expr.base==x) or expr==x or expr==1/x: tags.append('べき関数')
    if expr.has(sp.exp): tags.append('指数関数')
    if expr.has(sp.sin) or expr.has(sp.cos) or expr.has(sp.tan): tags.append('三角関数')
    if detect_poly_exp(expr)[0]: tags.append('部分積分')
    if detect_substitution(expr)[0]: tags.append('置換積分')
    if detect_rational(expr)[0]: tags.append('有理関数')
    return list(dict.fromkeys(tags)) or ['自動計算']

def solve_integral_steps(expr:sp.Expr):
    expr=sp.simplify(expr)
    if expr.is_Add:
        ans=sp.integrate(expr,x); terms=list(expr.as_ordered_terms())
        return sp.simplify(ans),[mkstep('split_sum','和の積分に分ける',r'\int('+tex(expr)+r')\,dx='+'+'.join([r'\int '+tex(t)+r'\,dx' for t in terms]),'積分は足し算に対して分配できます。','まず足し算で分けられる部分を探してください。',['和の積分','線形性']),mkstep('sum_result','結果をまとめる',r'\int('+tex(expr)+r')\,dx='+tex(ans)+r'+C','項ごとの積分結果を足し合わせます。','最後に +C を忘れないでください。',['式整理'])]
    if expr==x or (expr.is_Pow and expr.base==x):
        n=sp.Integer(1) if expr==x else sp.simplify(expr.exp)
        if n==-1: return sp.log(sp.Abs(x)),[mkstep('one_over_x','1/x の特別公式',r'\int\frac1x\,dx=\log|x|+C','n=-1ではべき関数公式が使えないのでlogを使います。','x^nの公式にn=-1を入れないでください。',['対数関数','1/xの積分'])]
        ans=sp.simplify(x**(n+1)/(n+1)); return ans,[mkstep('power_rule','べき関数の公式',r'\int x^{'+tex(n)+r'}\,dx=\frac{x^{'+tex(n+1)+r'}}{'+tex(n+1)+r'}+C','指数に1を足し、新しい指数で割ります。','指数を1つ上げて、新しい指数で割ってください。',['指数法則','べき関数の積分'])]
    if expr.func in (sp.exp,sp.sin,sp.cos):
        arg=expr.args[0]; ok,a,_=is_linear(arg)
        if ok and a!=0:
            ans=sp.integrate(expr,x); name='指数関数' if expr.func==sp.exp else ('sin' if expr.func==sp.sin else 'cos')
            return sp.simplify(ans),[mkstep('basic_'+name,name+' の公式',r'\int '+tex(expr)+r'\,dx='+tex(ans)+r'+C',name+'の基本公式を使います。','符号と内側の係数に注意してください。',['基本公式','連鎖律'])]
    sub_ok,u,kind=detect_substitution(expr)
    if sub_ok and u is not None:
        du=sp.diff(u,x); ans=sp.integrate(expr,x)
        return sp.simplify(ans),[mkstep('sub_detect','置換積分を使う判断',r'\int '+tex(expr)+r'\,dx','内側の関数とその微分が同時に現れています。','内側の式 u を探してください。',['合成関数','連鎖律','置換積分']),mkstep('sub_u','uを置く',r'u='+tex(u),'複雑な内側の式をuと置きます。','一番内側のまとまりを見つけてください。',['置換積分']),mkstep('sub_du','duを求める',r'du='+tex(du)+r'\,dx','uをxで微分します。','duが式の中に見えているか確認してください。',['微分','連鎖律']),mkstep('sub_back','uを戻す',r'\int '+tex(expr)+r'\,dx='+tex(ans)+r'+C','最後はxの式に戻します。','答えにuが残らないようにしてください。',['式整理'])]
    poly_ok,n,arg=detect_poly_exp(expr)
    if poly_ok and n>0 and arg==x:
        I={0:sp.exp(x)}
        for k in range(1,n+1): I[k]=sp.simplify(x**k*sp.exp(x)-k*I[k-1])
        ans=sp.simplify(I[n]); steps=[mkstep('parts_detect','部分積分を使う判断',r'\int '+tex(expr)+r'\,dx','多項式×指数関数の形です。多項式は微分で次数が下がり、e^xは積分しても形が変わりません。','どちらを微分すると簡単になるか考えてください。',['積の微分','部分積分']),mkstep('parts_formula','部分積分公式',r'\int u\,dv=uv-\int v\,du','積の微分公式を逆向きに使います。','uvの微分を思い出してください。',['積の微分','部分積分公式'])]
        for k in range(n,0,-1): steps += [mkstep(f'I{k}',f'I_{k}を定義',rf'I_{k}=\int x^{k}e^x\,dx','同じ形の積分を記号化します。','I_kと置くと見通しがよくなります。',['記号化','部分積分']),mkstep(f'choose{k}',f'I_{k}でuとdvを選ぶ',rf'u=x^{k},\quad dv=e^x\,dx','微分すると簡単になる多項式側をuにします。','多項式をu、e^x dxをdvにしてください。',['uとdvの選択'],['e^xをuにしても簡単になりません。']),mkstep(f'rel{k}',f'I_{k}の関係式',rf'I_{k}=x^{k}e^x-{k}I_{k-1}','xの次数が1つ下がります。','次数が下がっているか確認してください。',['式変形'])]
        steps.append(mkstep('parts_result','下から戻して整理',r'\int '+tex(expr)+r'\,dx='+tex(ans)+r'+C','I_0から戻すと答えが得られます。','e^xが全体に掛かる形を確認してください。',['式整理','因数分解'],['(x^2-2x+2)e^xをx^2-2x+2e^xと書くのは誤りです。']))
        return ans,steps
    rat_ok,apart=detect_rational(expr)
    if rat_ok and sp.simplify(apart-expr)!=0:
        ans=sp.integrate(expr,x); return sp.simplify(ans),[mkstep('pf_detect','有理関数だと判断',r'\int '+tex(expr)+r'\,dx','分母にxを含む分数式なので部分分数分解を考えます。','まず分母を因数分解してください。',['因数分解','分数式']),mkstep('pf_apart','部分分数分解',tex(expr)+'='+tex(apart),'基本形に近い分数の和に分解します。','A/(x+a)+B/(x+b)の形を考えます。',['部分分数分解']),mkstep('pf_integrate','分解後に積分',r'\int '+tex(apart)+r'\,dx='+tex(ans)+r'+C','各項はlogの公式で積分できます。','1/(x+a)の積分はlog|x+a|です。',['logの積分'])]
    ans=sp.integrate(expr,x); return sp.simplify(ans),[mkstep('fallback','SymPyで積分',r'\int '+tex(expr)+r'\,dx='+tex(ans)+r'+C','詳細テンプレート未対応ですが計算と検算は返します。','どの基本パターンに近いか確認してください。',tags_for(expr))]

def solve_problem(expr_input:str, kind:str='indefinite', lower:str='0', upper:str='1'):
    expr=parse_math(expr_input); ans,steps=solve_integral_steps(expr); lo=hi=None
    if kind=='definite': lo=parse_bound(lower); hi=parse_bound(upper)
    return expr,lo,hi,sp.simplify(ans),steps

def final_answer(expr,answer,kind='indefinite',lower=None,upper=None):
    if kind=='definite' and lower is not None and upper is not None:
        val=sp.simplify(answer.subs(x,upper)-answer.subs(x,lower)); return FinalAnswer(tex=tex(val),plain=str(val),explanation='F(上端)-F(下端) を計算しました。')
    return FinalAnswer(tex=tex(answer)+r'+C',plain=str(answer)+' + C',explanation='不定積分なので積分定数Cを付けます。')

def check_student_answer(problem:str,student_answer:str):
    expr=parse_math(problem); ans=parse_math(student_answer.replace('+C','').replace('+ C','').strip()); der=sp.simplify(sp.diff(ans,x)); diff=sp.simplify(der-expr); return diff==0,expr,der,diff

def diagnose_work_lines(problem:str,work:str):
    expr=parse_math(problem); rows=[]
    for i,line in enumerate([ln.strip() for ln in work.splitlines() if ln.strip()],1):
        candidate=line.split('=')[-1].replace('+C','').replace('+ C','').strip()
        try:
            ans=parse_math(candidate); der=sp.simplify(sp.diff(ans,x)); diff=sp.simplify(der-expr); rows.append((i,line,ans,der,diff,diff==0,None))
        except Exception as exc: rows.append((i,line,None,None,None,False,str(exc)))
    return rows
