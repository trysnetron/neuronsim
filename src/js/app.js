import Network from './network'
import View from './view'

function startApp() {
  const canvas = document.querySelector('#workspace')
  const wrapper = document.querySelector('#workspace-wrapper')
  const topBanner = document.querySelector('#topbanner')
  const toolBanner = document.querySelector('#toolbanner')
  if (!canvas) throw Error('#workspace not found')
  if (!wrapper) throw Error('#workspace-wrapper not found')
  if (!topBanner) throw Error('#topbanner not found')
  if (!toolBanner) throw Error('#toolbanner not found')

  let mouseX = 0
  let mouseY = 0
  let viewX = 200
  let viewY = 200
  let viewZ = 1

  const stateStack = []

  const network = new Network()
  network.createNeuron({x: 100, y: 100})
  network.createNeuron({x: 200, y: 200})
  
  const view = new View(canvas, network)

  
  function render() {
    // Render neural network to workspace
    view.renderNetwork()

    requestAnimationFrame(render)
  }
  
  function updateWorkspaceSize() {
    const wrapperRect = wrapper.getBoundingClientRect()
    canvas.width = wrapperRect.width
    canvas.height = wrapperRect.height
  }

  function mouseMove(viewState) {   
    const activeState = stateStack[stateStack.length - 1]
    if (activeState) {
      switch (activeState.label) {
        case 'DRAGGING_NEURON':
          activeState.neuron.x = viewState.mouseX + activeState.offsetX
          activeState.neuron.y = viewState.mouseY + activeState.offsetY
          break
      }
    }
  }

  function mouseDown(viewState) {
    const activeState = stateStack[stateStack.length - 1]
    if (activeState) {
      switch (activeState.label) {
        default:   
      }
    } else {
      if (viewState.hoverNeuron) {
        // Start draggin neuron
        stateStack.push({
          label: 'DRAGGING_NEURON',
          offsetX: viewState.hoverNeuron.x - viewState.mouseX,
          offsetY: viewState.hoverNeuron.y - viewState.mouseY,
          neuron: viewState.hoverNeuron
        })
      }
    }
  }

  function mouseUp(viewState) {
    // State management
    const activeState = stateStack[stateStack.length - 1]
    if (activeState) {
      switch (activeState.label) {
        case 'DRAGGING_NEURON':
          stateStack.pop()
          break
      }
    }
  }

  window.addEventListener("resize", updateWorkspaceSize)

  view.on('mousemove', mouseMove)
  view.on('mousedown', mouseDown)
  view.on('mouseup', mouseUp)

  updateWorkspaceSize()
  render()
}

// Start everything
startApp()