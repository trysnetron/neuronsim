// Konstanter
const potentialThreshold = 100;
const potentialPulseIncrement = 80;
const potentialPulseDecrement = 80;
const potentialStabilizeDecrement = 1;
const toolBannerHeight = 40;
const pulseDuration = 1.5 * 60; // sekunder * framerate

const NEURON_RADIUS = 20;

const toolList = [moveTool, fireTool, createTool, createExibitorSynapseTool, createInhibitorSynapseTool, deleteTool];
var tool = 0;
// Til Anders: Bruker bare var siden det er globale variable, plis ikke kjølhal meg

function setup() {
    createCanvas(200, 200);

    // Skrur av høyreklikk-menyen
    document.body.oncontextmenu = function() {return false;};
    
    updateCanvasSize();

    textSize(14);
    textAlign(LEFT, TOP);

    // Nevroner
    /*
    let n1 = new Neuron(width/3, height/3)
    neurons.push(n1);
    let n2 = new Neuron(width/3*2, height/3*2);
    neurons.push(n2);
    new Synapse(n1, n2, false);
    */
}

function draw() {
    background(20);

    if (neurons.length > 0) {
        // Oppdaterer og tegner nevroner + aksoner
        for (let i=0; i<neurons.length; ++i) {
            neurons[i].update();
            neurons[i].display();
        }
    }else{
        noStroke();
        fill(160);
        textAlign(CENTER, CENTER);
        text("Start by creating some neurons (press 3),\nthen make some synapses between them (press 4 and 5).\n\nPress 's' to save and 'l' to load.",width/2, height/2);
        textAlign(LEFT, TOP);
    }

    // Tegner verktøy-banner
    noStroke();
    fill(20);
    rect(0, 0, width, toolBannerHeight);
    stroke(240);
    line(0, toolBannerHeight, width, toolBannerHeight);    
    
    for (let i=0; i<toolList.length; ++i) {
        if (i == tool) {
            noStroke();
            fill(240);
            rect(toolBannerHeight*i, 0, toolBannerHeight, toolBannerHeight);
            stroke(20);
        }else{
            stroke(240);
        }
        toolList[i].icon(i*toolBannerHeight, 0);
        stroke(240);
        line(toolBannerHeight*(i+1), 0, toolBannerHeight*(1+i), toolBannerHeight);
    }
    noStroke();
    fill(240);
    text(toolList[tool].info, 5, toolBannerHeight + 5);
    if (mouseY > toolBannerHeight) {
        toolList[tool].cursor();
    }
};

function keyPressed() {
    if (keyCode >= 49 && keyCode <= 57) {
        if (keyCode - 49 < toolList.length) {
            if (keyCode - 49 != tool) {
                toolList[tool].abort();
                tool = keyCode - 49;
            }
        }
    } else if (keyCode == 83) {
        if (saveNetwork()) {
            console.log("Network saved");
        }
    } else if (keyCode == 76) {
        if (loadNetwork()) {
            console.log("Network loaded");
        }
    }
};    

function mousePressed() {
    if (mouseY <= toolBannerHeight) {
        if (mouseX > 0 && mouseX < toolBannerHeight*toolList.length) {
            toolList[tool].abort();
            tool = floor(mouseX/toolBannerHeight);
        }
    } else {
        if (mouseButton == LEFT) {
            toolList[tool].lclick();
        } else if (mouseButton == RIGHT) {
            toolList[tool].rclick();
        } 
    }
};

function mouseReleased() {
    toolList[tool].release();
};

function mouseDragged() {
    toolList[tool].drag();
};

function updateCanvasSize() {
    // sjekker at ingen nevroner havner på utsiden av vinduet
    for (let i=0; i<neurons.length; ++i) {
      neurons[i].constrainPosition();
    }
    // endrer størrelsen på canvas
    resizeCanvas(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", updateCanvasSize);