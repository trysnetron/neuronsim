// Methods //

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

var prefButtons = [];
function addPrefButton(ix, iy, iw, ih, ifunc) {
    prefButtons.push({
        x1: ix,
        y1: iy,
        x2: ix + iw,
        y2: iy + ih,
        func: ifunc
    });
};