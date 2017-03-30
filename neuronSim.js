// Konstanter
var potentialThreshold = 100;
var potentialPulseIncrement = 80;
var potentialPulseDecrement = 80;
var potentialLimit = 200;
var pulseDuration = 1 * 60; // sekunder * framerate
var baseFrequency = 2; // Hz
var frequencyStabilize = 1; // Hz/s
var frequencyIncrement = 1;
var frequencyDecrement = 1;

var decayMode = "linear";

var exponentialDecayTargetSeconds = 2;
var exponentialDecayBase = getExponentialDecayBase();

var linearDecayPotentialPerSec = 60;
var linearDecayCoefficient = getLinearDecayCoefficient();

// Div annet
var preferences = false;

var toolBannerHeight = 40;
const neuronRadius = 20;

const toolList = [moveTool, fireTool, lightTool, createTool, createExibitorSynapseTool, createInhibitorSynapseTool, deleteTool];
var tool = 0;


addPrefButton(10, 115, 150, 20, function() {
    if (decayMode == "exponential") {
        decayMode = "linear";
    } else {
        decayMode = "exponential";
    }
});

function setup() {
    createCanvas(200, 200);

    // Skrur av høyreklikk-menyen
    document.body.oncontextmenu = function () { return false; };

    updateCanvasSize();

    textSize(14);
    textAlign(LEFT, TOP);

}

function draw() {
    background(20);
    if (!preferences) {
        if (neurons.length > 0) {
            // Oppdaterer pulser
            for (let i = 0; i < neurons.length; ++i) {
                neurons[i].updatePulses();
            }
            // Oppdaterer potensialet og tegner nevroner + aksoner
            for (let i = 0; i < neurons.length; ++i) {
                neurons[i].updatePotential();
                neurons[i].display();
            }
        } else {
            noStroke();
            fill(160);
            textAlign(CENTER, CENTER);
            text("Start by creating some neurons (press 3),\nthen make some synapses between them (press 4 and 5).\n\nPress 's' to save and 'l' to load.", width / 2, height / 2);
            textAlign(LEFT, TOP);
        }

        // Tegner grafikk fra verktøy
        for (let i = 0; i < toolList.length; ++i) {
            toolList[i].graphics();
        }

        // Tegner verktøy-banner
        noStroke();
        fill(20);
        rect(0, 0, width, toolBannerHeight);
        stroke(240);
        line(0, toolBannerHeight, width, toolBannerHeight);

        for (let i = 0; i < toolList.length; ++i) {
            if (i == tool) {
                noStroke();
                fill(240);
                rect(toolBannerHeight * i, 0, toolBannerHeight, toolBannerHeight);
                stroke(20);
            } else {
                stroke(240);
            }
            toolList[i].icon(i * toolBannerHeight, 0);
            stroke(240);
            line(toolBannerHeight * (i + 1), 0, toolBannerHeight * (1 + i), toolBannerHeight);
        }
        noStroke();
        fill(160);
        text(toolList[tool].info, 5, toolBannerHeight + 5);

        // Tegner verktøyspesifik peker 
        if (mouseY > toolBannerHeight) {
            toolList[tool].cursor();
        }
    } else {
        // Tegner innstillinger
        noStroke();
        fill(240);
        textSize(32);
        text("preferences", 10, 0);
        textSize(14);
        stroke(240);
        line(0, 40, width, 40);

        noStroke();
        fill(240);
        text("Decay mode:", 10, 100);
        stroke(240);
        fill(240);
        rect(10, 115, 150, 20);
        noStroke();
        fill(20);
        textAlign(CENTER, TOP);
        text(decayMode, 85, 117);
        textAlign(LEFT, TOP);
    }
};

function keyPressed() {
    // skrur av de fleste knapper når man er inne i innstillinger
    if (!preferences) {
        if (keyCode >= 49 && keyCode <= 57) { // 1 2 3 4 5 6 7 8 9
            if (keyCode - 49 < toolList.length) {
                if (keyCode - 49 != tool) {
                    toolList[tool].abort();
                    tool = keyCode - 49;
                }
            }
        } else if (keyCode == 83) { // S
            if (saveNetwork()) {
                console.log("Network saved");
            }
        } else if (keyCode == 76) { // L
            if (loadNetwork()) {
                console.log("Network loaded");
            }
        }
    }
    if (keyCode == 80) { // P
        // toggler innstillinger
        preferences = !preferences;
    }
};

function mousePressed() {
    if (!preferences) {
        if (mouseY <= toolBannerHeight) {
            if (mouseX > 0 && mouseX < toolBannerHeight * toolList.length) {
                toolList[tool].abort();
                tool = floor(mouseX / toolBannerHeight);
            }
        } else {
            if (mouseButton == LEFT) {
                toolList[tool].lclick();
            } else if (mouseButton == RIGHT) {
                toolList[tool].rclick();
            }
        }
    } else {
        for (let i=0; i<prefButtons.length; ++i) {
            if (mouseX >= prefButtons[i].x1 && mouseX < prefButtons[i].x2 && mouseY >= prefButtons[i].y1 && mouseY < prefButtons[i].y2) {
                prefButtons[i].func();
            }
        }
    }
};

function mouseReleased() {
    if (!preferences) {
        toolList[tool].release()
    }
};

function mouseDragged() {
    if (!preferences) {
        toolList[tool].drag();
    }
};

function updateCanvasSize() {
    // sjekker at ingen nevroner havner på utsiden av vinduet
    for (let i = 0; i < neurons.length; ++i) {
        neurons[i].constrainPosition();
    }
    // endrer størrelsen på canvas
    resizeCanvas(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", updateCanvasSize);