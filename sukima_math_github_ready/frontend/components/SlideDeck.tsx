'use client';
import {useState} from 'react';
import type {Slide} from '@/lib/types';
import {MathBlock} from './MathBlock';
export function SlideDeck({slides}:{slides:Slide[]}){const [idx,setIdx]=useState(0);if(!slides.length)return <div className="card">スライドがありません。</div>;const s=slides[idx];return <div className="card"><div className="slide"><span className="badge">{idx+1} / {slides.length}</span><h2>{s.title}</h2><MathBlock tex={s.tex}/><p>{s.body}</p><div className="card"><strong>視覚化メモ：</strong><p>{s.visual_hint}</p></div></div><div style={{display:'flex',gap:8}}><button className="secondary" onClick={()=>setIdx(Math.max(0,idx-1))}>前へ</button><button onClick={()=>setIdx(Math.min(slides.length-1,idx+1))}>次へ</button></div></div>}
