import Listeners, { IDispatchable } from './listner'

const Dispatchable = <T extends IDispatchable>(target: T): T => {
  Listeners.push(target)
  return target
}

export default Dispatchable