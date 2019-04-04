///////////////////////////////////////////////
//////// N E V R O N S I M U L A T O R ////////
///////////////////////////////////////////////
/// Laget av Trym Sneltvedt - www.snelt.net /// 
///////////////////////////////////////////////

const canvas = document.querySelector('#workspace')
const wrapper = document.querySelector('#workspace-wrapper')
const topBanner = document.querySelector('#topbanner')
const toolBanner = document.querySelector('#toolbanner')

if (canvas && wrapper && topBanner && toolBanner) {
    const ctx = canvas.getContext('2d')
    let mouseX = 0
    let mouseY = 0

    function millis() {
        const now = new Date();
        return Number(now)
    }

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
            frequencyLimit: 10,

            decayMode: "exponential",
            exponentialDecay: 2, // Antall sekunder
            exponentialDecayBase: 0.9,
            linearDecay: 60, // Potensial per sekund
            
            pulseMode: "synapseLengthIndependent",
            pulseDuration: 1000, // Millisekunder
            pulseDistance: 500, // Hvor mange pixler pulsen skal bevege seg per sekund, gjelder bare når synapsen er lengdeavhengig
            pulseLightDuration: 2000,

            neurons: [], 

            previousMillis: 0 // Tellevarabel, holder på antall millisekunder fra forrige frame til nåværende
        },
        showPreferences: false,

        workspace: undefined,
        toolBanner: undefined,
        toolBannerHeight: 40,
        toolBannerWidth: 20,

        neuronRadius: 10,
        tools: [
            { // Move tool
                name: "Move tool",
                info: "Click and drag a neuron to move it",
                activate: function() {
                    this.neuron = null;
                    this.dragging = false;
                },
                lclick: function() {
                    this.neuron = mouseOverNeuron();
                    if (this.neuron != null) {
                        this.dragging = true;
                        this.offsetX = mouseX - this.neuron.x;
                        this.offsetY = mouseY - this.neuron.y;
                    }
                },
                rclick: function() {},
                drag: function() {
                    if (this.dragging) {
                        this.neuron.move(mouseX - this.offsetX, mouseY - this.offsetY);
                    }
                },
                release: function() {
                    if (this.dragging) {
                        this.neuron = null;
                        this.dragging = false;
                    }
                },
                display: function() {},
                inactiveDisplay: function() {},
                img: "images/move.png",
                buttonElement: undefined,

                neuron: null,
                dragging: false,
                offsetX: 0,
                offsetY: 0
            }, 
            { // Excite tool
                name: "Excite tool",
                info: "Left click a neuron to make it fire.\nRight click a neuron to include/remove it from firing group.\nWhen one neuron in firing group fires, all neurons in fire group fires.",
                activate: function() {},
                lclick: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        
                        if (neuron.group) {
                            // Får alle nevroner i gruppen til å fyre
                            for (let i=0; i<app.network.neurons.length; ++i) {
                                if (app.network.neurons[i].group) {
                                    app.network.neurons[i].newPulse();
                                }
                            }
                        } else {
                            neuron.newPulse();
                        }
                    }
                },
                rclick: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        if (!neuron.spontaneousActivity) {
                            if (neuron.group) {
                                neuron.group = 0;
                            } else {
                                neuron.group = 1;
                            }
                        }
                    }
                },
                drag: function() {},
                release: function() {},
                display: function() {},
                inactiveDisplay: function() {},
                img: "images/excite.png",
                buttonElement: undefined
            },
            { // Flashlight tool
                name: "Flashlight tool",
                info: "Left click to make all neurons within range fire.",
                activate: function() {},
                lclick: function() {
                    this.pressing = true;
                },
                rclick: function() {},
                drag: function() {},
                release: function() {
                    this.pressing = false;
                },
                display: function() {
                    if (this.pressing) {
                        if (this.fireCounter < 60 *this.firePeriod) {
                            ++this.fireCounter;
                        } else {
                            for (let i=0; i<app.network.neurons.length; ++i) {
                                if (pointOverCircle(app.network.neurons[i].x, app.network.neurons[i].y, mouseX, mouseY, this.radius)) {
                                    app.network.neurons[i].newPulse();
                                } 
                            }
                            this.fireCounter = 0;
                        }
                        ctx.fillStyle = '#ff01'
                    } else {
                        ctx.fillStyle = '#ff04'
                    }
                    ctx.beginPath()
                    ctx.arc(mouseX, mouseY, this.radius*2, 0, Math.PI*2)
                    ctx.fill()
                },
                inactiveDisplay: function() {},
                img: "images/flashlight.png",
                buttonElement: undefined,

                pressing: false,
                radius: 100,
                firePeriod: 0.1,
                fireCounter: 0
            },
            { // Neuron tool
                name: "Neuron tool",
                info: "Left click to create a neuron.\nRight click to create a neuron with a base frequency.",
                activate: function() {},
                lclick: function() {
                    app.network.neurons.push(new Neuron(mouseX, mouseY));
                },
                rclick: function() {
                    let neuron = new Neuron(mouseX, mouseY);
                    neuron.spontaneousActivity = true;
                    app.network.neurons.push(neuron);
                },
                drag: function() {},
                release: function() {},
                display: function() {
                    ctx.strokeStyle = '#888'
                    ctx.beginPath()
                    ctx.arc(mouseX, mouseY, app.neuronRadius*2, 0, Math.PI*2);
                    ctx.stroke()
                },
                inactiveDisplay: function() {},
                img: "images/neuron.png",
                buttonElement: undefined
            },/*
            { // Excitatory synapse tool
                name: "Excitatory synapse tool",
                info: "Click a neuron to start making a synapse, and then click another one to complete it.",
                activate: function() {
                    this.masterNeuron = null;
                },
                lclick: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        if (this.masterNeuron == null) {
                            this.masterNeuron = neuron;
                        } else if (neuron != this.masterNeuron) {
                            this.masterNeuron.newSynapse(neuron, "excitatory", false);
                            this.masterNeuron = null; 
                        }
                    }else if (this.masterNeuron != null) {
                        this.masterNeuron = null;
                    }
                },
                rclick: function() {},
                drag: function() {},
                release: function() {
                    if (this.masterNeuron != null) {
                        let neuron = mouseOverNeuron();
                        if (neuron != null) {
                            if (neuron != this.masterNeuron) {
                                this.masterNeuron.newSynapse(neuron, "excitatory", false);
                                this.masterNeuron = null;
                            } 
                        }
                    }
                },
                display: function() {
                    stroke(0, 240, 0);
                    if (this.masterNeuron != null) {
                        let distance = dist(this.masterNeuron.x, this.masterNeuron.y, mouseX, mouseY);
                        let normalizedX = (mouseX - this.masterNeuron.x)/distance;
                        let normalizedY = (mouseY - this.masterNeuron.y)/distance;
                        for (let i=0; i<distance; i+=6) {
                            point(this.masterNeuron.x + normalizedX*i, this.masterNeuron.y + normalizedY*i);
                        }
                    }
                },
                inactiveDisplay: function() {},
                img: "excitatory_independent.png",
                buttonElement: undefined,

                masterNeuron: null
            }, 
            { // Inhibitory synapse tool
                name: "Inhibitory synapse tool",
                info: "Click a neuron to start making an synapse, and then click another one to complete it.",
                activate: function() {
                    this.masterNeuron = null;
                },
                lclick: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        if (this.masterNeuron == null) {
                            this.masterNeuron = neuron;
                        } else if (neuron != this.masterNeuron) {
                            this.masterNeuron.newSynapse(neuron, "inhibitory", false);
                            this.masterNeuron = null; 
                        }
                    }else if (this.masterNeuron != null) {
                        this.masterNeuron = null;
                    }
                },
                rclick: function() {},
                drag: function() {},
                release: function() {
                    if (this.masterNeuron != null) {
                        let neuron = mouseOverNeuron();
                        if (neuron != null) {
                            if (neuron != this.masterNeuron) {
                                this.masterNeuron.newSynapse(neuron, "inhibitory", false);
                                this.masterNeuron = null;
                            } 
                        }
                    }
                },
                display: function() {
                    stroke(190, 0, 0);
                    if (this.masterNeuron != null) {
                        let distance = dist(this.masterNeuron.x, this.masterNeuron.y, mouseX, mouseY);
                        let normalizedX = (mouseX - this.masterNeuron.x)/distance;
                        let normalizedY = (mouseY - this.masterNeuron.y)/distance;
                        for (let i=0; i<distance; i+=6) {
                            point(this.masterNeuron.x + normalizedX*i, this.masterNeuron.y + normalizedY*i);
                        }
                    }
                },
                inactiveDisplay: function() {},
                img: "inhibitory_independent.png",
                buttonElement: undefined,

                masterNeuron: null
            },*/
            { // Excitatory dependent synapse tool
                name: "Excitatory synapse tool",
                info: "Click a neuron to start making a synapse, and then click another one to complete it.",
                activate: function() {
                    this.masterNeuron = null;
                },
                lclick: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        if (this.masterNeuron == null) {
                            this.masterNeuron = neuron;
                        } else if (neuron != this.masterNeuron) {
                            this.masterNeuron.newSynapse(neuron, "excitatory", true);
                            this.masterNeuron = null; 
                        }
                    }else if (this.masterNeuron != null) {
                        this.masterNeuron = null;
                    }
                },
                rclick: function() {},
                drag: function() {},
                release: function() {
                    if (this.masterNeuron != null) {
                        let neuron = mouseOverNeuron();
                        if (neuron != null) {
                            if (neuron != this.masterNeuron) {
                                this.masterNeuron.newSynapse(neuron, "excitatory", true);
                                this.masterNeuron = null;
                            } 
                        }
                    }
                },
                display: function() {
                    if (this.masterNeuron != null) {
                        ctx.strokeStyle = '#0f0'
                        ctx.beginPath()
                        ctx.moveTo(this.masterNeuron.x, this.masterNeuron.y)
                        ctx.lineTo(mouseX, mouseY)
                        ctx.stroke()
                    }
                },
                inactiveDisplay: function() {},
                img: "images/excitatory_dependent.png",
                buttonElement: undefined,

                masterNeuron: null
            },
            { // Inhibiory dependent synapse tool
                name: "Inhibitory synapse tool",
                info: "Click a neuron to start making a synapse, and then click another one to complete it.",
                activate: function() {
                    this.masterNeuron = null;
                },
                lclick: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        if (this.masterNeuron == null) {
                            this.masterNeuron = neuron;
                        } else if (neuron != this.masterNeuron) {
                            this.masterNeuron.newSynapse(neuron, "inhibitory", true);
                            this.masterNeuron = null; 
                        }
                    }else if (this.masterNeuron != null) {
                        this.masterNeuron = null;
                    }
                },
                rclick: function() {},
                drag: function() {},
                release: function() {
                    if (this.masterNeuron != null) {
                        let neuron = mouseOverNeuron();
                        if (neuron != null) {
                            if (neuron != this.masterNeuron) {
                                this.masterNeuron.newSynapse(neuron, "inhibitory", true);
                                this.masterNeuron = null;
                            } 
                        }
                    }
                },
                display: function() {
                    if (this.masterNeuron != null) {
                        ctx.strokeStyle = '#f00';
                        ctx.beginPath()
                        ctx.moveTo(this.masterNeuron.x, this.masterNeuron.y)
                        ctx.lineTo(mouseX, mouseY)
                        ctx.stroke()
                    }
                },
                inactiveDisplay: function() {},
                img: "images/inhibitory_dependent.png",
                buttonElement: undefined,

                masterNeuron: null
            },/*
            { // Inspect tool
                name: "Inspect tool",
                info: "Hover over a neuron to see info about it.",
                activate: function() {},
                lclick: function() {},
                rclick: function() {},
                drag: function() {},
                release: function() {},
                display: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron !== null) {
                        fill(20);
                        stroke(240);
                        rect(mouseX + 20, mouseY + 20, 220, 220);
                        fill(240);
                        noStroke();
                        text("Number of axons: " + neuron.axons.length, mouseX + 25, mouseY + 25);
                        text("Number of dendrites: " + neuron.dendrites.length, mouseX + 25, mouseY + 40);
                    }
                },
                inactiveDisplay: function() {},
                img: "inspect.png",
                buttonElement: undefined
            },*/
            { // Delete tool
                name: "Delete tool",
                info: "Click neurons or synapses to delete them.",
                activate: function() {},
                lclick: function() {
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
                },
                rclick: function() {},
                drag: function() {},
                release: function() {},
                display: function() {
                    let neuron = mouseOverNeuron();
                    if (neuron != null) {
                        ctx.fillStyle = '#f005'
                        ctx.beginPath()
                        ctx.arc(neuron.x, neuron.y, app.neuronRadius*2 + 20, 0, Math.PI*2)
                        ctx.fill()
                    }else{
                        let synapse = mouseOverSynapse();
                        if (synapse != null) {
                            ctx.strokeWeight = 20
                            ctx.strokeStyle = '#f005'
                            ctx.beginPath()
                            ctx.moveTo(synapse.master.x, synapse.master.y)
                            ctx.lineTo(synapse.slave.x, synapse.slave.y)
                            ctx.stroke()
                            ctx.strokeWeight = 1
                        }
                    }
                },
                inactiveDisplay: function() {},
                img: "images/delete.png",
                buttonElement: undefined
            }
        ],
        tool: 0,
        switchTool: function(tool) {
            if (tool >= 0 && tool < this.tools.length) {
                if (tool != this.tool) {
                    //this.tools[this.tool].buttonElement.removeClass("selected");
                    //this.tools[this.tool].buttonElement.addClass("unselected");
                    this.tool = tool;
                    //this.tools[this.tool].buttonElement.removeClass("unselected");
                    //this.tools[this.tool].buttonElement.addClass("selected");
                    this.tools[this.tool].activate();
                    return true;
                }
            }
            return false;
        }
    };

    // Nevronklasse
    class Neuron{
        constructor(ix, iy) {
            this.x = ix;
            this.y = iy;
            this.potential = 0;
            this.potentialCompletion = 0;
            this.lastPulseTimestamp = -app.network.pulseLightDuration;
            
            this.spontaneousActivity = false;
            this.frequency = app.network.baseFrequency;
            this.frequencyCounter = this.frequency*60;

            this.axons = [];
            this.dendrites = [];
            this.group = 0;
            
            this.pulses = [];
        }

        updatePotential() {
            if (this.spontaneousActivity) {
                // Sørger for at egenfrekvensen ikke blir negativ
                if (this.frequency < 0) {
                    this.frequency = 0;
                } else if (this.frequency > app.network.frequencyLimit) { // Og at den ikke overskrider maksimal frekvens
                    this.frequency = app.network.frequencyLimit;
                }

                // Fyrer med riktig frekvens hvis nevronet har egenfrekvens
                if (this.frequencyCounter < Math.round(60/this.frequency)) {
                    ++this.frequencyCounter;
                } else {
                    this.newPulse();
                    this.frequencyCounter = 0;
                }
                
                // Stabiliserer frekvensen
                if (this.frequency > app.network.baseFrequency) {
                    this.frequency -= app.network.frequencyStabilize/60;
                    if (this.frequency < app.network.baseFrequency) {
                        this.frequency = app.network.baseFrequency;
                    }
                } else if (this.frequency < app.network.baseFrequency) {
                    this.frequency += app.network.frequencyStabilize/60;
                    if (this.frequency > app.network.baseFrequency) {
                        this.frequency = app.network.baseFrequency;
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
                        this.potential -= app.network.linearDecay*(millis()-app.previousMillis)/1000;
                        if (this.potential < 0) {
                            this.potential = 0;
                        }
                    } else if (this.potential < 0) {
                        this.potential += app.network.linearDecay*(millis()-app.previousMillis)/1000;
                        if (this.potential > 0) {
                            this.potential = 0;
                        }
                    }
                } else if (app.network.decayMode == "exponential") {
                    this.potential *= app.network.exponentialDecayBase;
                }    
                
                this.potentialCompletion = Math.min(Math.max(this.potential/app.network.potentialThreshold, -1), 1)
            }
        }

        updatePulses() {
            for (let i=0; i<this.axons.length; ++i) {
                this.axons[i].propagatePulses();
            }
        }

        display() {
            // Tegner synapser     
            for (let i=0; i<this.axons.length; ++i) {
                this.axons[i].display();
            }

            // Tegner seg selv
            if (!this.spontaneousActivity && (millis() - this.lastPulseTimestamp) <= app.network.pulseLightDuration) {
                ctx.strokeStyle = '#ff0'
            } else {
                ctx.strokeStyle = '#fff'
            }
            
            ctx.fillStyle = '#222'
            ctx.beginPath()
            ctx.arc(this.x, this.y, app.neuronRadius*2, 0, Math.PI*2)
            ctx.fill()
            ctx.stroke()
                
            if (!this.spontaneousActivity) {    
                //Tegner indre sirkel som indikerer potensial-nivå
                if (this.potential > 0) {
                    ctx.fillStyle = '#080'
                    ctx.beginPath()
                    ctx.arc(this.x, this.y, 2*app.neuronRadius*this.potentialCompletion, 0, Math.PI*2)
                    ctx.fill()
                } else if (this.potential < 0) {
                    ctx.fillStyle = '#800'
                    ctx.beginPath()
                    ctx.arc(this.x, this.y, 2*app.neuronRadius*-this.potentialCompletion, 0, Math.PI*2)
                    ctx.fill()
                }  
                if (this.group) {
                    // Tegner sirkel som indikerer at nevronet er i en gruppe
                    ctx.strokeStyle = '#ff0'
                    ctx.beginPath()
                    ctx.arc(this.x, this.y, app.neuronRadius*4, 0, Math.PI*2)
                    ctx.stroke()
                }

            } else {
                ctx.fillStyle = '#fff'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.font = '10 sans-serif'
                ctx.fillText(this.frequency.toPrecision(2) + "Hz", this.x, this.y)
                ctx.textAlign = 'left'
                ctx.textBaseline = 'top'
                ctx.font = '12 sans-serif'
                //ellipse(this.x, this.y, app.neuronRadius*1.6*abs(sin(PI*this.frequencyCounter/round(60/this.frequency))), app.neuronRadius*1.6*abs(sin(PI*this.frequencyCounter/round(60/this.frequency)))); 
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
            this.lastPulseTimestamp = millis();
        };

        isFiring() {
            if (this.axons.length) {
                for (let i=0; i<this.axons.length; ++i) {
                    if (this.axons[i].pulses.length) {
                        return true;
                    }
                }
            }
            return false;
        };

        constrainPosition() {
            if (this.x < 0) {this.x = 0;}
            if (this.x > window.innerWidth) {this.x = window.innerWidth;}
            if (this.y < 0) {this.y = 0;}
            if (this.y > window.innerHeight) {this.y = window.innerHeight;}
        };

        move(newX, newY) {
            this.x = newX;
            this.y = newY;
            for (let i=0; i<this.axons.length; ++i) {
                this.axons[i].updateNeuronPosition();
            }
            for (let i=0; i<this.dendrites.length; ++i) {
                this.dendrites[i].updateNeuronPosition();
            }
            this.constrainPosition();
        };

        getId() {
            for (let i=0; i<app.neurons.length; ++i) {
                if (app.neurons[i] === this) {
                    return i;
                }
            }
            return -1;
        };

        newSynapse(slaveNeuron, type, lengthDependent) {
            let newSynapse = new Synapse(this, slaveNeuron, type, lengthDependent);
            this.axons.push(newSynapse);
            slaveNeuron.dendrites.push(newSynapse);
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
            for (let i=0; i<app.network.neurons.length; ++i) {
                if (app.network.neurons[i] == this) {
                    app.network.neurons.splice(i, 1);
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
            this.updateNeuronPosition();

            this.pulses = [];
        };

        addPulse() {
            this.pulses.push(0);
        }

        propagatePulses() {
            for (let i=this.pulses.length-1; i>=0; --i) {
                if (this.lengthDependent) { // Avhengig av lengde
                    if (this.distance <= 0) {
                        this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
                        if (this.type == "excitatory") {
                            this.slave.excitatoryFire();
                        } else if(this.type == "inhibitory") {
                            this.slave.inhibitoryFire();
                        }
                    } else {
                        if (this.pulses[i] >= 1) {
                            this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
                            if (this.type == "excitatory") {
                                this.slave.excitatoryFire();
                            } else if(this.type == "inhibitory") {
                                this.slave.inhibitoryFire();
                            }
                        } else {
                            this.pulses[i] += (millis() - app.previousMillis)/1000*app.network.pulseDistance/this.distance;
                        }
                        /*if ((millis() - this.pulses[i])/1000*app.network.pulseDistance >= this.distance - app.neuronRadius*2) {
                            
                        }*/
                    }
                } else { // Uavhengig av lengde
                    if (this.pulses[i] >= 1) {
                        this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
                        if (this.type == "excitatory") {
                            this.slave.excitatoryFire();
                        } else if(this.type == "inhibitory") {
                            this.slave.inhibitoryFire();
                        }
                    } else {
                        this.pulses[i] += (millis() - app.previousMillis) / app.network.pulseDuration;
                    }
                    //millis() - this.pulses[i] >= app.network.pulseDuration) {
                        
                }
            }
        }

        updateNeuronPosition() {
            this.distance = Math.hypot(this.slave.x - this.master.x, this.slave.y - this.master.y)
            this.normalizedX = (this.slave.x - this.master.x)/this.distance;
            this.normalizedY = (this.slave.y - this.master.y)/this.distance;
            this.distance -= app.neuronRadius * 2;
        }

        display() {
            // synapsen farges grønn hvis eksitatorisk, rød hvis inhibitorisk
            if (this.type == "excitatory") {
                ctx.strokeStyle = '#090'
            } else if (this.type == "inhibitory") {
                ctx.strokeStyle = '#900'
            }

            // Tegner synapsen
            if (this.distance > 0) { // gidder bare tegne hvis synapsen er lengre enn 0 pixler
                if (this.lengthDependent) {  
                    ctx.beginPath()
                    ctx.moveTo(this.master.x + this.normalizedX*app.neuronRadius*1.25, this.master.y + this.normalizedY*app.neuronRadius*1.25)
                    ctx.lineTo(this.slave.x - this.normalizedX*app.neuronRadius*1.25, this.slave.y - this.normalizedY*app.neuronRadius*1.25)
                    ctx.stroke()
                } else {
                    for (let i=app.neuronRadius; i<this.distance + app.neuronRadius*0.75; i+=6) {
                        ctx.fillStyle = ctx.strokeStyle
                        ctx.fillRect(this.master.x + this.normalizedX*i, this.master.y + this.normalizedY*i, 1, 1)
                    }
                }
                ctx.beginPath()
                ctx.moveTo(this.slave.x - this.normalizedX*app.neuronRadius*1.25 + this.normalizedY * 6, this.slave.y - this.normalizedY*app.neuronRadius*1.25 - this.normalizedX * 6)
                ctx.lineTo(this.slave.x - this.normalizedX*app.neuronRadius*1.25 - this.normalizedY * 6, this.slave.y - this.normalizedY*app.neuronRadius*1.25 + this.normalizedX * 6)
                ctx.stroke()

                // Tegner pulsense som beveger seg over synapsen
                ctx.strokeStyle = '#ff0'
                for (let i=0; i<this.pulses.length; ++i) {
                    ctx.beginPath()
                    ctx.moveTo(this.master.x + this.normalizedX*(app.neuronRadius + this.pulses[i] * this.distance) + this.normalizedY * 5, 
                               this.master.y + this.normalizedY*(app.neuronRadius + this.pulses[i] * this.distance) - this.normalizedX * 5)
                    ctx.lineTo(this.master.x + this.normalizedX*(app.neuronRadius + this.pulses[i] * this.distance) - this.normalizedY * 5, 
                               this.master.y + this.normalizedY*(app.neuronRadius + this.pulses[i] * this.distance) + this.normalizedX * 5)
                    ctx.stroke()
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
        return (Math.hypot(pointX - circleX, pointY - circleY) <= circleRadius)
    };

    function mouseOverNeuron() {
        for (let i = 0; i < app.network.neurons.length; ++i) {
            if (pointOverCircle(mouseX, mouseY, app.network.neurons[i].x, app.network.neurons[i].y, app.neuronRadius)) {
                return app.network.neurons[i];
            }
        }
        return null;
    };

    function mouseOverSynapse() {
        let synapse, synapseAngle, mouseAngle, synapseDist, mouseDist, relX, relY;
        // Går baklengs gjennom alle synapser for å velge de som ligger "øverst" først
        for (let i = app.network.neurons.length - 1; i >= 0 ; --i) { 
            for (let j = app.network.neurons[i].axons.length - 1; j >= 0; --j) {
                synapse = app.network.neurons[i].axons[j];
                synapseAngle = Math.atan2(synapse.slave.y - synapse.master.y, synapse.slave.x - synapse.master.x)
                mouseAngle = Math.atan2(mouseY - synapse.master.y, mouseX - synapse.master.x)
                synapseDist = Math.hypot(synapse.slave.x - synapse.master.x, synapse.slave.y - synapse.master.y)
                mouseDist = Math.hypot(mouseX - synapse.master.x, mouseY - synapse.master.y)
                relX = Math.cos(mouseAngle - synapseAngle) * mouseDist;
                relY = Math.sin(mouseAngle - synapseAngle) * mouseDist;
                if (relX > app.neuronRadius && Math.abs(relY) < 10 && relX < synapseDist - app.neuronRadius) {
                    return synapse;
                }
            }
        }
        return null;
    };

    function saveNetwork(saveName) {
        let save = JSON.stringify(app.network);
        if (typeof (Storage) !== undefined) {
            if (localStorage.getItem(saveName) !== null) {
                if (!confirm("This will override the save!")) {
                    return false;
                }
            }
            localStorage.setItem(saveName, save);
            return true;    
        } else {
            return false;
        }
    }

    function loadNetwork(saveName) {
        if (typeof (Storage) !== undefined) { // Sjekker at lokal lagring fungerer
            if (localStorage.getItem(saveName) !== null) { // Sjekker at den ønskede lagringsfilen eksisterer
                app.network = JSON.parse(localStorage.getItem(saveName));
            } else {
                return false;
            }
        } else {
            return false;
        }
        return true;
    };

    function getExponentialDecayBase(targetSeconds) {
        return Math.exp(Math.log(0.01) / 60 / targetSeconds);
    };

    function getLinearDecayCoefficient() {
        return linearDecayPotentialPerSec / 60;
    };

    function setup() {
        // Skrur av høyreklikk-menyen
        document.body.oncontextmenu = function () { return false; };
        
        /*
        app.workspace.position(0, app.toolBannerHeight);
        app.toolBanner = createDiv("");
        app.toolBanner.id("toolBanner");
        app.toolBanner.style("height", String(app.toolBannerHeight) + "px");

        for (let i=0; i<app.tools.length; ++i) {
            app.tools[i].buttonElement = createDiv("");
            app.tools[i].buttonElement.position(i*app.toolBannerHeight, 0);
            app.tools[i].buttonElement.size(app.toolBannerHeight, app.toolBannerHeight);
            app.tools[i].buttonElement.parent(app.toolBanner);
            app.tools[i].buttonElement.addClass("toolButton");
            if (i == 0) {
                app.tools[i].buttonElement.addClass("selected");
            } else {
                app.tools[i].buttonElement.addClass("unselected");
            }
            app.tools[i].buttonElement.style("background-image", "url(" + app.tools[i].img + ")");
            
            app.tools[i].buttonElement.mousePressed(function() {
                app.switchTool(i);
            });
        }
        */
        updateWorkspaceSize();

        /*
        app.network.neurons.push(new Neuron(100, 400));
        app.network.neurons.push(new Neuron(200, 150));
        app.network.neurons.push(new Neuron(200, 800));
        app.network.neurons.push(new Neuron(600, 800));
        app.network.neurons.push(new Neuron(300, 400));
        
        app.network.neurons[0].newSynapse(app.network.neurons[1], "excitatory", true);
        app.network.neurons[0].newSynapse(app.network.neurons[2], "inhibitory", true);
        app.network.neurons[0].newSynapse(app.network.neurons[3], "inhibitory", false);
        app.network.neurons[0].newSynapse(app.network.neurons[4], "excitatory", false);
        app.network.neurons[1].newSynapse(app.network.neurons[2], "excitatory", false);
        */
    }

    function draw() {
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
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
                

            } 
            // Tegner grafikk fra verktøy
            for (let i = 0; i < app.tools.length; ++i) {
                if (i == app.tool) {
                    app.tools[i].display();
                } else {
                    app.tools[i].inactiveDisplay();
                }
            }
        }
        
        if (app.tools.length) {
            ctx.fillStyle = '#fff'
            ctx.fillText(app.tools[app.tool].name, 10, 10)
            ctx.fillStyle = '#bbb'
            ctx.fillText(app.tools[app.tool].info, 10, 28)
        }    
        app.previousMillis = Date.now();
    
        requestAnimationFrame(draw)
    };

    function keyPressed(e) {
        // skrur av de fleste knapper når man er inne i innstillinger
        if (e.key >= 1 && e.key <= 9) { // 1 2 3 4 5 6 7 8 9
            app.switchTool(e.key);
            console.log(e.key)
        }
    };

    function mousePressed(e) {
        if (mouseInsideWorkspace()) {   
            if (e.button === 0) {
                app.tools[app.tool].lclick();
            } else if (e.button === 2) {
                app.tools[app.tool].rclick();
            }
        }
    };

    function mouseReleased() {
        if (mouseInsideWorkspace()) {
            app.tools[app.tool].release();
        }
    };

    function mouseDragged(e) {
        if (mouseInsideWorkspace()) {
            app.tools[app.tool].drag();
        }
        mouseX = e.clientX
        mouseY = e.clientY
    };

    function mouseInsideWorkspace() {
        return (mouseX >= 0 && mouseX < canvas.width && mouseY >= 0 && mouseY < canvas.height);
    }

    function updateWorkspaceSize() {
        // sjekker at ingen nevroner havner på utsiden av vinduet
        for (let i = 0; i < app.network.neurons.length; ++i) {
            app.network.neurons[i].constrainPosition();
        }
        // endrer størrelsen på canvas
        console.log(wrapper.clientWidth, wrapper.clientHeight)
        const wrapperRect = wrapper.getBoundingClientRect()
        canvas.width = wrapperRect.width
        canvas.height = wrapperRect.height
    };

    window.addEventListener('keypress', keyPressed)

    canvas.addEventListener('mousedown', mousePressed)
    canvas.addEventListener('mousemove', mouseDragged)
    canvas.addEventListener('mouseup', mouseReleased)

    window.addEventListener("resize", updateWorkspaceSize);

    setup()

    draw()
} else {
    console.error('[FATAL ERROR] Could not find canvas element')
}
