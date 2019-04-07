import Network from './network'
import View from './view'
import createController from './controller'

const canvas = document.querySelector('#workspace')
const wrapper = document.querySelector('#workspace-wrapper')
const topBanner = document.querySelector('#topbanner')
const toolBanner = document.querySelector('#toolbanner')
if (!canvas) throw Error('#workspace not found')
if (!wrapper) throw Error('#workspace-wrapper not found')
if (!topBanner) throw Error('#topbanner not found')
if (!toolBanner) throw Error('#toolbanner not found')

function updateWorkspaceSize() {
  const wrapperRect = wrapper.getBoundingClientRect()
  canvas.width = wrapperRect.width
  canvas.height = wrapperRect.height
}
updateWorkspaceSize()
window.addEventListener("resize", updateWorkspaceSize)

const network = new Network()
network.createNeuron({x: 100, y: 100})
network.createNeuron({x: 200, y: 200})
  
const view = new View(canvas, network)

const controller = createController(network, view)

