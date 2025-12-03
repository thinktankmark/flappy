/* ------------------------- */
/* --- SCREEN SLIDE LOGIC --- */
/* ------------------------- */
function goToScreen(n) {
    document.getElementById("screens").style.transform =
        `translateX(-${n * 100}vw)`;
}

/* ------------------------- */
/* --- ELEMENTS --- */
const goToCamera = document.getElementById("goToCamera");
const captureBtn = document.getElementById("captureBtn");
const goToGame = document.getElementById("goToGame");
const restartGameBtn = document.getElementById("restartGame");
const finalScore = document.getElementById("finalScore");

const cameraPreview = document.getElementById("cameraPreview");
const selfiePreview = document.getElementById("selfiePreview");

let stream;

/* ------------------------- */
/* SCREEN 1 → SCREEN 2 */
goToCamera.onclick = async () => {
    goToScreen(1);
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraPreview.srcObject = stream;
};

/* ------------------------- */
/* CAPTURE SELFIE */
captureBtn.onclick = () => {
    const temp = document.createElement("canvas");
    const size = 240;
    temp.width = size;
    temp.height = size;
    const ctx = temp.getContext("2d");

    const video = cameraPreview;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;

    ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);

    let imgData = temp.toDataURL("image/png");
    selfiePreview.src = imgData;
    selfiePreview.style.display = "block";

    window.selfieImage = imgData;
    goToGame.disabled = false;
    // const temp = document.createElement("canvas");
    // temp.width = 240;
    // temp.height = 240;
    // const ctx = temp.getContext("2d");
    // ctx.drawImage(cameraPreview, 0, 0, 240, 240);

    // let imgData = temp.toDataURL("image/png");
    // selfiePreview.src = imgData;
    // selfiePreview.style.display = "block";

    // // store for use in game
    // window.selfieImage = imgData;

    // goToGame.disabled = false;
};

/* ------------------------- */
/* SCREEN 2 → SCREEN 3 */
let birdImg = new Image();

function loadBirdSelfie() {
    const bodyImg = new Image();
    bodyImg.src = "./1.gif"; // your existing bird body image

    // Create a canvas to build the final bird sprite
    const canvas = document.createElement("canvas");
    canvas.width = birdWidth;
    canvas.height = birdHeight;
    const ctx = canvas.getContext("2d");

    bodyImg.onload = () => {
        // Draw the bird body first
        ctx.drawImage(bodyImg, 0, 0, birdWidth, birdHeight);

        // If selfie exists, overlay as circular head
        if (window.selfieImage) {
            const selfie = new Image();
            selfie.src = window.selfieImage;
            selfie.onload = () => {
                // Head size proportional to human body sprite
                const headSize = birdHeight * 0.3; // ~25% of body height
                const headX = (birdWidth - headSize) / 2; 
                const headY = birdHeight * 0.01;      // slightly below top of canvas

                // Draw circular selfie head
                ctx.save();
                ctx.beginPath();
                ctx.arc(headX + headSize/2, headY + headSize/2, headSize/2, 0, Math.PI*2);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(selfie, 0, 0, selfie.width, selfie.height, headX, headY, headSize, headSize);
                ctx.restore();
            };
        }
    };

    // Use the canvas as the bird image
    birdImg = canvas;
}








goToGame.onclick = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    goToScreen(2); // 3rd screen
    loadBirdSelfie();
};


// ******************************************************************
// **********************   FLAPPY GAME   ***************************
// ******************************************************************

//board
let board;
let boardWidth = 560;
let boardHeight = 640;
let context;

//bird
let birdWidth = 75; //width/height ratio = 408/228 = 17/12
let birdHeight = 115;
let birdX = boardWidth/8;
let birdY = boardHeight/2;

let bird = {
    x : birdX,
    y : birdY,
    width : birdWidth,
    height : birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let gameStarted = false;


window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //draw flappy bird
    // context.fillStyle = "green";
    // context.fillRect(bird.x, bird.y, bird.width, bird.height);

    //load images
    birdImg = new Image();
    birdImg.src = "./body1.png";
    birdImg.onload = function() {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    // setInterval(placePipes, 1500); //every 1.5 seconds
    document.addEventListener("keydown", moveBird);
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    if (gameStarted) {
        //bird
        velocityY += gravity;
        // bird.y += velocityY;
        bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y, limit the bird.y to top of the canvas
        

        if (bird.y > board.height) {
            gameOver = true;
        }

        //pipes
        for (let i = 0; i < pipeArray.length; i++) {
            let pipe = pipeArray[i];
            pipe.x += velocityX;
            context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

            if (!pipe.passed && bird.x > pipe.x + pipe.width) {
                score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
                pipe.passed = true;
            }

            if (detectCollision(bird, pipe)) {
                gameOver = true;
            }
        }

        //clear pipes
        while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
            pipeArray.shift(); //removes first element from the array
        }
    }

    //score
    context.fillStyle = "white";
    context.font="45px sans-serif";
    context.fillText(score, 5, 45);

    if (gameOver) {
        context.fillStyle = "red";
        context.font = "40px sans-serif";
        context.fillText("GAME OVER", board.width / 4, board.height / 2 - 20);

        // Draw final score below it
        context.fillStyle = "white";
        context.font = "35px sans-serif";
        context.fillText("Score: " + Math.floor(score), board.width / 3, board.height / 2 + 30);
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/3;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y : randomPipeY + pipeHeight + openingSpace,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        //jump

        if (!gameStarted) {
            gameStarted = true; // start the game on first jump
            // Start generating pipes only after game starts
            pipeInterval = setInterval(placePipes, 1500);
        }


        velocityY = -7;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
            gameStarted = false;   // wait for user input again
            gameOverHandled = false;
            clearInterval(pipeInterval);
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}
