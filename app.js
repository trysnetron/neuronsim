///////////////////////////////////////////////
//////// N E V R O N S I M U L A T O R ////////
///////////////////////////////////////////////
/// Laget av Trym Sneltvedt - www.snelt.net /// 
///////////////////////////////////////////////

// Hele programmet wrappes i et 'app'-objekt
const app = {
    network: { // alt som har med det nåværende nevrale nettet å gjøre legges i et objekt
        potentialThreshold: 100,
        potentialPulseIncrement: 80,
        potentialPulseDecrement: 80,
        potentialLimit: 200,
        
        baseFrequency: 2, // Hz
        frequencyStabilize: 1, // Hz/s
        frequencyIncrement: 1,
        frequencyDecrement: 1,

        decayMode: "linear",
        exponentialDecay: 2, // Antall sekunder
        linearDecay: 60, // Potensial per sekund
        
        pulseMode: "synapseLengthIndependent",
        pulseDuration: 1000, // Millisekunder
        pulseDistance: 500, // Hvor mange pixler pulsen skal bevege seg per sekund, gjelder bare når synapsen er lengdeavhengig

        neurons: [], 

        dt: 0 // Tellevarabel, holder på antall millisekunder fra forrige frame til nåværende
    },
    showPreferences: false,

    toolBannerHeight: 40,
    toolBannerWidth: 20,
    neuronRadius: 20,
    
    tools: [],
    tool: 0
};

// Nevronklasse
class Neuron{
    constructor(ix, iy) {
        this.x = ix;
        this.y = iy;
        this.potential = 0;
        this.potentialCompletion = 0;
        
        this.spontaneousActivity = false;
        this.frequency = app.baseFrequency;
        this.frequencyCounter = this.frequency*60;

        this.axons = [];
        this.dendrites = [];
        
        this.pulses = [];
    }

    updatePotential() {
        // Sjekker først om potensialet er utenfor grensene
        if (this.spontaneousActivity) {
            // Sørger for at egenfrekvensen ikke blir negativ
            if (this.frequency < 0) {
                this.frequency = 0;
            }

            if (this.frequencyCounter < round(60/this.frequency)) {
                ++this.frequencyCounter;
            } else {
                this.newPulse();
                this.frequencyCounter = 0;
            }
            
            // stabiliserer frekvensen
            if (this.frequency > app.baseFrequency) {
                this.frequency -= app.frequencyStabilize/60;
                if (this.frequency < app.baseFrequency) {
                    this.frequency = app.baseFrequency;
                }
            } else if (this.frequency < app.baseFrequency) {
                this.frequency += app.frequencyStabilize/60;
                if (this.frequency > app.baseFrequency) {
                    this.frequency = app.baseFrequency;
                }
            }
        } else {
            // Sørger for at ikke potensialet er utenfor grensene
            if (this.potential > app.network.potentialLimit) {
                this.potential = app.network.potentialLimit;
            } else if (this.potential < -app.network.potentialLimit) {
                this.potential = -app.network.potentialLimit;
            }
            
            // Fyrer aksonet om potensialet er over grensepotensialet
            if (this.potential >= app.network.potentialThreshold) {
                // fyrer
                this.newPulse();
                this.potential = -app.network.linearDecay;
            }
            
            // Får potensialet til å nærme seg hvilepotensialet (0) 
            if (app.network.decayMode == "linear") {
                if (this.potential > 0) {
                    this.potential -= app.network.linearDecay*(millis()-app.dt)/1000;
                    if (this.potential < 0) {
                        this.potential = 0;
                    }
                } else if (this.potential < 0) {
                    this.potential += app.network.linearDecay*(millis()-app.dt)/1000;
                    if (this.potential > 0) {
                        this.potential = 0;
                    }
                }
            } else if (app.network.decayMode == "exponential") {
                this.potential *= app.network.exponentialDecayBase;
            }    

            this.potentialCompletion = constrain(this.potential/app.network.potentialThreshold, -1, 1);
        }
    }

    updatePulses() {
        // oppdaterer alle pulser
        // går gjennom listen med pulser baklengs for å unngå kjipe feil når pulser slettes
        /*for (let i=this.pulses.length-1; i>=0; --i) {
            if (this.pulses[i] > 0) {
                --this.pulses[i];
            }else{
                this.pulses.splice(i, 1);
                for (let i=0; i<this.axons.length; ++i) {
                    if (this.axons[i].type) {
                        this.axons[i].slave.exitatorFire();
                    } else {
                        this.axons[i].slave.inhibitorFire();
                    }
                }
            }
        }*/
        for (let i=0; i<this.axons.length; ++i) {
            this.axons[i].propagatePulses();
        }
    }

    display() {
        // Tegner seg selv
        noFill();
        if (!this.spontaneousActivity) {
            if (this.pulses.length) {
                stroke(240, 200, 0);
            } else {
                stroke(240);   
            }
            fill(20);
            ellipse(this.x, this.y, app.neuronRadius*2, app.neuronRadius*2);
            
            //Tegner indre ring som indikerer potensial-nivå
            noStroke();
            if (this.potential > 0) {
                fill(0, 120, 0);
                ellipse(this.x, this.y, 2*app.neuronRadius*this.potentialCompletion, 2*app.neuronRadius*this.potentialCompletion);
            } else if (this.potential < 0) {
                fill(120, 0, 0);
                ellipse(this.x, this.y, 2*app.neuronRadius*-this.potentialCompletion, 2*app.neuronRadius*-this.potentialCompletion);  
            }  
        } else {
            stroke(120, 120, 240);
            ellipse(this.x, this.y, app.neuronRadius*2, app.neuronRadius*2);
            stroke(120, 120, 240, 120);
            ellipse(this.x, this.y, app.neuronRadius*1.6*abs(sin(PI*this.frequencyCounter/round(60/this.frequency))), app.neuronRadius*1.6*abs(sin(PI*this.frequencyCounter/round(60/this.frequency)))); 
        }

        for (let i=0; i<this.axons.length; ++i) {
            // Tegner aksoner
            this.axons[i].display();

            // Tegner pulser
            let dx = this.axons[i].slave.x - this.x;
            let dy = this.axons[i].slave.y - this.y;
            stroke(240, 200, 0);
            noFill();
            for (let j=0; j<this.pulses.length; ++j) {
                ellipse(this.x + dx*(1 - this.pulses[j]/app.pulseDuration), this.y + dy*(1 - this.pulses[j]/app.pulseDuration), 10, 10);
            }
        }
    }

    inhibitoryFire() {
        if (!this.spontaneousActivity) {
            this.potential -= app.network.potentialPulseDecrement;
        } else {
            this.frequency -= app.network.frequencyDecrement;
        }
    };

    excitatoryFire() {
        if (!this.spontaneousActivity) {
            this.potential += app.network.potentialPulseIncrement;
        } else {
            this.frequency += app.network.frequencyIncrement;
        }
    };

    newPulse() {
        // Ganger varigheten (i sekunder) med framerate for at timingen skal bli riktig
        //this.pulses.push(round(app.pulseDuration));
        for (let i=0; i<this.axons.length; ++i) {
            this.axons[i].addPulse();
        }
    };

    constrainPosition() {
        if (this.x < 0) {this.x = 0;}
        if (this.x > window.innerWidth) {this.x = window.innerWidth;}
        if (this.y < app.toolBannerHeight) {this.y = app.toolBannerHeight;}
        if (this.y > window.innerHeight) {this.y = window.innerHeight;}
    };

    getId() {
        for (let i=0; i<app.neurons.length; ++i) {
            if (app.neurons[i] === this) {
                return i;
            }
        }
        return -1;
    };

    delete() {
        //fjerner alle aksoner
        for (let i=this.axons.length-1; i>=0; --i) {
            this.axons[i].delete();
        }
        // fjerner alle dendritter
        for (let i=this.dendrites.length-1; i>=0; --i) {
            this.dendrites[i].delete();
        }
        // Fjerner seg selv fra listen med nevroner
        for (let i=0; i<app.neurons.length; ++i) {
            if (app.neurons[i] == this) {
                neurons.splice(i, 1);
                break;
            }
        }
    }
}

// Synapseklasse
class Synapse{
    constructor(master, slave, type, lengthDependent) {
        this.master = master;
        this.slave = slave;
        this.type = type; // 'excitatory' eller 'inhibitory'
        this.lengthDependent = lengthDependent; // Om signalene som sendes gjennom sypapsen skal ta hensyn til lengden på synapsen eller ikke
        
        this.distance = 0;
        this.normalizedX = 0;
        this.normalizedY = 0;
        this.updateNeuronPositions();

        this.pulses = [];

        master.axons.push(this);
        slave.dendrites.push(this);
    };

    addPulse() {
        this.pulses.push(millis());
    }

    propagatePulses() {
        for (let i=this.pulses.length-1; i>=0; --i) {
            if (this.lengthDependent) {
                if ((millis() - this.pulses[i])/1000*app.network.pulseDistance >= this.distance - app.neuronRadius*2) {
                    this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
                    if (this.type == "excitatory") {
                        this.slave.excitatoryFire();
                    } else if(this.type == "inhibitory") {
                        this.slave.inhibitoryFire();
                    }
                }
            } else {
                if (millis() - this.pulses[i] >= app.network.pulseDuration) {
                    this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
                    if (this.type == "excitatory") {
                        this.slave.excitatoryFire();
                    } else if(this.type == "inhibitory") {
                        this.slave.inhibitoryFire();
                    }
                }
            }
        }
    }

    updateNeuronPositions() {
        this.distance = dist(this.master.x, this.master.y, this.slave.x, this.slave.y);
        this.normalizedX = (this.slave.x - this.master.x)/this.distance;
        this.normalizedY = (this.slave.y - this.master.y)/this.distance;
    }

    display() {
        if (this.type == "excitatory") {
            stroke(0, 170, 0);
        } else if (this.type == "inhibitory") {
            stroke(170, 0, 0);
        }
        noFill();

        // Tegner synapsen
        if (this.lengthDependent) {
            for (let i=app.neuronRadius*1.25; i<this.distance-app.neuronRadius; i+=7) {
                point(this.master.x + this.normalizedX*i, this.master.y + this.normalizedY*i);
            }
        } else {
            line(this.master.x + this.normalizedX*app.neuronRadius*1.25, this.master.y + this.normalizedY*app.neuronRadius*1.25, this.slave.x - this.normalizedX*app.neuronRadius*1.25, this.slave.y - this.normalizedY*app.neuronRadius*1.25);
        }

        // Tegner pulsense over synapsen
        stroke(240, 240, 0);
        if (this.lengthDependent) {
            for (let i=0; i<this.pulses.length; ++i) {
                line(
                    this.master.x + this.normalizedX*(app.neuronRadius + (millis() - this.pulses[i])/1000*app.network.pulseDistance - 5), 
                    this.master.y + this.normalizedY*(app.neuronRadius + (millis() - this.pulses[i])/1000*app.network.pulseDistance - 5),
                    this.master.x + this.normalizedX*(app.neuronRadius + (millis() - this.pulses[i])/1000*app.network.pulseDistance + 5), 
                    this.master.y + this.normalizedY*(app.neuronRadius + (millis() - this.pulses[i])/1000*app.network.pulseDistance + 5));
            }
        } else {
            for (let i=0; i<this.pulses.length; ++i) {
                line(
                    this.master.x + this.normalizedX*(app.neuronRadius + (millis() - this.pulses[i])/app.network.pulseDuration*(this.distance - app.neuronRadius*2) - 5), 
                    this.master.y + this.normalizedY*(app.neuronRadius + (millis() - this.pulses[i])/app.network.pulseDuration*(this.distance - app.neuronRadius*2) - 5),
                    this.master.x + this.normalizedX*(app.neuronRadius + (millis() - this.pulses[i])/app.network.pulseDuration*(this.distance - app.neuronRadius*2) + 5), 
                    this.master.y + this.normalizedY*(app.neuronRadius + (millis() - this.pulses[i])/app.network.pulseDuration*(this.distance - app.neuronRadius*2) + 5));
            }
        }
        
        //ellipse(this.slave.x - normalizedX*NEURON_RADIUS*1.5, this.slave.y - normalizedY*NEURON_RADIUS*1.5, 10, 10);
        /*if (this.type) {
            
            line(this.slave.x - normalizedX*app.neuronRadius*1.5, this.slave.y - normalizedY*app.neuronRadius*1.5, this.slave.x - normalizedX*(app.neuronRadius*1.5 + 8) + normalizedY*15, this.slave.y - normalizedY*(app.neuronRadius*1.5 + 8) - normalizedX*15);
            line(this.slave.x - normalizedX*app.neuronRadius*1.5, this.slave.y - normalizedY*app.neuronRadius*1.5, this.slave.x - normalizedX*(app.neuronRadius*1.5 + 8) - normalizedY*15, this.slave.y - normalizedY*(app.neuronRadius*1.5 + 8) + normalizedX*15);
        } else {
            line(this.slave.x - normalizedX*app.neuronRadius*1.5, this.slave.y - normalizedY*app.neuronRadius*1.5, this.slave.x - normalizedX*(app.neuronRadius*1.5 - 8) + normalizedY*15, this.slave.y - normalizedY*(app.neuronRadius*1.5 - 8) - normalizedX*15);
            line(this.slave.x - normalizedX*app.neuronRadius*1.5, this.slave.y - normalizedY*app.neuronRadius*1.5, this.slave.x - normalizedX*(app.neuronRadius*1.5 - 8) - normalizedY*15, this.slave.y - normalizedY*(app.neuronRadius*1.5 - 8) + normalizedX*15);
        }*/    
    };

    delete() {
        //fjerner referanse fra masternevrons aksonliste
        for (let i=0; i<this.master.axons.length; ++i) {
            if (this.master.axons[i] == this) {
                this.master.axons.splice(i, 1);
            }
        }
        // fjerner referanse fra slavenevrons dendrittliste
        for (let i=0; i<this.slave.dendrites.length; ++i) {
            if (this.slave.dendrites[i] == this) {
                this.slave.dendrites.splice(i, 1);
            }
        }
    }
}

// Methods
function pointOverCircle(pointX, pointY, circleX, circleY, circleRadius) {
    return (sq(pointX - circleX) + sq(pointY - circleY) <= sq(circleRadius));
};

function mouseOverNeuron() {
    for (let i = 0; i < neurons.length; ++i) {
        if (pointOverCircle(mouseX, mouseY, neurons[i].x, neurons[i].y, neuronRadius)) {
            return neurons[i];
        }
    }
    return null;
};

function mouseOverSynapse() {
    let synapse, synapseAngle, mouseAngle, synapseDist, mouseDist, relX, relY;
    for (let i = 0; i < neurons.length; ++i) {
        for (let j = 0; j < neurons[i].axons.length; ++j) {
            synapse = neurons[i].axons[j];
            synapseAngle = atan2(synapse.slave.y - synapse.master.y, synapse.slave.x - synapse.master.x);
            mouseAngle = atan2(mouseY - synapse.master.y, mouseX - synapse.master.x);
            synapseDist = dist(synapse.master.x, synapse.master.y, synapse.slave.x, synapse.slave.y);
            mouseDist = dist(synapse.master.x, synapse.master.y, mouseX, mouseY);
            relX = cos(mouseAngle - synapseAngle) * mouseDist;
            relY = sin(mouseAngle - synapseAngle) * mouseDist;
            if (relX > neuronRadius && abs(relY) < 10 && relX < synapseDist - neuronRadius) {
                return synapse;
            }
        }
    }
    return null;
}

function findSynapse(id) {
    for (let i = 0; i < neurons.length; ++i) {
        for (let j = 0; j < neurons[i].axons.length; ++j) {
            if (neurons[i].axons[j] == id) {

            }
        }
    }
}

function saveNetwork() {
    let save = {};
    save.neurons0 = [];
    for (let i = 0; i < neurons.length; ++i) {
        let neuron = {
            x: neurons[i].x,
            y: neurons[i].y,
            slaves: [],
            dendriteType: []
        };
        for (let j = 0; j < neurons[i].axons.length; ++j) {
            neuron.slaves.push(neurons[i].axons[j].slave.getId());
            neuron.dendriteType.push(neurons[i].axons[j].type);
        }
        save.neurons0.push(neuron);
    }

    // Lagrer konstanter
    save.potentialThreshold = potentialThreshold;
    save.potentialPulseIncrement = potentialPulseIncrement;
    save.potentialPulseDecrement = potentialPulseDecrement;
    save.potentialLimit = potentialLimit;
    save.pulseDuration = pulseDuration; // sekunder * framerate
    save.baseFrequency = baseFrequency; // Hz
    save.frequencyStabilize = frequencyStabilize; // Hz/s
    save.frequencyIncrement = frequencyIncrement;
    save.frequencyDecrement = frequencyDecrement;
    save.decayMode = decayMode;
    save.exponentialDecayTargetSeconds = exponentialDecayTargetSeconds;    
    save.linearDecayPotentialPerSec = linearDecayPotentialPerSec;

    save = JSON.stringify(save);

    if (confirm("This will override the current save!")) {
        if (typeof (Storage) !== undefined) {
            localStorage.save = save;
        } else {
            return false;
        }
    } else {
        return false;
    }
    return true;
}

function loadNetwork() {
    if (typeof (Storage) !== undefined) {
        // migrerer gammel save
        if (localStorage.save0 === undefined) {
            migrateSave();
        }
        
        if (localStorage.save0 !== undefined) {
            if (neurons.length) {
                if (!confirm("Are you sure? All your current work will be lost!")) {
                    return false;
                }
            }

            let saveObj = JSON.parse(localStorage.save0);

            //tømmer det eksisterende nettverket
            for (let i = neurons.length - 1; i >= 0; --i) {
                neurons[i].delete();
            }

            // lager nevroner fra lagringsfil
            for (let i = 0; i < saveObj.neurons.length; ++i) {
                neurons.push(new Neuron(saveObj.neurons[i].x, saveObj.neurons[i].y));
            }
            // lager synapser
            for (let i = 0; i < saveObj.neurons.length; ++i) {
                for (let j = 0; j < saveObj.neurons[i].slaves.length; ++j) {
                    new Synapse(neurons[i], neurons[saveObj.neurons[i].slaves[j]], saveObj.neurons[i].dendriteType[j]);
                }
            }

            //laster inn lagrede konstanter
            potentialThreshold = saveObj.potentialThreshold;
            potentialPulseIncrement = saveObj.potentialPulseIncrement;
            potentialPulseDecrement = saveObj.potentialPulseDecrement;
            potentialLimit = saveObj.potentialLimit;
            pulseDuration = saveObj.pulseDuration; // sekunder * framerate
            baseFrequency = saveObj.baseFrequency; // Hz
            frequencyStabilize = saveObj.frequencyStabilize; // Hz/s
            frequencyIncrement = saveObj.frequencyIncrement;
            frequencyDecrement = saveObj.frequencyDecrement;
            decayMode = saveObj.decayMode;
            exponentialDecayTargetSeconds = saveObj.exponentialDecayTargetSeconds;    
            linearDecayPotentialPerSec = saveObj.linearDecayPotentialPerSec;
        } else {
            return false;
        }
    } else {
        return false;
    }
    return true;
};

function getSaveInfo() {
    if (typeof (Storage) !== undefined) {
        if (localStorage.save0 !== undefined) {
            let saveObj = JSON.parse(localStorage.save0);
            let neuronNum = saveObj.neurons.length;
            let synapseNum = 0;
            for (let i = 0; i < saveObj.neurons.length; ++i) {
                synapseNum += saveObj.neurons[i].slaves.length;
            }
            return (neuronNum + " neurons, " + synapseNum + " synapses.");
        } else {
            return false;
        }
    } else {
        return false;
    }
};

function migrateSave() {
    if (typeof(Storage) !== undefined) {
        if (localStorage.save !== undefined) {
            localStorage.save0 = localStorage.save;
            localStorage.save = undefined;
            let saveObj = JSON.parse(localStorage.save0);
            saveObj.neurons = saveObj.neurons0;                
            saveObj.neurons0 = undefined;
            saveObj.potentialThreshold = potentialThreshold;
            saveObj.potentialPulseIncrement = potentialPulseIncrement;
            saveObj.potentialPulseDecrement = potentialPulseDecrement;
            saveObj.potentialLimit = potentialLimit;
            saveObj.pulseDuration = pulseDuration; // sekunder * framerate
            saveObj.baseFrequency = baseFrequency; // Hz
            saveObj.frequencyStabilize = frequencyStabilize; // Hz/s
            saveObj.frequencyIncrement = frequencyIncrement;
            saveObj.frequencyDecrement = frequencyDecrement;
            saveObj.decayMode = decayMode;
            saveObj.exponentialDecayTargetSeconds = exponentialDecayTargetSeconds;    
            saveObj.linearDecayPotentialPerSec = linearDecayPotentialPerSec;

            localStorage.save0 = JSON.stringify(saveObj);
            console.log("Old save migrated.");
        }
    }
};

function getExponentialDecayBase() {
    return Math.exp(Math.log(0.01) / 60 / exponentialDecayTargetSeconds);
};

function getLinearDecayCoefficient() {
    return linearDecayPotentialPerSec / 60;
};

function addTool(toolName, toolInfo, createFunc, lclickFunc, rclickFunc, dragFunc, releaseFunc, abortFunc, cursorFunc, graphicsFunc, iconFunc) {
    app.tools.push({
        name: toolName,
        info: toolInfo,
        create: createFunc,
        lclick: lclickFunc, 
        rclick: rclickFunc,
        drag: dragFunc,
        release: releaseFunc,
        abort: abortFunc,
        cursor: cursorFunc,
        graphics: graphicsFunc,
        icon: iconFunc
    });
};

addTool("testTool", "A tool for testing", ()=>{
    this.num = 2;
    },
    null, null, null, null, null, null, null, null
);

// Template-verktøy, alle verktøy skal ta utgangspunkt i denne
function Tool() {
    this.lclick = function() {};
    this.rclick = function() {};
    this.drag = function() {};
    this.release = function() {};
    this.abort = function() {};
    this.cursor = function() {};
    this.graphics = function() {};
    this.icon = function(x, y) {};
    this.info = "";
};

// Her ligger alle verktøyene man kan bruke på nevronene og aksonene

////////////////////////////////////////////////
// Flytter nevroner ////////////////////////////
////////////////////////////////////////////////
const moveTool = new Tool();

moveTool.neuron = null;
moveTool.dragging = false;
moveTool.offsetX = 0;
moveTool.offsetY = 0;
moveTool.lclick = function() {
    this.neuron = mouseOverNeuron();
    if (this.neuron != null) {
        this.dragging = true;
        this.offsetX = mouseX - this.neuron.x;
        this.offsetY = mouseY - this.neuron.y;
    }
};
moveTool.drag = function() {
    if (this.dragging) {
        this.neuron.x = mouseX - this.offsetX;
        this.neuron.y = mouseY - this.offsetY;
        this.neuron.constrainPosition();
    }
};
moveTool.release = function() {
    if (this.dragging) {
        this.neuron = null;
        this.dragging = false;
    }
};
moveTool.abort = function() {
    this.neuron = null;
    this.dragging = false;
};
moveTool.icon = function(x, y) {
    noFill();
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.5, x + toolBannerHeight*0.8, y + toolBannerHeight*0.5);
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.2, x + toolBannerHeight*0.5, y + toolBannerHeight*0.8);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.5, x + toolBannerHeight*0.3, y + toolBannerHeight*0.4);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.5, x + toolBannerHeight*0.3, y + toolBannerHeight*0.6); 
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.2, x + toolBannerHeight*0.4, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.2, x + toolBannerHeight*0.6, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.8, y + toolBannerHeight*0.5, x + toolBannerHeight*0.7, y + toolBannerHeight*0.4);
    line(x + toolBannerHeight*0.8, y + toolBannerHeight*0.5, x + toolBannerHeight*0.7, y + toolBannerHeight*0.6);
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.8, x + toolBannerHeight*0.4, y + toolBannerHeight*0.7);
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.8, x + toolBannerHeight*0.6, y + toolBannerHeight*0.7);
};
moveTool.info = "Click and drag a neuron to move it.";

////////////////////////////////////////////////
// Fyrer nevroner //////////////////////////////
////////////////////////////////////////////////
const fireTool = new Tool();
fireTool.selectedNeurons = [];

fireTool.lclick = function() {
    let neuron = mouseOverNeuron();
    let neuronInGroup = false;
    if (neuron != null) {
        for (let i=0; i<this.selectedNeurons.length; ++i) {
            if (this.selectedNeurons[i] == neuron) {
                neuronInGroup = true;
                break;
            }
        }
        if (neuronInGroup) {
            // Får alle nevroner i gruppen til å fyre
            for (let i=0; i<this.selectedNeurons.length; ++i) {
                this.selectedNeurons[i].newPulse();
            }
        } else {
            neuron.newPulse();
        }
    }
};
fireTool.rclick = function() {
    let neuron = mouseOverNeuron();
    let alreadyInList = false;
    if (neuron != null) {
        for (let i=0; i<this.selectedNeurons.length; ++i) {
            if (this.selectedNeurons[i] == neuron) {
                this.selectedNeurons.splice(i, 1);
                alreadyInList = true;
                break;
            }
        }
        if (!alreadyInList) {
            this.selectedNeurons.push(neuron);
        }
    }
};
fireTool.graphics = function() {
    noFill();
    stroke(180, 140, 0);
    for (let i=0; i<this.selectedNeurons.length; ++i) {
        ellipse(this.selectedNeurons[i].x, this.selectedNeurons[i].y, neuronRadius*4);
    }
};
fireTool.icon = function(x, y) {
    noFill();
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.2, x + toolBannerHeight*0.6, y + toolBannerHeight*0.4);
    line(x + toolBannerHeight*0.6, y + toolBannerHeight*0.4, x + toolBannerHeight*0.4, y + toolBannerHeight*0.6);
    line(x + toolBannerHeight*0.4, y + toolBannerHeight*0.6, x + toolBannerHeight*0.8, y + toolBannerHeight*0.8);
};
fireTool.info = "Left click a neuron to make it fire.\nRight click a neuron to include/remove it from firing group.";

////////////////////////////////////////////////
// Lager nye nevroner //////////////////////////
////////////////////////////////////////////////
const createTool = new Tool();
    
createTool.lclick = function() {
    neurons.push(new Neuron(mouseX, mouseY));
};
createTool.rclick = function() {
    let neuron = new Neuron(mouseX, mouseY);
    neuron.spontaneousActivity = true;
    neurons.push(neuron);
};
createTool.cursor = function() {
    noFill();
    stroke(120);
    ellipse(mouseX, mouseY, neuronRadius*2, neuronRadius*2);
};
createTool.icon = function(x, y) {
    noFill();
    ellipse(x + toolBannerHeight/2, y + toolBannerHeight/2, toolBannerHeight*0.5, toolBannerHeight*0.5);
    line(x + toolBannerHeight*0.1, y + toolBannerHeight*0.2, x + toolBannerHeight*0.3, y + toolBannerHeight*0.2);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.1, x + toolBannerHeight*0.2, y + toolBannerHeight*0.3);
};
createTool.info = "Left click to create a neuron.\nRight click to create a neuron with a base frequency.";

////////////////////////////////////////////////
// Lager nye synapser (akson + dendritt) ///////
////////////////////////////////////////////////
const createExibitorSynapseTool = new Tool();

createExibitorSynapseTool.masterNeuron = null;
createExibitorSynapseTool.lclick = function() {
    let neuron = mouseOverNeuron();
    if (neuron != null) {
        if (this.masterNeuron == null) {
            this.masterNeuron = neuron;
        } else if (neuron != this.masterNeuron) {
            new Synapse(this.masterNeuron, neuron, true);
            this.masterNeuron = null; 
        }
    }else if (this.masterNeuron != null) {
        this.masterNeuron = null;
    }
};
createExibitorSynapseTool.release = function() {
    if (this.masterNeuron != null) {
        let neuron = mouseOverNeuron();
        if (neuron != null) {
            if (neuron != this.masterNeuron) {
                new Synapse(this.masterNeuron, neuron, true);
                this.masterNeuron = null;
            } 
        }
    }
}
createExibitorSynapseTool.abort = function() {
    this.masterNeuron = null;
};
createExibitorSynapseTool.cursor = function() {
    stroke(0, 240, 0);
    if (this.masterNeuron != null) {
        line(this.masterNeuron.x, this.masterNeuron.y, mouseX, mouseY);
    }
};
createExibitorSynapseTool.icon = function(x, y) {
    line(x + toolBannerHeight*0.3, y + toolBannerHeight*0.7, x + toolBannerHeight*0.7, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.7, y + toolBannerHeight*0.3, x + toolBannerHeight*0.6, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.7, y + toolBannerHeight*0.3, x + toolBannerHeight*0.7, y + toolBannerHeight*0.4);
    // plus
    line(x + toolBannerHeight*0.1, y + toolBannerHeight*0.2, x + toolBannerHeight*0.3, y + toolBannerHeight*0.2);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.1, x + toolBannerHeight*0.2, y + toolBannerHeight*0.3);
};
createExibitorSynapseTool.info = "Click a neuron to start making a synapse, and then click another one to complete it.";

////////////////////////////////////////////////
// Lager nye synapser (akson + dendritt) ///////
////////////////////////////////////////////////
const createInhibitorSynapseTool = new Tool();

createInhibitorSynapseTool.masterNeuron = null;
createInhibitorSynapseTool.lclick = function() {
    let neuron = mouseOverNeuron();
    if (neuron != null) {
        if (this.masterNeuron == null) {
            this.masterNeuron = neuron;
        } else if (neuron != this.masterNeuron) {
            new Synapse(this.masterNeuron, neuron, false);
            this.masterNeuron = null; 
        }
    }else if (this.masterNeuron != null) {
        this.masterNeuron = null;
    }
};
createInhibitorSynapseTool.release = function() {
    if (this.masterNeuron != null) {
        let neuron = mouseOverNeuron();
        if (neuron != null) {
            if (neuron != this.masterNeuron) {
                new Synapse(this.masterNeuron, neuron, false);
                this.masterNeuron = null;
            } 
        }
    }
}
createInhibitorSynapseTool.abort = function() {
    this.masterNeuron = null;
};
createInhibitorSynapseTool.cursor = function() {
    stroke(240, 0, 0);
    if (this.masterNeuron != null) {
        line(this.masterNeuron.x, this.masterNeuron.y, mouseX, mouseY);
    }
};
createInhibitorSynapseTool.icon = function(x, y) {
    line(x + toolBannerHeight*0.3, y + toolBannerHeight*0.7, x + toolBannerHeight*0.7, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.7, y + toolBannerHeight*0.3, x + toolBannerHeight*0.8, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.7, y + toolBannerHeight*0.3, x + toolBannerHeight*0.7, y + toolBannerHeight*0.2);
    // plus
    line(x + toolBannerHeight*0.1, y + toolBannerHeight*0.2, x + toolBannerHeight*0.3, y + toolBannerHeight*0.2);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.1, x + toolBannerHeight*0.2, y + toolBannerHeight*0.3);
};
createInhibitorSynapseTool.info = "Click a neuron to start making an synapse, and then click another one to complete it.";

/////////////////////////////////////////////
// Sletter nevroner /////////////////////////
/////////////////////////////////////////////
const deleteTool = new Tool();

deleteTool.lclick = function() {
    let neuron = mouseOverNeuron();
    if (neuron != null) {
        //sletter nevron
        neuron.delete();
        neuron = null;
    }else {
        let synapse = mouseOverSynapse();
        if (synapse != null) {
            // sletter synapse
            synapse.delete();
            synapse = null;
        }
    }
};
deleteTool.cursor = function() {
    let neuron = mouseOverNeuron();
    if (neuron != null) {
        noStroke();
        fill(240, 0, 0, 50);
        ellipse(neuron.x, neuron.y, neuronRadius*2 + 20, neuronRadius*2 + 20);
    }else{
        let synapse = mouseOverSynapse();
        if (synapse != null) {
            strokeWeight(20);
            stroke(240, 0, 0, 50);
            line(synapse.master.x, synapse.master.y, synapse.slave.x, synapse.slave.y);
            strokeWeight(1);
        }
    }
};
deleteTool.icon = function(x, y) {
    line(x + toolBannerHeight*0.3, y + toolBannerHeight*0.7, x + toolBannerHeight*0.7, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.3, y + toolBannerHeight*0.3, x + toolBannerHeight*0.7, y + toolBannerHeight*0.7);
};
deleteTool.info = "Click a neuron or a synapse to delete it.";

/////////////////////////////////////////////
// Lommelykt /////////////////////////
////////////////////////////////////////////////
const lightTool = new Tool();

lightTool.pressing = false;
lightTool.radius = 100;
lightTool.firePeriod = 0.1;
lightTool.fireCounter = 0;

lightTool.lclick = function() {
    this.pressing = true;
};
lightTool.cursor = function() {
    noStroke();
    if (this.pressing) {
        if (this.fireCounter < 60 *this.firePeriod) {
            ++this.fireCounter;
        } else {
            for (let i=0; i<neurons.length; ++i) {
                if (pointOverCircle(neurons[i].x, neurons[i].y, mouseX, mouseY, this.radius)) {
                    neurons[i].newPulse();
                } 
            }
            this.fireCounter = 0;
        }
        fill(240, 240, 0, 10);
    } else {
        fill(240, 240, 0, 40);
    }
    ellipse(mouseX, mouseY, this.radius*2, this.radius*2);
};
lightTool.release = function() {
    this.pressing = false;
}

lightTool.icon = function(x, y) {
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.2, x + toolBannerHeight*0.4, y + toolBannerHeight*0.4);
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.1, x + toolBannerHeight*0.5, y + toolBannerHeight*0.3);
    line(x + toolBannerHeight*0.8, y + toolBannerHeight*0.2, x + toolBannerHeight*0.6, y + toolBannerHeight*0.4);
    line(x + toolBannerHeight*0.9, y + toolBannerHeight*0.5, x + toolBannerHeight*0.7, y + toolBannerHeight*0.5);
    line(x + toolBannerHeight*0.8, y + toolBannerHeight*0.8, x + toolBannerHeight*0.6, y + toolBannerHeight*0.6);
    line(x + toolBannerHeight*0.5, y + toolBannerHeight*0.9, x + toolBannerHeight*0.5, y + toolBannerHeight*0.7);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.8, x + toolBannerHeight*0.4, y + toolBannerHeight*0.6);
    line(x + toolBannerHeight*0.1, y + toolBannerHeight*0.5, x + toolBannerHeight*0.3, y + toolBannerHeight*0.5);
};
lightTool.info = "Click and hold to make all neurons within range to fire.";

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

function setup() {
    // Skrur av høyreklikk-menyen
    document.body.oncontextmenu = function () { return false; };

    createCanvas(200, 200);
    updateCanvasSize();

    textSize(14);
    textAlign(LEFT, TOP);

    app.network.neurons.push(new Neuron(100, 400));
    app.network.neurons.push(new Neuron(200, 150));
    app.network.neurons.push(new Neuron(200, 800));
    app.network.neurons.push(new Neuron(600, 800));
    app.network.neurons.push(new Neuron(300, 400));
    
    new Synapse(app.network.neurons[0], app.network.neurons[1], "excitatory", true);
    new Synapse(app.network.neurons[0], app.network.neurons[2], "inhibitory", true);
    new Synapse(app.network.neurons[0], app.network.neurons[3], "inhibitory", false);
    new Synapse(app.network.neurons[0], app.network.neurons[4], "excitatory", false);
}

function draw() {
    background(20);
    

    if (!app.showPreferences) {
        if (app.network.neurons.length > 0) {
            // Oppdaterer pulser
            for (let i = 0; i < app.network.neurons.length; ++i) {
                app.network.neurons[i].updatePulses();
            }
            // Oppdaterer potensialet og tegner nevroner + aksoner
            for (let i = 0; i < app.network.neurons.length; ++i) {
                app.network.neurons[i].updatePotential();
                app.network.neurons[i].display();
            }
            fill(240);
            text(app.network.neurons[1].potential, 10, 10);

        } else {
            noStroke();
            fill(160);
            textAlign(CENTER, CENTER);
            text("Start by creating some neurons (press 3),\nthen make some synapses between them (press 4 and 5).\n\nPress 's' to save and 'l' to load.", width / 2, height / 2);
            textAlign(LEFT, TOP);
        }

        /*
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
    */
    }
    app.dt = millis();
};
/*
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
    }
};

function mouseReleased() {
    if (!preferences) {
        app.tools[app.tool].release()
    }
};

function mouseDragged() {
    if (!preferences) {
        app.tools[app.tool].drag();
    }
};
*/
function mousePressed() {
    app.network.neurons[0].newPulse();
};

function updateCanvasSize() {
    // sjekker at ingen nevroner havner på utsiden av vinduet
    /*for (let i = 0; i < app.neurons.length; ++i) {
        app.neurons[i].constrainPosition();
    }*/
    // endrer størrelsen på canvas
    resizeCanvas(window.innerWidth - app.toolBannerWidth, window.innerHeight);
};

window.addEventListener("resize", updateCanvasSize);