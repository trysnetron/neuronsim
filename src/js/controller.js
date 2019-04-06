
/**
 * 
 * @param {Object} params
 */
export default function createController(etworkModel, workspaceView) {

  const stateStack = []

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

  workspaceView.on('mousemove', mouseMove)
  workspaceView.on('mousedown', mouseDown)
  workspaceView.on('mouseup', mouseUp)


  function renderWorkspace() {
    // Render neural network to workspace
    workspaceView.renderNetwork()

    requestAnimationFrame(renderWorkspace)
  }
  renderWorkspace()
}