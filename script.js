const loader = document.getElementById("loader");
const loadingText = document.getElementById("loading-text");
const hero = document.querySelector(".hero-content");

const bootMessages = [
    "Initializing Security Core...",
    "Loading Neural Interface...",
    "Verifying Identity...",
    "Identity Verified",
    "Welcome back, Samanyu."
];

let messageIndex = 0;
let letterIndex = 0;

function typeMessage() {

    if (messageIndex >= bootMessages.length) {
        finishLoading();
        return;
    }

    const currentMessage = bootMessages[messageIndex];

    if (letterIndex < currentMessage.length) {

        loadingText.textContent =
            currentMessage.substring(0, letterIndex + 1) + "▋";

        letterIndex++;

        setTimeout(typeMessage, 70);

    } else {

        setTimeout(() => {

            messageIndex++;
            letterIndex = 0;

            typeMessage();

        }, 1200);

    }

}

function finishLoading() {

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.style.display = "none";

        hero.classList.add("show");

    }, 800);

}

window.onload = () => {

    typeMessage();

};
const enterBtn = document.getElementById("enterBtn");

enterBtn.addEventListener("click", () => {

    document.body.classList.add("glitch");

    loader.style.display = "flex";
    loader.style.opacity = "1";

    loadingText.textContent = "Opening Secure Interface...";

    setTimeout(() => {

        loader.style.opacity = "0";

        setTimeout(() => {

            loader.style.display = "none";

            document.body.classList.remove("glitch");

            hero.classList.add("show");

        },700);

    },1200);

});
const text = [
    "Aspiring Cloud Security Engineer",
    "Learning Linux",
    "Studying CCNA",
    "Building Cyber Projects"
];

let word = 0;
let letter = 0;

function type() {

    const target = document.getElementById("typing");

    if(letter < text[word].length){

        target.textContent += text[word].charAt(letter);

        letter++;

        setTimeout(type,70);

    }

    else{

        setTimeout(erase,1800);

    }

}

function erase(){

    const target = document.getElementById("typing");

    if(letter>0){

        target.textContent=text[word].substring(0,--letter);

        setTimeout(erase,40);

    }

    else{

        word=(word+1)%text.length;

        setTimeout(type,300);

    }

}

type();
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

const particles = [];

for(let i=0;i<120;i++){
    particles.push({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        r:Math.random()*2+1,
        dx:(Math.random()-0.5)*0.3,
        dy:(Math.random()-0.5)*0.3
    });
}

function animate(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="#7C3AED";

    particles.forEach(p=>{

        p.x+=p.dx;
        p.y+=p.dy;

        if(p.x<0)p.x=canvas.width;
        if(p.x>canvas.width)p.x=0;
        if(p.y<0)p.y=canvas.height;
        if(p.y>canvas.height)p.y=0;

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();

    });

    requestAnimationFrame(animate);
}

animate();
const terminalData =
`$ whoami
Samanyu Dhangar

$ role
Aspiring Cloud Security Engineer

$ education
B.Tech Computer Science Engineering

$ learning
Linux
CCNA
TryHackMe
Python
AWS Cloud

$ mission
Build secure cloud infrastructure.

`;

const terminal = document.getElementById("terminal-text");

let index = 0;

function typeTerminal(){

    if(index < terminalData.length){

        terminal.textContent += terminalData.charAt(index);

        index++;

        setTimeout(typeTerminal,25);

    }

}

typeTerminal();
