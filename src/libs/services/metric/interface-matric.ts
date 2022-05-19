export default interface IMetricsCollectionService {
    init(namespace: string): Promise<any>;
    close(): Promise<any>;
    increment(name: string, value?: number): Promise<any>;
    decrement(name: string, value?: number): Promise<any>;
    counter(name: string, value: number): Promise<any>;
    set(name: string, value: number): Promise<any>;
    gauge(name: string, value: number): Promise<any>;
    gaugeDelta(name: string, value: number): Promise<any>;
    timing(name: string, timer: Date): Promise<any>;
    getLastValue(name: string): Promise<number>;
}