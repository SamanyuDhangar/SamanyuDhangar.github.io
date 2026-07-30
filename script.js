// ==============================
// SECTION NAVIGATION
// ==============================

const sections = document.querySelectorAll("section");
const buttons = document.querySelectorAll(".nav-btn");


// Hide all sections
function hideAllSections() {

    sections.forEach(section => {

        section.style.display = "none";

    });

}


// Show selected section
function showSection(id) {

    hideAllSections();

    const section = document.getElementById(id);

    if(section){

        section.style.display = "block";

        section.classList.add("active");

    }

}


// Navigation button clicks

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const target = button.getAttribute("data-section");

        showSection(target);

    });

});


// ==============================
// START WITH HOME PAGE
// ==============================

window.onload = () => {

    showSection("home");

};


// ==============================
// TYPING EFFECT
// ==============================


const text = "Cyber Security Enthusiast";

let index = 0;


function typingEffect(){

    const element = document.querySelector(".typing");


    if(element && index < text.length){

        element.innerHTML += text.charAt(index);

        index++;

        setTimeout(typingEffect,150);

    }

}


window.addEventListener("load", typingEffect);


// ==============================
// PARTICLE BACKGROUND
// ==============================


const canvas = document.getElementById("particles");

if(canvas){

const ctx = canvas.getContext("2d");


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let particles = [];


for(let i=0;i<100;i++){

particles.push({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
size:Math.random()*3,
speedX:(Math.random()-0.5),
speedY:(Math.random()-0.5)

});


}



function animateParticles(){


ctx.clearRect(0,0,canvas.width,canvas.height);



particles.forEach(p=>{


ctx.beginPath();

ctx.arc(p.x,p.y,p.size,0,Math.PI*2);

ctx.fillStyle="cyan";

ctx.fill();



p.x+=p.speedX;

p.y+=p.speedY;



if(p.x<0||p.x>canvas.width)
p.speedX*=-1;


if(p.y<0||p.y>canvas.height)
p.speedY*=-1;



});



requestAnimationFrame(animateParticles);


}



animateParticles();



window.addEventListener("resize",()=>{

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

});


}


// ==============================
// LOADER
// ==============================


window.addEventListener("load",()=>{


const loader=document.getElementById("loader");


if(loader){

setTimeout(()=>{

loader.style.display="none";

},1500);


}


});
