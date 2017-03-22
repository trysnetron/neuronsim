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
    save.neurons = [];
    for (let i=0; i<neurons.length; ++i) {
        save.neurons.push({
            x: neurons[i].x,
            y: neurons[i].y
        });
    }
    save = JSON.stringify(save);
    
    if (typeof(Storage) !== undefined) {
        localStorage.save = save;
    }else{
        return false;
    }
    return true;
}   

function loadNetwork() {
    if (typeof(Storage) !== undefined) {
        if (localStorage.save !== undefined) {
            let saveObj = JSON.parse(localStorage.save);

            //tømmer det eksisterende nettverket
            for (let i=neurons.length-1; i>=0; --i) {
                neurons[i].delete();
            }
            for (let i=0; i<saveObj.neurons.length; ++i) {
                neurons.push(new Neuron(saveObj.neurons[i].x, saveObj.neurons[i].y));
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
    return true;
}