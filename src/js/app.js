
import Network from './network'

function startApp() {
  const canvas = document.querySelector('#workspace')
  const wrapper = document.querySelector('#workspace-wrapper')
  const topBanner = document.querySelector('#topbanner')
  const toolBanner = document.querySelector('#toolbanner')
  if (!canvas) throw Error('#workspace not found')
  if (!wrapper) throw Error('#workspace-wrapper not found')
  if (!topBanner) throw Error('#topbanner not found')
  if (!toolBanner) throw Error('#toolbanner not found')

  const ctx = canvas.getContext('2d')
  let mouseX = 0
  let mouseY = 0
  let viewX = 200
  let viewY = 200
  let viewZ = 1


  const stateStack = []

  const network = new Network()

  network.createNeuron({x: 100, y: 100})
  
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    network.render(ctx, viewX, viewY, viewZ)

    requestAnimationFrame(render)
  }
  
  function updateWorkspaceSize() {
    const wrapperRect = wrapper.getBoundingClientRect()
    canvas.width = wrapperRect.width
    canvas.height = wrapperRect.height
  }

  function mouseMove(event) {
    // Update mouse position
    {
      const bounding = canvas.getBoundingClientRect()
      mouseX = event.clientX - bounding.left
      mouseY = event.clientY - bounding.top

      topBanner.innerText = `${mouseX} ${mouseY}`
    }

    // State management
    const activeState = stateStack[stateStack.length - 1]
    if (activeState) {
      switch (activeState.label) {
        case 'DRAGGING_NEURON':
          const translated = network.toWorkspaceCoords(mouseX, mouseY, viewX, viewY, viewZ)
          activeState.neuron.x = translated.x + activeState.offsetX
          activeState.neuron.y = translated.y + activeState.offsetY
          break
      }
    }
  }

  function mouseDown(event) {
    // Selected neuron
    const selectedNeuron = network.overNeuron(mouseX, mouseY, viewX, viewY, viewZ)

    // State management
    const activeState = stateStack[stateStack.length - 1]
    if (activeState) {
      switch (activeState.label) {
        default:   
      }
    } else {
      if (selectedNeuron) {
        // Start draggin neuron
        const translated = network.toWorkspaceCoords(mouseX, mouseY, viewX, viewY, viewZ)
        stateStack.push({
          label: 'DRAGGING_NEURON',
          offsetX: selectedNeuron.x - translated.x,
          offsetY: selectedNeuron.y - translated.y,
          neuron: selectedNeuron
        })
      }
    }
  }

  function mouseUp(event) {
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

  canvas.addEventListener('mousemove', mouseMove)
  canvas.addEventListener('mousedown', mouseDown)
  canvas.addEventListener('mouseup', mouseUp)

  updateWorkspaceSize()
  render()
}

// Start everything
startApp()