// Methods //

function pointOverCircle(pointX, pointY, circleX, circleY, circleRadius) {
    return (sq(pointX - circleX) + sq(pointY - circleY) <= sq(circleRadius));
};

function mouseOverNeuron() {
    for (let i=0; i<neurons.length; ++i) {
        if (pointOverCircle(mouseX, mouseY, neurons[i].x, neurons[i].y, NEURON_RADIUS)) {
            return neurons[i];
        }
    }
    return null;
};

function mouseOverSynapse() {
    let synapse, synapseAngle, mouseAngle, synapseDist, mouseDist, relX, relY;
    for (let i=0; i<neurons.length; ++i){
        for (let j=0; j<neurons[i].axons.length; ++j) {
            synapse = neurons[i].axons[j];
            synapseAngle = atan2(synapse.slave.y-synapse.master.y, synapse.slave.x-synapse.master.x);
            mouseAngle = atan2(mouseY-synapse.master.y, mouseX-synapse.master.x);
            synapseDist = dist(synapse.master.x, synapse.master.y, synapse.slave.x, synapse.slave.y);
            mouseDist = dist(synapse.master.x, synapse.master.y, mouseX, mouseY);
            relX = cos(mouseAngle - synapseAngle)*mouseDist;
            relY = sin(mouseAngle - synapseAngle)*mouseDist;
            if (relX > NEURON_RADIUS && abs(relY) < 10 && relX < synapseDist-NEURON_RADIUS) {
                return synapse;
            }
        }
    }
    return null;
}

function findSynapse(id) {
    for (let i=0; i<neurons.length; ++i) {
        for (let j=0; j<neurons[i].axons.length; ++j) {
            if (neurons[i].axons[j] == id) {
                
            }
        }
    }
}

function saveNetwork() {
    let save = {};
    save.neurons0 = [];
    for (let i=0; i<neurons.length; ++i) {
        let neuron = {
            x: neurons[i].x,
            y: neurons[i].y,
            slaves: [],
            dendriteType: []
        };
        for (let j=0; j<neurons[i].axons.length; ++j) {
            neuron.slaves.push(neurons[i].axons[j].slave.getId());
            neuron.dendriteType.push(neurons[i].axons[j].type);
        }
        save.neurons0.push(neuron);
    }
    save = JSON.stringify(save);
    
    if (confirm("This will override the current save!")) {
        if (typeof(Storage) !== undefined) {
            localStorage.save = save;
        }else{
            return false;
        }
    } else {
        return false;
    }
    return true;
}   

function loadNetwork() {
    if (typeof(Storage) !== undefined) {
        if (localStorage.save !== undefined) {
            if (neurons.length) {
                if (!confirm("Are you sure? All your current work will be lost!")) {
                    return false;
                }
            }

            let saveObj = JSON.parse(localStorage.save);

            //tømmer det eksisterende nettverket
            for (let i=neurons.length-1; i>=0; --i) {
                neurons[i].delete();
            }

            // lager nevroner fra lagringsfil
            for (let i=0; i<saveObj.neurons0.length; ++i) {
                neurons.push(new Neuron(saveObj.neurons0[i].x, saveObj.neurons0[i].y));
            }
            // lager synapser
            for (let i=0; i<saveObj.neurons0.length; ++i) {
                for (let j=0; j<saveObj.neurons0[i].slaves.length; ++j) {
                    new Synapse(neurons[i], neurons[saveObj.neurons0[i].slaves[j]], saveObj.neurons0[i].dendriteType[j]);
                }
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
    return true;
};

function getSaveInfo() {
    if (typeof(Storage) !== undefined) {
        if (localStorage.save !== undefined) {
            let saveObj = JSON.parse(localStorage.save);
            let neuronNum = saveObj.neurons0.length;
            let synapseNum = 0;
            for (let i=0; i<saveObj.neurons0.length; ++i) {
                synapseNum += saveObj.neurons0[i].slaves.length;
            }
            return (neuronNum + " neurons, " + synapseNum + " synapses.");
        } else {
            return false;
        }
    } else {
        return false;
    }
};