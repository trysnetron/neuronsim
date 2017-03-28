/////////////////////////////
/////////////////////////////
//////// N E U R O N ////////
/////////////////////////////
/////////////////////////////

const neurons = [];

function Neuron(ix, iy) {
    this.x = ix;
    this.y = iy;
    this.potential = 0;
    this.potential_completion = 0;
    
    this.spontaneousActivity = false;
    this.frequency = baseFrequency;
    this.frequencyCounter = this.frequency*60;

    this.axons = [];
    this.dendrites = [];
    
    this.pulses = [];
};

Neuron.prototype.updatePotential = function() {
    // Sjekker først om potensialet er utenfor grensene
    if (this.spontaneousActivity) {
        // Sørger for at egenfrekvensen ikke blir negativ
        if (this.frequency < 0) {
            this.frequency = 0;
        }

        if (this.frequencyCounter > 0) {
            --this.frequencyCounter;
        } else {
            this.newPulse();
            this.frequencyCounter = round(60/this.frequency);
        }
        
        // stabiliserer frekvensen
        if (this.frequency > baseFrequency) {
            this.frequency -= frequencyStabilize/60;
            if (this.frequency < baseFrequency) {
                this.frequency = baseFrequency;
            }
        }else if (this.frequency < baseFrequency) {
            this.frequency += frequencyStabilize/60;
            if (this.frequency > baseFrequency) {
                this.frequency = baseFrequency;
            }
        }
    }else {
        // Sørger for at ikke potensialet er utenfor grensene
        if (this.potential > potentialLimit) {
            this.potential = potentialLimit;
        }else if (this.potential < -potentialLimit) {
            this.potential = -potentialLimit;
        }
        
        // Fyrer aksonet om potensialet er over grensepotensialet
        if (this.potential >= potentialThreshold) {
            // fyrer
            this.newPulse();
            this.potential = -linearDecayCoefficient;
        }
        
        // Får potensialet til å nærme seg hvilepotensialet (0) 
        if (decayMode == "linear") {
            if (this.potential > 0) {
                this.potential -= linearDecayCoefficient;
                if (this.potential < 0) {
                    this.potential = 0;
                }
            } else if (this.potential < 0) {
                this.potential += linearDecayCoefficient;
                if (this.potential > 0) {
                    this.potential = 0;
                }
            }
        } else if (decayMode == "exponential") {
            this.potential *= exponentialDecayBase;
        }    

        // oppdaterer potential_completion
        this.potential_completion = constrain(this.potential/potentialThreshold, -1, 1);
    }
};

Neuron.prototype.updatePulses = function() {
    // oppdaterer alle pulser
    // går gjennom listen med pulser baklengs for å unngå kjipe feil når pulser slettes
    for (let i=this.pulses.length-1; i>=0; --i) {
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
    }
};

Neuron.prototype.display = function() {
    // Tegner seg selv
    noFill();
    if (!this.spontaneousActivity) {
        if (this.pulses.length) {
            stroke(240, 200, 0);
        } else {
            stroke(240);   
        }
        ellipse(this.x, this.y, neuronRadius*2, neuronRadius*2);
        
        //Tegner indre ring som indikerer potensial-nivå
        noStroke();
        if (this.potential > 0) {
            fill(0, 120, 0);
            ellipse(this.x, this.y, 2*neuronRadius*this.potential_completion, 2*neuronRadius*this.potential_completion);
        } else if (this.potential < 0) {
            fill(120, 0, 0);
            ellipse(this.x, this.y, 2*neuronRadius*-this.potential_completion, 2*neuronRadius*-this.potential_completion);  
        }  
    } else {
        stroke(120, 120, 240);
        ellipse(this.x, this.y, neuronRadius*2, neuronRadius*2);
        ellipse(this.x, this.y, neuronRadius*1.6*abs(sin(PI*this.frequencyCounter/round(60/this.frequency))), neuronRadius*1.6*abs(sin(PI*this.frequencyCounter/round(60/this.frequency)))); 
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
            ellipse(this.x + dx*(1 - this.pulses[j]/pulseDuration), this.y + dy*(1 - this.pulses[j]/pulseDuration), 10, 10);
        }
    }
};

Neuron.prototype.inhibitorFire = function() {
    if (!this.spontaneousActivity) {
        this.potential -= potentialPulseDecrement;
    } else {
        this.frequency -= frequencyDecrement;
    }
};

Neuron.prototype.exitatorFire = function() {
    if (!this.spontaneousActivity) {
        this.potential += potentialPulseIncrement;
    } else {
        this.frequency += frequencyIncrement;
    }
};

Neuron.prototype.newPulse = function() {
    // Ganger varigheten (i sekunder) med framerate for at timingen skal bli riktig
    this.pulses.push(round(pulseDuration));
};

Neuron.prototype.constrainPosition = function() {
    if (this.x < 0) {this.x = 0;}
    if (this.x > window.innerWidth) {this.x = window.innerWidth;}
    if (this.y < toolBannerHeight) {this.y = toolBannerHeight;}
    if (this.y > window.innerHeight) {this.y = window.innerHeight;}
};

Neuron.prototype.getId = function() {
    for (let i=0; i<neurons.length; ++i) {
        if (neurons[i] === this) {
            return i;
        }
    }
    return -1;
};

Neuron.prototype.delete = function() {
    //fjerner alle aksoner
    for (let i=this.axons.length-1; i>=0; --i) {
        this.axons[i].delete();
    }
    // fjerner alle dendritter
    for (let i=this.dendrites.length-1; i>=0; --i) {
        this.dendrites[i].delete();
    }
    // Fjerner seg selv fra listen med nevroner
    for (let i=0; i<neurons.length; ++i) {
        if (neurons[i] == this) {
            neurons.splice(i, 1);
            break;
        }
    }
};


/////////////////////////////
/////////////////////////////
/////// S Y N A P S E ///////
/////////////////////////////
/////////////////////////////

function Synapse(master, slave, type) {
    this.master = master;
    this.slave = slave;
    this.type = type; // true -> exitatorisk, false -> inhibitorisk

    master.axons.push(this);
    slave.dendrites.push(this);
};

Synapse.prototype.display = function() {
    let distance = dist(this.master.x, this.master.y, this.slave.x, this.slave.y);
    let normalizedX = (this.slave.x - this.master.x)/distance;
    let normalizedY = (this.slave.y - this.master.y)/distance;
    if (this.type) {
        stroke(0, 240, 0);
    } else {
        stroke(240, 0, 0);
    }
    noFill();
    line(this.master.x + normalizedX*neuronRadius*1.5, this.master.y + normalizedY*neuronRadius*1.5, this.slave.x - normalizedX*neuronRadius*1.5, this.slave.y - normalizedY*neuronRadius*1.5);
    //ellipse(this.slave.x - normalizedX*NEURON_RADIUS*1.5, this.slave.y - normalizedY*NEURON_RADIUS*1.5, 10, 10);
    if (this.type) {
         
        line(this.slave.x - normalizedX*neuronRadius*1.5, this.slave.y - normalizedY*neuronRadius*1.5, this.slave.x - normalizedX*(neuronRadius*1.5 + 8) + normalizedY*15, this.slave.y - normalizedY*(neuronRadius*1.5 + 8) - normalizedX*15);
        line(this.slave.x - normalizedX*neuronRadius*1.5, this.slave.y - normalizedY*neuronRadius*1.5, this.slave.x - normalizedX*(neuronRadius*1.5 + 8) - normalizedY*15, this.slave.y - normalizedY*(neuronRadius*1.5 + 8) + normalizedX*15);
    } else {
        line(this.slave.x - normalizedX*neuronRadius*1.5, this.slave.y - normalizedY*neuronRadius*1.5, this.slave.x - normalizedX*(neuronRadius*1.5 - 8) + normalizedY*15, this.slave.y - normalizedY*(neuronRadius*1.5 - 8) - normalizedX*15);
        line(this.slave.x - normalizedX*neuronRadius*1.5, this.slave.y - normalizedY*neuronRadius*1.5, this.slave.x - normalizedX*(neuronRadius*1.5 - 8) - normalizedY*15, this.slave.y - normalizedY*(neuronRadius*1.5 - 8) + normalizedX*15);
    }    
};

Synapse.prototype.delete = function() {
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
};
