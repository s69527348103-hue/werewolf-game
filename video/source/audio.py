import numpy as np, wave
sr=44100; T=15; n=sr*T; out=np.zeros(n); rng=np.random.default_rng(1)
def add(sig,t,g=1.0):
    i=int(t*sr); e=min(n,i+len(sig)); out[i:e]+=sig[:e-i]*g
def kick(d=.45):
    t=np.arange(int(d*sr))/sr; f=50+120*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/sr
    return np.sin(ph)*np.exp(-t*7)
def boom(d=2.0):
    t=np.arange(int(d*sr))/sr; f=35+90*np.exp(-t*8); ph=2*np.pi*np.cumsum(f)/sr
    nz=rng.standard_normal(len(t))*np.exp(-t*12)*.4
    return (np.sin(ph)*np.exp(-t*2.2)+nz)
def hat(d=.06):
    t=np.arange(int(d*sr))/sr; x=rng.standard_normal(len(t)); x=np.diff(np.concatenate([[0],x]))
    return x*np.exp(-t*60)*.25
def whoosh(d=.6,rise=True):
    t=np.arange(int(d*sr))/sr; x=rng.standard_normal(len(t))
    # simple moving filter: one-pole lowpass with sweeping coefficient
    a=np.linspace(.02,.5,len(t)) if rise else np.linspace(.5,.02,len(t)); y=np.zeros_like(x); s=0
    for i in range(len(x)): s+=a[i]*(x[i]-s); y[i]=s
    env=np.sin(np.pi*t/d)**2; return y*env*1.4
def riser(d):
    t=np.arange(int(d*sr))/sr; f=200*2**(t*2.2); ph=2*np.pi*np.cumsum(f)/sr
    return (np.sin(ph)*.15+whoosh(d)*.5)*(t/d)**2
def bass(t0,d,f):
    t=np.arange(int(d*sr))/sr; s=np.sign(np.sin(2*np.pi*f*t))*.25+np.sin(2*np.pi*f*t)*.5
    y=np.zeros_like(s); a=.05; v=0
    for i in range(len(s)): v+=a*(s[i]-v); y[i]=v
    add(y*np.minimum(1,t*80)*np.exp(-t*3),t0,.5)
def chord(t0,d,fs,g=.06):
    t=np.arange(int(d*sr))/sr; s=sum(np.sin(2*np.pi*f*t)+.3*np.sin(4*np.pi*f*t*1.003) for f in fs)
    add(s*np.minimum(1,t*3)*np.minimum(1,(d-t)*3),t0,g)
# intro
add(riser(.5),0.0,.6); add(boom(),0.5,.9); chord(0.5,2.5,[110,164.8,220,277.2],.05)
add(riser(2.2),0.75,.8); add(boom(),2.95,1.0)
# beat 128bpm from 3.0 to 13.0
bt=60/128
k=3.0
while k<12.95:
    add(kick(),k,.9); add(hat(),k+bt/2,1); k+=bt
notes=[55,55,65.4,49]
for i,tt in enumerate(np.arange(3.0,12.9,bt*2)):
    bass(tt,bt*2,notes[(i//2)%4])
for c in [5.6,8.0,10.4]:
    add(whoosh(.6),c-.45,.9); add(boom(1.0),c,.5)
add(riser(1.2),11.8,.7); add(whoosh(.7),12.55,1); add(boom(2.0),13.0,1.0)
chord(13.0,2.0,[110,138.6,164.8,220],.06)
# fade out
fade=np.ones(n); fo=int(.8*sr); fade[-fo:]=np.linspace(1,0,fo); out*=fade
out=np.tanh(out*1.2); out/=np.abs(out).max()*1.05
d=(out*32767).astype(np.int16)
w=wave.open('audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(d.tobytes()); w.close()
