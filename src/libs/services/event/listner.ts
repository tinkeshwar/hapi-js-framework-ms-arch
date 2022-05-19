export interface IEventDispatcher {
    on(...data: any[]): any;
    once(...data: any[]): any;
}

export interface IDispatchable {
    subscribe(dispatcher: IEventDispatcher): any;
}

const Listeners: IDispatchable[] = []

export default Listeners