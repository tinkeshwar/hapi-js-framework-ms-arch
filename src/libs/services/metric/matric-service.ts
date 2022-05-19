import IMetricsCollectionService from './interface-matric'
import LocalMetricsCollectionService from './matric-redis'

const MetricsCollectionService: IMetricsCollectionService = LocalMetricsCollectionService

export default MetricsCollectionService