const INHIBITORY_COLOR = '#fa4b4b'
const EXCITATORY_COLOR = '#28cd75'

const NEURON_RADIUS = 20


export default class View {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Network} neuronModel 
   */
  constructor(canvas, neuronModel) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    this.viewX = 0
    this.viewY = 0
    this.viewZoom = 1

    this.state = {
      mouseX: 0,
      mouseY: 0,
      hoverNeuron: undefined,
      hoverSynapse: undefined
    }

    this.neuronModel = neuronModel
    
    // Event handlers
    this.mouseMoveHandler = undefined
    this.mouseDownHandler = undefined
    this.mouseUpHandler = undefined
  
    this.canvas.addEventListener('mousemove', event => {
      // Update mouse position
       // (A + translate) * zoom = B -> A = B / zoom - translate 
      const bounding = this.canvas.getBoundingClientRect()
      const clientMouseX = event.clientX - bounding.left
      const clientMouseY = event.clientY - bounding.top
      this.state.mouseX = (clientMouseX - this.viewX) / this.viewZoom
      this.state.mouseY = (clientMouseY - this.viewY ) / this.viewZoom
      
      this.updateHover()

      // Call event handler with internal state if it is defined
      if (this.mouseMoveHandler) {
        this.mouseMoveHandler(Object.assign({}, this.state))
      }
    })

    // Call event handler with internal state if it is defined
    this.canvas.addEventListener('mousedown', () => {
      if (this.mouseMoveHandler) {
        this.mouseDownHandler(Object.assign({}, this.state))
      }   
    })
    
    // Call event handler with internal state if it is defined
    this.canvas.addEventListener('mouseup', () => {
      if (this.mouseMoveHandler) {
        this.mouseUpHandler(Object.assign({}, this.state))
      }   
    })
  }

  updateHover() {
    this.state.hoverNeuron = this.neuronModel.neurons.find(n => {
      const dx = this.state.mouseX - n.x
      const dy = this.state.mouseY - n.y
      return (Math.hypot(dx, dy) <= NEURON_RADIUS) 
    })
  }

  /**
   * Render all neurons and synapses to the workspace
   */
  renderNetwork() {
    // Clear canvas
    this.ctx.resetTransform()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.translate(this.viewX, this.viewY)
    this.ctx.scale(this.viewZoom, this.viewZoom)
    // TODO Render synapses

    // Render neurons
    this.neuronModel.neurons.forEach(n => {
      this.renderNeuron({
        x: n.x,
        y: n.y,
        inhibitory: false
      })
    })

    // Debug
    this.ctx.resetTransform()
    this.ctx.font = '16px monospace'
    this.ctx.fillStyle = '#555'
    this.ctx.fillText(`mouseX: ${this.state.mouseX}`, 10, 16)
    this.ctx.fillText(`mouseY: ${this.state.mouseY}`, 10, 32)
    this.ctx.fillText(`viewX: ${this.viewX}`, 10, 48)
    this.ctx.fillText(`viewY: ${this.viewY}`, 10, 64)
    this.ctx.fillText(`viewZoom: ${this.viewZoom}`, 10, 80)
    this.ctx.fillText(`hoverNeuron: ${this.state.hoverNeuron !== undefined}`, 10, 96)
    this.ctx.fillText(`hoverSynapse: ${this.state.hoverSynapse !== undefined}`, 10, 112)
  }


  /**
   * Draws a neuron to the workspace
   * @param {Object} params 
   */
  renderNeuron({ x, y, inhibitory }) {
    // Draw colored part
    this.ctx.fillStyle = inhibitory ? INHIBITORY_COLOR : EXCITATORY_COLOR
    this.ctx.beginPath()
    this.ctx.arc(x, y, NEURON_RADIUS, 0, Math.PI * 2)
    this.ctx.fill()

    // White inner ring
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.arc(x, y, NEURON_RADIUS * 0.55, 0, Math.PI * 2)
    this.ctx.stroke()
    this.ctx.lineWidth = 1
  }


  /**
   * User event handling
   * Throws an error if event type is unsupported
   * @param {String} event type of event
   * @param {Function} callback function to be called
   */
  on(event, callback) {
    switch (event) {
      case 'mousedown':
        this.mouseDownHandler = callback     
        break
      case 'mousemove':
        this.mouseMoveHandler = callback
        break
      case 'mouseup':
        this.mouseUpHandler = callback
        break
      default:
        throw new Error('Unsupported event type')
    }
  }
}