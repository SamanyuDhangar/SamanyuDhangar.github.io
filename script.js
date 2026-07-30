const messages = [
    "Initializing...",
    "Loading Interface...",
    "Authenticating...",
    "Access Granted"
];

const loadingText = document.getElementById("loading-text");
const loader = document.getElementById("loader");

let index = 0;

function nextMessage() {

    loadingText.textContent = messages[index];

    index++;

    if(index < messages.length){

        setTimeout(nextMessage,700);

    }else{

        setTimeout(()=>{

            loader.style.opacity="0";

            setTimeout(()=>{
                loader.style.display="none";
            },700);

        },800);

    }

}

window.onload=()=>{

    nextMessage();

}
