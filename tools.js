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
        ellipse(this.selectedNeurons[i].x, this.selectedNeurons[i].y, NEURON_RADIUS*4);
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
createTool.cursor = function() {
    noFill();
    stroke(120);
    ellipse(mouseX, mouseY, NEURON_RADIUS*2, NEURON_RADIUS*2);
};
createTool.icon = function(x, y) {
    noFill();
    ellipse(x + toolBannerHeight/2, y + toolBannerHeight/2, toolBannerHeight*0.5, toolBannerHeight*0.5);
    line(x + toolBannerHeight*0.1, y + toolBannerHeight*0.2, x + toolBannerHeight*0.3, y + toolBannerHeight*0.2);
    line(x + toolBannerHeight*0.2, y + toolBannerHeight*0.1, x + toolBannerHeight*0.2, y + toolBannerHeight*0.3);
};
createTool.info = "Click to create a neuron.";

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
////////////////////////////////////////////////
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
        ellipse(neuron.x, neuron.y, NEURON_RADIUS*2 + 20, NEURON_RADIUS*2 + 20);
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