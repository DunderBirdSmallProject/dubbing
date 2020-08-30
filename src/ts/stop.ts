const diff = 0.1

function repeat(s: string, n: number): string {
    let result = s;
    for(let i = 1; i <= n-1; i++) {
        result += s;
    }
    return result;
}

function zeroExtend(s: string, zero: number, dir: boolean=true): string {
   if(s.length < zero) {
       if(dir) {
           return repeat('0', zero-s.length) + s;
       }
       else {
           return s + repeat('0', zero-s.length);
       }
   }
   return s;
}

function timeNormalize(t: number) : string {
    let second = Math.round(t % 60);
    t = Math.trunc(t / 60);
    let minute = Math.trunc(t % 60);
    t = Math.trunc(t / 60)
    let hour = t;
    let s_hour = hour ? zeroExtend(hour.toString(), 2) + ':' : '';
    let s_minute = (minute || hour) ? zeroExtend(minute.toString(), 2) + ':' : '';
    let s_second = zeroExtend(second.toString(), 2);
    return s_hour + s_minute + s_second;
}

class BreakPoint
{
    repeat: boolean;
    valid: boolean;
    time: number;
    constructor(time: number, repeat: boolean = false, valid: boolean = false) {
        this.time = time;
        this.repeat = repeat;
        this.valid = valid;
    }
    getDiv(idx: number = 0): HTMLDivElement {
        let newNode: HTMLDivElement = document.createElement('div') as HTMLDivElement;
        let timeTag: HTMLParagraphElement = document.createElement('p') as HTMLParagraphElement;
        let setDelete: HTMLButtonElement, setValid: HTMLButtonElement, setRepeat: HTMLButtonElement;
        setDelete = document.createElement('button') as HTMLButtonElement;
        setValid = document.createElement('button') as HTMLButtonElement;
        setRepeat = document.createElement('button') as HTMLButtonElement;

        newNode.setAttribute('class', 'breakPointItems');
        newNode.setAttribute('idx', String(idx));

        timeTag.textContent = timeNormalize(this.time);

        setDelete.textContent = 'delete';
        setDelete.classList.add('delete');

        setValid.textContent = this.valid ? 'active' : 'disabled';
        setValid.classList.add('valid');

        setRepeat.textContent = this.repeat ? 'repeat' : 'stop';
        setRepeat.classList.add('repeat');

        if(!this.valid) {
            newNode.style.backgroundColor = "gray";
        }
        else if(this.repeat) {
            newNode.style.backgroundColor = "lightblue";
        }
        else {
            newNode.style.backgroundColor = "white";
        }

        newNode.appendChild(timeTag);
        newNode.appendChild(setDelete);
        newNode.appendChild(setValid);
        newNode.appendChild(setRepeat);

        return newNode;
    }
};

let video: HTMLVideoElement;
let bpl: HTMLDivElement;
let breaks: Array<BreakPoint> = [];

window.onload = function () {
    bpl = document.getElementById('breakPointList') as HTMLDivElement;
    bpl.addEventListener('click', dealClick);
    video = document.getElementById('dubbing') as HTMLVideoElement;
    video.ontimeupdate = () => judgePoint();
}
function setFileName() {
    let newfilename: HTMLInputElement = document.getElementById('fileName') as HTMLInputElement;
    video.setAttribute('src', newfilename.value);
    breaks.splice(0, breaks.length);
}

function redrawBreakPointList() {
    while(bpl.hasChildNodes()) {
        bpl.removeChild(bpl.firstChild);
    }
    let i: number = 0;
    for (let brk of breaks) {
        bpl.appendChild(brk.getDiv(i));
        i++;
    }
}

function addBreakPoint(curTime: number) {
    for(let brk of breaks) {
        if(Math.abs(brk.time - curTime) <= diff) {
            return;
        }
    }
    breaks.push(new BreakPoint(curTime));
    breaks.sort((a: BreakPoint, b: BreakPoint) => {
        return a.time < b.time ? -1 : 1;
    })
    redrawBreakPointList();
}

function setBreakPoint() {
    addBreakPoint(video.currentTime);
}

function dealClick(e: Event) {
    let el: HTMLButtonElement = e.target as HTMLButtonElement;
    let ep: HTMLDivElement = el.parentNode as HTMLDivElement;
    let idx: number = Number(ep.getAttribute('idx'));
    if (el.classList.contains('delete')) {
        breaks.splice(idx, 1);
    }
    else if(el.classList.contains('repeat')) {
        breaks[idx].repeat = !breaks[idx].repeat;
    }
    else if(el.classList.contains('valid')) {
        breaks[idx].valid = !breaks[idx].valid;
    }
    redrawBreakPointList();
}

function judgePoint() {
    let cTime: number = video.currentTime;
    let duration = video.duration;
    if(Math.abs(duration - cTime) <= diff) {
        for(let i = breaks.length-1; i >= 0; i--) {
            if(!breaks[i].valid) {
                continue;
            }
            if(breaks[i].repeat) {
                video.pause();
                video.currentTime = breaks[i].time + 2 * diff;
                video.play();
                return;
            }
            else {
                break;
            }
        }
        video.pause();
    }
    for(let i = 0; i < breaks.length; i++) {
        if(Math.abs(breaks[i].time-cTime) <= diff) {
            if(!breaks[i].valid) {
                continue;
            }
            if(breaks[i].repeat) {
                let preBrk: number = -1;
                for(let j = i - 1; j >= 0; j--) {
                    if(breaks[j].valid) {
                        preBrk = j;
                        break;
                    }
                }
                if (preBrk == -1) {
                    video.currentTime = 0;
                }
                else {
                    video.pause();
                    video.currentTime = breaks[preBrk].time + 2 * diff;
                    video.play();
                }
                return;
            }
            else {
                video.pause();
            }
        }
    }
}
