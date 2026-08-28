# -*- coding: utf-8 -*-
import os, subprocess, json
from PIL import Image, ImageDraw, ImageFont
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
W,H=1080,1920
FB="/Users/sj/Library/Fonts/Pretendard-Bold.ttf"
FS="/Users/sj/Library/Fonts/Pretendard-SemiBold.ttf"
if not os.path.exists(FB): FB="/System/Library/Fonts/AppleSDGothicNeo.ttc"
if not os.path.exists(FS): FS=FB
F=lambda p,s: ImageFont.truetype(p,s)
sub=F(FB,56); big=F(FB,190); mid=F(FB,110); mini=F(FB,52); tag=F(FS,38); dis=F(FS,32); chip=F(FB,60)

def outline(d,xy,t,font,fill,ow=7,oc=(14,16,20,240),anchor="mm"):
    x,y=xy
    for dx in range(-ow,ow+1,2):
        for dy in range(-ow,ow+1,2):
            if dx*dx+dy*dy<=ow*ow: d.text((x+dx,y+dy),t,font=oc and font,fill=oc,anchor=anchor)
    d.text((x,y),t,font=font,fill=fill,anchor=anchor)

def newlayer(): return Image.new("RGBA",(W,H),(0,0,0,0))
def save(im,name): im.save(name); return name

def mk_sub(lines,name):
    im=newlayer(); d=ImageDraw.Draw(im)
    base=H-300-(len(lines)-1)*40
    for i,ln in enumerate(lines): outline(d,(W//2,base+i*80),ln,sub,(255,255,255,255))
    return save(im,name)

def mk_tag(name):
    im=newlayer(); d=ImageDraw.Draw(im)
    t="오늘의 800선 용어: 경기종합지수"
    bb=d.textbbox((0,0),t,font=tag); w,h=bb[2]-bb[0],bb[3]-bb[1]
    d.rounded_rectangle([52,64,52+w+44,64+h+34],radius=(h+34)//2,fill=(18,22,30,205))
    d.text((74,79),t,font=tag,fill=(232,236,240,255))
    return save(im,name)

def mk_disc(name):
    im=newlayer(); d=ImageDraw.Draw(im)
    t="투자 추천 아님 · 용어·구조 해설"
    d.text((W//2,H-96),t,font=dis,fill=(225,228,232,225),anchor="mm")
    bb=d.textbbox((W//2,H-96),t,font=dis,anchor="mm")
    return save(im,name)

def mk_over(spec,name):
    im=newlayer(); d=ImageDraw.Draw(im)
    for t,style,(x,y) in spec:
        if style=="big": outline(d,(x,y),t,big,(60,224,255,255),ow=9)
        elif style=="red": outline(d,(x,y),t,mid,(255,72,72,255),ow=9)
        elif style=="mini": outline(d,(x,y),t,mini,(255,255,255,255),ow=7)
        elif style=="chip":
            bb=d.textbbox((0,0),t,font=chip); w,h=bb[2]-bb[0],bb[3]-bb[1]
            d.rounded_rectangle([x-w//2-30,y-h//2-26,x+w//2+30,y+h//2+30],radius=22,fill=(255,214,64,240))
            d.text((x,y),t,font=chip,fill=(20,22,28,255),anchor="mm")
        elif style=="stamp":
            bb=d.textbbox((0,0),t,font=mid); w,h=bb[2]-bb[0],bb[3]-bb[1]
            d.rounded_rectangle([x-w//2-34,y-h//2-30,x+w//2+34,y+h//2+34],radius=18,outline=(150,152,158,245),width=9)
            outline(d,(x,y),t,mid,(150,152,158,250),ow=6)
    return save(im,name)

CUTS=[
 dict(id=1, imgs=["im1a.png","im1b.png"], split=[0.66],
   subs=[("토요일 2시, 카페 웨이팅이 32번이었음",0.00,0.36),("그날 장사 진짜 잘됐다는 뜻임",0.36,0.63),("근데 그날 저녁 뉴스는|경기가 불황이라고 함",0.63,1.0)],
   overs=[([("32","big",(505,955))],0.02,0.64),([("= 장사 잘된 날","mini",(505,1150))],0.30,0.64),([("경기, 불황","red",(540,940))],0.68,1.0)]),
 dict(id=2, imgs=["im2.png"], split=[],
   subs=[("그날 밤 찾아봤음",0.0,0.28),("둘 중 하나는 틀렸을 줄 알았는데",0.28,0.60),("알고 보니 둘 다 맞았고|다른 이유가 있었음",0.60,1.0)], overs=[]),
 dict(id=3, imgs=["im3a.png","im3b.png"], split=[0.45],
   subs=[("경기는 나라 전체가 평소보다|잘 돌고 있는지를 말함",0.0,0.24),("내 눈앞 카페 하나로는|나라 전체를 알 수 없음",0.24,0.46),("그래서 전국의 생산·소비·고용 지표를|다 모아서 지수 하나로 만듦",0.46,0.80),("그게 경기종합지수임",0.80,1.0)],
   overs=[([("경기","chip",(540,700))],0.05,0.24),([("경기종합지수","chip",(540,700))],0.80,1.0)]),
 dict(id=4, imgs=["im4a.png","im4b.png","im4c.png"], split=[0.42,0.70],
   subs=[("이 지수가 세 갈래로 나뉨",0.0,0.13),("앞을 점치는 게 선행종합지수",0.13,0.26),("지금을 재는 게 동행종합지수",0.26,0.38),("지난 경기를 되짚는 게 후행종합지수임",0.38,0.50),("어느 쪽으로 움직였는지로|경기 방향을 보고",0.50,0.66),("얼마나 세게 움직였는지로|그 힘이 큰지 작은지를 봄",0.66,0.82),("경기 판단할 때|제일 먼저 보는 계기판임",0.82,1.0)],
   overs=[([("어느 쪽으로 = 방향","mini",(540,660)),("얼마나 세게 = 힘","mini",(540,760))],0.50,0.70)]),
 dict(id=5, imgs=["im5.png"], split=[],
   subs=[("근데 뉴스 제목은|셋 중 뭘 읽었는지 안 알려줌",0.0,0.45),("그럼 그날 건 뭐지 싶었다면",0.45,0.72),("그게 정확한 질문임",0.72,1.0)], overs=[]),
 dict(id=6, imgs=["im6a.png","im6b.png"], split=[0.32],
   subs=[("그럼 지금이 불황인지는|누가 정해 주는데?",0.0,0.22),("통계청이 정해 줌",0.22,0.34),("나중에 돌아보고|그때가 꼭대기였다, 그때가 바닥이었다",0.34,0.62),("공식 날짜를 확정해 줌",0.62,0.78),("그 날짜가 기준순환일임",0.78,1.0)],
   overs=[([("기준순환일","chip",(540,700))],0.78,1.0)]),
 dict(id=7, imgs=["im7a.png"], split=[],
   subs=[("왜 바로 못 정하냐면",0.0,0.14),("생산이니 고용이니 여러 지표를|다 확인해야 하니까",0.14,0.38),("그래서 경기 판정은|생중계가 아니라 부검에 가까움",0.38,0.66),("지금 나온 불황이란 판정도|나중에 확정될 걸 미리 추정한 것뿐임",0.66,1.0)],
   overs=[([("사후 확인","mini",(540,690))],0.42,0.68)]),
 dict(id=8, imgs=["im7b.png","im7c.png","im7d.png"], split=[0.34,0.62],
   subs=[("예를 들어 경기가 여섯 달째|내리막이라는 뉴스가 떴다고 치자",0.0,0.24),("모르면 지금이 바닥이구나 하고|겁부터 남",0.24,0.42),("근데 이건 이미 지나간 걸|뒤늦게 확인하는 후행 얘기일 수 있음",0.42,0.66),("이게 뒷북이란 걸 알면",0.66,0.80),("헤드라인 하나에 겁먹고|손절하는 실수를 안 함",0.80,1.0)],
   overs=[([("경기, 6개월째 내리막","red",(540,900))],0.03,0.33),([("뒷북","stamp",(540,900))],0.38,0.62)]),
 dict(id=9, imgs=["im8.png"], split=[],
   subs=[("그날은 둘 다 맞았던 거임",0.0,0.28),("뉴스는 전국 평균의 지난달을 말했고",0.28,0.62),("내 눈은 우리 골목의 오늘을 봤으니까",0.62,1.0)], overs=[]),
 dict(id=10, imgs=["im9.png"], split=[],
   subs=[("이제 경기 기사는 제목만 보지 말고|본문까지 보면 됨",0.0,0.34),("선행·동행·후행 중 뭘 말하는지",0.34,0.56),("몇 월 자료인지 찾아보면 됨",0.56,0.78),("이거면 제목에 안 휘둘림",0.78,1.0)], overs=[]),
 dict(id=11, imgs=["im10.png"], split=[],
   subs=[("경기 안 좋다는 뉴스에|지금이 바닥인 줄 알고 움직이는 사람 많아요",0.0,0.17),("근데 방금 본 사람은 알죠",0.17,0.26),("그 판정은 사후에 나오는 뒷북이라는 거",0.26,0.38),("성장률이랑 물가를|나라가 미리 내다본 게 경제전망보고서예요",0.38,0.56),("가계는 뭘 살지, 기업은 얼마나 투자할지|정할 때 이걸 봐요",0.56,0.70),("심화 글은 프로필 링크에 있어요",0.70,0.80),("저장해두면 다음 경기 기사에서 그대로 먹혀요",0.80,0.90),("구독해두면 새 용어 뜰 때 알림 와요",0.90,0.96),("여기, 조곤경제.",0.96,1.0)],
   overs=[([("경제전망보고서","chip",(540,700))],0.40,0.58)]),
]

tagp=mk_tag("L_tag.png"); discp=mk_disc("L_disc.png")

def dur(f):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode().strip())

parts=[]
for c in CUTS:
    i=c["id"]; a=f"vo{i}.wav"; T=dur(a)
    bounds=[0.0]+c["split"]+[1.0]
    ins=[]; fc=[]
    for k,img in enumerate(c["imgs"]):
        seg=(bounds[k+1]-bounds[k])*T
        ins += ["-loop","1","-t",f"{seg:.3f}","-i",img]
        nf=max(2,int(seg*25))
        fc.append(f"[{k}:v]scale=1242:2208,zoompan=z='min(zoom+0.00055,1.10)':d={nf}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25,trim=duration={seg:.3f},setpts=PTS-STARTPTS,setsar=1[v{k}]")
    n=len(c["imgs"])
    fc.append("".join(f"[v{k}]" for k in range(n))+f"concat=n={n}:v=1:a=0,format=rgba[base]")
    ins += ["-i",a]
    idx=n+1
    ovl=[("L_tag.png",0.0,T)]
    if i>=4: ovl.append(("L_disc.png",0.0,T))
    for j,(spec,s,e) in enumerate(c["overs"]):
        ovl.append((mk_over(spec,f"O_{i}_{j}.png"),s*T,e*T))
    for j,(txt,s,e) in enumerate(c["subs"]):
        ovl.append((mk_sub(txt.split("|"),f"S_{i}_{j}.png"),s*T,e*T))
    cur="base"
    for j,(p,s,e) in enumerate(ovl):
        ins += ["-i",p]
        nxt=f"x{j}"
        fc.append(f"[{cur}][{idx}:v]overlay=0:0:enable='between(t,{s:.3f},{e:.3f})'[{nxt}]")
        cur=nxt; idx+=1
    fc.append(f"[{cur}]format=yuv420p[vout]")
    out=f"part{i:02d}.mp4"
    cmd=["ffmpeg","-y","-v","error"]+ins+["-filter_complex",";".join(fc),"-map","[vout]","-map",f"{n}:a","-t",f"{T:.3f}","-r","25","-c:v","libx264","-preset","medium","-crf","20","-c:a","aac","-b:a","192k",out]
    subprocess.check_call(cmd)
    parts.append(out); print(out, round(T,2))

with open("list.txt","w") as f:
    for p in parts: f.write(f"file '{p}'\n")
print("PARTS OK")
