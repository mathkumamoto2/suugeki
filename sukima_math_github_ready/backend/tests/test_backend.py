import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.math_engine import solve_problem, tex, check_student_answer
from app.topic_mapper import build_diagnostic
from app.visualization import graph_data

cases=['x^2e^x','x e^x','2*x*cos(x^2)','2*x*e^(x^2)','1/(x^2+3*x+2)','sin(x)','x^2+3*x+1']
for c in cases:
    expr,lo,hi,ans,steps=solve_problem(c)
    print(c, tex(ans), len(steps))
    assert steps
ok,_,der,diff=check_student_answer('x^2e^x','(x^2 - 2*x + 2)*e^x')
assert ok, (der,diff)
try:
    solve_problem('a*x')
    raise AssertionError('a*x should fail')
except ValueError:
    pass
expr,*_=solve_problem('x^2e^x')
diag=build_diagnostic(expr)
assert diag.review_order
assert len(graph_data('x^2','0','2').points)>=8
print('BACKEND_TEST_OK')
