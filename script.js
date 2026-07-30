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
