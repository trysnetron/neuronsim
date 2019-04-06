
// Constants
const potentialThreshold = 100
const potentialPulseIncrement = 80
const potentialPulseDecrement = 80
const potentialLimit = 200
const baseFrequency = 2     // Hz
const frequencyStabilize = 1     // Hz/s
const frequencyIncrement = 1
const frequencyDecrement = 1
const frequencyLimit = 10
const decayMode = "exponential"
const exponentialDecay = 2 // Antall sekunder
const exponentialDecayBase = 0.9
const linearDecay = 60 // Potensial per sekund
const pulseMode = "synapseLengthIndependent"
const pulseDuration = 1000 // Millisekunder
const pulseDistance = 500 // Hvor mange pixler pulsen skal bevege seg per sekund, gjelder bare når synapsen er lengdeavhengig
const pulseLightDuration = 2000
const previousMillis = 0 // Tellevarabel, holder på antall millisekunder fra forrige frame til nåværende
const showPreferences = false
const workspace = undefined
const toolBanner = undefined
const toolBannerHeight = 40
const toolBannerWidth = 20
const neuronRadius = 20


function millis() {
  return Number(new Date())
}

/**
 * Neuron Class
 */
class Neuron {
  constructor(ix, iy) {
    this.x = ix;
    this.y = iy;
    this.potential = 0;
    this.potentialCompletion = 0;
    this.lastPulseTimestamp = pulseLightDuration;

    this.spontaneousActivity = false;
    this.frequency = baseFrequency;
    this.frequencyCounter = this.frequency * 60;

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
      } else if (this.frequency > frequencyLimit) { // Og at den ikke overskrider maksimal frekvens
        this.frequency = frequencyLimit;
      }

      // Fyrer med riktig frekvens hvis nevronet har egenfrekvens
      if (this.frequencyCounter < Math.round(60 / this.frequency)) {
        ++this.frequencyCounter;
      } else {
        this.newPulse();
        this.frequencyCounter = 0;
      }

      // Stabiliserer frekvensen
      if (this.frequency > baseFrequency) {
        this.frequency -= frequencyStabilize / 60;
        if (this.frequency < baseFrequency) {
          this.frequency = baseFrequency;
        }
      } else if (this.frequency < baseFrequency) {
        this.frequency += frequencyStabilize / 60;
        if (this.frequency > baseFrequency) {
          this.frequency = baseFrequency;
        }
      }
    } else {
      // Sørger for at ikke potensialet er utenfor grensene
      if (this.potential > potentialLimit) {
        this.potential = potentialLimit;
      } else if (this.potential < -potentialLimit) {
        this.potential = -potentialLimit;
      }

      // Fyrer aksonet om potensialet er over grensepotensialet
      if (this.potential >= potentialThreshold) {
        // fyrer
        this.newPulse();
        this.potential = -linearDecay;
      }

      // Får potensialet til å nærme seg hvilepotensialet (0) 
      if (decayMode == "linear") {
        if (this.potential > 0) {
          this.potential -= linearDecay * (millis() - previousMillis) / 1000;
          if (this.potential < 0) {
            this.potential = 0;
          }
        } else if (this.potential < 0) {
          this.potential += linearDecay * (millis() - previousMillis) / 1000;
          if (this.potential > 0) {
            this.potential = 0;
          }
        }
      } else if (decayMode == "exponential") {
        this.potential *= exponentialDecayBase;
      }

      this.potentialCompletion = Math.min(Math.max(this.potential / potentialThreshold, -1), 1)
    }
  }

  updatePulses() {
    for (let i = 0; i < this.axons.length; ++i) {
      this.axons[i].propagatePulses();
    }
  }

  inhibitoryFire() {
    if (!this.spontaneousActivity) {
      this.potential -= potentialPulseDecrement;
    } else {
      this.frequency -= frequencyDecrement;
    }
  };

  excitatoryFire() {
    if (!this.spontaneousActivity) {
      this.potential += potentialPulseIncrement;
    } else {
      this.frequency += frequencyIncrement;
    }
  };

  newPulse() {
    // Ganger varigheten (i sekunder) med framerate for at timingen skal bli riktig
    //this.pulses.push(round(pulseDuration));
    for (let i = 0; i < this.axons.length; ++i) {
      this.axons[i].addPulse();
    }
    this.lastPulseTimestamp = millis();
  };

  isFiring() {
    if (this.axons.length) {
      for (let i = 0; i < this.axons.length; ++i) {
        if (this.axons[i].pulses.length) {
          return true;
        }
      }
    }
    return false;
  };

  constrainPosition() {
    if (this.x < 0) { this.x = 0; }
    if (this.x > window.innerWidth) { this.x = window.innerWidth; }
    if (this.y < 0) { this.y = 0; }
    if (this.y > window.innerHeight) { this.y = window.innerHeight; }
  };

  move(newX, newY) {
    this.x = newX;
    this.y = newY;
    for (let i = 0; i < this.axons.length; ++i) {
      this.axons[i].updateNeuronPosition();
    }
    for (let i = 0; i < this.dendrites.length; ++i) {
      this.dendrites[i].updateNeuronPosition();
    }
    this.constrainPosition();
  };
}


/**
 * Synapse class
 */
class Synapse {
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
    for (let i = this.pulses.length - 1; i >= 0; --i) {
      if (this.lengthDependent) { // Avhengig av lengde
        if (this.distance <= 0) {
          this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
          if (this.type == "excitatory") {
            this.slave.excitatoryFire();
          } else if (this.type == "inhibitory") {
            this.slave.inhibitoryFire();
          }
        } else {
          if (this.pulses[i] >= 1) {
            this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
            if (this.type == "excitatory") {
              this.slave.excitatoryFire();
            } else if (this.type == "inhibitory") {
              this.slave.inhibitoryFire();
            }
          } else {
            this.pulses[i] += (millis() - previousMillis) / 1000 * pulseDistance / this.distance;
          }
          /*if ((millis() - this.pulses[i])/1000*pulseDistance >= this.distance - neuronRadius*2) {
              
          }*/
        }
      } else { // Uavhengig av lengde
        if (this.pulses[i] >= 1) {
          this.pulses.splice(i, 1); // Fjern denne pulsen fra pulslisten
          if (this.type == "excitatory") {
            this.slave.excitatoryFire();
          } else if (this.type == "inhibitory") {
            this.slave.inhibitoryFire();
          }
        } else {
          this.pulses[i] += (millis() - previousMillis) / pulseDuration;
        }
        //millis() - this.pulses[i] >= pulseDuration) {

      }
    }
  }

  updateNeuronPosition() {
    this.distance = Math.hypot(this.slave.x - this.master.x, this.slave.y - this.master.y)
    this.normalizedX = (this.slave.x - this.master.x) / this.distance;
    this.normalizedY = (this.slave.y - this.master.y) / this.distance;
    this.distance -= neuronRadius * 2;
  }
}

export default class Network {
  constructor() {
    this.neurons = []
    this.synapses = []
  }


  /**
   * Update all neurons and synapses in network
   * @param {Number} deltaTime 
   */
  update(deltaTime) {

  }

  /**
   * Adds a new neuron to the network
   * @param {Object} options
   * @returns {Neuron} 
   */
  createNeuron(options) {
    const newNeuron = new Neuron(options.x || 0, options.y || 0)
    this.neurons.push(newNeuron)
    return newNeuron
  }


  /**
   * Removes neuron (and connected synapses) from network
   * @param {Neuron} neuron 
   */
  deleteNeuron(neuron) {
    // Remove all connected axons and dendrites
    neuron.axons.forEach(s => this.deleteSynapse(s))
    neuron.dendrites.forEach(s => this.deleteSynapse(s))

    // Remove neuron from network
    this.neurons = this.neurons.filter(n => (n !== neuron))
  }


  /**
   * Adds a new synapse to the network
   * @param {Neuron} axonNeuron 
   * @param {Neuron} dendriteNeuron 
   */
  createSynapse(axonNeuron, dendriteNeuron, type) {
    const newSynapse = new Synapse(axonNeuron, dendriteNeuron, type, false)
    axonNeuron.axons.push(newSynapse)
    dendriteNeuron.dendrites.push(newSynapse)
  }


  /**
   * Remove synapse from network
   * @param {Synapse} synapse 
   */
  deleteSynapse(synapse) {
    // Remove from axon list of master neuron
    synapse.master.axons = synapse.master.axon.filter(s => (s !== synapse))

    // Remove from dendrite list of slave neuron
    synapse.slave.dendrites = synapse.slave.dendrites.filter(s => (s !== synapse))
  }
}