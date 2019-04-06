import Network from './network'
import View from './view'
import StateStack from './statestack'

/**
 * Create new main controller
 * @param {View} workspaceView Workspace view
 * @param {Network} networkModel Neural network model
 */
export default function createController(networkModel, workspaceView) {

  let stateStack = new StateStack()

  function mouseMove(viewState) {   
    const activeState = stateStack.top()
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
    const activeState = stateStack.top()
    if (activeState) {
      switch (activeState.label) {
        case 'CREATE_NEURON':
          networkModel.createNeuron({
            x: viewState.mouseX, 
            y: viewState.mouseY
          })
          stateStack.pop()
          break
        default:    
      }
    } else {
      if (viewState.hoverNeuron) {
        // Start draggin neuron
        stateStack.push('DRAGGING_NEURON', {
          offsetX: viewState.hoverNeuron.x - viewState.mouseX,
          offsetY: viewState.hoverNeuron.y - viewState.mouseY,
          neuron: viewState.hoverNeuron
        })
      }
    }
  }

  function mouseUp(viewState) {
    // State management
    const activeState = stateStack.top()
    if (activeState) {
      switch (activeState.label) {
        case 'DRAGGING_NEURON':
          stateStack.pop()
          break
      }
    }
  }

  workspaceView.on('mousemove', mouseMove)
  workspaceView.on('mousedown', mouseDown)
  workspaceView.on('mouseup', mouseUp)

  document.addEventListener('keypress', event => {
    switch (event.key) {
      case '1':
        stateStack.flush()
        stateStack.push('CREATE_NEURON')
        console.log('CREATE_NEURON pushed to stack')
        break
    }
  })

  function renderWorkspace() {
    // Render neural network to workspace
    workspaceView.renderNetwork()

    requestAnimationFrame(renderWorkspace)
  }
  renderWorkspace()
}